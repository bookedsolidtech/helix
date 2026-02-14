#!/bin/bash

# WC-2026 Prerequisites Check Script
# Usage: curl -fsSL https://raw.githubusercontent.com/himerus/wc-2026/main/scripts/check-prerequisites.sh | bash

echo "🔍 Checking WC-2026 Prerequisites..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ALL_GOOD=true

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  NODE_MAJOR=$(echo $NODE_VERSION | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 20 ]; then
    echo -e "${GREEN}✓ ${NODE_VERSION}${NC}"
  else
    echo -e "${YELLOW}⚠️  ${NODE_VERSION} (20.x recommended)${NC}"
    ALL_GOOD=false
  fi
else
  echo -e "${RED}✗ Not installed${NC}"
  echo "  Install: https://nodejs.org/ (version 20.x)"
  ALL_GOOD=false
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  echo -e "${GREEN}✓ ${NPM_VERSION}${NC}"
else
  echo -e "${RED}✗ Not installed${NC}"
  echo "  npm comes with Node.js"
  ALL_GOOD=false
fi

# Check nvm (optional but recommended)
echo -n "Checking nvm (optional)... "
if command -v nvm &> /dev/null; then
  NVM_VERSION=$(nvm --version)
  echo -e "${GREEN}✓ ${NVM_VERSION}${NC}"
else
  echo -e "${YELLOW}⚠️  Not installed (recommended)${NC}"
  echo "  Install: https://github.com/nvm-sh/nvm#installing-and-updating"
  echo "  nvm allows easy Node.js version switching"
fi

# Check Git
echo -n "Checking Git... "
if command -v git &> /dev/null; then
  GIT_VERSION=$(git --version | cut -d' ' -f3)
  echo -e "${GREEN}✓ ${GIT_VERSION}${NC}"
else
  echo -e "${RED}✗ Not installed${NC}"
  echo "  Install: https://git-scm.com/downloads"
  ALL_GOOD=false
fi

# Check code editor (optional)
echo -n "Checking code editor... "
if command -v code &> /dev/null; then
  echo -e "${GREEN}✓ VS Code detected${NC}"
elif [ -d "/Applications/Visual Studio Code.app" ]; then
  echo -e "${GREEN}✓ VS Code detected${NC}"
elif [ -d "/Applications/Cursor.app" ]; then
  echo -e "${GREEN}✓ Cursor detected${NC}"
else
  echo -e "${YELLOW}⚠️  No editor detected${NC}"
  echo "  Recommended: VS Code (https://code.visualstudio.com/)"
fi

echo ""

# Summary
if [ "$ALL_GOOD" = true ]; then
  echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                                           ║${NC}"
  echo -e "${GREEN}║  ✓ All prerequisites met!                ║${NC}"
  echo -e "${GREEN}║                                           ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${BLUE}🚀 You're ready to set up WC-2026!${NC}"
  echo ""
  echo "Run the setup script:"
  echo -e "${YELLOW}curl -fsSL https://raw.githubusercontent.com/himerus/wc-2026/main/scripts/setup.sh | bash${NC}"
else
  echo -e "${RED}╔═══════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                                           ║${NC}"
  echo -e "${RED}║  ✗ Some prerequisites missing             ║${NC}"
  echo -e "${RED}║                                           ║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════╝${NC}"
  echo ""
  echo "Please install missing prerequisites above, then re-run this check."
fi
