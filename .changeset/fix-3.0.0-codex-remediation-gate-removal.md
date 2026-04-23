---
'@helixui/library': patch
---

fix(ci): align `publish.yml` pre-publish secret scan with the published tarball by switching from `npm pack` to `pnpm pack` — corrects a Codex-flagged mismatch where the scanned tarball would not contain `workspace:^` peer-deps as they would be rewritten at publish time

fix(docs): remove false "Matrix tests (Node 22/24, Ubuntu/macOS/Windows)" merge-gate claim from `CONTRIBUTING.md`; clarify that Node 24 support is declared in `engines` (^22.0.0 || ^24.0.0) but exercised only via manual `workflow_dispatch` of `ci-matrix.yml` — not a required check

fix(docs): standardize the manual-matrix trigger phrase "build tooling, Vite/Turborepo config, or Node runtime APIs" byte-identically across `CONTRIBUTING.md`, `.github/pull_request_template.md`, and `docs/quality-automation.md` — addresses Codex round-3 reviewer-checklist drift finding

chore(hooks): remove rea push-review-gate from `.husky/pre-push` — two upstream rea defects (gate jq predicate schema mismatch with the codex-adversarial agent's audit shape; escape hatch resolving `dist/audit/append.js` from repo root instead of installed node_modules) made the gate unworkable across multiple releases. Codex adversarial review retained as a first-class step via `/codex-review` and the `codex-adversarial` subagent; enforcement moves to CI rather than the local push boundary.
