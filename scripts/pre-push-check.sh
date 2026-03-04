#!/usr/bin/env bash
# ==============================================================================
# Pre-Push Quality Gate (fast)
# ==============================================================================
# Quick sanity checks before push. Heavy checks (build, test, bundle size)
# are enforced by CI — this hook catches the most common issues fast.
# Target: < 30 seconds
# ==============================================================================

set -e

echo "Running pre-push quality checks..."
echo ""

FAILED=0

# Gate 1: Lint (catches no-explicit-any, unused vars, etc.)
echo "Lint check..."
if npm run lint --silent 2>/dev/null; then
  echo "Lint passed"
else
  echo "Lint FAILED — run 'npm run lint' to see errors"
  FAILED=1
fi

# Gate 2: Format (catches Prettier drift)
echo "Format check..."
if npm run format:check --silent 2>/dev/null; then
  echo "Format passed"
else
  echo "Format FAILED — run 'npm run format' to fix"
  FAILED=1
fi

# Gate 3: Type check (catches TS errors without full build)
echo "Type check..."
if npm run type-check --silent 2>/dev/null; then
  echo "Type check passed"
else
  echo "Type check FAILED — run 'npm run type-check' to see errors"
  FAILED=1
fi

echo ""

if [ $FAILED -eq 1 ]; then
  echo "Pre-push checks FAILED. Fix issues before pushing."
  echo "To bypass (NOT recommended): git push --no-verify"
  exit 1
else
  echo "Pre-push checks passed."
fi

exit 0
