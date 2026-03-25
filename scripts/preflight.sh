#!/usr/bin/env bash
# ==============================================================================
# Preflight — Local CI equivalent. Run before every push.
# ==============================================================================
# Mirrors the CI pipeline exactly so all failures are caught locally.
# Fails fast on first error. Target: <3 min for a typical single-component change.
#
# Gates (in order):
#   1. Lint (ESLint)
#   2. Format check (Prettier)
#   3. Type check (TypeScript strict)
#   4. Build (Vite library mode, excludes docs)
#   5. Smart tests + coverage (changed components only)
#   6. CEM (custom-elements.json, if library source changed)
#   7. Changeset check (if component source changed)
#
# Usage:
#   pnpm run preflight
#   SKIP_CHANGESET=1 pnpm run preflight   # bypass changeset gate (infra-only changes)
# ==============================================================================

set -euo pipefail

echo "════════════════════════════════════════════════"
echo "  HELiX Preflight — local CI equivalent"
echo "════════════════════════════════════════════════"
echo ""

# ── Resolve base branch and common ancestor ──────────────────────────────────

BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null \
  | sed 's|refs/remotes/origin/||' \
  || git rev-parse --abbrev-ref origin/HEAD 2>/dev/null \
  | sed 's|origin/||' \
  || echo "dev")

COMMON_ANCESTOR=$(git merge-base HEAD "origin/${BASE_BRANCH}" 2>/dev/null || echo "")

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

# Detect changed component source files (same filter as CI and test-smart.sh)
CHANGED_COMPONENT_SOURCES=""
if [ -n "$COMMON_ANCESTOR" ]; then
  CHANGED_COMPONENT_SOURCES=$(git diff --name-only "$COMMON_ANCESTOR"...HEAD \
    | grep -E '^packages/hx-library/src/components/hx-[^/]+/[^/]+\.ts$' \
    | grep -v '\.test\.ts$' \
    | grep -v '\.stories\.ts$' \
    | grep -v '\.styles\.ts$' \
    | grep -v '/index\.ts$' \
    || true)
fi

# Detect any library source changes (for CEM gate)
LIBRARY_SOURCE_CHANGED=""
if [ -n "$COMMON_ANCESTOR" ]; then
  LIBRARY_SOURCE_CHANGED=$(git diff --name-only "$COMMON_ANCESTOR"...HEAD \
    | grep '^packages/hx-library/src/' || true)
fi

# ── Gate 1: Lint ─────────────────────────────────────────────────────────────

echo "▶ [1/7] Lint"
pnpm run lint
echo "  ✓ Lint passed"
echo ""

# ── Gate 2: Format check ─────────────────────────────────────────────────────

echo "▶ [2/7] Format check"
pnpm run format:check
echo "  ✓ Format passed"
echo ""

# ── Gate 3: Type check ───────────────────────────────────────────────────────

echo "▶ [3/7] Type check"
pnpm run type-check
echo "  ✓ Type check passed"
echo ""

# ── Gate 4: Build ────────────────────────────────────────────────────────────

echo "▶ [4/7] Build"
pnpm turbo run build --filter='!docs'
echo "  ✓ Build passed"
echo ""

# ── Gate 5: Smart tests + coverage ───────────────────────────────────────────

echo "▶ [5/7] Smart tests + coverage"

if [ -z "$CHANGED_COMPONENT_SOURCES" ]; then
  echo "  ✓ No component source changes — tests skipped"
  TESTS_RAN=0
else
  # Extract unique component names
  COMPONENTS=$(echo "$CHANGED_COMPONENT_SOURCES" \
    | sed -E 's|packages/hx-library/src/components/(hx-[^/]+)/.*|\1|' \
    | sort -u)
  PATTERN=$(echo "$COMPONENTS" | tr '\n' '|' | sed 's/|$//')

  echo "  Testing: $(echo "$COMPONENTS" | tr '\n' ' ')"

  # Run with coverage.enabled so check-coverage.mjs has data
  (cd packages/hx-library && pnpm exec vitest run "${PATTERN}/" \
    --reporter=verbose \
    --coverage.enabled)

  TESTS_RAN=1
  echo "  ✓ Tests passed"
fi
echo ""

# ── Gate 6 (coverage) — runs immediately after tests if they ran ──────────────

if [ "${TESTS_RAN:-0}" -eq 1 ]; then
  echo "  Checking per-component coverage thresholds..."
  node scripts/check-coverage.mjs
  echo "  ✓ Coverage passed"
  echo ""
fi

# ── Gate 6: CEM ──────────────────────────────────────────────────────────────

echo "▶ [6/7] CEM"
if [ -n "$LIBRARY_SOURCE_CHANGED" ]; then
  pnpm run cem
  echo "  ✓ CEM generated"
else
  echo "  ✓ No library source changes — CEM skipped"
fi
echo ""

# ── Gate 7: Changeset ────────────────────────────────────────────────────────

echo "▶ [7/7] Changeset"

if [ "${SKIP_CHANGESET:-0}" = "1" ]; then
  echo "  ✓ SKIP_CHANGESET=1 — bypassed"
elif [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "staging" || "$CURRENT_BRANCH" == "dev" ]] \
  || [[ "$CURRENT_BRANCH" == *"deep-audit"* ]] || [[ "$CURRENT_BRANCH" == *"audit/"* ]]; then
  echo "  ✓ Changeset check skipped (branch: $CURRENT_BRANCH)"
elif [ -n "$COMMON_ANCESTOR" ] && [ -n "$CHANGED_COMPONENT_SOURCES" ]; then
  CHANGESET_ADDED=$(git diff --name-only "$COMMON_ANCESTOR"...HEAD \
    | grep '^\.changeset/.*\.md$' | grep -v 'README\.md' || true)

  if [ -z "$CHANGESET_ADDED" ]; then
    echo ""
    echo "  ✗ CHANGESET REQUIRED — component source was modified but no changeset found."
    echo ""
    echo "    Run: pnpm exec changeset"
    echo "    Select the package, bump type, and write a description."
    echo "    Commit the .changeset/*.md file with your changes."
    echo ""
    echo "    To bypass for infra-only work: SKIP_CHANGESET=1 pnpm run preflight"
    echo ""
    exit 1
  fi
  echo "  ✓ Changeset found: $CHANGESET_ADDED"
else
  echo "  ✓ No component source changes — changeset not required"
fi
echo ""

# ── All gates passed ──────────────────────────────────────────────────────────

echo "════════════════════════════════════════════════"
echo "  ✓ All preflight gates passed — safe to push!"
echo "════════════════════════════════════════════════"
