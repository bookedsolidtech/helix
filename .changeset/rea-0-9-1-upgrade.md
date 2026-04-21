---
'@helixui/library': patch
---

Upgrade `@bookedsolid/rea` to 0.9.1 (exact).

- Removed legacy `review.push_review` key from `.rea/policy.yaml` — 0.9.1 policy schema is strict and only recognizes `review.codex_required`. Presence of the old key causes the loader to reject the policy.
- Synced drifted hooks from the 0.9.1 package: `push-review-gate.sh`, `commit-review-gate.sh`, `security-disclosure-gate.sh`.
- Installed new hooks introduced in 0.8.0+: `push-review-gate-git.sh` (git-native adapter) and `_lib/push-review-core.sh` (shared core with BUG-008 stdin-sniffing).
- Updated `.husky/pre-push` to invoke `push-review-gate.sh` directly (without `exec`) so the existing `EXIT` trap can clean up its temp file before handing off.

No consumer-facing API changes. Internal governance infra only.
