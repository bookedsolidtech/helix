#!/usr/bin/env bash
# ============================================================================
# finalize-audit-batch.sh — Finalize and prepare batch for PR
# ============================================================================
# Consolidates changesets, validates state, and prepares the batch branch
# for PR creation.
#
# Usage:
#   scripts/finalize-audit-batch.sh [YYYYMMDD]
#
# If no date is provided, uses today's date.
# ============================================================================

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
DATE="${1:-$(date +%Y%m%d)}"
BRANCH_NAME="audit/deep-quality-batch-${DATE}"
METADATA_FILE="${REPO_ROOT}/.automaker/audits/batch-${DATE}-metadata.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ── Color output ─────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ── Validate state ───────────────────────────────────────────────────────────

CURRENT_BRANCH=$(git branch --show-current)
if [ "${CURRENT_BRANCH}" != "${BRANCH_NAME}" ]; then
  log_error "Not on batch branch. Expected: ${BRANCH_NAME}, Got: ${CURRENT_BRANCH}"
  log_info "Run: git checkout ${BRANCH_NAME}"
  exit 1
fi

if [ ! -f "${METADATA_FILE}" ]; then
  log_error "Metadata file not found: ${METADATA_FILE}"
  exit 1
fi

# ── Read batch state ─────────────────────────────────────────────────────────

log_info "Reading batch metadata..."
BATCH_STATUS=$(node -e "const m=JSON.parse(require('fs').readFileSync('${METADATA_FILE}','utf-8')); console.log(JSON.stringify({completed: m.components.completed, failed: m.components.failed, skipped: m.components.skipped, queued: m.components.queued, total: m.components.total, status: m.status}))")

COMPLETED_COUNT=$(echo "${BATCH_STATUS}" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')); console.log(d.completed.length)")
FAILED_COUNT=$(echo "${BATCH_STATUS}" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')); console.log(d.failed.length)")
SKIPPED_COUNT=$(echo "${BATCH_STATUS}" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')); console.log(d.skipped.length)")
QUEUED_COUNT=$(echo "${BATCH_STATUS}" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')); console.log(d.queued.length)")
TOTAL_COUNT=$(echo "${BATCH_STATUS}" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')); console.log(d.total)")

log_info "Batch status: ${COMPLETED_COUNT}/${TOTAL_COUNT} completed, ${FAILED_COUNT} failed, ${SKIPPED_COUNT} skipped, ${QUEUED_COUNT} queued"

if [ "${QUEUED_COUNT}" -gt 0 ]; then
  log_warn "${QUEUED_COUNT} components still queued — finalizing anyway"
fi

# ── Check for existing individual changesets ─────────────────────────────────

log_info "Checking for changesets..."
CHANGESET_COUNT=$(find "${REPO_ROOT}/.changeset" -name "*.md" ! -name "README.md" ! -name "config.json" 2>/dev/null | wc -l | tr -d ' ')

if [ "${CHANGESET_COUNT}" -gt 1 ]; then
  log_warn "Found ${CHANGESET_COUNT} individual changesets — consolidation needed"
fi

# ── Generate consolidated changeset if not present ───────────────────────────

CHANGESET_FILENAME="audit-batch-${DATE}-$(date +%s).md"
CHANGESET_PATH="${REPO_ROOT}/.changeset/${CHANGESET_FILENAME}"

if [ ! -f "${CHANGESET_PATH}" ]; then
  log_info "Generating consolidated changeset..."

  # Build component summary from metadata
  COMPONENT_LIST=$(node -e "
    const m = JSON.parse(require('fs').readFileSync('${METADATA_FILE}', 'utf-8'));
    const all = [...m.components.completed, ...m.components.failed, ...m.components.skipped];
    all.forEach(c => console.log('- ' + c));
  ")

  cat > "${CHANGESET_PATH}" << CHANGESET_EOF
---
'@helixui/library': patch
---

audit: deep quality batch covering ${COMPLETED_COUNT} components

Components audited:
${COMPONENT_LIST}

Batch ID: batch-${DATE}
CHANGESET_EOF

  log_ok "Consolidated changeset created: ${CHANGESET_FILENAME}"
else
  log_info "Consolidated changeset already exists"
fi

# ── Update metadata to completed ─────────────────────────────────────────────

node -e "
  const fs = require('fs');
  const m = JSON.parse(fs.readFileSync('${METADATA_FILE}', 'utf-8'));
  m.status = 'finalized';
  m.updatedAt = '${TIMESTAMP}';
  m.completedAt = '${TIMESTAMP}';
  m.changeset.consolidated = true;
  m.changeset.filename = '${CHANGESET_FILENAME}';
  if (m.timing.startedAt) {
    const start = new Date(m.timing.startedAt);
    const end = new Date('${TIMESTAMP}');
    m.timing.completedAt = '${TIMESTAMP}';
    m.timing.totalDurationMinutes = Math.round((end - start) / 60000);
  }
  fs.writeFileSync('${METADATA_FILE}', JSON.stringify(m, null, 2) + '\n');
"

log_ok "Metadata updated to finalized"

# ── Stage and commit finalization ────────────────────────────────────────────

git add "${CHANGESET_PATH}" "${METADATA_FILE}"
if ! git diff --cached --quiet; then
  HUSKY=0 git commit -m "audit: finalize batch ${DATE} with consolidated changeset"
  log_ok "Finalization committed"
else
  log_info "No changes to commit"
fi

# ── Summary ──────────────────────────────────────────────────────────────────

echo ""
log_ok "Batch finalized successfully"
echo ""
echo "  Branch:     ${BRANCH_NAME}"
echo "  Completed:  ${COMPLETED_COUNT}/${TOTAL_COUNT}"
echo "  Failed:     ${FAILED_COUNT}"
echo "  Skipped:    ${SKIPPED_COUNT}"
echo "  Changeset:  ${CHANGESET_FILENAME}"
echo ""
echo "Next step: Create PR"
echo ""
echo "  gh pr create \\"
echo "    --repo bookedsolidtech/helix \\"
echo "    --base dev \\"
echo "    --title \"audit: deep quality batch ${DATE} (${COMPLETED_COUNT} components)\" \\"
echo "    --body \"[generated description]\" \\"
echo "    --label audit-batch --label deep-quality --label infra"
echo ""
echo "  # Then enable auto-merge:"
echo "  gh pr merge <PR_NUMBER> --auto --merge --repo bookedsolidtech/helix"
