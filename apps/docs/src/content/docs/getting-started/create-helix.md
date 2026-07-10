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

`create-helix`'s interactive Q1 picker surfaces a **curated set of
production-tier templates** by default — the flagship `wc-storybook` factory
plus the app starters that have shipped beyond stub quality. Twelve more
framework targets exist but are gated behind `--show-experimental` until
they reach the same bar. Pass `--template <id>` to skip the prompt, or run
the CLI without it for the interactive picker:

```bash
npx create-helix my-app --template react-next
# or
npx create-helix my-app                       # interactive picker
```

### Production-tier templates (shown by default)

| Template ID    | Name                         | Description                                                                                                                                     |
| -------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `wc-storybook` | Design System + Storybook 10 | **Default** — design-system factory. Lit 3, Storybook 10, brand-storytelling docs, AAA cards, ~99 hx-\* auto-cataloged                          |
| `react-next`   | React + Next.js 16           | App Router, SSR-ready, full HELiX integration — **recommended for new app projects**                                                            |
| `react-vite`   | React + Vite                 | Lightning fast dev, SPA-first, HELiX with `@lit/react`                                                                                          |
| `astro`        | Astro 5                      | Islands + native web components, view transitions, theme toggle (promoted in the v0.8.0 release note; verify on the version you have installed) |

### Experimental templates (run `--show-experimental` to surface)

These templates compile and emit a project skeleton, but their docs / examples / DX polish lag behind the curated production-tier set. Surface them via `npx create-helix --show-experimental` (or `HELIX_SHOW_EXPERIMENTAL=1`):

| Template ID   | Name                 | Status       |
| ------------- | -------------------- | ------------ |
| `remix`       | React Router (Remix) | Experimental |
| `vue-nuxt`    | Vue + Nuxt 4         | Experimental |
| `vue-vite`    | Vue + Vite           | Experimental |
| `svelte-kit`  | SvelteKit            | Experimental |
| `angular`     | Angular 18           | Experimental |
| `solid-vite`  | Solid.js + Vite      | Experimental |
| `qwik-vite`   | Qwik + Vite          | Experimental |
| `lit-vite`    | Lit + Vite           | Experimental |
| `preact-vite` | Preact + Vite        | Experimental |
| `stencil`     | Stencil              | Experimental |
| `ember`       | Ember.js             | Experimental |
| `vanilla`     | Vanilla (HTML + CDN) | Experimental |

These graduate out of `--show-experimental` as they reach the same bar as the production-tier set.

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

## CLI Surface

The shipped binary parses subcommands and a full flag surface. Run
`npx create-helix --help` for the exact list bundled with the version you
have installed; the table below captures the published surface.

```
create-helix [project-name] [options]
create-helix list                       # list templates
create-helix info <template>            # describe one template
create-helix doctor [--quick]           # environment diagnostics
create-helix upgrade                    # update an existing project
create-helix config validate            # validate a .helixrc config file
```

**Scaffold options:**

| Flag                        | Description                                                              |
| --------------------------- | ------------------------------------------------------------------------ |
| `--template <id>`           | Framework template ID (see table above)                                  |
| `--bundles <list>`          | Comma-separated bundle IDs                                               |
| `--output-dir <dir>` / `-o` | Output directory (defaults to the project name)                          |
| `--drupal`                  | Take the Drupal theme track instead of a framework template              |
| `--preset <name>`           | Drupal preset: `standard`, `blog`, `healthcare`, `intranet`, `ecommerce` |
| `--profile <name>`          | Load a saved configuration profile                                       |
| `--config <path>`           | Load options from a specific `.helixrc` file                             |
| `--yes` / `-y`              | Accept all interactive defaults non-interactively                        |

**Design-system options (used with `wc-storybook`):**

| Flag                                | Description                                         |
| ----------------------------------- | --------------------------------------------------- |
| `--ds-name <name>`                  | Design system / scaffold name                       |
| `--token-prefix <prefix>`           | CSS custom-property prefix (e.g. `--my-`)           |
| `--brand-tagline <text>`            | Brand tagline used in the generated Storybook intro |
| `--brand-verticals <list>`          | Comma-separated brand verticals                     |
| `--monorepo` / `--no-design-system` | Force or disable monorepo / DS-only modes           |

**Feature toggles (default enabled):**

`--typescript` / `--no-typescript`, `--eslint` / `--no-eslint`,
`--tokens` / `--no-tokens`, `--dark-mode` / `--no-dark-mode`.

**Behavior flags:**

`--dry-run`, `--force`, `--no-install`, `--no-config`, `--skip-audit`,
`--offline`, `--verbose`, `--quiet` / `-q`, `--json`,
`--show-experimental`.

**Meta:** `--version` / `-v`, `--help` / `-h`.

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
