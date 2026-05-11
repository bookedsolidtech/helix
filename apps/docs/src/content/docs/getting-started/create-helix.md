---
title: create-helix CLI
description: Scaffold a new project with HELiX web components using the create-helix CLI
---

`create-helix` is the official scaffolding CLI for HELiX web components. It generates a production-ready project for any supported framework in seconds.

- **npm:** [npmjs.com/package/create-helix](https://www.npmjs.com/package/create-helix)
- **GitHub:** [github.com/bookedsolidtech/create-helix-app](https://github.com/bookedsolidtech/create-helix-app)

## Requirements

- Node.js 22 LTS or Node.js 24 (Node 20 reaches upstream EOL on 2026-04-30)

## Quick Start

```bash
npx create-helix
# or
npm create helix
```

The interactive TUI prompts you for a framework, component bundles, and optional features (TypeScript, ESLint, design tokens, dark mode). When done, it outputs a ready-to-run project.

## Framework Templates

`create-helix` supports 15 framework targets. Pass `--template` to skip the prompt:

```bash
npx create-helix --template react-next
npx create-helix --template react-vite
npx create-helix --template remix
npx create-helix --template vue-nuxt
npx create-helix --template vue-vite
npx create-helix --template svelte-kit
npx create-helix --template angular
npx create-helix --template astro
npx create-helix --template vanilla
npx create-helix --template solid-vite
npx create-helix --template qwik-vite
npx create-helix --template lit-vite
npx create-helix --template preact-vite
npx create-helix --template stencil
npx create-helix --template ember
```

| Template ID | Name | Description |
| ----------- | ---- | ----------- |
| `react-next` | React + Next.js 15 | App Router, SSR-ready, full HELiX integration — **recommended for new projects** |
| `react-vite` | React + Vite | Lightning fast dev, SPA-first, HELiX with `@lit/react` |
| `remix` | React Router (Remix) | Full-stack React with SSR, nested routes |
| `vue-nuxt` | Vue + Nuxt 4 | Full-stack Vue with SSR, native web component support |
| `vue-vite` | Vue + Vite | Lightweight Vue 3 SPA with native web component binding |
| `svelte-kit` | SvelteKit | Svelte 5 + SvelteKit, native custom element support |
| `angular` | Angular 18 | Enterprise Angular with `CUSTOM_ELEMENTS_SCHEMA` pre-configured |
| `astro` | Astro | Content-first with islands architecture, zero JS by default |
| `vanilla` | Vanilla (HTML + CDN) | No framework, no build step — just HTML and HELiX via CDN |
| `solid-vite` | Solid.js + Vite | Fine-grained reactive SPA with native web component support |
| `qwik-vite` | Qwik + Vite | Resumable framework with zero hydration |
| `lit-vite` | Lit + Vite | Lightweight web components with Google Lit and Vite |
| `preact-vite` | Preact + Vite | Fast 3kB React alternative with native web component support |
| `stencil` | Stencil | Compiler for standards-based web components with lazy-loading |
| `ember` | Ember.js | Convention-driven full-stack framework |

## Component Bundles

Choose which component groups to include. Each bundle is a curated set of HELiX components optimized for tree-shaking:

| Bundle ID | Name | Components |
| --------- | ---- | ---------- |
| `all` | All Components | All components — the full HELiX library |
| `core` | Core UI | button, card, badge, text, icon, avatar, divider, chip, tooltip, popover |
| `forms` | Form Components | text-input, select, checkbox, radio, switch, textarea, field, combobox, date-picker |
| `navigation` | Navigation | nav, sidebar, tabs, breadcrumb, pagination, menu, tree-view |
| `data-display` | Data Display | data-table, stat, progress-bar, meter, counter, structured-list, rating |
| `feedback` | Feedback & Overlays | alert, toast, dialog, drawer, banner, skeleton, spinner |
| `layout` | Layout | grid, stack, split-panel, accordion, carousel, container, scroll-area |

Bundles can be combined. Select multiple bundles during the interactive prompt or pass `--bundles`:

```bash
npx create-helix --bundles core,forms,feedback
npx create-helix --bundles all
```

## Drupal Theme Scaffolding

For Drupal-first projects, use the `--drupal` flag. This scaffolds a complete Drupal theme directory with:

- Theme info and libraries YAML files
- Single Directory Components (SDCs) with Twig templates
- HELiX component CDN integration via `helixui.libraries.yml`
- Drupal behaviors using the `once()` pattern
- `composer.json` and `package.json`

```bash
npx create-helix --drupal
```

### Drupal Presets

Presets apply a curated SDC set and configuration for specific Drupal use cases:

```bash
# Standard preset — Core Drupal SDCs for general-purpose themes
npx create-helix --drupal --preset standard

# Blog preset — Standard + blog-specific content components
npx create-helix --drupal --preset blog

# Healthcare preset — Blog + healthcare-specific components (HIPAA-aware)
npx create-helix --drupal --preset healthcare

# Intranet preset — Standard + employee portal components
npx create-helix --drupal --preset intranet

# Ecommerce preset — Ecommerce-optimized component set
npx create-helix --drupal --preset ecommerce
```

| Preset | Description | SDC Count |
| ------ | ----------- | --------- |
| `standard` | Core Drupal SDCs for general-purpose themes | 7 |
| `blog` | Standard + blog-specific content components | 12 |
| `healthcare` | Blog + healthcare-specific components (HIPAA-aware) | 16 |
| `intranet` | Standard + employee portal components | 11 |
| `ecommerce` | Ecommerce-optimized component set | — |

## Subcommands

`create-helix` includes several utility subcommands:

```bash
# List all available framework templates
npx create-helix list

# Show details for a specific template
npx create-helix info react-next

# Run the environment diagnostics tool
npx create-helix doctor

# Upgrade an existing project's HELiX dependencies
npx create-helix upgrade

# View or set CLI configuration
npx create-helix config
npx create-helix config <key>
```

## All CLI Options

```
create-helix [project-name] [options]
create-helix list
create-helix info <template>
create-helix doctor
create-helix upgrade
create-helix config [key]

Scaffold Options:
  --template <id>       Framework template ID (see table above)
  --bundles <list>      Comma-separated bundle IDs: all, core, forms, navigation,
                        data-display, feedback, layout
  --output-dir, -o      Output directory (defaults to project name)
  --drupal              Scaffold a Drupal theme instead of a framework project
  --preset <name>       Drupal preset: standard, blog, healthcare, intranet, ecommerce
  --profile <name>      Load a saved configuration profile

Feature Toggles (all default to enabled):
  --typescript          Include TypeScript configuration
  --no-typescript       Skip TypeScript configuration
  --eslint              Include ESLint configuration
  --no-eslint           Skip ESLint configuration
  --tokens              Include design token scaffold
  --no-tokens           Skip design token scaffold
  --dark-mode           Include dark mode support
  --no-dark-mode        Skip dark mode support

Behavior Flags:
  --dry-run             Preview files that would be generated without writing them
  --force               Overwrite an existing directory
  --no-install          Skip running the package manager install step
  --no-config           Skip loading the .helixrc config file
  --skip-audit          Skip the dependency security audit
  --offline             Run in offline mode (skip network checks and version lookups)
  --verbose             Enable verbose logging output
  --quiet, -q           Suppress all non-error output
  --json                Output machine-readable JSON (for CI/scripting)

Meta:
  --version, -v         Show version number
  --help, -h            Show help
```

## Post-Scaffold Steps

After scaffolding, `cd` into your project and start the dev server:

```bash
# Framework projects
cd my-app
npm install   # or pnpm install / yarn
npm run dev

# Drupal theme
cd my-helix-theme
# Add the theme directory to your Drupal installation's themes/ directory
```

## The Booked Solid Ecosystem

`create-helix` is part of the Booked Solid toolchain:

| Tool | Purpose |
| ---- | ------- |
| **helix** (`@helixui/library`) | Enterprise web component library |
| **helixir** (`@helixui/mcp`) | MCP server for AI-assisted development |
| **create-helix** | Project scaffolding CLI |

## Next Steps

- [Installation](/getting-started/installation/) — Manual installation and monorepo setup
- [Component Library](/component-library/overview/) — Browse all components
- [Design Tokens](/design-tokens/overview/) — Customize the token system
- [Drupal Integration](/drupal/installation/getting-started/) — In-depth Drupal guide
