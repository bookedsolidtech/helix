#!/usr/bin/env bash
# ==============================================================================
# MCP Server Health Check
# ==============================================================================
# Verifies that all MCP servers are built and ready to run.
# Run this after 'npm install' or when MCP servers fail to start.
# ==============================================================================

set -e

echo "🔍 MCP Server Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

FAILED=0
MISSING_BUILDS=()

# Define MCP servers from .mcp.json
MCP_SERVERS=(
  "apps/mcp-servers/cem-analyzer"
  "apps/mcp-servers/health-scorer"
  "apps/mcp-servers/typescript-diagnostics"
)

# Check each server
for server in "${MCP_SERVERS[@]}"; do
  SERVER_NAME=$(basename "$server")
  BUILD_DIR="$server/build"
  ENTRY_POINT="$BUILD_DIR/index.js"

  echo "📦 Checking $SERVER_NAME..."

  # Check if build directory exists
  if [ ! -d "$BUILD_DIR" ]; then
    echo "  ❌ Build directory missing: $BUILD_DIR"
    MISSING_BUILDS+=("$server")
    FAILED=1
    continue
  fi

  # Check if entry point exists
  if [ ! -f "$ENTRY_POINT" ]; then
    echo "  ❌ Entry point missing: $ENTRY_POINT"
    MISSING_BUILDS+=("$server")
    FAILED=1
    continue
  fi

  # Check if entry point is executable
  if [ ! -x "$ENTRY_POINT" ]; then
    echo "  ⚠️  Entry point not executable (fixing): $ENTRY_POINT"
    chmod +x "$ENTRY_POINT"
  fi

  echo "  ✅ $SERVER_NAME is ready"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 1 ]; then
  echo ""
  echo "❌ MCP Health Check FAILED"
  echo ""
  echo "Missing builds for:"
  for server in "${MISSING_BUILDS[@]}"; do
    echo "  - $server"
  done
  echo ""
  echo "To fix, run:"
  echo "  npm run build:mcp-servers"
  echo ""
  exit 1
else
  echo ""
  echo "✅ All MCP servers are healthy and ready"
  echo ""
fi

exit 0
