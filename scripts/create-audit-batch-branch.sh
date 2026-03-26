#!/usr/bin/env bash
# ============================================================================
# create-audit-batch-branch.sh — Initialize an audit batch branch
# ============================================================================
# Creates a single branch for batch audit execution from latest dev.
# If the branch already exists, resumes the existing batch.
#
# Usage:
#   scripts/create-audit-batch-branch.sh [component1] [component2] ...
#
# Example:
#   scripts/create-audit-batch-branch.sh hx-button hx-card hx-dialog
#
# Output:
#   - Branch: audit/deep-quality-batch-YYYYMMDD
#   - Metadata: .automaker/audits/batch-YYYYMMDD-metadata.json
# ============================================================================

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
DATE=$(date +%Y%m%d)
BRANCH_NAME="audit/deep-quality-batch-${DATE}"
METADATA_DIR="${REPO_ROOT}/.automaker/audits"
METADATA_FILE="${METADATA_DIR}/batch-${DATE}-metadata.json"
BASE_BRANCH="dev"

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

# ── Validate inputs ─────────────────────────────────────────────────────────

if [ $# -eq 0 ]; then
  log_error "No components specified."
  echo ""
  echo "Usage: $0 [component1] [component2] ..."
  echo "Example: $0 hx-button hx-card hx-dialog"
  exit 1
fi

COMPONENTS=("$@")
COMPONENT_COUNT=${#COMPONENTS[@]}

log_info "Initializing audit batch with ${COMPONENT_COUNT} components"
log_info "Branch: ${BRANCH_NAME}"

# ── Ensure we are on dev and up to date ──────────────────────────────────────

log_info "Fetching latest from origin..."
git fetch origin "${BASE_BRANCH}" --quiet

# ── Check if batch branch already exists ─────────────────────────────────────

if git rev-parse --verify "refs/heads/${BRANCH_NAME}" >/dev/null 2>&1; then
  log_warn "Batch branch ${BRANCH_NAME} already exists — resuming existing batch"

  if [ -f "${METADATA_FILE}" ]; then
    log_ok "Metadata file found: ${METADATA_FILE}"
    EXISTING_STATUS=$(node -e "const m=JSON.parse(require('fs').readFileSync('${METADATA_FILE}','utf-8')); console.log(m.status)")
    log_info "Existing batch status: ${EXISTING_STATUS}"

    if [ "${EXISTING_STATUS}" = "completed" ]; then
      log_error "Batch is already completed. Start a new batch for today or use a different date."
      exit 1
    fi
  else
    log_warn "No metadata file found — creating fresh metadata for existing branch"
  fi

  git checkout "${BRANCH_NAME}"
else
  log_info "Creating new batch branch from origin/${BASE_BRANCH}..."
  git checkout -b "${BRANCH_NAME}" "origin/${BASE_BRANCH}"
  log_ok "Branch created: ${BRANCH_NAME}"
fi

# ── Create metadata directory if needed ──────────────────────────────────────

mkdir -p "${METADATA_DIR}"

# ── Build components JSON array ──────────────────────────────────────────────

COMPONENTS_JSON="["
for i in "${!COMPONENTS[@]}"; do
  if [ $i -gt 0 ]; then
    COMPONENTS_JSON+=","
  fi
  COMPONENTS_JSON+="\"${COMPONENTS[$i]}\""
done
COMPONENTS_JSON+="]"

# ── Get base commit SHA ──────────────────────────────────────────────────────

BASE_COMMIT=$(git rev-parse HEAD)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ── Create or update metadata file ──────────────────────────────────────────

if [ ! -f "${METADATA_FILE}" ]; then
  cat > "${METADATA_FILE}" << METADATA_EOF
{
  "batchId": "batch-${DATE}",
  "branch": "${BRANCH_NAME}",
  "baseBranch": "${BASE_BRANCH}",
  "baseCommit": "${BASE_COMMIT}",
  "status": "initialized",
  "auditType": "deep-quality",
  "createdAt": "${TIMESTAMP}",
  "updatedAt": "${TIMESTAMP}",
  "completedAt": null,
  "components": {
    "total": ${COMPONENT_COUNT},
    "list": ${COMPONENTS_JSON},
    "queued": ${COMPONENTS_JSON},
    "in_progress": null,
    "completed": [],
    "skipped": [],
    "failed": []
  },
  "commits": [],
  "changeset": {
    "consolidated": false,
    "filename": null,
    "bumpType": "patch",
    "scope": "@helixui/library"
  },
  "pr": {
    "number": null,
    "url": null,
    "status": null,
    "autoMergeEnabled": false
  },
  "timing": {
    "startedAt": "${TIMESTAMP}",
    "completedAt": null,
    "totalDurationMinutes": null,
    "perComponent": {}
  },
  "ci": {
    "runId": null,
    "status": null,
    "url": null,
    "jobCount": null
  }
}
METADATA_EOF

  log_ok "Metadata created: ${METADATA_FILE}"
else
  log_info "Metadata file already exists — appending new components if any"
  # Update the updatedAt timestamp
  node -e "
    const fs = require('fs');
    const m = JSON.parse(fs.readFileSync('${METADATA_FILE}', 'utf-8'));
    const newComponents = ${COMPONENTS_JSON};
    const existing = new Set(m.components.list);
    let added = 0;
    for (const c of newComponents) {
      if (!existing.has(c)) {
        m.components.list.push(c);
        m.components.queued.push(c);
        m.components.total = m.components.list.length;
        added++;
      }
    }
    m.updatedAt = '${TIMESTAMP}';
    fs.writeFileSync('${METADATA_FILE}', JSON.stringify(m, null, 2) + '\n');
    if (added > 0) console.log('Added ' + added + ' new components to batch');
    else console.log('No new components to add');
  "
fi

# ── Commit metadata ─────────────────────────────────────────────────────────

git add "${METADATA_FILE}"
if git diff --cached --quiet; then
  log_info "No metadata changes to commit"
else
  HUSKY=0 git commit -m "audit: initialize batch ${DATE} with ${COMPONENT_COUNT} components"
  log_ok "Metadata committed"
fi

# ── Summary ──────────────────────────────────────────────────────────────────

echo ""
log_ok "Audit batch initialized successfully"
echo ""
echo "  Branch:     ${BRANCH_NAME}"
echo "  Components: ${COMPONENT_COUNT}"
echo "  Metadata:   ${METADATA_FILE}"
echo ""
echo "Components in queue:"
for comp in "${COMPONENTS[@]}"; do
  echo "  - ${comp}"
done
echo ""
echo "Next steps:"
echo "  1. Run audit agents sequentially via scripts/audit-batch-executor.sh"
echo "  2. Each agent commits to this branch after auditing one component"
echo "  3. When all done, run scripts/finalize-audit-batch.sh"
echo "  4. Create PR and enable auto-merge"
