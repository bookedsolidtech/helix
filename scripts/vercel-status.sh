#!/usr/bin/env bash
# Vercel Deployment Status Monitor
# Loads HELIX_VERCEL_TOKEN from .env.local via dotenv pattern
# Usage: bash scripts/vercel-status.sh [list|deployments|logs <deployment-url>]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/apps/admin/.env.local"

# Load token from .env.local
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found"
  exit 1
fi

export HELIX_VERCEL_TOKEN
HELIX_VERCEL_TOKEN=$(grep '^HELIX_VERCEL_TOKEN=' "$ENV_FILE" | cut -d= -f2)

if [[ -z "$HELIX_VERCEL_TOKEN" ]]; then
  echo "Error: HELIX_VERCEL_TOKEN not found in $ENV_FILE"
  exit 1
fi

CMD="${1:-deployments}"

case "$CMD" in
  list)
    echo "=== Vercel Projects ==="
    vercel ls --token "$HELIX_VERCEL_TOKEN"
    ;;
  teams)
    echo "=== Vercel Teams ==="
    vercel teams ls --token "$HELIX_VERCEL_TOKEN"
    ;;
  deployments)
    echo "=== Recent Deployments ==="
    vercel ls --token "$HELIX_VERCEL_TOKEN" 2>/dev/null
    ;;
  logs)
    if [[ -z "${2:-}" ]]; then
      echo "Usage: $0 logs <deployment-url>"
      exit 1
    fi
    vercel logs "$2" --token "$HELIX_VERCEL_TOKEN"
    ;;
  inspect)
    if [[ -z "${2:-}" ]]; then
      echo "Usage: $0 inspect <deployment-url>"
      exit 1
    fi
    vercel inspect "$2" --token "$HELIX_VERCEL_TOKEN"
    ;;
  *)
    echo "Usage: $0 [list|teams|deployments|logs <url>|inspect <url>]"
    exit 1
    ;;
esac
