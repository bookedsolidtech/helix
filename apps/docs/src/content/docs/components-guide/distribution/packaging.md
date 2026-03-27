---
title: Packaging Web Components
description: Configure package.json exports, sideEffects, and peer dependencies correctly for the @helixui/library npm package.
---

A correctly configured `package.json` determines whether consumers can tree-shake, deep-import, and type-check against a web component library. This page documents every relevant field in `@helixui/library`.

## The Full `package.json` Configuration

```json
{
  "name": "@helixui/library",
  "version": "1.1.2",
  "description": "Enterprise Web Component Library built with Lit 3.x",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "customElements": "custom-elements.json",
  "sideEffects": [
    "./dist/components/*/index.js",
    "./src/components/*/index.ts",
    "**/*.css"
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./components/*": {
      "types": "./dist/components/*/index.d.ts",
      "import": "./dist/components/*/index.js"
    },
    "./custom-elements.json": "./custom-elements.json",
    "./fouc.css": "./fouc.css",
    "./dist/css/helix-all.css": "./dist/css/helix-all.css"
  },
  "files": [
    "dist",
    "custom-elements.json",
    "fouc.css"
  ],
  "dependencies": {
    "@helixui/tokens": "workspace:*",
    "lit": "^3.3.2"
  },
  "peerDependencies": {
    "@floating-ui/dom": "^1.7.6"
  }
}
```

## `"type": "module"`

Setting `"type": "module"` makes all `.js` files in the package treated as ES modules. This is required for Lit 3.x and for native browser ESM compatibility. It means:

- All imports must use explicit `.js` extensions (even for `.ts` source files).
- `require()` is not available.
- The package cannot be consumed with CommonJS `require()` without a bundler transform.

## `main` and `types`

`main` and `types` are legacy fields that some tools still read. They point to the barrel index:

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

Prefer `exports` for all tooling written in the last three years. `main` and `types` are fallbacks for older tools.

## `exports` Map

The `exports` field is the authoritative module resolution map. It controls exactly what paths consumers can import:

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
    }
  }
}
```

### Deep Import Pattern

The `"./components/*"` wildcard export enables individual component deep imports:

```typescript
// Import only hx-button — nothing else is bundled
import '@helixui/library/components/hx-button';
```

This resolves to `./dist/components/hx-button/index.js`, which registers the `<hx-button>` custom element and imports only its dependencies.

### CSS Bundle Exports

Each CSS bundle is explicitly exported:

```json
"./dist/css/helix-all.css": "./dist/css/helix-all.css"
```

Consumers import stylesheets directly:

```html
<link rel="stylesheet" href="node_modules/@helixui/library/dist/css/helix-core.css" />
```

Or in a bundler:

```typescript
import '@helixui/library/dist/css/helix-core.css';
```

## `sideEffects`

The `sideEffects` field tells bundlers which files have side effects (and therefore cannot be tree-shaken away even if they are not directly referenced in import chains):

```json
"sideEffects": [
  "./dist/components/*/index.js",
  "**/*.css"
]
```

Component `index.js` files call `customElements.define()` — a side effect that registers the custom element globally. They must never be tree-shaken away.

CSS files are always side-effectful since they modify global styles.

Source files not listed here are safe for tree-shaking by bundlers.

## `files`

The `files` field is a whitelist of what gets included when the package is published to npm. Only include what consumers need:

```json
"files": [
  "dist",
  "custom-elements.json",
  "fouc.css"
]
```

Excluded by default: `src`, `node_modules`, `.changeset`, `vitest.config.ts`, stories, test files, and all CI configuration. This keeps the published package small.

## `peerDependencies` vs `dependencies`

HELiX splits runtime dependencies into two categories:

### `dependencies`

Packages that are always required and should be installed automatically:

```json
"dependencies": {
  "@helixui/tokens": "workspace:*",
  "lit": "^3.3.2"
}
```

`lit` is a `dependency` (not a peer) because HELiX components import it directly and consumers do not need to install it separately.

### `peerDependencies`

Optional packages that are only required when consumers use specific features:

```json
"peerDependencies": {
  "@floating-ui/dom": "^1.7.6"
}
```

`@floating-ui/dom` is used by overlay components (`hx-popover`, `hx-tooltip`, `hx-dropdown`). It is a peer dependency because:

- Consumers who do not use overlay components do not need it.
- Multiple packages bundling their own copy of `@floating-ui/dom` would cause positioning conflicts.

Always check whether a new dependency should be `dependencies` or `peerDependencies` based on whether consumers need to coordinate the version.

## `customElements` Field

The `"customElements"` field is a convention from the Custom Elements Manifest spec:

```json
"customElements": "custom-elements.json"
```

Tools like Storybook and VS Code extensions read this field to locate the CEM without requiring the consumer to configure a path.

## Next Steps

- [Versioning and Changesets](/components-guide/distribution/versioning/) — semver and the changeset workflow
- [CDN Distribution](/components-guide/distribution/cdn/) — ESM CDN URLs and import maps
- [Custom Elements Manifest](/components-guide/documentation/cem-fundamentals/) — the `custom-elements.json` file referenced by this package
