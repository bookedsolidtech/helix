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
  local re_cpmv='(^|[[:space:]])(cp|mv)[[:space:]]+[^&|;<>]+[[:space:]]([^[:space:]&|;<>]+)[[:space:]]*$'
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
  elif [[ "$segment" =~ $re_cpmv ]]; then
    target_token="${BASH_REMATCH[3]}"
    detected_form="${BASH_REMATCH[2]}"
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

  if [[ -z "$target_token" ]]; then
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
  return 0
}

for_each_segment "$CMD" _check_segment

exit 0
