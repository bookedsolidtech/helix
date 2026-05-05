#!/bin/bash
# hooks/_lib/halt-check.sh — HALT gate helper for rea hooks
# Source via: source "$(dirname "$0")/_lib/halt-check.sh"
#
# Every hook that can block a tool call must gate on .rea/HALT. When the file
# exists, all agent operations are suspended — the hook must deny the tool
# call with a clear error that surfaces the file's contents so the operator
# knows why the system was frozen.

# NOTE: do NOT set `-e` here. This file is sourced by hooks that
# intentionally tolerate non-zero exits (e.g. secret-scanner.sh runs
# multiple grep passes that may legitimately produce non-zero from
# patterns that don't match). Setting -e in the sourced lib would
# propagate to the caller and cause spurious exit-1s on any benign
# non-zero return. Only set the safer subset.
set -uo pipefail

# Find the .rea/ directory by walking up from CLAUDE_PROJECT_DIR or cwd.
# Falls back to CLAUDE_PROJECT_DIR or the current working directory when no
# .rea/ ancestor is found (which is fine — check_halt will simply no-op).
rea_root() {
  local dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
  while [[ "$dir" != "/" ]]; do
    if [[ -d "$dir/.rea" ]]; then
      printf '%s' "$dir"
      return 0
    fi
    dir=$(dirname "$dir")
  done
  printf '%s' "${CLAUDE_PROJECT_DIR:-$(pwd)}"
}

# Exit with code 2 (deny) if .rea/HALT exists.
# Prints the first 1024 bytes of HALT to stderr so the operator sees the
# reason the system was frozen. Safe to call from any hook.
check_halt() {
  local root
  root=$(rea_root)
  local halt_file="${root}/.rea/HALT"
  if [ -f "$halt_file" ]; then
    printf 'REA HALT: %s\nAll agent operations suspended. Run: rea unfreeze\n' \
      "$(head -c 1024 "$halt_file" 2>/dev/null || echo 'Reason unknown')" >&2
    exit 2
  fi
}
