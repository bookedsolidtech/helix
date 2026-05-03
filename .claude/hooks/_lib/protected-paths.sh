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

# The path list is bash glob patterns matched against project-root-
# relative paths. Suffix `/` indicates a prefix match; no suffix means
# (case-insensitive) exact match — see `rea_path_is_protected` for the
# helix-015 #2 lowercase-comparison rationale. Mirrors the array in
# settings-protection.sh §6.
REA_PROTECTED_PATTERNS=(
  '.claude/settings.json'
  '.claude/settings.local.json'
  '.husky/'
  '.rea/policy.yaml'
  '.rea/HALT'
)

# Test whether a project-relative path matches any protected pattern.
# Usage: if rea_path_is_protected ".rea/HALT"; then echo "blocked"; fi
# Returns 0 on match, 1 on no match.
#
# 0.16.0 codex P1 fix (helix-015 #2): match case-insensitively.
# macOS APFS (default case-insensitive) lets `.ClAuDe/settings.json`
# land on the same file as `.claude/settings.json`. settings-protection.sh
# §6 has had a CI matcher since 0.10.x; this helper was missing it.
# We lowercase BOTH sides so the comparison is symmetric — callers can
# pass either case.
rea_path_is_protected() {
  local p_lc
  p_lc=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  local pattern pattern_lc
  for pattern in "${REA_PROTECTED_PATTERNS[@]}"; do
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
