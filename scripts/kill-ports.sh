#!/bin/bash

# WC-2026 Kill Dev Server Ports
# Parses workspace package.json files for port numbers and kills any processes using them.
# Usage: npm run kill-ports

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Gather ports from workspace package.json dev scripts
PORTS=()

while IFS= read -r pkg; do
  if [ -f "$pkg" ]; then
    # Extract port numbers from "dev" script lines: -p NNNN or --port NNNN
    port=$(grep -E '"dev"' "$pkg" 2>/dev/null | grep -oE '(-p|--port)\s*[0-9]+' | grep -oE '[0-9]+' || true)
    if [ -n "$port" ]; then
      PORTS+=("$port")
    fi
  fi
done < <(find "$REPO_ROOT/apps" "$REPO_ROOT/packages" -maxdepth 2 -name "package.json" -not -path "*/node_modules/*" 2>/dev/null)

# Deduplicate
PORTS=($(printf '%s\n' "${PORTS[@]}" | sort -un))

echo "Dev server ports: ${PORTS[*]}"
echo ""

KILLED=0

for port in "${PORTS[@]}"; do
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}Port $port in use — killing PIDs: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    KILLED=$((KILLED + 1))
  else
    echo -e "${GREEN}Port $port — clear${NC}"
  fi
done

echo ""
if [ "$KILLED" -gt 0 ]; then
  echo -e "${GREEN}Killed processes on $KILLED port(s).${NC}"
else
  echo -e "${GREEN}All ports already clear.${NC}"
fi
