---
title: CDN Distribution
description: Distributing HELiX web components via CDN for zero-install consumption in Drupal and other environments.
---

# CDN Distribution

Not every environment that needs HELiX can run `npm install`. Drupal themes, legacy CMS setups, and quick prototypes often need to load web components directly from a URL — no build step, no package manager, no bundler. CDN distribution is how HELiX serves those environments.

This page covers how to build CDN-ready bundles, how CDN URLs are structured, how Drupal consumes them via `libraries.yml`, how to protect integrity with Subresource Integrity (SRI) hashes, and how to test CDN bundles locally before shipping.

---

## Library Mode Bundles vs. CDN Bundles

HELiX's primary build output (produced by `npm run build`) is a set of **ES module library bundles**. These are designed for consumption by bundlers (Vite, Webpack, Rollup) that understand ES module imports, handle tree-shaking, and resolve bare specifiers like `lit` from `node_modules`.

A **CDN bundle** has different requirements:

| Requirement    | Library bundle                     | CDN bundle                             |
| -------------- | ---------------------------------- | -------------------------------------- |
| Import format  | ES module with bare specifiers     | Self-contained ESM or IIFE             |
| Lit dependency | Externalized (`import from 'lit'`) | Bundled in or loaded separately        |
| Tree-shaking   | Expected from consumer             | Optional — often ships everything      |
| Loader         | npm + bundler                      | `<script type="module">` or `<script>` |
| Caching        | Per-deployment                     | Long-lived, version-pinned URLs        |

The key difference: library bundles say "go find `lit` yourself." CDN bundles must either include `lit` or explicitly load it from another URL first.

---

## Building CDN Bundles with Vite

HELiX uses a separate Vite config for CDN builds. This config produces self-contained bundles where Lit is included (not externalized) and everything is ready for direct `<script>` use.

### Single-File CDN Bundle (All Components)

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
dist-cdn/
├── hx-library.es.js        (ESM, all components + Lit, ~55KB gzip)
├── hx-library.es.js.map
├── hx-library.iife.js      (IIFE global, all components + Lit, ~58KB gzip)
└── hx-library.iife.js.map
```

### Per-Component CDN Bundles

For consumers who need only specific components, per-component CDN bundles reduce download weight significantly:

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
dist-cdn/components/
├── hx-button.js      (~6KB gzip — component only, Lit loaded from jsDelivr)
├── hx-card.js        (~5KB gzip)
└── hx-text-input.js  (~7KB gzip)
```

The trade-off: per-component bundles share a Lit instance via CDN (good for caching), but require an additional network request for the Lit URL.

---

## jsDelivr and unpkg Usage Patterns

Once `@helixui/library` is published to npm, the CDN bundles are automatically available via jsDelivr and unpkg.

### jsDelivr

jsDelivr proxies npm packages at `https://cdn.jsdelivr.net/npm/`:

```html
<!-- Latest within the 2.x major (auto-updates on minor/patch) -->
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@2/dist-cdn/hx-library.es.js"
></script>

<!-- Pinned to exact version (recommended for production) -->
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@2.3.1/dist-cdn/hx-library.es.js"
></script>
```

jsDelivr supports:

- **Automatic gzip/Brotli** — Serves compressed responses based on `Accept-Encoding`
- **Global CDN** — 900+ PoPs worldwide
- **Long cache TTL** — Immutable versioned URLs are cached for 1 year
- **HTTPS only** — Required for custom elements (secure contexts)

### unpkg

unpkg proxies npm at `https://unpkg.com/`:

```html
<script
  type="module"
  src="https://unpkg.com/@helixui/library@2.3.1/dist-cdn/hx-library.es.js"
></script>
```

**Recommendation:** Use jsDelivr for production. It has better uptime guarantees and performance than unpkg, which is community-operated with no SLA.

---

## Drupal Library System CDN Integration

Drupal's library system (`libraries.yml`) can reference CDN URLs directly with a local fallback for when the CDN is unavailable.

### Basic CDN Library Definition

```yaml
# helix_theme.libraries.yml

helix-components:
  version: '2.3.1'
  header: true
  js:
    # Load Lit first (required by HELiX components)
    https://cdn.jsdelivr.net/npm/lit@3/index.js:
      type: external
      minified: true
      attributes:
        type: module
    # Then load the HELiX bundle
    https://cdn.jsdelivr.net/npm/@helixui/library@2.3.1/dist-cdn/hx-library.es.js:
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
  version: '2.3.1'
  header: true
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@2.3.1/dist-cdn/hx-library.es.js:
      type: external
      minified: true
      attributes:
        type: module
        crossorigin: anonymous
        integrity: 'sha384-[SRI_HASH_HERE]'
    # Local fallback (relative to the theme root)
    js/vendor/hx-library.es.js:
      minified: true
      attributes:
        type: module
```

Copy the CDN file to `js/vendor/hx-library.es.js` during your theme build process:

```bash
# In your theme's build script
curl -o themes/custom/helix_theme/js/vendor/hx-library.es.js \
  "https://cdn.jsdelivr.net/npm/@helixui/library@2.3.1/dist-cdn/hx-library.es.js"
```

**Note:** Drupal's `type: external` libraries do not automatically implement fallback logic. For true failover, use a small inline script that checks if `customElements.get('hx-button')` is defined after the CDN script tag and loads the local version if not.

---

## Subresource Integrity (SRI)

SRI prevents CDN-delivered files from being tampered with. The browser computes a hash of the downloaded file and compares it against the `integrity` attribute. If they do not match, the browser refuses to execute the file.

### Generating SRI Hashes

```bash
# Generate sha384 hash for the CDN bundle
openssl dgst -sha384 -binary dist-cdn/hx-library.es.js \
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

const files = ['dist-cdn/hx-library.es.js', 'dist-cdn/hx-library.iife.js'];

const hashes: Record<string, string> = {};

for (const file of files) {
  const content = readFileSync(resolve(__dirname, '..', file));
  const hash = createHash('sha384').update(content).digest('base64');
  hashes[file] = `sha384-${hash}`;
}

writeFileSync(
  resolve(__dirname, '..', 'dist-cdn/sri-hashes.json'),
  JSON.stringify(hashes, null, 2),
);

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
  src="https://cdn.jsdelivr.net/npm/@helixui/library@2.3.1/dist-cdn/hx-library.es.js"
  integrity="sha384-ABC123..."
  crossorigin="anonymous"
></script>
```

The `crossorigin="anonymous"` attribute is required when using `integrity` with a cross-origin resource.

**In Drupal's libraries.yml:**

```yaml
helix-components:
  version: '2.3.1'
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@2.3.1/dist-cdn/hx-library.es.js:
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
https://cdn.jsdelivr.net/npm/@helixui/library@2.3.1/dist-cdn/hx-library.es.js
                                                   ^^^^^^
                                                   Exact semver version
```

This URL is permanently cached. When `2.3.2` ships, a new URL is served. Old URLs continue to work indefinitely. Consumers upgrade by updating the version in their URL.

**Do not use floating ranges on CDN URLs:**

```html
<!-- ❌ BAD — a new release changes what this URL serves -->
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@latest/dist-cdn/hx-library.es.js"
></script>

<!-- ❌ BAD — minor/patch updates silently change the file -->
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@2/dist-cdn/hx-library.es.js"
></script>
```

Floating ranges work in `package.json` (with a lockfile) because `npm ci` resolves and pins the version. On CDN URLs there is no lockfile, so a minor update can silently break a Drupal site.

**CDN URL pattern for HELiX releases:**

```
# Exact version — immutable, cache-forever
https://cdn.jsdelivr.net/npm/@helixui/library@{VERSION}/dist-cdn/hx-library.es.js

# Per-component (when using import maps)
https://cdn.jsdelivr.net/npm/@helixui/library@{VERSION}/dist-cdn/components/hx-button.js
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
  src="https://cdn.jsdelivr.net/npm/@helixui/library@2.3.1/dist-cdn/hx-library.es.js"
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
      "@helixui/library/components/hx-button": "https://cdn.jsdelivr.net/npm/@helixui/library@2.3.1/dist-cdn/components/hx-button.js",
      "@helixui/library/components/hx-card": "https://cdn.jsdelivr.net/npm/@helixui/library@2.3.1/dist-cdn/components/hx-card.js"
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
          "@helixui/library/": "https://cdn.jsdelivr.net/npm/@helixui/library@2.3.1/dist/"
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
<!-- packages/hx-library/dist-cdn/test.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>HELiX CDN Bundle Test</title>
  </head>
  <body>
    <!-- Load the local CDN bundle -->
    <script type="module" src="/hx-library.es.js"></script>

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

### Testing the IIFE Bundle

The IIFE bundle is consumed as a classic `<script>` tag (no `type="module"`):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>HELiX IIFE Bundle Test</title>
  </head>
  <body>
    <!-- IIFE — loaded as classic script, no module support needed -->
    <script src="/hx-library.iife.js"></script>

    <hx-button>Button</hx-button>

    <script>
      // HxLibrary is available as a global after the IIFE executes
      console.log('HxLibrary:', typeof window.HxLibrary);
    </script>
  </body>
</html>
```

### Verifying SRI Hashes

After generating SRI hashes, verify they are correct before adding them to `libraries.yml`:

```bash
# Compute hash of the local file
openssl dgst -sha384 -binary dist-cdn/hx-library.es.js \
  | openssl base64 -A

# Compare against the generated hash in sri-hashes.json
cat dist-cdn/sri-hashes.json
```

Also test that the hash works in a browser — add the `integrity` attribute to your test HTML file and verify the console does not report an SRI failure.

---

## Release Checklist for CDN Bundles

Before tagging a release that includes CDN bundles:

- [ ] `npm run build:cdn` completes without errors
- [ ] `dist-cdn/hx-library.es.js` and `dist-cdn/hx-library.iife.js` exist
- [ ] Local test HTML confirms all components render correctly
- [ ] SRI hashes generated and written to `dist-cdn/sri-hashes.json`
- [ ] CDN URLs updated in `CHANGELOG.md` for this release
- [ ] Drupal integration docs updated with new version number and SRI hash
- [ ] `dist-cdn/` is included in the npm package files (check `package.json` `files` field)

```json
{
  "files": ["dist/", "dist-cdn/", "src/", "custom-elements.json"]
}
```

---

## Related Pages

- [Versioning and Changelogs](./versioning/) — Semantic versioning, Changesets, and communicating breaking changes
- [Lazy Loading Web Components](../performance/lazy-loading/) — Defer component loading with IntersectionObserver and Drupal behaviors
- [Drupal Integration Overview](/drupal-integration/overview/) — Full guide to consuming HELiX in Drupal
