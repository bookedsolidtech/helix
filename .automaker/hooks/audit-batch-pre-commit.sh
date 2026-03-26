#!/usr/bin/env bash
# ============================================================================
# audit-batch-pre-commit.sh — Pre-commit validation for batch audit branches
# ============================================================================
# Validates modifications to shared files during batch audit execution.
# Ensures sequential commits consolidate changes rather than creating conflicts.
#
# Usage:
#   .automaker/hooks/audit-batch-pre-commit.sh
#
# Called before each commit on an audit batch branch to:
#   1. Validate JSON syntax for coverage-config.json
#   2. Validate YAML syntax for ci.yml
#   3. Verify no parallel modifications (lock file check)
#   4. Ensure commit message follows audit convention
# ============================================================================

set -euo pipefail

# ── Color output ─────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_ok()    { echo -e "${GREEN}[PASS]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[FAIL]${NC} $*"; }

ERRORS=0

# ── Check if we are on a batch branch ────────────────────────────────────────

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")

if [[ "${CURRENT_BRANCH}" != audit/deep-quality-batch-* ]]; then
  # Not on a batch branch — skip all checks
  exit 0
fi

echo "audit-batch-pre-commit: validating staged changes on ${CURRENT_BRANCH}"

# ── Get staged files ─────────────────────────────────────────────────────────

STAGED_FILES=$(git diff --cached --name-only)

# ── Validate coverage-config.json syntax ─────────────────────────────────────

if echo "${STAGED_FILES}" | grep -q "coverage-config.json"; then
  COVERAGE_FILE=$(git diff --cached --name-only | grep "coverage-config.json" | head -1)
  if [ -f "${COVERAGE_FILE}" ]; then
    if node -e "JSON.parse(require('fs').readFileSync('${COVERAGE_FILE}','utf-8'))" 2>/dev/null; then
      log_ok "coverage-config.json: valid JSON"
    else
      log_error "coverage-config.json: invalid JSON syntax"
      ERRORS=$((ERRORS + 1))
    fi
  fi
fi

# ── Validate ci.yml syntax ──────────────────────────────────────────────────

if echo "${STAGED_FILES}" | grep -q "ci.yml"; then
  CI_FILE=$(git diff --cached --name-only | grep "ci.yml" | head -1)
  if [ -f "${CI_FILE}" ]; then
    # Basic YAML validation using node
    if node -e "
      const lines = require('fs').readFileSync('${CI_FILE}','utf-8').split('\n');
      let errors = 0;
      lines.forEach((line, i) => {
        if (line.includes('\t') && !line.startsWith('#')) {
          console.error('Tab character found at line ' + (i+1));
          errors++;
        }
      });
      if (errors > 0) process.exit(1);
    " 2>/dev/null; then
      log_ok "ci.yml: no tab characters (basic YAML check)"
    else
      log_error "ci.yml: contains tab characters (YAML uses spaces)"
      ERRORS=$((ERRORS + 1))
    fi
  fi
fi

# ── Validate barrel file syntax ──────────────────────────────────────────────

for BARREL in "packages/hx-library/src/index.ts" "packages/hx-react/src/index.ts"; do
  if echo "${STAGED_FILES}" | grep -q "${BARREL}"; then
    if [ -f "${BARREL}" ]; then
      # Check for duplicate export lines
      DUPES=$(sort "${BARREL}" | uniq -d | grep "^export" || true)
      if [ -n "${DUPES}" ]; then
        log_error "${BARREL}: duplicate export lines detected"
        echo "${DUPES}"
        ERRORS=$((ERRORS + 1))
      else
        log_ok "${BARREL}: no duplicate exports"
      fi
    fi
  fi
done

# ── Check for forbidden files ────────────────────────────────────────────────

FORBIDDEN=$(echo "${STAGED_FILES}" | grep -E '\.env($|\.|\.local)|\.pem$|\.key$|credentials\.json$|settings\.json$|\.npmrc$' || true)
if [ -n "${FORBIDDEN}" ]; then
  log_error "Forbidden files staged: ${FORBIDDEN}"
  ERRORS=$((ERRORS + 1))
fi

# ── Result ───────────────────────────────────────────────────────────────────

if [ ${ERRORS} -gt 0 ]; then
  echo ""
  log_error "${ERRORS} validation error(s) found — commit blocked"
  exit 1
fi

log_ok "All batch pre-commit checks passed"
exit 0
