#!/usr/bin/env bash
# Smart targeted test runner — only tests components changed vs origin/dev
#
# Includes a stale-output watchdog to handle Vitest browser mode hanging after
# all tests complete (known Vitest 3.x issue during Chromium teardown).
# Mirrors the watchdog pattern in scripts/test-batch.sh.
set -uo pipefail

BASE="${TEST_BASE_BRANCH:-origin/dev}"
COMMON_ANCESTOR=$(git merge-base HEAD "$BASE" 2>/dev/null || echo "")

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIBRARY_DIR="$REPO_ROOT/packages/hx-library"

# How many seconds of zero output growth before we declare vitest hung
STALE_TIMEOUT=15
POLL_INTERVAL=3

# ── Cleanup on exit ──────────────────────────────────────────────────────────
cleanup() {
  if [[ -n "${VITEST_PID:-}" ]] && kill -0 "$VITEST_PID" 2>/dev/null; then
    kill -9 "$VITEST_PID" 2>/dev/null || true
    wait "$VITEST_PID" 2>/dev/null || true
  fi
  pkill -f "chrome-headless-shell" 2>/dev/null || true
  if [[ "${EXIT_CODE:-1}" -eq 0 ]]; then
    rm -f "${LOGFILE:-}"
  else
    echo "[test-smart] Log preserved at: ${LOGFILE:-<none>}"
  fi
}
trap cleanup EXIT

# ── Run vitest with watchdog ─────────────────────────────────────────────────
run_vitest_with_watchdog() {
  local cmd=("$@")
  START_TIME=$(date +%s)
  LOGFILE=$(mktemp /tmp/helix-test-smart.XXXXXX)

  cd "$LIBRARY_DIR"
  "${cmd[@]}" > "$LOGFILE" 2>&1 &
  VITEST_PID=$!

  echo "[test-smart] vitest PID=$VITEST_PID"
  echo ""

  LAST_SIZE=0
  STALE_SECONDS=0
  FORCE_KILLED=false

  while kill -0 "$VITEST_PID" 2>/dev/null; do
    sleep "$POLL_INTERVAL"
    CURRENT_SIZE=$(stat -f "%z" "$LOGFILE" 2>/dev/null || stat -c "%s" "$LOGFILE" 2>/dev/null || echo 0)
    ELAPSED=$(( $(date +%s) - START_TIME ))

    if [[ "$CURRENT_SIZE" -eq "$LAST_SIZE" ]] && [[ "$CURRENT_SIZE" -gt 0 ]]; then
      STALE_SECONDS=$((STALE_SECONDS + POLL_INTERVAL))
      if [[ "$STALE_SECONDS" -ge "$STALE_TIMEOUT" ]] && [[ "$ELAPSED" -ge 30 ]]; then
        echo ""
        echo "[test-smart] Output stale for ${STALE_SECONDS}s at ${ELAPSED}s elapsed — force killing vitest"
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

  wait "$VITEST_PID" 2>/dev/null
  VITEST_EXIT=$?

  # Stream log to stdout
  cat "$LOGFILE"

  # Determine pass/fail
  PASSED_TESTS=$(grep -c "^[[:space:]]*✓" "$LOGFILE" 2>/dev/null || true)
  PASSED_TESTS=${PASSED_TESTS:-0}
  FAILED_TESTS=$(grep -c "^[[:space:]]*×" "$LOGFILE" 2>/dev/null || true)
  FAILED_TESTS=${FAILED_TESTS:-0}

  if [[ "$FAILED_TESTS" -gt 0 ]]; then
    EXIT_CODE=1
  elif [[ "$PASSED_TESTS" -gt 0 ]]; then
    EXIT_CODE=0
  elif [[ "$VITEST_EXIT" -eq 0 ]] && [[ "$FORCE_KILLED" == false ]]; then
    EXIT_CODE=0
  else
    EXIT_CODE=1
  fi

  if [[ "$FORCE_KILLED" == true ]]; then
    echo "[test-smart] vitest force-killed after teardown hang — exit based on test output"
  fi

  return $EXIT_CODE
}

# ── Main ─────────────────────────────────────────────────────────────────────
if [ -z "$COMMON_ANCESTOR" ]; then
  echo "No common ancestor with $BASE — running full test suite"
  run_vitest_with_watchdog pnpm exec vitest run --reporter=verbose
  exit $?
fi

# Find changed component source files
CHANGED=$(git diff --name-only "$COMMON_ANCESTOR"...HEAD \
  | grep -E '^packages/hx-library/src/components/hx-[^/]+/[^/]+\.ts$' \
  | grep -v '\.test\.ts$' \
  | grep -v '\.stories\.ts$' \
  | grep -v '\.styles\.ts$' \
  | grep -v '/index\.ts$' \
  || true)

if [ -z "$CHANGED" ]; then
  echo "No component source changes — skipping tests"
  exit 0
fi

# Extract unique component names
COMPONENTS=$(echo "$CHANGED" | sed -E 's|packages/hx-library/src/components/(hx-[^/]+)/.*|\1|' | sort -u)
COMPONENT_COUNT=$(echo "$COMPONENTS" | wc -l | tr -d ' ')

# If more than 20 components changed, run the full suite — vitest can't handle
# a regex filter with 50+ pipe-separated component names ("No test files found").
if [ "$COMPONENT_COUNT" -gt 20 ]; then
  echo "Smart test: $COMPONENT_COUNT components changed — running full suite"
  run_vitest_with_watchdog pnpm exec vitest run --reporter=verbose
  exit $?
fi

# Collect test files that actually exist for changed components
TEST_FILES=""
for COMP in $COMPONENTS; do
  TEST_PATH="src/components/${COMP}/${COMP}.test.ts"
  if [ -f "$REPO_ROOT/packages/hx-library/$TEST_PATH" ]; then
    TEST_FILES="$TEST_FILES $TEST_PATH"
  fi
done

# Trim leading space
TEST_FILES="${TEST_FILES# }"

if [ -z "$TEST_FILES" ]; then
  echo "Smart test: no test files found for changed components — skipping"
  exit 0
fi

echo "Smart test: $COMPONENTS"
# shellcheck disable=SC2086
run_vitest_with_watchdog pnpm exec vitest run $TEST_FILES --reporter=verbose
exit $?
