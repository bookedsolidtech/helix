# @helixui/tokens

## 3.2.0

### Minor Changes

- c1c93f5: Component-tier token build-out, forced-colors mixin, and contrast regression gate.

  Three structural additions land alongside the Precision Cool palette refresh:

  **Forced-colors mixin (`packages/hx-library/src/styles/forced-colors.ts`):**
  Four reusable Lit `css` mixins — `forcedColorsInteractive`, `forcedColorsSurface`, `forcedColorsField`, `forcedColorsLink` — composed into every visual component's `static styles` array. Components now defer to OS-level Windows High Contrast / `forced-colors: active` system colors (`ButtonText`, `CanvasText`, `Highlight`, `LinkText`) at the same time as the in-app `data-hx-contrast="high"` overrides. Belt-and-suspenders: the existing rich per-component HC blocks remain; the mixin layers OS-deference on top. Layout-only primitives (stack, grid, prose, form, visually-hidden, style-scope, theme, format-date) skip the mixin since they paint no surfaces.

  **Component-tier token completeness:**
  Every component in `packages/hx-library/src/components/` now exposes a complete component-tier token surface following the canonical `var(--hx-{component}-{property}, var(--hx-{semantic}, #hex))` two-level fallback pattern. Five architecture violations fixed (hx-avatar, hx-steps, hx-text, hx-icon-button, hx-image — were emitting bare primitives without `var()` fallback). Coverage gaps closed across padding, border, focus-ring families. hx-text-input gains a full token surface (was 280 lines of styled CSS with zero override surface). Inline hex fallbacks across all `.styles.ts` files resynced to the Precision Cool palette so `var()` chains resolve to matching values when the outer token is undefined.

  **`tokens.json` `component:` manifest block:**
  Adds an 834-token, 72-component manifest documenting every component-tier token surface. **Manifest-only — not CSS-emitted.** `scripts/generate-css.ts` skips the `component:` key alongside `dark:` and `high-contrast:`, preserving the cascade-driven "undefined unless overridden" runtime model where component tokens stay authored inline in `.styles.ts`. The manifest exists as the source of truth for the Figma kit (`/Volumes/Development/booked/figma-tokens/`), audit tooling, and external integrators. A new vitest (`component-manifest-sync.test.ts`) asserts set equality between the manifest and live extraction from `.styles.ts` — drift fails CI.

  **Contrast regression matrix (`contrast.test.ts`):**
  A new vitest iterates every `text.* × surface.*` semantic pair across light / dark / high-contrast modes against WCAG 2.1 AA (4.5:1 body, 3:1 large/UI). 76 contrast assertions plus meta-tests. Permanent CI gate against the class of bugs that produced the original `text.on-success` and `text.on-{primary,secondary,error,info}` regressions caught earlier in this release. Authoring this gate surfaced one additional pre-existing palette bug — `text.muted` on `surface.raised` light at 4.32:1 — fixed in the same release by rebinding muted to `neutral-600` and bumping `text.secondary` to `neutral-700` to preserve the muted < secondary visual hierarchy.

  **`@helixui/react` peer bump:**
  React wrappers regenerated from CEM via `scripts/generate-react-wrappers.ts`. No public API surface change — wrappers were already in sync; the regen artifact (`figma-inventory.json`) re-emits two `literalFallback` hexes against the new neutral-900 (`#0f172a` → `#0D1825`).

- ef049df: "Precision Cool" palette refresh — every primitive color ramp regenerated from OKLCH math.

  The previous primitive ramps were effectively Tailwind defaults (`blue-600` primary, slate neutrals, violet accent, amber warning). The 3.2.0 refresh replaces all seven chromatic families — `primary`, `secondary`, `accent`, `neutral`, `success`, `warning`, `error`, `info` — with hand-tuned OKLCH ramps anchored on the brand teal `#0F7078`. No Tailwind-derivative values remain.

  **Anchor colors (stop 600):**
  - `primary` `#0F7078` — brand teal, 5.82:1 on white (AA pass)
  - `secondary` `#0F6B7E` — deeper sea-teal, coordinated cousin of primary (6.13:1)
  - `accent` `#3A4BC9` — cool steel-indigo, replaces Tailwind violet (6.93:1)
  - `neutral` `#4A5362` — hand-tuned cool gray; blue cast at the dark end, warm drift at the bright end
  - `success` `#0E8A4A` — deeper than Tailwind green-500, pairs with dark-on-green text
  - `warning` `#B8650E` — burnt amber, warmer than Tailwind amber and less yellow than gold
  - `error` `#C92A2A` — powerful red, 5.46:1 (AA pass)
  - `info` `#1B6FD4` — clear medium-blue, differentiable from teal primary (4.92:1)

  **Semantic token changes:**
  - `--hx-color-success-text` rebound from `success-600` to `success-700`. The new precision-cool `success-600` (`#0E8A4A`) sits at 4.42:1 on white — just under WCAG AA body-text threshold. `success-700` (`#146831`) restores 6.88:1 AA headroom. Matches the `error-text` / `warning-text` pattern at the same stop.
  - Dark-mode `text.placeholder` bumped from `neutral-500` to `neutral-400`. The new precision-cool `neutral-500` (`#66787B`) is 3.86:1 on dark surface.default — fails AA for placeholder text. `neutral-400` (`#8E9C98`) = 6.27:1.
  - Overlay RGB fallback values (`overlay.primary.25`, `overlay.error.25`, `overlay.neutral.12`) resynced against the new -500 / -900 hexes so color-mix()-less browsers match the CSS custom property values.

  **Reproducibility:**
  All ramps generated by `scripts/generate-palette.ts` — a deterministic OKLCH→sRGB generator (hand-rolled, zero runtime deps) that takes anchor hex + stop + curve params and emits all 11 stops. Run `pnpm tsx scripts/generate-palette.ts` to reproduce the JSON exactly. Same inputs always emit the same hexes; the math lives in the repo alongside the tokens.

  **Expected visual impact:**
  Largest single-commit visual change in the repo's history. Every surface that paints primary/accent/status color flips tone. Dark-mode surfaces shift from cool-slate to slightly blue-tinted cool gray (chromatic elevation). HC mode overrides (Windows High Contrast fidelity) are unaffected — they remain system-color-deferent.

  No token names renamed. No stops removed or added. Existing component-level `var(--hx-button-bg, var(--hx-color-primary-500, #...))` two-level fallback chains continue to resolve — the inner hex fallbacks across component styles will drift stale and are addressed in subsequent commits of this PR.

- 9591b01: Library-wide semantic token rebinding. 36 components, ~190 token swaps, 9 commits.
  - Adds three new semantic tokens to `@helixui/tokens`: `--hx-color-text-strong`, `--hx-color-text-placeholder`, `--hx-color-surface-inverse`. All three ship with Light, Dark, and High-Contrast mode values.
  - Rebinds surfaces, text, and borders across 36 components from primitive `--hx-color-neutral-*` references to semantic `--hx-color-surface-*` / `--hx-color-text-*` / `--hx-color-border-*` tokens. Components now flip correctly in Dark and High-Contrast modes — previously only focus rings responded to mode changes.
  - Eliminates the `hx-tooltip` and `hx-side-nav` "intentional primitive" carve-outs; both now bind to `--hx-color-surface-inverse` + `--hx-color-text-inverse`.
  - Form-input borders strengthen by one shade in Light mode (`neutral-300` → `border-strong` which resolves to `neutral-400`). This is the only visual diff in Light mode and it is WCAG-positive — form affordance contrast increases.
  - Adds the Component Token Binding Rule to `design-tokens/tiers` docs and a regression test that fails if a rebinding regresses back to a primitive.
  - Brand ramps, spacing/sizing/typography tokens, and `box-shadow` rgba literals are intentionally untouched. A shadow-semantics follow-up will cover the dark-mode shadow tinting gap.

### Patch Changes

- b029ef5: Fix WCAG AA contrast failures across `--hx-color-text-on-{role}` and the muted/secondary body-text hierarchy surfaced by the new contrast regression matrix.

  The 3.2.0 precision-cool palette refresh (commit 2) silently dropped six pairs below the WCAG AA 4.5:1 floor for body text. The new contrast regression test in `packages/hx-tokens/src/__tests__/contrast.test.ts` is the gate that caught these — exactly the bug class it was built to prevent.

  **Light-mode `text.on-{role}` rebindings (neutral-0 → neutral-900):**
  - `text.on-primary` on `primary-500` (#429797): 3.44:1 → 5.20:1 (AA pass)
  - `text.on-secondary` on `secondary-500` (#40969F): 3.45:1 → 5.18:1 (AA pass)
  - `text.on-error` on `error-500` (#E5493E): 3.92:1 → 4.56:1 (AA pass)
  - `text.on-info` on `info-500` (#0C8BEB): 3.55:1 → 5.03:1 (AA pass)

  These join `on-success` (fixed in commit 1) and `on-warning` in the dark-text-on-brand-surface pattern. The four precision-cool brand-500 hues (primary/secondary/error/info) are too light to carry white text at AA — dark text is the only AA-safe option without darkening the brand ramps.

  **Light-mode body-text hierarchy adjustment (caught unexpectedly by the matrix):**
  - `text.muted`: `neutral-500` (#66787B) → `neutral-600` (#4A5362). Muted on `surface.raised` (#F5F8F3) was 4.32:1 — pre-existing AA fail from commit 2's neutral ramp. Now 7.36:1.
  - `text.secondary`: `neutral-600` → `neutral-700` (#313E4B). Bumped to preserve the primary > strong > secondary > muted hierarchy now that muted occupies the slot secondary used to live in. neutral-700 on every light surface is 9.01:1 or better (AAA).

  **Dark-mode `text.disabled` rebinding (`neutral-600` → `neutral-500`):**

  `neutral-600` (#4A5362) on dark `surface.default` (#0D1825) = 2.30:1, fails the 3:1 UI floor. `neutral-500` (#66787B) = 3.86:1, AA UI pass. Disabled is WCAG-exempt under 1.4.3 but we still gate at 3:1 so it stays visibly distinct rather than invisible.

  No dark or high-contrast `on-{role}` changes — those modes already passed.

  Components painting text on primary/secondary/error/info surfaces (badges, buttons, alerts, toasts, status pills) will flip from white text to dark text in light mode. Every prior render at the AA failure was a defect.

- adf953d: Fix WCAG AA contrast failure on `--hx-color-text-on-success`.

  The token resolved to `var(--hx-color-neutral-0)` (white) on `--hx-color-success-500` (#16A34A) — a contrast ratio of ~2.8:1, which fails WCAG AA for body text (4.5:1) and large text (3:1). Rebound to `var(--hx-color-neutral-900)` (dark), giving 11.2:1 on the same green — AAA pass. Matches the existing on-warning pattern, which paints dark text on amber for the same reason.

  Dark mode and high-contrast overrides are unchanged: HC still emits `#000000` on bright HC success, dark mode now inherits the dark-on-light pattern via the cascade.

  Components painting text against a success surface (e.g., success badges, toasts, inline alerts) will flip from white text to dark text. This is the intended visual change — every prior render at the AA failure was technically a defect.

## 3.0.0

### Major Changes

- edee58a: HELiX 3.0.0 — first major release to the enterprise healthcare channel.

  This release bumps `@helixui/library`, `@helixui/tokens`, and `@helixui/react` to `3.0.0` in lockstep (enforced via the `linked` package group in `.changeset/config.json`). See `packages/hx-library/CHANGELOG.md` and `docs/UPGRADING-TO-3.md` for the complete breaking-change surface and migration guide.

  Headline changes:
  - Subclassing contract — `HelixElement` and `FormMixin` override hooks promoted from `@internal` to `@protected` with stability guarantees gated to major releases.
  - `aria-label` / `hxAriaLabel` → `accessible-label` / `accessibleLabel` on all ARIA-labelable components.
  - `::part(error-message)` → `::part(error)` on the 13 form controls that expose the part (`hx-checkbox`, `hx-checkbox-group`, `hx-combobox`, `hx-date-picker`, `hx-field`, `hx-file-upload`, `hx-number-input`, `hx-radio-group`, `hx-select`, `hx-switch`, `hx-text-input`, `hx-textarea`, `hx-time-picker`). See `docs/UPGRADING-TO-3.md` §5 for the full list.
  - `hx-dialog.modal` defaults to `false` (silent behavior change — consumers relying on default modal behavior must add `modal` explicitly).
  - `hx-phi-field` strips the `value` attribute from the DOM after `connectedCallback` for HIPAA-aligned DOM-serialization safety.
  - `hx-date-picker` and `hx-time-picker` migrate from native modal `<dialog>` to non-modal popup.
  - `FormMixin` consolidation across all 15 form-associated components.
  - `Wc*` type aliases and 2.0 property-rename shims removed.
  - `@floating-ui/dom` becomes a dynamic import on first use.
  - Public-API allowlist enforced on the library barrel.
  - `@helixui/tokens` — `tokenStyles` remains exported but is deprecated since 2.1.0 (planned removal targeted for 4.0). Version bumped to 3.0.0 in lockstep with `@helixui/library` via the linked-package policy; no tokens source removals in this release.
  - `@helixui/react` — `ariaLabel` → `accessibleLabel`; named event detail types replace anonymous `CustomEvent<unknown>`. Version jumps from 1.x to 3.0.0 (bookkeeping bump realigned 1.1.4 → 2.1.2 before the major so all three public packages share a 3.0.0 line; see `.changeset/align-react-version.md`).

## 2.1.2

### Patch Changes

- ba1e9bf: docs: update all tokenStyles references for adopted stylesheets architecture; deprecate tokenStyles in @helixui/tokens

## 2.0.0

### Minor Changes

- be9b080: Add high-contrast token layer with WCAG AAA compliant color overrides and contrast validation utility. Tokens activate via `[data-hx-contrast="high"]` attribute or `prefers-contrast: more` media query.
- 184d560: feat(motion): add motion tokens and prefers-reduced-motion support

  Adds `--hx-easing-decelerate` and `--hx-easing-accelerate` design tokens to `@helixui/tokens`.

  Adds a `motion` attribute to `hx-theme` accepting `"full"` (default), `"reduced"`, and `"none"`. When `motion="reduced"` or `"none"`, all duration tokens collapse to `0ms` and all easing tokens resolve to `linear`. When `motion="full"`, the OS `prefers-reduced-motion: reduce` media query is respected automatically — the same token overrides are applied when the OS preference is active.

  Also exports a `MotionMode` type and a `effectiveMotion` getter from `hx-theme`.

  Updated `hx-spinner` and `hx-drawer` to consume easing tokens (`--hx-easing-in-out` and `--hx-easing-default`) rather than hardcoded `ease-in-out` and `ease` values, ensuring the motion token cascade reaches these components.

- 1f8eef7: add multi-brand theming api for hospital system white-label implementations
  - `HelixBrandRegistry` singleton in `@helixui/tokens` allows consumers to register named brand token sets at application bootstrap
  - brand registration validates all 22 required semantic tokens (primary and secondary color ramps) at registration time, throwing with a list of missing tokens on failure
  - `hx-theme` gains a `brand` attribute that merges registered brand tokens on top of the base theme via adoptedStyleSheets replacement
  - unregistered brands fall back gracefully to the base theme with a `console.warn`
  - new exports: `HelixBrandRegistry`, `HelixBrandRegistryClass`, `REQUIRED_SEMANTIC_TOKENS`, `BrandTokenMap`, `BrandValidationResult`

### Patch Changes

- 03e1beb: test: add design token validation test suite

## 0.3.4

### Patch Changes

- d55bd39: add ./dist/tokens.css export alias so both import paths resolve correctly
- ac9458e: Update package metadata: fix tokens description (remove WC-2026 codename, use HELiX) and add npm discovery keywords (shadow-dom, wcag, accessibility, enterprise, typescript, design-tokens, css-custom-properties) to both packages.

## 0.3.2

### Patch Changes

- d46e1e7: fix: correct homepage URL to helix.bookedsolid.tech (no .com domain exists)

## 0.3.1

### Patch Changes

- 819759f: fix: correct homepage URL from helix.bookedsolid.com to helix.bookedsolid.tech
- 5e4d197: Sync @helixui/tokens version to match @helixui/library@0.3.0 (linked packages).

## 0.2.0

### Minor Changes

- Version bump to stay in sync with `@helixui/library@0.2.0` (linked packages). No token value changes in this release — all component-level changes are documented in `@helixui/library` CHANGELOG.

## 0.1.3

### Patch Changes

- 553b322: fix: remove manual changeset gating from publish pipeline — let changesets/action handle both version PR creation and npm publish internally

## 0.1.2

### Patch Changes

- 04a64c8: Launch readiness: accessibility audits, documentation pages, export verification, and quality gates for all 85 custom elements across 73 component directories.
