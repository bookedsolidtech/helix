#!/usr/bin/env bash
# ==============================================================================
# Pre-Commit Quality Gate
# ==============================================================================
# Runs before every commit to enforce quality standards.
# This script only checks files that are staged for commit.
# ==============================================================================

set -e

echo "🔍 Running pre-commit quality checks..."
echo ""

# Get list of staged TypeScript files
STAGED_TS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)

# Get list of staged component files
STAGED_COMPONENT_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E 'packages/hx-library/src/components/' || true)

# Exit early if no relevant files are staged
if [ -z "$STAGED_TS_FILES" ] && [ -z "$STAGED_COMPONENT_FILES" ]; then
  echo "✅ No TypeScript or component files staged. Skipping quality checks."
  exit 0
fi

# Track overall success
FAILED=0

# ==============================================================================
# Gate 1: Type Check (for staged TypeScript files)
# ==============================================================================
if [ -n "$STAGED_TS_FILES" ]; then
  echo "📘 Gate 1: Type checking staged TypeScript files..."
  if npm run type-check --silent; then
    echo "✅ Type check passed"
  else
    echo "❌ Type check failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 2: Test Modified Components
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  # Extract unique component names (e.g., hx-button, hx-card)
  COMPONENTS=$(echo "$STAGED_COMPONENT_FILES" | sed -E 's|.*components/([^/]+)/.*|\1|' | sort -u)

  if [ -n "$COMPONENTS" ]; then
    echo "🧪 Gate 2: Testing modified components..."
    echo "Modified components: $(echo $COMPONENTS | tr '\n' ' ')"

    # Run tests for the library (targeted testing)
    if npm run test:library --silent; then
      echo "✅ Component tests passed"
    else
      echo "❌ Component tests failed"
      FAILED=1
    fi
    echo ""
  fi
fi

# ==============================================================================
# Gate 3: Bundle Size Check (if build files changed)
# ==============================================================================
if echo "$STAGED_COMPONENT_FILES" | grep -qE '\.(ts|tsx)$' && [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "📦 Gate 3: Checking bundle size impact..."

  # Build the library to check bundle size
  if npm run build:library --silent 2>&1 | grep -v "VITE"; then
    # Check if dist files exist
    if [ -f "packages/hx-library/dist/index.js" ]; then
      BUNDLE_SIZE=$(gzip -c packages/hx-library/dist/index.js | wc -c | tr -d ' ')
      BUNDLE_KB=$(echo "scale=2; $BUNDLE_SIZE / 1024" | bc)
      BUDGET_KB=50
      BUDGET_BYTES=51200

      if [ "$BUNDLE_SIZE" -gt "$BUDGET_BYTES" ]; then
        echo "❌ Bundle size ${BUNDLE_KB}KB exceeds ${BUDGET_KB}KB budget"
        FAILED=1
      else
        echo "✅ Bundle size ${BUNDLE_KB}KB (budget: ${BUDGET_KB}KB)"
      fi
    else
      echo "⚠️  No bundle found, skipping size check"
    fi
  else
    echo "⚠️  Build failed, cannot check bundle size"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 4: CEM Validation (if component files changed)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "📋 Gate 4: Validating Custom Elements Manifest..."

  if npm run cem --silent; then
    # Check if CEM was generated
    if [ -f "packages/hx-library/custom-elements.json" ]; then
      # Basic validation: check if JSON is valid
      if jq empty packages/hx-library/custom-elements.json 2>/dev/null; then
        echo "✅ CEM is valid"
      else
        echo "❌ CEM JSON is invalid"
        FAILED=1
      fi
    else
      echo "❌ CEM file not generated"
      FAILED=1
    fi
  else
    echo "❌ CEM generation failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Summary
# ==============================================================================
if [ $FAILED -eq 1 ]; then
  echo ""
  echo "❌ Pre-commit checks FAILED"
  echo ""
  echo "Fix the issues above before committing."
  echo "To bypass this check (NOT recommended): git commit --no-verify"
  exit 1
else
  echo ""
  echo "✅ All pre-commit checks passed"
  echo ""
fi

exit 0
