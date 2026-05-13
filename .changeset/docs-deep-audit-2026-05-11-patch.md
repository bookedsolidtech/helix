---
'@helixui/library': patch
'@helixui/tokens': patch
'@helixui/icons': patch
'@helixui/react': patch
'@helixui/drupal-behaviors': patch
'@helixui/drupal-starter': patch
---

**Docs deep fact-check audit** — every package README + the Starlight docs
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
