#!/bin/bash
# hooks/_lib/policy-read.sh — policy.yaml read helpers for rea hooks
# Source via: source "$(dirname "$0")/_lib/policy-read.sh"
#
# Minimal shell-only parsers for .rea/policy.yaml. Keeps hooks dependency-free
# (no yq required). Functions assume the caller has already resolved the
# project root via rea_root() from halt-check.sh, but will re-derive it if
# REA_ROOT is unset.

set -euo pipefail

# Resolve the path to .rea/policy.yaml for the current project.
# Prints an empty string if no policy file is found — callers should treat
# a missing policy as "default / advisory" rather than an error.
policy_path() {
  local root="${REA_ROOT:-}"
  if [[ -z "$root" ]]; then
    if command -v rea_root >/dev/null 2>&1; then
      root=$(rea_root)
    else
      root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
    fi
  fi
  local policy="${root}/.rea/policy.yaml"
  if [[ -f "$policy" ]]; then
    printf '%s' "$policy"
  fi
}

# Read a top-level scalar field from policy.yaml.
# Usage: policy_scalar "autonomy_level"
# Strips surrounding quotes. Prints empty string when unset or no policy.
policy_scalar() {
  local key="$1"
  local policy
  policy=$(policy_path)
  [[ -z "$policy" ]] && return 0
  grep -E "^${key}:" "$policy" 2>/dev/null \
    | head -n1 \
    | sed -E "s/^${key}:[[:space:]]*//; s/^[\"']//; s/[\"']$//"
}

# Test whether a boolean-valued top-level field is true.
# Usage: policy_bool_true "block_ai_attribution" && ...
# Returns 0 when the value is literal "true", 1 otherwise (including missing).
policy_bool_true() {
  local key="$1"
  local value
  value=$(policy_scalar "$key")
  [[ "$value" == "true" ]]
}

# Read a list of scalars from a top-level sequence block.
# Usage: mapfile -t patterns < <(policy_list "delegate_to_subagent")
# Handles inline "[]" as empty. Stops at the first non-"-" continuation line.
policy_list() {
  local key="$1"
  local policy
  policy=$(policy_path)
  [[ -z "$policy" ]] && return 0
  local in_block=0
  while IFS= read -r line; do
    if printf '%s' "$line" | grep -qE "^[[:space:]]*${key}:"; then
      if printf '%s' "$line" | grep -qE "${key}:[[:space:]]*\[\]"; then
        return 0
      fi
      in_block=1
      continue
    fi
    if [[ $in_block -eq 1 ]]; then
      if printf '%s' "$line" | grep -qE '^[[:space:]]*-[[:space:]]'; then
        printf '%s' "$line" | sed -E "s/^[[:space:]]*-[[:space:]]*//; s/^[\"']//; s/[\"']$//"
        printf '\n'
      else
        return 0
      fi
    fi
  done < "$policy"
}
