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

HELiX enforces per-component bundle size budgets:

| Budget | Threshold |
|--------|-----------|
| Default per-component | 5 KB (gzipped) |
| Total library | 50 KB (gzipped) |
| Complex widgets | 6-8 KB (see exceptions below) |

Components that exceed the default budget have documented exceptions in `.bundle-budget.json`:

| Component | Budget | Reason |
|-----------|--------|--------|
| `hx-date-picker` | 8 KB | Calendar grid, date parsing, keyboard nav, localization |
| `hx-color-picker` | 7 KB | Gradient canvas, sliders, format conversion, swatches |
| `hx-combobox` | 7 KB | Typeahead, multi-select chips, async loading |
| `hx-select` | 6.5 KB | Custom listbox, keyboard nav, form participation |
| `hx-time-picker` | 6 KB | Time parsing, 12/24h format, step intervals |
| `hx-tree-view` | 6 KB | Recursive tree, multi-select, lazy loading |
| `hx-form` | 6 KB | ElementInternals aggregation, cross-field validation |
| `hx-nav` | 6 KB | Responsive breakpoints, nested submenus, mobile collapse |
| `hx-file-upload` | 5.75 KB | Drag-and-drop, file validation, progress tracking |

## sideEffects Configuration

The `@helixui/library` package declares `sideEffects` in `package.json` so bundlers know which files must not be tree-shaken:

```json
{
  "sideEffects": [
    "./dist/components/*/hx-*.js",
    "./dist/utilities/document-token-adoption.js",
    "./dist/index.js",
    "**/*.css"
  ]
}
```

- **Component files** (`hx-*.js`) call `customElements.define()` as a side effect
- **Token adoption** (`document-token-adoption.js`) injects design tokens into `document.adoptedStyleSheets`
- **Index barrel** (`index.js`) re-exports all components, triggering their registration
- **CSS files** are always side-effectful

Component `index.ts` files (pure re-exports) are intentionally NOT in the `sideEffects` list, allowing bundlers to tree-shake unused re-exports.

## Design Token Overhead

Design tokens are adopted into `document.adoptedStyleSheets` once on first component import. This adds approximately 2 KB to the initial bundle. The overhead is shared across all components — it is not duplicated per-component.

If you need components without document-level tokens (e.g., inside a custom shadow root), import the component directly and call `ensureDocumentTokens()` manually:

```ts
import { HelixButton } from '@helixui/library/components/hx-button';
import { ensureDocumentTokens } from '@helixui/library/utilities/document-token-adoption';

// Call when ready to inject tokens
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

For non-bundled usage (CDN, script tags), use the pre-built CDN bundle:

```html
<script type="module" src="https://cdn.example.com/helix/helix.min.js"></script>
```

Build the CDN bundle locally:

```bash
pnpm run build:cdn
```
