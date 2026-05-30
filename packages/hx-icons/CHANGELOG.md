# @helixui/icons

## 1.0.4

### Patch Changes

- c1067b7: deps: dependabot batch 2026-05 — major bumps for vitest (3→4), TypeScript (5→6), zod (3→4), eslint (9→10), commitlint (20→21), and react/react-dom alignment to 19.2 across admin, hx-react, and react-starter. CI tooling: actions/checkout v4→v6. The package surface area is unchanged — runtime dependencies are unaffected and no API has shifted — but the build/test/type toolchain has moved, so consumers running their own pipelines should expect the same toolchain bumps.

  Two dependabot PRs are intentionally NOT in this batch:
  - #1628 vite 6→8 (with vite-plugin-dts 4→5 and @vitejs/plugin-react 4→6). Bisecting the a11y CI regression on this PR pinned the cause to the vite 8 upgrade: under vite 8's bundle output, axe-core surfaces three previously-hidden AAA violations on Components/Breadcrumb and Components/OverflowMenu (two `aria-required-parent` critical findings, one `color-contrast-enhanced` serious). Both issues are real latent ARIA defects exposed by vite 8's transpile/bundle output; they need component-level fixes (light-DOM role placement, story-level color override) before vite 8 can ship.
  - #1608 playwright 1.50→1.60. Same shape — newer vendored Chromium surfaces ARIA issues that axe couldn't see before. Held until the breadcrumb-item/overflow-menu work lands.

  Also included: small AAA-compliant fix to the overflow-menu Delete story's inline color (#A21312 → #7a0e0e, the prior value hit 6.92:1 on the panel's #efefef background which is below the AAA 7:1 threshold) and a host-role fix on hx-breadcrumb-item that moves `role="listitem"` from the inner span to the host element so axe's parent search resolves in the light tree without crossing the shadow boundary.

## 1.0.3

### Patch Changes

- 9c5f0ac: chore: pin npm 11.5.1 in publish job for OIDC trusted publishing

  The publish job authenticates to npm via GitHub Actions OIDC token federation
  (Trusted Publishing), but `changeset publish` delegates the registry PUT to the
  global `npm` binary. Node 22 bundles npm 10.x, which signs provenance but lacks
  trusted-publishing OIDC auth, so the PUT went out unauthenticated and the
  registry returned a misleading `E404 ... is not in this registry`. Pinning npm
  to 11.5.1 before publish gives `changeset publish` a TP-capable npm. This is an
  infrastructure-only change with no consumer-facing API impact.

## 1.0.2

### Patch Changes

- b617920: chore: migrate npm publishing to Trusted Publishing (OIDC)

  Removes the long-lived NPM_TOKEN dependency from the publish workflow. The
  publish job now authenticates to npm via GitHub Actions OIDC token federation
  (Trusted Publishing), scoped through the `npm-publish` environment. Sigstore
  provenance attestations are preserved. This is an infrastructure-only change
  with no consumer-facing API impact.

## 1.0.1

### Patch Changes

- c4208b2: **Docs deep fact-check audit** — every package README + the Starlight docs
  site + the Storybook MDX surface validated against source-of-truth, with new
  preflight enforcement.

  **Per-package README accuracy fixes** (`@helixui/library`, `@helixui/tokens`,
  `@helixui/icons`, `@helixui/react`, `@helixui/drupal-behaviors`,
  `@helixui/drupal-starter`):
  - Install snippets, CDN URLs, and import maps now pin to verified current
    versions (`@helixui/library@3.9.0`, `@helixui/tokens@3.9.0`,
    `@helixui/icons@1.0.0`) — stale `^1.0.0` / `^0.3.0` / older pins removed.
  - Component API claims (events, slots, attributes) reconciled with the
    Custom Elements Manifest. Fabricated tags, events, and CSS parts removed.
  - Drupal behaviors README re-aligned to the actual `hxDrawer` /
    `hxMenu` / `hxTabs` source (real `data-direction` / `data-size` /
    `data-active-tab` attribute names; real `hx-change.detail.value` event
    contract).
  - `@helixui/drupal-starter/theme/README.md` rewritten to use raw
    `CSSStyleSheet` + `adoptedStyleSheets` primitives — the previous draft
    referenced a fictional `@helixui/adopted-stylesheets` npm package.

  **New preflight gates** (release-critical infrastructure, no consumer-facing
  shape change for these packages):
  - Gate 11 (docs version drift, `scripts/check-version-drift.mjs`) — extended
    to scan `packages/**/README.md` (was apps-only), so future patch releases
    cannot ship stale CDN URLs in package READMEs without tripping preflight.
  - Gate 12 (docs claims fact-check, `scripts/check-docs-claims.mjs`) — new
    blocking gate that validates `<hx-*>` tags against the CEM, `--hx-*` token
    prefixes against `@helixui/tokens`, `@helixui/*` package references against
    the workspace + npm, internal `/<slug>/` links, stale repo references, and
    outdated WCAG conformance claims.

  No public API changes. Patch-only release.

## 2.0.0 [DEPRECATED]

Mistakenly bumped to MAJOR via a changeset metadata defect — the workspace package.json was at 1.0.0 as the initial-publish placeholder and a `major` changeset cascaded into a 2.0.0 version. The intended initial release is the **1.0.0** entry below; consumers should depend on `@helixui/icons@1.0.0`.

## 1.0.0

### Initial Release

- 723eec6: initial release of @helixui/icons — registry-pattern icon system for hx-icon.
  - public api wire-compatible with shoelace's `registerIconLibrary` / `unregisterIconLibrary` / `getIconLibrary` / `setBasePath` / `getBasePath`
  - two built-in libraries auto-registered on import:
    - `helix` — 32 curated fill-only system glyphs (mit). default sprite at `dist/helix.svg` + per-icon esm under `dist/tree-shake/helix/`
    - `fa-free` — 2,000-glyph fa free solid sprite (cc by 4.0). default sprite at `dist/fa-free-solid.svg` + per-icon esm under `dist/tree-shake/fa-free/solid/`
  - optional `paintMode` field per library: `'fill' | 'stroke' | 'mixed'` — a registry hint that documents the library's paint strategy (the formal AAA harness measures rendered icon color/background samples to produce verdicts; `paintMode` is not a cert-dispatch axis)
  - optional `mutator` hook lets registered libraries transform sanitized svg before injection
  - `iconLibraryAaaVerdict()` helper — exposes baked-in AAA verdicts for the two **built-in** libraries (`helix`, `fa-free`); third-party libraries return `undefined` unless they publish their own verdict evidence
  - aaa verdict baked for built-in libraries: both `helix` and `fa-free` pass non-text contrast 1.4.11 at minimum render size

  required peer dependency of `@helixui/library@^3.9.0`. install both together. consumers register additional libraries (font awesome pro, phosphor, heroicons, iconify, brand sprites) via `registerIconLibrary(name, options)`.

### Minor Changes

- 7b42779: aaa-cert hx-icon as p0; wire @helixui/icons registry resolution

  `<hx-icon>` resolves through the `@helixui/icons` registry. The component
  is P0 AAA self-certified for the applicable WCAG 2.2 AAA criteria measured
  by the formal audit harness, with supplemental **WCAG 1.4.11** non-text
  contrast evidence recorded in `packages/hx-icons/AAA-VERDICT.md`. The
  component ships a `library` attribute that defaults to `''` — registry
  resolution requires the consumer to set `library="fa-free"`,
  `library="helix"`, or another registered library explicitly. The lookup
  runs through `getIconLibrary()` and honors the optional library mutator
  hook (which runs AFTER security sanitization).

  Adds the `--hx-icon-stroke-width` semantic token (default `2`)
  consumed by stroke-paint and mixed-paint consumer libraries; the
  bundled `helix` and `fa-free` libraries are fill-only and ignore
  it.

  The formal AAA harness gains a `non-text-contrast-icon` check that
  measures rendered glyph contrast against the document background.
  `iconLibraryAaaVerdict()` from `@helixui/icons` exposes the
  per-library AAA verdict for both built-ins (`pass` across all three
  dimensions). `packages/hx-icons/AAA-VERDICT.md` publishes the full
  per-library evidence including borderline glyphs (`dot`, `dash`,
  `star-outline`) with recommended minimum render sizes.

  Existing `src` (inline-fetch) and `sprite-url` escape hatches are
  preserved unchanged.
