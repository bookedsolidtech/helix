# @helixui/tokens

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
