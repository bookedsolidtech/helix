# @helixui/react

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

### Patch Changes

- Updated dependencies [c1c93f5]
- Updated dependencies [ef049df]
- Updated dependencies [56eec71]
- Updated dependencies [6327024]
- Updated dependencies [6577704]
- Updated dependencies [55d4523]
- Updated dependencies [8c7b41f]
- Updated dependencies [1439f83]
- Updated dependencies [9591b01]
  - @helixui/library@3.2.0

## 3.1.0

### Patch Changes

- Updated dependencies [36d5bde]
  - @helixui/library@3.1.0

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

### Patch Changes

- e4b79be: chore(react): align version line with @helixui/library@2.1.2 in preparation for 3.0.0 lockstep

  The `@helixui/react` package was introduced later than `@helixui/library` and had accumulated an independent version history (last release 1.1.4). This bookkeeping bump realigns it to the same 2.1.2 baseline as `@helixui/library` and `@helixui/tokens` so the 3.0.0 major aggregates to a coherent 3.0.0 across all three public packages (see `docs/UPGRADING-TO-3.md`). `@helixui/react` is now in the `linked` group with `@helixui/library` and `@helixui/tokens` to enforce lockstep in future releases.

- 5c36408: Fix Storybook interaction tests for shadow DOM focus and event patterns; remove dead mixinDelegatesAria export; rename ariaLabel to accessibleLabel in React types to stop shadowing native HTMLElement.ariaLabel
- Updated dependencies [1ae0509]
- Updated dependencies [a610bb7]
- Updated dependencies [aff17e8]
- Updated dependencies [373bf84]
- Updated dependencies [19e966b]
- Updated dependencies [c8a63a0]
- Updated dependencies [61911c1]
- Updated dependencies [50b36a3]
- Updated dependencies [ae1e6e8]
- Updated dependencies [49fdb6c]
- Updated dependencies [196094a]
- Updated dependencies [6d62cc2]
- Updated dependencies [9c8720f]
- Updated dependencies [fce3340]
- Updated dependencies [a0562c4]
- Updated dependencies [20d0129]
- Updated dependencies [700c329]
- Updated dependencies [d3f1d2a]
- Updated dependencies [04ddfae]
- Updated dependencies [2d16e9b]
- Updated dependencies [d830889]
- Updated dependencies [bfca244]
- Updated dependencies [3f6c595]
- Updated dependencies [1fb3e7a]
- Updated dependencies [91e00b4]
- Updated dependencies [9a8cafb]
- Updated dependencies [6b2500d]
- Updated dependencies [edee58a]
- Updated dependencies [5c36408]
  - @helixui/library@3.0.0

## 1.1.4

### Patch Changes

- Updated dependencies [ba1e9bf]
  - @helixui/library@2.1.2

## 1.1.3

### Patch Changes

- Updated dependencies [928975d]
  - @helixui/library@2.1.1

## 1.1.2

### Patch Changes

- Updated dependencies [ba9c72d]
- Updated dependencies [97d75d9]
- Updated dependencies [56585b5]
- Updated dependencies [d6d2244]
- Updated dependencies [d887573]
- Updated dependencies [3c8937b]
  - @helixui/library@2.1.0

## 1.1.1

### Patch Changes

- e00e680: fix: remediate react wrapper test suite CI issues
- e0adb4e: add ssr browser api guards, fix event composition, complete fouc coverage, and fix drupal cdn path
- Updated dependencies [7641ef1]
- Updated dependencies [3bbe6a5]
- Updated dependencies [448c908]
- Updated dependencies [257cf7d]
- Updated dependencies [2d9d739]
- Updated dependencies [23f5f6f]
- Updated dependencies [4d85c91]
- Updated dependencies [bd97a70]
- Updated dependencies [262083c]
- Updated dependencies [8db97bd]
- Updated dependencies [5757017]
- Updated dependencies [0d22fe1]
- Updated dependencies [0a74c8c]
- Updated dependencies [670c553]
- Updated dependencies [923e9d1]
- Updated dependencies [1037809]
- Updated dependencies [2243d3c]
- Updated dependencies [91267a1]
- Updated dependencies [abb4de6]
- Updated dependencies [5c4e4c9]
- Updated dependencies [224884e]
- Updated dependencies [fd65331]
- Updated dependencies [727e99f]
- Updated dependencies [82bd233]
- Updated dependencies [6ceafc0]
- Updated dependencies [ff7bcfd]
- Updated dependencies [1f3791d]
- Updated dependencies [3b6017b]
- Updated dependencies [9c17779]
- Updated dependencies [de9ccbe]
- Updated dependencies [ba21f3f]
- Updated dependencies [5d9ccf7]
- Updated dependencies [917d707]
- Updated dependencies [3458dd0]
- Updated dependencies [d776f72]
- Updated dependencies [be9b080]
- Updated dependencies [984a6f6]
- Updated dependencies [64fd2fc]
- Updated dependencies [dad6c71]
- Updated dependencies [dd58277]
- Updated dependencies [dcf7a9c]
- Updated dependencies [e0ec673]
- Updated dependencies [27e5758]
- Updated dependencies [53ddf75]
- Updated dependencies [e0df165]
- Updated dependencies [87cdd7e]
- Updated dependencies [7f80a77]
- Updated dependencies [184d560]
- Updated dependencies [1f8eef7]
- Updated dependencies [0656b5f]
- Updated dependencies [cf0bc88]
- Updated dependencies [20d502c]
- Updated dependencies [af04577]
- Updated dependencies [4f5af84]
- Updated dependencies [c94a209]
- Updated dependencies [e0adb4e]
- Updated dependencies [281a09e]
- Updated dependencies [181876b]
- Updated dependencies [e89b4b9]
- Updated dependencies [3c48dba]
- Updated dependencies [31bab2a]
- Updated dependencies [9afb9c1]
- Updated dependencies [0660768]
- Updated dependencies [52868cd]
- Updated dependencies [8bf2c61]
- Updated dependencies [a6470e9]
- Updated dependencies [acb6076]
- Updated dependencies [1b587d2]
  - @helixui/library@2.0.0

## 1.1.0

### Minor Changes

- 54c2705: Add `@helixui/react` package with auto-generated React wrappers for all 98 HELiX web components.

  Wrappers are generated from `custom-elements.json` via `scripts/generate-react-wrappers.ts` using `@lit/react` `createComponent()`. Each wrapper includes `'use client'` for Next.js 15 App Router compatibility, full TypeScript prop types derived from CEM declarations, and React-style event callbacks (`onHxClick`, `onHxInput`, `onHxChange`, etc.).

  Tree-shakeable: each component is a separate entry point so importing `HxButton` does not bundle all 98 components.

### Patch Changes

- Updated dependencies [23af064]
  - @helixui/library@1.1.2
