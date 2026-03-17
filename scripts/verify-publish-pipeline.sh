#!/usr/bin/env bash
# =============================================================================
# verify-publish-pipeline.sh
# Validates the pnpm publish pipeline for @helixui/library and @helixui/tokens.
#
# Checks:
#   1. Changeset config — baseBranch, linked packages, ignore list
#   2. publish.yml workflow — pnpm setup, NODE_AUTH_TOKEN auth pattern
#   3. pnpm pack output — dist/ present, no dev files (.test.ts, .stories.ts)
#
# Usage: bash scripts/verify-publish-pipeline.sh
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0
FAIL=0

green() { printf '\033[0;32m[PASS]\033[0m %s\n' "$1"; }
red()   { printf '\033[0;31m[FAIL]\033[0m %s\n' "$1"; }
info()  { printf '\033[0;34m[INFO]\033[0m %s\n' "$1"; }

check() {
  local label="$1"
  local result="$2"  # "pass" or "fail"
  if [[ "$result" == "pass" ]]; then
    green "$label"
    PASS=$((PASS + 1))
  else
    red "$label"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "=============================================="
echo " HELiX pnpm Publish Pipeline Verification"
echo "=============================================="
echo ""

# ---------------------------------------------------------------------------
# 1. Changeset config
# ---------------------------------------------------------------------------
info "Checking changeset config..."

CHANGESET_CONFIG="$REPO_ROOT/.changeset/config.json"

if [[ ! -f "$CHANGESET_CONFIG" ]]; then
  red "Changeset config not found at .changeset/config.json"
  FAIL=$((FAIL + 1))
else
  # baseBranch
  BASE_BRANCH=$(python3 -c "import json; d=json.load(open('$CHANGESET_CONFIG')); print(d.get('baseBranch',''))")
  [[ "$BASE_BRANCH" == "main" ]] && check "changeset baseBranch is 'main'" "pass" || check "changeset baseBranch is 'main' (got: $BASE_BRANCH)" "fail"

  # linked packages include both publishable packages
  LINKED=$(python3 -c "import json; d=json.load(open('$CHANGESET_CONFIG')); print(str(d.get('linked','')))")
  [[ "$LINKED" == *"@helixui/library"* ]] && check "changeset linked includes @helixui/library" "pass" || check "changeset linked includes @helixui/library" "fail"
  [[ "$LINKED" == *"@helixui/tokens"* ]]  && check "changeset linked includes @helixui/tokens"  "pass" || check "changeset linked includes @helixui/tokens" "fail"

  # ignore list covers all non-publishable packages
  IGNORE=$(python3 -c "import json; d=json.load(open('$CHANGESET_CONFIG')); print(str(d.get('ignore','')))")
  for pkg in "@helixui/admin" "@helixui/storybook" "docs" "@helixui/mcp-cem-analyzer" "@helixui/mcp-health-scorer" "@helixui/mcp-typescript-diagnostics" "@helixui/mcp-shared"; do
    [[ "$IGNORE" == *"$pkg"* ]] && check "changeset ignores $pkg" "pass" || check "changeset ignores $pkg" "fail"
  done

  # access is public
  ACCESS=$(python3 -c "import json; d=json.load(open('$CHANGESET_CONFIG')); print(d.get('access',''))")
  [[ "$ACCESS" == "public" ]] && check "changeset access is 'public'" "pass" || check "changeset access is 'public' (got: $ACCESS)" "fail"
fi

echo ""
# ---------------------------------------------------------------------------
# 2. publish.yml workflow audit
# ---------------------------------------------------------------------------
info "Checking publish.yml workflow..."

WORKFLOW="$REPO_ROOT/.github/workflows/publish.yml"

if [[ ! -f "$WORKFLOW" ]]; then
  red "publish.yml not found at .github/workflows/publish.yml"
  FAIL=$((FAIL + 1))
else
  # pnpm/action-setup present
  grep -q "pnpm/action-setup" "$WORKFLOW" && check "workflow uses pnpm/action-setup" "pass" || check "workflow uses pnpm/action-setup" "fail"

  # actions/setup-node with cache pnpm
  grep -q "cache: 'pnpm'" "$WORKFLOW" && check "workflow setup-node has cache: 'pnpm'" "pass" || check "workflow setup-node has cache: 'pnpm'" "fail"

  # registry-url set (required for NODE_AUTH_TOKEN injection)
  grep -q "registry-url" "$WORKFLOW" && check "workflow setup-node has registry-url" "pass" || check "workflow setup-node has registry-url" "fail"

  # NODE_AUTH_TOKEN used (not NPM_TOKEN directly in env)
  grep -q "NODE_AUTH_TOKEN" "$WORKFLOW" && check "workflow uses NODE_AUTH_TOKEN (not NPM_TOKEN directly)" "pass" || check "workflow uses NODE_AUTH_TOKEN" "fail"

  # NPM_CONFIG_PROVENANCE present
  grep -q "NPM_CONFIG_PROVENANCE" "$WORKFLOW" && check "workflow sets NPM_CONFIG_PROVENANCE=true" "pass" || check "workflow sets NPM_CONFIG_PROVENANCE=true" "fail"

  # id-token write permission for provenance
  grep -q "id-token: write" "$WORKFLOW" && check "workflow has id-token: write permission (provenance)" "pass" || check "workflow has id-token: write permission" "fail"

  # pnpm install --frozen-lockfile
  grep -q "pnpm install --frozen-lockfile" "$WORKFLOW" && check "workflow uses pnpm install --frozen-lockfile" "pass" || check "workflow uses pnpm install --frozen-lockfile" "fail"

  # changeset:publish script (not npx changeset publish)
  grep -q "pnpm run changeset:publish" "$WORKFLOW" && check "workflow uses pnpm run changeset:publish" "pass" || check "workflow uses pnpm run changeset:publish" "fail"

  # HUSKY=0 to skip hooks during CI git operations
  grep -q "HUSKY: '0'" "$WORKFLOW" && check "workflow sets HUSKY=0 to skip hooks" "pass" || check "workflow sets HUSKY=0" "fail"
fi

echo ""
# ---------------------------------------------------------------------------
# 3. Package scripts — no npm/npx remnants
# ---------------------------------------------------------------------------
info "Checking package scripts for npm/npx remnants..."

LIBRARY_PKG="$REPO_ROOT/packages/hx-library/package.json"
TOKENS_PKG="$REPO_ROOT/packages/hx-tokens/package.json"

# hx-library build should not use bare `npm run` (as opposed to `pnpm run`)
# Check by looking for ' npm ' or '&& npm ' — `pnpm run` would NOT match these.
LIB_BUILD=$(python3 -c "import json; d=json.load(open('$LIBRARY_PKG')); print(d.get('scripts',{}).get('build',''))")
if echo "$LIB_BUILD" | grep -qE '(^| )npm (run|exec|install)'; then
  check "hx-library build script uses pnpm (not bare npm/npx)" "fail"
else
  check "hx-library build script uses pnpm (not bare npm/npx)" "pass"
fi

# hx-tokens build should not use npx
TOK_BUILD=$(python3 -c "import json; d=json.load(open('$TOKENS_PKG')); print(d.get('scripts',{}).get('build',''))")
if echo "$TOK_BUILD" | grep -qE '(^| )npx '; then
  check "hx-tokens build script uses pnpm exec (not npx)" "fail"
else
  check "hx-tokens build script uses pnpm exec (not npx)" "pass"
fi

echo ""
# ---------------------------------------------------------------------------
# 4. pnpm pack output — verify tarball contents
# ---------------------------------------------------------------------------
info "Packing packages and verifying tarball contents..."

TMPDIR_LIB=$(mktemp -d)
TMPDIR_TOK=$(mktemp -d)
trap "rm -rf '$TMPDIR_LIB' '$TMPDIR_TOK'" EXIT

# Check dist exists before packing
if [[ ! -d "$REPO_ROOT/packages/hx-library/dist" ]]; then
  red "hx-library dist/ not built — run 'pnpm run build:library' first"
  FAIL=$((FAIL + 1))
else
  (cd "$REPO_ROOT/packages/hx-library" && pnpm pack --pack-destination "$TMPDIR_LIB" 2>/dev/null)
  LIB_TGZ=$(ls "$TMPDIR_LIB"/*.tgz 2>/dev/null | head -1)
  if [[ -z "$LIB_TGZ" ]]; then
    check "hx-library pack produced a tarball" "fail"
  else
    check "hx-library pack produced a tarball" "pass"
    CONTENTS=$(tar tzf "$LIB_TGZ")

    # Must-have files
    echo "$CONTENTS" | grep -q "package/dist/"          && check "hx-library tarball contains dist/"            "pass" || check "hx-library tarball contains dist/"            "fail"
    echo "$CONTENTS" | grep -q "package/package.json"   && check "hx-library tarball contains package.json"    "pass" || check "hx-library tarball contains package.json"    "fail"
    echo "$CONTENTS" | grep -q "package/README.md"      && check "hx-library tarball contains README.md"       "pass" || check "hx-library tarball contains README.md"       "fail"
    echo "$CONTENTS" | grep -q "package/custom-elements.json" && check "hx-library tarball contains custom-elements.json" "pass" || check "hx-library tarball contains custom-elements.json" "fail"
    echo "$CONTENTS" | grep -q "package/fouc.css"       && check "hx-library tarball contains fouc.css"        "pass" || check "hx-library tarball contains fouc.css"        "fail"

    # Must-not-have dev files
    BAD_FILES=$(echo "$CONTENTS" | grep -E '\.test\.|\.stories\.|/src/' | grep -v 'package/src/tokens.json' || true)
    [[ -z "$BAD_FILES" ]] && check "hx-library tarball excludes dev files (.test.ts, .stories.ts, src/)" "pass" || {
      check "hx-library tarball excludes dev files" "fail"
      echo "  Unexpected files: $BAD_FILES"
    }
  fi
fi

if [[ ! -d "$REPO_ROOT/packages/hx-tokens/dist" ]]; then
  red "hx-tokens dist/ not built — run 'pnpm run build' first"
  FAIL=$((FAIL + 1))
else
  (cd "$REPO_ROOT/packages/hx-tokens" && pnpm pack --pack-destination "$TMPDIR_TOK" 2>/dev/null)
  TOK_TGZ=$(ls "$TMPDIR_TOK"/*.tgz 2>/dev/null | head -1)
  if [[ -z "$TOK_TGZ" ]]; then
    check "hx-tokens pack produced a tarball" "fail"
  else
    check "hx-tokens pack produced a tarball" "pass"
    CONTENTS=$(tar tzf "$TOK_TGZ")

    echo "$CONTENTS" | grep -q "package/dist/"          && check "hx-tokens tarball contains dist/"         "pass" || check "hx-tokens tarball contains dist/"         "fail"
    echo "$CONTENTS" | grep -q "package/package.json"   && check "hx-tokens tarball contains package.json" "pass" || check "hx-tokens tarball contains package.json" "fail"
    echo "$CONTENTS" | grep -q "package/README.md"      && check "hx-tokens tarball contains README.md"    "pass" || check "hx-tokens tarball contains README.md"    "fail"
    echo "$CONTENTS" | grep -q "package/src/tokens.json" && check "hx-tokens tarball contains src/tokens.json (intentional)" "pass" || check "hx-tokens tarball contains src/tokens.json" "fail"

    BAD_FILES=$(echo "$CONTENTS" | grep -E '\.test\.|\.stories\.' || true)
    [[ -z "$BAD_FILES" ]] && check "hx-tokens tarball excludes dev files" "pass" || {
      check "hx-tokens tarball excludes dev files" "fail"
      echo "  Unexpected files: $BAD_FILES"
    }
  fi
fi

echo ""
# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
TOTAL=$((PASS + FAIL))
echo "=============================================="
echo " Results: $PASS/$TOTAL checks passed"
echo "=============================================="
if [[ $FAIL -gt 0 ]]; then
  echo ""
  red "$FAIL check(s) failed — see above for details"
  exit 1
else
  green "All $PASS checks passed. Publish pipeline is correctly configured."
fi
