---
'@helixui/library': patch
---

Upgrade `@bookedsolid/rea` to 0.9.2 (exact).

- 0.9.2 fixes the push-review hook cache-check invocation — `node_modules/.bin/rea` is a POSIX shell shim (pnpm) or symlink (npm), never a plain JS file, so prefixing it with `node` produced a SyntaxError and the gate silently fell back to `{"hit":false}` (upstream bookedsolidtech/rea#53).
- Synced `.claude/hooks/_lib/push-review-core.sh` from the 0.9.2 package so the local hook matches the fixed invocation (execute the shim directly; only prepend `node` on the `dist/cli/index.js` fallback).
- Removed legacy `review.push_review` key from `.rea/policy.yaml` (carried from 0.9.1 upgrade) — the 0.9.x policy schema only recognizes `review.codex_required`.

No consumer-facing API changes. Internal governance infra only.
