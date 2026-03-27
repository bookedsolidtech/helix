#!/usr/bin/env bash
# scripts/test-batch.sh — Batched test runner for all component tests
# Runs the full test suite in small batches to avoid Docker Desktop OOM/RWLayer crashes.
#
# Usage:
#   ./scripts/test-batch.sh              # Run all tests in batches of 10
#   BATCH_SIZE=5 ./scripts/test-batch.sh  # Run in batches of 5
#   ./scripts/test-batch.sh --dry-run     # Show batches without running
#
# Why: Docker Desktop's VirtioFS storage driver crashes (exit 137, RWLayer nil)
# when Chromium + Vitest hammer disk I/O with 80+ test files simultaneously.
# Smart tests avoid this by testing only changed components (1-5 at a time).
# This script brings that same approach to the full suite: N components per batch.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIBRARY_DIR="$REPO_ROOT/packages/hx-library"
BATCH_SIZE="${BATCH_SIZE:-10}"
DRY_RUN=false

# ── Parse arguments ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --batch-size)
      BATCH_SIZE="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: $0 [--dry-run] [--batch-size N]"
      exit 1
      ;;
  esac
done

# ── Discover test files ──────────────────────────────────────────────────────
# Collect all component test files, including nested __tests__ dirs
# Use a while-read loop for bash 3.x compatibility (macOS ships bash 3)
RELATIVE_FILES=()
while IFS= read -r f; do
  RELATIVE_FILES+=("${f#"$LIBRARY_DIR/"}")
done < <(find "$LIBRARY_DIR/src/components" -name "*.test.ts" -type f | sort)

TOTAL_FILES=${#RELATIVE_FILES[@]}
if [[ "$TOTAL_FILES" -eq 0 ]]; then
  echo "ERROR: No test files found in $LIBRARY_DIR/src/components"
  exit 1
fi

# ── Split into batches ───────────────────────────────────────────────────────
TOTAL_BATCHES=$(( (TOTAL_FILES + BATCH_SIZE - 1) / BATCH_SIZE ))

echo "============================================="
echo "  HELiX Batched Test Runner"
echo "============================================="
echo "Test files:  $TOTAL_FILES"
echo "Batch size:  $BATCH_SIZE"
echo "Batches:     $TOTAL_BATCHES"
echo "Dry run:     $DRY_RUN"
echo "============================================="
echo ""

# ── Dry run: show batches and exit ───────────────────────────────────────────
if [[ "$DRY_RUN" == true ]]; then
  for (( batch=0; batch < TOTAL_BATCHES; batch++ )); do
    start=$(( batch * BATCH_SIZE ))
    end=$(( start + BATCH_SIZE ))
    if (( end > TOTAL_FILES )); then
      end=$TOTAL_FILES
    fi
    count=$(( end - start ))

    # Extract component names for display
    names=()
    for (( i=start; i < end; i++ )); do
      # Pull component name from path like src/components/hx-button/hx-button.test.ts
      name=$(echo "${RELATIVE_FILES[$i]}" | sed -E 's|src/components/(hx-[^/]+)/.*|\1|; s|src/components/__tests__/(.*)|\1|')
      names+=("$name")
    done
    name_list=$(printf ", %s" "${names[@]}")
    name_list="${name_list:2}"

    echo "Batch $((batch + 1))/$TOTAL_BATCHES ($count files): $name_list"
  done
  echo ""
  echo "Run without --dry-run to execute."
  exit 0
fi

# ── Run batches ──────────────────────────────────────────────────────────────
OVERALL_START=$(date +%s)
FAILED_BATCHES=()
PASSED_BATCHES=0
TOTAL_TESTS_RUN=0
BATCH_RESULTS=()

for (( batch=0; batch < TOTAL_BATCHES; batch++ )); do
  start=$(( batch * BATCH_SIZE ))
  end=$(( start + BATCH_SIZE ))
  if (( end > TOTAL_FILES )); then
    end=$TOTAL_FILES
  fi
  count=$(( end - start ))

  # Collect files for this batch
  batch_files=()
  names=()
  for (( i=start; i < end; i++ )); do
    batch_files+=("${RELATIVE_FILES[$i]}")
    name=$(echo "${RELATIVE_FILES[$i]}" | sed -E 's|src/components/(hx-[^/]+)/.*|\1|')
    names+=("$name")
  done

  # Deduplicate component names for display
  unique_names=$(printf "%s\n" "${names[@]}" | sort -u | tr '\n' ', ' | sed 's/,$//' | sed 's/,/, /g')

  echo "---------------------------------------------"
  echo "Batch $((batch + 1))/$TOTAL_BATCHES ($count files): $unique_names"
  echo "---------------------------------------------"

  BATCH_START=$(date +%s)

  # Run vitest with explicit include paths for this batch
  # Use --reporter=verbose for detailed output, --run for non-watch mode
  if cd "$LIBRARY_DIR" && pnpm exec vitest run --reporter=verbose "${batch_files[@]}"; then
    BATCH_END=$(date +%s)
    BATCH_DURATION=$(( BATCH_END - BATCH_START ))
    PASSED_BATCHES=$(( PASSED_BATCHES + 1 ))
    BATCH_RESULTS+=("PASSED  Batch $((batch + 1))/$TOTAL_BATCHES: $unique_names (${BATCH_DURATION}s)")
    echo ""
    echo "Batch $((batch + 1))/$TOTAL_BATCHES: PASSED (${BATCH_DURATION}s)"
    echo ""
  else
    BATCH_END=$(date +%s)
    BATCH_DURATION=$(( BATCH_END - BATCH_START ))
    FAILED_BATCHES+=("$((batch + 1))")
    BATCH_RESULTS+=("FAILED  Batch $((batch + 1))/$TOTAL_BATCHES: $unique_names (${BATCH_DURATION}s)")
    echo ""
    echo "Batch $((batch + 1))/$TOTAL_BATCHES: FAILED (${BATCH_DURATION}s)"
    echo ""
  fi
done

OVERALL_END=$(date +%s)
OVERALL_DURATION=$(( OVERALL_END - OVERALL_START ))

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "============================================="
echo "  Batch Test Results"
echo "============================================="
for result in "${BATCH_RESULTS[@]}"; do
  echo "  $result"
done
echo "---------------------------------------------"
echo "  Passed: $PASSED_BATCHES/$TOTAL_BATCHES batches"
echo "  Total:  $TOTAL_FILES test files, ${OVERALL_DURATION}s"
echo "============================================="

if [[ ${#FAILED_BATCHES[@]} -gt 0 ]]; then
  failed_list=$(printf ", %s" "${FAILED_BATCHES[@]}")
  failed_list="${failed_list:2}"
  echo ""
  echo "FAILED batches: $failed_list"
  echo "Re-run failed batches individually to debug."
  exit 1
fi

echo ""
echo "All $TOTAL_BATCHES batches passed ($TOTAL_FILES test files, ${OVERALL_DURATION}s total)"
exit 0
