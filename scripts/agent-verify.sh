#!/usr/bin/env bash
# agent-verify.sh — mandatory pre-push gate for all automated agents
#
# Run this from your worktree root before EVERY commit + push.
# Exits non-zero on any failure. Do not push if this script fails.
#
# Usage: bash scripts/agent-verify.sh
#        (or: ./scripts/agent-verify.sh)

set -euo pipefail

WORKTREE_ROOT="$(git rev-parse --show-toplevel)"
cd "$WORKTREE_ROOT"

echo "=== agent-verify: pre-push gate ==="
echo "Worktree: $WORKTREE_ROOT"
echo ""

# 1. Format
echo "[1/4] Format..."
pnpm run format
echo "  ✓ format"

# 2. Lint
echo "[2/4] Lint..."
pnpm run lint
echo "  ✓ lint"

# 3. Type check
echo "[3/4] Type check..."
pnpm run type-check
echo "  ✓ type-check"

# 4. Smart tests (only changed components)
echo "[4/4] Smart tests..."
pnpm run test:smart
echo "  ✓ tests"

echo ""
echo "=== agent-verify: ALL GATES PASSED — safe to push ==="
