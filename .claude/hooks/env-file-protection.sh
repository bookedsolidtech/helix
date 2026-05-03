#!/bin/bash
# PreToolUse hook: env-file-protection.sh
# Fires BEFORE every Bash tool call.
# Blocks commands that read .env* / .envrc files via shell text utilities.
#
# Rationale: .env files contain credentials. Reading them via Bash exposes
# the values in command output, logs, and agent transcripts. Load credentials
# in code only (process.env, os.environ, etc.) — never via shell reads.
#
# Trigger: command matches ALL of:
#   1. Uses a text-reading utility (list below)
#   2. References a .env* or .envrc filename
#
# Exit codes:
#   0 = allow
#   2 = block (env file read detected)

set -uo pipefail

# Source shared shell-segment splitter (0.15.0). Replaces full-command
# grep that false-positives on commit messages mentioning `.env` (e.g.
# `git commit -m "stop reading .env via cat"`).
# shellcheck source=_lib/cmd-segments.sh
source "$(dirname "$0")/_lib/cmd-segments.sh"

INPUT=$(cat)

# ── Dependency check ──────────────────────────────────────────────────────────
if ! command -v jq >/dev/null 2>&1; then
  printf 'REA ERROR: jq is required but not installed.\n' >&2
  printf 'Install: brew install jq  OR  apt-get install -y jq\n' >&2
  exit 2
fi

# ── HALT check ────────────────────────────────────────────────────────────────
# 0.16.0: HALT check sourced from shared _lib/halt-check.sh.
# shellcheck source=_lib/halt-check.sh
source "$(dirname "$0")/_lib/halt-check.sh"
check_halt
REA_ROOT=$(rea_root)

CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [[ -z "$CMD" ]]; then
  exit 0
fi

truncate_cmd() {
  local STR="$1"
  local MAX=100
  if [[ ${#STR} -gt $MAX ]]; then
    printf '%s' "${STR:0:$MAX}..."
  else
    printf '%s' "$STR"
  fi
}

# Text-reading utilities (shell and common alternatives)
# Defense-in-depth: this list catches the most common shell-based exfiltration
# vectors. It is NOT exhaustive. Known gaps include:
#   - Docker volume mounts (docker run -v .env:/...) — separate concern
#   - Editor commands (vim, nano, code) — not typically used by agents
#   - Redirects/process substitution (< .env) without a listed utility
#   - Network tools (curl file://, nc) — low-risk in agent context
# The goal is to block casual and accidental reads, not defeat a determined
# adversary with shell access.
PATTERN_UTILITY='(cat|head|tail|less|more|grep|sed|awk|bat|strings|printf|xargs|tee|jq|python3?[[:space:]]+-c|ruby[[:space:]]+-e)[[:space:]]'
# Also catch: source/., cp (reads then writes elsewhere)
PATTERN_SOURCE='(source|\.)[[:space:]]+[^;|&]*\.env'
PATTERN_CP_ENV='cp[[:space:]]+[^;|&]*\.env'
# .env* files or .envrc (direnv)
PATTERN_ENV_FILE='(\.env[a-zA-Z0-9._-]*|\.envrc)([[:space:]]|"|'"'"'|$)'

MATCHES_UTILITY=0
MATCHES_ENV_FILE=0

# 0.15.0: per-segment match. Pre-fix this greped the FULL command which
# false-positived on commit messages: `git commit -m "stop reading .env
# files via cat"` matched both PATTERN_UTILITY (cat) and PATTERN_ENV_FILE
# (.env) and the hook blocked a perfectly safe commit.
if any_segment_matches "$CMD" "$PATTERN_UTILITY"; then
  MATCHES_UTILITY=1
fi

if any_segment_matches "$CMD" "$PATTERN_ENV_FILE"; then
  MATCHES_ENV_FILE=1
fi

# Direct source/cp of .env files — always block
if any_segment_matches "$CMD" "$PATTERN_SOURCE" || \
   any_segment_matches "$CMD" "$PATTERN_CP_ENV"; then
  TRUNCATED_CMD=$(truncate_cmd "$CMD")
  {
    printf 'ENV FILE PROTECTION: Direct sourcing or copying of .env files is blocked.\n'
    printf '\n'
    printf '  Command: %s\n' "$TRUNCATED_CMD"
    printf '\n'
    printf '  Rule: Load credentials in code only — never via shell source or cp.\n'
    printf '  Use: process.env.VAR_NAME, os.environ["VAR_NAME"], etc.\n'
  } >&2
  exit 2
fi

if [[ $MATCHES_UTILITY -eq 1 && $MATCHES_ENV_FILE -eq 1 ]]; then
  TRUNCATED_CMD=$(truncate_cmd "$CMD")
  {
    printf 'ENV FILE PROTECTION: Reading .env files via Bash is blocked.\n'
    printf '\n'
    printf '  Command: %s\n' "$TRUNCATED_CMD"
    printf '\n'
    printf '  Rule: Load credentials in code only, never via shell.\n'
    printf '  Use: process.env.VAR_NAME, os.environ["VAR_NAME"], etc.\n'
    printf '  .env files must not be read via shell utilities in agent sessions.\n'
  } >&2
  exit 2
fi

exit 0
