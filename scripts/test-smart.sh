#!/usr/bin/env bash
# Smart targeted test runner — only tests components changed vs origin/dev
set -e

BASE="${TEST_BASE_BRANCH:-origin/dev}"
COMMON_ANCESTOR=$(git merge-base HEAD "$BASE" 2>/dev/null || echo "")

if [ -z "$COMMON_ANCESTOR" ]; then
  echo "No common ancestor with $BASE — running full test suite"
  cd packages/hx-library && npx vitest run
  exit $?
fi

# Find changed component source files
CHANGED=$(git diff --name-only "$COMMON_ANCESTOR"...HEAD \
  | grep -E '^packages/hx-library/src/components/hx-[^/]+/[^/]+\.ts$' \
  | grep -v '\.test\.ts$' \
  | grep -v '\.stories\.ts$' \
  | grep -v '\.styles\.ts$' \
  | grep -v '/index\.ts$' \
  || true)

if [ -z "$CHANGED" ]; then
  echo "No component source changes — skipping tests"
  exit 0
fi

# Extract unique component names
COMPONENTS=$(echo "$CHANGED" | sed -E 's|packages/hx-library/src/components/(hx-[^/]+)/.*|\1|' | sort -u)
PATTERN=$(echo "$COMPONENTS" | tr '\n' '|' | sed 's/|$//')

echo "Smart test: $COMPONENTS"
cd packages/hx-library && npx vitest run "$PATTERN/" --reporter=verbose
