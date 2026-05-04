#!/bin/bash
# PreToolUse hook: blocked-paths-bash-gate.sh
# Fires BEFORE every Bash tool call.
# Refuses Bash commands that write to entries in policy.yaml's
# `blocked_paths` list via shell redirection or write-flag utilities.
#
# Background (0.16.3, discord-ops Round 9 #1): the existing
# blocked-paths-enforcer.sh only fires on Write/Edit/MultiEdit/
# NotebookEdit. Bash-tier writes to blocked_paths entries bypass it
# entirely:
#
#   echo x > .env
#   cp src.txt .env
#   sed -i '' '1d' .env.production
#   node -e "fs.writeFileSync('.env','x')"
#
# `protected-paths-bash-gate.sh` covers the HARD list (HALT, policy.yaml,
# settings.json, .husky/*) — but the soft, runtime-configurable
# `blocked_paths` list never had a Bash-tier counterpart. discord-ops
# independently caught this gap during their cycle 9 audit.
#
# This hook closes the gap by reading the same `blocked_paths` list that
# blocked-paths-enforcer.sh reads, applying the same redirect / write-
# utility detection pipeline as protected-paths-bash-gate.sh, and
# blocking when the resolved target matches any entry.
#
# Exit codes:
#   0 = no blocked-path write detected — allow
#   2 = blocked-path write via Bash detected — block
#
# Detection: `node -e "fs.writeFileSync('.env','x')"` — Node's
# fs.writeFileSync called against a blocked path is also detected by
# argument scan. Other interpreter constructions (perl, python, etc.)
# remain a known coverage gap for the same reason the env-file-protection
# hook lists hard caps in its header comment: defense-in-depth, not an
# adversarial firewall.

set -uo pipefail

# shellcheck source=_lib/cmd-segments.sh
source "$(dirname "$0")/_lib/cmd-segments.sh"
# shellcheck source=_lib/path-normalize.sh
source "$(dirname "$0")/_lib/path-normalize.sh"
# shellcheck source=_lib/policy-read.sh
source "$(dirname "$0")/_lib/policy-read.sh"
# shellcheck source=_lib/halt-check.sh
source "$(dirname "$0")/_lib/halt-check.sh"

INPUT=$(cat)

if ! command -v jq >/dev/null 2>&1; then
  printf 'REA ERROR: jq is required but not installed.\n' >&2
  exit 2
fi

check_halt
REA_ROOT=$(rea_root)

CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
if [[ -z "$CMD" ]]; then
  exit 0
fi

# Load blocked_paths list. If the policy is missing or the list is empty,
# this hook is a no-op (matches blocked-paths-enforcer.sh semantics).
BLOCKED_PATHS=()
while IFS= read -r entry; do
  [[ -z "$entry" ]] && continue
  BLOCKED_PATHS+=("$entry")
done < <(policy_list "blocked_paths")

if [[ ${#BLOCKED_PATHS[@]} -eq 0 ]]; then
  exit 0
fi

# Match a normalized project-relative path against the loaded
# blocked_paths list using the same matching rules as
# blocked-paths-enforcer.sh:
#   - directory match (entry ends with `/`) → prefix match
#   - glob entry (contains `*`) → ERE conversion + anchored match
#   - otherwise → exact (case-insensitive) match
# Returns 0 + sets MATCHED on hit, 1 on no hit.
MATCHED=""
_match_blocked() {
  local target_lc="$1"
  MATCHED=""
  local entry entry_lc regex
  for entry in "${BLOCKED_PATHS[@]}"; do
    entry_lc=$(printf '%s' "$entry" | tr '[:upper:]' '[:lower:]')
    if [[ "$entry_lc" == */ ]]; then
      if [[ "$target_lc" == "$entry_lc"* ]] || [[ "$target_lc" == "${entry_lc%/}" ]]; then
        MATCHED="$entry"
        return 0
      fi
      continue
    fi
    if [[ "$entry" == *'*'* ]]; then
      regex=$(printf '%s' "$entry_lc" | sed 's/\./\\./g; s/\*/.*/g')
      if printf '%s' "$target_lc" | grep -qE "^${regex}$"; then
        MATCHED="$entry"
        return 0
      fi
      continue
    fi
    if [[ "$target_lc" == "$entry_lc" ]]; then
      MATCHED="$entry"
      return 0
    fi
  done
  return 1
}

# Normalize a path token and apply the same `..` walk + outside-REA_ROOT
# sentinel trick as protected-paths-bash-gate.sh::_normalize_target.
# Returns the normalized lowercased project-relative path on stdout, or
# `__rea_outside_root__:<resolved>` when the path resolves outside the
# project root.
_normalize_target() {
  local t="$1"
  if [[ "$t" =~ ^\"(.*)\"$ ]]; then t="${BASH_REMATCH[1]}"; fi
  if [[ "$t" =~ ^\'(.*)\'$ ]]; then t="${BASH_REMATCH[1]}"; fi
  case "/$t/" in
    */../*)
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
      if [[ "$t" != "$REA_ROOT" && "$t" != "$REA_ROOT"/* ]]; then
        printf '__rea_outside_root__:%s' "$t"
        return 0
      fi
      ;;
  esac
  t=$(normalize_path "$t")
  printf '%s' "$t" | tr '[:upper:]' '[:lower:]'
}

_refuse() {
  local pattern="$1" target="$2" segment="$3"
  {
    printf 'BLOCKED PATH (bash): write denied by policy\n'
    printf '\n'
    printf '  Blocked by:      %s\n' "$pattern"
    printf '  Resolved target: %s\n' "$target"
    printf '  Segment:         %s\n' "$segment"
    printf '\n'
    printf '  Source: .rea/policy.yaml → blocked_paths\n'
    printf '  Rule: blocked_paths entries are unreachable via Bash redirects\n'
    printf '        too — not just Write/Edit/MultiEdit. To modify, a human\n'
    printf '        must edit directly or update blocked_paths in policy.yaml.\n'
  } >&2
  exit 2
}

# Check a single resolved-target token. Refuses on hit.
#
# 0.20.1 helix-021 #2: in addition to the logical post-_normalize_target
# form, also check the symlink-resolved form. Pre-fix `ln -s . linkroot;
# printf x > linkroot/.env` had a logical form of `linkroot/.env`
# (no match against blocked_paths) but a resolved form of `.env`
# (which DOES match). Refuse on either match. Write-tier
# `blocked-paths-enforcer.sh` already has this resolution since 0.10.x.
_check_token() {
  local token="$1" segment="$2"
  [[ -z "$token" ]] && return 0
  local resolved
  resolved=$(_normalize_target "$token")
  if [[ "$resolved" == __rea_outside_root__:* ]]; then
    # Outside REA_ROOT → can't be in blocked_paths (blocked_paths is
    # project-relative). Allow; the protected-paths gate handles
    # outside-root rejection on the protected list itself.
    return 0
  fi
  # Symlink-resolved form via shared helper. Returns empty when the
  # parent doesn't exist (legitimate "creating the parent" case);
  # outside-REA_ROOT sentinel when the symlink walks out of the
  # project (silently allow — same as the logical-path branch above).
  local resolved_symlink
  resolved_symlink=$(rea_resolved_relative_form "$token")
  if [[ "$resolved_symlink" == __rea_outside_root__:* ]]; then
    resolved_symlink=""
  fi
  if _match_blocked "$resolved"; then
    _refuse "$MATCHED" "$resolved" "$segment"
  fi
  if [[ -n "$resolved_symlink" ]] && _match_blocked "$resolved_symlink"; then
    _refuse "$MATCHED" "$resolved_symlink" "$segment"
  fi
  return 0
}

# Scan one segment for redirect / write-utility / node-fs targets and
# refuse on any hit. Mirrors protected-paths-bash-gate.sh::_check_segment
# layout, with a few additions to catch discord-ops Round 9 #1's exact
# Node-interpreter and sed-script-on-target shapes.
_check_segment() {
  local _raw="$1" segment="$2"
  [[ -z "$segment" ]] && return 0

  # Same regex set as protected-paths-bash-gate.sh — fd-prefix-aware
  # redirects, cp/mv tail target, sed -i target, dd of=, plus a
  # token-walk for tee/truncate/install/ln. Keeps behavior consistent
  # across the two bash gates.
  local re_redirect='(^|[[:space:]])(&>>|&>|[0-9]+>>|[0-9]+>\||[0-9]+>|>>|>\||>)[[:space:]]*([^[:space:]&|;<>]+)'
  local re_cpmv='(^|[[:space:]])(cp|mv)[[:space:]]+[^&|;<>]+[[:space:]]([^[:space:]&|;<>]+)[[:space:]]*$'
  local re_sed='(^|[[:space:]])sed[[:space:]]+(-[a-zA-Z]*i[a-zA-Z]*[^[:space:]]*)[[:space:]]+[^&|;<>]+[[:space:]]([^[:space:]&|;<>]+)[[:space:]]*$'
  local re_dd='(^|[[:space:]])dd[[:space:]]+[^&|;<>]*of=([^[:space:]&|;<>]+)'

  if [[ "$segment" =~ $re_redirect ]]; then
    _check_token "${BASH_REMATCH[3]}" "$segment"
  fi
  if [[ "$segment" =~ $re_cpmv ]]; then
    _check_token "${BASH_REMATCH[3]}" "$segment"
  fi
  if [[ "$segment" =~ $re_sed ]]; then
    _check_token "${BASH_REMATCH[3]}" "$segment"
  fi
  if [[ "$segment" =~ $re_dd ]]; then
    _check_token "${BASH_REMATCH[2]}" "$segment"
  fi

  # tee / truncate / install / ln — token-walk identical to
  # protected-paths-bash-gate.sh.
  local _seg_for_walk="$segment"
  _seg_for_walk="${_seg_for_walk#"${_seg_for_walk%%[![:space:]]*}"}"
  local first_tok
  first_tok=$(printf '%s' "$_seg_for_walk" | awk '{print $1}')
  case "$first_tok" in
    tee|truncate|install|ln)
      local found_cmd=""
      # shellcheck disable=SC2086
      set -- $_seg_for_walk
      while [ "$#" -gt 0 ]; do
        local tok="$1"
        shift
        if [[ -z "$found_cmd" ]]; then
          case "$tok" in
            tee|truncate|install|ln) found_cmd="$tok" ;;
          esac
          continue
        fi
        case "$tok" in
          --) continue ;;
          --*=*) continue ;;
          --*)
            case "$tok" in
              --append|--ignore-interrupts|--no-clobber|--force|--no-target-directory|--symbolic|--no-dereference|--reference=*) continue ;;
              *) shift 2>/dev/null || true; continue ;;
            esac
            ;;
          -*)
            case "$tok" in
              -s*|-m*|-o*|-g*|-t*) shift 2>/dev/null || true ;;
            esac
            continue
            ;;
          *)
            _check_token "$tok" "$segment"
            ;;
        esac
      done
      ;;
  esac

  # Node-interpreter fs.writeFileSync / fs.appendFileSync / fs.createWriteStream
  # detection (discord-ops Round 9 #1 explicit shape). Anchored on
  # `node -e ...` or `node --eval ...`. Conservative regex: pulls the
  # first quoted argument out of the call.
  local re_node_write='(^|[[:space:]])node[[:space:]]+(-e|--eval|-p|--print)[[:space:]]+'
  if [[ "$segment" =~ $re_node_write ]]; then
    # Find any quoted-string argument that contains fs.write* /
    # fs.append* / createWriteStream + a path-looking arg. This is a
    # best-effort scan; the goal is the obvious vector, not full JS.
    local node_targets
    node_targets=$(printf '%s' "$segment" \
      | grep -oE "fs\.(writeFileSync|writeFile|appendFileSync|appendFile|createWriteStream)\([[:space:]]*[\"'][^\"']+[\"']" \
      | sed -E "s/.*\([[:space:]]*[\"']([^\"']+)[\"'].*/\\1/" || true)
    if [[ -n "$node_targets" ]]; then
      while IFS= read -r tgt; do
        [[ -z "$tgt" ]] && continue
        _check_token "$tgt" "$segment"
      done <<<"$node_targets"
    fi
  fi

  return 0
}

for_each_segment "$CMD" _check_segment

exit 0
