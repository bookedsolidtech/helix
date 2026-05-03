#!/bin/bash
# PreToolUse hook: dangerous-bash-interceptor.sh
# Fires BEFORE every Bash tool call.
# Detects destructive shell commands and blocks them (exit 2) or warns (exit 0).
#
# Compatible with: interactive sessions + headless Docker (no TTY required).
# All diagnostic output goes to stderr only.
#
# Content extraction:
#   Bash tool → tool_input.command
#
# Exit codes:
#   0 = safe or advisory-only — allow the command to run
#   2 = HIGH severity danger detected — block the command with feedback

set -uo pipefail

# Source shared shell-segment splitter (0.15.0). Provides
# `any_segment_matches "$CMD" PATTERN` which iterates segments split on
# &&/||/;/| and runs the pattern with `grep -qiE` against each
# prefix-stripped segment. Replaces full-command grep that
# false-positives on heredoc bodies and commit messages mentioning
# trigger words.
# shellcheck source=_lib/cmd-segments.sh
source "$(dirname "$0")/_lib/cmd-segments.sh"

# ── 1. Read ALL stdin immediately before doing anything else ──────────────────
INPUT=$(cat)

# ── 2. Dependency check ───────────────────────────────────────────────────────
if ! command -v jq >/dev/null 2>&1; then
  printf 'REA ERROR: jq is required but not installed.\n' >&2
  printf 'Install: brew install jq  OR  apt-get install -y jq\n' >&2
  exit 2
fi

# ── 3. HALT check ─────────────────────────────────────────────────────────────
# 0.16.0: HALT check sourced from shared _lib/halt-check.sh.
# shellcheck source=_lib/halt-check.sh
source "$(dirname "$0")/_lib/halt-check.sh"
check_halt
REA_ROOT=$(rea_root)

# ── 4. Parse tool_input.command from the hook payload ─────────────────────────
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [[ -z "$CMD" ]]; then
  exit 0
fi

# ── 5. Helper: truncate command for display ────────────────────────────────────
truncate_cmd() {
  local STR="$1"
  local MAX=200
  if [[ ${#STR} -gt $MAX ]]; then
    printf '%s' "${STR:0:$MAX}..."
  else
    printf '%s' "$STR"
  fi
}

# ── 6. Violation accumulators ──────────────────────────────────────────────────
HIGH_FILE=$(mktemp "${TMPDIR:-/tmp}/rea-bash-high-XXXXXX")
MEDIUM_FILE=$(mktemp "${TMPDIR:-/tmp}/rea-bash-medium-XXXXXX")

cleanup_violations() {
  rm -f "$HIGH_FILE" "$MEDIUM_FILE"
}
trap cleanup_violations EXIT

add_high() {
  local LABEL="$1"
  local DETAIL="$2"
  shift 2
  printf 'HIGH|%s|%s\n' "$LABEL" "$DETAIL" >> "$HIGH_FILE"
  for ALT in "$@"; do
    printf 'ALT:%s\n' "$ALT" >> "$HIGH_FILE"
  done
  printf 'END_VIOLATION\n' >> "$HIGH_FILE"
}

add_medium() {
  local LABEL="$1"
  local DETAIL="$2"
  shift 2
  printf 'MEDIUM|%s|%s\n' "$LABEL" "$DETAIL" >> "$MEDIUM_FILE"
  for ALT in "$@"; do
    printf 'ALT:%s\n' "$ALT" >> "$MEDIUM_FILE"
  done
  printf 'END_VIOLATION\n' >> "$MEDIUM_FILE"
}

# ── 7. Per-segment evaluation helper ──────────────────────────────────────────
# (Migrated to `_lib/cmd-segments.sh::any_segment_matches` as of 0.15.0.
# The previous inline helper was defined here but never called — H3-H17
# all greped the WHOLE command, which false-positived on heredoc bodies
# and commit messages mentioning trigger words. Migration: every check
# now uses `any_segment_matches "$CMD" PATTERN` with the helper sourced
# at the top of this file.)

# ── 8. Smart exclusion flags ──────────────────────────────────────────────────
CMD_IS_REBASE_SAFE=0
if any_segment_starts_with "$CMD" 'git[[:space:]]+(rebase)[[:space:]].*(--abort|--continue)'; then
  CMD_IS_REBASE_SAFE=1
fi

CMD_IS_CLEAN_DRY=0
if any_segment_starts_with "$CMD" 'git[[:space:]]+clean.*([ \t]-n|--dry-run)'; then
  CMD_IS_CLEAN_DRY=1
fi

# ── 9. HIGH severity checks ────────────────────────────────────────────────────

# H1: git push --force or -f (per-segment — prevents --force-with-lease poisoning)
# A segment containing --force-with-lease is excluded; other segments are not.
# 0.15.0: also catches `git push origin +<branch>` (refspec-prefix force-push
# shorthand) which the previous version missed.
_h1_check() {
  local _raw="$1" SEGMENT="$2"
  [[ -z "$SEGMENT" ]] && return 0
  # 0.15.0 codex P1 fix: anchor on `^git push`. Pre-fix the unanchored
  # match meant `echo "git push --force is bad"` triggered H1 even
  # though no actual push was happening (the segment after prefix-strip
  # was `echo "..."`, not `git push`). Anchoring scopes detection to
  # segments whose first token IS git push.
  printf '%s' "$SEGMENT" | grep -qiE '^git[[:space:]]+push([[:space:]]|$)' || return 0
  # Skip segments that use the safe --force-with-lease.
  if printf '%s' "$SEGMENT" | grep -qiE -- '--force-with-lease'; then
    return 0
  fi
  # 0.15.0 codex P1 fix: combined-flag forms (`-fu`, `-uf`, `-Fu`) and
  # long-form `--force=value` were not caught by the previous
  # `-f[[:space:]]` shape. The flag-cluster pattern `-[a-zA-Z]*f[a-zA-Z]*`
  # (followed by space or EOS) mirrors how H11 handles rm flag clusters.
  # The refspec-prefix `+` on a branch name is git's force-push shorthand.
  if printf '%s' "$SEGMENT" | grep -qiE -- '--force([[:space:]]|=|$)' || \
     printf '%s' "$SEGMENT" | grep -qiE -- '(^|[[:space:]])-[a-zA-Z]*f[a-zA-Z]*([[:space:]]|$)' || \
     printf '%s' "$SEGMENT" | grep -qE -- '[[:space:]]\+[A-Za-z0-9_./-]'; then
    add_high \
      "git push --force — force push detected" \
      "Force-pushing rewrites public history and breaks collaborators' local copies." \
      "Alt: Use 'git push --force-with-lease' — blocks if upstream has new commits you haven't pulled."
  fi
  return 0
}
for_each_segment "$CMD" _h1_check

# H2: git rebase — advisory (MEDIUM)
if [[ $CMD_IS_REBASE_SAFE -eq 0 ]]; then
  if any_segment_starts_with "$CMD" 'git[[:space:]]+rebase([[:space:]]|$)'; then
    add_medium \
      "git rebase — rewrites commit history (advisory)" \
      "Rebase changes commit SHAs. Safe on local feature branches; dangerous on shared/published branches." \
      "Alt: 'git merge origin/main' preserves history (creates merge commit)." \
      "     'git rebase --abort' to cancel if in progress."
  fi
fi

# H3: git checkout -- .
if any_segment_starts_with "$CMD" 'git[[:space:]]+checkout[[:space:]]+--[[:space:]]+\.'; then
  add_high \
    "git checkout -- . — discards all uncommitted changes" \
    "Overwrites working tree changes with HEAD. Uncommitted work is lost permanently." \
    "Alt: 'git stash' to temporarily shelve changes, 'git restore <file>' for individual files."
fi

# H4: git restore . (any form — with or without --staged flag)
if any_segment_starts_with "$CMD" 'git[[:space:]]+restore[[:space:]].*[[:space:]]\.([[:space:]]|$)' || \
   any_segment_starts_with "$CMD" 'git[[:space:]]+restore[[:space:]]+\.[[:space:]]*$'; then
  add_high \
    "git restore . — discards all uncommitted changes" \
    "Restores every tracked file to HEAD, permanently discarding all working tree modifications." \
    "Alt: 'git stash' to save changes temporarily, or restore individual files: 'git restore <file>'."
fi

# H5: git clean -f
if [[ $CMD_IS_CLEAN_DRY -eq 0 ]]; then
  if any_segment_starts_with "$CMD" 'git[[:space:]]+clean[[:space:]]+-[a-zA-Z]*f'; then
    add_high \
      "git clean -f — removes untracked files" \
      "Permanently deletes untracked files from the working tree. Cannot be undone via git." \
      "Alt: 'git clean -n' (dry-run) to preview what would be deleted before committing."
  fi
fi

# H6: DROP TABLE or DROP DATABASE in psql
if any_segment_matches "$CMD" '(psql|pgcli)[^|&;]*DROP[[:space:]]+(TABLE|DATABASE|SCHEMA)'; then
  add_high \
    "DROP TABLE/DATABASE via psql — destructive DDL" \
    "Running destructive DDL directly in psql bypasses migration pipeline safety checks." \
    "Alt: Use your project's migration tool. Never run DROP via ad-hoc psql."
fi

# H7: kill -9 with pgrep subshell
if any_segment_starts_with "$CMD" 'kill[[:space:]]+-9[[:space:]]+(\$\(|`)'; then
  add_high \
    "kill -9 with pgrep subshell — aggressive process termination" \
    "Sends SIGKILL to processes matched by name, which may kill unintended processes." \
    "Alt: 'kill -15 <pid>' (SIGTERM) for graceful shutdown."
fi

# H8: killall -9
if any_segment_starts_with "$CMD" 'killall[[:space:]]+-9[[:space:]]+\S'; then
  add_high \
    "killall -9 — SIGKILL all matching processes" \
    "Immediately terminates all processes with the given name without cleanup." \
    "Alt: 'killall -15 <name>' (SIGTERM) allows graceful shutdown."
fi

# H9: git commit --no-verify
if any_segment_starts_with "$CMD" 'git[[:space:]]+commit.*--no-verify'; then
  add_high \
    "git commit --no-verify — skipping pre-commit hooks" \
    "Bypasses all pre-commit safety gates including secret scanning and linting." \
    "Alt: Fix the underlying hook failure rather than bypassing it."
fi

# H10: HUSKY=0 bypass — suppresses all git hooks without --no-verify
if any_segment_raw_matches "$CMD" '^HUSKY=0[[:space:]]+git[[:space:]]+(commit|push|tag)'; then
  add_high \
    "HUSKY=0 — bypasses all husky git hooks" \
    "Setting HUSKY=0 disables pre-commit, commit-msg, and pre-push safety gates without --no-verify." \
    "Alt: Fix the underlying hook failure rather than suppressing all hooks."
fi

# H11: rm -rf with broad targets
# Covers combined flags (rm -rf, rm -fr), split flags (rm -r -f), and long flags (rm --recursive --force)
# 0.15.0 fix: anchored each target on word boundary (whitespace-or-EOS).
# The previous form had a bare `\.` which matched `rm -rf .git/foo`
# (legitimate `.git/`-tree cleanup). Each token now requires either
# end-of-string or whitespace after — so `.` alone matches `rm -rf .`
# (the cwd, dangerous) but NOT `rm -rf .git/foo`.
BROAD_TARGETS='(\/|~\/|\.\/\*|\*|\.|src|dist|build|node_modules)([[:space:]]|$)'
if any_segment_starts_with "$CMD" "rm[[:space:]]+-[a-zA-Z]*r[a-zA-Z]*f[[:space:]]+${BROAD_TARGETS}" || \
   any_segment_starts_with "$CMD" "rm[[:space:]]+-[a-zA-Z]*f[a-zA-Z]*r[[:space:]]+${BROAD_TARGETS}" || \
   any_segment_starts_with "$CMD" "rm[[:space:]]+-[a-zA-Z]*r[[:space:]]+-[a-zA-Z]*f[[:space:]]+${BROAD_TARGETS}" || \
   any_segment_starts_with "$CMD" "rm[[:space:]]+-[a-zA-Z]*f[[:space:]]+-[a-zA-Z]*r[[:space:]]+${BROAD_TARGETS}" || \
   any_segment_starts_with "$CMD" "rm[[:space:]]+--recursive[[:space:]]+--force[[:space:]]+${BROAD_TARGETS}" || \
   any_segment_starts_with "$CMD" "rm[[:space:]]+--force[[:space:]]+--recursive[[:space:]]+${BROAD_TARGETS}"; then
  add_high \
    "rm -rf with broad target — mass file deletion" \
    "Permanently deletes files and directories. Cannot be undone." \
    "Alt: Move to a temp location first, or use 'rm -ri' for interactive deletion."
fi

# H12: curl/wget piped directly to shell (supply chain attack vector).
# 0.16.1 helix-016 P1 fix: this check requires BOTH the curl/wget call
# AND the `| sh` to appear in the same shell pipeline. The 0.16.0
# refactor moved this into `any_segment_matches`, but the segmenter
# splits on `|` first — so `curl https://x | sh` decomposed into two
# segments (`curl https://x`, `sh`) and the regex (which requires both
# in one segment) never matched. Pipe-RCE is fundamentally a
# multi-segment property and must be checked against the raw command.
if printf '%s' "$CMD" | grep -qiE '(curl|wget)[^|]*\|[[:space:]]*(sudo[[:space:]]+)?(bash|sh|zsh|fish)'; then
  add_high \
    "curl/wget piped to shell — remote code execution" \
    "Executing remote scripts without inspection is a major supply chain risk." \
    "Alt: Download first, inspect the script, then execute: curl -o script.sh URL && cat script.sh && bash script.sh"
fi

# H13: git push --no-verify — bypasses pre-push hooks
if any_segment_starts_with "$CMD" 'git[[:space:]]+push.*--no-verify'; then
  add_high \
    "git push --no-verify — skipping pre-push hooks" \
    "Bypasses all pre-push safety gates including CI checks." \
    "Alt: Fix the underlying hook failure rather than bypassing it."
fi

# H14: git -c core.hooksPath= — redirects or disables hook execution
if any_segment_starts_with "$CMD" 'git[[:space:]]+-c[[:space:]]+core\.hookspath'; then
  add_high \
    "git -c core.hooksPath — overriding hooks directory" \
    "Redirecting the hooks path can disable all safety hooks." \
    "Alt: Fix the underlying hook issue. Do not bypass the hooks directory."
fi

# H15: REA_BYPASS env var — attempted escape hatch
if any_segment_raw_matches "$CMD" '^REA_BYPASS[[:space:]]*='; then
  add_high \
    "REA_BYPASS env var — unauthorized bypass attempt" \
    "Setting REA_BYPASS is not a supported escape mechanism and indicates a bypass attempt." \
    "Alt: If you need to override a gate, request human escalation."
fi

# H16: alias/function definitions containing bypass strings
if any_segment_raw_matches "$CMD" '^(alias|function)[[:space:]]+[a-zA-Z_]+.*(--(no-verify|force)|HUSKY=0|core\.hookspath)'; then
  add_high \
    "Alias/function definition with bypass — circumventing safety gates" \
    "Defining aliases or functions that embed bypass flags defeats safety hooks." \
    "Alt: Do not wrap bypass patterns in aliases or functions."
fi

# H17: context_protection — block commands that should be delegated to subagents.
# Reads context_protection.delegate_to_subagent from .rea/policy.yaml.
# These commands produce excessive output that exhausts coordinator context windows.
#
# 0.16.0 fix J.2: replaced the inline YAML parser (40+ lines reimplementing
# block-sequence walking) with `policy_list` from `_lib/policy-read.sh`.
# Same parser shape as every other rea hook now reads policy via the shared
# helper; drift between hooks is structurally impossible.
# shellcheck source=_lib/policy-read.sh
source "$(dirname "$0")/_lib/policy-read.sh"

DELEGATE_PATTERNS=()
while IFS= read -r pattern; do
  [[ -z "$pattern" ]] && continue
  DELEGATE_PATTERNS+=("$pattern")
done < <(policy_list "delegate_to_subagent")

for pattern in "${DELEGATE_PATTERNS[@]+"${DELEGATE_PATTERNS[@]}"}"; do
  # Use fixed-string match — these are command prefixes, not regex.
  if printf '%s' "$CMD" | grep -qF "$pattern"; then
    add_high \
      "Context protection — command must run in a subagent" \
      "This command produces excessive output that will exhaust the coordinator context window. Delegate it to a subagent instead of running it directly." \
      "Alt: Use the Agent tool to delegate: Agent(subagent_type: 'qa-engineer-automation', prompt: 'Run $pattern and report pass/fail summary only.')" \
      "Alt: The context_protection policy in .rea/policy.yaml lists commands that must be delegated."
    break
  fi
done

# ── 10. MEDIUM severity checks ────────────────────────────────────────────────

# M1: npm install --force
if any_segment_matches "$CMD" 'npm[[:space:]]+(install|i)[[:space:]].*--force'; then
  add_medium \
    "npm install --force — bypasses dependency resolution" \
    "--force skips conflict checks and can install incompatible package versions." \
    "Alt: Resolve the dependency conflict explicitly. Use --legacy-peer-deps if needed."
fi

# ── 11. Evaluate and report ───────────────────────────────────────────────────

TRUNCATED_CMD=$(truncate_cmd "$CMD")

print_violations() {
  local VF="$1"
  local NOTE_LABEL="$2"
  while IFS= read -r LINE; do
    case "$LINE" in
      HIGH\|*|MEDIUM\|*)
        local SEV LABEL DETAIL
        SEV=$(printf '%s' "$LINE" | cut -d'|' -f1)
        LABEL=$(printf '%s' "$LINE" | cut -d'|' -f2)
        DETAIL=$(printf '%s' "$LINE" | cut -d'|' -f3)
        printf '  %s: %s\n' "$SEV" "$LABEL"
        printf '  %s: %s\n' "$NOTE_LABEL" "$DETAIL"
        ;;
      ALT:*)
        printf '  %s\n' "${LINE#ALT:}"
        ;;
      END_VIOLATION)
        printf '\n'
        ;;
    esac
  done < "$VF"
}

if [[ -s "$HIGH_FILE" ]]; then
  {
    printf 'BASH INTERCEPTED: Dangerous command blocked\n'
    print_violations "$HIGH_FILE" "Reason"
    printf '  BLOCKED COMMAND: %s\n' "$TRUNCATED_CMD"
  } >&2
  exit 2
fi

if [[ -s "$MEDIUM_FILE" ]]; then
  {
    printf 'BASH ADVISORY: Potentially risky command (not blocked)\n'
    print_violations "$MEDIUM_FILE" "Note"
    printf '  COMMAND: %s\n' "$TRUNCATED_CMD"
  } >&2
  exit 0
fi

exit 0
