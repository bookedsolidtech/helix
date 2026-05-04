#!/bin/bash
# PreToolUse hook: protected-paths-bash-gate.sh
# Fires BEFORE every Bash tool call.
# Refuses Bash commands that write to PROTECTED_PATTERNS via shell
# redirection or write-flag utilities — the kill-switch and policy
# files MUST be unreachable via any tool surface, including Bash.
#
# Pre-0.15.0, settings-protection.sh §6 protected `.rea/HALT`,
# `.rea/policy.yaml`, `.claude/settings.json`, `.husky/*` against
# Write/Edit/MultiEdit tool calls. But shell redirects bypassed it
# entirely:
#
#   printf '...' > .rea/HALT          # bypass — Bash matcher only
#   tee .rea/policy.yaml < new.yaml   # bypass
#   cp new-settings.json .claude/settings.json
#   sed -i '' '/foo/d' .husky/pre-push
#   dd of=.rea/HALT
#
# This hook closes that gap by detecting redirect/write patterns
# whose target matches the same `_lib/protected-paths.sh` allowlist.
#
# Exit codes:
#   0 = no protected-path write detected — allow
#   2 = protected-path write via Bash detected — block

set -uo pipefail

# shellcheck source=_lib/protected-paths.sh
source "$(dirname "$0")/_lib/protected-paths.sh"
# shellcheck source=_lib/path-normalize.sh
source "$(dirname "$0")/_lib/path-normalize.sh"
# shellcheck source=_lib/cmd-segments.sh
source "$(dirname "$0")/_lib/cmd-segments.sh"
# shellcheck source=_lib/interpreter-scanner.sh
source "$(dirname "$0")/_lib/interpreter-scanner.sh"

INPUT=$(cat)

if ! command -v jq >/dev/null 2>&1; then
  printf 'REA ERROR: jq is required but not installed.\n' >&2
  exit 2
fi

REA_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# HALT check — uniform with other hooks.
HALT_FILE="${REA_ROOT}/.rea/HALT"
if [ -f "$HALT_FILE" ]; then
  printf 'REA HALT: %s\nAll agent operations suspended. Run: rea unfreeze\n' \
    "$(head -c 1024 "$HALT_FILE" 2>/dev/null || echo 'Reason unknown')" >&2
  exit 2
fi

CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
if [[ -z "$CMD" ]]; then
  exit 0
fi

# Normalize a path token. 0.16.0 codex P1 fixes (helix Findings 015):
#   - resolve `..` segments via realpath when the path exists, OR reject
#     them outright when it doesn't (`.claude/hooks/../settings.json`
#     writes to `.claude/settings.json` but the literal-string match
#     missed it pre-fix)
#   - lowercase the result so case-insensitive matchers (macOS APFS,
#     `.ClAuDe/settings.json`) still match the canonical lowercase
#     pattern (`.claude/settings.json`)
#   - apply shared `_lib/path-normalize.sh::normalize_path` for backslash
#     translation + URL decode + leading-`./` strip
# shellcheck source=_lib/path-normalize.sh
source "$(dirname "$0")/_lib/path-normalize.sh"

_normalize_target() {
  local t="$1"
  # Strip matching surrounding quotes.
  if [[ "$t" =~ ^\"(.*)\"$ ]]; then t="${BASH_REMATCH[1]}"; fi
  if [[ "$t" =~ ^\'(.*)\'$ ]]; then t="${BASH_REMATCH[1]}"; fi
  # 0.21.2 helix-022 #5: fail closed on shell parameter/command
  # substitution in the target. `printf x > "$p"` (where p was set
  # earlier in the segment to `.rea/HALT`) bypassed the gate because
  # neither the logical nor resolved-form check matched the literal
  # string `$p`. We DO NOT try to resolve `$NAME=value` assignments
  # in the same segment — that's a partial-execution semantic this
  # static analyzer cannot guarantee. Refuse with a clear sentinel
  # so the caller emits the actionable error message.
  case "$t" in
    *'$'*|*'`'*)
      printf '__rea_unresolved_expansion__:%s' "$t"
      return 0
      ;;
  esac
  # If the path contains `..` segments, resolve them aggressively. We
  # cannot rely on `realpath` being installed; do a manual resolution
  # by walking segments. This is the helix-015 P1 fix: pre-fix, the
  # literal `.claude/hooks/../settings.json` did not match the
  # `.claude/settings.json` pattern even though the OS would resolve
  # the write to that target.
  case "/$t/" in
    */../*)
      # Build absolute then walk and normalize segments.
      # 0.16.0 codex P1-1 fix: use `read -ra` with IFS=/ instead of an
      # unquoted `for part in $abs` loop. The unquoted `for` was subject
      # to pathname expansion — `.claude/*/../settings.json` would glob
      # `*` against the agent's CWD, mangling the resolved path and
      # bypassing the protected-paths matcher. `read -ra` with an
      # explicit delimiter disables both word-splitting (via IFS) AND
      # pathname expansion (read does not glob).
      local abs="$t"
      [[ "$abs" != /* ]] && abs="$REA_ROOT/$abs"
      local -a raw_parts parts=()
      IFS='/' read -ra raw_parts <<<"$abs"
      for part in "${raw_parts[@]}"; do
        case "$part" in
          ''|.) continue ;;
          ..) [[ "${#parts[@]}" -gt 0 ]] && unset 'parts[${#parts[@]}-1]' ;;
          *) parts+=("$part") ;;
        esac
      done
      t="/$(IFS=/; printf '%s' "${parts[*]}")"
      # 0.16.0 codex P2-3 fix: if the resolved absolute path escapes
      # REA_ROOT, emit a sentinel so the caller refuses outright.
      # `exit 2` here would only exit the `$()` subshell, not the parent
      # hook process — sentinel + caller-side handling is the only
      # cross-shell-portable way.
      if [[ "$t" != "$REA_ROOT" && "$t" != "$REA_ROOT"/* ]]; then
        printf '__rea_outside_root__:%s' "$t"
        return 0
      fi
      ;;
  esac
  # Hand off to shared normalize_path (strips $REA_ROOT, URL-decodes,
  # translates `\` → `/`, strips leading `./`).
  t=$(normalize_path "$t")
  # Lowercase for case-insensitive matching (helix-015 P1 fix #2 —
  # macOS APFS allows `.ClAuDe/settings.json` to land on the same
  # file as `.claude/settings.json`, so the matcher must compare
  # lowercased forms).
  printf '%s' "$t" | tr '[:upper:]' '[:lower:]'
}

# 0.21.2 helix-022 #4: cp/mv destination extractor. Walks the segment
# token-by-token, skips flags (single-dash, double-dash, `--` end-of-
# options separator), returns the LAST positional argument — which is
# the destination per POSIX cp/mv semantic.
#
# Handles:
#   cp src dst           → dst
#   cp -f src dst        → dst
#   cp --force src dst   → dst
#   cp a b c dst         → dst (multi-source: last is destination)
#   cp -- -src dst       → dst (-- ends option processing)
#   cp -t dir src        → src is the source after -t flag (-t SOURCE_FIRST)
#                          but we don't try to follow -t semantics; we
#                          conservatively treat the LAST positional as
#                          the destination, which over-blocks `-t dir src`
#                          (destination becomes `src`) — the caller's
#                          rea_path_is_protected check then determines
#                          if that's actually protected. False-positive
#                          case is narrow.
#
# Flag-with-value awareness: short flag clusters that take a value
# (cp -t TARGET_DIR, mv -S SUFFIX, install -m MODE, etc.) consume the
# next token. Conservative heuristic: known short-options-with-values
# get the next token consumed.
_extract_cpmv_destination() {
  local segment="$1"
  local stripped="${segment#"${segment%%[![:space:]]*}"}"
  # Word-split on whitespace. `set --` is intentional; downstream
  # iteration consumes positional args.
  local positionals=()
  local found_cmd=""
  local end_of_options=0
  # shellcheck disable=SC2086
  set -- $stripped
  while [ "$#" -gt 0 ]; do
    local tok="$1"
    shift
    if [[ -z "$found_cmd" ]]; then
      case "$tok" in
        cp|mv) found_cmd="$tok" ;;
      esac
      continue
    fi
    if [[ "$end_of_options" -eq 1 ]]; then
      positionals+=("$tok")
      continue
    fi
    case "$tok" in
      --) end_of_options=1; continue ;;
      --*=*) continue ;;
      --*)
        # Long flags that take a value as the next token.
        case "$tok" in
          --target-directory|--reply|--suffix|--backup|--reflink|--strip-trailing-slashes)
            shift 2>/dev/null || true
            ;;
        esac
        continue
        ;;
      -*)
        # Short flag cluster. Check the LAST char — if it's a known
        # value-taking flag, consume the next token.
        case "$tok" in
          *-t|*-S|*-Z|*-T) shift 2>/dev/null || true ;;
        esac
        continue
        ;;
      *)
        positionals+=("$tok")
        ;;
    esac
  done
  if [[ ${#positionals[@]} -ge 2 ]]; then
    printf '%s' "${positionals[$((${#positionals[@]} - 1))]}"
  fi
}

# Refuse and exit 2 with a uniform error message.
_refuse() {
  local pattern="$1" target="$2" segment="$3"
  {
    printf 'PROTECTED PATH (bash): write to a package-managed file blocked\n'
    printf '\n'
    printf '  Pattern matched: %s\n' "$pattern"
    printf '  Resolved target: %s\n' "$target"
    printf '  Segment:         %s\n' "$segment"
    printf '\n'
    printf '  Rule: protected paths (kill-switch, policy.yaml, settings.json,\n'
    printf '        .husky/*) are unreachable via Bash redirects too — not just\n'
    printf '        Write/Edit/MultiEdit. To modify, a human must edit directly.\n'
  } >&2
  exit 2
}

# Inspect one segment for redirect / write patterns and refuse if the
# target matches any protected pattern.
_check_segment() {
  local _raw="$1" segment="$2"
  [[ -z "$segment" ]] && return 0

  local target_token=""
  local detected_form=""

  # bash `[[ =~ ]]` regex literals with `|` and `(...)` parsed inline
  # confuse some bash versions on macOS. Use named variables for each
  # pattern so the literal stays in a string context only.
  # 0.16.0 codex P1 fix (helix-015 #3): widened redirect regex. Pre-fix
  # only matched `>`, `>>`, `2>`, `2>>`, `&>`. Missed:
  #   - `1>` / `1>>` (explicit stdout fd)
  #   - `>|` (noclobber-override redirect)
  #   - `[0-9]+>` / `[0-9]+>>` (any fd prefix — `9>file`, `42>>file`)
  # All of these write to the target and bypassed the gate. The new
  # pattern accepts: optional fd-prefix, then `>` or `>>` or `>|`, with
  # optional `&` for stderr-merge variants.
  local re_redirect='(^|[[:space:]])(&>>|&>|[0-9]+>>|[0-9]+>\||[0-9]+>|>>|>\||>)[[:space:]]*([^[:space:]&|;<>]+)'
  # 0.21.2 helix-022 #4: cp/mv detection now uses an explicit argv-walk
  # (`_extract_cpmv_destination`) instead of regex-with-backtracking so
  # every shape is handled — `cp -f src dst`, multi-source `cp a b dst`,
  # `cp --no-clobber src dst`, `cp -- src dst`. The walker treats the
  # LAST positional as the destination (POSIX cp/mv semantic). The
  # sentinel `re_cpmv` regex below is retained ONLY as a cheap pre-screen
  # — it matches the command name to avoid running the walker on every
  # segment, but never returns the destination (the walker does).
  local re_cpmv_screen='(^|[[:space:]])(cp|mv)[[:space:]]+'
  local re_sed='(^|[[:space:]])sed[[:space:]]+(-[a-zA-Z]*i[a-zA-Z]*[^[:space:]]*)[[:space:]]+[^&|;<>]+[[:space:]]([^[:space:]&|;<>]+)[[:space:]]*$'
  local re_dd='(^|[[:space:]])dd[[:space:]]+[^&|;<>]*of=([^[:space:]&|;<>]+)'
  # 0.15.0 codex P1 fix: replaced the bash-3.2-broken `(...)*` pattern
  # for tee/truncate flag-skipping with a token-walk approach that
  # works across BSD bash 3.2 and GNU bash 4+. Walks every token after
  # the command, skips flags (single-dash short, double-dash long with
  # optional =value), returns the first non-flag token as the target.

  if [[ "$segment" =~ $re_redirect ]]; then
    target_token="${BASH_REMATCH[3]}"
    detected_form="redirect ${BASH_REMATCH[2]}"
  elif [[ "$segment" =~ $re_cpmv_screen ]]; then
    # 0.21.2 helix-022 #4: extract destination via argv-walk; LAST
    # positional is the destination per POSIX cp/mv semantic.
    local _cpmv_cmd="${BASH_REMATCH[2]}"
    target_token=$(_extract_cpmv_destination "$segment")
    detected_form="$_cpmv_cmd"
    if [[ -z "$target_token" ]]; then
      # No positional destination found — segment isn't actually a
      # valid cp/mv invocation. Fall through.
      :
    fi
  elif [[ "$segment" =~ $re_sed ]]; then
    target_token="${BASH_REMATCH[3]}"
    detected_form="sed -i"
  elif [[ "$segment" =~ $re_dd ]]; then
    target_token="${BASH_REMATCH[2]}"
    detected_form="dd of="
  else
    # tee / truncate / install / ln — token-walk for cross-bash safety.
    # Read tokens, find the command, then return the first non-flag arg.
    local prev_word="" found_cmd=""
    local _seg_for_walk="$segment"
    # Strip leading whitespace.
    _seg_for_walk="${_seg_for_walk#"${_seg_for_walk%%[![:space:]]*}"}"
    # shellcheck disable=SC2086
    set -- $_seg_for_walk
    while [ "$#" -gt 0 ]; do
      local tok="$1"
      shift
      if [[ -z "$found_cmd" ]]; then
        case "$tok" in
          tee|truncate|install|ln)
            found_cmd="$tok"
            ;;
        esac
        prev_word="$tok"
        continue
      fi
      # We're inside the command's argv. Skip flags.
      case "$tok" in
        --) continue ;;
        --*=*) continue ;;
        --*)
          # Long flag — may take a value as the NEXT token (we don't
          # know which long options take values). For safety, skip
          # only known no-value long flags; otherwise consume the
          # next token too if it looks like a value.
          case "$tok" in
            --append|--ignore-interrupts|--no-clobber|--force|--no-target-directory|--symbolic|--no-dereference|--reference=*) continue ;;
            *) shift 2>/dev/null || true; continue ;;
          esac
          ;;
        -*)
          # Short flag cluster. Skip. truncate -s SIZE — `-s` is a flag,
          # SIZE is its arg. We're conservative: skip the next token if
          # the flag cluster's last char is one of the size-bearing
          # flags (truncate -s, install -m, ln -t).
          case "$tok" in
            -s*|-m*|-o*|-g*|-t*) shift 2>/dev/null || true ;;
          esac
          continue
          ;;
        *)
          # First non-flag token — this is the target (or, for cp/mv-
          # like commands, the first source; the cpmv detector above
          # handles those separately). We treat ALL non-flag args as
          # potential targets and check each — that catches
          # `tee a b c` where any of a/b/c could be a protected file.
          target_token="$tok"
          detected_form="$found_cmd"
          # Check this token immediately; if not protected, keep
          # walking — there may be more positional args.
          local _t
          _t=$(_normalize_target "$target_token")
          # 0.16.0 codex P2-3: outside-REA_ROOT sentinel handling (logical).
          if [[ "$_t" == __rea_outside_root__:* ]]; then
            local resolved="${_t#__rea_outside_root__:}"
            {
              printf 'PROTECTED PATH (bash): path traversal escapes project root\n'
              printf '  Logical: %s\n  Resolved: %s\n' "$target_token" "$resolved"
            } >&2
            exit 2
          fi
          # 0.21.2 helix-022 #5: shell expansion in target — refuse.
          if [[ "$_t" == __rea_unresolved_expansion__:* ]]; then
            local raw="${_t#__rea_unresolved_expansion__:}"
            {
              printf 'PROTECTED PATH (bash): unresolved shell expansion in target\n'
              printf '  Token: %s\n  Segment: %s\n' "$raw" "$segment"
              printf '  Rule: $-substitution and `command-substitution` in redirect\n'
              printf '        targets are refused at static-analysis time. Resolve\n'
              printf '        the variable to a literal path before the redirect.\n'
            } >&2
            exit 2
          fi
          # 0.20.1 helix-021 #1: resolve intermediate symlinks via
          # `cd -P / pwd -P` parent-canonicalization (Write-tier parity).
          # `ln -s ../ .husky/pre-push.d/linkdir; printf x > .husky/pre-push.d/linkdir/pre-push`
          # had a logical form of `.husky/pre-push.d/linkdir/pre-push`
          # that didn't match any protected pattern; the resolved form
          # is `.husky/pre-push` which DOES match. Refuse on either.
          local _t_resolved
          _t_resolved=$(rea_resolved_relative_form "$target_token")
          if [[ "$_t_resolved" == __rea_outside_root__:* ]]; then
            local resolved="${_t_resolved#__rea_outside_root__:}"
            {
              printf 'PROTECTED PATH (bash): symlink resolves outside project root\n'
              printf '  Logical: %s\n  Resolved: %s\n' "$target_token" "$resolved"
            } >&2
            exit 2
          fi
          if rea_path_is_protected "$_t" \
             || ([[ -n "$_t_resolved" ]] && rea_path_is_protected "$_t_resolved"); then
            local matched=""
            local pattern_lc
            local hit_form="$_t"
            if [[ -n "$_t_resolved" ]] && rea_path_is_protected "$_t_resolved" \
               && ! rea_path_is_protected "$_t"; then
              hit_form="$_t_resolved"
            fi
            for pattern in "${REA_PROTECTED_PATTERNS[@]}"; do
              pattern_lc=$(printf '%s' "$pattern" | tr '[:upper:]' '[:lower:]')
              if [[ "$hit_form" == "$pattern_lc" ]]; then matched="$pattern"; break; fi
              if [[ "$pattern_lc" == */ && "$hit_form" == "$pattern_lc"* ]]; then matched="$pattern"; break; fi
            done
            _refuse "$matched" "$hit_form" "$segment"
          fi
          # Reset target_token so the post-loop check doesn't double-check.
          target_token=""
          ;;
      esac
    done
  fi

  # 0.21.2 helix-022 #2: when no shell-redirect target was found,
  # interpreter-scanner pass before returning. `node -e
  # "fs.writeFileSync('.rea/HALT','x')"` has NO redirect or cp/mv
  # token but still writes a protected path. Run the scanner on the
  # raw segment; refuse if any extracted target is protected.
  if [[ -z "$target_token" ]]; then
    _interpreter_scan_and_refuse_protected "$segment"
    return 0
  fi

  local target
  target=$(_normalize_target "$target_token")
  # 0.16.0 codex P2-3 fix: outside-REA_ROOT sentinel from _normalize_target.
  if [[ "$target" == __rea_outside_root__:* ]]; then
    local resolved="${target#__rea_outside_root__:}"
    {
      printf 'PROTECTED PATH (bash): path traversal escapes project root\n'
      printf '\n'
      printf '  Logical:  %s\n' "$target_token"
      printf '  Resolved: %s\n' "$resolved"
      printf '  Segment:  %s\n' "$segment"
      printf '\n'
      printf '  Rule: bash redirects whose target resolves outside REA_ROOT\n'
      printf '        are refused. Use a project-relative path without `..`\n'
      printf '        segments.\n'
    } >&2
    exit 2
  fi
  # 0.21.2 helix-022 #5: shell expansion in target — refuse.
  if [[ "$target" == __rea_unresolved_expansion__:* ]]; then
    local raw="${target#__rea_unresolved_expansion__:}"
    {
      printf 'PROTECTED PATH (bash): unresolved shell expansion in target\n'
      printf '\n'
      printf '  Token:   %s\n' "$raw"
      printf '  Segment: %s\n' "$segment"
      printf '\n'
      printf '  Rule: $-substitution and `command-substitution` in redirect\n'
      printf '        targets are refused at static-analysis time. Resolve\n'
      printf '        the variable to a literal path before the redirect.\n'
    } >&2
    exit 2
  fi
  # 0.20.1 helix-021 #1: resolve intermediate symlinks. See parallel
  # block in the multi-target loop above for the rationale.
  local target_resolved
  target_resolved=$(rea_resolved_relative_form "$target_token")
  if [[ "$target_resolved" == __rea_outside_root__:* ]]; then
    local resolved="${target_resolved#__rea_outside_root__:}"
    {
      printf 'PROTECTED PATH (bash): symlink resolves outside project root\n'
      printf '\n'
      printf '  Logical:  %s\n' "$target_token"
      printf '  Resolved: %s\n' "$resolved"
      printf '  Segment:  %s\n' "$segment"
    } >&2
    exit 2
  fi
  if rea_path_is_protected "$target" \
     || ([[ -n "$target_resolved" ]] && rea_path_is_protected "$target_resolved"); then
    # Find the matching pattern for the error message. Both `target`
    # and `pattern` lowercased to match `_normalize_target`'s case-
    # insensitive output (helix-015 P1 fix).
    local matched="" pattern_lc
    local hit_form="$target"
    if [[ -n "$target_resolved" ]] && rea_path_is_protected "$target_resolved" \
       && ! rea_path_is_protected "$target"; then
      hit_form="$target_resolved"
    fi
    for pattern in "${REA_PROTECTED_PATTERNS[@]}"; do
      pattern_lc=$(printf '%s' "$pattern" | tr '[:upper:]' '[:lower:]')
      if [[ "$hit_form" == "$pattern_lc" ]]; then matched="$pattern"; break; fi
      if [[ "$pattern_lc" == */ && "$hit_form" == "$pattern_lc"* ]]; then matched="$pattern"; break; fi
    done
    _refuse "$matched" "$hit_form" "$segment"
  fi

  # 0.21.2 helix-022 #2: interpreter-scanner pass even when a
  # shell-redirect target was already found. A single segment can
  # have BOTH a shell redirect AND a node -e fs.write*; both must
  # be checked.
  _interpreter_scan_and_refuse_protected "$segment"

  return 0
}

# 0.21.2 helix-022 #2: interpreter-scanner pass. Catches
# `node -e "fs.writeFileSync('.rea/HALT','x')"` and equivalents in
# python/ruby/perl. The blocked-paths sibling has had this since
# 0.16.3 F3; this is parity. Each extracted target runs through
# `_normalize_target` + `rea_path_is_protected` so the existing
# logical-form + symlink-resolved-form checks both apply.
_interpreter_scan_and_refuse_protected() {
  local segment="$1"
  local _interp_targets
  _interp_targets=$(rea_interpreter_write_targets "$segment")
  [[ -z "$_interp_targets" ]] && return 0
  while IFS= read -r _interp_t; do
    [[ -z "$_interp_t" ]] && continue
    local _norm
    _norm=$(_normalize_target "$_interp_t")
    if [[ "$_norm" == __rea_outside_root__:* || "$_norm" == __rea_unresolved_expansion__:* ]]; then
      continue
    fi
    local _norm_resolved
    _norm_resolved=$(rea_resolved_relative_form "$_interp_t")
    if rea_path_is_protected "$_norm" \
       || ([[ -n "$_norm_resolved" && "$_norm_resolved" != __rea_outside_root__:* ]] \
          && rea_path_is_protected "$_norm_resolved"); then
      local matched_interp="" pattern_lc
      local hit_form="$_norm"
      if [[ -n "$_norm_resolved" ]] && rea_path_is_protected "$_norm_resolved" \
         && ! rea_path_is_protected "$_norm"; then
        hit_form="$_norm_resolved"
      fi
      for pattern in "${REA_PROTECTED_PATTERNS[@]}"; do
        pattern_lc=$(printf '%s' "$pattern" | tr '[:upper:]' '[:lower:]')
        if [[ "$hit_form" == "$pattern_lc" ]]; then matched_interp="$pattern"; break; fi
        if [[ "$pattern_lc" == */ && "$hit_form" == "$pattern_lc"* ]]; then matched_interp="$pattern"; break; fi
      done
      _refuse "$matched_interp" "$hit_form" "$segment"
    fi
  done <<<"$_interp_targets"
}

for_each_segment "$CMD" _check_segment

exit 0
