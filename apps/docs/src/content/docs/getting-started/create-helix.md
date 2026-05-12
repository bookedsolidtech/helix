---
title: create-helix CLI
description: Scaffold a new project with HELiX web components using the create-helix CLI
---

> **Source of truth:** This page describes the **published `create-helix`
> package on npm** (current: `0.8.0` — verify with `npm view create-helix
version`). The implementation source lives at
> [github.com/bookedsolidtech/create-helix-app](https://github.com/bookedsolidtech/create-helix-app),
> not in this monorepo. The `packages/create-helix-app/` directory here is a
> placeholder stub reserved for a future consolidation — see
> [its README](https://github.com/bookedsolidtech/helix/blob/main/packages/create-helix-app/README.md)
> for the gap explanation. Don't validate this doc against the stub source.

`create-helix` is the official scaffolding CLI for HELiX web components. It generates a production-ready project for any supported framework in seconds.

- **npm:** [npmjs.com/package/create-helix](https://www.npmjs.com/package/create-helix)
- **GitHub (canonical source):** [github.com/bookedsolidtech/create-helix-app](https://github.com/bookedsolidtech/create-helix-app)

## Requirements

- Node.js 22 LTS or Node.js 24 (Node 20 reaches upstream EOL on 2026-04-30)

## Quick Start

```bash
npx create-helix project-name
# or
npm create helix project-name
```

The CLI takes the new project's directory name as its first positional
argument, then prompts you interactively for a framework, component bundles,
and optional features (TypeScript, ESLint, design tokens, dark mode). When
done, it writes a ready-to-run project at `./project-name/`.

## Framework Templates

`create-helix` ships with 15 framework targets, all selected from the
interactive prompt. The shipped CLI (`packages/create-helix-app/dist/cli.js`)
treats its first positional argument as the project name only — flag-based
template/bundle selection is part of the roadmap (see
[Planned CLI Surface](#planned-cli-surface) below). For now, run the CLI and
choose the template from the prompt:

```bash
npx create-helix my-app
# → prompts you to pick from the 15 framework targets in the table below.
```

| Template ID   | Name                 | Description                                                                      |
| ------------- | -------------------- | -------------------------------------------------------------------------------- |
| `react-next`  | React + Next.js 15   | App Router, SSR-ready, full HELiX integration — **recommended for new projects** |
| `react-vite`  | React + Vite         | Lightning fast dev, SPA-first, HELiX with `@lit/react`                           |
| `remix`       | React Router (Remix) | Full-stack React with SSR, nested routes                                         |
| `vue-nuxt`    | Vue + Nuxt 4         | Full-stack Vue with SSR, native web component support                            |
| `vue-vite`    | Vue + Vite           | Lightweight Vue 3 SPA with native web component binding                          |
| `svelte-kit`  | SvelteKit            | Svelte 5 + SvelteKit, native custom element support                              |
| `angular`     | Angular 18           | Enterprise Angular with `CUSTOM_ELEMENTS_SCHEMA` pre-configured                  |
| `astro`       | Astro                | Content-first with islands architecture, zero JS by default                      |
| `vanilla`     | Vanilla (HTML + CDN) | No framework, no build step — just HTML and HELiX via CDN                        |
| `solid-vite`  | Solid.js + Vite      | Fine-grained reactive SPA with native web component support                      |
| `qwik-vite`   | Qwik + Vite          | Resumable framework with zero hydration                                          |
| `lit-vite`    | Lit + Vite           | Lightweight web components with Google Lit and Vite                              |
| `preact-vite` | Preact + Vite        | Fast 3kB React alternative with native web component support                     |
| `stencil`     | Stencil              | Compiler for standards-based web components with lazy-loading                    |
| `ember`       | Ember.js             | Convention-driven full-stack framework                                           |

## Component Bundles

Choose which component groups to include. Each bundle is a curated set of HELiX components optimized for tree-shaking:

| Bundle ID      | Name                | Components                                                                          |
| -------------- | ------------------- | ----------------------------------------------------------------------------------- |
| `all`          | All Components      | All components — the full HELiX library                                             |
| `core`         | Core UI             | button, card, badge, text, icon, avatar, divider, tag, tooltip, popover             |
| `forms`        | Form Components     | text-input, select, checkbox, radio, switch, textarea, field, combobox, date-picker |
| `navigation`   | Navigation          | nav, side-nav, tabs, breadcrumb, pagination, menu, tree-view                        |
| `data-display` | Data Display        | data-table, stat, progress-bar, meter, counter, structured-list, rating             |
| `feedback`     | Feedback & Overlays | alert, toast, dialog, drawer, banner, skeleton, spinner                             |
| `layout`       | Layout              | grid, stack, split-panel, accordion, carousel, container                            |

Bundle selection is part of the same interactive flow — pick which bundles
you want from the prompts after choosing a template.

## Drupal Theme Scaffolding

For Drupal-first projects, the interactive prompts include a Drupal track that
scaffolds a complete Drupal theme directory with:

- Theme info and libraries YAML files
- Single Directory Components (SDCs) with Twig templates
- HELiX component CDN integration via `helixui.libraries.yml`
- Drupal behaviors using the `once()` pattern
- `composer.json` and `package.json`

### Drupal Presets (interactive)

The Drupal track exposes preset choices in the prompt:

| Preset       | Description                                         | SDC Count |
| ------------ | --------------------------------------------------- | --------- |
| `standard`   | Core Drupal SDCs for general-purpose themes         | 7         |
| `blog`       | Standard + blog-specific content components         | 12        |
| `healthcare` | Blog + healthcare-specific components (HIPAA-aware) | 16        |
| `intranet`   | Standard + employee portal components               | 11        |
| `ecommerce`  | Ecommerce-optimized component set                   | —         |

## Planned CLI Surface

The shipped CLI today is interactive-only. The following non-interactive
surface is on the roadmap but **not yet implemented**:

```
# PLANNED — these flags are not parsed by the current CLI build.
create-helix [project-name] [options]
create-helix list                       # list templates
create-helix info <template>            # describe one template
create-helix doctor                     # environment diagnostics
create-helix upgrade                    # update an existing project
create-helix config [key]               # view/set CLI defaults

Scaffold Options (planned):
  --template <id>       Framework template ID
  --bundles <list>      Comma-separated bundle IDs
  --output-dir, -o      Output directory
  --drupal              Scaffold a Drupal theme instead of a framework project
  --preset <name>       Drupal preset
  --profile <name>      Load a saved configuration profile

Feature Toggles (planned, all default to enabled):
  --typescript / --no-typescript
  --eslint / --no-eslint
  --tokens / --no-tokens
  --dark-mode / --no-dark-mode

Behavior Flags (planned):
  --dry-run, --force, --no-install, --no-config, --skip-audit,
  --offline, --verbose, --quiet, --json

Meta (planned):
  --version, -v
  --help, -h
```

Track [bookedsolidtech/helix#create-helix-cli-flags](https://github.com/bookedsolidtech/helix/labels/area%3Acreate-helix)
for the implementation of the non-interactive surface. Until it lands, scripts
that need a non-interactive scaffold should fall back to `git clone` against
one of the template repos.

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

| Tool                           | Purpose                                |
| ------------------------------ | -------------------------------------- |
| **helix** (`@helixui/library`) | Enterprise web component library       |
| **helixir** (`@helixui/mcp`)   | MCP server for AI-assisted development |
| **create-helix**               | Project scaffolding CLI                |

## Next Steps

- [Installation](/getting-started/installation/) — Manual installation and monorepo setup
- [Storybook](https://storybook.helix.bookedsolid.tech/) — Browse all components
- [Design Tokens](/design-tokens/overview/) — Customize the token system
- [Drupal Integration](/drupal/installation/getting-started/) — In-depth Drupal guide
