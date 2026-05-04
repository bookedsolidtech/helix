# shellcheck shell=bash
# hooks/_lib/path-normalize.sh — canonical path normalization shared
# across every hook that compares `tool_input.file_path` against a
# literal/glob policy entry.
#
# Pre-0.16.0 each hook reimplemented its own normalize_path. Drift
# was the result: settings-protection.sh translated `\` → `/` and
# decoded `%5C` since 0.10.x; blocked-paths-enforcer caught up only
# in 0.15.0; architecture-review-gate has never normalized at all.
# This single helper is now the source of truth for both forms.
#
# normalize_path PATH
#   Strip $REA_ROOT prefix → URL-decode `%2F`/`%2E`/`%20`/`%5C`
#   → translate `\` → `/` → strip leading `./` segments. Echoes
#   the project-relative form.
#
# resolve_parent_realpath PATH
#   Resolve the realpath of the parent dir of PATH via `cd -P && pwd -P`.
#   Returns the empty string if the parent doesn't exist (legitimate
#   "we are creating the parent" case — caller should NOT treat
#   empty as a fail). Used to detect intermediate-symlink bypass:
#   if the realpath of the parent doesn't contain the protected
#   surface anymore, the path resolved out of the surface.
#
# All normalization happens in pure bash + sed/tr — no python/perl/
# readlink -f dependency, so it works on macOS, Alpine, and minimal
# CI containers.

# REA_ROOT is required to be set by the caller (every rea hook sets
# it from CLAUDE_PROJECT_DIR or pwd). Default to current dir if missing
# so this lib is sourceable from a test harness that hasn't set it.
: "${REA_ROOT:=${CLAUDE_PROJECT_DIR:-$(pwd)}}"

normalize_path() {
  local p="$1"
  # Strip $REA_ROOT/ prefix (with or without trailing slash).
  if [[ "$p" == "$REA_ROOT"/* ]]; then
    p="${p#"$REA_ROOT"/}"
  fi
  # URL-decode common sequences. Include %5C for backslash so
  # Windows / Git Bash percent-encoded paths normalize the same as
  # forward-slash forms.
  p=$(printf '%s' "$p" | sed 's/%2[Ff]/\//g; s/%2[Ee]/./g; s/%20/ /g; s/%5[Cc]/\\/g')
  # Translate any backslash separators to forward slashes.
  p=$(printf '%s' "$p" | tr '\\\\' '/')
  # Strip leading `./` segments. We deliberately do NOT strip
  # interior `./` — that transformation corrupts `..` traversals
  # (e.g. `.../` collapsed to `../`) and hides traversal from any
  # downstream check.
  while [[ "$p" == ./* ]]; do
    p="${p#./}"
  done
  printf '%s' "$p"
}

resolve_parent_realpath() {
  local target_path="$1"
  local parent_dir
  parent_dir=$(dirname -- "$target_path")
  if [[ ! -d "$parent_dir" ]]; then
    # Parent doesn't exist yet — caller should treat as "no realpath
    # available" and fall back to logical-path checks. Return empty.
    printf ''
    return 0
  fi
  # `cd -P` follows symlinks; `pwd -P` prints the resolved physical
  # path. Subshell scopes the cd so we don't pollute the caller's
  # working directory.
  local resolved
  resolved=$(cd -P -- "$parent_dir" 2>/dev/null && pwd -P 2>/dev/null) || resolved=""
  printf '%s' "$resolved"
}

# 0.20.1 helix-021 fixes: shared helper for the Bash-tier symlink
# resolution that the Write-tier `blocked-paths-enforcer.sh` has had
# since 0.10.x. Given a project-relative LOGICAL_PATH (already
# normalized via normalize_path) and the original raw token (whose
# parent dir may exist on disk), return the resolved-symlink
# project-relative form on stdout.
#
# Returns:
#   - The empty string if the parent doesn't exist (caller can't
#     resolve, falls back to LOGICAL_PATH only).
#   - A literal `__rea_outside_root__:<resolved>` sentinel when the
#     parent's realpath escapes REA_ROOT. Caller refuses with the
#     same shape as the existing outside-REA_ROOT check.
#   - The project-relative resolved form (lowercased to match
#     case-insensitive comparisons elsewhere) when resolution
#     succeeds.
#
# Reference:
#   `blocked-paths-enforcer.sh` lines ~205-238 for the Write-tier
#   reference implementation that this helper backports to Bash-tier.
rea_resolved_relative_form() {
  local raw_token="$1"
  # Skip absolute paths whose logical form is already outside REA_ROOT
  # — `/tmp/log`, `/var/log/x`, etc. The caller's logical-path check
  # has already decided whether to allow or refuse based on the
  # logical form. Re-running symlink resolution on these would
  # produce a false "symlink resolves outside project root" refusal
  # (because `/tmp` resolves to `/private/tmp` on macOS, which is
  # technically outside REA_ROOT). The threat model for THIS helper
  # is intra-project symlink walks: a path the caller thinks is
  # under REA_ROOT but resolves elsewhere via an intermediate
  # symlink. Pure external paths are out of scope.
  if [[ "$raw_token" == /* ]]; then
    # Canonicalize REA_ROOT for the comparison.
    local rea_root_canon_for_skip
    rea_root_canon_for_skip=$(cd -P -- "$REA_ROOT" 2>/dev/null && pwd -P 2>/dev/null) || rea_root_canon_for_skip="$REA_ROOT"
    if [[ "$raw_token" != "$rea_root_canon_for_skip"/* && "$raw_token" != "$REA_ROOT"/* ]]; then
      printf ''
      return 0
    fi
  fi
  local resolved_parent
  resolved_parent=$(resolve_parent_realpath "$raw_token")
  if [[ -z "$resolved_parent" ]]; then
    printf ''
    return 0
  fi
  # Canonicalize REA_ROOT the same way `pwd -P` canonicalized
  # `resolved_parent`. macOS resolves `/var/folders/...` to
  # `/private/var/folders/...` because `/var` is a symlink to
  # `/private/var`; without this normalization the prefix-equality
  # below produces a false outside-REA_ROOT sentinel for every path
  # under a tmpdir that started life as `/var/...`. Memo-friendly:
  # `cd -P` runs once per hook invocation; the cost is bounded.
  local rea_root_canon
  rea_root_canon=$(cd -P -- "$REA_ROOT" 2>/dev/null && pwd -P 2>/dev/null) || rea_root_canon="$REA_ROOT"
  # Outside-REA_ROOT guard. The resolve may walk a symlink that exits
  # the project tree entirely; emit the sentinel so the caller
  # refuses with the same wording as the logical-path traversal
  # check.
  if [[ "$resolved_parent" != "$rea_root_canon" && "$resolved_parent" != "$rea_root_canon"/* ]]; then
    printf '__rea_outside_root__:%s/%s' "$resolved_parent" "$(basename -- "$raw_token")"
    return 0
  fi
  # Strip canonical REA_ROOT prefix, append basename, lowercase to
  # match rea_path_is_protected's case-insensitive comparison.
  local rel
  if [[ "$resolved_parent" == "$rea_root_canon" ]]; then
    rel="$(basename -- "$raw_token")"
  else
    rel="${resolved_parent#"$rea_root_canon"/}/$(basename -- "$raw_token")"
  fi
  printf '%s' "$rel" | tr '[:upper:]' '[:lower:]'
}
