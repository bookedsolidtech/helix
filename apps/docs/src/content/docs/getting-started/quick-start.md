---
title: Quick Start
description: Get up and running with HELIX web components in minutes
---

This guide walks you through using HELiX components in your project.

## Option A: Scaffold with `create-helix`

The fastest way to start — `create-helix` generates a runnable project for your framework with the components you pick:

```bash
npx create-helix
```

Pick a framework (Astro, Next.js, Vue, Svelte, vanilla HTML, or Drupal), choose components, and start the dev server. Skip to [Using Components](#using-components-via-npm) if you'd rather wire HELiX into an existing project manually.

## Option B: Install the Package

```bash
npm install @helixui/library @helixui/tokens
```

## Using Components via npm

Import individual components or the full library in your JavaScript/TypeScript:

```js
// Import the full library (registers all components)
import '@helixui/library';

// Or import individual components for better tree-shaking
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-card';
import '@helixui/library/components/hx-text';
```

Then use the components in your HTML:

```html
<hx-card variant="featured" elevation="raised">
  <h3 slot="heading">Latest content</h3>
  <hx-text>Browse our latest content and support resources.</hx-text>
  <hx-button slot="actions" variant="primary">Learn More</hx-button>
</hx-card>
```

## Using Components via CDN

Load HELiX in any HTML page without a build step:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>HELiX Quick Start</title>
    <link rel="stylesheet" href="https://unpkg.com/@helixui/library@3.9.0/dist/css/helix-all.css" />
    <script type="importmap">
    {
      "imports": {
        "@helixui/library": "https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js",
        "@helixui/tokens":  "https://cdn.jsdelivr.net/npm/@helixui/tokens@3.9.0/dist/index.js",
        "@helixui/icons":   "https://cdn.jsdelivr.net/npm/@helixui/icons@1.0.0/dist/index.js",
        "@floating-ui/dom": "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.6/+esm",
        "lit":              "https://cdn.jsdelivr.net/npm/lit@3/+esm",
        "lit/":              "https://cdn.jsdelivr.net/npm/lit@3/"
      }
    }
    </script>
  </head>
  <body>
    <hx-card variant="featured" elevation="raised">
      <h3 slot="heading">Latest content</h3>
      <hx-text>Browse our latest content and support resources.</hx-text>
      <hx-button slot="actions" variant="primary">Learn More</hx-button>
    </hx-card>

    <script type="module">
      import '@helixui/library';
    </script>
  </body>
</html>
```

The library is published in npm-package "library mode" — its `dist/index.js` contains bare imports (`lit`, `@helixui/tokens`, …) that the browser can only resolve through an import map. See the [Installation guide](/getting-started/installation/#cdn-no-build-step) for the canonical CDN setup.

## Start the Dev Environment (Monorepo)

If you are working inside the HELiX monorepo:

```bash
# From the repository root
pnpm run dev
```

The documentation site will be available at `http://localhost:3150`, Storybook at `http://localhost:3151`.

## Explore the Component Library

[Storybook](https://storybook.helix.bookedsolid.tech/) documents all components with API references, usage examples, and live previews.

## Next Steps

- [Installation](/getting-started/installation/) - npm, CDN, and monorepo setup details
- [Project Structure](/getting-started/project-structure/) - Understand the codebase
- [Storybook](https://storybook.helix.bookedsolid.tech/) - Browse all components
- [Design Tokens](/design-tokens/overview/) - Learn the token system
