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
# Gate 1: TypeScript Strict Mode (for staged TypeScript files)
# ==============================================================================
if [ -n "$STAGED_TS_FILES" ]; then
  echo "📘 Gate 1: TypeScript strict mode compliance check..."
  if npm run hooks:type-check-strict --silent; then
    echo "✅ TypeScript strict check passed"
  else
    echo "❌ TypeScript strict check failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 1.5: No Hardcoded Values (for staged component files)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ] || [ -n "$STAGED_TS_FILES" ]; then
  echo "🎨 Gate 1.5: Design token compliance check..."
  if npm run hooks:no-hardcoded-values --silent; then
    echo "✅ No hardcoded values check passed"
  else
    echo "❌ No hardcoded values check failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 1.7: Event Type Safety (H07)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "🎯 Gate 1.7: Event type safety check..."
  if npm run hooks:event-type-safety --silent; then
    echo "✅ Event type safety check passed"
  else
    echo "❌ Event type safety check failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 1.8: JSDoc Coverage (H08)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "📝 Gate 1.8: JSDoc coverage check..."
  if npm run hooks:jsdoc-coverage --silent; then
    echo "✅ JSDoc coverage check passed"
  else
    echo "❌ JSDoc coverage check failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 1.9: Component Test Required (H10)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "🧪 Gate 1.9: Component test requirement check..."
  if npm run hooks:component-test-required --silent; then
    echo "✅ Component test check passed"
  else
    echo "❌ Component test check failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 1.10: Storybook Validation (H09)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "📖 Gate 1.10: Storybook validation check..."
  if npm run hooks:storybook-validation --silent; then
    echo "✅ Storybook validation passed"
  else
    echo "❌ Storybook validation failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 1.11: No Console Logs (H12)
# ==============================================================================
if [ -n "$STAGED_TS_FILES" ]; then
  echo "🚫 Gate 1.11: Console statement check..."
  if npm run hooks:no-console-logs --silent; then
    echo "✅ No console logs check passed"
  else
    echo "❌ Console logs check failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 2: Test Coverage Gate
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "📊 Gate 2: Test coverage verification..."
  if npm run hooks:test-coverage-gate --silent; then
    echo "✅ Test coverage check passed"
  else
    echo "❌ Test coverage check failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 2.2: Accessibility Regression Guard (H06)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "♿ Gate 2.2: Accessibility regression check..."
  if npm run hooks:a11y-regression-guard --silent; then
    echo "✅ Accessibility check passed"
  else
    echo "❌ Accessibility check failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 2.5: Test Modified Components
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  # Extract unique component names (e.g., hx-button, hx-card)
  COMPONENTS=$(echo "$STAGED_COMPONENT_FILES" | sed -E 's|.*components/([^/]+)/.*|\1|' | sort -u)

  if [ -n "$COMPONENTS" ]; then
    echo "🧪 Gate 2.5: Testing modified components..."
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
# Gate 3: Bundle Size Guard (H04)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "📦 Gate 3: Bundle size guard check..."
  if npm run hooks:bundle-size-guard --silent; then
    echo "✅ Bundle size check passed"
  else
    echo "❌ Bundle size check failed"
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
