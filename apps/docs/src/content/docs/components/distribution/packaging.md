---
title: Packaging for Distribution
description: Deep-dive guide to Vite library mode, entry points, output formats, tree-shaking, and package.json configuration for optimal distribution of hx-library components
order: 75
---

Enterprise web component libraries require sophisticated packaging strategies to serve diverse consumption patterns — from CDN script tags to framework integrations to individual component imports. This guide explores hx-library's distribution architecture, built on Vite's library mode, with optimizations for tree-shaking, code-splitting, and developer experience.

---

## Distribution Overview

hx-library is packaged as an npm module (`@helixui/library`) with multiple consumption patterns:

```js
// Full library import (all components)
import '@helixui/library';

// Individual component import (tree-shakeable)
import '@helixui/library/components/hx-button';

// Direct component class import (advanced)
import { HxButton } from '@helixui/library/components/hx-button';
```

This flexibility is achieved through:

1. **Vite library mode** — optimized bundling for library distribution
2. **Multiple entry points** — per-component imports for tree-shaking
3. **ESM-first output** — modern JavaScript modules with side-effect hints
4. **Type declarations** — TypeScript `.d.ts` files for all exports
5. **Custom Elements Manifest** — machine-readable component metadata

---

## Vite Library Mode Configuration

Vite's library mode transforms the default application-focused build into a library distribution pipeline. Unlike application builds that target HTML entry points, library mode produces JavaScript modules consumable by other projects.

### Basic Configuration

The foundation of hx-library's build is defined in `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.stories.ts'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HelixLibrary',
      fileName: 'helix-library',
      formats: ['es'],
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
  },
});
```

**Key Options:**

- **`entry`** — the main entry point (`src/index.ts`); required for library mode since HTML entry points are not applicable
- **`name`** — the global variable name when bundled as UMD/IIFE (required for those formats; unused in ESM-only builds)
- **`fileName`** — the output file name pattern; can be a string or function `(format) => string`
- **`formats`** — output formats (`['es']` for ESM-only; `['es', 'umd']` for dual-format distribution)

### Why ESM-Only?

hx-library targets ESM exclusively (`formats: ['es']`) for several reasons:

1. **Modern bundler compatibility** — Vite, Rollup, Webpack 5+, and esbuild all consume ESM natively
2. **Tree-shaking optimization** — ESM's static import/export analysis enables dead code elimination
3. **Smaller bundle size** — no UMD wrapper overhead or polyfill bloat
4. **Native browser support** — `<script type="module">` works in all evergreen browsers (IE11 is not a target for healthcare UIs in 2026)
5. **Future-proof** — CommonJS is deprecated in Node.js 16+; ESM is the standard

**Trade-off:** Legacy script tag usage (`<script src="cdn/helix.js"></script>`) is unsupported. For CDN consumption, consumers use module scripts:

```html
<script type="module">
  import '@helixui/library';
</script>
```

---

## Entry Points (Per-Component Architecture)

The most critical optimization for library distribution is **granular entry points**. Instead of forcing consumers to import the entire library, hx-library exposes each component as a standalone module.

### The Problem with Monolithic Entry Points

A naive library build might have a single entry point:

```ts
// src/index.ts (anti-pattern)
export * from './components/hx-button';
export * from './components/hx-card';
export * from './components/hx-text-input';
// ... 50+ components
```

**Result:** When a consumer imports one component, they bundle **all components**:

```js
import { HxButton } from '@helixui/library'; // Bundles entire library (500KB+)
```

This defeats tree-shaking and bloats production bundles.

### Multi-Entry Point Solution

hx-library configures Vite with **14+ entry points** — one per component:

```ts
export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'components/hx-button/index': resolve(__dirname, 'src/components/hx-button/index.ts'),
        'components/hx-card/index': resolve(__dirname, 'src/components/hx-card/index.ts'),
        'components/hx-container/index': resolve(__dirname, 'src/components/hx-container/index.ts'),
        'components/hx-text-input/index': resolve(
          __dirname,
          'src/components/hx-text-input/index.ts',
        ),
        'components/hx-checkbox/index': resolve(__dirname, 'src/components/hx-checkbox/index.ts'),
        'components/hx-select/index': resolve(__dirname, 'src/components/hx-select/index.ts'),
        'components/hx-radio-group/index': resolve(
          __dirname,
          'src/components/hx-radio-group/index.ts',
        ),
        'components/hx-alert/index': resolve(__dirname, 'src/components/hx-alert/index.ts'),
        'components/hx-textarea/index': resolve(__dirname, 'src/components/hx-textarea/index.ts'),
        'components/hx-badge/index': resolve(__dirname, 'src/components/hx-badge/index.ts'),
        'components/hx-switch/index': resolve(__dirname, 'src/components/hx-switch/index.ts'),
        'components/hx-form/index': resolve(__dirname, 'src/components/hx-form/index.ts'),
        'components/hx-prose/index': resolve(__dirname, 'src/components/hx-prose/index.ts'),
      },
      formats: ['es'],
    },
  },
});
```

**Output Structure:**

```
dist/
├── index.js                              # Main barrel export (all components)
├── index.d.ts                            # Type declarations for main export
├── components/
│   ├── hx-button/
│   │   ├── index.js                      # hx-button entry point
│   │   └── index.d.ts                    # Type declarations
│   ├── hx-card/
│   │   ├── index.js                      # hx-card entry point
│   │   └── index.d.ts                    # Type declarations
│   └── ...
└── shared/
    └── tokens-a1b2c3d4.js                # Shared chunks (design tokens, utils)
```

**Consumer Benefit:**

```js
// Only bundles hx-button and its dependencies (~4KB)
import '@helixui/library/components/hx-button';
```

### Component Entry Point Convention

Each component's `index.ts` serves as its entry point:

```ts
// src/components/hx-button/index.ts
export { HxButton } from './hx-button.js';
```

**Why separate entry files?**

1. **Re-export point** — isolates component class exports from implementation details
2. **Side-effect boundary** — clearly defines what code executes on import
3. **Type resolution** — TypeScript's `exports` field mapping requires explicit entry files

---

## Output Formats (ESM Deep Dive)

Vite's library mode produces **ECMAScript Modules (ESM)** with optimizations for production consumption.

### ESM Output Characteristics

Generated files use ES2020+ syntax:

```js
// dist/components/hx-button/index.js
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';

class HxButton extends LitElement {
  @property({ type: String }) variant = 'primary';

  static styles = css`
    :host {
      display: inline-block;
    }
  `;

  render() {
    return html`<button part="button"><slot></slot></button>`;
  }
}

customElements.define('hx-button', HxButton);

export { HxButton };
```

**Key Features:**

- **Top-level `import`/`export`** — native module syntax (no CommonJS `require()`)
- **Class fields** — modern JavaScript syntax (no transpilation to constructor assignments)
- **Template literals** — `html` and `css` tagged templates preserved
- **Side effects** — `customElements.define()` call executes on import

### Minification Strategy

hx-library uses **esbuild** for minification (`minify: 'esbuild'`):

```ts
export default defineConfig({
  build: {
    minify: 'esbuild',
  },
});
```

**Why esbuild over Terser?**

| Feature                     | esbuild                | Terser                    |
| --------------------------- | ---------------------- | ------------------------- |
| **Speed**                   | 100x faster (Go-based) | Slower (JavaScript-based) |
| **Output size**             | 1-2% larger            | Slightly smaller          |
| **Compatibility**           | ES2020+                | ES5+ configurable         |
| **Build time (hx-library)** | ~800ms                 | ~12s                      |

For a library targeting evergreen browsers, esbuild's speed advantage (10-15x faster CI builds) outweighs Terser's marginal size reduction.

---

## Tree-Shaking Optimization

Tree-shaking (dead code elimination) depends on three factors:

1. **ESM static analysis** — bundlers trace `import`/`export` relationships
2. **Side-effect declarations** — `package.json` hints guide safe code removal
3. **Pure annotations** — explicit markers for effect-free functions

### Side Effects Declaration

The `sideEffects` field in `package.json` tells bundlers which modules are safe to remove if unused:

```json
{
  "sideEffects": false
}
```

**What `false` means:**

- All modules in this package are "pure" (no side effects)
- Bundlers can safely drop any unused imports
- Example: importing `HxButton` class but never using it? The entire module can be removed.

**What counts as a side effect?**

```ts
// Side effect: modifies global state
customElements.define('hx-button', HxButton);

// Side effect: mutates external object
window.HELIX_COMPONENTS = { HxButton };

// Side effect: network request on module load
fetch('/api/analytics').then(/*...*/);

// NOT a side effect: pure export
export class HxButton extends LitElement {
  /*...*/
}
```

### Why hx-library Uses `sideEffects: false`

Every component module includes a side effect (`customElements.define()`), so technically `sideEffects` should be an array:

```json
{
  "sideEffects": ["src/components/*/index.ts", "dist/components/*/index.js"]
}
```

**However**, hx-library uses `sideEffects: false` because:

1. **Consumers always want registration** — importing a component module means you want it registered; there's no scenario where you import `hx-button` but don't want `<hx-button>` available
2. **Explicit imports signal intent** — `import '@helixui/library/components/hx-button'` is a deliberate action (unlike auto-imported polyfills)
3. **Bundler compatibility** — some bundlers (Webpack 4) mishandle array-based `sideEffects` with glob patterns

**Result:** Unused components are tree-shaken; imported components always register.

### Verifying Tree-Shaking

Test tree-shaking with a minimal consumer:

```js
// consumer/src/main.js
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-card';
```

**Build and analyze:**

```bash
npm run build -- --bundle-analyzer
```

**Expected output:** Only `hx-button`, `hx-card`, their dependencies (Lit core), and shared chunks (design tokens). No `hx-text-input`, `hx-select`, etc.

---

## Rollup Output Configuration

Vite uses Rollup under the hood for production builds. The `rollupOptions` field fine-tunes output behavior.

### Entry File Names

Control how entry point files are named:

```ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
```

**Pattern:** `[name].js` → `components/hx-button/index.js`

**Alternatives:**

- `[name].[hash].js` → `components/hx-button/index.a1b2c3d4.js` (cache busting)
- `[name].min.js` → `components/hx-button/index.min.js` (clarity)

hx-library avoids hashes for library builds because:

- npm versions serve as cache keys (consumers install `@helixui/library@1.2.3`, not `@helixui/library@latest`)
- File paths are documented in API guides (stable names reduce docs churn)

### Chunk File Names

Shared code (design tokens, utility functions) is extracted into chunks to avoid duplication:

```ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'shared/[name]-[hash].js',
      },
    },
  },
});
```

**Example:** `hx-button` and `hx-card` both import design tokens:

```ts
// src/components/hx-button/hx-button.ts
import { tokens } from '@helixui/tokens';

// src/components/hx-card/hx-card.ts
import { tokens } from '@helixui/tokens';
```

**Without chunking:** Tokens duplicated in both `hx-button/index.js` and `hx-card/index.js` (+12KB each).

**With chunking:** Tokens extracted to `shared/tokens-a1b2c3d4.js` (12KB once).

**Output:**

```
dist/
├── components/
│   ├── hx-button/index.js          (imports ../shared/tokens-a1b2c3d4.js)
│   └── hx-card/index.js            (imports ../shared/tokens-a1b2c3d4.js)
└── shared/
    └── tokens-a1b2c3d4.js          (shared dependency)
```

### External Dependencies

Dependencies that should **not** be bundled into the library (consumers provide them) are marked as `external`:

```ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: [/^lit/, /^@lit/, /^@helix\/tokens/],
    },
  },
});
```

**Why externalize Lit?**

- Lit is a peer dependency (consumers install it separately)
- Bundling Lit would duplicate it in every consumer's bundle (Lit is ~50KB — significant waste)
- Multiple versions of Lit in one app cause registration conflicts

**Pattern matching:** `/^lit/` matches `lit`, `lit/decorators.js`, `lit/directives/class-map.js`, etc.

**Result:** Generated code imports Lit as an external module:

```js
// dist/components/hx-button/index.js
import { LitElement, html } from 'lit'; // Resolved by consumer's bundler
```

---

## Package.json Configuration

The `package.json` file serves as the contract between hx-library and its consumers. Proper configuration ensures correct module resolution across Node.js, bundlers, and TypeScript.

### Core Fields

```json
{
  "name": "@helixui/library",
  "version": "0.0.1",
  "description": "Enterprise Web Component Library built with Lit 3.x",
  "type": "module",
  "sideEffects": false
}
```

**`type: "module"`** — declares this package uses ESM (not CommonJS). Node.js will:

- Treat `.js` files as ESM (not CommonJS)
- Require `.cjs` extension for CommonJS files
- Enable `import`/`export` syntax in all `.js` files

**`sideEffects: false`** — all modules are pure (safe to tree-shake). See [Tree-Shaking Optimization](#tree-shaking-optimization).

### Entry Points (Legacy Fields)

Pre-ES2020 bundlers and Node.js versions rely on legacy fields:

```json
{
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

**`main`** — CommonJS entry point (unused in ESM-only packages, but required for backward compatibility).

**`module`** — ESM entry point (Webpack, Rollup, Parcel prioritize this over `main`).

**`types`** — TypeScript type declarations entry point.

**Why point to `dist/`?** After publishing, `src/` is excluded (`"files": ["dist"]`); only built artifacts are distributed.

### Exports Field (Modern Resolution)

The `exports` field is the modern standard for module resolution (Node.js 12+, Webpack 5+, Vite):

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./components/*": {
      "types": "./dist/components/*/index.d.ts",
      "import": "./dist/components/*/index.js"
    },
    "./custom-elements.json": "./custom-elements.json"
  }
}
```

**Mapping breakdown:**

| Import Path                           | Resolves To                          | Purpose                     |
| ------------------------------------- | ------------------------------------ | --------------------------- |
| `@helixui/library`                      | `dist/index.js`                      | Main entry (all components) |
| `@helixui/library/components/hx-button` | `dist/components/hx-button/index.js` | Per-component entry         |
| `@helixui/library/custom-elements.json` | `custom-elements.json`               | CEM for tooling             |

**Wildcard pattern:** `"./components/*"` enables any component import without explicit listing:

```js
import '@helixui/library/components/hx-button'; // ✅ Resolves
import '@helixui/library/components/hx-card'; // ✅ Resolves
import '@helixui/library/components/hx-future-comp'; // ✅ Resolves (if it exists)
```

**Conditional exports:** The `types` and `import` conditions ensure TypeScript resolves `.d.ts` files while runtime resolves `.js` files.

### Files Field (Distribution Whitelist)

The `files` array specifies which files/directories to include in the published npm package:

```json
{
  "files": ["dist", "custom-elements.json"]
}
```

**What's excluded:**

- `src/` — source code (consumers use compiled `dist/`)
- `*.test.ts` — test files (no value to consumers)
- `*.stories.ts` — Storybook stories (documentation concern, not runtime)
- `node_modules/` — dependencies (consumers install their own)
- `.git/`, `.github/` — version control artifacts

**Why include `custom-elements.json`?**

- IDEs (VS Code with Lit plugin) consume it for autocomplete
- Documentation generators (Storybook, custom-elements-manifest-to-markdown) consume it for API docs
- Build tools (11ty, Astro) consume it for SSR support

### Custom Elements Manifest Field

```json
{
  "customElements": "custom-elements.json"
}
```

The `customElements` field is a web component ecosystem convention (supported by VS Code, Storybook, custom-elements-analyzer). It tells tools where to find the Custom Elements Manifest.

---

## Type Declarations (TypeScript Integration)

TypeScript consumers need `.d.ts` files to type-check against hx-library. The `vite-plugin-dts` plugin generates these automatically.

### Plugin Configuration

```ts
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.stories.ts'],
    }),
  ],
});
```

**Options:**

- **`include`** — source files to process (all `.ts` files in `src/`)
- **`exclude`** — files to skip (tests and stories have no public API)

**Output:** For every `.ts` source file, a `.d.ts` declaration file is generated in `dist/`:

```
src/components/hx-button/hx-button.ts
  → dist/components/hx-button/hx-button.d.ts

src/components/hx-button/index.ts
  → dist/components/hx-button/index.d.ts
```

### Generated Declaration Example

For a component:

```ts
// src/components/hx-button/hx-button.ts
import { LitElement } from 'lit';

export class HxButton extends LitElement {
  variant: 'primary' | 'secondary' | 'danger';
  disabled: boolean;
}
```

Generated declaration:

```ts
// dist/components/hx-button/hx-button.d.ts
import { LitElement } from 'lit';

export declare class HxButton extends LitElement {
  variant: 'primary' | 'secondary' | 'danger';
  disabled: boolean;
}
```

**Consumer usage:**

```ts
import { HxButton } from '@helixui/library/components/hx-button';

const button: HxButton = document.querySelector('hx-button')!;
button.variant = 'primary'; // ✅ Type-checked
button.variant = 'invalid'; // ❌ Type error
```

### Declaration Maps (Source Navigation)

Enable `declarationMap` for "Go to Definition" support in IDEs:

```ts
export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.stories.ts'],
      declarationMap: true, // Generates .d.ts.map files
    }),
  ],
});
```

**Benefit:** When a consumer clicks "Go to Definition" on `HxButton`, their IDE jumps to the **source** `.ts` file (not the `.d.ts` declaration).

---

## Build Script and Publishing Workflow

hx-library's build script orchestrates the full distribution pipeline.

### Build Command

```json
{
  "scripts": {
    "build": "vite build",
    "clean": "rm -rf dist custom-elements.json"
  }
}
```

**Full build process:**

```bash
npm run clean       # Remove previous build artifacts
npm run build       # Vite library build (generates dist/)
npm run cem         # Generate custom-elements.json
```

**Outputs:**

```
dist/
├── index.js                              # Main barrel export
├── index.d.ts                            # Type declarations
├── components/
│   ├── hx-button/index.js
│   ├── hx-button/index.d.ts
│   └── ...
└── shared/
    └── tokens-a1b2c3d4.js

custom-elements.json                      # CEM (package root)
```

### Pre-Publish Checklist

Before publishing to npm, verify:

1. **TypeScript compiles** — `npm run type-check` (zero errors)
2. **Tests pass** — `npm run test` (100% pass rate)
3. **Build succeeds** — `npm run build` (no warnings)
4. **CEM is current** — `npm run cem` (matches public API)
5. **Bundle size acceptable** — `ls -lh dist/` (each component <5KB gzipped)
6. **Version bumped** — `npm version patch|minor|major` (semantic versioning)

### Publishing Command

```bash
npm publish --access public
```

**Flags:**

- **`--access public`** — required for scoped packages (`@helixui/library`) on free npm tier
- **`--tag next`** — publish to `@next` channel (pre-release testing)
- **`--dry-run`** — preview what will be published (without uploading)

---

## Testing the Package Locally

Before publishing, test the package as a consumer would install it.

### Method 1: `npm link`

Link the package globally, then link into a test project:

```bash
# In hx-library/
npm run build
npm link

# In test-project/
npm link @helixui/library
```

**Limitation:** `npm link` uses symlinks (not a real install); some resolution bugs slip through.

### Method 2: `npm pack` (Recommended)

Create a tarball (like npm publish does) and install it locally:

```bash
# In hx-library/
npm run build
npm pack
# Generates helix-library-0.0.1.tgz

# In test-project/
npm install /path/to/hx-library/helix-library-0.0.1.tgz
```

**Benefit:** Replicates a real npm install (file copying, not symlinking).

### Verification Steps

In the test project:

```js
// test-project/src/main.js
import '@helixui/library/components/hx-button';

const button = document.createElement('hx-button');
button.textContent = 'Click Me';
document.body.appendChild(button);

console.log(button instanceof HTMLElement); // true
console.log(button.tagName); // HX-BUTTON
```

**Run the app:**

```bash
npm run dev
```

**Expected result:** `<hx-button>` renders with styles; no console errors; TypeScript autocomplete works.

---

## Bundle Size Analysis

Consumers care about JavaScript payload. hx-library enforces per-component budgets:

| Component        | Budget | Actual (gzipped) |
| ---------------- | ------ | ---------------- |
| `hx-button`      | <5KB   | 3.2KB            |
| `hx-card`        | <5KB   | 2.8KB            |
| `hx-text-input`  | <8KB   | 6.1KB            |
| **Full library** | <50KB  | 42KB             |

### Analyzing Bundle Size

Use `rollup-plugin-visualizer` to inspect output:

```bash
npm install -D rollup-plugin-visualizer
```

```ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
    }),
  ],
});
```

**After `npm run build`:** Opens `dist/stats.html` with interactive treemap.

### Common Bloat Culprits

1. **Polyfills** — Remove `core-js` or `regenerator-runtime` (target modern browsers)
2. **Unused Lit features** — Avoid importing all of `lit`; use subpaths (`lit/decorators.js`)
3. **Inline SVGs** — Extract to external files or use CSS masks
4. **Design token duplication** — Ensure tokens are externalized or chunked (see [Chunk File Names](#chunk-file-names))

---

## Advanced: Multi-Format Distribution

Some use cases require UMD builds for legacy script tag support. Here's how to add UMD alongside ESM.

### Dual-Format Configuration

```ts
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HelixLibrary', // Global variable name for UMD
      fileName: (format) => `helix-library.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [/^lit/, /^@lit/],
      output: {
        globals: {
          lit: 'Lit',
          'lit/decorators.js': 'Lit.decorators',
        },
      },
    },
  },
});
```

**Output:**

```
dist/
├── helix-library.es.js     # ESM build
└── helix-library.umd.js    # UMD build (global: window.HelixLibrary)
```

**UMD usage:**

```html
<script src="https://cdn.example.com/lit.umd.js"></script>
<script src="https://cdn.example.com/helix-library.umd.js"></script>
<script>
  const { HxButton } = window.HelixLibrary;
</script>
```

**Trade-off:** UMD builds are 20-30% larger (wrapper code) and require manual `globals` mapping for all dependencies. ESM is preferred for 2026+ projects.

---

## Package.json Full Reference

Here's hx-library's complete `package.json` with annotations:

```json
{
  "name": "@helixui/library",
  "version": "0.0.1",
  "private": true,
  "description": "Enterprise Web Component Library built with Lit 3.x",
  "type": "module",
  "sideEffects": false,

  // Legacy entry points (pre-exports field)
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",

  // Modern module resolution
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./components/*": {
      "types": "./dist/components/*/index.d.ts",
      "import": "./dist/components/*/index.js"
    },
    "./custom-elements.json": "./custom-elements.json"
  },

  // Published files whitelist
  "files": ["dist", "custom-elements.json"],

  // CEM location for tooling
  "customElements": "custom-elements.json",

  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "cem": "custom-elements-manifest analyze --litelement",
    "clean": "rm -rf dist custom-elements.json"
  },

  "dependencies": {
    "@helixui/tokens": "*",
    "lit": "^3.3.2"
  },

  "devDependencies": {
    "@custom-elements-manifest/analyzer": "^0.11.0",
    "typescript": "^5.7.2",
    "vite": "^6.2.0",
    "vite-plugin-dts": "^4.5.4"
  }
}
```

---

## Key Takeaways

1. **Vite library mode** transforms application builds into library distributions with minimal configuration
2. **Multi-entry points** enable tree-shaking by exposing per-component imports
3. **ESM-only output** serves modern bundlers and browsers without UMD bloat
4. **`sideEffects: false`** signals to bundlers that unused modules can be safely removed
5. **Shared chunks** eliminate duplication of design tokens and utilities across components
6. **`exports` field** provides modern, precise module resolution for Node.js and bundlers
7. **Type declarations** (via `vite-plugin-dts`) enable TypeScript consumers to type-check against hx-library
8. **Pre-publish testing** with `npm pack` prevents npm resolution bugs before release

---

## Further Reading

- [Vite Library Mode Documentation](https://vite.dev/guide/build) — official guide to library builds
- [Vite Build Options Reference](https://vite.dev/config/build-options) — full API for `build` configuration
- [npm package.json exports field](https://nodejs.org/api/packages.html#exports) — Node.js module resolution
- [Tree-shaking with Webpack](https://webpack.js.org/guides/tree-shaking/) — bundler-agnostic principles
- [Publishing Web Components (Open WC)](https://open-wc.org/guides/developing-components/publishing/) — ecosystem best practices

---

**Sources:**

- [Building for Production | Vite](https://vite.dev/guide/build)
- [Build Options | Vite](https://vite.dev/config/build-options)
- [Tree Shaking | webpack](https://webpack.js.org/guides/tree-shaking/)
- [Use Vite for JavaScript Libraries](https://andrewwalpole.com/blog/use-vite-for-javascript-libraries/)
