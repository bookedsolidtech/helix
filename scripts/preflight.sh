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
#   8. Full test suite (all components — catches CI Matrix failures locally)
#   9. Docker CI (act — full CI pipeline in Docker containers)
#  10. AAA cert integrity (committed verdicts snapshot — refuses Partial/Fail)
#  11. Docs version drift (refuses stale `@helixui/*` version pins in docs)
#
# Usage:
#   pnpm run preflight
#   SKIP_CHANGESET=1 pnpm run preflight                       # bypass changeset gate (infra-only changes)
#   SKIP_ACT=1 pnpm run preflight                             # bypass Docker CI gate
#   SKIP_FULL_TESTS=1 pnpm run preflight                      # bypass full test suite (use smart only)
#   AAA_ALLOW_PARTIAL="hx-slider,hx-file-upload" pnpm ...     # acknowledge known Partial verdicts
#   HELIX_ALLOW_VERSION_DRIFT=1 pnpm run preflight            # bypass docs version-drift gate (emergency only)
#
# For full CI Matrix parity (Node 22/24):
#   ./scripts/act-ci.sh --matrix
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

echo "▶ [1/12] Lint"
pnpm run lint
echo "  ✓ Lint passed"
echo ""

# ── Gate 2: Format check ─────────────────────────────────────────────────────

echo "▶ [2/12] Format check"
pnpm run format:check
echo "  ✓ Format passed"
echo ""

# ── Gate 2.5: Drupal CDN Subresource Integrity (SRI) ─────────────────────────
# External jsDelivr assets in *.libraries.yml MUST carry an `integrity` key.
# Without SRI, a poisoned/compromised CDN response executes arbitrary code in
# every consuming Drupal site (supply-chain attack). This gate scans every
# `type: external` jsDelivr entry and fails if any one lacks `integrity`, so a
# future edit that adds an un-hashed CDN asset (or drops a hash on upgrade) is
# caught locally instead of shipping a silent security regression.
#
# Why a bash scan and not a YAML parser: the repo's preflight runtime cannot
# assume a YAML lib is installed, and the structural signal we need is simple
# and line-oriented — a jsDelivr URL line that opens an `external` asset block
# without an `integrity:` key before the next asset/section boundary.

echo "▶ [2.5/12] Drupal CDN Subresource Integrity (SRI)"

SRI_VIOLATIONS=0
# Find every *.libraries.yml tracked in the repo (Drupal library definitions).
while IFS= read -r libfile; do
  [ -n "$libfile" ] || continue
  # awk state machine: strips trailing #comments, then for every jsDelivr URL used
  # as a mapping KEY requires `integrity` when the mapping is `type: external`. It
  # handles BOTH block-style (nested mapping on following indented lines) AND
  # flow-style (inline `{ type: external, integrity: … }` on the same line). The URL
  # is extracted by its own pattern (the path has no colons) so the colon in
  # `https://` never confuses key detection. A block ends at the next line indented
  # at or below the URL key's indentation.
  MISSING=$(awk '
    function indent(s,   i) { i=0; while (substr(s,i+1,1)==" ") i++; return i }
    function url_of(s) {
      if (match(s, /https?:\/\/cdn\.jsdelivr\.net[^[:space:]:{]*/)) return substr(s, RSTART, RLENGTH)
      return ""
    }
    function close_block() {
      if (open && b_ext && !b_int) print b_url
      open = 0; b_ext = 0; b_int = 0
    }
    {
      s = $0; sub(/[[:space:]]*#.*$/, "", s)       # drop trailing comment
      if (s ~ /^[[:space:]]*$/) next                # skip blank / comment-only
      ind = indent(s)
      if (open && ind <= b_indent) close_block()    # left the current block
      # A jsDelivr URL used as a mapping key: line ends with ":" (block) or
      # ":" followed by an inline "{ … }" flow mapping.
      if (s ~ /cdn\.jsdelivr\.net/ && s ~ /:[[:space:]]*(\{.*\})?[[:space:]]*$/) {
        u = url_of(s)
        if (s ~ /:[[:space:]]*\{/) {                 # flow-style: whole mapping inline
          if (s ~ /type:[[:space:]]*external/ && s !~ /integrity/) print u
        } else {                                     # block-style: scan following lines
          open = 1; b_indent = ind; b_url = u; b_ext = 0; b_int = 0
        }
        next
      }
      if (open) {
        if (s ~ /type:[[:space:]]*external/) b_ext = 1
        if (s ~ /integrity/) b_int = 1
      }
    }
    END { close_block() }
  ' "$libfile")

  if [ -n "$MISSING" ]; then
    echo "  ✗ $libfile — external jsDelivr asset(s) missing \`integrity\`:"
    echo "$MISSING" | sed 's/^/      /'
    SRI_VIOLATIONS=$((SRI_VIOLATIONS + 1))
  fi
done < <(git ls-files '*.libraries.yml')

if [ "$SRI_VIOLATIONS" -gt 0 ]; then
  echo ""
  echo "  ✗ SRI GATE FAILED — do NOT push."
  echo "    Every \`type: external\` jsDelivr asset must declare an \`integrity\`"
  echo "    (sha384) attribute. Compute it against the pinned version:"
  echo "      curl -sL <jsdelivr-url> | openssl dgst -sha384 -binary | openssl base64 -A"
  echo "    then add under the asset's \`attributes:\` map:"
  echo "      attributes:"
  echo "        crossorigin: anonymous"
  echo "        integrity: 'sha384-<hash>'"
  exit 1
fi
echo "  ✓ All external jsDelivr library assets carry SRI integrity"
echo ""

# ── Gate 3: Type check ───────────────────────────────────────────────────────

echo "▶ [3/12] Type check"
pnpm run type-check
echo "  ✓ Type check passed"
echo ""

# ── Gate 4: Build ────────────────────────────────────────────────────────────

echo "▶ [4/12] Build"
pnpm turbo run build --filter='!docs'
echo "  ✓ Build passed"
echo ""

# ── Gate 4.5: CDN bundle + size budget (FS-019) ──────────────────────────────
# Builds the CDN artifact pack and enforces per-artifact gz size ceilings
# defined in .cdn-budget.json. The CDN payload is what Drupal/CDN consumers
# actually download; this gate catches regressions before they ship.

echo "▶ [4.5/9] CDN bundle + size budget"
if [ "${SKIP_CDN_SIZE:-0}" = "1" ]; then
  echo "  ⚠ SKIP_CDN_SIZE=1 — CDN size gate bypassed"
else
  pnpm --filter=@helixui/library run build:cdn > /tmp/helix-cdn-build.log 2>&1 || {
    echo "  ✗ CDN build failed — see /tmp/helix-cdn-build.log"
    tail -40 /tmp/helix-cdn-build.log
    exit 1
  }
  node scripts/check-cdn-size.mjs
  echo "  ✓ CDN size budget passed"
fi
echo ""

# ── Gate 5: Smart tests + coverage ───────────────────────────────────────────

echo "▶ [5/12] Smart tests + coverage"

if [ -z "$CHANGED_COMPONENT_SOURCES" ]; then
  echo "  ✓ No component source changes — tests skipped"
  TESTS_RAN=0
else
  # Extract unique component names
  COMPONENTS=$(echo "$CHANGED_COMPONENT_SOURCES" \
    | sed -E 's|packages/hx-library/src/components/(hx-[^/]+)/.*|\1|' \
    | sort -u)

  echo "  Testing: $(echo "$COMPONENTS" | tr '\n' ' ')"

  # Vitest 3.x treats positional args as literal substring filters, not
  # pipe-delimited regex alternation — build one filter per component so the
  # path match works even when every component directory is touched.
  FILTERS=()
  while IFS= read -r component; do
    [ -n "$component" ] && FILTERS+=("${component}/")
  done <<< "$COMPONENTS"

  # Run with coverage.enabled so check-coverage.mjs has data
  (cd packages/hx-library && pnpm exec vitest run "${FILTERS[@]}" \
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

echo "▶ [6/12] CEM"
if [ -n "$LIBRARY_SOURCE_CHANGED" ]; then
  pnpm run cem
  echo "  ✓ CEM generated"
else
  echo "  ✓ No library source changes — CEM skipped"
fi
pnpm --filter=@helixui/library run figma:inventory:check
echo "  ✓ Figma inventory current"
echo ""

# ── Gate 7: Changeset ────────────────────────────────────────────────────────

echo "▶ [7/12] Changeset"

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

# ── Gate 7.5: Storybook interaction tests ────────────────────────────────────
# Runs story interaction tests when any .stories.ts file is changed.
# This gate exists because test:smart SKIPS story files entirely, and the
# full test suite (Gate 8) also does not run Storybook tests — they run in a
# dedicated Storybook Tests CI job. Agents pushed story changes without this
# check and repeatedly failed CI. This gate closes that gap.

STORY_FILES_CHANGED=""
if [ -n "$COMMON_ANCESTOR" ]; then
  STORY_FILES_CHANGED=$(git diff --name-only "$COMMON_ANCESTOR"...HEAD \
    | grep -E '\.stories\.ts$' || true)
fi

echo "▶ [7.5/9] Storybook interaction tests"

if [ -z "$STORY_FILES_CHANGED" ]; then
  echo "  ✓ No .stories.ts changes — Storybook tests skipped"
elif [ "${SKIP_STORYBOOK:-0}" = "1" ]; then
  echo "  ⚠ SKIP_STORYBOOK=1 — Storybook test gate bypassed"
else
  echo "  Changed story files detected:"
  echo "$STORY_FILES_CHANGED" | sed 's/^/    /'
  echo "  Running Storybook interaction tests (this takes ~3-5 min)..."
  echo "  (Mirrors the dedicated Storybook Tests CI job exactly)"
  if pnpm --filter=@helixui/storybook run test; then
    echo "  ✓ Storybook tests passed"
  else
    echo ""
    echo "  ✗ STORYBOOK TESTS FAILED — do NOT push."
    echo "    You changed .stories.ts files and the story interaction tests fail."
    echo "    Fix the story assertions, then re-run: pnpm run preflight"
    echo ""
    echo "    Common causes:"
    echo "      - getByLabelText() can't traverse shadow DOM — use canvas.getByRole() or"
    echo "        el.shadowRoot.querySelector() patterns instead"
    echo "      - userEvent.clear()/type() can't focus shadow DOM inputs — interact via"
    echo "        the host element or test via attribute/property changes"
    echo "      - querySelector() on canvas returns null — use within(el.shadowRoot) or"
    echo "        the component's public event API"
    echo "    To bypass (only for confirmed non-test story-only changes):"
    echo "      SKIP_STORYBOOK=1 pnpm run preflight"
    exit 1
  fi
fi
echo ""

# ── Gate 8: Full test suite ──────────────────────────────────────────────────
# Runs the FULL test suite (all components), not just changed ones.
# This catches failures that CI Matrix (Node 22/24) would catch.
# The smart tests in Gate 5 only test changed components — this gate
# ensures no cross-component regressions slip through.

echo "▶ [8/12] Full test suite"

if [ "${SKIP_FULL_TESTS:-0}" = "1" ]; then
  echo "  SKIP_FULL_TESTS=1 — full test suite bypassed"
elif [ -z "$CHANGED_COMPONENT_SOURCES" ] && [ -z "$LIBRARY_SOURCE_CHANGED" ]; then
  echo "  No library changes — full test suite skipped"
else
  echo "  Running full test suite with hang watchdog..."
  echo "  (This mirrors CI Matrix — catches cross-component regressions)"

  LOGFILE=$(mktemp /tmp/helix-preflight-full.XXXXXX)
  STALE_TIMEOUT=15
  POLL_INTERVAL=3
  FULL_START=$(date +%s)

  (cd packages/hx-library && pnpm exec vitest run --no-file-parallelism --reporter=verbose > "$LOGFILE" 2>&1) &
  VITEST_PID=$!

  LAST_SIZE=0
  STALE_SECONDS=0
  FORCE_KILLED=false

  while kill -0 "$VITEST_PID" 2>/dev/null; do
    sleep "$POLL_INTERVAL"
    CURRENT_SIZE=$(stat -f "%z" "$LOGFILE" 2>/dev/null || stat -c "%s" "$LOGFILE" 2>/dev/null || echo 0)
    ELAPSED=$(( $(date +%s) - FULL_START ))

    if [ "$CURRENT_SIZE" -eq "$LAST_SIZE" ] && [ "$CURRENT_SIZE" -gt 0 ]; then
      STALE_SECONDS=$((STALE_SECONDS + POLL_INTERVAL))
      if [ "$STALE_SECONDS" -ge "$STALE_TIMEOUT" ] && [ "$ELAPSED" -ge 30 ]; then
        echo "  [watchdog] Output stale for ${STALE_SECONDS}s — force killing vitest"
        kill "$VITEST_PID" 2>/dev/null || true
        sleep 1
        kill -9 "$VITEST_PID" 2>/dev/null || true
        FORCE_KILLED=true
        break
      fi
    else
      STALE_SECONDS=0
    fi
    LAST_SIZE=$CURRENT_SIZE
  done

  wait "$VITEST_PID" 2>/dev/null
  VITEST_EXIT=$?

  # Parse results
  FAILED_TESTS=$(grep -c "^[[:space:]]*×" "$LOGFILE" 2>/dev/null || echo 0)
  PASSED_TESTS=$(grep -c "^[[:space:]]*✓" "$LOGFILE" 2>/dev/null || echo 0)
  FULL_DURATION=$(( $(date +%s) - FULL_START ))

  pkill -f "chrome-headless-shell" 2>/dev/null || true

  if [ "$FORCE_KILLED" = true ]; then
    echo "  (vitest force-killed after teardown hang — results from output)"
  fi

  echo "  ${PASSED_TESTS} passed, ${FAILED_TESTS} failed (${FULL_DURATION}s)"

  if [ "$FAILED_TESTS" -gt 0 ]; then
    echo ""
    echo "  FAILED TESTS:"
    grep "^[[:space:]]*×" "$LOGFILE" 2>/dev/null | head -20
    echo ""
    echo "  Full test suite log: $LOGFILE"
    echo ""
    echo "  FULL TEST SUITE FAILED — do NOT push."
    echo "  This failure would be caught by CI Matrix."
    echo "  Fix the failing tests, then re-run: pnpm run preflight"
    exit 1
  fi

  rm -f "$LOGFILE"
  echo "  Full test suite passed"
fi
echo ""

# ── Gate 9: Docker CI (act) ─────────────────────────────────────────────────

echo "▶ [9/12] Docker CI (act)"

if [ "${SKIP_ACT:-0}" = "1" ]; then
  echo "  ⚠ SKIP_ACT=1 — Docker CI gate bypassed"
elif ! command -v act &>/dev/null || ! docker info &>/dev/null 2>&1; then
  echo "  ⚠ WARNING: Docker CI gate skipped — Docker not running or act not installed"
  echo "    CI may fail on push. Install: brew install act && open -a Docker"
else
  echo "  Running full CI in Docker (this takes ~4 minutes)..."
  if ./scripts/act-ci.sh; then
    echo "  ✓ Docker CI passed"
  else
    echo ""
    echo "  ✗ DOCKER CI FAILED — do NOT push."
    echo "    Fix the errors above and re-run: pnpm run preflight"
    exit 1
  fi
fi
echo ""

# ── Gate 10: AAA cert integrity ──────────────────────────────────────────────

echo "▶ [10/12] AAA cert integrity"

if node scripts/check-aaa-verdicts.mjs; then
  : # passed (output already printed by the script)
else
  echo ""
  echo "  ✗ AAA CERT INTEGRITY GATE FAILED — do NOT push."
  echo "    A verdict regression would land Partially Supports or Does Not Support"
  echo "    on at least one (component × criterion) cell in the committed snapshot."
  echo "    Fix the underlying gap OR set AAA_ALLOW_PARTIAL=<tags> to acknowledge"
  echo "    a known-honest Partial (paper-trail via commit message)."
  exit 1
fi
echo ""

# ── Gate 11: Docs version drift ──────────────────────────────────────────────

echo "▶ [11/12] Docs version drift"

if node scripts/check-version-drift.mjs; then
  : # passed (output already printed by the script)
else
  echo ""
  echo "  ✗ DOCS VERSION-DRIFT GATE FAILED — do NOT push."
  echo "    At least one doc page references an outdated \`@helixui/*\` version."
  echo "    Update the stale CDN URLs / install commands to the current package"
  echo "    versions, OR set HELIX_ALLOW_VERSION_DRIFT=1 to bypass (emergency only)."
  exit 1
fi
echo ""

# ── Gate 12: Docs claims fact-check ──────────────────────────────────────────

echo "▶ [12/12] Docs claims fact-check"

if node scripts/check-docs-claims.mjs; then
  : # passed (output already printed by the script)
else
  echo ""
  echo "  ✗ DOCS CLAIMS GATE FAILED — do NOT push."
  echo "    At least one doc page contains a structural fact-check failure:"
  echo "      • <hx-*> reference to a component that does not exist in CEM"
  echo "      • --hx-* CSS custom property with a fabricated namespace"
  echo "      • @helixui/* package reference that does not exist on npm or in workspace"
  echo "      • Internal /<slug>/ link that no longer resolves"
  echo "      • Stale repo reference (github.com/himerus/wc-2026)"
  echo "      • WCAG 2.1 AA conformance claim (should be 2.2 AAA on P0)"
  echo "    See \`.reports/docs-fact-check/programmatic-findings.md\` for details."
  exit 1
fi
echo ""

# ── All gates passed ──────────────────────────────────────────────────────────

echo "════════════════════════════════════════════════"
echo "  ✓ All preflight gates passed — safe to push!"
echo "════════════════════════════════════════════════"
