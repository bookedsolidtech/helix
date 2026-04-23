---
'@helixui/library': patch
---

fix(docs): clarify `CONTRIBUTING.md` review-process section — Gate 7 (code review) is a manual step, not a CI-automated gate. Previous wording "all 7 quality gates" under "Automated CI checks" conflated the two. Now preserves the canonical "all 7 quality gates" phrasing used across the repo and adds a parenthetical clarifying gates 1–6 are CI-enforced while Gate 7 is the manual 3-tier review.

fix(docs): standardize Node runtime wording in `docs/typescript-automation-executive-summary.md` from ambiguous "Node.js 22+" to canonical "Node.js 22 LTS or Node.js 24" — matches the `engines` field (`^22.0.0 || ^24.0.0`) and the rest of the documentation.

fix(docs): extend canonical Node runtime wording in `starters/react/README.md` with the Node 20 EOL note (`Node 20 reaches upstream EOL on 2026-04-30`) to match phrasing elsewhere in the repo.

chore(hooks): make `.reports/hook-patches/apply-remove-push-review-gate.py` idempotent and mixed-state-safe — return success if the new block is already applied, refuse (exit 1) if both old and new blocks are present simultaneously, so the one-off applicator cannot silently succeed while the pre-removal hook invocation is still live.
