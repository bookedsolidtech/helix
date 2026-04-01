# @helixui/tokens

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
