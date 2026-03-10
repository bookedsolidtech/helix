#!/usr/bin/env bash
# ============================================================================
# Branch Protection Setup — wc-2026
# ============================================================================
# Configures branch protection rules via GitHub CLI.
# Requires: gh CLI authenticated with admin access to the repository.
#
# Usage: bash scripts/setup-branch-protection.sh [owner/repo]
# ============================================================================

set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q '.nameWithOwner')}"

echo "Configuring branch protection for: ${REPO}"
echo ""

for BRANCH in main dev staging; do
  echo "── Setting protection for: ${BRANCH} ──"

  gh api "repos/${REPO}/branches/${BRANCH}/protection" \
    --method PUT \
    --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Quality Gates"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

  echo "  Branch '${BRANCH}' protected."
  echo ""
done

echo "Branch protection configured for main, dev, staging."
echo "Required status check: 'Quality Gates' (aggregate job)"
echo ""
echo "To verify: gh api repos/${REPO}/branches/main/protection --jq '.required_status_checks'"
