---
title: Quick Start
description: Get up and running with HELIX web components in minutes
---

This guide walks you through creating your first HELIX component and using it in a page.

## Scaffold a New Project (Recommended)

The fastest way to start a new project is with the `@helixui/create` CLI:

```bash
npx @helixui/create my-app
```

The interactive TUI will walk you through selecting a framework (React, Vue, Svelte, Angular, Astro, or Vanilla), component bundles, and optional features like TypeScript, ESLint, and design tokens.

## Start the Dev Environment

```bash
# From the repository root
npm run dev
```

The documentation site will be available at `http://localhost:3150`, Storybook at `http://localhost:3151`.

## Using Components

HELIX components are standard Web Components. They work in any HTML page:

```html
<script type="module" src="@helixui/library"></script>

<hx-card variant="elevated">
  <hx-text>Browse our latest content and support resources.</hx-text>
  <hx-button slot="actions" variant="primary">Learn More</hx-button>
</hx-card>
```

## Explore the Component Library

The [Component Library](/component-library/overview/) documents all 87 components with API references, usage examples, and Storybook previews.

## Next Steps

- [Project Structure](/getting-started/project-structure/) - Understand the codebase
- [Component Library](/component-library/overview/) - Browse all 87 components
- [Design Tokens](/design-tokens/overview/) - Learn the token system
