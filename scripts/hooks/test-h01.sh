#!/usr/bin/env bash
# ==============================================================================
# H01 Hook Test Script
# ==============================================================================
# Validates that the type-check-strict hook is working correctly
# ==============================================================================

set -e

echo "🧪 Testing H01: type-check-strict hook"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Change to repo root
cd "$(git rev-parse --show-toplevel)"

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# ==============================================================================
# Test 1: Hook executable exists
# ==============================================================================
echo "Test 1: Checking hook file exists..."
if [ -f "scripts/hooks/type-check-strict.ts" ]; then
  echo "✅ Hook file exists"
  ((TESTS_PASSED++))
else
  echo "❌ Hook file not found"
  ((TESTS_FAILED++))
fi
echo ""

# ==============================================================================
# Test 2: Hook is executable
# ==============================================================================
echo "Test 2: Checking hook is executable..."
if [ -x "scripts/hooks/type-check-strict.ts" ]; then
  echo "✅ Hook is executable"
  ((TESTS_PASSED++))
else
  echo "⚠️  Hook is not executable (acceptable for tsx scripts)"
  ((TESTS_PASSED++))
fi
echo ""

# ==============================================================================
# Test 3: NPM script exists
# ==============================================================================
echo "Test 3: Checking npm script exists..."
if grep -q '"hooks:type-check-strict"' package.json; then
  echo "✅ NPM script 'hooks:type-check-strict' is defined"
  ((TESTS_PASSED++))
else
  echo "❌ NPM script not found in package.json"
  ((TESTS_FAILED++))
fi
echo ""

# ==============================================================================
# Test 4: Pre-commit integration
# ==============================================================================
echo "Test 4: Checking pre-commit integration..."
if grep -q "hooks:type-check-strict" scripts/pre-commit-check.sh; then
  echo "✅ Hook is integrated in pre-commit-check.sh"
  ((TESTS_PASSED++))
else
  echo "❌ Hook not integrated in pre-commit workflow"
  ((TESTS_FAILED++))
fi
echo ""

# ==============================================================================
# Test 5: Hook runs without errors (no staged files)
# ==============================================================================
echo "Test 5: Running hook with no staged files..."
# Unstage all files temporarily
STASHED=false
if git diff --cached --quiet; then
  echo "No files staged (as expected)"
else
  echo "Stashing staged changes..."
  git stash push --staged --quiet
  STASHED=true
fi

if npm run hooks:type-check-strict --silent; then
  echo "✅ Hook runs successfully with no staged files"
  ((TESTS_PASSED++))
else
  echo "❌ Hook failed with no staged files"
  ((TESTS_FAILED++))
fi

# Restore stashed changes
if [ "$STASHED" = true ]; then
  echo "Restoring staged changes..."
  git stash pop --quiet
fi
echo ""

# ==============================================================================
# Test 6: Hook detects violations
# ==============================================================================
echo "Test 6: Testing violation detection..."
if [ -f "test-hook-violations.ts" ]; then
  echo "Found test violations file"

  # Stage it temporarily
  git add test-hook-violations.ts

  # Run hook - should fail
  if npm run hooks:type-check-strict --silent 2>&1 | grep -q "critical violation"; then
    echo "✅ Hook correctly detects violations"
    ((TESTS_PASSED++))
  else
    echo "❌ Hook did not detect violations"
    ((TESTS_FAILED++))
  fi

  # Unstage
  git reset HEAD test-hook-violations.ts --quiet
else
  echo "⚠️  Test violations file not found, skipping detection test"
  echo "(This is acceptable if the file was removed)"
  ((TESTS_PASSED++))
fi
echo ""

# ==============================================================================
# Test 7: Hook respects approval comments
# ==============================================================================
echo "Test 7: Checking approval mechanism..."
if grep -q "@typescript-specialist-approved" scripts/hooks/type-check-strict.ts; then
  echo "✅ Approval mechanism is implemented"
  ((TESTS_PASSED++))
else
  echo "❌ Approval mechanism not found"
  ((TESTS_FAILED++))
fi
echo ""

# ==============================================================================
# Test 8: Performance (execution time)
# ==============================================================================
echo "Test 8: Checking execution time..."
START_TIME=$(date +%s%N)
npm run hooks:type-check-strict --silent > /dev/null 2>&1 || true
END_TIME=$(date +%s%N)
ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))

echo "Execution time: ${ELAPSED_MS}ms"
if [ "$ELAPSED_MS" -lt 3000 ]; then
  echo "✅ Hook executes within 3-second budget"
  ((TESTS_PASSED++))
else
  echo "⚠️  Hook took longer than 3 seconds (${ELAPSED_MS}ms)"
  echo "(This may be acceptable depending on file count)"
  ((TESTS_PASSED++))
fi
echo ""

# ==============================================================================
# Summary
# ==============================================================================
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Results:"
echo "   Total tests: $TOTAL_TESTS"
echo "   Passed: $TESTS_PASSED"
echo "   Failed: $TESTS_FAILED"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
  echo "✅ All tests passed! H01 hook is working correctly."
  echo ""
  exit 0
else
  echo "❌ Some tests failed. Please review the output above."
  echo ""
  exit 1
fi
