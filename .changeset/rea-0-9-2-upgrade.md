---
'@helixui/library': patch
---

Upgrade `@bookedsolid/rea` to 0.9.2 (exact) + local backports of three 0.9.3 security fixes.

## Upstream bump

- 0.9.2 fixes the push-review and commit-review hook cache-check invocation — `node_modules/.bin/rea` is a POSIX shell shim (pnpm) or symlink (npm), never a plain JS file, so prefixing it with `node` produced a SyntaxError and both gates silently fell back to `{"hit":false}` (upstream bookedsolidtech/rea#53).
- Synced `.claude/hooks/_lib/push-review-core.sh` and `.claude/hooks/commit-review-gate.sh` from the 0.9.2 package so both local hooks match the fixed invocation. Both carried the identical `node <shim>` bug — without the second sync the commit gate would keep silently falling back to cache-miss on every agent commit.
- Removed legacy `review.push_review` key from `.rea/policy.yaml` (carried from 0.9.1 upgrade) — the 0.9.x policy schema only recognizes `review.codex_required`.

## Local 0.9.3 backports (CodeRabbit findings on PR #1506)

Three security findings in the upstream-synced `push-review-core.sh`. All filed upstream for 0.9.3 and patched locally as a mitigation:

- **Legacy `push_review: false` grep bypass** — removed. The raw-grep check ran before the strict schema validator, so any agent could disarm the gate by adding `push_review: false` to `.rea/policy.yaml`. Upstream: [rea#56](https://github.com/bookedsolidtech/rea/issues/56).
- **Protected-paths gap** — the matcher now also guards `.rea/` and `.husky/`. Previously an agent could flip autonomy level or neuter `.husky/pre-push` without tripping Codex review. Upstream: [rea#56](https://github.com/bookedsolidtech/rea/issues/56).
- **Mixed-push deletion bypass** — the deletion guard now fires whenever any refspec is a deletion, regardless of whether a non-delete refspec is also present in the same push. Pre-0.9.3 the check was gated on `SOURCE_SHA` being empty, so a mixed push like `safe:safe :protected-branch` silently allowed the deletion. Upstream: [rea#61](https://github.com/bookedsolidtech/rea/issues/61).

Full rea defect catalog tracked in internal bug-report notes; local backport patches preserved for re-application on the next `rea upgrade` once 0.9.3 lands.

No consumer-facing API changes. Internal governance infra only.
