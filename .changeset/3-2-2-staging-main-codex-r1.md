---
'@helixui/library': patch
---

3.2.2 staging→main codex r1 remediation — runtime test coverage for forced-colors mixin adoption + hx-side-nav toggle:hover token chain, plus changeset:version pipeline now regenerates `figma-inventory.json` so package versions cannot drift from the file's `helixVersion` / `tokensVersion` fields.

Closes the codex r1 (concerns) verdict on the staging→main candidate. No runtime behavior change — the gaps were test infrastructure and publish-pipeline drift.

**Finding 1 [test-gap medium] — HC tests never exercised the forced-colors media path.**

`hx-theme.test.ts` HC assertions all mounted `<hx-theme theme="high-contrast">`, which exercises the in-app HC token overlay. None mounted under `@media (forced-colors: active)`. The `forced-colors` mixin family (`forcedColorsInteractive` / `forcedColorsSurface` / `forcedColorsField` / `forcedColorsLink`) was therefore unguarded — a regression that dropped the mixin from a component, or replaced ButtonFace with a hex color, would not fail CI.

**Fix:** Added `packages/hx-library/src/components/__tests__/forced-colors-runtime.test.ts`. Mounts a representative consumer of each mixin family (`hx-button`, `hx-checkbox`, `hx-card`, `hx-link`), reads `shadowRoot.adoptedStyleSheets`, finds every `@media (forced-colors: active)` rule, and asserts the expected system-color keywords (ButtonFace/ButtonText/Highlight, Field/FieldText, Canvas/CanvasText, LinkText/VisitedText). Vitest browser mode does not expose `page.emulateMedia({ forcedColors: 'active' })`, so adopted-stylesheet inspection is the supported approach (matches the existing pattern in `hx-stat.test.ts` and `hx-spinner.test.ts`).

**Finding 2 [test-gap medium] — `hx-side-nav` toggle:hover branch covered only by file-level grep.**

The renamed on-dark overlay hover branch in `hx-side-nav` (deprecated `--hx-color-border-on-dark-subtle` → canonical `--hx-color-surface-on-dark-overlay-subtle` → `rgba(255, 255, 255, 0.1)` / `color-mix(...)` fallback) had a structural-shape lock in `dark-mode-resolution.test.ts` and a comment pointing at file-level grep — but no runtime assertion. This is the exact branch that already regressed once.

**Fix:** Same new file adds two runtime assertions for `<hx-side-nav>`:
- The plain `.side-nav__toggle:hover` rule contains both token names plus the `rgba(255, 255, 255, 0.1)` hex fallback.
- The `@supports (color: color-mix(...))` branch contains `.side-nav__toggle:hover` with both token names plus `color-mix(...)`.

The stale "file-level grep" coverage note in `dark-mode-resolution.test.ts` has been replaced with a pointer to `forced-colors-runtime.test.ts`.

**Finding 3 [api-design medium] — figma-inventory.json publish-time version drift.**

`packages/hx-library/figma-inventory.json` reads `helixVersion` and `tokensVersion` from the package.json files at generation time. The 3.2.2 staging snapshot still showed `"3.2.0"` for both because the changeset hadn't yet bumped versions and the inventory was last regenerated against the 3.2.0 source.

**Fix:** Chained `pnpm --filter=@helixui/library run figma:inventory` into the root `changeset:version` script so the inventory is regenerated whenever `changeset version` bumps `package.json` versions. The version fields can no longer drift from the published packages.
