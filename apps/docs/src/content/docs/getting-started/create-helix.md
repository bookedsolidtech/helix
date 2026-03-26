---
title: create-helix CLI
description: Scaffold a new project with HELiX web components using the create-helix CLI
---

`create-helix` is the official scaffolding CLI for HELiX web components. It generates a production-ready project for any supported framework in seconds.

- **npm:** [npmjs.com/package/create-helix](https://www.npmjs.com/package/create-helix)
- **GitHub:** [github.com/bookedsolidtech/create-helix-app](https://github.com/bookedsolidtech/create-helix-app)

## Quick Start

```bash
npx create-helix my-app
```

The interactive TUI prompts you for a framework, component bundles, and optional features (TypeScript, ESLint, design tokens). When done, it outputs a ready-to-run project.

## Framework Targets

`create-helix` supports all major frontend frameworks and plain HTML:

| Framework | Description |
| --------- | ----------- |
| **React / Next.js** | React 18 + Next.js 14 app with `@helixui/react` wrapper package |
| **Vue / Nuxt** | Vue 3 + Nuxt 3 with SSR-safe component loading |
| **SvelteKit** | SvelteKit with server-side rendering support |
| **Angular** | Angular 17+ with `CUSTOM_ELEMENTS_SCHEMA` pre-configured |
| **Astro** | Astro 5 with island hydration for interactive components |
| **Vanilla** | Plain HTML/JS with CDN or npm import — no build step required |

Pass `--framework` to skip the prompt:

```bash
npx create-helix my-app --framework react
npx create-helix my-app --framework vue
npx create-helix my-app --framework svelte
npx create-helix my-app --framework angular
npx create-helix my-app --framework astro
npx create-helix my-app --framework vanilla
```

## Component Bundles

Choose which component groups to include. Each bundle is a curated set of HELiX components optimized for tree-shaking:

| Bundle | Components included |
| ------ | ------------------- |
| **Core UI** | `hx-button`, `hx-card`, `hx-text`, `hx-icon`, `hx-badge`, `hx-divider` |
| **Forms** | `hx-text-input`, `hx-select`, `hx-checkbox`, `hx-radio`, `hx-switch`, `hx-textarea`, `hx-field` |
| **Navigation** | `hx-nav`, `hx-tabs`, `hx-breadcrumb`, `hx-pagination`, `hx-side-nav`, `hx-accordion` |
| **Data Display** | `hx-table`, `hx-list`, `hx-tag`, `hx-carousel`, `hx-code-snippet` |
| **Feedback** | `hx-alert`, `hx-toast`, `hx-spinner`, `hx-progress-bar`, `hx-skeleton` |
| **Layout** | `hx-grid`, `hx-stack`, `hx-container`, `hx-split-panel` |

Bundles can be combined. Select multiple bundles during the interactive prompt or pass `--bundles`:

```bash
npx create-helix my-app --bundles core-ui,forms,feedback
```

## Drupal Preset

For Drupal-first projects, use the `--drupal` flag. This scaffolds a Drupal-optimized project with the `@helixui/drupal-behaviors` package pre-installed, Twig template examples, and a Drupal library definition.

```bash
npx create-helix my-drupal-theme --drupal
```

### Drupal Presets

Presets apply a curated bundle selection and configuration for specific Drupal use cases:

```bash
# Healthcare preset — Core UI + Forms + Feedback bundles, WCAG 2.1 AA config
npx create-helix my-app --drupal --preset healthcare

# Government preset — Core UI + Navigation + Accessibility-first config
npx create-helix my-app --drupal --preset government

# Commerce preset — Core UI + Data Display + Forms bundles
npx create-helix my-app --drupal --preset commerce
```

Each preset configures:
- Component bundle selection
- Design token defaults
- Drupal library structure (`hx-library.libraries.yml`)
- Twig template stubs for common page patterns

## All CLI Options

```bash
npx create-helix [project-name] [options]

Options:
  --framework <name>    Target framework: react, vue, svelte, angular, astro, vanilla
  --bundles <list>      Comma-separated bundle names: core-ui, forms, navigation,
                        data-display, feedback, layout
  --drupal              Scaffold for Drupal integration (adds drupal-behaviors, Twig stubs)
  --preset <name>       Drupal preset: healthcare, government, commerce
  --typescript          Include TypeScript configuration (default: true)
  --no-typescript       Skip TypeScript configuration
  --eslint              Include ESLint configuration (default: true)
  --no-eslint           Skip ESLint configuration
  --tokens              Include design token customization scaffold (default: true)
  --no-tokens           Skip design token scaffold
  -y, --yes             Skip all prompts and use defaults
  --help                Show help
  --version             Show version
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
- [Component Library](/component-library/overview/) — Browse all 77 components
- [Design Tokens](/design-tokens/overview/) — Customize the token system
- [Drupal Integration](/drupal-integration/overview/) — In-depth Drupal guide
