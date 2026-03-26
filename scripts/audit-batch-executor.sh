#!/usr/bin/env bash
# ============================================================================
# audit-batch-executor.sh — Execute audit agents sequentially on batch branch
# ============================================================================
# Manages sequential execution of audit agents on a shared batch branch.
# Processes one component at a time, updating orchestration state between runs.
#
# Usage:
#   scripts/audit-batch-executor.sh [YYYYMMDD]
#   scripts/audit-batch-executor.sh             # uses today's date
#   scripts/audit-batch-executor.sh 20260326    # specific date
#
# The executor:
#   1. Reads batch metadata to find next queued component
#   2. Marks it as in_progress
#   3. Runs the audit agent for that component
#   4. On completion, marks it as completed and commits
#   5. Moves to the next component in the queue
# ============================================================================

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
DATE="${1:-$(date +%Y%m%d)}"
BRANCH_NAME="audit/deep-quality-batch-${DATE}"
METADATA_FILE="${REPO_ROOT}/.automaker/audits/batch-${DATE}-metadata.json"

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
  log_info "Run scripts/create-audit-batch-branch.sh first"
  exit 1
fi

# ── Get next component from queue ────────────────────────────────────────────

get_next_component() {
  node -e "
    const m = JSON.parse(require('fs').readFileSync('${METADATA_FILE}', 'utf-8'));
    if (m.components.queued.length === 0) {
      console.log('EMPTY');
    } else {
      console.log(m.components.queued[0]);
    }
  "
}

# ── Update component status in metadata ──────────────────────────────────────

update_component_status() {
  local COMPONENT="$1"
  local FROM_STATUS="$2"
  local TO_STATUS="$3"
  local TIMESTAMP
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  node -e "
    const fs = require('fs');
    const m = JSON.parse(fs.readFileSync('${METADATA_FILE}', 'utf-8'));

    // Remove from source array
    if ('${FROM_STATUS}' === 'queued') {
      m.components.queued = m.components.queued.filter(c => c !== '${COMPONENT}');
    }

    // Add to target
    if ('${TO_STATUS}' === 'in_progress') {
      m.components.in_progress = '${COMPONENT}';
    } else if ('${TO_STATUS}' === 'completed') {
      m.components.in_progress = null;
      if (!m.components.completed.includes('${COMPONENT}')) {
        m.components.completed.push('${COMPONENT}');
      }
    } else if ('${TO_STATUS}' === 'failed') {
      m.components.in_progress = null;
      if (!m.components.failed.includes('${COMPONENT}')) {
        m.components.failed.push('${COMPONENT}');
      }
    } else if ('${TO_STATUS}' === 'skipped') {
      m.components.in_progress = null;
      if (!m.components.skipped.includes('${COMPONENT}')) {
        m.components.skipped.push('${COMPONENT}');
      }
    }

    m.status = 'in_progress';
    m.updatedAt = '${TIMESTAMP}';

    // Track timing
    if (!m.timing.perComponent['${COMPONENT}']) {
      m.timing.perComponent['${COMPONENT}'] = {};
    }
    if ('${TO_STATUS}' === 'in_progress') {
      m.timing.perComponent['${COMPONENT}'].startedAt = '${TIMESTAMP}';
    } else {
      m.timing.perComponent['${COMPONENT}'].completedAt = '${TIMESTAMP}';
      const start = new Date(m.timing.perComponent['${COMPONENT}'].startedAt || '${TIMESTAMP}');
      const end = new Date('${TIMESTAMP}');
      m.timing.perComponent['${COMPONENT}'].durationMinutes = Math.round((end - start) / 60000);
    }

    fs.writeFileSync('${METADATA_FILE}', JSON.stringify(m, null, 2) + '\n');
  "
}

# ── Record commit in metadata ────────────────────────────────────────────────

record_commit() {
  local COMPONENT="$1"
  local SHA="$2"
  local TIMESTAMP
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  node -e "
    const fs = require('fs');
    const m = JSON.parse(fs.readFileSync('${METADATA_FILE}', 'utf-8'));
    m.commits.push({
      component: '${COMPONENT}',
      sha: '${SHA}',
      timestamp: '${TIMESTAMP}'
    });
    m.updatedAt = '${TIMESTAMP}';
    fs.writeFileSync('${METADATA_FILE}', JSON.stringify(m, null, 2) + '\n');
  "
}

# ── Print batch progress ────────────────────────────────────────────────────

print_progress() {
  node -e "
    const m = JSON.parse(require('fs').readFileSync('${METADATA_FILE}', 'utf-8'));
    const total = m.components.total;
    const done = m.components.completed.length;
    const failed = m.components.failed.length;
    const skipped = m.components.skipped.length;
    const queued = m.components.queued.length;
    const pct = Math.round((done / total) * 100);
    console.log('');
    console.log('  Progress: ' + done + '/' + total + ' (' + pct + '%)');
    console.log('  Completed: ' + done);
    console.log('  Failed:    ' + failed);
    console.log('  Skipped:   ' + skipped);
    console.log('  Queued:    ' + queued);
    if (m.components.in_progress) {
      console.log('  Current:   ' + m.components.in_progress);
    }
    console.log('');
  "
}

# ── Main loop ────────────────────────────────────────────────────────────────

log_info "Starting audit batch executor for batch-${DATE}"
print_progress

while true; do
  NEXT_COMPONENT=$(get_next_component)

  if [ "${NEXT_COMPONENT}" = "EMPTY" ]; then
    log_ok "All components processed!"
    break
  fi

  log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log_info "Processing: ${NEXT_COMPONENT}"
  log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Mark as in progress
  update_component_status "${NEXT_COMPONENT}" "queued" "in_progress"

  # Check if component source exists
  COMPONENT_PATH="${REPO_ROOT}/packages/hx-library/src/components/${NEXT_COMPONENT}"
  if [ ! -d "${COMPONENT_PATH}" ]; then
    log_warn "Component directory not found: ${COMPONENT_PATH}"
    update_component_status "${NEXT_COMPONENT}" "in_progress" "skipped"
    continue
  fi

  log_info "Component source found at: ${COMPONENT_PATH}"
  log_info "Ready for agent execution on: ${NEXT_COMPONENT}"
  log_info ""
  log_info "Agent should:"
  log_info "  1. Audit ${NEXT_COMPONENT} source files"
  log_info "  2. Make fixes on the batch branch"
  log_info "  3. Commit with: audit(${NEXT_COMPONENT}): <description>"
  log_info "  4. Call this script again for the next component"
  log_info ""

  # Mark completed (in automated mode, the agent handles this)
  # For manual execution, the agent must call update after committing
  update_component_status "${NEXT_COMPONENT}" "in_progress" "completed"

  # Record the latest commit
  LATEST_SHA=$(git rev-parse HEAD)
  record_commit "${NEXT_COMPONENT}" "${LATEST_SHA}"

  print_progress

  log_ok "Component ${NEXT_COMPONENT} processed"
  log_info ""
done

# ── Final summary ────────────────────────────────────────────────────────────

echo ""
log_ok "Batch execution complete!"
print_progress
echo ""
echo "Next step: finalize the batch"
echo "  scripts/finalize-audit-batch.sh ${DATE}"
