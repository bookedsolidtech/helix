#!/usr/bin/env bash
# ==============================================================================
# Pre-Commit Quality Gate
# ==============================================================================
# Runs before every commit to enforce quality standards.
# This script only checks files that are staged for commit.
# Maximum execution time: 120 seconds
# ==============================================================================

set -e

# Start timeout timer
START_TIME=$(date +%s)
MAX_DURATION=120  # 2 minutes max

# Function to check timeout
check_timeout() {
  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))
  if [ $ELAPSED -gt $MAX_DURATION ]; then
    echo ""
    echo "⏱️  TIMEOUT: Pre-commit checks exceeded ${MAX_DURATION}s"
    echo "❌ Commit blocked to prevent indefinite hangs"
    echo ""
    echo "To investigate:"
    echo "  1. Run hooks individually to identify slow checks"
    echo "  2. Reduce number of staged files"
    echo "  3. Use 'git commit --no-verify' as last resort (NOT recommended)"
    exit 1
  fi
}

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
  check_timeout
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
# Gate 1.5: No Hardcoded Values (H02)
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
# Gate 1.55: Design Token Enforcement (H13)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "🎨 Gate 1.55: Design token architecture enforcement..."
  if npm run hooks:design-token-enforcement --silent; then
    echo "✅ Design token enforcement passed"
  else
    echo "❌ Design token enforcement failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 1.6: TypeScript Any Ban (H17)
# ==============================================================================
if [ -n "$STAGED_TS_FILES" ]; then
  echo "🚫 Gate 1.6: TypeScript any ban check..."
  if npm run hooks:typescript-any-ban --silent; then
    echo "✅ TypeScript any ban passed"
  else
    echo "❌ TypeScript any ban failed"
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
# Gate 1.85: Documentation Completeness (H22)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "📚 Gate 1.85: Documentation completeness check..."
  if npm run hooks:documentation-completeness --silent; then
    echo "✅ Documentation completeness check passed"
  else
    echo "❌ Documentation completeness check failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 1.86: CSS Part Documentation (H25)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "🎨 Gate 1.86: CSS part documentation check..."
  if npm run hooks:css-part-documentation --silent; then
    echo "✅ CSS part documentation check passed"
  else
    echo "❌ CSS part documentation check failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 1.87: Shadow DOM Leak Detection (H16)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "🔒 Gate 1.87: Shadow DOM leak detection..."
  if npm run hooks:shadow-dom-leak-detection --silent; then
    echo "✅ Shadow DOM leak detection passed"
  else
    echo "❌ Shadow DOM leak detection failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 1.88: Animation Budget Check (H20)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "🎬 Gate 1.88: Animation budget and WCAG compliance..."
  if npm run hooks:animation-budget-check --silent; then
    echo "✅ Animation budget check passed"
  else
    echo "❌ Animation budget check failed"
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
# Gate 2.3: Dependency Audit (H21)
# ==============================================================================
STAGED_PACKAGE_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E 'package\.json$' || true)
if [ -n "$STAGED_PACKAGE_FILES" ]; then
  echo "🔐 Gate 2.3: Dependency security audit..."
  if npm run hooks:dependency-audit --silent; then
    echo "✅ Dependency audit passed"
  else
    echo "❌ Dependency audit failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 2.4: VRT Critical Paths (H14)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "📸 Gate 2.4: VRT critical paths validation..."
  if npm run hooks:vrt-critical-paths --silent; then
    echo "✅ VRT critical paths check passed"
  else
    echo "❌ VRT critical paths check failed"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 2.5: Test Modified Components
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  # Only run tests if actual implementation files changed (not just test/story files)
  STAGED_IMPL_FILES=$(echo "$STAGED_COMPONENT_FILES" | grep -E '\.ts$' | grep -v -E '\.(test|spec|stories)\.ts$' || true)

  if [ -n "$STAGED_IMPL_FILES" ]; then
    # Extract unique component names (e.g., hx-button, hx-card)
    COMPONENTS=$(echo "$STAGED_IMPL_FILES" | sed -E 's|.*components/([^/]+)/.*|\1|' | sort -u)

    if [ -n "$COMPONENTS" ]; then
      echo "🧪 Gate 2.5: Testing modified components..."
      echo "Modified components: $(echo $COMPONENTS | tr '\n' ' ')"

      # Run tests for the library (targeted testing)
      check_timeout
      if npm run test:library --silent; then
        echo "✅ Component tests passed"
      else
        echo "❌ Component tests failed"
        FAILED=1
      fi
      echo ""
    fi
  else
    echo "ℹ️  Gate 2.5: Skipped (only test/story files changed)"
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

  # Check if CEM file exists and is valid JSON (don't regenerate, hook H05 handles accuracy)
  if [ -f "packages/hx-library/custom-elements.json" ]; then
    # Try jq if available, otherwise use node to validate JSON
    if command -v jq >/dev/null 2>&1; then
      if jq empty packages/hx-library/custom-elements.json 2>/dev/null; then
        echo "✅ CEM exists and is valid JSON"
        echo "ℹ️  CEM accuracy checked by hook H05 (cem-accuracy-check)"
      else
        echo "❌ CEM JSON is invalid - run 'npm run cem' to regenerate"
        FAILED=1
      fi
    else
      # Fallback to node for JSON validation
      if node -e "JSON.parse(require('fs').readFileSync('packages/hx-library/custom-elements.json', 'utf-8'))" 2>/dev/null; then
        echo "✅ CEM exists and is valid JSON"
        echo "ℹ️  CEM accuracy checked by hook H05 (cem-accuracy-check)"
      else
        echo "❌ CEM JSON is invalid - run 'npm run cem' to regenerate"
        FAILED=1
      fi
    fi
  else
    echo "❌ CEM file not found - run 'npm run cem' to generate"
    FAILED=1
  fi
  echo ""
fi

# ==============================================================================
# Gate 4.5: API Breaking Change Detection (H18)
# ==============================================================================
if [ -n "$STAGED_COMPONENT_FILES" ]; then
  echo "🔄 Gate 4.5: API breaking change detection..."
  if npm run hooks:api-breaking-change-detection --silent; then
    echo "✅ No breaking API changes detected"
  else
    echo "❌ Breaking API changes detected"
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
