#!/usr/bin/env bash
# scripts/test-shard.sh — Sharded test runner for CI parallelism.
#
# Runs the 1/N slice of the vitest suite specified by VITEST_SHARD or the
# first positional argument (e.g. `1/4`). Each shard launches its own
# Chromium but only runs its portion of the test files, so a 4-way matrix
# in CI completes in roughly 1/4 of the wall time.
#
# Uses the shared watchdog from scripts/lib/vitest-watchdog.sh — sharded
# runs hit the same Vitest 3.x Chromium teardown hang as full-suite runs.
#
# Usage:
#   VITEST_SHARD=1/4 ./scripts/test-shard.sh
#   ./scripts/test-shard.sh 1/4
#   ./scripts/test-shard.sh                    # defaults to 1/1 (full suite)
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIBRARY_DIR="$REPO_ROOT/packages/hx-library"

# shellcheck source=lib/vitest-watchdog.sh
source "$REPO_ROOT/scripts/lib/vitest-watchdog.sh"

SHARD="${1:-${VITEST_SHARD:-1/1}}"

if [[ ! "$SHARD" =~ ^[0-9]+/[0-9]+$ ]]; then
  echo "ERROR: invalid shard '${SHARD}' — expected N/M (e.g. 1/4)" >&2
  exit 2
fi

# Watchdog needs line-prefixed ✓/× markers — use `verbose`. Keep `json`
# so .cache/test-results.json is still produced for the Admin Dashboard.
REPORTER_FLAGS=(--reporter=verbose --reporter=json)

cleanup() {
  pkill -f "chrome-headless-shell" 2>/dev/null || true
  if [[ "${EXIT_CODE:-1}" -eq 0 ]]; then
    rm -f "${LOGFILE:-}"
  else
    echo "[test-shard] log preserved at: ${LOGFILE:-<none>}"
  fi
}
trap cleanup EXIT

LOGFILE=$(mktemp /tmp/helix-test-shard.XXXXXX)
START_TIME=$(date +%s)

echo "============================================="
echo "  HELiX Sharded Test Runner"
echo "============================================="
echo "Shard:         ${SHARD}"
echo "Hang guard:    ${STALE_TIMEOUT:-120}s stale output watchdog"
echo "============================================="
echo ""

cd "$LIBRARY_DIR"

run_vitest_with_watchdog "test-shard" "$LOGFILE" \
  pnpm exec vitest run "--shard=${SHARD}" "${REPORTER_FLAGS[@]}"

# Only surface failed tests to stdout — passing ✓ lines would flood CI logs
# and blow through agent context windows. The full log stays at $LOGFILE.
if [[ "$FAILED_TESTS" -gt 0 ]]; then
  echo ""
  echo "FAILED TESTS:"
  grep "^[[:space:]]*×" "$LOGFILE" 2>/dev/null | head -40
  echo ""
fi

EXIT_CODE="$WATCHDOG_EXIT"
END_TIME=$(date +%s)
DURATION=$(( END_TIME - START_TIME ))

if [[ "$EXIT_CODE" -eq 0 ]]; then
  STATUS="PASSED"
else
  STATUS="FAILED"
fi

echo ""
echo "============================================="
echo "  ${STATUS} (shard ${SHARD})"
echo "  ${PASSED_TESTS} passed, ${FAILED_TESTS} failed"
echo "  Total time: ${DURATION}s"
if [[ "$FORCE_KILLED" == true ]]; then
  echo "  (vitest force-killed after teardown hang)"
fi
echo "============================================="

exit $EXIT_CODE
