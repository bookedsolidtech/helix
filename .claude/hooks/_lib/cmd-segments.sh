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
# 0.18.0 helix-020 G1.A fix: the unwrap pass scans a QUOTE-MASKED form
# of the input, not the raw input. Pre-fix, a quoted argument that
# MENTIONED a wrapper (e.g. `git commit -m "docs: mention bash -c 'npm
# install left-pad'"`) would emit a phantom inner-payload segment, and
# `dependency-audit-gate.sh` would block the innocent commit. The
# quote-mask layer (the same one `_rea_split_segments` uses) replaces
# all in-quote separators AND in-quote single/double quote characters
# with multi-byte sentinels — so the wrapper regex can no longer match
# inside an outer quoted span. The unwrapped payload itself is still
# emitted from the un-masked input by recomputing offsets back to the
# raw string, so escape semantics inside legitimate wrappers stay
# correct. We only need the mask to suppress matching; the captured
# payload is read off the original string.
#
# 0.21.2 helix-022 #3: recurse to fixed point with depth bound 8.
# Pre-fix the function did exactly ONE level of unwrap, so
# `bash -lc "bash -lc 'printf x > .rea/HALT'"` emitted the
# middle wrapper as a segment but NEVER the inner `printf x > ...`.
# Now each extracted payload is re-fed through the unwrap until
# either no payload is found (fixed point) or depth 8 is reached.
# Depth limit prevents pathological inputs; on overflow the helper
# emits a stderr advisory but does not refuse — caller falls back
# to logical-form-only enforcement of the partial unwrap.
_rea_unwrap_nested_shells() {
  _rea_unwrap_at_depth "$1" 0
}

_rea_unwrap_at_depth() {
  local cmd="$1"
  local depth="$2"
  local max_depth=8
  printf '%s\n' "$cmd"
  if [[ $depth -ge $max_depth ]]; then
    printf 'rea: nested-shell unwrap depth limit (%d) reached on payload %.80s...\n' \
      "$max_depth" "$cmd" >&2
    return 0
  fi
  # Build a mask where in-quote `"` `'` `;` `&` `|` characters are
  # replaced with multi-byte sentinels so the wrapper regex below
  # cannot match wrapper syntax that lives inside outer quoted prose.
  # We also mask the in-quote QUOTE characters themselves so the awk
  # body's quote-state heuristic (which looks at the byte immediately
  # after the matched wrapper-prefix region) cannot mistake an inner
  # quote for a payload-opening quote. Sentinel bytes are aligned to
  # be the same width as their original character (single-byte) so
  # offsets into the raw string remain valid for payload extraction.
  #
  # Approach: rather than synthesize a per-byte sentinel of width 1,
  # we run the awk wrapper-scan against a SEPARATE masked stream and
  # then translate matched RSTART/RLENGTH offsets back to the original
  # string. We do that by passing both strings into awk (raw via stdin,
  # masked via -v MASKED) and tracking the same index across both —
  # since the mask substitutes single bytes with single bytes only
  # (placeholder bytes drawn from the C0 control-character range) the
  # offsets line up.
  #
  # Placeholder bytes — chosen from the C0 control range so they
  # cannot appear in real shell input under UTF-8 (NUL, BEL, VT, FF
  # are reserved by some shells; we use SOH/STX/ETX/ENQ/ACK which are
  # not assigned operational meaning by any shell we ship with).
  #   \x01 SOH — replaces in-quote `"`
  #   \x02 STX — replaces in-quote `'`
  #   \x03 ETX — replaces in-quote `;`
  #   \x05 ENQ — replaces in-quote `&`
  #   \x06 ACK — replaces in-quote `|`
  local masked
  masked=$(printf '%s' "$cmd" | awk '
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
          if (ch == "'\''") { mode = 0; out = out "\002"; i++; continue }
          if (ch == ";") { out = out "\003"; i++; continue }
          if (ch == "&") { out = out "\005"; i++; continue }
          if (ch == "|") { out = out "\006"; i++; continue }
          if (ch == "\"") { out = out "\001"; i++; continue }
          out = out ch
          i++
          continue
        }
        # mode == 1 (double-quoted)
        if (ch == "\\" && i < n) {
          # Preserve the escape pair literally — width preserved.
          nxt = substr(line, i + 1, 1)
          out = out ch nxt
          i += 2
          continue
        }
        if (ch == "\"") { mode = 0; out = out "\001"; i++; continue }
        if (ch == ";") { out = out "\003"; i++; continue }
        if (ch == "&") { out = out "\005"; i++; continue }
        if (ch == "|") { out = out "\006"; i++; continue }
        if (ch == "'\''") { out = out "\002"; i++; continue }
        out = out ch
        i++
      }
      printf "%s", out
    }')
  # Pass both raw and masked into awk. Wrapper-regex matches against the
  # masked form; payload extraction reads the raw form using the same
  # offsets. Because the mask is byte-for-byte width-preserving, the
  # same RSTART/RLENGTH applies to both.
  #
  # 0.21.2: capture payloads to a local var; iterate to recurse.
  local _unwrap_payloads
  _unwrap_payloads=$(printf '' | awk -v raw="$cmd" -v masked="$masked" '
    BEGIN {
      # Wrapper-prefix regex: shell-name + optional flag tokens + -c-style flag.
      # Each flag token is `-` followed by 1+ letters and trailing space.
      # NOTE: matches only OUTSIDE outer quoted spans because in-quote
      # `"`, `'\''`, `;`, `&`, `|` are masked out in `masked`. The leading
      # alternation `(^|[[:space:]&|;])` therefore cannot anchor on a
      # masked separator, and the shell-name token itself can no longer
      # appear adjacent to a masked quote-introducer.
      # 0.19.0 security review M1: extend the shell-name set to cover
      # every commonly-installed POSIX-style shell. mksh / oksh / yash /
      # posh ship on minimal containers, csh/tcsh on legacy macOS,
      # fish on dev workstations. Each accepts -c with a quoted body.
      # NOTE: pwsh (PowerShell) uses -Command / -EncodedCommand and is
      # NOT covered here. Adding pwsh requires a separate code path
      # because EncodedCommand base64-decodes at runtime.
      WRAP = "(^|[[:space:]&|;])(bash|sh|zsh|dash|ksh|mksh|oksh|posh|yash|csh|tcsh|fish)([[:space:]]+-[a-zA-Z]+)*[[:space:]]+-(c|lc|lic|ic|cl|cli|li|il)[[:space:]]+"
      # Track the cursor in BOTH raw and masked. Because the mask is
      # byte-for-byte width-preserving, the same RSTART/RLENGTH applies
      # to both — but each iteration of the loop must SLICE both strings
      # by the same amount so subsequent matches see synchronized tails.
      mrest = masked
      rrest = raw
      while (length(mrest) > 0) {
        if (! match(mrest, WRAP)) break
        # Tail begins immediately after the matched wrapper prefix in
        # BOTH strings (offsets line up — mask is width-preserving).
        mtail = substr(mrest, RSTART + RLENGTH)
        rtail = substr(rrest, RSTART + RLENGTH)
        # The wrapper-payload-introducing quote must be a REAL outer
        # quote — i.e. not a masked in-quote sentinel. Probe the raw
        # form for the introducer character, which the mask preserved
        # verbatim only when it was an outer quote.
        first = substr(rtail, 1, 1)
        mfirst = substr(mtail, 1, 1)
        if (first == "'\''" && mfirst == "'\''") {
          # Single-quoted body: no escape semantics; runs to next `'\''`.
          body = substr(rtail, 2)
          mbody = substr(mtail, 2)
          end = index(body, "'\''")
          if (end == 0) {
            mrest = substr(mtail, 2)
            rrest = substr(rtail, 2)
            continue
          }
          payload = substr(body, 1, end - 1)
          print payload
          mrest = substr(mbody, end + 1)
          rrest = substr(body, end + 1)
          continue
        }
        if (first == "\"" && mfirst == "\"") {
          # Double-quoted body: \" and \\ are literal escapes.
          body = substr(rtail, 2)
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
          if (closed == 0) {
            mrest = substr(mtail, 2)
            rrest = substr(rtail, 2)
            continue
          }
          print out
          # Skip past the opening `"` (1 byte) AND the closing `"` (1
          # byte at body[closed], i.e. mtail[closed+1]). Cursor lands
          # at mtail[closed+2].
          mrest = substr(mtail, closed + 2)
          rrest = substr(rtail, closed + 2)
          continue
        }
        # Non-quoted argument — proceed past the matched prefix only.
        mrest = mtail
        rrest = rtail
      }
    }
    # Empty action with no input rules — explicitly drive the loop from
    # END so awk does not require any input records.
    END {}')
  # Recurse on each extracted payload with depth+1.
  if [[ -n "$_unwrap_payloads" ]]; then
    while IFS= read -r _unwrap_p; do
      [[ -z "$_unwrap_p" ]] && continue
      _rea_unwrap_at_depth "$_unwrap_p" $((depth + 1))
    done <<< "$_unwrap_payloads"
  fi
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
