# Local CI with nektos/act

Run GitHub Actions workflows locally inside Docker containers before pushing to GitHub. This document is the authoritative reference for the HELiX local CI setup and serves as a replication guide for other projects.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Architecture](#architecture)
5. [Configuration Files](#configuration-files)
6. [Available Commands](#available-commands)
7. [Performance Benchmarks](#performance-benchmarks)
8. [Speed Optimizations](#speed-optimizations)
9. [Apple Silicon (M-series) Considerations](#apple-silicon-m-series-considerations)
10. [Docker Desktop Troubleshooting](#docker-desktop-troubleshooting)
11. [Integration with Agent Workflows](#integration-with-agent-workflows)
12. [VRT (Visual Regression Testing) Considerations](#vrt-visual-regression-testing-considerations)
13. [What Works vs What Doesn't](#what-works-vs-what-doesnt)
14. [Replicating to Other Projects](#replicating-to-other-projects)

---

## Overview

This project uses [nektos/act](https://github.com/nektos/act) to run GitHub Actions workflows locally inside Docker containers. The goal is simple: **stop pushing broken code to GitHub.**

Every push to GitHub triggers CI, CodeRabbit review, and status checks. A failing push wastes 5-15 minutes of CI compute, generates noise in PR reviews, and blocks the merge queue. The local Docker CI gate catches failures before they ever leave the developer's machine.

The system mirrors the production CI pipeline (`ci.yml`) in a local-only workflow (`act-ci.yml`) that avoids GitHub-specific actions that break in Docker. If code passes the local gate, it will pass on GitHub.

**Cost of a failed push:**
- 5-15 minutes of GitHub Actions compute (billed)
- A stale CodeRabbit `CHANGES_REQUESTED` review that blocks auto-merge
- A remediation commit + re-push + second review cycle
- Total: 20-40 minutes of wasted time per failure

**Cost of the local gate:**
- 4 minutes (all jobs) or 18-60 seconds (single job)
- Zero GitHub compute burned
- Zero stale reviews

---

## Prerequisites

### Required Software

```bash
# Docker Desktop (must be running)
# Download from: https://www.docker.com/products/docker-desktop/
# Or via Homebrew:
brew install --cask docker

# nektos/act — GitHub Actions runner for Docker
brew install act

# Verify installation
act --version    # Should print act version (e.g., 0.2.74)
docker info      # Should print Docker info without errors
```

### System Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| Docker Desktop | 4.x | Latest |
| Docker memory | 8 GB | 12-16 GB |
| Disk space | 10 GB (for Docker images) | 20 GB |
| macOS | 13+ (Ventura) | 14+ (Sonoma) |
| Apple Silicon | M1 | M1 Pro/Max/Ultra |

### Docker Desktop Settings

Open Docker Desktop > Settings > Resources:

- **Memory:** 12 GB minimum (16 GB recommended for full test suite)
- **CPU:** 4 cores minimum (6-8 recommended)
- **Disk image size:** 64 GB minimum
- **File sharing:** VirtioFS (default on modern Docker Desktop)

---

## Quick Start

```bash
# 1. Make sure Docker Desktop is running
docker info

# 2. Run all quality gates (lint, format, type-check, build, test)
./scripts/act-ci.sh

# 3. Or run a single job
./scripts/act-ci.sh --job lint

# 4. See available jobs
./scripts/act-ci.sh --list
```

That's it. If the command exits 0, the code is safe to push. If it exits non-zero, fix the errors first.

---

## Architecture

### How act Works

```
Developer machine
  |
  +-- ./scripts/act-ci.sh
        |
        +-- act (CLI tool)
              |
              +-- Reads .github/workflows/act-ci.yml
              +-- Reads .actrc (flags: --bind, --reuse, etc.)
              +-- Reads .github/act-event.json (mock PR event)
              |
              +-- For each job in the workflow:
                    |
                    +-- Starts Docker container (catthehacker/ubuntu:act-latest)
                    +-- Bind-mounts the repo into the container (--bind)
                    +-- Runs each step inside the container
                    +-- Reports pass/fail
              |
              +-- Writes .act-results.json with status and timing
```

### Key Differences from GitHub Actions

| Aspect | GitHub Actions | act (local) |
|---|---|---|
| Runner image | `ubuntu-latest` (GitHub-hosted) | `catthehacker/ubuntu:act-latest` (Docker) |
| File access | Clone via `actions/checkout` | Bind-mount from host (`--bind`) |
| Node.js setup | `actions/setup-node` | Already in base image |
| pnpm setup | `pnpm/action-setup` | `corepack enable && corepack prepare` |
| Path filter | `dorny/paths-filter` | Not available (GitHub API dependent) |
| Secrets | GitHub Secrets | `.act-secrets` file (gitignored) |
| Caching | `actions/cache` | `--reuse` (keep containers alive) |
| Architecture | x86_64 (GitHub) | Configurable (`--container-architecture`) |

### Why a Separate Workflow

The production CI workflow (`ci.yml`) uses GitHub-specific actions that break in act:

- **`pnpm/action-setup`** — Corrupts `PATH` in act containers; the installed pnpm binary is unreachable.
- **`dorny/paths-filter`** — Requires GitHub API context (`GITHUB_TOKEN`, PR diff API) that doesn't exist locally.
- **`actions/setup-node`** — Unnecessary when using `catthehacker/ubuntu:act-latest` which includes Node.js.

The local workflow (`act-ci.yml`) mirrors every quality gate but uses `corepack` for pnpm setup and skips path filtering entirely (all jobs always run).

---

## Configuration Files

### `.actrc` — act Default Flags

This file is read automatically by `act` on every invocation. Every flag here applies to all runs.

```
-P ubuntu-latest=catthehacker/ubuntu:act-latest
--bind
--reuse
--rm
--pull=false
--no-cache-server
--action-offline-mode
```

**Flag-by-flag explanation:**

| Flag | Purpose |
|---|---|
| `-P ubuntu-latest=catthehacker/ubuntu:act-latest` | Map the `ubuntu-latest` runner label to a Docker image. `catthehacker/ubuntu:act-latest` is the community standard image for act, with Node.js, git, and common tools pre-installed. |
| `--bind` | Bind-mount the host repo into the container instead of copying it. This is the single most important performance flag — it eliminates a 4.3 GB `docker cp` operation on every job start. Without it, each job copies the entire repo (including `node_modules`) into the container. |
| `--reuse` | Keep containers alive between runs. On subsequent runs, act reuses the existing container instead of creating a new one (saves 5-10 seconds of container startup per job). |
| `--rm` | Auto-remove containers that exit with failure. Without this, failed containers accumulate and consume disk/memory. Combined with `--reuse`, successful containers stay alive (for reuse) and failed ones are cleaned up. |
| `--pull=false` | Skip checking for Docker image updates on every run. The base image rarely changes, so pulling it every time wastes 2-5 seconds. Update manually with `docker pull catthehacker/ubuntu:act-latest` when needed. |
| `--no-cache-server` | Disable the act cache server. act has a built-in cache server that emulates `actions/cache`, but it's unused in this workflow and adds startup overhead. |
| `--action-offline-mode` | Use locally cached copies of GitHub Actions (like `actions/checkout`) instead of fetching them from GitHub on every run. After the first run, all action sources are cached in `~/.cache/act/`. |

### `.github/act-event.json` — Mock PR Event

act requires an event payload to simulate the `pull_request` trigger. This file provides a minimal mock:

```json
{
  "pull_request": {
    "number": 0,
    "head": {
      "ref": "act-local-test",
      "sha": "0000000000000000000000000000000000000000"
    },
    "base": {
      "ref": "dev",
      "sha": "0000000000000000000000000000000000000000"
    }
  }
}
```

The values don't matter for local CI — they exist to satisfy the GitHub Actions event schema. The `base.ref: "dev"` mirrors the project's PR base branch convention.

### `.github/workflows/act-ci.yml` — Local CI Workflow

The complete workflow with all quality gates:

```yaml
# ============================================================================
# Local CI — Quality gates for nektos/act
# ============================================================================
# Mirrors the core quality gates from ci.yml but avoids GitHub-specific actions
# (dorny/paths-filter, pnpm/action-setup, actions/setup-node) that break in act
# due to PATH corruption and missing API context.
#
# Optimized for speed with --bind mode (zero-copy mount from host):
#   - node_modules already exists → pnpm install is a 2s no-op
#   - Playwright browsers cached via volume mount → skip download
#   - --reuse keeps containers warm between runs
#
# Usage: ./scripts/act-ci.sh [--job <job-name>] [--list]
# Jobs: lint, format, type-check, build, test, quality-gates
# ============================================================================

name: Local CI

on:
  pull_request:

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - name: Setup pnpm
        run: |
          corepack enable
          corepack prepare pnpm@9.15.9 --activate
          pnpm install --frozen-lockfile
      - name: Run ESLint
        run: pnpm run lint

  format:
    name: Format
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - name: Setup pnpm
        run: |
          corepack enable
          corepack prepare pnpm@9.15.9 --activate
          pnpm install --frozen-lockfile
      - name: Check formatting
        run: pnpm run format:check

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - name: Setup pnpm
        run: |
          corepack enable
          corepack prepare pnpm@9.15.9 --activate
          pnpm install --frozen-lockfile
      - name: Run TypeScript strict check
        run: pnpm turbo run type-check --filter='!docs'

  build:
    name: Build
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - name: Setup pnpm
        run: |
          corepack enable
          corepack prepare pnpm@9.15.9 --activate
          pnpm install --frozen-lockfile
      - name: Build all packages
        run: pnpm turbo run build --filter='!docs'
      - name: Generate and validate CEM
        run: pnpm run cem
        working-directory: packages/hx-library
      - name: Validate package exports
        run: pnpm publish --dry-run --no-git-checks || echo "dry-run publish check skipped (may fail locally if version already published)"
        working-directory: packages/hx-library

  test:
    name: Test
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - name: Setup pnpm
        run: |
          corepack enable
          corepack prepare pnpm@9.15.9 --activate
          pnpm install --frozen-lockfile
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium
      - name: Build library
        run: pnpm turbo run build --filter='!docs' --filter='!@helixui/admin' --filter='!@helixui/storybook'
      - name: Run tests
        run: |
          if [ "${ACT_BATCH_TESTS}" = "true" ]; then
            echo "Running batched tests (all components, ${BATCH_SIZE:-10} at a time)..."
            bash scripts/test-batch.sh
          elif [ "${ACT_FULL_TESTS}" = "true" ]; then
            echo "Running full test suite..."
            pnpm run test:library
          else
            echo "Running smart tests (changed components only)..."
            pnpm run test:smart
          fi

  # ── Aggregate gate ──────────────────────────────────────────────────────
  quality-gates:
    name: Quality Gates
    runs-on: ubuntu-latest
    timeout-minutes: 1
    needs: [lint, format, type-check, build, test]
    if: always()
    steps:
      - name: Check all gates
        run: |
          echo "Lint:       ${{ needs.lint.result }}"
          echo "Format:     ${{ needs.format.result }}"
          echo "Type Check: ${{ needs.type-check.result }}"
          echo "Build:      ${{ needs.build.result }}"
          echo "Test:       ${{ needs.test.result }}"

          FAIL=0
          for gate in lint format type-check build test; do
            case "$gate" in
              lint)       result="${{ needs.lint.result }}" ;;
              format)     result="${{ needs.format.result }}" ;;
              type-check) result="${{ needs.type-check.result }}" ;;
              build)      result="${{ needs.build.result }}" ;;
              test)       result="${{ needs.test.result }}" ;;
            esac
            if [[ "$result" != "success" ]]; then
              echo "FAILED: $gate ($result)"
              FAIL=1
            fi
          done

          if [[ "$FAIL" -eq 1 ]]; then
            echo ""
            echo "One or more quality gates failed"
            exit 1
          fi

          echo ""
          echo "All quality gates passed!"
```

**Key design decisions:**

1. **`corepack` instead of `pnpm/action-setup`** — `pnpm/action-setup` corrupts `PATH` in act. `corepack` is built into Node.js and works identically in both environments.

2. **`pnpm install --frozen-lockfile`** — With `--bind` mode, `node_modules` already exists on the host. `--frozen-lockfile` makes this a 2-second validation step, not a full install.

3. **`--filter='!docs'`** — The docs site (Astro Starlight) has its own build pipeline and is excluded from the core quality gates.

4. **Three test modes** — The test job supports smart (default), full, and batched modes via environment variables, controlled by the wrapper script flags.

5. **`quality-gates` aggregate job** — Runs `if: always()` and checks all upstream job results. This ensures a single pass/fail signal even if individual jobs are skipped.

### `scripts/act-ci.sh` — Wrapper Script

The full wrapper script with all flags and logic:

```bash
#!/usr/bin/env bash
# scripts/act-ci.sh — Run CI locally via nektos/act
# Usage: ./scripts/act-ci.sh [--job <job-name>] [--list] [--native] [--full] [--batch] [--clean]
#
# Runs .github/workflows/act-ci.yml — a lightweight mirror of ci.yml that
# avoids GitHub-specific actions (dorny/paths-filter, pnpm/action-setup,
# actions/setup-node) which break in act due to PATH issues and missing
# API context.
#
# Available jobs: lint, format, type-check, build, test, quality-gates
# Flags:
#   --job <name>  Run a specific job only
#   --list        List available jobs
#   --fast        Run the consolidated single-job workflow (fastest)
#   --clean       Remove all stale act containers before running
#   --native      Use linux/arm64 native architecture (no Rosetta emulation)
#   --full        Run full test suite instead of smart tests (changed only)
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
USE_BATCH=false

while [[ $# -gt 0 ]]; do
  case "$1" in
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
elif [[ "$USE_FULL" == true ]]; then
  ENV_ARGS="$ENV_ARGS --env ACT_FULL_TESTS=true"
  TEST_MODE="full suite"
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

if act pull_request -W "$WORKFLOW" $JOB_ARGS \
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
```

**Script behavior:**

1. **Prerequisite checks** — Exits immediately if `act` or Docker is not available.
2. **Stale container cleanup** — On every run, removes exited `act-` containers. With `--clean`, force-removes all `act-` containers (including running ones).
3. **Architecture selection** — Default is `linux/amd64` (Rosetta). `--native` switches to `linux/arm64`.
4. **Playwright cache** — Creates architecture-specific cache directories (`~/.cache/ms-playwright-amd64` vs `~/.cache/ms-playwright-arm64`) and volume-mounts them into the container. This avoids re-downloading Chromium on every test run.
5. **Results file** — Writes `.act-results.json` with status, timing, and timestamp for programmatic consumption.

### `scripts/test-batch.sh` — Sequential Test Runner (v2)

Used when `--batch` flag is passed. Runs ALL 85+ test files through a **single Chromium instance** with sequential file execution — no browser restarts between files.

```bash
# Usage:
./scripts/test-batch.sh              # Run all tests sequentially (one Chromium)
./scripts/test-batch.sh --dry-run    # Show test files without running
```

The key is vitest's `--no-file-parallelism` flag, which forces all test files to run one at a time through a single browser instance. Each file gets an isolated page context (preventing `customElements.define()` collisions), but the Chromium process stays alive throughout.

**v1 (replaced):** Split files into batches of 10, launched a new vitest process per batch. Each process started Chromium, ran tests, tore down. 9 batches = 9 Chromium startups = ~90s of pure overhead.

**v2 (current):** One vitest process, one Chromium startup, 85 files sequential, one teardown. Saves 60-105 seconds per full run while maintaining the same I/O profile that avoids VirtioFS crashes.

The vitest config also removes dead `pool: 'threads'` and `poolOptions` settings — browser mode ignores the threads/forks pool entirely and manages its own execution through the Playwright browser provider.

---

## Available Commands

### Full Reference

| Command | What It Does | Typical Time |
|---|---|---|
| `./scripts/act-ci.sh` | Run all quality gates with smart tests | ~4 min |
| `./scripts/act-ci.sh --job lint` | Run ESLint only | 18-61s |
| `./scripts/act-ci.sh --job format` | Run Prettier format check only | 95-108s |
| `./scripts/act-ci.sh --job type-check` | Run TypeScript strict check only | 33-65s |
| `./scripts/act-ci.sh --job build` | Run full build + CEM only | ~201s |
| `./scripts/act-ci.sh --job test` | Run smart tests only | ~29s |
| `./scripts/act-ci.sh --full` | All gates with full test suite | ~6 min |
| `./scripts/act-ci.sh --batch` | All gates with batched tests | ~8 min |
| `./scripts/act-ci.sh --native` | All gates using ARM64 (no Rosetta) | ~4 min |
| `./scripts/act-ci.sh --native --batch` | ARM64 + batched tests (best for M-series full coverage) | ~7 min |
| `./scripts/act-ci.sh --native --job test` | ARM64 smart tests only | ~25s |
| `./scripts/act-ci.sh --clean` | Remove ALL act containers, then run all gates | ~4 min |
| `./scripts/act-ci.sh --clean --job lint` | Clean containers, then run lint only | ~61s |
| `./scripts/act-ci.sh --list` | List available jobs (no execution) | instant |

### Flag Combinations

Flags can be combined freely:

```bash
# ARM64 native + batched tests + clean containers
./scripts/act-ci.sh --native --batch --clean

# ARM64 native + single job
./scripts/act-ci.sh --native --job type-check

# Full test suite + single job (test only)
./scripts/act-ci.sh --full --job test

# Batch tests + single job (test only)
./scripts/act-ci.sh --batch --job test
```

### Passing Additional Flags to act

Any unrecognized arguments are forwarded directly to `act`:

```bash
# Verbose output
./scripts/act-ci.sh -v

# Extra verbose
./scripts/act-ci.sh -vv

# Pass an environment variable
./scripts/act-ci.sh --env MY_VAR=value
```

---

## Performance Benchmarks

All times measured on Apple M1 Max, 32 GB RAM, Docker Desktop 4.x with 16 GB allocated.

### Cold Run (first run, no warm containers)

| Job | Time | Notes |
|---|---|---|
| Lint | 61s | Full ESLint pass over monorepo |
| Format | 108s | Prettier check over all files |
| Type-check | 65s | TypeScript strict, excludes docs |
| Build | 201s | Full library build + CEM generation |
| Smart tests | 29s | No changes detected, near-instant |
| **Total (parallel)** | **~4 min** | Jobs run in parallel via act |

### Warm Run (with `--reuse`, containers already alive)

| Job | Time | Savings |
|---|---|---|
| Lint | 18s | 43s saved (70%) |
| Format | ~95s | ~13s saved (12%) |
| Type-check | 33s | 32s saved (49%) |
| Build | ~180s | ~21s saved (10%) |
| Smart tests | 29s | Same (no startup savings for tests) |

### Why `--bind` Mode is Critical

Without `--bind`, act copies the entire repo into each Docker container using `docker cp`. For a monorepo with `node_modules`, this means:

```
Without --bind:  docker cp of ~4.3 GB per job × 5 jobs = 21.5 GB of I/O
With --bind:     zero-copy bind mount, 0 bytes copied
```

The `--bind` flag alone saves 30-40 seconds per job (2.5-3.5 minutes total across all 5 jobs). It is the single most impactful optimization.

**Trade-off:** `--bind` mounts the host directory directly. Any file the container modifies (e.g., generating build artifacts) is written to the host filesystem. This is a feature, not a bug — it means build artifacts and installed dependencies are shared between host and container.

---

## Speed Optimizations

### `.actrc` Flags

Each flag in `.actrc` contributes a measurable speedup:

| Flag | Saves | How |
|---|---|---|
| `--bind` | 30-40s/job | Bind-mount repo instead of `docker cp` (eliminates 4.3 GB copy) |
| `--reuse` | 5-10s/job | Reuse existing containers (skip container creation + startup) |
| `--pull=false` | 2-5s/run | Skip Docker Hub image update check |
| `--no-cache-server` | 1-2s/run | Don't start the act cache server process |
| `--action-offline-mode` | 1-3s/run | Use cached action sources from `~/.cache/act/` |
| `--rm` | 0s | No speed impact — prevents disk bloat from failed containers |

**Combined savings:** Cold run is ~4 min. Without these flags, the same run takes ~8-12 min.

### Playwright Browser Cache Volume Mount

The wrapper script creates architecture-specific cache directories and mounts them into the container:

```bash
PW_CACHE_DIR="$HOME/.cache/ms-playwright-${PW_ARCH}"
mkdir -p "$PW_CACHE_DIR"
# ...
--container-options "-v ${PW_CACHE_DIR}:/root/.cache/ms-playwright"
```

This means Playwright downloads Chromium once per architecture and reuses it on all subsequent runs. Without this mount, every test job would download ~150 MB of Chromium binaries.

The cache is split by architecture because amd64 and arm64 Chromium binaries are incompatible:
- `~/.cache/ms-playwright-amd64/` — x86_64 Chromium (Rosetta mode)
- `~/.cache/ms-playwright-arm64/` — ARM64 Chromium (native mode)

### `pnpm install --frozen-lockfile` as a No-Op

Because `--bind` mounts the host's `node_modules` into the container, `pnpm install --frozen-lockfile` becomes a 2-second validation step (verifying the lockfile matches) rather than a full dependency installation. The dependencies are already present on the host.

---

## Apple Silicon (M-series) Considerations

### Default Mode: linux/amd64 via Rosetta 2

By default, the script runs `--container-architecture linux/amd64`. Docker Desktop on Apple Silicon uses Rosetta 2 to emulate x86_64 containers. This works well for CPU-bound tasks:

- Lint: works perfectly
- Format: works perfectly
- Type-check: works perfectly
- Build: works perfectly
- Smart tests: works perfectly (1-5 components at a time)

### Native Mode: linux/arm64

Use `--native` for ARM64 containers without emulation:

```bash
./scripts/act-ci.sh --native
```

This eliminates the Rosetta emulation overhead (2-3x memory reduction, ~20% faster). Required for running the full test suite, which needs more memory headroom.

**Caveat:** Some npm packages with native binaries may not have ARM64 Linux builds. In practice, this hasn't been an issue for this project.

### Docker Desktop VirtioFS RWLayer Bug

Docker Desktop's VirtioFS storage driver has a known instability under heavy I/O on macOS. When Chromium (via Playwright) and Vitest simultaneously write to the container filesystem, the storage driver crashes with:

```
ERROR: failed to create rwlayer: unexpected nil value
```

or:

```
ERROR: container exited with code 137 (SIGKILL / OOM)
```

This is **not** an out-of-memory error in most cases — it's a VirtioFS storage driver crash. Allocating more memory to Docker does not fix it.

**Impact:**
- Full test suite (112+ tests in a single vitest run) crashes reliably
- Smart tests (1-5 components) work reliably
- Batched tests (10 components at a time) work reliably

### Recommended Approaches for Apple Silicon

| Scenario | Command | Reliability |
|---|---|---|
| Feature branch (few changes) | `./scripts/act-ci.sh` | High — smart tests run only changed components |
| Full coverage (pre-release) | `./scripts/act-ci.sh --native --batch` | High — batched execution avoids VirtioFS crash |
| Quick single check | `./scripts/act-ci.sh --job lint` | High — no Playwright involved |
| Full test suite (risky) | `./scripts/act-ci.sh --native --full` | Low — may crash Docker Desktop |

---

## Docker Desktop Troubleshooting

### `docker info` Returns HTTP 500

**Symptom:** `docker info` hangs or returns a server error.

**Fix:** Restart Docker Desktop. The Docker daemon has crashed or become unresponsive.

```bash
# On macOS, quit and reopen Docker Desktop, or:
killall Docker && open -a Docker
```

### RWLayer Unexpectedly Nil

**Symptom:** Act exits with `failed to create rwlayer: unexpected nil value`.

**Cause:** VirtioFS storage driver crash, not OOM. Heavy disk I/O (Playwright + Vitest) overwhelms the storage driver.

**Fix:**
```bash
# 1. Clean all act containers
./scripts/act-ci.sh --clean

# 2. If that doesn't help, prune Docker
docker system prune -f

# 3. Retry with batched tests instead of full suite
./scripts/act-ci.sh --native --batch
```

### Stale Containers Eating Resources

**Symptom:** Docker Desktop using excessive memory/CPU even when nothing is running.

**Diagnosis:**
```bash
# Check for running act containers
docker ps --filter "name=act-"

# Check resource usage
docker stats --no-stream

# Check total container count
docker ps -a --filter "name=act-" | wc -l
```

**Fix:**
```bash
# Remove all act containers (running and stopped)
docker ps -aq --filter "name=act-" | xargs docker rm -f

# Or use the built-in cleanup
./scripts/act-ci.sh --clean
```

### Container Runs but Job Fails Silently

**Symptom:** Act reports a job failure but the output shows no obvious error.

**Fix:** Run with verbose output:
```bash
./scripts/act-ci.sh --job test -v    # verbose
./scripts/act-ci.sh --job test -vv   # extra verbose
```

### First Run Downloads Large Docker Image

**Symptom:** First `act` run takes 5-10 minutes downloading `catthehacker/ubuntu:act-latest`.

**This is expected.** The image is ~1.5 GB. After the first download, `--pull=false` prevents re-downloading. To pre-pull:

```bash
docker pull catthehacker/ubuntu:act-latest
```

---

## Integration with Agent Workflows

### Agent Push Protocol

In projects using protoLabs Studio for AI agent orchestration, the local Docker CI gate is enforced at the protocol level. The push sequence is:

```
1. pnpm run format           → Auto-fix formatting
2. git add -u                → Stage format changes
3. pnpm run preflight        → Fast local gates (~30s)
4. ./scripts/act-ci.sh       → Full Docker CI (~4 min)
5. HUSKY=0 git commit        → Commit (hooks bypassed for agents)
6. HUSKY=0 git push          → Push ONCE
7. gh pr create + auto-merge → Create PR with auto-merge enabled
```

### Why Both Preflight AND act

`pnpm run preflight` runs in ~30 seconds and catches 90% of issues (lint, format, type-check, build, smart tests). `./scripts/act-ci.sh` runs in ~4 minutes but guarantees CI parity by executing inside Docker containers identical to GitHub Actions.

The protocol runs preflight first (fast feedback loop) and act second (final guarantee).

### Context Files That Enforce the Gate

Two context files are injected into agent prompts to enforce the protocol:

**`.automaker/context/act-local-ci-gate.md`** — Describes what the local CI gate is, what jobs it runs, and that it is mandatory. Agents are instructed: "Before every `git push`, run `./scripts/act-ci.sh`. If it fails, fix the issue and re-run. Do NOT push code that fails the local Docker CI gate."

**`.automaker/context/agent-push-protocol.md`** — The complete push sequence with zero-tolerance enforcement. Includes the full `format -> preflight -> act-ci.sh -> commit -> push` pipeline with explicit instructions that code does not leave the machine until it passes.

### HUSKY=0 Bypass Issue

AI agents execute git operations with `HUSKY=0` to bypass git hooks (the hooks require an interactive terminal). This means the pre-push hook (`scripts/pre-push-check.sh`) is never executed by agents.

The act gate compensates for this. Since hooks are bypassed, the Docker CI gate is the only thing standing between an agent and a broken push. This is why it must be enforced at the protocol level (in context files), not at the git hook level.

### Feature Request: Configurable Pre-Push Command

A pending feature request for protoLabs Studio is a configurable `prePushCommand` in project settings that would run automatically before every agent push, regardless of `HUSKY=0`. This would make the act gate truly mandatory at the platform level rather than relying on agent prompt compliance.

---

## VRT (Visual Regression Testing) Considerations

### Platform-Specific Snapshots

VRT uses Playwright with Chromium to capture component screenshots. Rendering differs between platforms due to font rasterization, anti-aliasing, and sub-pixel rendering differences.

Snapshots are stored in platform-specific directories:

```
__screenshots__/
  linux/       ← Generated in Docker (matches CI)
  darwin/      ← Generated on macOS (local development)
```

The `{platform}` template token in the Playwright config auto-segments snapshots by OS.

### Baseline Strategy

- **Linux baselines should be committed** — These match the CI environment (GitHub Actions runs on Linux).
- **macOS baselines should be gitignored** — These are for local development reference only and differ from CI.

### Font Rendering Consistency

Font rendering is the primary source of cross-platform snapshot differences. Use web fonts (e.g., Geist) loaded via `@font-face` for consistency. System fonts (e.g., `-apple-system`, `Segoe UI`) render differently on every platform.

### Docker VRT

Generate Linux baselines locally using Docker:

```bash
pnpm run test:vrt:docker
```

This runs Playwright inside a Docker container matching the CI environment, producing snapshots that will match GitHub Actions exactly.

### Cross-Platform Tolerance

When comparing snapshots from the same platform, a `maxDiffPixelRatio` of 2% handles minor rendering variations (sub-pixel rounding, anti-aliasing differences between runs). Cross-platform comparisons (Linux vs macOS) should never be done — they will always fail.

### VRT and Docker Desktop Limitations

VRT has the same Docker Desktop limitations as the full test suite — Chromium + VirtioFS under heavy I/O can crash the storage driver. For VRT, this is typically less severe because VRT tests run fewer concurrent browser instances than the full vitest suite.

---

## What Works vs What Doesn't

### Works Reliably

| Gate | Time | Notes |
|---|---|---|
| Lint in Docker | 18-61s | ESLint, no external dependencies |
| Format check in Docker | 95-108s | Prettier, CPU-bound |
| TypeScript strict check in Docker | 33-65s | `tsc --noEmit`, CPU-bound |
| Full build + CEM in Docker | ~201s | Vite build, CEM generation, dry-run publish |
| Smart tests in Docker | ~29s | Changed components only (1-5 at a time) |
| Batched tests in Docker | varies | All components in groups of 10, sequential |

### Does Not Work Reliably

| What | Why | Severity |
|---|---|---|
| Full test suite in single container | Docker Desktop VirtioFS storage driver crashes under heavy Chromium + Vitest I/O on macOS | High — use `--batch` instead |
| VRT in standard Docker run | Same Chromium + VirtioFS issue | Medium — use `test:vrt:docker` script |
| `dorny/paths-filter` in act | Requires GitHub API context (`GITHUB_TOKEN`, PR diff endpoint) | N/A — excluded from `act-ci.yml` |
| `pnpm/action-setup` in act | Corrupts `PATH` — installed pnpm binary is unreachable after the action runs | N/A — replaced with `corepack` |
| `actions/setup-node` in act | Unnecessary — base image includes Node.js | N/A — removed |

### Workarounds

| Problem | Workaround |
|---|---|
| Full test suite OOMs/crashes | Use `--batch` to run in groups of 10 |
| Rosetta emulation overhead | Use `--native` for ARM64 containers |
| Playwright browser re-download | Volume mount `~/.cache/ms-playwright-{arch}` (automatic) |
| Stale containers eating resources | `./scripts/act-ci.sh --clean` |
| VirtioFS storage driver crash | Clean containers + retry with `--batch` |

---

## Replicating to Other Projects

### Step 1: Copy Configuration Files

Copy these four files into your project:

```
.actrc                          ← act default flags
.github/act-event.json          ← Mock PR event payload
.github/workflows/act-ci.yml   ← Local CI workflow (customize jobs)
scripts/act-ci.sh               ← Wrapper script
scripts/test-batch.sh           ← Batched test runner (if applicable)
```

Make the scripts executable:

```bash
chmod +x scripts/act-ci.sh scripts/test-batch.sh
```

### Step 2: Customize `act-ci.yml`

Replace the jobs with your project's quality gates. Key rules:

1. **Use `corepack` instead of `pnpm/action-setup`:**
   ```yaml
   - name: Setup pnpm
     run: |
       corepack enable
       corepack prepare pnpm@9.15.9 --activate
       pnpm install --frozen-lockfile
   ```

2. **Do not use `actions/setup-node`** — the base image includes Node.js.

3. **Do not use `dorny/paths-filter`** — it requires GitHub API context. Run all jobs unconditionally.

4. **Pin your pnpm version** — Replace `9.15.9` with your project's pnpm version (check `packageManager` in `package.json`).

### Step 3: Update `.gitignore`

Add these entries:

```gitignore
# act (local CI)
.act-secrets
.act-results.json
```

### Step 4: Update `.prettierignore`

Add the pnpm store directory (created by `pnpm install` inside the container with `--bind` mode):

```
.pnpm-store/
```

Without this, `pnpm run format:check` may try to format files inside the pnpm store and fail.

### Step 5: Verify

```bash
# Make sure Docker is running
docker info

# Run the local CI
./scripts/act-ci.sh

# If the first run downloads the Docker image, wait for it to complete
# Subsequent runs will be much faster (--pull=false skips image checks)
```

### Step 6: Enforce in Your Push Protocol

Add a pre-push gate, either via:

- **Git hook** (`scripts/pre-push-check.sh`) — for human developers
- **Agent context file** — for AI agents (describe the gate and mandate it in the push protocol)
- **CI check** — fail PRs that didn't run local CI (harder to enforce, but possible via `.act-results.json` timestamp)

### Project-Specific Adaptations

| Your Project Has... | Adaptation Needed |
|---|---|
| Different package manager (npm, yarn) | Replace `corepack` commands with your package manager's install |
| No Playwright/browser tests | Remove the test job's Playwright install step and browser cache volume |
| Different Node.js version needed | Add `actions/setup-node` or use a different base image |
| Secrets required for tests | Create `.act-secrets` with `KEY=value` format (one per line, gitignored) |
| Matrix builds | act supports matrix strategies, but each combination is a separate container |
| Monorepo with Turborepo | Use `turbo run` commands, same as shown in HELiX's workflow |

---

## Reference

### Files

| File | Purpose |
|---|---|
| `.actrc` | Default flags for all `act` invocations |
| `.github/act-event.json` | Mock pull_request event payload |
| `.github/workflows/act-ci.yml` | Local CI workflow (mirrors production CI) |
| `.github/workflows/ci.yml` | Production CI workflow (runs on GitHub) |
| `scripts/act-ci.sh` | Wrapper script with flag parsing, cleanup, timing |
| `scripts/test-batch.sh` | Batched test runner (groups of N components) |
| `scripts/pre-push-check.sh` | Git pre-push hook (fast local checks) |
| `.act-results.json` | Output: status, timing, timestamp (gitignored) |
| `.act-secrets` | Secrets file for act (gitignored) |

### Links

- [nektos/act GitHub](https://github.com/nektos/act) — The act project
- [act User Guide](https://nektosact.com/) — Official documentation
- [catthehacker/ubuntu Docker images](https://github.com/catthehacker/docker-act-images) — Runner images used by act
- [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/) — Installation guide
