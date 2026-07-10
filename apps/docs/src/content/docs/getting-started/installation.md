---
title: Installation
description: How to install and set up the HELIX enterprise web component library
---

:::note[Upgrading from 2.x?]
If you already have a 2.x release of `@helixui/library` installed, read the [Upgrading to 3](/migration/upgrading-to-3/) guide first. 3.0 renames the `aria-label` attribute to `accessible-label` and removes several other 2.x shims on HELiX elements.
:::

## Fastest path: scaffold a project

```bash
npx create-helix project-name
# or
npm create helix project-name
```

The `create-helix` CLI prompts through framework, components, and bundles,
then writes a runnable project at `./project-name/`. See the
[`create-helix` CLI guide](/getting-started/create-helix/) for templates,
presets, and flags.

## Install manually

If you're adding HELiX to an existing project, install the core package plus its required peer:

```bash
npm install @helixui/library @helixui/icons @floating-ui/dom
```

Or with pnpm:

```bash
pnpm add @helixui/library @helixui/icons @floating-ui/dom
```

Current versions:

| Package            | Version | Notes                                                                                                                              |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `@helixui/library` | ^3.9.0  | Lit 3.x components (core)                                                                                                          |
| `@helixui/icons`   | ^1.0.0  | Required peer — icon registry                                                                                                      |
| `@floating-ui/dom` | ^1.7.6  | Required peer — positioning engine for popover-style parts                                                                         |
| `@helixui/tokens`  | ^3.9.0  | Direct dependency of `@helixui/library`; installs automatically. Pin explicitly only if your build needs deterministic resolution. |
| `@helixui/react`   | ^3.9.0  | Optional — React 18/19 wrappers                                                                                                    |

If you are upgrading an existing project from `@helixui/library@3.8.x` or earlier, see the [3.8.0 → 3.9.0 migration guide](/migration/3-8-0-to-3-9-0/) — `@helixui/icons` is a new required peer dependency.

## CDN (No Build Step)

The library is published in npm-package "library mode" — `dist/index.js` contains bare imports (`lit`, `@helixui/tokens`, etc.) that the browser cannot resolve without an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap). Use the snippet below — and pin to the version you've tested against, not `@latest`:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/css/helix-all.css"
/>

<script type="importmap">
  {
    "imports": {
      "@helixui/library": "https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/index.js",
      "@helixui/tokens": "https://cdn.jsdelivr.net/npm/@helixui/tokens@3.9.4/dist/index.js",
      "@helixui/icons": "https://cdn.jsdelivr.net/npm/@helixui/icons@1.1.0/dist/index.js",
      "@floating-ui/dom": "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.6/+esm",
      "lit": "https://cdn.jsdelivr.net/npm/lit@3/+esm",
      "lit/": "https://cdn.jsdelivr.net/npm/lit@3/"
    }
  }
</script>
<script type="module">
  import '@helixui/library';
</script>
```

`unpkg` works as a drop-in alternative to `cdn.jsdelivr.net/npm` for any of the URLs above.

## Prerequisites

- **Node.js** 22 LTS or Node.js 24 (Node 20 reaches upstream EOL on 2026-04-30)
- **pnpm** 9.15.9 (the monorepo pins this exact version in the root `package.json` `packageManager` field; newer 9.x will likely work but is unverified)

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

| Package               | Description                                    | Status |
| --------------------- | ---------------------------------------------- | ------ |
| `apps/docs`           | Astro/Starlight documentation hub              | Active |
| `apps/storybook`      | Storybook component playground                 | Active |
| `packages/hx-library` | Lit 3.x component library (`@helixui/library`) | Active |
| `packages/hx-tokens`  | Design tokens (`@helixui/tokens`)              | Active |

## Next Steps

- [Quick Start](/getting-started/quick-start/) - Build your first component
- [Project Structure](/getting-started/project-structure/) - Understand the monorepo layout
- [Architecture Overview](/architecture/overview/) - System design decisions
