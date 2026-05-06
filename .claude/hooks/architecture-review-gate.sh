#!/bin/bash
# PostToolUse hook: architecture-review-gate.sh
# Fires AFTER every Write or Edit tool call.
# Lightweight advisory: flags when writing to architecture-sensitive paths.
# Does NOT block — only returns advisory context.
#
# Exit codes:
#   0 = always (advisory only, never blocks)

set -uo pipefail

# ── 1. Read ALL stdin immediately ─────────────────────────────────────────────
INPUT=$(cat)

# ── 2. Dependency check ──────────────────────────────────────────────────────
if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

# ── 3. HALT check ────────────────────────────────────────────────────────────
# 0.16.0: HALT check sourced from shared _lib/halt-check.sh.
# shellcheck source=_lib/halt-check.sh
source "$(dirname "$0")/_lib/halt-check.sh"
check_halt
REA_ROOT=$(rea_root)

# ── 4. Check if enabled ──────────────────────────────────────────────────────
POLICY_FILE="${REA_ROOT}/.rea/policy.yaml"
if [[ -f "$POLICY_FILE" ]]; then
  if grep -qE 'architecture_advisory:[[:space:]]*false' "$POLICY_FILE" 2>/dev/null; then
    exit 0
  fi
fi

# ── 5. Extract file path ─────────────────────────────────────────────────────
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# 0.16.0 fix D.1: normalize via shared `_lib/path-normalize.sh` so
# Windows / Git Bash backslash paths and URL-encoded forms are handled
# uniformly with the rest of the hook layer. Pre-fix, this hook only
# stripped $REA_ROOT prefix — `src\gateway\foo.ts` (Windows) or
# `src%2Fgateway%2Ffoo.ts` (URL-encoded) silently bypassed the
# architectural review.
# shellcheck source=_lib/path-normalize.sh
source "$(dirname "$0")/_lib/path-normalize.sh"
FILE_PATH=$(normalize_path "$FILE_PATH")

# ── 6. Check architecture-sensitive paths ─────────────────────────────────────
# 0.20.1 helix-round-N P2: read patterns from policy. Pre-fix the
# rea-internal source-tree patterns (`src/gateway/`, `hooks/_lib/`,
# `profiles/`, etc.) shipped as hardcoded defaults — irrelevant noise
# in consumer projects whose architecture-sensitive paths are
# different. Consumers with their own architecture surfaces declare
# them in `.rea/policy.yaml::architecture_review.patterns`. The
# bst-internal profile pins the rea-source patterns so the dogfood
# install behaves the same as before; consumers without a pattern
# set get a silent no-op.
# shellcheck source=_lib/policy-read.sh
source "$(dirname "$0")/_lib/policy-read.sh"

ARCH_PATTERNS=()
while IFS= read -r entry; do
  [[ -z "$entry" ]] && continue
  ARCH_PATTERNS+=("$entry")
done < <(policy_list "architecture_review.patterns" 2>/dev/null || true)

if [[ ${#ARCH_PATTERNS[@]} -eq 0 ]]; then
  # Empty/unset policy → silent no-op. Consumers who haven't declared
  # architecture-sensitive paths see zero advisory output.
  exit 0
fi

MATCHED=""
for pattern in "${ARCH_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == "$pattern"* ]]; then
    MATCHED="$pattern"
    break
  fi
done

if [[ -z "$MATCHED" ]]; then
  exit 0
fi

# ── 7. Advisory output ───────────────────────────────────────────────────────
{
  printf 'ARCHITECTURE ADVISORY: Sensitive path modified\n'
  printf '\n'
  printf '  File: %s\n' "$FILE_PATH"
  printf '  Category: %s\n' "$MATCHED"
  printf '\n'
  printf '  This file is in an architecture-sensitive directory.\n'
  printf '  Consider: Does this change maintain backward compatibility?\n'
  printf '  Consider: Should this be reviewed by the principal-engineer agent?\n'
} >&2

exit 0
