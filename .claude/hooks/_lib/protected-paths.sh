# shellcheck shell=bash
# hooks/_lib/protected-paths.sh — single source of truth for the
# hard-protected path list shared between the Write/Edit tier
# (`settings-protection.sh`) and the Bash tier (`protected-paths-bash-gate.sh`).
#
# Pre-0.15.0 this list was duplicated inline in settings-protection.sh;
# the bash-redirect bypass (`> .rea/HALT`, `tee .rea/policy.yaml`,
# `cp X .claude/settings.json`, `sed -i .husky/pre-push`) was caught
# by the principal-engineer audit. The fix: factor the list out so
# both hooks read the same data, and protect against shell redirects
# in addition to Write/Edit/MultiEdit tools.
#
# 0.16.3 F7: the list is now policy-driven via `protected_paths_relax`.
# Consumers who legitimately need to author `.husky/<hookname>` files
# (or other paths in the rea-managed hard list) can opt out per-pattern
# by listing the entry in `.rea/policy.yaml`:
#
#   protected_paths_relax:
#     - .husky/    # I author my own husky hooks; opt out of rea protection
#
# Pre-0.16.3 the only escape was editing rea-managed source itself —
# which `protected-paths-bash-gate.sh` (also rea-managed) would refuse.
# That left consumers stuck. The relax list closes that escape hatch
# without weakening the integrity of the governance layer itself.
#
# KILL-SWITCH INVARIANTS — these patterns are ALWAYS protected, even
# if a consumer lists them in `protected_paths_relax`. They represent
# the integrity of the governance layer; relaxing them would let an
# agent disable rea, defeating the entire product.
#
#   .rea/HALT             — the kill switch itself
#   .rea/policy.yaml      — the policy that defines all enforcement
#   .claude/settings.json — the hook registration that activates rea
#
# Listing a kill-switch invariant in `protected_paths_relax` is silently
# ignored AND a stderr advisory is emitted on first read.

# The full hard-protected list. Suffix `/` indicates a prefix match;
# no suffix means (case-insensitive) exact match — see
# `rea_path_is_protected` for the helix-015 #2 lowercase-comparison
# rationale.
REA_PROTECTED_PATTERNS_FULL=(
  '.claude/settings.json'
  '.claude/settings.local.json'
  '.husky/'
  '.rea/policy.yaml'
  '.rea/HALT'
)

# Kill-switch invariants — never relaxable. Subset of FULL.
REA_KILL_SWITCH_INVARIANTS=(
  '.claude/settings.json'
  '.rea/policy.yaml'
  '.rea/HALT'
)

# Effective patterns after applying the relax list. Computed lazily on
# first call to `rea_path_is_protected`; stays the same for the lifetime
# of the hook process.
REA_PROTECTED_PATTERNS=()
_REA_PROTECTED_PATTERNS_LOADED=0

# True if $1 is a kill-switch invariant (case-insensitive exact or
# prefix match per the same rules as the protected list itself).
_rea_is_kill_switch() {
  local p="$1"
  local p_lc inv inv_lc
  p_lc=$(printf '%s' "$p" | tr '[:upper:]' '[:lower:]')
  for inv in "${REA_KILL_SWITCH_INVARIANTS[@]}"; do
    inv_lc=$(printf '%s' "$inv" | tr '[:upper:]' '[:lower:]')
    if [[ "$p_lc" == "$inv_lc" ]]; then
      return 0
    fi
  done
  return 1
}

# Load the effective list, applying `protected_paths_relax` from policy.
# Sources policy-read.sh on demand so this lib stays self-contained.
_rea_load_protected_patterns() {
  if [ "$_REA_PROTECTED_PATTERNS_LOADED" = "1" ]; then
    return 0
  fi
  # Source policy-read if not already sourced. The caller may have
  # already done so; checking for a known function avoids double-source.
  if ! command -v policy_list >/dev/null 2>&1; then
    # Resolve relative to THIS file's dir, not the caller's.
    # shellcheck source=policy-read.sh
    source "${BASH_SOURCE[0]%/*}/policy-read.sh" 2>/dev/null || true
  fi

  local relax_list=()
  if command -v policy_list >/dev/null 2>&1; then
    while IFS= read -r entry; do
      [ -z "$entry" ] && continue
      relax_list+=("$entry")
    done < <(policy_list "protected_paths_relax" 2>/dev/null || true)
  fi

  # Validate relax entries: any kill-switch invariant in the list is
  # silently dropped from "permitted to relax" but emits a stderr
  # advisory so the operator can see why their relax didn't take
  # effect.
  local relaxed_set=()
  local r
  for r in "${relax_list[@]+"${relax_list[@]}"}"; do
    if _rea_is_kill_switch "$r"; then
      printf 'rea: protected_paths_relax: %s is a kill-switch invariant and cannot be relaxed; ignoring.\n' \
        "$r" >&2
    else
      relaxed_set+=("$r")
    fi
  done

  # Build the effective list: every FULL entry that is NOT in the
  # relaxed set (case-insensitive comparison).
  local pat pat_lc rentry rentry_lc relaxed
  for pat in "${REA_PROTECTED_PATTERNS_FULL[@]}"; do
    pat_lc=$(printf '%s' "$pat" | tr '[:upper:]' '[:lower:]')
    relaxed=0
    for rentry in "${relaxed_set[@]+"${relaxed_set[@]}"}"; do
      rentry_lc=$(printf '%s' "$rentry" | tr '[:upper:]' '[:lower:]')
      if [[ "$pat_lc" == "$rentry_lc" ]]; then
        relaxed=1
        break
      fi
    done
    if [ "$relaxed" = "0" ]; then
      REA_PROTECTED_PATTERNS+=("$pat")
    fi
  done

  _REA_PROTECTED_PATTERNS_LOADED=1
}

# Test whether a project-relative path is in the documented husky
# extension surface (`.husky/commit-msg.d/*`, `.husky/pre-push.d/*`).
# Returns 0 on match, 1 on no match. Case-insensitive.
#
# 0.16.4 helix-018 Option B: settings-protection.sh §5b has carved
# this surface out of write-tier protection since 0.13.2 — consumers
# write extension fragments here freely. Pre-0.16.4 the BASH-tier
# gates (`protected-paths-bash-gate.sh`, `blocked-paths-bash-gate.sh`)
# had no parity carve-out, so a `cat <<EOF > .husky/pre-push.d/X`
# redirect was refused by the bash-gate even though the equivalent
# Write-tool call would succeed. This helper bakes the carve-out
# into the shared lib so every caller inherits it uniformly.
rea_path_is_extension_surface() {
  local p_lc
  p_lc=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  case "$p_lc" in
    .husky/commit-msg.d/*|.husky/pre-push.d/*|.husky/pre-commit.d/*)
      # Refuse the bare directory itself — only fragments INSIDE
      # the surface count. `.husky/pre-push.d/` (trailing slash, no
      # fragment) and `.husky/pre-push.d` (the dir node) both fall
      # through to the protection check via the parent prefix.
      case "$p_lc" in
        .husky/commit-msg.d/|.husky/pre-push.d/|.husky/pre-commit.d/) return 1 ;;
      esac
      return 0
      ;;
  esac
  return 1
}

# Test whether a project-relative path matches any protected pattern
# (after applying `protected_paths_relax`). Returns 0 on match, 1 on
# no match.
#
# Usage: if rea_path_is_protected ".rea/HALT"; then echo "blocked"; fi
#
# 0.16.0 codex P1 fix (helix-015 #2): match case-insensitively.
# macOS APFS (default case-insensitive) lets `.ClAuDe/settings.json`
# land on the same file as `.claude/settings.json`. settings-protection.sh
# §6 has had a CI matcher since 0.10.x; this helper was missing it.
# We lowercase BOTH sides so the comparison is symmetric — callers can
# pass either case.
#
# 0.16.4 helix-018 Option B: paths inside the documented husky
# extension surface (`.husky/{commit-msg,pre-push,pre-commit}.d/*`)
# return 1 (not protected) BEFORE the prefix-pattern check so they
# don't get caught by `.husky/`'s prefix block. This mirrors the
# §5b allow-list that has been in settings-protection.sh since 0.13.2.
rea_path_is_protected() {
  _rea_load_protected_patterns
  # Extension-surface allow-list — short-circuit before pattern match.
  if rea_path_is_extension_surface "$1"; then
    return 1
  fi
  local p_lc
  p_lc=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  local pattern pattern_lc
  for pattern in "${REA_PROTECTED_PATTERNS[@]+"${REA_PROTECTED_PATTERNS[@]}"}"; do
    pattern_lc=$(printf '%s' "$pattern" | tr '[:upper:]' '[:lower:]')
    if [[ "$p_lc" == "$pattern_lc" ]]; then
      return 0
    fi
    if [[ "$pattern_lc" == */ ]] && [[ "$p_lc" == "$pattern_lc"* ]]; then
      return 0
    fi
  done
  return 1
}
