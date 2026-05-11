---
title: Quick Start
description: Get up and running with HELIX web components in minutes
---

This guide walks you through using HELiX components in your project.

## Install the Package

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
```

Then use the components in your HTML:

```html
<hx-card variant="elevated">
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
    <link rel="stylesheet" href="https://unpkg.com/@helixui/library@3.0.0/dist/css/helix-all.css" />
  </head>
  <body>
    <hx-card variant="elevated">
      <hx-text>Browse our latest content and support resources.</hx-text>
      <hx-button slot="actions" variant="primary">Learn More</hx-button>
    </hx-card>

    <script type="module" src="https://unpkg.com/@helixui/library@3.0.0/dist/index.js"></script>
  </body>
</html>
```

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
