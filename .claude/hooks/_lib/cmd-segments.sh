# shellcheck shell=bash
# hooks/_lib/cmd-segments.sh — shell-segment splitting for Bash-tier hooks.
#
# Background: hooks that gate `Bash` tool calls grep `.tool_input.command`
# for danger words (`rm -rf`, `git restore`, `pnpm install`, etc.). Pre-
# 0.15.0 every hook ran a single `grep -qE PATTERN "$cmd"` against the
# whole command string. That false-positives on heredoc bodies and
# commit messages where the trigger word appears inside content rather
# than as a command:
#
#   git commit -m "$(cat <<'EOF'
#   docs: explain why we don't run rm -rf node_modules in CI
#   EOF
#   )"
#
# The unanchored regex matches `rm -rf` inside the heredoc body and the
# hook blocks a perfectly safe commit. Hit during the 2026-05-03 session
# repeatedly — the pattern that motivated dependency-audit-gate's 0.15.0
# segment-split fix.
#
# This helper exposes two primitives every Bash-tier hook should use:
#
#   for_each_segment "$CMD" CALLBACK
#     Splits $CMD on shell command separators (`;`, `&&`, `||`, `|`,
#     newlines) and invokes CALLBACK with each segment as $1, plus the
#     leading-prefix-stripped form as $2 (with `sudo`/`exec`/`time`/
#     `then`/`do`/env-var-assignment prefixes removed). Returns 0 if
#     CALLBACK returned 0 for every segment, or the first non-zero
#     CALLBACK exit otherwise.
#
#   any_segment_matches "$CMD" PATTERN
#     Iterates segments and returns 0 if any segment's prefix-stripped
#     form matches PATTERN (a `grep -qiE` extended regex). Returns 1
#     if no segment matches.
#
# Quoting awareness: the splitter is NOT quote-aware. A separator inside
# a quoted string would be split. This is INTENTIONAL and SAFE: the
# segments-vs-callback contract is "find segments that anchor on a
# trigger word." Over-splitting produces extra segments that don't
# anchor; they're ignored. Under-splitting (treating a quoted separator
# as part of one segment) is what the original bug was. The trade-off
# explicitly accepts over-splitting.
#
# Quoting note for future maintainers: do not "fix" the over-splitting
# without breaking the security property. Quote-aware splitting in pure
# bash is a real lift; if needed it should move to a Node helper.

# Split $1 on shell command separators. Emits one segment per line on
# stdout (empty segments preserved). Used by both higher-level helpers
# below; not generally called by hooks directly.
_rea_split_segments() {
  local cmd="$1"
  # GNU sed and BSD sed both honor `s/PATTERN/\n/g` with `-E` for ERE.
  # We use printf+sed instead of bash IFS=$'...' read so the splitter
  # behaves identically across BSD and GNU sed.
  #
  # 0.16.0 codex P1 fix (helix-015 #3): the prior sed split on bare `|`
  # which broke bash's `>|` (noclobber-override redirect) into two
  # segments — `printf x >` then ` .rea/HALT`. The redirect detector
  # then never saw a complete `>|` operator and the bash-gate let the
  # write through.
  #
  # 0.16.0 codex P2-1 fix: the placeholder must NOT collide with any
  # legal byte the agent could supply. The earlier `\x01` (SOH) is a
  # legal UTF-8 byte and rare-but-possible in commands; if a payload
  # contained `\x01` literally, the third sed pass would manufacture
  # a `>|` operator that wasn't in the original — corrupting downstream
  # parsing in either fail-open or fail-closed directions depending on
  # what came after. The new sentinel `__REA_GTPIPE_a8f2c1__` is
  # multi-byte alphanumeric, impossible to collide with shell input
  # under any encoding we care about (any agent that intentionally
  # included this string would already be obviously trying to confuse
  # the splitter — and even then, the worst case is fail-closed).
  # 0.16.1 helix-016 P1 fix: also split on single `&` (background-process
  # operator). Pre-fix the splitter only broke on `&&|||;|`; a command like
  # `sleep 1 & git push --force` was treated as ONE segment whose first
  # token is `sleep`, and `any_segment_starts_with($CMD, 'git push')`
  # missed the force-push entirely. Add `&` to the separator set, but
  # AFTER `&&` is already swapped out so we don't break it apart.
  printf '%s\n' "$cmd" \
    | sed -E 's/>\|/__REA_GTPIPE_a8f2c1__/g' \
    | sed -E 's/&&/__REA_LOGAND_a8f2c1__/g' \
    | sed -E 's/(\|\||;|\||&)/\n/g' \
    | sed -E 's/__REA_LOGAND_a8f2c1__/\n/g' \
    | sed -E 's/__REA_GTPIPE_a8f2c1__/>|/g'
}

# Strip leading whitespace and well-known command prefixes from a single
# segment. Returns the prefix-stripped form on stdout. Examples:
#   "  sudo pnpm install foo"        → "pnpm install foo"
#   "NODE_ENV=production pnpm add x" → "pnpm add x"
#   "then pnpm add lodash"           → "pnpm add lodash"
_rea_strip_prefix() {
  local seg="$1"
  # Trim leading whitespace.
  seg="${seg#"${seg%%[![:space:]]*}"}"
  # Strip ONE prefix at a time, looping. This handles compounds like
  # `sudo NODE_ENV=production pnpm add foo`.
  while :; do
    case "$seg" in
      sudo[[:space:]]*|exec[[:space:]]*|time[[:space:]]*|then[[:space:]]*|do[[:space:]]*|else[[:space:]]*)
        # Drop the prefix word and any subsequent whitespace.
        seg="${seg#* }"
        seg="${seg#"${seg%%[![:space:]]*}"}"
        ;;
      *)
        # Env-var assignment prefix (`KEY=value `) — only strip if the
        # token before the first space looks like NAME=value.
        if [[ "$seg" =~ ^[A-Za-z_][A-Za-z0-9_]*=[^[:space:]]+[[:space:]]+ ]]; then
          seg="${seg#* }"
          seg="${seg#"${seg%%[![:space:]]*}"}"
        else
          break
        fi
        ;;
    esac
  done
  printf '%s' "$seg"
}

# Iterate every segment of $1 and invoke $2 (a function name) with the
# raw segment as $1 and the prefix-stripped form as $2. The callback's
# return value is honored: a non-zero return aborts the iteration and
# becomes the helper's return value.
for_each_segment() {
  local cmd="$1"
  local callback="$2"
  local segment stripped rc
  while IFS= read -r segment; do
    stripped=$(_rea_strip_prefix "$segment")
    "$callback" "$segment" "$stripped"
    rc=$?
    if [ "$rc" -ne 0 ]; then
      return "$rc"
    fi
  done < <(_rea_split_segments "$cmd")
  return 0
}

# Return 0 if any segment of $1 (after prefix-stripping) matches the
# extended regex $2 ANYWHERE (not anchored). Case-insensitive. Returns 1
# if no segment matches.
#
# Use this for patterns that may legitimately appear mid-segment, e.g.
# `Co-Authored-By:` in a commit message body. For "is the segment a
# call to <command>" use `any_segment_starts_with` instead — that
# anchors on the start so `echo "rm -rf foo"` doesn't trip an
# `rm -rf` detector.
any_segment_matches() {
  local cmd="$1"
  local pattern="$2"
  local segment stripped
  while IFS= read -r segment; do
    stripped=$(_rea_strip_prefix "$segment")
    if printf '%s' "$stripped" | grep -qiE "$pattern"; then
      return 0
    fi
  done < <(_rea_split_segments "$cmd")
  return 1
}

# Return 0 if any segment of $1 (RAW — no prefix-stripping) matches the
# extended regex $2. Use this for checks where the prefix itself IS the
# signal — e.g. H10's `HUSKY=0 git commit` detection (the prefix-stripper
# would strip the `HUSKY=0` before any_segment_matches sees it). Also
# right for H15 (`REA_BYPASS=...`) and H16 (alias/function defs).
#
# 0.16.1 helix-016 sibling fix: H10 baseline corpus regressed from
# 0.15.0 because it migrated to `any_segment_matches` which strips
# env-var prefixes. The check needs the raw segment to fire.
any_segment_raw_matches() {
  local cmd="$1"
  local pattern="$2"
  local segment
  while IFS= read -r segment; do
    # Trim leading whitespace for clean anchor matching, but otherwise
    # leave the segment intact (env-var assignments preserved).
    segment="${segment#"${segment%%[![:space:]]*}"}"
    if printf '%s' "$segment" | grep -qiE "$pattern"; then
      return 0
    fi
  done < <(_rea_split_segments "$cmd")
  return 1
}

# Return 0 if any segment of $1 (after prefix-stripping) STARTS WITH
# the extended regex $2. Case-insensitive. Returns 1 if no segment
# starts with the pattern.
#
# This is the right shape for "is this segment a call to <command>"
# checks. `echo "rm -rf foo"` does NOT trigger an `rm -rf` detector
# because the segment starts with `echo`, not `rm`. Compare to
# `any_segment_matches`, which matches anywhere in the segment and
# would fire on the echo'd argument.
any_segment_starts_with() {
  local cmd="$1"
  local pattern="$2"
  local segment stripped
  while IFS= read -r segment; do
    stripped=$(_rea_strip_prefix "$segment")
    # `^` anchor + caller pattern. `(?:)` non-capturing group not
    # supported in BSD ERE; we use a simple literal `^` prepend.
    if printf '%s' "$stripped" | grep -qiE "^${pattern}"; then
      return 0
    fi
  done < <(_rea_split_segments "$cmd")
  return 1
}
