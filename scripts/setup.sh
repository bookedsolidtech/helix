#!/bin/bash
set -e

# WC-2026 One-Command Setup Script
# Usage: curl -fsSL https://raw.githubusercontent.com/himerus/wc-2026/main/scripts/setup.sh | bash

echo "🚀 WC-2026 Setup Starting..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running in correct directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: package.json not found${NC}"
  echo "Please run this script from the wc-2026 root directory"
  exit 1
fi

# Step 1: Check Node version
echo -e "${BLUE}📋 Step 1: Checking Node.js version...${NC}"
if [ -f ".nvmrc" ]; then
  REQUIRED_NODE=$(cat .nvmrc)
  echo "Required Node version: ${REQUIRED_NODE}"

  if command -v nvm &> /dev/null; then
    echo "Using nvm to switch to Node ${REQUIRED_NODE}..."
    nvm use || nvm install ${REQUIRED_NODE}
  else
    CURRENT_NODE=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$CURRENT_NODE" -lt "$REQUIRED_NODE" ]; then
      echo -e "${YELLOW}⚠️  Warning: Node.js ${REQUIRED_NODE}.x recommended, but you have v${CURRENT_NODE}${NC}"
      echo "Install nvm: https://github.com/nvm-sh/nvm#installing-and-updating"
    fi
  fi
else
  echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
fi
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}📦 Step 2: Installing dependencies...${NC}"
echo "This may take 2-3 minutes..."
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Type-check
echo -e "${BLUE}🔍 Step 3: Type-checking project...${NC}"
npm run type-check
echo -e "${GREEN}✓ Type-check passed${NC}"
echo ""

# Step 4: Build all packages
echo -e "${BLUE}🏗️  Step 4: Building all packages...${NC}"
npm run build
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Success!
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                           ║${NC}"
echo -e "${GREEN}║  ✓ WC-2026 Setup Complete!               ║${NC}"
echo -e "${GREEN}║                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo ""
echo "  1. Start documentation site:"
echo -e "     ${YELLOW}npm run dev:docs${NC}"
echo "     Visit: http://localhost:4321"
echo ""
echo "  2. View all available commands:"
echo -e "     ${YELLOW}npm run${NC}"
echo ""
echo "  3. Read the onboarding guide:"
echo -e "     ${YELLOW}cat ONBOARDING.md${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
