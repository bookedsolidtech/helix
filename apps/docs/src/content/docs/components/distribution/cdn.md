---
title: CDN Distribution
description: Distributing HELiX web components via CDN for zero-install consumption in Drupal and other environments.
---

# CDN Distribution

import { Aside } from '@astrojs/starlight/components';

<Aside type="caution" title="Doc is rewriting against current source">
  This page mixes a planned dual-build architecture (a separate `dist/cdn/` CDN bundle) with the
  current build that ships **one** ES-module distribution at `dist/`. As of @helixui/library@3.9.0:
  the full bundle lives at <code>dist/index.js</code>, per-component modules live at
  <code>dist/components/&lt;tag&gt;/index.js</code>, and the CDN-ready forms are the same files
  served through jsDelivr / unpkg. The Vite/esbuild CDN-config sections below describe
  aspirational future work; ignore them when wiring a CDN today and use the URL patterns under
  <em>jsDelivr and unpkg Usage Patterns</em>.
</Aside>

Not every environment that needs HELiX can run `npm install`. Drupal themes, legacy CMS setups, and quick prototypes often need to load web components directly from a URL — no build step, no package manager, no bundler. CDN distribution is how HELiX serves those environments.

This page covers how the published bundles are structured, how CDN URLs are formed, how Drupal consumes them via `libraries.yml`, how to protect integrity with Subresource Integrity (SRI) hashes, and how to test bundles locally before shipping.

---

## Today's distribution: library-mode ESM + dedicated CDN bundle layer

`@helixui/library` publishes its ES-module distribution under `dist/`. Two
build paths emit into that tree:

1. The default Vite build (`pnpm --filter=@helixui/library build`) writes the
   library-mode tree at `dist/index.js`, `dist/components/<tag>/index.js`,
   `dist/css/*`, etc. — designed for consumer bundlers that resolve bare
   specifiers (`lit`, `@helixui/tokens`, …) via the import graph.
2. The dedicated CDN build (`pnpm --filter=@helixui/library run build:cdn`)
   writes the versioned, no-import-map-needed bundles under `dist/cdn/` with
   SRI hashes in `dist/cdn/sri-hashes.json`.

| Artifact                                     | Used for                                                             |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `dist/index.js`                              | Full library bundle (Vite library mode) — registers every `hx-*`     |
| `dist/components/<tag>/index.js`             | Per-component module (Vite library mode)                             |
| `dist/css/helix-*.css`                       | Pre-built token / category stylesheets for consumer use              |
| `dist/cdn/helix-{version}.min.js`            | **CDN full bundle** — all components + Lit inlined; no import map    |
| `dist/cdn/helix-core-{version}.min.js`       | **CDN shared runtime** — shared Lit + core chunks (load before tags) |
| `dist/cdn/components/hx-{tag}-{version}.js`  | **CDN per-component module** — imports from the shared runtime above |
| `dist/cdn/sri-hashes.json`                   | Subresource Integrity hashes for every CDN artifact                  |
| `fouc.css`                                   | Pre-upgrade flash-of-unstyled-content guard                          |
| `custom-elements.json` / `aaa-verdicts.json` | CEM + AAA verdicts metadata                                          |

These files are CDN-ready out of the box because `@helixui/library` declares Lit as a regular
runtime dependency — jsDelivr and unpkg resolve the bare `lit` import through the dependency tree.
Consumers loading via plain `<script type="module">` can either let the CDN follow the import
graph or provide an import map (see <em>Import maps</em> below).

---

## Building CDN Bundles with Vite

HELiX uses a separate Vite config for CDN builds. This config produces self-contained bundles where Lit is included (not externalized) and everything is ready for direct `<script>` use.

:::tip[Strategy B is the recommended path]
3.0.0 ships `dist/cdn/core.js` (registry + tokens, ~8.4KB min+gz) plus per-component modules at `dist/cdn/hx-<component>.js` (~2KB each). Load only what you use.

The single-file bundle below remains available for prototyping and back-compat, but is **not recommended for production** — it ships every component whether you use it or not.
:::

### Per-Component CDN Bundles (recommended)

For consumers who need only specific components, per-component CDN bundles reduce download weight significantly. This is the recommended 3.0.0 pattern — load `core.js` once, then load only the components you use:

```html
<!-- Core: registry + tokens (~8.4KB min+gz) -->
<script type="module" src="https://unpkg.com/@helixui/library@3.9.0/dist/cdn/core.js"></script>

<!-- Per-component modules (~2KB each) -->
<script type="module" src="https://unpkg.com/@helixui/library@3.9.0/dist/cdn/hx-button.js"></script>
<script type="module" src="https://unpkg.com/@helixui/library@3.9.0/dist/cdn/hx-card.js"></script>
```

### Single-File CDN Bundle (not recommended for production)

```typescript
// packages/hx-library/vite.cdn.config.ts
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist-cdn',
    lib: {
      // Single entry that registers all components
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HxLibrary', // Global variable name for IIFE format
      formats: ['es', 'iife'], // Both ESM and IIFE for maximum compatibility
      fileName: (format) => `hx-library.${format}.js`,
    },
    rollupOptions: {
      // Do NOT externalize Lit — it must be bundled for CDN use
      external: [],
      output: {
        // IIFE wraps everything in a self-executing function
        // window.HxLibrary is available after the script loads
        name: 'HxLibrary',
      },
    },
    // Minify for production CDN delivery
    minify: 'esbuild',
    sourcemap: true,
  },
});
```

Add the CDN build script to `package.json`:

```json
{
  "scripts": {
    "build": "vite build",
    "build:cdn": "vite build --config vite.cdn.config.ts",
    "build:all": "npm run build && npm run build:cdn"
  }
}
```

After `npm run build:cdn`, the output:

```
dist/
├── index.js        (ESM, all components + Lit, ~55KB gzip)
├── index.js.map
├── index.js      (IIFE global, all components + Lit, ~58KB gzip)
└── index.js.map
```

### Per-Component CDN Bundles — build configuration

The per-component Vite config that produces the recommended `dist/cdn/` output:

```typescript
// packages/hx-library/vite.cdn.per-component.config.ts
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist-cdn',
    lib: {
      entry: {
        'hx-button': resolve(__dirname, 'src/components/hx-button/index.ts'),
        'hx-card': resolve(__dirname, 'src/components/hx-card/index.ts'),
        'hx-text-input': resolve(__dirname, 'src/components/hx-text-input/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `components/${entryName}.js`,
    },
    rollupOptions: {
      // Externalize Lit so it can be shared across component bundles
      // via an import map (see below)
      external: ['lit', /^lit\/.*/],
      output: {
        paths: {
          lit: 'https://cdn.jsdelivr.net/npm/lit@3/index.js',
          'lit/decorators.js': 'https://cdn.jsdelivr.net/npm/lit@3/decorators.js',
          'lit/directives/class-map.js':
            'https://cdn.jsdelivr.net/npm/lit@3/directives/class-map.js',
        },
      },
    },
    minify: 'esbuild',
    sourcemap: true,
  },
});
```

This produces:

```
dist/components/
├── hx-button.js      (~6KB gzip — component only, Lit loaded from jsDelivr)
├── hx-card.js        (~5KB gzip)
└── hx-text-input.js  (~7KB gzip)
```

The trade-off: per-component bundles share a Lit instance via CDN (good for caching), but require an additional network request for the Lit URL.

---

## jsDelivr and unpkg Usage Patterns

Once `@helixui/library` is published to npm, the CDN bundles are automatically available via jsDelivr and unpkg.

### jsDelivr

jsDelivr proxies npm packages at `https://cdn.jsdelivr.net/npm/`. The shipped `dist/index.js` imports bare specifiers (`@helixui/tokens`, `@helixui/icons`, `@floating-ui/dom`, `lit`, `lit/*`) — those won't resolve in the browser without an **import map** first. Always pair the library script with the import map; a bare `<script src="…/dist/index.js">` will fail with `Failed to resolve module specifier`.

```html
<script type="importmap">
  {
    "imports": {
      "lit": "https://cdn.jsdelivr.net/npm/lit@3/index.js",
      "lit/": "https://cdn.jsdelivr.net/npm/lit@3/",
      "@helixui/tokens": "https://cdn.jsdelivr.net/npm/@helixui/tokens@3/dist/index.js",
      "@helixui/icons": "https://cdn.jsdelivr.net/npm/@helixui/icons@1/dist/index.js",
      "@floating-ui/dom": "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1/+esm"
    }
  }
</script>

<!-- Floating major — receives patch + minor updates automatically -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@helixui/library@3/dist/index.js"></script>

<!-- Or pinned to exact version (recommended for production, pair with SRI) -->
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js"
></script>
```

jsDelivr supports:

- **Automatic gzip/Brotli** — Serves compressed responses based on `Accept-Encoding`
- **Global CDN** — 900+ PoPs worldwide
- **Long cache TTL** — Immutable versioned URLs are cached for 1 year
- **HTTPS only** — Required for custom elements (secure contexts)

### unpkg

unpkg proxies npm at `https://unpkg.com/`. The same import-map prerequisite applies — `@helixui/library`'s bare specifiers won't resolve from the unpkg URL alone:

```html
<script type="importmap">
  {
    "imports": {
      "lit": "https://unpkg.com/lit@3/index.js?module",
      "lit/": "https://unpkg.com/lit@3/",
      "@helixui/tokens": "https://unpkg.com/@helixui/tokens@3/dist/index.js",
      "@helixui/icons": "https://unpkg.com/@helixui/icons@1/dist/index.js",
      "@floating-ui/dom": "https://unpkg.com/@floating-ui/dom@1/?module"
    }
  }
</script>
<script type="module" src="https://unpkg.com/@helixui/library@3.9.0/dist/index.js"></script>
```

**Recommendation:** Use jsDelivr for production. It has better uptime guarantees and performance than unpkg, which is community-operated with no SLA.

---

## Drupal Library System CDN Integration

Drupal's library system (`libraries.yml`) can reference CDN URLs directly with a local fallback for when the CDN is unavailable.

### Basic CDN Library Definition

```yaml
# helix_theme.libraries.yml

helix-components:
  version: '3.9.0'
  header: true
  js:
    # Load Lit first (required by HELiX components)
    https://cdn.jsdelivr.net/npm/lit@3/index.js:
      type: external
      minified: true
      attributes:
        type: module
    # Then load the HELiX bundle
    https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js:
      type: external
      minified: true
      attributes:
        type: module

# Attach this library to every page via helix_theme.info.yml
# or selectively via hook_page_attachments()
```

### CDN with Local Fallback

Drupal can serve a local copy of the file when the CDN is unreachable. The `external` flag tells Drupal not to aggregate this file; the fallback path is the local copy.

```yaml
helix-components:
  version: '3.9.0'
  header: true
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js:
      type: external
      minified: true
      attributes:
        type: module
        crossorigin: anonymous
        integrity: 'sha384-[SRI_HASH_HERE]'
    # Local fallback (relative to the theme root)
    js/vendor/index.js:
      minified: true
      attributes:
        type: module
```

Copy the CDN file to `js/vendor/index.js` during your theme build process:

```bash
# In your theme's build script
curl -o themes/custom/helix_theme/js/vendor/index.js \
  "https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js"
```

**Note:** Drupal's `type: external` libraries do not automatically implement fallback logic. For true failover, use a small inline script that checks if `customElements.get('hx-button')` is defined after the CDN script tag and loads the local version if not.

---

## Subresource Integrity (SRI)

SRI prevents CDN-delivered files from being tampered with. The browser computes a hash of the downloaded file and compares it against the `integrity` attribute. If they do not match, the browser refuses to execute the file.

### Generating SRI Hashes

```bash
# Generate sha384 hash for the CDN bundle
openssl dgst -sha384 -binary dist/index.js \
  | openssl base64 -A \
  | sed 's/^/sha384-/'

# Output: sha384-ABC123...
```

Or using the online SRI hash generator: https://www.srihash.org/

### Automating SRI Hash Generation in the Build

Add SRI hash generation to the release script:

```typescript
// scripts/generate-sri.ts
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = ['dist/index.js', 'dist/index.js'];

const hashes: Record<string, string> = {};

for (const file of files) {
  const content = readFileSync(resolve(__dirname, '..', file));
  const hash = createHash('sha384').update(content).digest('base64');
  hashes[file] = `sha384-${hash}`;
}

writeFileSync(resolve(__dirname, '..', 'dist/sri-hashes.json'), JSON.stringify(hashes, null, 2));

console.log('SRI hashes generated:');
Object.entries(hashes).forEach(([file, hash]) => {
  console.log(`  ${file}: ${hash}`);
});
```

### Using SRI in HTML

```html
<!-- With SRI: browser refuses to execute if file has been tampered with -->
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js"
  integrity="sha384-ABC123..."
  crossorigin="anonymous"
></script>
```

The `crossorigin="anonymous"` attribute is required when using `integrity` with a cross-origin resource.

**In Drupal's libraries.yml:**

```yaml
helix-components:
  version: '3.9.0'
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js:
      type: external
      minified: true
      attributes:
        type: module
        crossorigin: anonymous
        integrity: 'sha384-ABC123...'
```

---

## Cache-Busting Strategy

CDN URLs should be immutable and versioned. Never serve different content at the same URL.

**Versioned URL pattern (recommended):**

```
https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js
                                                   ^^^^^^
                                                   Exact semver version
```

This URL is permanently cached. When `3.10.0` ships, a new URL is served. Old URLs continue to work indefinitely. Consumers upgrade by updating the version in their URL.

**Do not use floating ranges on CDN URLs:**

```html
<!-- ❌ BAD — a new release changes what this URL serves -->
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js"
></script>

<!-- ❌ BAD — minor/patch updates silently change the file -->
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js"
></script>
```

Floating ranges work in `package.json` (with a lockfile) because `npm ci` resolves and pins the version. On CDN URLs there is no lockfile, so a minor update can silently break a Drupal site.

**CDN URL pattern for HELiX releases:**

```
# Exact version — immutable, cache-forever
https://cdn.jsdelivr.net/npm/@helixui/library@{VERSION}/dist/index.js

# Per-component (when using import maps)
https://cdn.jsdelivr.net/npm/@helixui/library@{VERSION}/dist/components/hx-button/index.js
```

---

## All Components vs. Per-Component CDN Files

### All-Components Bundle

**When to use:**

- Drupal sites that use many HELiX components across the site
- Pages where most components are visible above the fold
- Simple integrations where bundle size is less critical than simplicity

**Pros:**

- Single `<script>` tag — simple to configure
- One cached file — all components ready immediately
- No import coordination needed

**Cons:**

- Larger download even for pages that use one or two components
- One bundle update invalidates the cache for all components

**Usage:**

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js"
></script>
```

### Per-Component CDN Files

**When to use:**

- Pages where only 1–3 components are needed
- Applications with multiple pages that each use different components
- When combined with an import map

**Pros:**

- Smaller per-page download
- Each component is independently cached and versioned
- Consumers only invalidate the cache for changed components

**Cons:**

- Multiple script tags or import map configuration
- Lit must be loaded once and shared (requires import maps or careful ordering)

**Usage (with import map):**

```html
<script type="importmap">
  {
    "imports": {
      "lit": "https://cdn.jsdelivr.net/npm/lit@3/index.js",
      "lit/decorators.js": "https://cdn.jsdelivr.net/npm/lit@3/decorators.js",
      "lit/directives/class-map.js": "https://cdn.jsdelivr.net/npm/lit@3/directives/class-map.js",
      "@helixui/library/components/hx-button": "https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/components/hx-button/index.js",
      "@helixui/library/components/hx-card": "https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/components/hx-card/index.js"
    }
  }
</script>

<script type="module">
  import '@helixui/library/components/hx-button';
  import '@helixui/library/components/hx-card';
</script>
```

---

## The `importmap` Approach

Import maps let browsers resolve bare module specifiers (`import from 'lit'`) without a bundler. This makes the library-mode bundles (with externalized Lit) directly usable in the browser — no CDN re-bundling needed.

### Import Map for HELiX Library Bundles

```html
<!doctype html>
<html>
  <head>
    <script type="importmap">
      {
        "imports": {
          "lit": "https://cdn.jsdelivr.net/npm/lit@3/index.js",
          "lit/": "https://cdn.jsdelivr.net/npm/lit@3/",
          "@lit/reactive-element": "https://cdn.jsdelivr.net/npm/@lit/reactive-element@2/reactive-element.js",
          "@lit/reactive-element/decorators/": "https://cdn.jsdelivr.net/npm/@lit/reactive-element@2/decorators/",
          "lit-html": "https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js",
          "lit-html/": "https://cdn.jsdelivr.net/npm/lit-html@3/",
          "@helixui/library/": "https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/"
        }
      }
    </script>

    <!-- Load components as ES modules — Lit is resolved from the import map -->
    <script type="module">
      import '@helixui/library/components/hx-button/index';
      import '@helixui/library/components/hx-card/index';
    </script>
  </head>
  <body>
    <hx-button>Save</hx-button>
    <hx-card>
      <span slot="heading">Patient Record</span>
    </hx-card>
  </body>
</html>
```

**Advantages of import maps over bundled CDN files:**

- Uses the standard library-mode output (no separate CDN build needed)
- Lit is loaded once and shared across all components via the browser's module cache
- Each component is a separate cached file
- Works with dynamic `import()` for lazy loading

**Limitations:**

- Import maps are not supported in Drupal's library system (Drupal does not generate `<script type="importmap">` tags)
- Require `<script type="importmap">` before any `<script type="module">` tags
- No IE11 or legacy browser support (acceptable for HELiX — Lit requires modern browsers)

For Drupal, use the bundled CDN approach with `libraries.yml`. For standalone HTML prototypes and micro-frontends, import maps are the cleanest option.

---

## Testing CDN Bundles Locally

Before publishing a release, verify the CDN bundles work exactly as consumers will use them — without a build step, served from a local file server.

### Using `live-server`

```bash
# Install live-server globally
npm install -g live-server

# Build the CDN bundles
npm run build:cdn --workspace=@helixui/library

# Serve from the dist-cdn directory
live-server packages/hx-library/dist-cdn --port=8080
```

Then create a test HTML file:

```html
<!-- packages/hx-library/dist/test.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>HELiX CDN Bundle Test</title>
  </head>
  <body>
    <!-- Load the local CDN bundle -->
    <script type="module" src="/index.js"></script>

    <!-- Test every component -->
    <hx-button>Primary Button</hx-button>
    <hx-button variant="secondary">Secondary Button</hx-button>
    <hx-card>
      <span slot="heading">Test Card</span>
      <p>Card body content</p>
    </hx-card>
    <hx-text-input label="Test Input" placeholder="Type here..."></hx-text-input>

    <script type="module">
      // Verify components are registered
      customElements.whenDefined('hx-button').then(() => {
        console.log('hx-button: registered');
      });
      customElements.whenDefined('hx-card').then(() => {
        console.log('hx-card: registered');
      });
      customElements.whenDefined('hx-text-input').then(() => {
        console.log('hx-text-input: registered');
      });
    </script>
  </body>
</html>
```

Open `http://localhost:8080/test.html` and verify all components render and console confirms registration.

### Testing the (Hypothetical) IIFE Bundle

> **Status note:** `@helixui/library` does **not** ship an IIFE / UMD artifact today — `dist/index.js` is an **ES module entry** with bare imports, and loading it as `<script src="…">` (without `type="module"`) syntax-errors on its first `import` statement. There is no `window.HxLibrary` global. The pattern below is what a build-step would look like **if** a separate IIFE artifact were added (e.g. a future `dist/iife/index.js` emitted by a `build:cdn` task) — keep it as a recipe, not a working snippet against the current published package.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>HELiX IIFE Bundle Test (hypothetical)</title>
  </head>
  <body>
    <!-- IIFE — would only work against a real classic-script artifact like
         dist/iife/index.js. Today, use the ESM + import-map pattern above. -->
    <script src="/dist/iife/index.js"></script>

    <hx-button>Button</hx-button>

    <script>
      // After a real IIFE ships, the global would be exposed here.
      console.log('HxLibrary:', typeof window.HxLibrary);
    </script>
  </body>
</html>
```

### Verifying SRI Hashes

After generating SRI hashes, verify they are correct before adding them to `libraries.yml`:

```bash
# Compute hash of the local file
openssl dgst -sha384 -binary dist/index.js \
  | openssl base64 -A

# Compare against the generated hash in sri-hashes.json
cat dist/sri-hashes.json
```

Also test that the hash works in a browser — add the `integrity` attribute to your test HTML file and verify the console does not report an SRI failure.

---

## Release Checklist for CDN Bundles

Before tagging a release that includes CDN bundles:

- [ ] `npm run build:cdn` completes without errors
- [ ] `dist/index.js` and `dist/index.js` exist
- [ ] Local test HTML confirms all components render correctly
- [ ] SRI hashes generated and written to `dist/sri-hashes.json`
- [ ] CDN URLs updated in `CHANGELOG.md` for this release
- [ ] Drupal integration docs updated with new version number and SRI hash
- [ ] `dist/` is included in the npm package files (check `package.json` `files` field)

```json
{
  "files": ["dist/", "dist/", "src/", "custom-elements.json"]
}
```

---

## Related Pages

- [Versioning and Changelogs](./versioning/) — Semantic versioning, Changesets, and communicating breaking changes
- [Lazy Loading Web Components](../performance/lazy-loading/) — Defer component loading with IntersectionObserver and Drupal behaviors
- [Drupal Integration Overview](/drupal/installation/getting-started/) — Full guide to consuming HELiX in Drupal
