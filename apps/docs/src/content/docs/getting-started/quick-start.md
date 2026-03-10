---
title: Quick Start
description: Get up and running with HELIX web components in minutes
---

This guide walks you through using HELIX components in a Drupal theme or standalone HTML page.

## Start the Dev Environment

```bash
# From the repository root
npm run dev
```

The documentation site will be available at `http://localhost:3150`, Storybook at `http://localhost:3151`, and the Admin Dashboard at `http://localhost:3159`.

## Using Components in a Drupal Theme

The recommended path for Drupal is per-component loading via `libraries.yml`. Load only what the page needs:

```yaml
# mytheme.libraries.yml
helix-button:
  js:
    dist/components/hx-button/index.js: { type: external, attributes: { type: module } }

helix-card:
  js:
    dist/components/hx-card/index.js: { type: external, attributes: { type: module } }
```

Then in your Twig template:

```twig
{# node--article--teaser.html.twig #}
{{ attach_library('mytheme/helix-card') }}
{{ attach_library('mytheme/helix-button') }}

<hx-card variant="elevated">
  <hx-text>{{ content.field_summary }}</hx-text>
  <hx-button slot="actions" variant="primary">Read More</hx-button>
</hx-card>
```

## Using Components in a Plain HTML Page

For non-Drupal contexts, import components as ES modules:

```html
<!-- Import individual components for minimal bundle size -->
<script type="module" src="/dist/components/hx-button/index.js"></script>
<script type="module" src="/dist/components/hx-card/index.js"></script>

<hx-card variant="elevated">
  <hx-text>Browse our latest content and support resources.</hx-text>
  <hx-button slot="actions" variant="primary">Learn More</hx-button>
</hx-card>
```

Or import the full library (larger bundle, simpler setup):

```html
<script type="module" src="/dist/index.js"></script>
```

## Using Components in TypeScript

When consuming `@helix/library` from TypeScript or a framework:

```typescript
import '@helix/library/components/hx-button';
import '@helix/library/components/hx-card';
```

## Explore the Component Library

The [Component Library](/component-library/overview/) documents all 85 components (73 standalone + 12 sub-components) with API references, usage examples, and Storybook previews.

## Next Steps

- [Project Structure](/getting-started/project-structure/) - Understand the codebase layout
- [Component Library](/component-library/overview/) - Browse all 85 components
- [Design Tokens](/design-tokens/overview/) - Learn the three-tier token system
- [Drupal Integration](/drupal-integration/overview/) - Complete Drupal integration guide
