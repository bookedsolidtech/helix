#!/usr/bin/env bash
# scripts/act-ci.sh — Run CI locally via nektos/act
# Usage: ./scripts/act-ci.sh [--job <job-name>] [--list] [--native] [--full] [--matrix] [--batch] [--clean] [--help]
#
# Runs .github/workflows/act-ci.yml — a lightweight mirror of ci.yml that
# avoids GitHub-specific actions (dorny/paths-filter, pnpm/action-setup,
# actions/setup-node) which break in act due to PATH issues and missing
# API context.
#
# Available jobs: lint, format, type-check, build, test, test-full, quality-gates
# Flags:
#   --job <name>  Run a specific job only
#   --list        List available jobs
#   --help        Show this help message
#   --fast        Run the consolidated single-job workflow (fastest)
#   --clean       Remove all stale act containers before running
#   --native      Use linux/arm64 native architecture (no Rosetta emulation)
#   --full        Run full test suite on current Node (triggers test-full job)
#   --matrix      Run full test suite on Node 22/24 matrix (CI Matrix parity)
#   --batch       Run all tests in batches (default 10 at a time, avoids Docker OOM)
#
# Performance notes:
#   .actrc configures --bind (zero-copy mount), --reuse (keep containers),
#   --pull=false (skip image check), --no-cache-server, --action-offline-mode.
#   With warm containers: lint ~12s, format ~10s, type-check ~15s, build ~90s.
#
# Docker OOM on Apple Silicon:
#   Default mode runs linux/amd64 via Rosetta 2, which uses 2-3x more memory.
#   Use --native for linux/arm64 containers (no emulation overhead).
#   Use --full to run the complete test suite (default is smart/changed only).
#   Use --matrix for full CI Matrix parity (Node 22/24).
#   Use --batch to run all tests in small batches (avoids OOM, slower but reliable).
#   Best combo: ./scripts/act-ci.sh --native --batch
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ── Prerequisites ────────────────────────────────────────────────────────────
if ! command -v act &>/dev/null; then
  echo "ERROR: 'act' is not installed. Run: brew install act"
  exit 1
fi

if ! docker info &>/dev/null 2>&1; then
  echo "ERROR: Docker is not running. Start Docker Desktop first."
  exit 1
fi

# ── Container cleanup ────────────────────────────────────────────────────────
cleanup_stale_containers() {
  local stale
  stale=$(docker ps -aq --filter "status=exited" --filter "name=act-" 2>/dev/null || true)
  if [[ -n "$stale" ]]; then
    local count
    count=$(echo "$stale" | wc -l | tr -d ' ')
    echo "Cleaning up $count stale act container(s)..."
    echo "$stale" | xargs docker rm >/dev/null 2>&1 || true
  fi
}

# ── Parse arguments ──────────────────────────────────────────────────────────
WORKFLOW=".github/workflows/act-ci.yml"
JOB_ARGS=""
DO_CLEAN=false
USE_NATIVE=false
USE_FULL=false
USE_MATRIX=false
USE_BATCH=false

show_help() {
  sed -n '3,33p' "${BASH_SOURCE[0]}" | sed 's/^# //' | sed 's/^#//'
  echo ""
  echo "Examples:"
  echo "  ./scripts/act-ci.sh                    # Smart tests, current Node"
  echo "  ./scripts/act-ci.sh --full             # Full test suite, current Node"
  echo "  ./scripts/act-ci.sh --matrix           # Full test suite, Node 22/24"
  echo "  ./scripts/act-ci.sh --native --matrix  # Matrix tests, ARM64 (no Rosetta)"
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)
      show_help
      ;;
    --list)
      act -W "$WORKFLOW" --list
      exit 0
      ;;
    --job)
      JOB_ARGS="--job $2"
      shift 2
      ;;
    --clean)
      DO_CLEAN=true
      shift
      ;;
    --native)
      USE_NATIVE=true
      shift
      ;;
    --full)
      USE_FULL=true
      shift
      ;;
    --matrix)
      USE_MATRIX=true
      USE_FULL=true
      shift
      ;;
    --batch)
      USE_BATCH=true
      shift
      ;;
    *)
      break
      ;;
  esac
done

# Always clean stale containers, or do a full clean if requested
if [[ "$DO_CLEAN" == true ]]; then
  echo "Cleaning ALL act containers..."
  docker ps -aq --filter "name=act-" 2>/dev/null | xargs -r docker rm -f >/dev/null 2>&1 || true
else
  cleanup_stale_containers
fi

# ── Build architecture and env flags ──────────────────────────────────────────
ARCH_ARGS=""
ENV_ARGS="--env CI=true"

if [[ "$USE_NATIVE" == true ]]; then
  ARCH_ARGS="--container-architecture linux/arm64"
  ARCH_MODE="native ARM64"
  PW_ARCH="arm64"
else
  ARCH_ARGS="--container-architecture linux/amd64"
  ARCH_MODE="amd64 (Rosetta)"
  PW_ARCH="amd64"
fi

# ── Playwright browser cache ────────────────────────────────────────────────
# Separate cache per architecture — amd64 and arm64 binaries are incompatible.
PW_CACHE_DIR="$HOME/.cache/ms-playwright-${PW_ARCH}"
mkdir -p "$PW_CACHE_DIR"

if [[ "$USE_BATCH" == true ]]; then
  ENV_ARGS="$ENV_ARGS --env ACT_BATCH_TESTS=true"
  TEST_MODE="batched (all components, ${BATCH_SIZE:-10} at a time)"
elif [[ "$USE_MATRIX" == true ]]; then
  ENV_ARGS="$ENV_ARGS --env ACT_MATRIX_TESTS=true --env ACT_FULL_TESTS=true"
  TEST_MODE="full suite + Node 22/24 matrix (CI Matrix parity)"
elif [[ "$USE_FULL" == true ]]; then
  ENV_ARGS="$ENV_ARGS --env ACT_FULL_TESTS=true"
  TEST_MODE="full suite (current Node)"
else
  TEST_MODE="smart (changed only)"
fi

echo "=== Running CI locally via act ==="
echo "Workflow: $WORKFLOW"
echo "Job: ${JOB_ARGS:-all}"
echo "Mode: $ARCH_MODE"
echo "Tests: $TEST_MODE"
echo ""

START_TIME=$(date +%s)

# act event must match the workflow's `on:` triggers. act-ci.yml is
# `on: workflow_dispatch:` only (per fix-change-act-ci-trigger commit), so
# passing `pull_request` here resolves to zero stages and exits with
# "Could not find any stages to run" in <1s, falsely failing preflight
# Gate 9. workflow_dispatch matches the yml's single trigger.
if act workflow_dispatch -W "$WORKFLOW" $JOB_ARGS \
  $ENV_ARGS \
  $ARCH_ARGS \
  --eventpath .github/act-event.json \
  --container-options "-v ${PW_CACHE_DIR}:/root/.cache/ms-playwright" \
  "$@"; then
  STATUS="passed"
  EXIT_CODE=0
else
  STATUS="failed"
  EXIT_CODE=1
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

cat > .act-results.json << EOF
{
  "status": "$STATUS",
  "workflow": "act-ci.yml",
  "job": "${JOB_ARGS:-all}",
  "duration_seconds": $DURATION,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo ""
echo "=== act CI $STATUS in ${DURATION}s ==="
exit $EXIT_CODE
