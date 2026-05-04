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
# Quoting awareness (0.16.3 helix-016.1 #2 fix): the splitter masks
# shell separators that occur INSIDE matched `"..."` and `'...'` quote
# spans before splitting. Earlier versions split on every unescaped
# `&`/`;`/`|`/newline regardless of quote context, which produced
# false-positive segment boundaries inside quoted prose:
#
#   echo "release note & git push --force now"
#
# The pre-fix splitter broke that into two segments and the H1 force-push
# detector anchored on `git push --force` at the head of segment 2 — a
# real false positive helix reproduced spontaneously during diagnostic
# work. The fix walks the input once, replaces in-quote separators with
# multi-byte sentinels (impossible-to-collide forms), splits on the
# remaining un-quoted separators, then restores the sentinels back to
# their literal characters in the surviving segments. Single-quoted spans
# do NOT honor `\` escapes; double-quoted spans treat `\"` as a literal
# `"` and skip past it.

# Unwrap nested shell wrappers — `bash -c 'PAYLOAD'`, `sh -lc "PAYLOAD"`,
# `zsh -ic 'PAYLOAD'`, etc. Emits the input string AS-IS plus each inner
# PAYLOAD as a separate line. Pre-0.17.0 the splitter never parsed
# inside wrapped quotes, so `bash -c 'git push --force'` produced a
# single segment whose first token was `bash` — defeating every check
# that uses `any_segment_starts_with`. This helper makes the inner
# payload visible as its own segment, so every existing detection rule
# fires uniformly on wrapped and unwrapped commands.
#
# Closes helix-017 #1, #2, #3 (0.16.2):
#   - `bash -lc 'git push --force origin HEAD'`  → payload now seen by H1
#   - `bash -c 'printf x > .rea/HALT'`           → payload now seen by bash-gate
#   - `bash -lc 'npm install some-package'`      → payload now seen by audit-gate
#
# Recognized wrapper shape (case-insensitive shell name):
#   (bash|sh|zsh|dash|ksh) [optional -flags...] (-c|-lc|-lic|-ic|-cl|-cli) (QUOTED_ARG)
#
# QUOTED_ARG can be single- or double-quoted. Single-quote bodies have no
# escape semantics. Double-quote bodies treat \" and \\ as literal
# escapes (per POSIX). Multiple wrappers per command-line are handled
# (e.g. `foo; bash -c 'bar' && sh -c 'baz'` emits both `bar` and `baz`).
#
# Limitation: ONE level of unwrapping. A wrapper inside a wrapper
# (`bash -c "bash -c 'innermost'"`) emits only the second-level payload
# (`bash -c 'innermost'`), not the third-level. This is enough for
# every consumer-reported bypass; deeper nesting can be added later
# without changing the contract.
_rea_unwrap_nested_shells() {
  local cmd="$1"
  printf '%s\n' "$cmd"
  printf '%s' "$cmd" | awk '
    BEGIN {
      # Wrapper-prefix regex: shell-name + optional flag tokens + -c-style flag.
      # Each flag token is `-` followed by 1+ letters and trailing space.
      WRAP = "(^|[[:space:]&|;])(bash|sh|zsh|dash|ksh)([[:space:]]+-[a-zA-Z]+)*[[:space:]]+-(c|lc|lic|ic|cl|cli|li|il)[[:space:]]+"
    }
    {
      rest = $0
      while (length(rest) > 0) {
        if (! match(rest, WRAP)) break
        # Tail begins immediately after the matched wrapper prefix.
        tail = substr(rest, RSTART + RLENGTH)
        first = substr(tail, 1, 1)
        if (first == "'\''") {
          # Single-quoted body: no escape semantics; runs to next `'"'"'`.
          body = substr(tail, 2)
          end = index(body, "'\''")
          if (end == 0) { rest = substr(tail, 2); continue }
          payload = substr(body, 1, end - 1)
          print payload
          rest = substr(body, end + 1)
          continue
        }
        if (first == "\"") {
          # Double-quoted body: \" and \\ are literal escapes.
          body = substr(tail, 2)
          n = length(body)
          j = 1
          out = ""
          closed = 0
          while (j <= n) {
            c = substr(body, j, 1)
            if (c == "\\" && j < n) {
              nxt = substr(body, j + 1, 1)
              if (nxt == "\"" || nxt == "\\") { out = out nxt; j += 2; continue }
              out = out c nxt
              j += 2
              continue
            }
            if (c == "\"") { closed = j; break }
            out = out c
            j++
          }
          if (closed == 0) { rest = substr(tail, 2); continue }
          print out
          rest = substr(body, closed + 1)
          continue
        }
        # Non-quoted argument — proceed past the matched prefix only.
        rest = tail
      }
    }'
}

# Split $1 on shell command separators. Emits one segment per line on
# stdout (empty segments preserved). Used by both higher-level helpers
# below; not generally called by hooks directly.
_rea_split_segments() {
  local cmd="$1"
  # GNU sed and BSD sed both honor `s/PATTERN/\n/g` with `-E` for ERE.
  # We use printf+sed instead of bash IFS=$'...' read so the splitter
  # behaves identically across BSD and GNU sed.
  #
  # Pipeline overview (post-0.16.3 quote-mask):
  #   1. awk one-pass mask: replace `;` `&` `|` `\n` INSIDE matched
  #      `"..."` / `'...'` spans with multi-byte sentinels so the
  #      separator-splitting passes below ignore them. Single-quoted
  #      spans have no escape semantics; double-quoted spans treat
  #      `\"` as a literal quote and continue inside the span.
  #   2. existing `>|` swap (preserves the bash noclobber-override
  #      operator across the splitting passes).
  #   3. existing `&&` swap (so step 4 doesn't break compound `&&`
  #      operators apart while still splitting on bare `&`).
  #   4. sed split on `||`, `;`, bare `|`, bare `&`.
  #   5. unswap `&&` / `>|` placeholders.
  #   6. restore the in-quote sentinels back to literal chars so each
  #      surviving segment sees its quoted prose intact (downstream
  #      hooks regex against the segments and need the literal bytes).
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
  # 0.16.3 helix-016.1 #2 fix: quote-mask in-quote separators before
  # splitting so quoted prose no longer over-splits and anchors trigger
  # words at the head of phantom segments. See header comment for the
  # full rationale.
  #
  # 0.17.0 helix-017 #1-#3 fix: unwrap `bash -c 'PAYLOAD'` style
  # wrappers BEFORE the quote-mask + split passes. The unwrap step
  # emits the original line plus each inner PAYLOAD as separate
  # records; the existing pipeline then quote-masks and splits each
  # record independently. Inner payload anchors trigger words for the
  # `any_segment_*` checks downstream.
  _rea_unwrap_nested_shells "$cmd" \
    | awk '
        BEGIN {
          SC  = "__REA_SEP_SC_a8f2c1__"
          AMP = "__REA_SEP_AMP_a8f2c1__"
          PIPE = "__REA_SEP_PIPE_a8f2c1__"
          NL  = "__REA_SEP_NL_a8f2c1__"
        }
        {
          line = $0
          out = ""
          i = 1
          n = length(line)
          mode = 0  # 0=plain, 1=double, 2=single
          while (i <= n) {
            ch = substr(line, i, 1)
            if (mode == 0) {
              if (ch == "\"") { mode = 1; out = out ch; i++; continue }
              if (ch == "'\''") { mode = 2; out = out ch; i++; continue }
              out = out ch
              i++
              continue
            }
            if (mode == 2) {
              # Single quotes: no escape semantics. Only `'\''` ends.
              if (ch == "'\''") { mode = 0; out = out ch; i++; continue }
              if (ch == ";")    { out = out SC;   i++; continue }
              if (ch == "&")    { out = out AMP;  i++; continue }
              if (ch == "|")    { out = out PIPE; i++; continue }
              # awk record-mode: literal newlines inside single-quoted
              # heredoc bodies arrive as separate records; mask is
              # per-record so they remain separators across records by
              # design (the original splitter behavior).
              out = out ch
              i++
              continue
            }
            # mode == 1 (double-quoted)
            if (ch == "\\" && i < n) {
              # Preserve `\"` and `\\` escape sequences literally; do not
              # exit the double-quoted span on the escaped quote.
              nxt = substr(line, i + 1, 1)
              out = out ch nxt
              i += 2
              continue
            }
            if (ch == "\"") { mode = 0; out = out ch; i++; continue }
            if (ch == ";")  { out = out SC;   i++; continue }
            if (ch == "&")  { out = out AMP;  i++; continue }
            if (ch == "|")  { out = out PIPE; i++; continue }
            out = out ch
            i++
          }
          print out
        }' \
    | sed -E 's/>\|/__REA_GTPIPE_a8f2c1__/g' \
    | sed -E 's/&&/__REA_LOGAND_a8f2c1__/g' \
    | sed -E 's/(\|\||;|\||&)/\n/g' \
    | sed -E 's/__REA_LOGAND_a8f2c1__/\n/g' \
    | sed -E 's/__REA_GTPIPE_a8f2c1__/>|/g' \
    | sed -E 's/__REA_SEP_SC_a8f2c1__/;/g; s/__REA_SEP_AMP_a8f2c1__/\&/g; s/__REA_SEP_PIPE_a8f2c1__/|/g; s/__REA_SEP_NL_a8f2c1__/\n/g'
}

# Apply only the quote-mask preprocessing pass. Returns the input with
# in-quote `;`/`&`/`|`/newline replaced by sentinels but WITHOUT splitting
# on the un-masked operators. Useful for multi-segment-property checks
# (H12 curl-pipe-shell) that need to scan the whole command-line as one
# string while still ignoring in-quote prose. Restores quoted-content
# pipe to a placeholder (`__REA_INQUOTE_PIPE__`) so a regex against the
# masked output can match a real `|` token without false-positiving on
# in-quote `|` characters.
quote_masked_cmd() {
  local cmd="$1"
  printf '%s' "$cmd" \
    | awk '
        BEGIN {
          INQ_PIPE = "__REA_INQUOTE_PIPE_a8f2c1__"
          INQ_SC   = "__REA_INQUOTE_SC_a8f2c1__"
          INQ_AMP  = "__REA_INQUOTE_AMP_a8f2c1__"
        }
        {
          line = $0
          out = ""
          i = 1
          n = length(line)
          mode = 0
          while (i <= n) {
            ch = substr(line, i, 1)
            if (mode == 0) {
              if (ch == "\"") { mode = 1; out = out ch; i++; continue }
              if (ch == "'\''") { mode = 2; out = out ch; i++; continue }
              out = out ch
              i++
              continue
            }
            if (mode == 2) {
              if (ch == "'\''") { mode = 0; out = out ch; i++; continue }
              if (ch == "|") { out = out INQ_PIPE; i++; continue }
              if (ch == ";") { out = out INQ_SC;   i++; continue }
              if (ch == "&") { out = out INQ_AMP;  i++; continue }
              out = out ch
              i++
              continue
            }
            if (ch == "\\" && i < n) {
              out = out ch substr(line, i + 1, 1)
              i += 2
              continue
            }
            if (ch == "\"") { mode = 0; out = out ch; i++; continue }
            if (ch == "|") { out = out INQ_PIPE; i++; continue }
            if (ch == ";") { out = out INQ_SC;   i++; continue }
            if (ch == "&") { out = out INQ_AMP;  i++; continue }
            out = out ch
            i++
          }
          # awk auto-appends a newline on `print`; strip it so the
          # caller gets exactly what was passed in.
          printf "%s", out
        }'
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

# Return 0 if any single segment of $1 (after prefix-stripping) matches
# BOTH extended regex $2 AND extended regex $3. Case-insensitive. Returns
# 1 if no single segment matches both patterns.
#
# Use this when two patterns must co-occur within the SAME shell command
# segment to constitute a detection — e.g. env-file-protection's
# "utility + .env-filename" rule. Pre-fix env-file-protection used two
# independent `any_segment_matches` calls and OR-combined the booleans,
# which mis-fires across multi-segment constructions like
# `echo "log: cat is broken" ; touch foo.env` (utility in segment 1,
# .env name in segment 2 — both flags set, false-positive block).
#
# 0.16.2 helix-017 P2 #2 fix.
any_segment_matches_both() {
  local cmd="$1"
  local pattern_a="$2"
  local pattern_b="$3"
  local segment stripped
  while IFS= read -r segment; do
    stripped=$(_rea_strip_prefix "$segment")
    if printf '%s' "$stripped" | grep -qiE "$pattern_a" \
       && printf '%s' "$stripped" | grep -qiE "$pattern_b"; then
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
