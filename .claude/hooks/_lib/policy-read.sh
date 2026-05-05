#!/bin/bash
# hooks/_lib/policy-read.sh — policy.yaml read helpers for rea hooks
# Source via: source "$(dirname "$0")/_lib/policy-read.sh"
#
# Minimal shell-only parsers for .rea/policy.yaml. Keeps hooks dependency-free
# (no yq required). Functions assume the caller has already resolved the
# project root via rea_root() from halt-check.sh, but will re-derive it if
# REA_ROOT is unset.

# NOTE: do NOT set `-e` here — see hooks/_lib/halt-check.sh for the
# rationale. This is a sourced library; -e would propagate to callers
# and cause spurious exit-1s on benign non-zero returns from grep/sed.
set -uo pipefail

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

# Read a list of scalars from a top-level sequence.
# Usage: mapfile -t patterns < <(policy_list "delegate_to_subagent")
#
# Recognized YAML forms:
#
#   1. Block sequence (the historical / canonical form):
#        blocked_paths:
#          - .env
#          - .env.*
#          - .rea/HALT
#
#   2. Empty inline array (since 0.1.x):
#        blocked_paths: []      # → no entries (returns successfully)
#
#   3. Non-empty inline array (added 0.18.0 G1.B/G1.C):
#        blocked_paths: [.env, .env.*, .rea/HALT]
#
# Inline arrays may span multiple lines:
#
#        blocked_paths: [
#          .env,
#          .env.*,
#          .rea/HALT
#        ]
#
# Quoted entries (single or double quotes) are unquoted. Leading and
# trailing whitespace on each entry is trimmed. Empty entries (e.g. from
# a trailing `,`) are skipped silently.
#
# Pre-fix (G1.B/G1.C): the inline array form was VALID YAML but parsed
# to an empty list — silent bypass of `blocked-paths-bash-gate.sh` and
# silent ignore of `protected_writes` overrides. Fixed by extending the
# parser to recognize the inline form in addition to the block form.
#
# The block form is still preferred (sed-friendly, line-aligned diffs)
# but the inline form is now equally enforced.
policy_list() {
  local key="$1"
  local policy
  policy=$(policy_path)
  [[ -z "$policy" ]] && return 0
  local in_block=0
  local in_inline=0
  local inline_buf=""
  while IFS= read -r line; do
    # Skip while we're collecting an inline-array body across lines.
    if [[ $in_inline -eq 1 ]]; then
      inline_buf="${inline_buf} ${line}"
      # Detect the closing `]` (any position on the line).
      if printf '%s' "$line" | grep -qE '\]'; then
        _policy_emit_inline_array "$inline_buf"
        return 0
      fi
      continue
    fi
    if printf '%s' "$line" | grep -qE "^[[:space:]]*${key}:"; then
      # Empty inline `[]` — explicit empty list.
      if printf '%s' "$line" | grep -qE "${key}:[[:space:]]*\[[[:space:]]*\]"; then
        return 0
      fi
      # Non-empty inline `[ ... ]` — parse the bracketed body. May or
      # may not close on the same line.
      if printf '%s' "$line" | grep -qE "${key}:[[:space:]]*\["; then
        # Strip everything up to and including the opening `[`.
        inline_buf=$(printf '%s' "$line" | sed -E "s/^.*${key}:[[:space:]]*\[//")
        if printf '%s' "$inline_buf" | grep -qE '\]'; then
          # Single-line inline array.
          _policy_emit_inline_array "$inline_buf"
          return 0
        fi
        in_inline=1
        continue
      fi
      # Block-form sequence header — entries follow on subsequent lines.
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

# Emit each entry of an inline-array body (everything between `[` and
# `]`, possibly across newlines if the caller concatenated lines with
# spaces). Strips outer brackets, splits on `,`, trims whitespace and
# matched outer quotes, drops empty entries (trailing-comma tolerance).
_policy_emit_inline_array() {
  local buf="$1"
  # Drop the closing `]` and anything after it (line comments etc).
  buf=$(printf '%s' "$buf" | sed -E 's/\].*$//')
  # Split on commas.
  local IFS=','
  local raw
  for raw in $buf; do
    # Trim leading + trailing whitespace.
    raw="${raw#"${raw%%[![:space:]]*}"}"
    raw="${raw%"${raw##*[![:space:]]}"}"
    # Drop trailing inline comment (` # comment`).
    raw=$(printf '%s' "$raw" | sed -E 's/[[:space:]]+#.*$//')
    # Re-trim after comment stripping.
    raw="${raw#"${raw%%[![:space:]]*}"}"
    raw="${raw%"${raw##*[![:space:]]}"}"
    # Skip empty entries (trailing comma, blank line in multi-line form).
    [[ -z "$raw" ]] && continue
    # Strip matched outer single or double quotes.
    raw=$(printf '%s' "$raw" | sed -E "s/^[\"']//; s/[\"']$//")
    printf '%s\n' "$raw"
  done
}
