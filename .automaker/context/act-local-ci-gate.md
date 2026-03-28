# Local Docker CI Gate — act

## Overview

This project uses [nektos/act](https://github.com/nektos/act) to run GitHub Actions
workflows locally inside Docker containers before any code is pushed to GitHub.

**This is a MANDATORY quality gate. Code does not push to GitHub until act passes.**

## How It Works

```
Agent commits → pnpm run preflight (8 gates including Docker CI) → push
```

The act workflow (`.github/workflows/act-ci.yml`) mirrors the core quality gates
from the production CI (`ci.yml`) but uses `corepack` instead of GitHub-specific
actions that don't work in local Docker.

## Jobs in the Local CI

| Job | What it checks | Time |
|-----|---------------|------|
| lint | ESLint strict | ~50s |
| format | Prettier check | ~90s |
| type-check | TypeScript strict (no any) | ~60s |
| build | Full library build + CEM | ~180s |
| test | Vitest browser tests (Playwright/Chromium) | ~120s |
| quality-gates | Aggregate — ALL above must pass | ~1s |

**Total: ~4 minutes** (jobs run in parallel where possible)

## Commands

```bash
./scripts/act-ci.sh              # Run all quality gates
./scripts/act-ci.sh --job lint   # Run a specific job
./scripts/act-ci.sh --job test   # Run tests only
./scripts/act-ci.sh --list       # List available jobs
```

## Requirements

- Docker must be running (`docker info`)
- act must be installed (`brew install act`)
- `.actrc` must exist in repo root (checked in)

## For Agents

Before every `git push`, run `pnpm run preflight` (which includes act as Gate 8).
If it fails, fix the issue and re-run. Do NOT push code that fails any gate.

act-ci.sh can still be run standalone for debugging:
```bash
./scripts/act-ci.sh --job test   # Run a specific job in isolation
```

To skip the Docker CI gate when Docker is unavailable: `SKIP_ACT=1 pnpm run preflight`

This is not a suggestion. This is a hard gate. See `agent-push-protocol.md`.
