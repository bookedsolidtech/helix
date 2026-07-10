---
title: Bundle Size & Tree-Shaking
description: How to minimize bundle size when using HELiX components with modern bundlers.
---

## Overview

HELiX is designed for tree-shaking. Import only the components you need and your bundler will exclude the rest.

## Per-Component Imports

The recommended approach is per-component imports:

```ts
// Only includes hx-button and hx-icon — everything else is tree-shaken
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-icon';
```

This uses the package `exports` map to resolve each component to its individual entry point.

## Full Library Import

If you need all components (e.g., a CMS where any component may be used):

```ts
// Imports all components and registers all custom elements
import '@helixui/library';
```

This is larger but ensures all components are available without explicit imports.

## Bundle Size Budgets

HELiX maintains two complementary budget files at the repo root, each driving a different script:

| File | Default per-component | Total library | Used by |
|------|----------------------|---------------|---------|
| `.bundle-budget.json` | 5 KB (gzipped) | 50 KB (gzipped) | `scripts/check-bundle-size.mjs` (`pnpm run check:bundle`) |
| `bundle-budgets.json` | 16 KB (gzipped) | 200 KB (gzipped) | `scripts/bundle-size-report.js` (`pnpm run bundle-size:ci`) |

The 16 KB / 200 KB budget is the relaxed CI gate adopted in 3.2.1 to unblock the token-cascade campaign; the 5 KB / 50 KB budget remains as the long-term aspirational target. New work should aim at the aspirational budget; today's CI floor is the relaxed budget.

Both files carry per-component overrides documenting reasons for individual components exceeding the default. The subset below shows the largest exceptions:

| Component | `.bundle-budget.json` | `bundle-budgets.json` | Reason |
|-----------|----------------------|------------------------|--------|
| `hx-date-picker` | 8 KB | 16 KB | Calendar grid, date parsing, keyboard nav, localization |
| `hx-color-picker` | 7 KB | 16 KB | Gradient canvas, sliders, format conversion, swatches |
| `hx-combobox` | 7 KB | 16 KB | Typeahead, multi-select chips, async loading |
| `hx-select` | 6.5 KB | 16 KB | Custom listbox, keyboard nav, form participation |
| `hx-time-picker` | 6 KB | 16 KB | Time parsing, 12/24h format, step intervals |
| `hx-file-upload` | 5.75 KB | 16 KB | Drag-and-drop, file validation, progress tracking |
| `hx-data-table` | 8 KB | (uses default) | Sorting, row selection, keyboard grid navigation |
| `hx-carousel` | (uses default) | 16 KB | Slide management + accessibility plumbing |

See the source files for the complete override list and rationale.

## sideEffects Configuration

The `@helixui/library` package declares `sideEffects` in `package.json` so bundlers know which files must not be tree-shaken:

```json
{
  "sideEffects": [
    "./dist/index.js",
    "./dist/utilities/document-token-adoption.js",
    "./dist/components/*/index.js",
    "**/*.css"
  ]
}
```

- **Index barrel** (`./dist/index.js`) re-exports every component module — importing it registers every custom element via the re-exported `@customElement('hx-…')` calls.
- **Token adoption** (`./dist/utilities/document-token-adoption.js`) injects design tokens into `document.adoptedStyleSheets`.
- **Per-component entry points** (`./dist/components/*/index.js`) are explicitly side-effectful because importing one registers that component's custom element. This is what makes `import '@helixui/library/components/hx-button'` work — the bundler must keep the registration side effect even though the import binding is unused.
- **CSS files** are always side-effectful.

## Design Token Overhead

Design tokens are adopted into `document.adoptedStyleSheets` automatically when any HELiX component module is imported. The first component import runs token adoption once; subsequent imports are no-ops. The overhead is shared across all components — it is not duplicated per-component.

`ensureDocumentTokens` is exported from the package root (`@helixui/library`) for callers that need to invoke it explicitly (for example, to pre-adopt tokens before a component upgrades, or to re-adopt into a new realm). It is **not** something per-component imports can opt out of — every component import already triggers it.

```ts
import { HelixButton } from '@helixui/library';
import { ensureDocumentTokens } from '@helixui/library';

// Idempotent — running a second time is a no-op
ensureDocumentTokens();
```

## Measuring Bundle Size

```bash
# Measure a specific component
node scripts/measure-component-size.js hx-button

# Full bundle analysis
node scripts/bundle-size-report.js

# Check against budgets
node scripts/check-bundle-size.mjs
```

## Vite Configuration

No special configuration is needed for Vite. The `exports` map and `sideEffects` declaration work automatically.

## Webpack Configuration

For Webpack 5+, ensure `sideEffects` is respected (it is by default in production mode):

```js
module.exports = {
  optimization: {
    sideEffects: true, // default in production
  },
};
```

## CDN Usage

For non-bundled usage (CDN, script tags), pin a specific version and point at the published library entry. The library is ESM with bare imports, so the browser needs an import map for `lit`, `@helixui/tokens`, etc. — see [Installation → CDN](/getting-started/installation/#cdn-no-build-step) for the full pattern:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/css/helix-all.css" />

<script type="importmap">
{
  "imports": {
    "@helixui/library": "https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/index.js",
    "@helixui/tokens":  "https://cdn.jsdelivr.net/npm/@helixui/tokens@3.9.4/dist/index.js",
    "@helixui/icons":   "https://cdn.jsdelivr.net/npm/@helixui/icons@1.1.0/dist/index.js",
    "@floating-ui/dom": "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.6/+esm",
    "lit":              "https://cdn.jsdelivr.net/npm/lit@3/+esm",
    "lit/":             "https://cdn.jsdelivr.net/npm/lit@3/"
  }
}
</script>
<script type="module">import '@helixui/library';</script>
```
