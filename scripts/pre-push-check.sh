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

# Gate 2: Auto-format (fix and commit any formatting drift)
echo "Auto-formatting..."
npm run format --silent 2>/dev/null || true
if ! git diff --quiet; then
  echo "Formatting applied — committing auto-format changes"
  git add -u
  git -c core.hooksPath=/dev/null commit -m "chore: auto-format"
  echo "Format committed"
else
  echo "Format already clean"
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
