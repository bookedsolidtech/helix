---
'@helixui/library': patch
'@helixui/react': patch
'@helixui/tokens': patch
'@helixui/icons': patch
---

deps: dependabot batch 2026-05 — major bumps for vite (6→8), vitest (3→4), TypeScript (5→6), zod (3→4), eslint (9→10), commitlint (20→21), and react/react-dom alignment to 19.2 across admin, hx-react, and react-starter. CI tooling: actions/checkout v4→v6. The package surface area is unchanged — runtime dependencies are unaffected and no API has shifted — but the build/test/type toolchain has moved, so consumers running their own pipelines should expect the same toolchain bumps.

The playwright bump (#1608) is intentionally NOT included in this batch: vendored Chromium in playwright 1.60 surfaced two latent ARIA issues in hx-breadcrumb-item and hx-overflow-menu that need to be fixed in their own PR before the bump can land.
