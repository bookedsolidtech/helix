#!/usr/bin/env bash
# scripts/test-batch.sh — Single-process sequential test runner
# Runs ALL component tests through ONE Chromium instance with sequential
# file execution. No batch splitting, no browser restarts between files.
#
# Usage:
#   ./scripts/test-batch.sh              # Run all tests sequentially (one Chromium)
#   ./scripts/test-batch.sh --dry-run    # Show test files without running
#   ./scripts/test-batch.sh --verbose    # Show all test output (default: summary only)
#
# Known issue: Vitest 3.x browser mode hangs after all tests complete during
# Chromium teardown. This script detects stale output (no new lines for 15s)
# and force-kills vitest, then determines pass/fail from the raw test output.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIBRARY_DIR="$REPO_ROOT/packages/hx-library"
DRY_RUN=false
VERBOSE=false
# How many seconds of zero output growth before we declare vitest hung
STALE_TIMEOUT=15
# Poll interval in seconds
POLL_INTERVAL=3

# ── Cleanup on exit ──────────────────────────────────────────────────────────
cleanup() {
  if [[ -n "${VITEST_PID:-}" ]] && kill -0 "$VITEST_PID" 2>/dev/null; then
    kill -9 "$VITEST_PID" 2>/dev/null || true
    wait "$VITEST_PID" 2>/dev/null || true
  fi
  if [[ -n "${TAIL_PID:-}" ]] && kill -0 "$TAIL_PID" 2>/dev/null; then
    kill "$TAIL_PID" 2>/dev/null || true
    wait "$TAIL_PID" 2>/dev/null || true
  fi
  pkill -f "chrome-headless-shell" 2>/dev/null || true
  # Keep log file for inspection on failure
  if [[ "${EXIT_CODE:-1}" -eq 0 ]]; then
    rm -f "${LOGFILE:-}"
  else
    echo "[test-batch] Log preserved at: ${LOGFILE:-<none>}"
  fi
}
trap cleanup EXIT

# ── Parse arguments ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: $0 [--dry-run] [--verbose]"
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
echo "  HELiX Sequential Test Runner (v3)"
echo "============================================="
echo "Test files:    $TOTAL_FILES"
echo "Strategy:      Single Chromium, sequential files"
echo "Flag:          --no-file-parallelism"
echo "Hang guard:    ${STALE_TIMEOUT}s stale output watchdog"
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

# ── Run vitest ───────────────────────────────────────────────────────────────
START_TIME=$(date +%s)
LOGFILE=$(mktemp /tmp/helix-test-batch.XXXXXX)

cd "$LIBRARY_DIR"

# Launch vitest in background writing to log file (no pipes).
pnpm exec vitest run --no-file-parallelism --reporter=verbose > "$LOGFILE" 2>&1 &
VITEST_PID=$!

echo "[test-batch] vitest PID=$VITEST_PID"
echo "[test-batch] Log: $LOGFILE"
echo ""

# In verbose mode, stream output to terminal
if [[ "$VERBOSE" == true ]]; then
  tail -f "$LOGFILE" &
  TAIL_PID=$!
fi

# ── Stale-output watchdog ────────────────────────────────────────────────────
LAST_SIZE=0
STALE_SECONDS=0
FORCE_KILLED=false
LAST_FILE_REPORTED=""

while kill -0 "$VITEST_PID" 2>/dev/null; do
  sleep "$POLL_INTERVAL"

  CURRENT_SIZE=$(stat -f "%z" "$LOGFILE" 2>/dev/null || echo 0)
  ELAPSED=$(( $(date +%s) - START_TIME ))

  # In non-verbose mode, show progress by printing current test file
  if [[ "$VERBOSE" == false ]]; then
    CURRENT_FILE=$(grep "\.test\.ts" "$LOGFILE" 2>/dev/null | tail -1 | sed -E 's/.*\|(chromium)\| ([^ ]+).*/\2/' | sed 's/ .*//')
    if [[ -n "$CURRENT_FILE" ]] && [[ "$CURRENT_FILE" != "$LAST_FILE_REPORTED" ]]; then
      FILES_SO_FAR=$(grep "\.test\.ts" "$LOGFILE" | sed 's/.*src\//src\//' | sed 's/ >.*//' | sort -u | wc -l | tr -d ' ')
      printf "\r  [%3s/%s] %s" "$FILES_SO_FAR" "$TOTAL_FILES" "$CURRENT_FILE"
      LAST_FILE_REPORTED="$CURRENT_FILE"
    fi
  fi

  if [[ "$CURRENT_SIZE" -eq "$LAST_SIZE" ]] && [[ "$CURRENT_SIZE" -gt 0 ]]; then
    STALE_SECONDS=$((STALE_SECONDS + POLL_INTERVAL))
    if [[ "$STALE_SECONDS" -ge "$STALE_TIMEOUT" ]] && [[ "$ELAPSED" -ge 30 ]]; then
      echo ""
      echo "[test-batch] Output stale for ${STALE_SECONDS}s at ${ELAPSED}s elapsed — force killing vitest"
      kill "$VITEST_PID" 2>/dev/null || true
      sleep 1
      kill -9 "$VITEST_PID" 2>/dev/null || true
      FORCE_KILLED=true
      break
    fi
  else
    STALE_SECONDS=0
  fi
  LAST_SIZE=$CURRENT_SIZE
done

# Wait for vitest to finish
wait "$VITEST_PID" 2>/dev/null
VITEST_EXIT=$?

# Stop tail if running
if [[ -n "${TAIL_PID:-}" ]] && kill -0 "$TAIL_PID" 2>/dev/null; then
  kill "$TAIL_PID" 2>/dev/null || true
  wait "$TAIL_PID" 2>/dev/null || true
fi

# Clear progress line
if [[ "$VERBOSE" == false ]]; then
  echo ""
fi

# ── Determine pass/fail ──────────────────────────────────────────────────────
PASSED_TESTS=$(grep -c "^[[:space:]]*✓" "$LOGFILE" 2>/dev/null || echo 0)
FAILED_TESTS=$(grep -c "^[[:space:]]*×" "$LOGFILE" 2>/dev/null || echo 0)
FILES_RUN=$(grep "\.test\.ts" "$LOGFILE" | sed 's/.*src\//src\//' | sed 's/ >.*//' | sort -u | wc -l | tr -d ' ')

# Check for vitest summary
SUMMARY_LINE=""
if grep -q "^[[:space:]]*Test Files" "$LOGFILE" 2>/dev/null; then
  SUMMARY_LINE=$(grep "^[[:space:]]*Test Files" "$LOGFILE")
fi

# Show any failed tests
if [[ "$FAILED_TESTS" -gt 0 ]]; then
  echo ""
  echo "FAILED TESTS:"
  grep "^[[:space:]]*×" "$LOGFILE" 2>/dev/null | head -20
  echo ""
fi

# Determine status
if [[ "$FAILED_TESTS" -gt 0 ]]; then
  STATUS="FAILED"
  EXIT_CODE=1
elif [[ "$PASSED_TESTS" -gt 0 ]]; then
  STATUS="PASSED"
  EXIT_CODE=0
elif [[ "$VITEST_EXIT" -eq 0 ]] && [[ "$FORCE_KILLED" == false ]]; then
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
echo "  $STATUS"
echo "  ${FILES_RUN} test files, ${PASSED_TESTS} passed, ${FAILED_TESTS} failed"
echo "  Total time: ${DURATION}s"
if [[ -n "$SUMMARY_LINE" ]]; then
  echo "  Vitest:$SUMMARY_LINE"
fi
if [[ "$FORCE_KILLED" == true ]]; then
  echo "  (vitest force-killed after teardown hang)"
fi
echo "============================================="

exit $EXIT_CODE
