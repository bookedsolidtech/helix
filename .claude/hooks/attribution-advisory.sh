#!/bin/bash
# PreToolUse hook: attribution-advisory.sh
# Fires BEFORE every Bash tool call.
#
# OPT-IN: Only enforces when .rea/policy.yaml contains:
#   block_ai_attribution: true
#
# When disabled (default), this hook does nothing.
# When enabled, BLOCKS (exit 2) gh pr create/edit and git commit commands
# that contain structural AI attribution markers.
#
# Exit codes:
#   0 = allow (disabled, no attribution found, or not a relevant command)
#   2 = block (attribution detected, or HALT is active)

set -uo pipefail

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

# ── 4. Check if attribution blocking is enabled ──────────────────────────────
POLICY_FILE="${REA_ROOT}/.rea/policy.yaml"
if [ ! -f "$POLICY_FILE" ]; then
  exit 0
fi
if ! grep -qE '^block_ai_attribution:[[:space:]]*true' "$POLICY_FILE" 2>/dev/null; then
  exit 0
fi

# ── 5. Parse tool_input.command from the hook payload ─────────────────────────
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [[ -z "$CMD" ]]; then
  exit 0
fi

# 0.15.0: source the shared shell-segment splitter. Pre-fix, the
# attribution patterns greped the FULL command — `git commit -m "Note:
# Co-Authored-By with AI was removed in 0.14"` matched and the commit
# was blocked even though the message was COMMENTING on attribution
# rather than including it. Per-segment anchoring scopes detection to
# segments whose first token is `git commit` / `gh pr create|edit`.
# shellcheck source=_lib/cmd-segments.sh
source "$(dirname "$0")/_lib/cmd-segments.sh"

# ── 6. Check if this is a relevant command ────────────────────────────────────
# 0.18.0 helix-020 / discord-ops Round 10 #2 fix (G4.A): use
# `any_segment_starts_with`, not `any_segment_matches`. The pre-fix
# matcher used the unanchored form, so a segment like
#   gh pr edit --body "tracked: gh pr create earlier in the run"
# triggered IS_RELEVANT=1 because the substring `gh pr create` was
# anywhere in the segment. The downstream attribution check then
# scanned the body for the markdown-link / Co-Authored-By patterns,
# and ANY mention of those terms in the body's prose got blocked
# even though the actual command was a `gh pr edit` whose intent had
# nothing to do with structural attribution. The same anchoring fix
# `dangerous-bash-interceptor.sh` got in 0.16.3 F5 finally lands here.
IS_RELEVANT=0

if any_segment_starts_with "$CMD" 'gh[[:space:]]+pr[[:space:]]+(create|edit)'; then
  IS_RELEVANT=1
fi

if any_segment_starts_with "$CMD" 'git[[:space:]]+commit'; then
  IS_RELEVANT=1
fi

if [[ $IS_RELEVANT -eq 0 ]]; then
  exit 0
fi

# ── 7. Check for structural AI attribution markers ───────────────────────────

FOUND=0

# Co-Authored-By with noreply@ email
# 0.18.0 helix-020 / discord-ops Round 10 #3 fix (G4.B): exclude
# GitHub's legitimate `<user>@users.noreply.github.com` collaborator
# footers from the noreply match. Pre-fix the regex `Co-Authored-By:.*noreply@`
# matched both AI-tool noreply addresses (anthropic.com, openai.com,
# github-copilot, etc.) AND GitHub's per-user noreply form, blocking
# legitimate human collaborator credits. The new regex requires
# `noreply@` to be followed by something that ISN'T `users.noreply.github.com`
# — covered via a negative-lookahead simulation: match `noreply@` then
# either end-of-line, whitespace, `>`, or a domain that does NOT begin
# with `users.noreply.github.com`. Posix ERE has no lookarounds, so we
# enumerate the allowed-prefix shapes explicitly. The "AI names" branch
# below catches Co-Authored-By with named tools regardless of the email
# domain, so dropping `users.noreply.github.com` from the noreply
# pattern only relaxes the check for human collaborators — never for AI.
if any_segment_matches "$CMD" 'Co-Authored-By:.*noreply@(anthropic\.com|openai\.com|github-copilot|github\.com|claude\.ai|chatgpt\.com|googlemail\.com|google\.com|cursor\.com|codeium\.com|tabnine\.com|amazon\.com|amazonaws\.com|amazon-q\.amazonaws\.com|cody\.dev|sourcegraph\.com)'; then
  FOUND=1
fi

# Co-Authored-By with known AI names
if any_segment_matches "$CMD" 'Co-Authored-By:.*\b(Claude|Sonnet|Opus|Haiku|Copilot|GPT|ChatGPT|Gemini|Cursor|Codeium|Tabnine|Amazon Q|CodeWhisperer|Devin|Windsurf|Cline|Aider|Anthropic|OpenAI|GitHub Copilot)\b'; then
  FOUND=1
fi

# "Generated/Built/Powered with/by [AI Tool]" lines
if any_segment_matches "$CMD" '(Generated|Created|Built|Powered|Authored|Written|Produced)[[:space:]]+(with|by)[[:space:]]+(Claude|Copilot|GPT|ChatGPT|Gemini|Cursor|Codeium|Tabnine|CodeWhisperer|Devin|Windsurf|Cline|Aider|AI|an? AI)\b'; then
  FOUND=1
fi

# Markdown-linked attribution
# 0.16.2 helix-017 P3 #4: anchor on `[Text](` (markdown link shape) so
# legitimate bracketed mentions like `gh pr edit --body "support [Claude
# Code] hook output"` don't false-positive. The actual attribution we
# care about is structural — `Generated with [Claude Code](https://...)`.
if any_segment_matches "$CMD" '\[Claude Code\]\(|\[GitHub Copilot\]\(|\[ChatGPT\]\(|\[Gemini\]\(|\[Cursor\]\('; then
  FOUND=1
fi

# Emoji attribution
if any_segment_matches "$CMD" '🤖.*[Gg]enerated'; then
  FOUND=1
fi

if [[ $FOUND -eq 1 ]]; then
  {
    printf '\n'
    printf '═══════════════════════════════════════════════════════════════════\n'
    printf '  BLOCKED: AI attribution detected in command\n'
    printf '═══════════════════════════════════════════════════════════════════\n'
    printf '\n'
    printf '  Your command contains structural AI attribution markers.\n'
    printf '\n'
    printf '  What gets BLOCKED (structural attribution):\n'
    printf '    - Co-Authored-By with AI names or noreply@ emails\n'
    printf '    - "Generated with/by [AI Tool]" footer lines\n'
    printf '    - Markdown-linked tool names: [Claude Code](...)\n'
    printf '    - Emoji attribution: 🤖 Generated...\n'
    printf '\n'
    printf '  What is ALLOWED (legitimate references):\n'
    printf '    - "Fix Claude API integration"\n'
    printf '    - "Update OpenAI SDK version"\n'
    printf '    - "Add Copilot config"\n'
    printf '\n'
    printf '  Remove the attribution markers and rewrite the command.\n'
    printf '  To disable: set block_ai_attribution: false in .rea/policy.yaml\n'
    printf '═══════════════════════════════════════════════════════════════════\n'
    printf '\n'
  } >&2
  exit 2
fi

# No attribution found — allow
exit 0
