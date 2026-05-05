#!/usr/bin/env bash
# changeset-security-gate.sh — PreToolUse: Write|Edit
#
# Guards .changeset/*.md files against two failure modes:
#
# 1. SECURITY DISCLOSURE LEAK — GHSA IDs or CVE numbers written to a changeset
#    file before the advisory is published. Changeset files are committed to git
#    and appear verbatim in CHANGELOG.md — referencing a GHSA ID pre-publish
#    creates public pre-disclosure in git history.
#
# 2. MISSING OR MALFORMED FRONTMATTER — changeset files without proper frontmatter
#    are silently ignored by the changesets tool, wasting the release entry.
#
# Triggered by: PreToolUse — Write and Edit tools

set -euo pipefail

# shellcheck source=_lib/common.sh
source "$(dirname "$0")/_lib/common.sh"

check_halt

INPUT="$(cat)"
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')

# 0.15.0 fix: MultiEdit was not in the allowed tool_name set, so the gate
# silently exited 0 on every MultiEdit call against `.changeset/*.md` —
# letting GHSA / CVE pre-disclosure through and skipping frontmatter
# validation. 0.16.0: NotebookEdit added too (changesets are .md files
# but a malicious agent could in principle route a .md write through
# NotebookEdit's new_source path; cheap to allow, free to test).
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "MultiEdit" && "$TOOL_NAME" != "NotebookEdit" ]]; then
  exit 0
fi

require_jq

# 0.16.0: payload extraction migrated to `_lib/payload-read.sh`. Shared
# helpers handle every write-tier tool with the same defensive
# coercion. Adding the next write-tier tool is a one-line edit there.
# shellcheck source=_lib/payload-read.sh
source "$(dirname "$0")/_lib/payload-read.sh"

FILE_PATH=$(extract_file_path "$INPUT")

# Only care about .changeset/*.md files — exclude README.md (changeset tool metadata)
if ! echo "$FILE_PATH" | grep -qE '\.changeset/[^/]+\.md$' || echo "$FILE_PATH" | grep -qE '\.changeset/README\.md$'; then
  exit 0
fi

CONTENT=$(extract_write_content "$INPUT")

# ─── 1. SECURITY DISCLOSURE CHECK ───────────────────────────────────────────
#
# These patterns in a changeset mean security details are about to be committed
# to git history BEFORE the advisory is published — creating pre-disclosure.
# GHSA IDs and CVE numbers must NEVER appear in changeset files.

DISCLOSURE_PATTERNS=(
  'GHSA-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}'
  'CVE-[0-9]{4}-[0-9]+'
)

MATCHED_PATTERN=""
for PATTERN in "${DISCLOSURE_PATTERNS[@]}"; do
  if echo "$CONTENT" | grep -qE "$PATTERN"; then
    MATCHED_PATTERN="$PATTERN"
    break
  fi
done

if [[ -n "$MATCHED_PATTERN" ]]; then
  json_output "block" \
    "CHANGESET SECURITY GATE: This changeset contains a security advisory identifier (matched: '${MATCHED_PATTERN}').

Do NOT reference GHSA IDs or CVE numbers in changeset files before the advisory is published.
Changeset files are committed to git — this creates pre-disclosure in public history and CHANGELOG.

CORRECT approach for security fix changesets:
  Use vague language only — no identifiers, no vulnerability details.

  WRONG:  'fix(hooks): patch GHSA-3w3m-7gg4-f82g — symlink-guard now covers Edit tool'
  RIGHT:  'security: extend symlink protection to cover all write-capable tools'

  WRONG:  'security: fix CVE-2026-1234 prompt injection via tool descriptions'
  RIGHT:  'security: harden middleware chain against indirect instruction attacks'

After the release ships:
  1. Publish the GitHub Security Advisory (Security tab → Advisories → Publish)
  2. The GHSA becomes the detailed public disclosure document
  3. Optionally update CHANGELOG.md post-publish to add the GHSA reference"
fi

# ─── 2. FRONTMATTER VALIDATION ───────────────────────────────────────────────
#
# A changeset without valid frontmatter is silently ignored by the changesets
# tool — the package bump and CHANGELOG entry never appear in the release.
#
# 0.15.0 fix: skip frontmatter validation for MultiEdit. MultiEdit's
# `tool_input.edits[].new_string` payload is a list of partial string
# replacements, not the full file body — running the frontmatter
# validator against the concatenation of new_strings would reject every
# legitimate MultiEdit on an existing changeset (none of the edit
# fragments individually contains a frontmatter block, even though the
# resulting file does). The disclosure scan above still runs on
# MultiEdit content because GHSA/CVE patterns match per-fragment without
# any structural assumption.
if [[ "$TOOL_NAME" == "MultiEdit" ]]; then
  exit 0
fi

# Must start with ---
if ! echo "$CONTENT" | head -1 | grep -qE '^---'; then
  json_output "block" \
    "CHANGESET FORMAT GATE: Missing frontmatter block.

Every changeset must start with a frontmatter block specifying which package to bump:

---
'@bookedsolid/rea': patch
---

Brief description of what changed and why (close #N if applicable).

Bump types: patch (bug fix/security), minor (new feature), major (breaking change)"
fi

# Must have at least one package bump entry and a closing ---.
# 0.15.0 fix: accept single-quoted, double-quoted, AND unquoted package
# names (all three are valid YAML for the same string). Pre-fix the
# regex required single quotes, so a tool or human authoring the
# changeset with `"@scope/name": patch` was rejected as malformed even
# though the Changesets tool itself accepts every form.
#
# Codex round-1 P2-1 fix: explicit-alternation form (no backref) so
# the unquoted variant matches on BSD grep too. The earlier
# `^([\"']?)[^\"']+\1: ...` shape relied on backref-with-empty-capture
# semantics that BSD's grep rejects when the capture group's `?` made
# it absent — quoted forms matched on macOS but unquoted did not.
FRONTMATTER=$(echo "$CONTENT" | awk '/^---/{count++; if(count==2){exit} next} count==1{print}')
if ! echo "$FRONTMATTER" | grep -qE "^(\"[^\"]+\"|'[^']+'|[^\"'[:space:]]+): (patch|minor|major)"; then
  json_output "block" \
    "CHANGESET FORMAT GATE: Frontmatter does not contain a valid package bump entry.

The frontmatter must include at least one package/bump pair:

---
'@bookedsolid/rea': patch
---

Valid bump types: patch | minor | major"
fi

# Must have a non-empty description after the closing ---
DESCRIPTION=$(echo "$CONTENT" | awk 'BEGIN{count=0} /^---/{count++; next} count>=2{print}' | grep -v '^[[:space:]]*$' | head -1 || true)
if [[ -z "$DESCRIPTION" ]]; then
  json_output "block" \
    "CHANGESET FORMAT GATE: Missing description after frontmatter.

Add a meaningful description explaining what changed and why:

---
'@bookedsolid/rea': patch
---

fix(gateway): policy-loader now uses async I/O with 500ms TTL cache

Previously, loadPolicy used fs.readFileSync on every tool invocation, blocking
the event loop under concurrency. Closes #34."
fi

exit 0
