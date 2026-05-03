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
