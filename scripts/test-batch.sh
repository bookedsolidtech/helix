#!/usr/bin/env bash
# scripts/test-batch.sh — Single-process sequential test runner
# Runs ALL component tests through ONE Chromium instance with sequential
# file execution. No batch splitting, no browser restarts between files.
#
# Usage:
#   ./scripts/test-batch.sh              # Run all tests sequentially (one Chromium)
#   ./scripts/test-batch.sh --dry-run    # Show test files without running
#
# Why --no-file-parallelism:
#   Docker Desktop's VirtioFS storage driver crashes when Chromium + Vitest
#   hammer disk I/O with 80+ test files simultaneously. This flag runs files
#   one at a time through a SINGLE browser instance — same I/O profile as
#   the old 10-file batches but without the 60-105s of Chromium restart overhead.
#
# Previous approach (v1) launched a new vitest process per batch of 10 files.
# Each process started Chromium, ran tests, tore down. 9 batches = 9 Chromium
# startups = ~90s of pure waste. This version: 1 startup, 85 files, 1 teardown.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIBRARY_DIR="$REPO_ROOT/packages/hx-library"
DRY_RUN=false

# ── Parse arguments ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: $0 [--dry-run]"
      exit 1
      ;;
  esac
done

# ── Discover test files ──────────────────────────────────────────────────────
RELATIVE_FILES=()
while IFS= read -r f; do
  RELATIVE_FILES+=("${f#"$LIBRARY_DIR/"}")
done < <(find "$LIBRARY_DIR/src/components" -name "*.test.ts" -type f | sort)

TOTAL_FILES=${#RELATIVE_FILES[@]}
if [[ "$TOTAL_FILES" -eq 0 ]]; then
  echo "ERROR: No test files found in $LIBRARY_DIR/src/components"
  exit 1
fi

echo "============================================="
echo "  HELiX Sequential Test Runner (v2)"
echo "============================================="
echo "Test files:    $TOTAL_FILES"
echo "Strategy:      Single Chromium, sequential files"
echo "Flag:          --no-file-parallelism"
echo "============================================="
echo ""

# ── Dry run: list files and exit ─────────────────────────────────────────────
if [[ "$DRY_RUN" == true ]]; then
  for f in "${RELATIVE_FILES[@]}"; do
    name=$(echo "$f" | sed -E 's|src/components/(hx-[^/]+)/.*|\1|; s|src/components/__tests__/(.*)|\1|')
    echo "  $name — $f"
  done
  echo ""
  echo "Run without --dry-run to execute."
  exit 0
fi

# ── Run all tests in one process ─────────────────────────────────────────────
START_TIME=$(date +%s)

cd "$LIBRARY_DIR"
if pnpm exec vitest run --no-file-parallelism --reporter=verbose; then
  STATUS="PASSED"
  EXIT_CODE=0
else
  STATUS="FAILED"
  EXIT_CODE=1
fi

END_TIME=$(date +%s)
DURATION=$(( END_TIME - START_TIME ))

echo ""
echo "============================================="
echo "  $STATUS — $TOTAL_FILES test files in ${DURATION}s"
echo "  (1 Chromium instance, sequential execution)"
echo "============================================="

exit $EXIT_CODE
