#!/usr/bin/env bash
# security-disclosure-gate.sh — PreToolUse: Bash
#
# Intercepts `gh issue create` commands that contain security-sensitive
# keywords and blocks them. Routing depends on REA_DISCLOSURE_MODE:
#
#   advisory (default) — redirect to GitHub Security Advisories (private)
#                        Use for public OSS repos
#   issues             — redirect to gh issue create with security + internal labels
#                        Use for permanently private client repos
#   disabled           — pass through (not recommended)
#
# Set REA_DISCLOSURE_MODE in .rea/policy.yaml (written to settings.json
# env by rea init). Defaults to "advisory" when unset.
#
# Triggered by: PreToolUse — Bash tool

set -euo pipefail

# shellcheck source=_lib/common.sh
source "$(dirname "$0")/_lib/common.sh"

check_halt

# Read disclosure mode — default to advisory
DISCLOSURE_MODE="${REA_DISCLOSURE_MODE:-advisory}"

# Disabled mode: pass through entirely
if [[ "$DISCLOSURE_MODE" == "disabled" ]]; then
  exit 0
fi

INPUT="$(cat)"
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')

if [[ "$TOOL_NAME" != "Bash" ]]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Only intercept gh issue create
# 0.16.3 F8: anchor at segment start so `gh pr create --body "context: gh issue create earlier"`
# does not match. Same anchoring class as F5/F6 in this release. Source the
# segment splitter and use any_segment_starts_with — when the cmd-segments
# lib isn't reachable for any reason, fall back to the legacy unanchored
# grep (defense-in-depth: better to over-block prose mentions than miss a
# real `gh issue create`).
# shellcheck source=_lib/cmd-segments.sh
if [ -f "$(dirname "$0")/_lib/cmd-segments.sh" ]; then
  # shellcheck source=_lib/cmd-segments.sh
  source "$(dirname "$0")/_lib/cmd-segments.sh"
  if ! any_segment_starts_with "$COMMAND" 'gh[[:space:]]+issue[[:space:]]+create'; then
    exit 0
  fi
else
  if ! echo "$COMMAND" | grep -qE 'gh\s+issue\s+create'; then
    exit 0
  fi
fi

require_jq

# Security-sensitive keywords that should not appear in public issues —
# these terms suggest a vulnerability, exploit path, or bypass technique
SECURITY_PATTERNS=(
  # Vulnerability classes
  'bypass'
  'exploit'
  'injection'
  'traversal'
  'exfiltrat'
  'escalat'
  'privilege'
  'rce'
  'remote.code.exec'
  'arbitrary.code'
  'code.execution'
  'zero.day'
  '0day'
  'CVE-'
  'CVSS'
  'GHSA-'
  # Reagent-specific sensitive terms
  'hook.bypass'
  'HALT.bypass'
  'redaction.bypass'
  'policy.bypass'
  'middleware.bypass'
  'skip.*gate'
  'evad'
  # Credential/secret exposure
  'secret.*leak'
  'credential.*leak'
  'token.*leak'
  'key.*expos'
  'expos.*secret'
  # Prompt injection
  'prompt.inject'
  'jailbreak'
  'jail.break'
)

# Scan the full command text (title + body + flags) for sensitive patterns.
#
# 0.16.3 discord-ops Round 9 #2 fix: pre-fix the scan only saw what was on
# the command line, so `gh issue create --body-file leak.md` (or `-F`)
# routed the body through a file the regex never read. We now resolve the
# named flag's path argument(s), read up to 64 KiB of each (cap covers
# realistic issue bodies; a multi-megabyte body is suspicious in itself),
# and prepend the lowercased file contents to FULL_TEXT before the
# pattern scan. Stdin form (`-F -` or `--body-file -`) is intentionally
# skipped — the hook's stdin is the tool payload, not the issue body,
# and re-reading is impossible. Files outside REA_ROOT (resolved via
# `..` traversal) are refused as a defense-in-depth measure mirroring
# protected-paths-bash-gate.sh's outside-root sentinel.
REA_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
BODY_FILE_TEXT=""
_extract_body_file_paths() {
  # Emit each `--body-file PATH` and `-F PATH` argument on its own line.
  # Skips the stdin form (`-`) and `-F=foo`/`--body-file=foo` (handled
  # by a separate awk pass below).
  printf '%s' "$COMMAND" \
    | awk '
        BEGIN { skip_next = 0; flag_was = "" }
        {
          n = split($0, toks, /[[:space:]]+/)
          for (i = 1; i <= n; i++) {
            t = toks[i]
            if (skip_next) {
              skip_next = 0
              if (t == "-" || t == "") continue
              # Strip surrounding quotes from the token if present.
              gsub(/^["'"'"']/, "", t)
              gsub(/["'"'"']$/, "", t)
              print t
              continue
            }
            if (t == "--body-file" || t == "-F") { skip_next = 1; continue }
            # Equals form.
            if (t ~ /^--body-file=/) {
              v = substr(t, length("--body-file=") + 1)
              gsub(/^["'"'"']/, "", v); gsub(/["'"'"']$/, "", v)
              if (v != "" && v != "-") print v
            }
            if (t ~ /^-F=/) {
              v = substr(t, length("-F=") + 1)
              gsub(/^["'"'"']/, "", v); gsub(/["'"'"']$/, "", v)
              if (v != "" && v != "-") print v
            }
          }
        }'
}
while IFS= read -r body_path; do
  [[ -z "$body_path" ]] && continue
  raw_path="$body_path"
  # Resolve relative to the hook's cwd (the agent's project dir). gh
  # accepts both absolute paths (e.g. tmpfiles like /var/folders/…) and
  # cwd-relative paths; we honor both. Absolute paths NOT containing
  # `..` are taken at face value.
  if [[ "$body_path" != /* ]]; then
    body_path="$(pwd)/$body_path"
  fi
  # Walk `..` segments. The only outside-REA_ROOT shape we refuse is one
  # where the canonical form contains `..` (i.e. an explicit traversal
  # by the caller). Plain absolute tmp paths are NOT refused — gh issue
  # body-files are very commonly written to /var/folders or /tmp and
  # rejecting those would defeat the scan in routine use.
  had_traversal=0
  case "/$raw_path/" in */../*) had_traversal=1 ;; esac
  resolved="$body_path"
  if [[ "$had_traversal" -eq 1 ]]; then
    IFS='/' read -ra _bf_parts_raw <<<"$body_path"
    _bf_parts=()
    for _seg in "${_bf_parts_raw[@]}"; do
      case "$_seg" in
        ''|.) continue ;;
        ..) [[ "${#_bf_parts[@]}" -gt 0 ]] && unset '_bf_parts[${#_bf_parts[@]}-1]' ;;
        *) _bf_parts+=("$_seg") ;;
      esac
    done
    resolved="/$(IFS=/; printf '%s' "${_bf_parts[*]}")"
    # If the raw path used `..` AND the resolved form escapes REA_ROOT,
    # refuse — that's the obfuscation shape we care about. A file under
    # /tmp or /var/folders without `..` segments is fine.
    if [[ "$resolved" != "$REA_ROOT" && "$resolved" != "$REA_ROOT"/* ]]; then
      printf 'security-disclosure-gate: --body-file path uses `..` traversal escaping project root; skipping body scan\n' >&2
      continue
    fi
  fi
  if [[ ! -r "$resolved" ]]; then
    printf 'security-disclosure-gate: --body-file %s unreadable; skipping body scan\n' "$raw_path" >&2
    continue
  fi
  # Cap at 64 KiB. Lowercase to match FULL_TEXT case folding.
  body_chunk=$(head -c 65536 "$resolved" 2>/dev/null | tr '[:upper:]' '[:lower:]') || body_chunk=""
  if [[ -n "$body_chunk" ]]; then
    BODY_FILE_TEXT="${BODY_FILE_TEXT}
${body_chunk}"
  fi
done < <(_extract_body_file_paths)

FULL_TEXT="${BODY_FILE_TEXT}
$(echo "$COMMAND" | tr '[:upper:]' '[:lower:]')"

MATCHED_PATTERN=""
for PATTERN in "${SECURITY_PATTERNS[@]}"; do
  if echo "$FULL_TEXT" | grep -qiE "$PATTERN"; then
    MATCHED_PATTERN="$PATTERN"
    break
  fi
done

if [[ -z "$MATCHED_PATTERN" ]]; then
  exit 0
fi

# ─── Route based on disclosure mode ──────────────────────────────────────────

if [[ "$DISCLOSURE_MODE" == "issues" ]]; then
  # Private repo mode: redirect to labeled internal issue
  json_output "block" \
    "SECURITY DISCLOSURE GATE: This issue appears to describe a security finding (matched: '${MATCHED_PATTERN}').

This project is configured for PRIVATE disclosure (REA_DISCLOSURE_MODE=issues).

CORRECT PATH for security findings in this private repo:
  Use: gh issue create --label 'security,internal' --title '...' --body '...'

The 'security' and 'internal' labels keep this off public project boards and
mark it for maintainer-only triage. Do NOT use the public issue queue without
these labels for security findings.

If this is NOT a security finding, rephrase the title/body to avoid triggering
security patterns, then retry."

else
  # Advisory mode (default): redirect to GitHub Security Advisories
  json_output "block" \
    "SECURITY DISCLOSURE GATE: This issue appears to describe a security vulnerability (matched: '${MATCHED_PATTERN}'). Do NOT create a public GitHub issue for security vulnerabilities.

CORRECT DISCLOSURE PATH:
1. Use GitHub Security Advisories (private):
   gh api repos/{owner}/{repo}/security-advisories --method POST --input - <<'JSON'
   { \"summary\": \"...\", \"description\": \"...\", \"severity\": \"medium|high|critical\",
     \"vulnerabilities\": [{\"package\": {\"name\": \"@pkg\", \"ecosystem\": \"npm\"}}] }
   JSON
2. Or navigate to: Security tab → Advisories → 'Report a vulnerability'
3. Or email security@bookedsolid.tech (see SECURITY.md)

The finding will be publicly disclosed AFTER a patch is released (coordinated disclosure).

WHY: Public issues expose vulnerabilities before users can patch. This is enforced by the
security-disclosure-gate hook (REA_DISCLOSURE_MODE=${DISCLOSURE_MODE}).

If this is NOT a security vulnerability, rephrase the issue to avoid triggering
security patterns, then retry."
fi

exit 2
