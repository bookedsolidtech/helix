#!/usr/bin/env bash
# scripts/lib/vitest-watchdog.sh — Shared vitest stale-output watchdog.
#
# Vitest 3.x browser mode (Playwright/Chromium) hangs indefinitely after all
# tests complete during the Chromium teardown phase. `--forceExit` does not
# exist in vitest (that's a Jest flag) and `teardownTimeout` does not cover
# browser teardown. The only reliable workaround is a stale-output watchdog:
# detect when vitest stops writing to its log, force-kill it, then determine
# pass/fail by counting `✓` and `×` markers in the captured output.
#
# Usage:
#   source scripts/lib/vitest-watchdog.sh
#   run_vitest_with_watchdog <label> <logfile> <cmd...>
#
# The function sets these globals on return:
#   VITEST_EXIT       — raw exit code from vitest (may be non-zero on hang)
#   FORCE_KILLED      — "true" | "false" — whether the watchdog fired
#   PASSED_TESTS      — count of `✓` markers in the log
#   FAILED_TESTS      — count of `×` markers in the log
#   WATCHDOG_EXIT     — 0 on success (tests passed), 1 on failure
#
# Environment overrides:
#   STALE_TIMEOUT     — seconds of no output before force-kill (default: 15)
#   POLL_INTERVAL     — seconds between watchdog polls (default: 3)

run_vitest_with_watchdog() {
  local label="$1"
  local logfile="$2"
  shift 2

  local stale_timeout="${STALE_TIMEOUT:-15}"
  local poll_interval="${POLL_INTERVAL:-3}"
  local start_time
  start_time=$(date +%s)

  "$@" > "$logfile" 2>&1 &
  local vitest_pid=$!

  echo "[${label}] vitest PID=${vitest_pid}"
  echo "[${label}] log: ${logfile}"

  local last_size=0
  local stale_seconds=0
  FORCE_KILLED=false

  while kill -0 "$vitest_pid" 2>/dev/null; do
    sleep "$poll_interval"
    local current_size
    current_size=$(wc -c < "$logfile" 2>/dev/null | tr -d '[:space:]' || echo 0)
    current_size=${current_size:-0}
    local elapsed=$(( $(date +%s) - start_time ))

    if [[ "$current_size" -eq "$last_size" ]] && [[ "$current_size" -gt 0 ]]; then
      stale_seconds=$((stale_seconds + poll_interval))
      if [[ "$stale_seconds" -ge "$stale_timeout" ]] && [[ "$elapsed" -ge 30 ]]; then
        echo "[${label}] output stale for ${stale_seconds}s at ${elapsed}s elapsed — force killing vitest"
        kill "$vitest_pid" 2>/dev/null || true
        sleep 1
        kill -9 "$vitest_pid" 2>/dev/null || true
        FORCE_KILLED=true
        break
      fi
    else
      stale_seconds=0
    fi
    last_size=$current_size
  done

  wait "$vitest_pid" 2>/dev/null
  VITEST_EXIT=$?

  # Parse pass/fail from output. Support both `✓`/`×` and `✔`/`x` markers.
  PASSED_TESTS=$(grep -c "^[[:space:]]*[✓✔]" "$logfile" 2>/dev/null || true)
  PASSED_TESTS=${PASSED_TESTS:-0}
  FAILED_TESTS=$(grep -c "^[[:space:]]*[×x]" "$logfile" 2>/dev/null || true)
  FAILED_TESTS=${FAILED_TESTS:-0}

  # Always clean up chromium shells — they leak when vitest is force-killed.
  pkill -f "chrome-headless-shell" 2>/dev/null || true

  if [[ "$FAILED_TESTS" -gt 0 ]]; then
    WATCHDOG_EXIT=1
  elif [[ "$PASSED_TESTS" -gt 0 ]]; then
    WATCHDOG_EXIT=0
  elif [[ "$VITEST_EXIT" -eq 0 ]] && [[ "$FORCE_KILLED" == false ]]; then
    WATCHDOG_EXIT=0
  else
    WATCHDOG_EXIT=1
  fi

  return "$WATCHDOG_EXIT"
}
