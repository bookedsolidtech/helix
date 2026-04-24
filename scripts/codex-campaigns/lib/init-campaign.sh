#!/usr/bin/env bash
# Initialize the report directory tree for a campaign.
# Idempotent — safe to re-run before every batch.
#
# Usage: bash scripts/codex-campaigns/lib/init-campaign.sh <campaign-name>

set -euo pipefail

CAMPAIGN="${1:-}"
if [[ -z "$CAMPAIGN" ]]; then
  echo "usage: init-campaign.sh <campaign-name>" >&2
  exit 2
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
CAMPAIGN_REPORT_DIR="$REPO_ROOT/.reports/codex/campaigns/$CAMPAIGN"
TRANSCRIPT_DIR="$CAMPAIGN_REPORT_DIR/transcripts"
SCAFFOLD_DIR="$REPO_ROOT/scripts/codex-campaigns/campaign-$CAMPAIGN"

mkdir -p "$CAMPAIGN_REPORT_DIR" "$TRANSCRIPT_DIR"
touch "$CAMPAIGN_REPORT_DIR/findings.jsonl"

if [[ ! -d "$SCAFFOLD_DIR" ]]; then
  echo "warning: campaign scaffold missing: $SCAFFOLD_DIR" >&2
  echo "         create targets.txt and prompt.md before running." >&2
fi

echo "$CAMPAIGN_REPORT_DIR"
