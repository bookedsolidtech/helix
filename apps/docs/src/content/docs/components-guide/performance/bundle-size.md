---
title: Bundle Size Optimization
description: Keep HELiX component bundles small through tree-shaking, granular imports, and package.json configuration.
---

Bundle size directly affects time-to-interactive. HELiX targets less than 5 KB gzipped per component. This page covers the techniques that get you there: tree-shaking, granular imports, and correct `package.json` configuration.

## Tree-Shaking with ES Modules

Tree-shaking is the bundler's ability to remove exports that are never imported. It requires ES modules (`import`/`export`) — CommonJS modules (`require`/`module.exports`) cannot be statically analyzed and are never tree-shaken.

HELiX ships `"module": "ESNext"` in `package.json`, which tells bundlers to use the ES module output. Always verify the correct field is resolved for your bundler:

- **Vite / Rollup**: resolves `module` or `exports["."].import`
- **Webpack 5**: resolves `exports["."].import` or `module`
- **esbuild**: resolves `exports["."].import`

## Granular Imports vs Barrel Imports

A barrel import (`import { HelixButton, HelixCard } from '@helixui/library'`) imports from the library's root `index.js`. Even with tree-shaking, some bundlers conservatively include side-effectful initialization code from every component in the barrel.

Granular imports eliminate this entirely:

```typescript
// Barrel import — bundler must analyze entire index.js before tree-shaking
import { HelixButton } from '@helixui/library';

// Granular import — bundler only processes the hx-button module
import { HelixButton } from '@helixui/library/components/hx-button';
```

The difference matters most for large libraries. For a 50-component library, a barrel import that only uses 3 components may still pull in registration overhead from the others.

## Avoid Importing All of `lit`

Lit's top-level export is a convenience barrel. For minimal imports, use the specific submodule paths:

```typescript
// Heavy — imports the entire lit barrel
import { LitElement, html, css, nothing, TemplateResult } from 'lit';

// Lean — imports only what you use from specific submodules
import { LitElement } from 'lit/lit-element.js';
import { html, nothing } from 'lit/html.js';
import { css } from 'lit/css-tag.js';
```

In practice, Lit's barrel is already designed to be tree-shakeable and its top-level imports are fine for most projects. The submodule pattern matters most when optimizing for absolute minimal bundle size in environments where tree-shaking is not guaranteed.

## `sideEffects: false` in `package.json`

The `sideEffects` field in `package.json` tells Webpack and other bundlers that importing a module has no side effects — it is safe to discard the entire module if its exports are unused. Without this flag, bundlers must conservatively include every imported module even if nothing from it is used.

```json
{
  "name": "@helixui/library",
  "version": "0.1.0",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./components/hx-button": {
      "types": "./dist/components/hx-button/index.d.ts",
      "import": "./dist/components/hx-button/index.js"
    }
  }
}
```

Caution: `sideEffects: false` is only safe when your modules truly have no side effects. Custom element registration (`customElements.define()`) is called by the `@customElement` decorator, which runs on import. If a consumer imports a component just for its side-effect registration (without using the exported class), `sideEffects: false` would cause the bundler to drop the import.

For component libraries, the typical safe approach is to declare the components entry points as having side effects:

```json
{
  "sideEffects": [
    "./dist/components/**/*.js"
  ]
}
```

## Bundle Analysis with `rollup-plugin-visualizer`

```bash
npm install --save-dev rollup-plugin-visualizer
```

In your Vite config:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'dist/bundle-report.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      // Analyze a specific component entry point
      input: {
        'hx-button': 'packages/hx-library/src/components/hx-button/index.ts',
      },
    },
  },
});
```

After `npm run build`, `dist/bundle-report.html` opens a treemap showing every module's contribution to the final bundle. Look for:

- Unexpectedly large dependencies
- Duplicate utility modules included from multiple paths
- Components that did not tree-shake correctly

## Per-Component Size Budget

HELiX enforces a < 5 KB gzipped budget per component. The budgets are declared in `bundle-budgets.json` at the repo root and checked in CI:

```json
{
  "components": {
    "hx-button": { "maxGzipBytes": 5120 },
    "hx-card": { "maxGzipBytes": 3072 },
    "hx-dialog": { "maxGzipBytes": 6144 }
  }
}
```

Components that share a runtime (e.g., Lit itself) do not pay the full Lit cost individually. When a page loads multiple HELiX components, Lit is downloaded once and amortized across all of them. The per-component budget covers only the component-specific code above the shared runtime.

## What Counts Toward Bundle Size

| Included | Excluded |
|---|---|
| Component class source | `LitElement` base (shared runtime) |
| Styles (`helixButtonStyles`) | Lit core (`html`, `css`, `nothing`) |
| Mixin code applied to this component | `@helixui/tokens` (shared across all components) |
| Directive imports used by this component | Other components' code |

## Next Steps

- [Lazy Loading Components](/components-guide/performance/lazy-loading/) — dynamic import and `customElements.whenDefined()`
- [Rendering Performance](/components-guide/performance/rendering/) — `repeat`, `guard`, and `cache` directives
- [TypeScript Declaration Files](/components-guide/typescript/declaration-files/) — `sideEffects` and the `exports` map
