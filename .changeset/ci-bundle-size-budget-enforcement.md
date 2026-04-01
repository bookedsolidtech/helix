---
'@helixui/library': patch
---

ci: add per-component bundle size budget enforcement to quality gates

Adds `scripts/bundle-size-report.js` that measures gzip size of each component entry point using esbuild. Enforces 5 KB per-component and 50 KB total bundle size budgets. Wired into the `bundle-size` CI job which posts a delta report as a PR comment and blocks merge on budget violations. Per-component overrides are configured in `bundle-budgets.json`.
