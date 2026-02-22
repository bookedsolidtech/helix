#!/usr/bin/env bash
# ==============================================================================
# Pre-Push Quality Gate
# ==============================================================================
# Runs before every push to enforce comprehensive quality standards.
# This is the full quality gate suite - ALL checks must pass.
# ==============================================================================

set -e

echo "🚀 Running pre-push quality gate..."
echo ""

# Track overall success
FAILED=0

# ==============================================================================
# Gate 1: Full Type Check
# ==============================================================================
echo "📘 Gate 1: Full TypeScript type check..."
if npm run type-check; then
  echo "✅ Type check passed"
else
  echo "❌ Type check failed"
  FAILED=1
fi
echo ""

# ==============================================================================
# Gate 2: Full Test Suite
# ==============================================================================
echo "🧪 Gate 2: Running full test suite..."
if npm run test; then
  echo "✅ All tests passed"
else
  echo "❌ Test suite failed"
  FAILED=1
fi
echo ""

# ==============================================================================
# Gate 3: Lint Check
# ==============================================================================
echo "🔍 Gate 3: Linting codebase..."
if npm run lint; then
  echo "✅ Lint check passed"
else
  echo "❌ Lint check failed"
  FAILED=1
fi
echo ""

# ==============================================================================
# Gate 4: Format Check
# ==============================================================================
echo "💅 Gate 4: Checking code formatting..."
if npm run format:check; then
  echo "✅ Format check passed"
else
  echo "❌ Format check failed"
  echo "Run 'npm run format' to fix formatting issues"
  FAILED=1
fi
echo ""

# ==============================================================================
# Gate 5: Build All Packages
# ==============================================================================
echo "🏗️  Gate 5: Building all packages..."
if npm run build; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  FAILED=1
fi
echo ""

# ==============================================================================
# Gate 6: Bundle Size Budget
# ==============================================================================
echo "📦 Gate 6: Checking bundle size budgets..."

# Per-component budget: 5KB gzipped
COMPONENT_BUDGET=5120
# Full bundle budget: 50KB gzipped
BUNDLE_BUDGET=51200

# Check individual components
for component in hx-button hx-card hx-text-input hx-alert hx-badge hx-checkbox hx-container hx-form hx-prose hx-radio-group hx-select hx-switch hx-textarea; do
  file="packages/hx-library/dist/components/${component}/index.js"
  if [ -f "$file" ]; then
    raw_size=$(wc -c < "$file" | tr -d ' ')
    gzip_size=$(gzip -c "$file" | wc -c | tr -d ' ')
    raw_kb=$(echo "scale=2; $raw_size / 1024" | bc)
    gzip_kb=$(echo "scale=2; $gzip_size / 1024" | bc)

    if [ "$gzip_size" -gt "$COMPONENT_BUDGET" ]; then
      echo "  ❌ ${component}: ${raw_kb}KB raw / ${gzip_kb}KB gzipped (exceeds 5KB budget)"
      FAILED=1
    else
      echo "  ✅ ${component}: ${raw_kb}KB raw / ${gzip_kb}KB gzipped"
    fi
  fi
done

# Check full bundle
full="packages/hx-library/dist/index.js"
if [ -f "$full" ]; then
  raw_size=$(wc -c < "$full" | tr -d ' ')
  gzip_size=$(gzip -c "$full" | wc -c | tr -d ' ')
  raw_kb=$(echo "scale=2; $raw_size / 1024" | bc)
  gzip_kb=$(echo "scale=2; $gzip_size / 1024" | bc)

  if [ "$gzip_size" -gt "$BUNDLE_BUDGET" ]; then
    echo "  ❌ Full bundle: ${raw_kb}KB raw / ${gzip_kb}KB gzipped (exceeds 50KB budget)"
    FAILED=1
  else
    echo "  ✅ Full bundle: ${raw_kb}KB raw / ${gzip_kb}KB gzipped"
  fi
else
  echo "  ❌ Full bundle not found at ${full}"
  FAILED=1
fi
echo ""

# ==============================================================================
# Gate 7: CEM Generation
# ==============================================================================
echo "📋 Gate 7: Generating Custom Elements Manifest..."
if npm run cem; then
  echo "✅ CEM generated successfully"
else
  echo "❌ CEM generation failed"
  FAILED=1
fi
echo ""

# ==============================================================================
# Gate 8: Code Quality Checks (optional warnings)
# ==============================================================================
echo "🔬 Gate 8: Code quality checks..."

# Check for TODO/FIXME in tracked files (warning only)
# Note: Checks all tracked files, not just staged, since pre-push runs on committed code
TODO_COUNT=$(git ls-files | xargs grep -n "TODO\|FIXME" 2>/dev/null | wc -l | tr -d ' ')
if [ "$TODO_COUNT" -gt 0 ]; then
  echo "  ⚠️  Found $TODO_COUNT TODO/FIXME comments in codebase"
  echo "  Consider resolving these before pushing to production"
else
  echo "  ✅ No TODO/FIXME comments in codebase"
fi

# Check for console.log in production code (warning only)
CONSOLE_COUNT=$(git ls-files | grep -E '\.(ts|tsx|js|jsx)$' | grep -v '\.test\.' | grep -v '\.stories\.' | xargs grep -n "console\.log" 2>/dev/null | wc -l | tr -d ' ')
if [ "$CONSOLE_COUNT" -gt 0 ]; then
  echo "  ⚠️  Found $CONSOLE_COUNT console.log statements in production code"
  echo "  Consider removing these before pushing to production"
else
  echo "  ✅ No console.log in production code"
fi

echo ""

# ==============================================================================
# Summary
# ==============================================================================
if [ $FAILED -eq 1 ]; then
  echo ""
  echo "❌ Pre-push quality gate FAILED"
  echo ""
  echo "Fix the issues above before pushing."
  echo "To bypass this check (NOT recommended): git push --no-verify"
  exit 1
else
  echo ""
  echo "✅ All pre-push quality gates passed"
  echo "Safe to push to remote"
  echo ""
fi

exit 0
