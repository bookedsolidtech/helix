---
'@helixui/library': patch
'@helixui/react': patch
'@helixui/tokens': patch
'@helixui/icons': patch
---

deps: dependabot batch 2026-05 — major bumps for vitest (3→4), TypeScript (5→6), zod (3→4), eslint (9→10), commitlint (20→21), and react/react-dom alignment to 19.2 across admin, hx-react, and react-starter. CI tooling: actions/checkout v4→v6. The package surface area is unchanged — runtime dependencies are unaffected and no API has shifted — but the build/test/type toolchain has moved, so consumers running their own pipelines should expect the same toolchain bumps.

Two dependabot PRs are intentionally NOT in this batch:

- #1628 vite 6→8 (with vite-plugin-dts 4→5 and @vitejs/plugin-react 4→6). Bisecting the a11y CI regression on this PR pinned the cause to the vite 8 upgrade: under vite 8's bundle output, axe-core surfaces three previously-hidden AAA violations on Components/Breadcrumb and Components/OverflowMenu (two `aria-required-parent` critical findings, one `color-contrast-enhanced` serious). Both issues are real latent ARIA defects exposed by vite 8's transpile/bundle output; they need component-level fixes (light-DOM role placement, story-level color override) before vite 8 can ship.
- #1608 playwright 1.50→1.60. Same shape — newer vendored Chromium surfaces ARIA issues that axe couldn't see before. Held until the breadcrumb-item/overflow-menu work lands.

Also included: small AAA-compliant fix to the overflow-menu Delete story's inline color (#A21312 → #7a0e0e, the prior value hit 6.92:1 on the panel's #efefef background which is below the AAA 7:1 threshold) and a host-role fix on hx-breadcrumb-item that moves `role="listitem"` from the inner span to the host element so axe's parent search resolves in the light tree without crossing the shadow boundary.
