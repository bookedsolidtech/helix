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

# Gate 4: Changeset required for component source changes
# Every push that touches packages/hx-library/src/ must have a .changeset/*.md file.
# This ensures every component change is versioned — no silent API changes.
# Bypass: add label 'skip-changeset' on the PR, or set SKIP_CHANGESET=1 for infra work.
echo "Changeset check..."
if [ "${SKIP_CHANGESET:-0}" = "1" ]; then
  echo "SKIP_CHANGESET=1 — bypassing changeset requirement"
else
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  # Skip on main/staging/dev (promotion pushes) and audit branches
  if [[ "$BRANCH" == "main" || "$BRANCH" == "staging" || "$BRANCH" == "dev" ]] || \
     [[ "$BRANCH" == *"deep-audit"* ]] || [[ "$BRANCH" == *"audit/"* ]]; then
    echo "Changeset check skipped (branch: $BRANCH)"
  else
    # Check if this branch touches component source
    BASE_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}' || echo "dev")
    COMMON_ANCESTOR=$(git merge-base HEAD "origin/${BASE_BRANCH}" 2>/dev/null || echo "")
    if [ -n "$COMMON_ANCESTOR" ]; then
      SOURCE_CHANGED=$(git diff --name-only "$COMMON_ANCESTOR"...HEAD \
        | grep '^packages/hx-library/src/' || true)
      CHANGESET_ADDED=$(git diff --name-only "$COMMON_ANCESTOR"...HEAD \
        | grep '^\.changeset/.*\.md$' | grep -v 'README\.md' || true)

      if [ -n "$SOURCE_CHANGED" ] && [ -z "$CHANGESET_ADDED" ]; then
        echo ""
        echo "CHANGESET REQUIRED — component source was modified but no changeset found."
        echo ""
        echo "Run: npx changeset"
        echo "Then select the packages and bump type (patch/minor/major)."
        echo "Commit the generated .changeset/*.md file with your changes."
        echo ""
        echo "To bypass for infra-only work: SKIP_CHANGESET=1 git push"
        echo ""
        FAILED=1
      else
        if [ -n "$CHANGESET_ADDED" ]; then
          echo "Changeset found: $CHANGESET_ADDED"
        else
          echo "No component source changes — changeset not required"
        fi
      fi
    else
      echo "Changeset check skipped (no common ancestor found)"
    fi
  fi
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
