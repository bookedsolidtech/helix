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

# Resolve the rea binary the same 4-branch ladder used by
# `local-review-gate.sh` and `templates/pre-push.local-first.sh`. Echoes
# the resolved command (one shell-token per line) on stdout when found,
# nothing when the ladder exhausts. The caller passes the result to
# `read -ra` to materialize a bash array.
#
# Round-30 F2: shared helper used by `policy_nested_scalar` to invoke
# `rea hook policy-get` for canonical inline+block YAML reads. Falling
# open to empty when no rea CLI is reachable keeps the bash gates
# advisory rather than fail-closed on missing tooling — same posture
# `local-review-gate.sh` itself takes.
_rea_resolve_bin() {
  local root="${REA_ROOT:-}"
  if [[ -z "$root" ]]; then
    if command -v rea_root >/dev/null 2>&1; then
      root=$(rea_root)
    else
      root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
    fi
  fi
  if [ -x "${root}/node_modules/.bin/rea" ]; then
    printf '%s\n' "${root}/node_modules/.bin/rea"
    return 0
  fi
  if [ -f "${root}/dist/cli/index.js" ] \
     && [ -f "${root}/package.json" ] \
     && grep -q '"name": *"@bookedsolid/rea"' "${root}/package.json" 2>/dev/null; then
    printf 'node\n'
    printf '%s\n' "${root}/dist/cli/index.js"
    return 0
  fi
  if command -v rea >/dev/null 2>&1; then
    printf 'rea\n'
    return 0
  fi
  if command -v npx >/dev/null 2>&1; then
    printf 'npx\n'
    printf -- '--no-install\n'
    printf '@bookedsolid/rea\n'
    return 0
  fi
  return 1
}

# Read the value of a nested scalar under a parent key.
# Usage: policy_nested_scalar "review" "local_review" "mode"
# Prints empty when any link in the chain is missing.
#
# Round-30 F2 (structural): delegates to `rea hook policy-get` so
# the bash reader and the TS loader use the same parser. Pre-fix the
# bash function only matched block-form mappings (parent+child+grandchild
# at increasing indents) and silently missed inline forms like
# `local_review: { mode: off }`. The TS loader (yaml.parse) accepts both
# forms — silent split-brain. Routing through the canonical parser
# closes the divergence by construction.
#
# Fallback: when the rea CLI cannot be located AT ALL (no
# node_modules/.bin/rea, no dogfood dist, no PATH, no npx), the
# function falls back to the legacy awk parser. This preserves the
# pre-0.27 behavior on machines that have not installed rea yet —
# the gate stays advisory, not fail-closed on missing tooling. The
# awk fallback keeps the block-only limitation; that's acceptable
# for the no-CLI scenario because consumers without rea installed
# can't have edited a rea-format policy anyway.
policy_nested_scalar() {
  local parent="$1"
  local child="$2"
  local grandchild="$3"
  local policy
  policy=$(policy_path)
  [[ -z "$policy" ]] && return 0

  # Try the canonical TS reader first. `read -ra` materializes the
  # newline-delimited resolver output into a bash array; an empty
  # result means the ladder exhausted (no CLI reachable).
  local resolved
  resolved=$(_rea_resolve_bin 2>/dev/null) || resolved=""
  if [[ -n "$resolved" ]]; then
    local rea_cmd=()
    while IFS= read -r tok; do
      [[ -n "$tok" ]] && rea_cmd+=("$tok")
    done <<< "$resolved"
    if [[ ${#rea_cmd[@]} -gt 0 ]]; then
      local out
      out=$("${rea_cmd[@]}" hook policy-get "${parent}.${child}.${grandchild}" 2>/dev/null) || out=""
      printf '%s' "$out"
      return 0
    fi
  fi

  # No rea CLI reachable — fall back to the legacy block-form awk
  # parser. Inline forms still miss in this branch, but the consumer
  # has bigger problems (no rea binary at all).
  _rea_awk_nested_scalar "$parent" "$child" "$grandchild"
}

# Round-30 F2 perf optimization: cache the entire `review.local_review`
# subtree as JSON on first read. Three rea-CLI spawns per Bash hook fire
# (200ms each = ~0.6s overhead) is unacceptable; ONE spawn for all three
# fields is acceptable (~200ms once per hook). The JSON is parsed via jq
# (already a hook dependency) for each individual field.
#
# `_REA_LOCAL_REVIEW_JSON_CACHE` is process-scoped (set when the hook
# sources this file). Empty string before the first read; either `null`
# or a JSON object after. The `_REA_LOCAL_REVIEW_JSON_LOADED` flag
# distinguishes "not yet read" from "read and value was null". Both
# cleared at re-source time so each hook fire starts fresh.
_REA_LOCAL_REVIEW_JSON_CACHE=""
_REA_LOCAL_REVIEW_JSON_LOADED=0

_rea_load_local_review_json() {
  if [[ $_REA_LOCAL_REVIEW_JSON_LOADED -eq 1 ]]; then
    return 0
  fi
  _REA_LOCAL_REVIEW_JSON_LOADED=1
  local policy
  policy=$(policy_path)
  if [[ -z "$policy" ]]; then
    _REA_LOCAL_REVIEW_JSON_CACHE='null'
    return 0
  fi

  # Try the canonical TS reader for the entire subtree as JSON. Falls
  # back to awk-fallback emulation when the rea CLI is unreachable.
  local resolved
  resolved=$(_rea_resolve_bin 2>/dev/null) || resolved=""
  if [[ -n "$resolved" ]]; then
    local rea_cmd=()
    while IFS= read -r tok; do
      [[ -n "$tok" ]] && rea_cmd+=("$tok")
    done <<< "$resolved"
    if [[ ${#rea_cmd[@]} -gt 0 ]]; then
      local out
      out=$("${rea_cmd[@]}" hook policy-get review.local_review --json 2>/dev/null) || out=""
      if [[ -n "$out" ]]; then
        _REA_LOCAL_REVIEW_JSON_CACHE="$out"
        return 0
      fi
    fi
  fi

  # Fallback: synthesize a JSON object from individual awk reads. This
  # is the only path on machines without rea reachable. Inline-form
  # values still miss in the awk fallback (the documented divergence
  # from when no CLI is reachable), but block-form values work.
  local mode_val refuse_val bypass_val
  mode_val=$(_rea_awk_nested_scalar "review" "local_review" "mode")
  refuse_val=$(_rea_awk_nested_scalar "review" "local_review" "refuse_at")
  bypass_val=$(_rea_awk_nested_scalar "review" "local_review" "bypass_env_var")
  if command -v jq >/dev/null 2>&1; then
    _REA_LOCAL_REVIEW_JSON_CACHE=$(jq -n \
      --arg mode "$mode_val" \
      --arg refuse_at "$refuse_val" \
      --arg bypass_env_var "$bypass_val" \
      'def s($x): if $x == "" then null else $x end;
       {mode: s($mode), refuse_at: s($refuse_at), bypass_env_var: s($bypass_env_var)}')
  else
    # No jq either — synthesize minimal JSON via printf. Values are
    # YAML scalars; we re-quote them safely. Empty values become null.
    _REA_LOCAL_REVIEW_JSON_CACHE='null'
  fi
}

# Helper: read from the cached local_review JSON via jq. Echoes the
# scalar value or empty string when missing/null.
_rea_local_review_get() {
  local field="$1"
  _rea_load_local_review_json
  if [[ "$_REA_LOCAL_REVIEW_JSON_CACHE" == "null" || -z "$_REA_LOCAL_REVIEW_JSON_CACHE" ]]; then
    return 0
  fi
  if ! command -v jq >/dev/null 2>&1; then
    return 0
  fi
  local v
  v=$(printf '%s' "$_REA_LOCAL_REVIEW_JSON_CACHE" | jq -r --arg f "$field" '.[$f] // empty' 2>/dev/null) || v=""
  printf '%s' "$v"
}

# Read `policy.review.local_review.mode`. Prints "enforced" or "off"
# (defaults to empty when unset — the caller treats empty as "enforced",
# the protective default). Added 0.26.0; round-30 F2 routes through the
# canonical TS YAML parser so inline AND block forms both work.
policy_get_local_review_mode() {
  _rea_local_review_get "mode"
}

# Read `policy.review.local_review.refuse_at`. Prints "push" / "commit"
# / "both" or empty when unset (default "push"). Added 0.26.0.
policy_get_local_review_refuse_at() {
  _rea_local_review_get "refuse_at"
}

# Read `policy.review.local_review.bypass_env_var`. Prints the configured
# env-var name or empty when unset (default REA_SKIP_LOCAL_REVIEW).
# Added 0.26.0.
policy_get_local_review_bypass_env_var() {
  _rea_local_review_get "bypass_env_var"
}

# Internal: pure-awk nested-scalar reader. Block-form only — used as the
# fallback when no rea CLI is reachable. Same body as the historical
# `policy_nested_scalar` awk parser, lifted into a private helper so
# the public function can route through `rea hook policy-get` first.
_rea_awk_nested_scalar() {
  local parent="$1"
  local child="$2"
  local grandchild="$3"
  local policy
  policy=$(policy_path)
  [[ -z "$policy" ]] && return 0
  awk -v parent="$parent" -v child="$child" -v grandchild="$grandchild" '
    function indent_of(line,    n, c) {
      n = 0
      while (n < length(line)) {
        c = substr(line, n + 1, 1)
        if (c == " " || c == "\t") n++
        else break
      }
      return n
    }
    BEGIN { in_parent = 0; parent_indent = -1; in_child = 0; child_indent = -1 }
    {
      ind = indent_of($0)
      stripped = $0
      sub(/^[[:space:]]+/, "", stripped)
      if (!in_parent && stripped ~ ("^" parent ":[[:space:]]*$") && ind == 0) {
        in_parent = 1
        parent_indent = 0
        next
      }
      if (in_parent && ind <= parent_indent && !match(stripped, "^$")) {
        in_parent = 0
        in_child = 0
      }
      if (in_parent && !in_child && stripped ~ ("^" child ":[[:space:]]*$") && ind > parent_indent) {
        in_child = 1
        child_indent = ind
        next
      }
      if (in_child && ind <= child_indent && !match(stripped, "^$")) {
        in_child = 0
      }
      if (in_child && match(stripped, ("^" grandchild ":[[:space:]]+"))) {
        val = stripped
        sub(("^" grandchild ":[[:space:]]+"), "", val)
        sub(/[[:space:]]+#.*$/, "", val)
        gsub(/^["'\'']|["'\'']$/, "", val)
        printf "%s", val
        exit
      }
    }
  ' "$policy"
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
