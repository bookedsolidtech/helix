---
title: Installation
description: How to install and set up the HELIX enterprise web component library
---

:::note[Upgrading from 2.x?]
If you already have a 2.x release of `@helixui/library` installed, read the [Upgrading to 3.0.0](/migration/3.0.0) guide first. 3.0.0 renames the `aria-label` attribute to `accessible-label` and removes several other 2.x shims on HELiX elements.
:::

## Install via npm

```bash
npm install @helixui/library @helixui/tokens
```

Or with pnpm:

```bash
pnpm add @helixui/library @helixui/tokens
```

Current versions:

| Package             | Version |
| ------------------- | ------- |
| `@helixui/library`  | 3.0.0   |
| `@helixui/tokens`   | 3.0.0   |

## CDN (No Build Step)

Load HELiX directly in any HTML page via unpkg or jsDelivr:

```html
<!-- All components (recommended for prototyping) -->
<script type="module" src="https://unpkg.com/@helixui/library@3.0.0/dist/index.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@helixui/library@3.0.0/dist/css/helix-all.css">
```

jsDelivr alternative:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/css/helix-all.css">
```

## Prerequisites

- **Node.js** 22.x LTS or 24.x (Node 20 reaches EOL on 2026-04-30)
- **pnpm** 9.x or later (the monorepo uses pnpm workspaces)

## Contributing / Monorepo Setup

If you are contributing to HELiX itself:

```bash
# Clone the repository
git clone https://github.com/bookedsolidtech/helix.git
cd helix

# Use the correct Node version
nvm use

# Install all dependencies (pnpm workspace-aware)
pnpm install

# Start the documentation dev server
pnpm turbo run dev --filter=docs
```

## Monorepo Structure

HELIX uses **Turborepo** with **pnpm workspaces** for build orchestration:

| Package               | Description                       | Status |
| --------------------- | --------------------------------- | ------ |
| `apps/docs`           | Astro/Starlight documentation hub | Active |
| `apps/storybook`      | Storybook component playground    | Active |
| `packages/hx-library` | Lit 3.x component library (`@helixui/library`) | Active |
| `packages/hx-tokens`  | Design tokens (`@helixui/tokens`) | Active |

## Next Steps

- [Quick Start](/getting-started/quick-start/) - Build your first component
- [Project Structure](/getting-started/project-structure/) - Understand the monorepo layout
- [Architecture Overview](/architecture/overview/) - System design decisions
