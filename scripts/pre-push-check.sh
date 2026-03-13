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

# Gate 3.5: Targeted component tests (only for changed components)
# Runs *.test.ts only for components whose SOURCE files changed.
# Skips entirely for story-only, Twig, AUDIT.md, changeset-only pushes.
# Timeout: 90 seconds total — fail gracefully if exceeded.
echo "Targeted component tests..."
BRANCH_35=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
BASE_BRANCH_35=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' \
  || git rev-parse --abbrev-ref origin/HEAD 2>/dev/null | sed 's|origin/||' \
  || echo "dev")
COMMON_ANCESTOR_35=$(git merge-base HEAD "origin/${BASE_BRANCH_35}" 2>/dev/null || echo "")

if [ -z "$COMMON_ANCESTOR_35" ]; then
  echo "Targeted tests skipped (no common ancestor found)"
else
  # Find changed component SOURCE files (exclude .test.ts, .stories.ts, .styles.ts, index.ts, non-.ts)
  CHANGED_COMPONENT_SOURCES=$(git diff --name-only "$COMMON_ANCESTOR_35"...HEAD \
    | grep -E '^packages/hx-library/src/components/hx-[^/]+/[^/]+\.ts$' \
    | grep -v '\.test\.ts$' \
    | grep -v '\.stories\.ts$' \
    | grep -v '\.styles\.ts$' \
    | grep -v '/index\.ts$' \
    || true)

  if [ -z "$CHANGED_COMPONENT_SOURCES" ]; then
    echo "Targeted tests skipped (no component source .ts files changed)"
  else
    # Extract unique component names from paths
    CHANGED_COMPONENTS=$(echo "$CHANGED_COMPONENT_SOURCES" \
      | sed -E 's|packages/hx-library/src/components/(hx-[^/]+)/.*|\1|' \
      | sort -u)

    # Build list of test files that actually exist
    TEST_FILES=""
    TESTED_COMPONENTS=""
    for COMP in $CHANGED_COMPONENTS; do
      TEST_PATH="packages/hx-library/src/components/${COMP}/${COMP}.test.ts"
      if [ -f "$TEST_PATH" ]; then
        TEST_FILES="$TEST_FILES $TEST_PATH"
        TESTED_COMPONENTS="$TESTED_COMPONENTS $COMP"
      fi
    done

    if [ -z "$TEST_FILES" ]; then
      echo "Targeted tests skipped (no test files found for changed components)"
    else
      # Trim leading spaces for display
      TESTED_COMPONENTS_DISPLAY=$(echo "$TESTED_COMPONENTS" | xargs | tr ' ' ', ')
      echo "Testing changed components: ${TESTED_COMPONENTS_DISPLAY}"

      # Build the vitest include args (relative to packages/hx-library)
      VITEST_INCLUDE_ARGS=""
      for TEST_FILE in $TEST_FILES; do
        # Strip the packages/hx-library/ prefix — vitest runs from that dir
        RELATIVE_TEST="${TEST_FILE#packages/hx-library/}"
        VITEST_INCLUDE_ARGS="$VITEST_INCLUDE_ARGS $RELATIVE_TEST"
      done

      # Run vitest with a 90-second timeout.
      # Temporarily disable set -e so we can capture the exit code ourselves.
      TEST_CMD="cd packages/hx-library && npx vitest run --reporter=verbose $VITEST_INCLUDE_ARGS 2>&1"
      set +e
      timeout 90 bash -c "$TEST_CMD"
      TEST_EXIT=$?
      set -e

      if [ $TEST_EXIT -eq 124 ]; then
        echo ""
        echo "Targeted tests TIMED OUT (90s) — tests may be hanging or environment issue."
        echo "Run manually: cd packages/hx-library && npx vitest run${VITEST_INCLUDE_ARGS}"
        echo ""
        FAILED=1
      elif [ $TEST_EXIT -ne 0 ]; then
        echo ""
        echo "Targeted tests FAILED for: ${TESTED_COMPONENTS_DISPLAY}"
        echo "Run manually: cd packages/hx-library && npx vitest run${VITEST_INCLUDE_ARGS}"
        echo ""
        FAILED=1
      else
        echo "Targeted tests passed (${TESTED_COMPONENTS_DISPLAY})"
      fi
    fi
  fi
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
    BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || git rev-parse --abbrev-ref origin/HEAD 2>/dev/null | sed 's|origin/||' || echo "dev")
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
