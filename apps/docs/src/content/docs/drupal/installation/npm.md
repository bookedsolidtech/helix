---
title: npm Installation
description: Complete guide to installing HELiX web components via npm in a Drupal 10/11 theme build pipeline — prerequisites, Vite and Webpack configuration, asset generation, library definitions, and deployment.
sidebar:
  order: 3
---

npm installation integrates HELiX directly into your Drupal theme's JavaScript build pipeline. The bundler compiles HELiX alongside your theme's own code and outputs optimized local assets. Drupal loads those assets the same way it loads any other theme JavaScript — as local files with the Libraries API.

This is the recommended approach for production custom themes where performance, security, offline development, and long-term maintainability are priorities.

---

## Why Choose npm Installation

### Complete Local Control

Your site has zero runtime dependency on external services. All assets live in your repository (or are generated at deploy time from committed `package-lock.json`). Corporate firewalls, CDN outages, and HIPAA restrictions do not apply.

### Tree-Shaking

Import only the components your theme actually uses. If your site uses five of twenty available components, only those five ship to the browser. This typically reduces the JavaScript payload by 60–80% compared to loading the full CDN bundle.

### Deterministic Versions

`package-lock.json` pins every dependency to an exact resolved version. Development, staging, and production all run identical code — no surprises from CDN auto-updates.

### Drupal Asset Aggregation

Local JavaScript files participate in Drupal's asset aggregation system. Drupal can combine your theme's HELiX-importing entry point with other scripts, reducing HTTP requests.

---

## Prerequisites

Before starting, verify your environment has:

- **Node.js 18 or later** — `node --version`
- **npm 9 or later** — `npm --version` (comes with Node.js)
- A Drupal 10 or 11 site with a custom theme
- Your theme located at `web/themes/custom/mytheme/`

If Node.js is not installed, download it from [nodejs.org](https://nodejs.org/) or use a version manager like `nvm`.

---

## Step 1: Initialize Theme package.json

If your theme doesn't already have a `package.json`, create one:

```bash
cd web/themes/custom/mytheme
npm init -y
```

This creates a minimal `package.json`. You'll customize it in a moment.

---

## Step 2: Install HELiX

```bash
npm install @helixui/library@3.0.0
```

To also install the design tokens package (required if your theme uses HELiX CSS custom properties outside of components):

```bash
npm install @helixui/tokens@0.3.4
```

Verify the installation:

```bash
ls node_modules/@helixui/library/dist/
# Should show: index.js  components/  css/  ...
```

The library's main entry point is `./dist/index.js` as declared in the package's `main` field.

---

## Step 3: Create the JavaScript Entry Point

Create a JavaScript file that imports the HELiX components your theme needs.

### Import Full Library

```javascript
// src/js/theme.js

// Import entire HELiX library — all components registered
import '@helixui/library';
```

### Import Specific Components (Tree-Shaking)

```javascript
// src/js/theme.js

// Import only the components this theme uses
import '@helixui/library/dist/components/hx-button/index.js';
import '@helixui/library/dist/components/hx-card/index.js';
import '@helixui/library/dist/components/hx-text-input/index.js';
import '@helixui/library/dist/components/hx-select/index.js';
import '@helixui/library/dist/components/hx-badge/index.js';
```

Tree-shaking at import granularity is the most effective approach when you're using five or fewer components. For sites using the majority of the library, importing the full library is simpler and the size difference is minimal.

### Combining with Theme JavaScript

```javascript
// src/js/theme.js

// HELiX components
import '@helixui/library';

// Theme behaviors
import './behaviors/navigation.js';
import './behaviors/search.js';
import './behaviors/forms.js';
```

---

## Step 4: Configure the Bundler

### Option A: Vite (Recommended)

Vite is the preferred build tool for new Drupal theme projects. It's fast, has excellent ES module support, and requires minimal configuration.

**Install Vite:**

```bash
npm install --save-dev vite@^6.0.0
```

**`vite.config.js`:**

```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    // Output to theme's dist directory
    outDir: 'dist/js',

    // Generate source maps for debugging
    sourcemap: true,

    lib: {
      entry: resolve(__dirname, 'src/js/theme.js'),
      formats: ['es'],
      fileName: 'theme',
    },

    rollupOptions: {
      output: {
        // Separate HELiX into its own chunk for better caching
        manualChunks: {
          helix: ['@helixui/library'],
        },
      },
    },

    // Disable minification in development for readability
    minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,
  },
});
```

With `manualChunks`, Vite produces two output files:
- `dist/js/helix.js` — The HELiX library chunk
- `dist/js/theme.js` — Your theme code that imports the HELiX chunk

This separation allows browsers to cache HELiX independently of your theme code. When you update theme behavior files, users don't re-download the component library.

**`package.json` scripts:**

```json
{
  "name": "mytheme",
  "private": true,
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "build:prod": "NODE_ENV=production vite build"
  },
  "dependencies": {
    "@helixui/library": "1.1.2"
  },
  "devDependencies": {
    "vite": "^6.0.0"
  }
}
```

Use exact versions (`"1.1.2"` not `"^1.1.2"`) for `@helixui/library` in production themes. This ensures identical bundles across environments.

### Option B: Webpack

For themes with existing Webpack configurations:

**Install Webpack:**

```bash
npm install --save-dev webpack@^5.0.0 webpack-cli@^5.0.0
```

**`webpack.config.js`:**

```javascript
const path = require('path');

module.exports = {
  entry: './src/js/theme.js',

  output: {
    filename: 'theme.js',
    path: path.resolve(__dirname, 'dist/js'),
    // Required for ES module output
    module: true,
    library: {
      type: 'module',
    },
  },

  // Enable ES module output
  experiments: {
    outputModule: true,
  },

  optimization: {
    splitChunks: {
      cacheGroups: {
        // Split HELiX into separate chunk
        helix: {
          test: /[\\/]node_modules[\\/]@helixui[\\/]/,
          name: 'helix',
          chunks: 'all',
        },
      },
    },
  },

  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
};
```

**`package.json` scripts with Webpack:**

```json
{
  "scripts": {
    "dev": "webpack --watch --mode development",
    "build": "webpack --mode production"
  }
}
```

**Important note on Webpack and ES modules:** HELiX components use ES module syntax (`import`/`export`) throughout. Webpack's `experiments.outputModule: true` is required to produce an output file that Drupal can load as a `type="module"` script. Without this, Webpack wraps the output in a CommonJS wrapper that is incompatible with the browser's native ES module loader.

---

## Step 5: Build the Assets

```bash
# Development build with watch mode (rebuilds on file changes)
npm run dev

# Production build (optimized)
npm run build:prod
```

Verify the output:

```bash
ls -lh dist/js/
# Expected output (Vite with manualChunks):
# helix.js        — HELiX library (~120KB unminified, ~45KB gzipped)
# theme.js        — Your theme code (~small)
```

---

## Step 6: Define Drupal Libraries

Add the compiled assets to your theme's `.libraries.yml`:

```yaml
# mytheme.libraries.yml

global:
  version: 1.x
  js:
    # Import map entry for HELiX chunk (if using manualChunks)
    dist/js/helix.js:
      attributes:
        type: module
      preprocess: false
      minified: true
    # Theme entry point
    dist/js/theme.js:
      attributes:
        type: module
      preprocess: false
      minified: true
  dependencies:
    - core/drupal
    - core/once
```

If you did **not** use `manualChunks` and Vite produced a single output file:

```yaml
global:
  version: 1.x
  js:
    dist/js/theme.js:
      attributes:
        type: module
      preprocess: false
      minified: true
  dependencies:
    - core/drupal
    - core/once
```

### The `attributes: { type: module }` Requirement

This attribute is mandatory. HELiX components are ES modules — they use top-level `import` and `export` statements. A browser loading an ES module file as a classic script (without `type="module"`) will throw a syntax error. Drupal does not add `type="module"` automatically; you must declare it in `.libraries.yml`.

### The `preprocess: false` Setting

Drupal's asset preprocessor appends query strings and can attempt to aggregate external references. Setting `preprocess: false` on each JS file prevents unexpected behavior with ES module output. For local files this is optional but recommended when using `type: module`.

---

## Step 7: Attach the Library

### Global (Every Page)

```yaml
# mytheme.info.yml

name: My Healthcare Theme
type: theme
core_version_requirement: ^10 || ^11
base theme: stable9

libraries:
  - mytheme/global
```

### Per Template

```twig
{# templates/node--article.html.twig #}

{{ attach_library('mytheme/global') }}

<article{{ attributes }}>
  ...
</article>
```

---

## Step 8: Use Components in Templates

```twig
{# Article node template #}

<article{{ attributes }}>
  <hx-card variant="elevated">
    <span slot="heading">{{ node.title.value }}</span>
    {{ content.body }}
    <div slot="footer">
      <hx-button variant="primary" hx-size="sm">
        Read More
      </hx-button>
    </div>
  </hx-card>
</article>
```

For link cards, use `href` (not `href`):

```twig
<hx-card
  variant="outlined"
  href="{{ url('entity.node.canonical', {'node': node.id}) }}"
>
  <span slot="heading">{{ node.title.value }}</span>
  <p>{{ node.field_teaser.value }}</p>
</hx-card>
```

For sized buttons, use `hx-size` (not `size`):

```twig
<hx-button variant="primary" hx-size="lg">Submit</hx-button>
<hx-button variant="secondary" hx-size="md">Cancel</hx-button>
```

---

## Deployment Pipeline

Your deployment process must run the npm build before deploying theme files.

### Basic Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Installing theme dependencies..."
cd web/themes/custom/mytheme
npm ci --production=false

echo "Building theme assets..."
npm run build:prod

echo "Deploying to server..."
rsync -az --exclude=node_modules . user@server:/var/www/html/web/themes/custom/mytheme/

echo "Clearing Drupal caches..."
ssh user@server 'drush -r /var/www/html cr'

echo "Deployment complete."
```

### CI/CD (GitHub Actions Example)

```yaml
# .github/workflows/deploy.yml

name: Deploy Drupal

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: web/themes/custom/mytheme/package-lock.json

      - name: Install theme dependencies
        run: npm ci
        working-directory: web/themes/custom/mytheme

      - name: Build theme assets
        run: npm run build:prod
        working-directory: web/themes/custom/mytheme

      - name: Deploy
        # ... your deployment step
```

**Key points:**
- Use `npm ci` (not `npm install`) in CI. It installs exactly what's in `package-lock.json` and fails if the lockfile is out of date.
- Cache the `node_modules` directory using the lockfile hash for faster CI runs.
- Never deploy `node_modules` to the server — only deploy compiled `dist/` assets.

---

## Updating HELiX

```bash
cd web/themes/custom/mytheme

# Install the new version
npm install @helixui/library@3.0.0

# Review the HELiX changelog before rebuilding

# Rebuild assets
npm run build:prod

# Verify nothing broke (run your visual regression / accessibility tests)

# Commit the updated package-lock.json and built assets
git add package.json package-lock.json dist/
git commit -m "chore(theme): update @helixui/library to 1.2.0"
```

Always review the HELiX changelog before updating. Check for attribute name changes, removed components, or slot renames that would require template updates.

---

## Source Maps

Source maps let you debug the original component source in browser DevTools even when loading a compiled bundle.

```javascript
// vite.config.js — enable in both dev and prod
export default defineConfig({
  build: {
    sourcemap: true, // Generates .js.map files alongside .js
    // ...
  },
});
```

When `sourcemap: true`, Vite generates `dist/js/theme.js.map`. Browsers use this automatically. No Drupal configuration is needed — source maps are fetched by the browser's DevTools on demand, not loaded by page visitors.

---

## Handling CSS

HELiX components encapsulate their styles in Shadow DOM. They do not require you to load a separate CSS file for the component rendering to work.

If you want to use HELiX design token CSS custom properties in your own theme CSS (outside of components), import the tokens:

```bash
npm install @helixui/tokens@0.3.4
```

```javascript
// src/js/theme.js
import '@helixui/tokens/dist/css/tokens.css';
import '@helixui/library';
```

Or import the tokens CSS directly in your theme's SCSS/CSS:

```css
/* src/css/theme.css */
@import '@helixui/tokens/dist/css/tokens.css';
```

Add the compiled CSS to your Drupal library definition:

```yaml
global:
  version: 1.x
  css:
    theme:
      dist/css/theme.css: {}
  js:
    dist/js/theme.js:
      attributes:
        type: module
      preprocess: false
```

---

## Troubleshooting

### `import` statement syntax error in browser console

**Cause:** The compiled output file is being loaded as a classic script, not as an ES module.

**Fix:** Ensure `attributes: { type: module }` is in your `.libraries.yml` entry for the JS file.

### Components registered but no styles (flat HTML appearance)

**Cause:** Components rely on Constructable Stylesheets / Shadow DOM — if you're testing in a very old browser (pre-2020), this won't work. All modern browsers are fine.

**Cause (alternate):** Design tokens CSS not loaded.

**Fix:** Import or link `@helixui/tokens` as described in the CSS section above.

### Build produces empty output or missing HELiX code

**Cause:** Tree-shaking removed HELiX because the imports weren't detected as side-effectful.

**Fix:** Add a `sideEffects` exception in your `package.json` or ensure you're importing from the main package entry:

```javascript
// Prefer this (uses package.json main entry, marked as sideEffect)
import '@helixui/library';

// Over this pattern if tree-shaking is too aggressive:
// import { HxButton } from '@helixui/library';
```

### `drush cr` needed after every build

This is expected. After rebuilding theme assets and deploying, clear Drupal's asset caches so it picks up new file hashes:

```bash
drush cr
```

In local development with `npm run dev` (watch mode), clear caches once after setting up the library. Subsequent rebuilds don't require cache clearing unless you changed `.libraries.yml`.

---

## Production Checklist

- [ ] `npm ci` runs in CI pipeline before build
- [ ] `npm run build:prod` runs with `NODE_ENV=production`
- [ ] Compiled `dist/` files are deployed to the server
- [ ] `node_modules/` is never deployed (only used at build time)
- [ ] `attributes: { type: module }` present in `.libraries.yml` for all JS entries
- [ ] `package-lock.json` is committed to source control
- [ ] Exact version pinned in `package.json` (`"1.1.2"` not `"^1.1.2"`)
- [ ] Source maps generated for production debugging
- [ ] `drush cr` runs post-deployment
- [ ] Components tested in target browsers after deployment

---

## Next Steps

- [CDN Installation](/drupal/installation/cdn/) — Simpler setup if a build pipeline is not practical
- [Module Installation](/drupal/installation/module/) — Package the built assets in a Drupal module for multi-site reuse
