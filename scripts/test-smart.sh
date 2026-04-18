#!/usr/bin/env bash
# scripts/test-smart.sh — Targeted test runner.
#
# Only tests components changed vs origin/dev (or $TEST_BASE_BRANCH). Falls
# back to the full suite when more than 20 components changed — vitest's
# regex filter chokes on 50+ pipe-separated names ("No test files found").
#
# Uses the shared watchdog from scripts/lib/vitest-watchdog.sh to handle the
# known Vitest 3.x browser mode hang during Chromium teardown.
set -uo pipefail

BASE="${TEST_BASE_BRANCH:-origin/dev}"
COMMON_ANCESTOR=$(git merge-base HEAD "$BASE" 2>/dev/null || echo "")

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIBRARY_DIR="$REPO_ROOT/packages/hx-library"

# shellcheck source=lib/vitest-watchdog.sh
source "$REPO_ROOT/scripts/lib/vitest-watchdog.sh"

# The watchdog needs per-test markers. `verbose` writes them; `dot` does not.
# Output is captured to a log file — stdout in non-verbose mode stays compact
# — so no agent-context cost. Keep `json` so .cache/test-results.json is
# still written (vitest replaces config reporters when --reporter is passed).
REPORTER_FLAGS=(--reporter=verbose --reporter=json)

# ── Cleanup on exit ──────────────────────────────────────────────────────────
cleanup() {
  pkill -f "chrome-headless-shell" 2>/dev/null || true
  if [[ "${EXIT_CODE:-1}" -eq 0 ]]; then
    rm -f "${LOGFILE:-}"
  else
    echo "[test-smart] log preserved at: ${LOGFILE:-<none>}"
  fi
}
trap cleanup EXIT

# ── Wrapper around shared watchdog ───────────────────────────────────────────
run_vitest() {
  LOGFILE=$(mktemp /tmp/helix-test-smart.XXXXXX)
  cd "$LIBRARY_DIR"
  run_vitest_with_watchdog "test-smart" "$LOGFILE" "$@"
  local rc=$?

  # Stream log to stdout so the user sees results.
  cat "$LOGFILE"

  if [[ "$FORCE_KILLED" == true ]]; then
    echo "[test-smart] vitest force-killed after teardown hang — exit based on test output"
  fi

  EXIT_CODE=$rc
  return $rc
}

# ── Main ─────────────────────────────────────────────────────────────────────
if [ -z "$COMMON_ANCESTOR" ]; then
  echo "No common ancestor with $BASE — running full test suite"
  run_vitest pnpm exec vitest run "${REPORTER_FLAGS[@]}"
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
  run_vitest pnpm exec vitest run "${REPORTER_FLAGS[@]}"
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
run_vitest pnpm exec vitest run $TEST_FILES "${REPORTER_FLAGS[@]}"
exit $?
