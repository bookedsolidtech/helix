#!/usr/bin/env bash
# scripts/test-batch.sh — Canonical local test runner.
#
# Runs ALL component tests through ONE Chromium instance with sequential file
# execution. No batch splitting, no browser restarts between files. This is
# the single source of truth for "run everything locally" — replaces the old
# test:batch:1..5 split that paid N-way browser boot overhead for no benefit.
#
# Usage:
#   ./scripts/test-batch.sh              # Run all tests sequentially (one Chromium)
#   ./scripts/test-batch.sh --dry-run    # Show test files without running
#   ./scripts/test-batch.sh --verbose    # Show all test output (default: summary only)
#
# Known issue: Vitest 3.x browser mode hangs during Chromium teardown after
# all tests complete. The shared watchdog in scripts/lib/vitest-watchdog.sh
# detects stale output (no new lines for 120s), force-kills vitest, then
# determines pass/fail from the captured output markers.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIBRARY_DIR="$REPO_ROOT/packages/hx-library"
DRY_RUN=false
VERBOSE=false

# shellcheck source=lib/vitest-watchdog.sh
source "$REPO_ROOT/scripts/lib/vitest-watchdog.sh"

# ── Cleanup on exit ──────────────────────────────────────────────────────────
cleanup() {
  if [[ -n "${TAIL_PID:-}" ]] && kill -0 "$TAIL_PID" 2>/dev/null; then
    kill "$TAIL_PID" 2>/dev/null || true
    wait "$TAIL_PID" 2>/dev/null || true
  fi
  pkill -f "chrome-headless-shell" 2>/dev/null || true
  # Keep log file for inspection on failure
  if [[ "${EXIT_CODE:-1}" -eq 0 ]]; then
    rm -f "${LOGFILE:-}"
  else
    echo "[test-batch] log preserved at: ${LOGFILE:-<none>}"
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
echo "  HELiX Canonical Test Runner"
echo "============================================="
echo "Test files:    $TOTAL_FILES"
echo "Strategy:      Single Chromium, sequential files"
echo "Flag:          --no-file-parallelism"
echo "Hang guard:    ${STALE_TIMEOUT:-120}s stale output watchdog"
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

# ── Run vitest via shared watchdog ───────────────────────────────────────────
START_TIME=$(date +%s)
LOGFILE=$(mktemp /tmp/helix-test-batch.XXXXXX)

cd "$LIBRARY_DIR"

# The watchdog needs per-test markers (`✓` / `×`) to count pass/fail when
# vitest gets force-killed before printing its summary. `verbose` produces
# those markers; `dot` produces middots that carry no success/failure
# signal. The log is captured to a file — stdout stays terse either way —
# so there is no agent-context cost to keeping verbose here. Script output
# to the terminal is just the final summary unless --verbose is passed.
# Keep the json reporter so the Admin Dashboard test-results.json stays
# populated (vitest replaces, not merges, the config reporters when the
# flag is passed).
if [[ "$VERBOSE" == true ]]; then
  tail -f "$LOGFILE" &
  TAIL_PID=$!
fi

run_vitest_with_watchdog "test-batch" "$LOGFILE" \
  pnpm exec vitest run --no-file-parallelism --reporter=verbose --reporter=json

# Stop tail if running
if [[ -n "${TAIL_PID:-}" ]] && kill -0 "$TAIL_PID" 2>/dev/null; then
  kill "$TAIL_PID" 2>/dev/null || true
  wait "$TAIL_PID" 2>/dev/null || true
fi

# ── Determine pass/fail ──────────────────────────────────────────────────────
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

EXIT_CODE="$WATCHDOG_EXIT"
if [[ "$EXIT_CODE" -eq 0 ]]; then
  STATUS="PASSED"
else
  STATUS="FAILED"
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
