---
title: Documentation Hub Architecture
description: Astro/Starlight documentation hub and Storybook dual documentation system architecture
---

> **Section Owner**: Principal Engineer
> **Last Updated**: 2026-02-13
> **Status**: Active

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why Astro + Starlight](#2-why-astro--starlight)
3. [Two-System Documentation Strategy](#3-two-system-documentation-strategy)
4. [Documentation Site Information Architecture](#4-documentation-site-information-architecture)
5. [Astro/Starlight Technical Architecture](#5-astrostarlight-technical-architecture)
6. [CEM-Powered API Documentation Generation](#6-cem-powered-api-documentation-generation)
7. [Storybook Integration & Cross-Linking](#7-storybook-integration--cross-linking)
8. [Search Architecture](#8-search-architecture)
9. [Content Authoring Workflow](#9-content-authoring-workflow)
10. [Versioned Documentation Strategy](#10-versioned-documentation-strategy)
11. [Build & Deployment Pipeline](#11-build--deployment-pipeline)
12. [Monorepo Integration](#12-monorepo-integration)
13. [Implementation Roadmap](#13-implementation-roadmap)
14. [Technology Decision Log](#14-technology-decision-log)

---

## 1. Executive Summary

A Web Component library serving multiple audiences -- component builders, Drupal integration teams, and designers -- requires documentation infrastructure that goes beyond what a design system playground can provide. Storybook excels at interactive component exploration and visual testing, but it was never designed to be a comprehensive documentation hub with guides, tutorials, architecture overviews, and integration patterns.

This document defines a **two-system documentation architecture**:

1. **Storybook** (already defined in Sections 2 and 3) = **Design System Playground** -- interactive component demos, live controls, visual regression testing, automated API tables from the Custom Elements Manifest
2. **Astro/Starlight** = **Documentation Hub** -- comprehensive guides, tutorials, integration patterns, architecture decisions, getting-started content, and audience-specific learning paths

The two systems are complementary, not redundant. Storybook answers "what does this component look like and how do I configure it?" Starlight answers "how do I integrate this library into my Drupal theme, what architectural patterns should I follow, and where do I start?"

**Key architectural decisions:**

- Astro 5.x with Starlight as the documentation framework (Pagefind built-in search, MDX support, i18n-ready)
- Custom Elements Manifest as the single source of truth for API reference pages (auto-generated, never hand-maintained)
- Pagefind `mergeIndex` for unified search across both Starlight and Storybook
- Storybook story embeds via `<iframe>` in Starlight pages for live component previews within prose documentation
- Content collections with Zod schemas for type-safe documentation content
- Audience-segmented navigation (component builders, Drupal teams, designers)

---

## 2. Why Astro + Starlight

### Framework Evaluation

| Criterion                 | Starlight (Astro)                                                                                | Docusaurus                                                    | VitePress                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------- |
| **Build framework**       | Astro 5.x (multi-framework islands)                                                              | React (hard dependency)                                       | Vue (hard dependency)                               |
| **Framework lock-in**     | None -- supports React, Vue, Svelte, Solid, Lit, or plain HTML                                   | React required for all customization                          | Vue required for customization                      |
| **Output**                | Static HTML with zero-JS by default; islands hydrate on demand                                   | Client-side React app with SSR                                | Vue SPA with SSR                                    |
| **Web Component support** | Native -- Astro renders custom elements with zero config                                         | Requires MDX plugin configuration                             | Requires custom container plugin                    |
| **Search**                | Pagefind built-in (zero-config, static, no external service)                                     | Algolia DocSearch (requires approval or Algolia account)      | MiniSearch (client-side, limited)                   |
| **Performance**           | Lighthouse 100/100 typical; zero JS shipped for pure docs pages                                  | React runtime (~40KB min) shipped on every page               | Vue runtime (~30KB min) shipped on every page       |
| **MDX support**           | Native with Astro MDX integration                                                                | Native                                                        | Markdown only (Vue components in markdown, not MDX) |
| **Code highlighting**     | Expressive Code (Shiki-based) with text markers, line highlighting, word wrap, diff highlighting | Prism (lighter) or Shiki                                      | Shiki                                               |
| **Versioning**            | Community plugin (`starlight-versions`) + URL-based strategy                                     | Built-in versioning (mature)                                  | No built-in versioning                              |
| **i18n**                  | Built-in with route-based localization                                                           | Built-in                                                      | Built-in                                            |
| **Enterprise adoption**   | Cloudflare, Google, Microsoft, Netlify, OpenAI, WPEngine                                         | Meta, Stripe, Algolia                                         | Vue ecosystem projects                              |
| **Maintenance burden**    | Depends only on Astro (same team builds Starlight)                                               | Depends on React + Docusaurus + Infima (different Meta teams) | Depends on Vue + VitePress                          |
| **Tailwind CSS**          | One-line CLI integration                                                                         | Complex integration (Infima conflicts)                        | Possible but not native                             |

### Decision: Starlight

**Rationale**: For a Web Component library built on Lit, the documentation framework must not impose its own framework opinions. Starlight's zero-framework-lock-in is decisive: documentation pages can embed Lit components natively without wrapper boilerplate. Docusaurus would force React onto every documentation page, and VitePress would force Vue. Both add unnecessary runtime weight and create a framework mismatch with the Lit component library.

Starlight's built-in Pagefind search eliminates the need for an Algolia account or external search service -- a meaningful simplification for enterprise environments with procurement constraints.

The Astro 5.x Content Layer API (stable since late 2024) provides typed content collections with Zod validation, which we use to auto-generate API reference pages from the Custom Elements Manifest JSON.

**Enterprise validation**: Starlight powers documentation for Cloudflare Workers, Google Firebase Extensions, Microsoft Playwright, Netlify, and OpenAI. These are not hobby projects -- they are enterprise-grade documentation sites serving millions of developers.

### Starlight Feature Inventory (2025-2026)

Features relevant to this project, drawn from Starlight 0.32 through 0.37:

| Feature                                         | Version | Relevance                                                          |
| ----------------------------------------------- | ------- | ------------------------------------------------------------------ |
| **Route data middleware**                       | 0.32    | Custom logic per page render (inject CEM data, compute navigation) |
| **Multisite Pagefind search**                   | 0.32    | Unified search across Starlight + Storybook                        |
| **Plugin i18n APIs**                            | 0.32    | Plugins can access Starlight's translation system                  |
| **Icons in asides**                             | 0.35    | Visual callouts for Drupal-specific warnings                       |
| **Sidebar link attributes**                     | 0.35    | Badge component status (stable/beta/deprecated) in nav             |
| **Slug processing customization**               | 0.35    | Map CEM module paths to documentation URLs                         |
| **Markdown processing in non-docs collections** | 0.37    | Process CEM descriptions as markdown in API pages                  |
| **CSS cascade layers**                          | 0.36    | Clean style precedence for custom components                       |
| **Automatic heading anchor links**              | 0.34    | Deep linking into API reference sections                           |

---

## 3. Two-System Documentation Strategy

### Responsibility Matrix

The fundamental question: what lives in Storybook vs. what lives in Starlight?

| Content Type                                                    | Storybook                     | Starlight                                 | Rationale                                                                   |
| --------------------------------------------------------------- | ----------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| **Interactive component demos**                                 | Primary                       | Embedded via iframe                       | Storybook's controls, actions, and viewport tooling are purpose-built       |
| **Component API tables** (attributes, events, slots, CSS props) | Autodocs (from CEM)           | Auto-generated reference pages (from CEM) | Both source from CEM; Storybook shows inline, Starlight shows comprehensive |
| **Visual regression testing**                                   | Primary (Chromatic)           | --                                        | Testing is a Storybook concern                                              |
| **Accessibility audit panel**                                   | Primary (addon-a11y)          | Accessibility guides (prose)              | Storybook runs axe; Starlight documents the standards                       |
| **Getting started guide**                                       | --                            | Primary                                   | Prose-heavy, multi-step, audience-specific                                  |
| **Architecture overview**                                       | --                            | Primary                                   | Diagrams, decision logs, system boundaries                                  |
| **Drupal integration guide**                                    | Component-level TWIG examples | Comprehensive integration tutorial        | Storybook shows per-component; Starlight shows end-to-end                   |
| **Design token documentation**                                  | Token addon (visual swatches) | Token architecture guide (prose + theory) | Storybook shows values; Starlight explains the system                       |
| **Theming guide**                                               | Theme switcher toolbar        | Step-by-step theming tutorial             | Storybook previews themes; Starlight teaches how to create them             |
| **Contributing guide**                                          | --                            | Primary                                   | Process documentation, code standards, PR workflow                          |
| **Changelog / Release notes**                                   | --                            | Primary (starlight-changelog plugin)      | Starlight integrates with Git tags and npm versions                         |
| **Migration guides**                                            | --                            | Primary                                   | Version-to-version upgrade instructions                                     |
| **FAQ**                                                         | --                            | Primary                                   | Common questions and troubleshooting                                        |

### Single Source of Truth Principle

Documentation content must not be duplicated across systems. Each piece of information has exactly one authoritative source:

| Information                                    | Source of Truth               | Consumed By                                              |
| ---------------------------------------------- | ----------------------------- | -------------------------------------------------------- |
| Component API (attributes, events, slots, CSS) | `custom-elements.json` (CEM)  | Storybook autodocs, Starlight API pages, IDE extensions  |
| Design token values                            | `tokens/*.tokens.json` (DTCG) | Storybook token addon, Starlight token pages, CSS output |
| Component usage guidelines                     | Storybook MDX stories         | Starlight embeds Storybook iframes                       |
| Integration patterns                           | Starlight markdown pages      | Referenced from Storybook via links                      |
| Architecture decisions                         | Starlight markdown pages      | Standalone                                               |

When Storybook and Starlight both need the same component demo, Starlight embeds the Storybook story via iframe rather than duplicating the demo code. When Starlight needs API data, it reads the CEM JSON directly rather than maintaining a parallel data source.

---

## 4. Documentation Site Information Architecture

### Audience-First Navigation

The documentation hub serves three distinct audiences with different goals, expertise levels, and entry points. The site navigation is organized by audience, not by content type.

```
docs.example.com/
|
+-- /                               # Landing page: audience selector
|
+-- /getting-started/               # Universal entry point
|   +-- /getting-started/overview/          # What is this library?
|   +-- /getting-started/installation/      # npm install, CDN, setup
|   +-- /getting-started/quick-start/       # First component in 5 minutes
|   +-- /getting-started/architecture/      # System architecture overview
|
+-- /guides/                        # Audience-segmented guides
|   +-- /guides/component-builders/         # For library contributors
|   |   +-- /creating-a-component/          # Step-by-step component creation
|   |   +-- /reactive-properties/           # Lit reactive property patterns
|   |   +-- /event-system/                  # Custom event architecture
|   |   +-- /slot-composition/              # Slot-based composition patterns
|   |   +-- /controllers/                   # Reactive controller patterns
|   |   +-- /styling-guide/                 # Shadow DOM CSS architecture
|   |   +-- /testing/                       # Vitest Browser Mode + Playwright
|   |   +-- /accessibility-checklist/       # Per-component a11y requirements
|   |   +-- /jsdoc-requirements/            # JSDoc coverage for CEM
|   |   +-- /storybook-stories/             # Writing stories with wc-toolkit
|   |
|   +-- /guides/drupal-teams/              # For Drupal integration teams
|   |   +-- /drupal-setup/                 # Library installation in Drupal
|   |   +-- /libraries-yml/                # Drupal libraries.yml configuration
|   |   +-- /twig-patterns/                # TWIG template examples
|   |   +-- /sdc-wrapping/                 # Single Directory Components strategy
|   |   +-- /event-handling/               # Drupal behaviors + WC events
|   |   +-- /token-overrides/              # Theme-level token customization
|   |   +-- /dark-mode/                    # Dark mode in Drupal context
|   |   +-- /troubleshooting/              # Common Drupal integration issues
|   |   +-- /drupal-field-mapping/         # Complete field-to-attribute mapping
|   |
|   +-- /guides/designers/                 # For design system consumers
|   |   +-- /design-principles/            # Visual language and philosophy
|   |   +-- /token-system/                 # 3-tier token architecture explained
|   |   +-- /color-system/                 # OKLCH palette, contrast, modes
|   |   +-- /typography/                   # Type scale, fluid type, fonts
|   |   +-- /spacing-layout/              # 4px grid, semantic spacing
|   |   +-- /theming-guide/               # Creating custom themes
|   |   +-- /figma-integration/           # Tokens Studio, Figma variables
|   |   +-- /accessibility-for-design/    # WCAG requirements for designers
|
+-- /components/                    # Component reference (auto-generated from CEM)
|   +-- /components/                        # Component index with search/filter
|   +-- /components/atoms/
|   |   +-- /components/atoms/button/       # Auto-generated API + manual prose
|   |   +-- /components/atoms/icon/
|   |   +-- /components/atoms/badge/
|   |   +-- /components/atoms/text-input/
|   |   +-- ...
|   +-- /components/molecules/
|   |   +-- /components/molecules/search-bar/
|   |   +-- /components/molecules/form-field/
|   |   +-- ...
|   +-- /components/organisms/
|   |   +-- /components/organisms/content-card/
|   |   +-- /components/organisms/hero-banner/
|   |   +-- ...
|   +-- /components/templates/
|       +-- /components/templates/page-layout/
|       +-- ...
|
+-- /tokens/                        # Design token reference
|   +-- /tokens/                            # Token index (all categories)
|   +-- /tokens/colors/                     # Color token reference
|   +-- /tokens/spacing/                    # Spacing token reference
|   +-- /tokens/typography/                 # Typography token reference
|   +-- /tokens/elevation/                  # Shadow/elevation tokens
|   +-- /tokens/borders/                    # Border + radius tokens
|
+-- /architecture/                  # Architecture Decision Records
|   +-- /architecture/overview/             # System architecture diagram
|   +-- /architecture/decisions/            # ADR index
|   +-- /architecture/decisions/001-lit-over-stencil/
|   +-- /architecture/decisions/002-vitest-over-wtr/
|   +-- /architecture/decisions/003-dtcg-token-format/
|   +-- /architecture/decisions/004-npm-workspaces-turborepo/
|   +-- ...
|
+-- /changelog/                     # Release notes (auto-generated from Git tags)
|   +-- /changelog/                         # All releases
|   +-- /changelog/v1.0.0/
|   +-- /changelog/v0.9.0/
|   +-- ...
|
+-- /contributing/                  # Contribution guide
    +-- /contributing/                      # How to contribute
    +-- /contributing/code-of-conduct/
    +-- /contributing/pull-request-guide/
    +-- /contributing/release-process/
```

### Per-Component Page Structure

Each component page in `/components/` combines auto-generated API data with hand-written prose:

```
/components/organisms/content-card/
|
+-- [Auto-generated from CEM]
|   +-- Tag name, class name, import path
|   +-- Attributes table (name, type, default, description)
|   +-- Properties table (name, type, default, description)
|   +-- Events table (name, detail type, description)
|   +-- Slots table (name, description)
|   +-- CSS Custom Properties table (name, default, description)
|   +-- CSS Parts table (name, description)
|
+-- [Embedded from Storybook]
|   +-- Default story iframe (interactive)
|   +-- Variant stories iframes
|
+-- [Hand-written prose]
|   +-- Usage guidelines (when to use / when not to use)
|   +-- Accessibility notes
|   +-- Drupal integration (TWIG template, field mapping table)
|   +-- Design rationale
|   +-- Related components (links)
```

---

## 5. Astro/Starlight Technical Architecture

### Directory Structure in the Monorepo

```
helix/
|
+-- packages/
|   +-- wc-library/                   # Component library (source of truth)
|       +-- custom-elements.json      # CEM (generated, committed)
|       +-- src/tokens/               # Token JSON files (DTCG)
|
+-- apps/
|   +-- storybook/                    # Storybook (design system playground)
|   +-- docs/                         # Astro/Starlight (documentation hub)
|       +-- package.json
|       +-- astro.config.mjs
|       +-- src/
|       |   +-- content/
|       |   |   +-- docs/             # Starlight docs collection (markdown/MDX)
|       |   |   |   +-- getting-started/
|       |   |   |   +-- guides/
|       |   |   |   |   +-- component-builders/
|       |   |   |   |   +-- drupal-teams/
|       |   |   |   |   +-- designers/
|       |   |   |   +-- architecture/
|       |   |   |   +-- contributing/
|       |   |   +-- components/       # Custom content collection (from CEM)
|       |   +-- components/           # Custom Astro components
|       |   |   +-- StorybookEmbed.astro
|       |   |   +-- ApiTable.astro
|       |   |   +-- TokenSwatch.astro
|       |   |   +-- TwigExample.astro
|       |   |   +-- ComponentPage.astro
|       |   |   +-- AudienceSelector.astro
|       |   +-- plugins/
|       |   |   +-- cem-loader.ts     # Content collection loader for CEM
|       |   |   +-- token-loader.ts   # Content collection loader for tokens
|       |   +-- styles/
|       |       +-- custom.css        # Site-specific overrides
|       +-- public/
|       |   +-- storybook/            # Storybook static build (for embeds)
|       +-- scripts/
|           +-- generate-component-pages.ts  # CEM -> markdown page generator
```

### Astro Configuration

```typescript
// apps/docs/astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import lit from '@astrojs/lit';

export default defineConfig({
  integrations: [
    // Lit integration for rendering WC library components natively in docs
    lit(),

    starlight({
      title: 'HELIX Design System',
      logo: {
        src: './src/assets/logo.svg',
        alt: 'HDS Logo',
      },

      // Social links
      social: {
        github: 'https://github.com/org/wc-library',
      },

      // Sidebar navigation (audience-segmented)
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Overview', slug: 'getting-started/overview' },
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Quick Start', slug: 'getting-started/quick-start' },
            { label: 'Architecture', slug: 'getting-started/architecture' },
          ],
        },
        {
          label: 'Component Builders',
          collapsed: true,
          items: [
            {
              label: 'Creating a Component',
              slug: 'guides/component-builders/creating-a-component',
            },
            { label: 'Reactive Properties', slug: 'guides/component-builders/reactive-properties' },
            { label: 'Event System', slug: 'guides/component-builders/event-system' },
            { label: 'Slot Composition', slug: 'guides/component-builders/slot-composition' },
            { label: 'Controllers', slug: 'guides/component-builders/controllers' },
            { label: 'Styling Guide', slug: 'guides/component-builders/styling-guide' },
            { label: 'Testing', slug: 'guides/component-builders/testing' },
            {
              label: 'Accessibility Checklist',
              slug: 'guides/component-builders/accessibility-checklist',
            },
            { label: 'JSDoc Requirements', slug: 'guides/component-builders/jsdoc-requirements' },
            { label: 'Storybook Stories', slug: 'guides/component-builders/storybook-stories' },
          ],
        },
        {
          label: 'Drupal Teams',
          collapsed: true,
          items: [
            { label: 'Setup', slug: 'guides/drupal-teams/drupal-setup' },
            { label: 'Libraries.yml', slug: 'guides/drupal-teams/libraries-yml' },
            { label: 'TWIG Patterns', slug: 'guides/drupal-teams/twig-patterns' },
            { label: 'SDC Wrapping', slug: 'guides/drupal-teams/sdc-wrapping' },
            { label: 'Event Handling', slug: 'guides/drupal-teams/event-handling' },
            { label: 'Token Overrides', slug: 'guides/drupal-teams/token-overrides' },
            { label: 'Dark Mode', slug: 'guides/drupal-teams/dark-mode' },
            { label: 'Field Mapping', slug: 'guides/drupal-teams/drupal-field-mapping' },
            { label: 'Troubleshooting', slug: 'guides/drupal-teams/troubleshooting' },
          ],
        },
        {
          label: 'Designers',
          collapsed: true,
          items: [
            { label: 'Design Principles', slug: 'guides/designers/design-principles' },
            { label: 'Token System', slug: 'guides/designers/token-system' },
            { label: 'Color System', slug: 'guides/designers/color-system' },
            { label: 'Typography', slug: 'guides/designers/typography' },
            { label: 'Spacing & Layout', slug: 'guides/designers/spacing-layout' },
            { label: 'Theming Guide', slug: 'guides/designers/theming-guide' },
            { label: 'Figma Integration', slug: 'guides/designers/figma-integration' },
            { label: 'Accessibility', slug: 'guides/designers/accessibility-for-design' },
          ],
        },
        {
          label: 'Components',
          collapsed: true,
          autogenerate: { directory: 'components' },
          badge: { text: 'API', variant: 'note' },
        },
        {
          label: 'Design Tokens',
          collapsed: true,
          autogenerate: { directory: 'tokens' },
        },
        {
          label: 'Architecture',
          collapsed: true,
          autogenerate: { directory: 'architecture' },
        },
        {
          label: 'Changelog',
          collapsed: true,
          autogenerate: { directory: 'changelog' },
        },
        {
          label: 'Contributing',
          collapsed: true,
          autogenerate: { directory: 'contributing' },
        },
      ],

      // Enable built-in Pagefind search
      pagefind: {
        // Merge Storybook search index for cross-site search
        mergeIndex: [
          {
            bundlePath: '/storybook/_pagefind',
            mergeFilter: { site: 'storybook' },
          },
        ],
      },

      // Custom CSS for documentation-specific styling
      customCss: ['./src/styles/custom.css'],

      // Head tags for font loading
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'preload',
            href: '/fonts/inter-variable.woff2',
            as: 'font',
            type: 'font/woff2',
            crossorigin: '',
          },
        },
      ],

      // Components overrides for custom page layouts
      components: {
        // Override the page layout for component reference pages
        // to inject CEM-derived API tables
      },
    }),
  ],
});
```

### Content Collections Configuration

Astro 5.x content collections with the Content Layer API enable typed, validated content from multiple sources -- including the CEM JSON.

```typescript
// apps/docs/src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { cemLoader } from './plugins/cem-loader';
import { tokenLoader } from './plugins/token-loader';

// Standard Starlight docs collection (markdown/MDX files)
const docs = defineCollection({
  schema: docsSchema(),
});

// Component API collection (loaded from custom-elements.json)
const components = defineCollection({
  loader: cemLoader({
    manifestPath: '../../packages/hx-library/custom-elements.json',
  }),
  schema: z.object({
    tagName: z.string(),
    className: z.string(),
    description: z.string(),
    modulePath: z.string(),
    category: z.enum(['atoms', 'molecules', 'organisms', 'templates']),
    attributes: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        default: z.string().optional(),
        description: z.string(),
      }),
    ),
    properties: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        default: z.string().optional(),
        description: z.string(),
        attribute: z.string().optional(),
      }),
    ),
    events: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        description: z.string(),
      }),
    ),
    slots: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    ),
    cssProperties: z.array(
      z.object({
        name: z.string(),
        default: z.string().optional(),
        description: z.string(),
      }),
    ),
    cssParts: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    ),
  }),
});

// Design token collection (loaded from DTCG JSON files)
const tokens = defineCollection({
  loader: tokenLoader({
    tokenPaths: [
      '../../packages/hx-library/src/tokens/semantic.tokens.json',
      '../../packages/hx-library/src/tokens/component.tokens.json',
    ],
  }),
  schema: z.object({
    path: z.string(),
    value: z.string(),
    type: z.string(),
    description: z.string().optional(),
    tier: z.enum(['primitive', 'semantic', 'component']),
    cssVariable: z.string(),
  }),
});

export const collections = { docs, components, tokens };
```

---

## 6. CEM-Powered API Documentation Generation

### The Pipeline

The Custom Elements Manifest is the single source of truth for component APIs. Rather than hand-maintaining API documentation in Starlight, we build a pipeline that reads the CEM and generates structured content.

```
Source Code (.ts)     CEM Analyzer     custom-elements.json     Astro Content Loader
  with JSDoc    --->  (cem analyze  -->  (committed to repo)  -->  (cemLoader)
  annotations          --litelement)                                    |
                                                           +-----------+-----------+
                                                           |           |           |
                                                       Storybook   Starlight    IDE
                                                       (autodocs)  (API pages)  (IntelliSense)
```

### CEM Content Loader

The custom Astro content loader parses `custom-elements.json` and exposes each component declaration as a content collection entry:

```typescript
// apps/docs/src/plugins/cem-loader.ts
import type { Loader } from 'astro/loaders';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface CemLoaderOptions {
  manifestPath: string;
}

/**
 * Astro Content Layer loader that reads the Custom Elements Manifest
 * and exposes each component declaration as a content collection entry.
 *
 * Each entry corresponds to one custom element (one tag name) and includes
 * all its attributes, properties, events, slots, CSS properties, and CSS parts.
 */
export function cemLoader(options: CemLoaderOptions): Loader {
  return {
    name: 'cem-loader',
    async load({ store, logger }) {
      const absolutePath = resolve(options.manifestPath);
      const manifestJson = readFileSync(absolutePath, 'utf-8');
      const manifest = JSON.parse(manifestJson);

      for (const module of manifest.modules ?? []) {
        for (const declaration of module.declarations ?? []) {
          if (declaration.kind !== 'class' || !declaration.tagName) continue;

          // Derive category from file path
          // e.g., src/components/atoms/wc-button/wc-button.ts -> atoms
          const pathSegments = module.path.split('/');
          const categoryIndex = pathSegments.indexOf('components') + 1;
          const category = pathSegments[categoryIndex] ?? 'organisms';

          const entry = {
            tagName: declaration.tagName,
            className: declaration.name,
            description: declaration.description ?? '',
            modulePath: module.path,
            category,
            attributes: (declaration.attributes ?? []).map((attr: Record<string, unknown>) => ({
              name: attr.name,
              type: (attr.type as Record<string, string>)?.text ?? 'unknown',
              default: attr.default,
              description: attr.description ?? '',
            })),
            properties: (declaration.members ?? [])
              .filter((m: Record<string, unknown>) => m.kind === 'field' && m.privacy !== 'private')
              .map((prop: Record<string, unknown>) => ({
                name: prop.name,
                type: (prop.type as Record<string, string>)?.text ?? 'unknown',
                default: prop.default,
                description: prop.description ?? '',
                attribute: prop.attribute,
              })),
            events: (declaration.events ?? []).map((evt: Record<string, unknown>) => ({
              name: evt.name,
              type: (evt.type as Record<string, string>)?.text ?? 'CustomEvent',
              description: evt.description ?? '',
            })),
            slots: (declaration.slots ?? []).map((slot: Record<string, unknown>) => ({
              name: slot.name ?? '(default)',
              description: slot.description ?? '',
            })),
            cssProperties: (declaration.cssProperties ?? []).map(
              (prop: Record<string, unknown>) => ({
                name: prop.name,
                default: prop.default,
                description: prop.description ?? '',
              }),
            ),
            cssParts: (declaration.cssParts ?? []).map((part: Record<string, unknown>) => ({
              name: part.name,
              description: part.description ?? '',
            })),
          };

          store.set({
            id: declaration.tagName,
            data: entry,
          });

          logger.info(`Loaded component: ${declaration.tagName}`);
        }
      }
    },
  };
}
```

### Auto-Generated Component Pages

A build script reads the content collection and generates markdown pages for each component. These pages combine the auto-generated API tables with placeholders for hand-written prose.

```typescript
// apps/docs/scripts/generate-component-pages.ts
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const manifestPath = resolve('../../packages/hx-library/custom-elements.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const outputDir = resolve('src/content/docs/components');

for (const module of manifest.modules ?? []) {
  for (const declaration of module.declarations ?? []) {
    if (declaration.kind !== 'class' || !declaration.tagName) continue;

    const tagName = declaration.tagName;
    const pathSegments = module.path.split('/');
    const categoryIndex = pathSegments.indexOf('components') + 1;
    const category = pathSegments[categoryIndex] ?? 'organisms';

    const categoryDir = join(outputDir, category);
    mkdirSync(categoryDir, { recursive: true });

    // Human-friendly component name: hx-content-card -> Content Card
    const displayName = tagName
      .replace(/^hx-/, '')
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const content = generateComponentPage(declaration, displayName, tagName, category);
    writeFileSync(join(categoryDir, `${tagName.replace('hx-', '')}.mdx`), content);
  }
}

function generateComponentPage(
  declaration: Record<string, unknown>,
  displayName: string,
  tagName: string,
  category: string,
): string {
  return `---
title: "${displayName}"
description: "${(declaration.description as string) ?? ''}"
sidebar:
  badge:
    text: "${category}"
    variant: "note"
---

import { Tabs, TabItem, Aside, Code } from '@astrojs/starlight/components';
import StorybookEmbed from '../../../components/StorybookEmbed.astro';
import ApiTable from '../../../components/ApiTable.astro';

# ${displayName}

\`<${tagName}>\`

${(declaration.description as string) ?? ''}

## Interactive Demo

<StorybookEmbed
  story="${category}-${displayName.toLowerCase().replace(/ /g, '-')}--default"
  height="400"
/>

## API Reference

<Tabs>
  <TabItem label="Attributes">
    <ApiTable type="attributes" component="${tagName}" />
  </TabItem>
  <TabItem label="Events">
    <ApiTable type="events" component="${tagName}" />
  </TabItem>
  <TabItem label="Slots">
    <ApiTable type="slots" component="${tagName}" />
  </TabItem>
  <TabItem label="CSS Properties">
    <ApiTable type="cssProperties" component="${tagName}" />
  </TabItem>
  <TabItem label="CSS Parts">
    <ApiTable type="cssParts" component="${tagName}" />
  </TabItem>
</Tabs>

## Usage

{/* Hand-written usage guidelines go here */}

### When to Use

{/* Describe when this component is the right choice */}

### When NOT to Use

{/* Describe alternatives for cases where this component is wrong */}

## Drupal Integration

{/* TWIG template examples and field mapping */}

## Accessibility

{/* Component-specific accessibility notes */}

## Related Components

{/* Links to related components */}
`;
}
```

### ApiTable Component

The `ApiTable.astro` component queries the content collection and renders the appropriate table:

```astro
---
// apps/docs/src/components/ApiTable.astro
import { getEntry } from 'astro:content';

interface Props {
  type: 'attributes' | 'events' | 'slots' | 'cssProperties' | 'cssParts';
  component: string;
}

const { type, component } = Astro.props;
const entry = await getEntry('components', component);

if (!entry) {
  return <p>Component data not found for {component}</p>;
}

const data = entry.data;
---

{type === 'attributes' && data.attributes.length > 0 && (
  <table>
    <thead>
      <tr>
        <th>Attribute</th>
        <th>Type</th>
        <th>Default</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {data.attributes.map((attr) => (
        <tr>
          <td><code>{attr.name}</code></td>
          <td><code>{attr.type}</code></td>
          <td>{attr.default ? <code>{attr.default}</code> : '---'}</td>
          <td>{attr.description}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}

{type === 'events' && data.events.length > 0 && (
  <table>
    <thead>
      <tr>
        <th>Event</th>
        <th>Detail Type</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {data.events.map((evt) => (
        <tr>
          <td><code>{evt.name}</code></td>
          <td><code>{evt.type}</code></td>
          <td>{evt.description}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}

{type === 'slots' && data.slots.length > 0 && (
  <table>
    <thead>
      <tr>
        <th>Slot</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {data.slots.map((slot) => (
        <tr>
          <td><code>{slot.name}</code></td>
          <td>{slot.description}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}

{type === 'cssProperties' && data.cssProperties.length > 0 && (
  <table>
    <thead>
      <tr>
        <th>Property</th>
        <th>Default</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {data.cssProperties.map((prop) => (
        <tr>
          <td><code>{prop.name}</code></td>
          <td>{prop.default ? <code>{prop.default}</code> : '---'}</td>
          <td>{prop.description}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}

{type === 'cssParts' && data.cssParts.length > 0 && (
  <table>
    <thead>
      <tr>
        <th>Part</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {data.cssParts.map((part) => (
        <tr>
          <td><code>{part.name}</code></td>
          <td>{part.description}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}
```

### Keeping Docs and Code in Sync

The CEM-to-docs pipeline is fully automated. When a developer updates a component's JSDoc, the CEM regenerates, and the next documentation build picks up the changes:

```
Developer edits hx-button.ts JSDoc
        |
        v
CI runs `cem analyze --litelement`
        |
        v
custom-elements.json updated (committed)
        |
        v
Docs build reads CEM via cemLoader
        |
        v
API tables reflect current source code
```

There is no manual step where someone must remember to update documentation. The only manual documentation is the prose content (usage guidelines, Drupal integration examples, accessibility notes), which lives in the MDX files and is reviewed in pull requests.

---

## 7. Storybook Integration & Cross-Linking

### Storybook Embed Component

Starlight pages embed Storybook stories via iframe for interactive component previews within prose documentation. This avoids duplicating demo code.

```astro
---
// apps/docs/src/components/StorybookEmbed.astro
interface Props {
  /** Storybook story ID (e.g., "organisms-content-card--default") */
  story: string;
  /** iframe height in pixels */
  height?: number;
  /** Show the Storybook toolbar */
  toolbar?: boolean;
}

const { story, height = 400, toolbar = false } = Astro.props;

// In development, use the local Storybook dev server
// In production, use the co-deployed static Storybook build
const baseUrl = import.meta.env.DEV
  ? 'http://localhost:6006'
  : '/storybook';

const viewMode = toolbar ? 'story' : 'story';
const panel = toolbar ? '' : '&panel=false';
const nav = '&nav=false';

const iframeUrl = `${baseUrl}/iframe.html?id=${story}&viewMode=${viewMode}${panel}${nav}`;
---

<div class="storybook-embed">
  <iframe
    src={iframeUrl}
    title={`Component demo: ${story}`}
    width="100%"
    height={height}
    loading="lazy"
    style="border: 1px solid var(--sl-color-gray-5); border-radius: 8px;"
    allow="clipboard-write"
  ></iframe>
  <p class="storybook-embed__link">
    <a href={`${baseUrl}/?path=/story/${story}`} target="_blank" rel="noopener">
      Open in Storybook &rarr;
    </a>
  </p>
</div>

<style>
  .storybook-embed {
    margin: 1.5rem 0;
  }

  .storybook-embed iframe {
    display: block;
  }

  .storybook-embed__link {
    font-size: var(--sl-text-sm);
    margin-top: 0.5rem;
    text-align: right;
  }
</style>
```

### Cross-Linking Strategy

Navigation between the two systems uses consistent, predictable URL patterns:

| From                        | To                          | Link Pattern                                                                             |
| --------------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| Starlight component page    | Storybook story             | `[Open in Storybook](/storybook/?path=/story/{story-id})`                                |
| Storybook story description | Starlight integration guide | `[Drupal Integration Guide](https://docs.example.com/guides/drupal-teams/twig-patterns)` |
| Storybook component docs    | Starlight component page    | `[Full documentation](https://docs.example.com/components/{category}/{name})`            |
| Starlight getting started   | Storybook playground        | `[Interactive Playground](/storybook/?path=/docs/getting-started--docs)`                 |

Links from Starlight to Storybook use relative paths (both are co-deployed under the same domain). Links from Storybook to Starlight use absolute URLs (Storybook has its own `<base>` tag behavior).

### Co-Deployment Architecture

Both systems are deployed as static sites under the same domain:

```
https://docs.example.com/              # Starlight (documentation hub)
https://docs.example.com/storybook/    # Storybook (design system playground)
```

This is achieved by building Storybook's static output into Starlight's `public/storybook/` directory during the CI build:

```bash
# Build pipeline
npx turbo build --filter=storybook                # Builds static Storybook
cp -r apps/storybook/storybook-static apps/docs/public/storybook  # Copy to docs
npx turbo build --filter=docs                     # Builds Starlight (includes Storybook)
```

Co-deployment under the same domain provides:

1. **Unified CORS context**: Storybook iframes in Starlight pages work without cross-origin restrictions
2. **Shared authentication**: If docs require authentication, one session covers both
3. **Unified search**: Pagefind can index both sites with `mergeIndex`
4. **Single deployment artifact**: One CI pipeline produces one deployable output

---

## 8. Search Architecture

### Pagefind: Built-In, Static, Zero-Config

Starlight ships with Pagefind as its default search engine. Pagefind is a static search library that indexes the built HTML at build time and produces a client-side search index that runs entirely in the browser. No external service, no Algolia account, no API keys.

**Key characteristics:**

- **Index size**: Typically 30-50KB for a 500-page documentation site (compressed, transferred on first search)
- **Zero runtime dependency**: No JavaScript framework required; vanilla JS with a Web Component interface
- **Multilingual**: Supports stemming and segmentation for multiple languages
- **Filtering**: Content can be tagged with `data-pagefind-filter` attributes for faceted search
- **Weighting**: Headings are automatically weighted higher than body text
- **Exclusion**: Elements with `data-pagefind-ignore` are excluded from the index

### Cross-Site Search with `mergeIndex`

The critical feature for our two-system architecture: Pagefind supports merging search indexes from multiple independent sites. We index Storybook separately and merge its index into Starlight's search.

**Step 1: Index Storybook with Pagefind**

After building Storybook's static site, run Pagefind against it:

```bash
# Build Storybook
npx turbo build --filter=storybook

# Index the Storybook build output
npx pagefind \
  --site apps/storybook/storybook-static \
  --output-path apps/storybook/storybook-static/_pagefind

# Copy to docs public directory
cp -r apps/storybook/storybook-static apps/docs/public/storybook
```

**Step 2: Configure Starlight to merge the Storybook index**

In the Astro config (shown in Section 5), the `pagefind.mergeIndex` option points to the Storybook Pagefind bundle. When a user searches in the docs site, results from both the documentation and Storybook stories appear in a unified interface.

**Step 3: Differentiate results with filters**

```typescript
// In Starlight's Pagefind configuration
pagefind: {
  mergeIndex: [
    {
      bundlePath: '/storybook/_pagefind',
      mergeFilter: {
        site: 'storybook',
      },
    },
  ],
},
```

Search results display a badge indicating whether the result is from "Docs" or "Storybook", so users can orient themselves.

### Search Experience

| User Action                | Result                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Types "card" in search bar | Shows: Content Card (API reference), Content Card stories (Storybook), Card Grid component, "Using Cards in Drupal" guide |
| Types "dark mode"          | Shows: Dark Mode architecture guide, Theming guide, Dark mode Storybook stories                                           |
| Types "TWIG"               | Shows: TWIG Patterns guide, per-component Drupal integration sections, SDC Wrapping guide                                 |

### Alternative: Algolia DocSearch

For organizations with an existing Algolia account or that prefer hosted search, Starlight supports the official `@astrojs/starlight-docsearch` plugin. The configuration replaces Pagefind:

```javascript
// astro.config.mjs
import starlightDocSearch from '@astrojs/starlight-docsearch';

starlight({
  plugins: [
    starlightDocSearch({
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'hds-docs',
    }),
  ],
}),
```

However, Pagefind is recommended as the default because it has zero external dependencies and zero ongoing cost.

---

## 9. Content Authoring Workflow

### MDX Support in Starlight

Starlight supports both standard Markdown and MDX. MDX is used for documentation pages that require interactive components (Storybook embeds, API tables, token swatches).

```mdx
---
title: 'TWIG Patterns'
description: 'How to use HELIX Design System components in Drupal TWIG templates'
---

import { Aside, Tabs, TabItem, Code } from '@astrojs/starlight/components';
import StorybookEmbed from '../../../../components/StorybookEmbed.astro';
import TwigExample from '../../../../components/TwigExample.astro';

# TWIG Patterns

This guide shows how to map Drupal content fields to Web Component attributes
in your TWIG templates.

<Aside type="tip" title="Prerequisites">
  Before starting, ensure you have completed the [Drupal Setup](/guides/drupal-teams/drupal-setup/)
  guide and attached the `helix` Drupal library to your theme.
</Aside>

## Content Card

The `<hx-content-card>` component maps directly to Drupal's article node
teaser view mode.

### Interactive Demo

<StorybookEmbed story="organisms-content-card--default" height="350" />

### TWIG Template

<TwigExample file="node--article--teaser.html.twig">
  {`<hx-content-card
  heading="{{ label[0]['#title'] | default(node.label) }}"
  summary="{{ content.field_summary|render|striptags|trim }}"
  category="{{ node.field_category.entity.label }}"
  href="{{ url }}"
  publish-date="{{ node.createdtime|date('c') }}"
  variant="{{ is_promoted ? 'featured' : 'default' }}"
>
  {% if content.field_media|render|trim is not empty %}
    <div slot="media">
      {{ content.field_media }}
    </div>
  {% endif %}
</hx-content-card>`}
</TwigExample>

### Field Mapping

| WC Attribute | Drupal Field   | TWIG Expression                                        |
| ------------ | -------------- | ------------------------------------------------------ |
| `heading`    | Node title     | `{{ label[0]['#title'] }}`                             |
| `summary`    | field_summary  | `{{ content.field_summary\|render\|striptags\|trim }}` |
| `category`   | field_category | `{{ node.field_category.entity.label }}`               |

<Aside type="caution" title="String Escaping">
  Always use Drupal's `|escape` filter or Twig auto-escaping when passing user-generated content to
  component attributes. Web Components do not sanitize attribute values.
</Aside>
```

### Code Highlighting with Expressive Code

Starlight uses Expressive Code (Shiki-based) for code blocks. It provides features beyond basic syntax highlighting:

**Line highlighting:**

````markdown
```typescript {3-5}
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-button') // highlighted
export class HxButton extends LitElement {
  // highlighted
  @property({ type: String }) variant = 'primary'; // highlighted
}
```
````

**Diff marking (inserted/deleted):**

````markdown
```typescript ins={4} del={3}
// Before: hardcoded color
button {
  background: #2563eb;
  background: var(--hds-button-primary-bg, #2563eb);
}
```
````

**File name and language tabs:**

````markdown
```typescript title="hx-button.ts"
@customElement('hx-button')
export class HxButton extends LitElement {}
```
````

### TWIG Syntax Highlighting

TWIG is supported in Shiki's language grammar registry (used by Expressive Code). The `twig` language identifier provides full syntax highlighting for Drupal template examples:

````markdown
```twig title="node--article--teaser.html.twig"
{# Content Card Integration #}
<hx-content-card
  heading="{{ label[0]['#title'] | default(node.label) }}"
  variant="{{ is_promoted ? 'featured' : 'default' }}"
>
  {% if content.field_media|render|trim is not empty %}
    <div slot="media">
      {{ content.field_media }}
    </div>
  {% endif %}
</hx-content-card>
```
````

### Custom TwigExample Component

For Drupal-specific code examples, a custom Astro component adds contextual callouts:

```astro
---
// apps/docs/src/components/TwigExample.astro
interface Props {
  /** TWIG template filename for context */
  file?: string;
}

const { file } = Astro.props;
---

<div class="twig-example">
  {file && (
    <div class="twig-example__header">
      <span class="twig-example__icon" aria-hidden="true">
        {/* Drupal drop icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C5.6 3.2 2 6.4 2 10a6 6 0 0 0 12 0C14 6.4 10.4 3.2 8 0z"/>
        </svg>
      </span>
      <code>{file}</code>
    </div>
  )}
  <slot />
</div>

<style>
  .twig-example {
    margin: 1rem 0;
    border: 1px solid var(--sl-color-gray-5);
    border-radius: 8px;
    overflow: hidden;
  }

  .twig-example__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--sl-color-gray-6);
    font-size: var(--sl-text-sm);
    color: var(--sl-color-gray-2);
    border-bottom: 1px solid var(--sl-color-gray-5);
  }

  .twig-example__icon {
    color: var(--sl-color-blue);
  }
</style>
```

### Drupal-Specific Callouts

Starlight's `<Aside>` component supports custom types. We use consistent callout patterns for Drupal-specific guidance:

```mdx
<Aside type="tip" title="Drupal 11+">
  This pattern requires Drupal 11 or Drupal 10.3+ with the Single Directory Components (SDC) module
  enabled.
</Aside>

<Aside type="caution" title="Drupal Cache">
  When using dynamic Web Component attributes in TWIG, ensure the render array includes appropriate
  cache contexts. Without them, Drupal's page cache will serve stale component attributes.
</Aside>

<Aside type="danger" title="Security">
  Never pass unsanitized user input directly to Web Component attributes. Use Drupal's `|escape`
  filter or Twig auto-escaping to prevent XSS.
</Aside>
```

---

## 10. Versioned Documentation Strategy

### Current State of Starlight Versioning

As of early 2026, Starlight does not have built-in versioning support. The core team has acknowledged this as a desired feature (GitHub Discussion #957), but it is not yet implemented natively. Several community solutions exist:

1. **`starlight-versions` plugin** -- A community plugin that provides a `docsVersionsLoader` for managing multiple documentation versions within a single Starlight instance
2. **Branch-based versioning with Vercel** -- Deploy version branches as separate Vercel projects under subpaths
3. **URL-based versioning with sidebar customization** -- Single docs directory with version-prefixed content and conditional sidebar configuration

### Recommended Strategy: URL-Based with Build-Time Generation

For an enterprise Web Component library, we recommend a URL-based versioning strategy that mirrors how npm publishes are tagged:

```
docs.example.com/                      # Latest (always points to current stable)
docs.example.com/v/1.0/                # Version 1.0.x documentation
docs.example.com/v/1.1/                # Version 1.1.x documentation
docs.example.com/v/2.0/                # Version 2.0.x documentation (next major)
```

**Implementation approach:**

1. Documentation content lives on the `main` branch and tracks the `latest` npm tag
2. When a major version is released, the current docs are snapshotted into a version branch (`docs-v1.0`)
3. The CI pipeline builds the current branch as the root site and each version branch under its `/v/X.Y/` prefix
4. A version selector dropdown in the site header navigates between versions

```typescript
// astro.config.mjs -- version branch build
const version = process.env.DOCS_VERSION; // e.g., "1.0"

export default defineConfig({
  base: version ? `/v/${version}/` : '/',
  outDir: version ? `dist/v/${version}` : 'dist',
  integrations: [
    starlight({
      title: `HDS Docs${version ? ` (v${version})` : ''}`,
      // ... rest of config
    }),
  ],
});
```

### Version Selector Component

```astro
---
// apps/docs/src/components/VersionSelector.astro
const versions = [
  { label: 'Latest (v1.1)', href: '/', current: !import.meta.env.DOCS_VERSION },
  { label: 'v1.0', href: '/v/1.0/', current: import.meta.env.DOCS_VERSION === '1.0' },
];
---

<nav class="version-selector" aria-label="Documentation version">
  <label for="version-select" class="sr-only">Select version</label>
  <select
    id="version-select"
    onchange="window.location.href = this.value"
  >
    {versions.map((v) => (
      <option value={v.href} selected={v.current}>
        {v.label}
      </option>
    ))}
  </select>
</nav>
```

### What Gets Versioned

| Content                                     | Versioned?       | Rationale                                    |
| ------------------------------------------- | ---------------- | -------------------------------------------- |
| Component API reference                     | Yes              | API changes per library version              |
| Guides (component building, Drupal, design) | Yes              | Patterns may change between versions         |
| Architecture decisions                      | No (latest only) | ADRs are chronological, not version-specific |
| Changelog                                   | No (latest only) | The changelog covers all versions            |
| Contributing guide                          | No (latest only) | Process applies to current development       |

---

## 11. Build & Deployment Pipeline

### Build Sequence

The documentation build depends on artifacts from the library build:

```
[1. Build Library]
    npx turbo build --filter=@org/wc-library
    |
    +-- dist/          (compiled JS, CSS, type declarations)
    +-- custom-elements.json   (CEM, regenerated)
    |
[2. Build Storybook]
    npx turbo build --filter=storybook
    |
    +-- storybook-static/      (deployable Storybook site)
    |
[3. Index Storybook for Search]
    npx pagefind --site apps/storybook/storybook-static
    |
    +-- storybook-static/_pagefind/   (Pagefind index for merge)
    |
[4. Copy Storybook to Docs Public]
    cp -r apps/storybook/storybook-static apps/docs/public/storybook
    |
[5. Generate Component Pages from CEM]
    node apps/docs/scripts/generate-component-pages.ts
    |
    +-- apps/docs/src/content/docs/components/   (generated MDX)
    |
[6. Build Documentation]
    npx turbo build --filter=docs
    |
    +-- apps/docs/dist/   (deployable documentation site)
        +-- storybook/    (included from public/)
        +-- _pagefind/    (Starlight's index + merged Storybook index)
```

### CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/docs.yml
name: Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
    paths:
      - 'packages/hx-library/**'
      - 'apps/storybook/**'
      - 'apps/docs/**'

jobs:
  build-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      # 1. Build library (produces CEM + dist)
      - run: npx turbo build --filter=@org/wc-library
      - run: npx turbo cem --filter=@org/wc-library

      # 2. Build Storybook
      - run: npx turbo build --filter=storybook

      # 3. Index Storybook for cross-site search
      - run: npx pagefind --site apps/storybook/storybook-static

      # 4. Copy Storybook into docs public
      - run: cp -r apps/storybook/storybook-static apps/docs/public/storybook

      # 5. Generate component pages from CEM
      - run: node apps/docs/scripts/generate-component-pages.ts

      # 6. Build documentation
      - run: npx turbo build --filter=docs

      # 7. Deploy (production only)
      - if: github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v3
        with:
          command: pages deploy apps/docs/dist --project-name=hds-docs

  # Preview deployments for PRs
  preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    needs: build-docs
    steps:
      - uses: cloudflare/wrangler-action@v3
        with:
          command: pages deploy apps/docs/dist --project-name=hds-docs --branch=${{ github.head_ref }}
```

### Hosting Strategy

| Option               | Pros                                                                | Cons                                          | Recommendation             |
| -------------------- | ------------------------------------------------------------------- | --------------------------------------------- | -------------------------- |
| **Cloudflare Pages** | Free for open-source, global CDN, preview deployments, Wrangler CLI | 500 builds/month on free tier                 | Recommended for enterprise |
| **Vercel**           | Excellent Astro support, preview deployments, analytics             | Usage limits on free tier, commercial pricing | Good alternative           |
| **Netlify**          | Good Astro support, preview deployments, forms                      | Build minutes limited on free tier            | Viable                     |
| **GitHub Pages**     | Free, integrated with repo                                          | No preview deployments, single branch         | Not recommended            |

**Recommendation: Cloudflare Pages**. Cloudflare Pages provides unlimited bandwidth, a global CDN, and preview deployments for every pull request. The Wrangler CLI integrates cleanly into GitHub Actions. For an enterprise environment where the documentation site may receive significant traffic, Cloudflare's infrastructure is appropriate.

### Preview Deployments

Every pull request that modifies library source, Storybook stories, or documentation content triggers a preview deployment. The preview URL is posted as a PR comment, enabling:

- **Design review**: Stakeholders can review documentation changes before merge
- **Visual verification**: Component API tables reflect the PR's code changes
- **Cross-team collaboration**: Drupal teams can review integration guide updates before they go live

---

## 12. Monorepo Integration

### Package Configuration

```json
// apps/docs/package.json
{
  "name": "docs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "generate:components": "node scripts/generate-component-pages.ts",
    "prebuild": "npm run generate:components"
  },
  "dependencies": {
    "astro": "^5.3.0",
    "@astrojs/starlight": "^0.37.0",
    "@astrojs/lit": "^5.0.0"
  },
  "devDependencies": {
    "@org/wc-library": "*"
  }
}
```

### npm Workspace Configuration

The docs app is part of the existing monorepo workspace, configured via the root `package.json` workspaces field:

```json
// root package.json
{
  "workspaces": ["packages/*", "apps/*"]
}
```

npm workspaces automatically resolve `workspace:*` dependencies between packages. Turborepo (`turbo` v2.3.3) handles task orchestration, dependency-aware build ordering, and caching on top of the npm workspace structure.

### Root Script Updates

Turborepo orchestrates all cross-package tasks via `turbo.json`. The root `package.json` scripts delegate to `turbo`:

```json
// root package.json (updated scripts section)
{
  "scripts": {
    "dev": "turbo dev",
    "dev:docs": "turbo dev --filter=docs",
    "build": "turbo build",
    "build:docs": "turbo build --filter=docs",
    "build:tokens": "node tools/tokens/build-tokens.mjs",
    "type-check": "turbo type-check",
    "lint": "turbo lint",
    "clean": "turbo clean",
    "test": "turbo test",
    "format": "prettier --write .",
    "storybook": "turbo dev --filter=storybook",
    "storybook:build": "turbo build --filter=storybook",
    "docs": "turbo dev --filter=docs",
    "docs:build": "turbo build",
    "docs:preview": "turbo preview --filter=docs"
  }
}
```

### Dependency Graph

```
@org/wc-library  (no external deps except Lit)
       |
       +-- apps/storybook   (depends on @org/wc-library via workspace:*)
       |
       +-- apps/docs         (depends on @org/wc-library via workspace:*)
                              (reads custom-elements.json at build time)
                              (embeds storybook static build at build time)
```

The docs app has a **build-time dependency** on both the library and Storybook, but no runtime dependency. The final docs output is entirely static HTML, CSS, and JavaScript.

---

## 13. Implementation Roadmap

### Phase 1: Foundation (Week 1)

| Task                                                              | Deliverable                        |
| ----------------------------------------------------------------- | ---------------------------------- |
| Initialize Astro/Starlight in `apps/docs/`                        | Working local dev server           |
| Configure sidebar navigation (audience-segmented)                 | All sections visible in navigation |
| Set up custom CSS (match library branding)                        | Consistent visual identity         |
| Create `StorybookEmbed.astro` component                           | Iframe-based Storybook embedding   |
| Write Getting Started pages (overview, installation, quick start) | First usable content               |

### Phase 2: CEM Integration (Week 2)

| Task                                        | Deliverable                             |
| ------------------------------------------- | --------------------------------------- |
| Build `cemLoader` content collection loader | CEM data available in Astro             |
| Build `ApiTable.astro` component            | Automated API reference tables          |
| Create `generate-component-pages.ts` script | Component MDX pages generated from CEM  |
| Verify API tables match Storybook autodocs  | Consistency validated                   |
| Build `TwigExample.astro` component         | TWIG code examples with Drupal branding |

### Phase 3: Content Authoring (Weeks 3-4)

| Task                                                                   | Deliverable                          |
| ---------------------------------------------------------------------- | ------------------------------------ |
| Write Component Builders guide (all 10 pages)                          | Complete contributor documentation   |
| Write Drupal Teams guide (all 9 pages)                                 | Complete integration documentation   |
| Write Designers guide (all 8 pages)                                    | Complete design system documentation |
| Write Architecture section (overview + initial ADRs)                   | Architecture documentation           |
| Create Contributing guide (code of conduct, PR guide, release process) | Contribution documentation           |

### Phase 4: Search & Deploy (Week 5)

| Task                                                   | Deliverable                        |
| ------------------------------------------------------ | ---------------------------------- |
| Configure Pagefind cross-site search (Storybook merge) | Unified search across both systems |
| Set up CI pipeline (GitHub Actions)                    | Automated builds on push/PR        |
| Configure Cloudflare Pages deployment                  | Production deployment working      |
| Set up preview deployments for PRs                     | PR review workflow                 |
| Set up version selector (initial version)              | Version navigation                 |

### Phase 5: Polish (Week 6)

| Task                                                    | Deliverable                      |
| ------------------------------------------------------- | -------------------------------- |
| Full accessibility audit of documentation site          | WCAG 2.1 AA compliance           |
| Performance audit (Lighthouse, Core Web Vitals)         | Performance baseline established |
| Cross-browser testing of embedded Storybook iframes     | Embed reliability verified       |
| Token documentation pages (colors, spacing, typography) | Token reference complete         |
| Changelog integration (starlight-changelog plugin)      | Release notes automated          |

---

## 14. Technology Decision Log

| Decision                    | Choice                          | Alternatives Considered                               | Rationale                                                                                                                                                    |
| --------------------------- | ------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Documentation framework** | Astro/Starlight                 | Docusaurus, VitePress, 11ty                           | Zero framework lock-in; native Web Component support; Pagefind built-in; Lit components render natively; enterprise adoption (Cloudflare, Google, Microsoft) |
| **Search engine**           | Pagefind (built-in)             | Algolia DocSearch, Meilisearch, Typesense             | Zero external dependency; static index; no API keys; supports multi-site merge for Storybook integration; free                                               |
| **Content format**          | MDX (Markdown + components)     | Markdown only, Markdoc                                | MDX enables embedding Astro components (StorybookEmbed, ApiTable) directly in documentation; Starlight supports both                                         |
| **Code highlighting**       | Expressive Code (Shiki)         | Prism, highlight.js                                   | Shiki provides VS Code-quality highlighting; Expressive Code adds line markers, diff highlighting, file names; built into Starlight                          |
| **CEM integration**         | Custom Astro content loader     | Manual documentation, 11ty plugin, api-viewer-element | Content Layer API (Astro 5) provides Zod-validated typed data; same CEM feeds both Storybook and Starlight; no duplication                                   |
| **Storybook integration**   | iframe embeds + cross-linking   | Duplicate demos, screenshots, no integration          | iframes provide live, interactive demos without duplicating story code; Storybook controls work inside the embed                                             |
| **Cross-site search**       | Pagefind `mergeIndex`           | Separate search per site, Algolia multi-index         | Single search bar returns results from both docs and Storybook; zero-config; no external service                                                             |
| **Hosting**                 | Cloudflare Pages                | Vercel, Netlify, GitHub Pages                         | Unlimited bandwidth, global CDN, preview deployments, Wrangler CLI, free for projects                                                                        |
| **Versioning**              | URL-based with branch snapshots | Docusaurus-style built-in, starlight-versions plugin  | Simple, explicit, works with any CI/CD; no plugin dependency; enterprise teams understand branch-based snapshots                                             |
| **TWIG highlighting**       | Shiki `twig` grammar            | Prism twig, highlight.js                              | Shiki supports TWIG via TextMate grammar; consistent with Expressive Code; accurate syntax highlighting                                                      |

---

## Appendix A: Updated Monorepo Directory Structure

With the documentation hub added, the complete monorepo structure:

```
helix/
|
+-- turbo.json
+-- package.json
+-- package-lock.json
+-- tsconfig.base.json
+-- .eslintrc.cjs
+-- .prettierrc
|
+-- packages/
|   +-- wc-library/
|       +-- src/
|       |   +-- components/    # Lit Web Components
|       |   +-- tokens/        # DTCG token JSON files
|       |   +-- styles/        # Generated CSS
|       |   +-- utils/         # Shared utilities
|       +-- dist/              # Build output
|       +-- custom-elements.json  # CEM (generated, committed)
|       +-- package.json
|
+-- apps/
|   +-- storybook/
|   |   +-- .storybook/       # Storybook configuration
|   |   +-- stories/          # Component stories
|   |   +-- package.json
|   |
|   +-- docs/                  # NEW: Documentation hub
|       +-- astro.config.mjs
|       +-- src/
|       |   +-- content/docs/  # Starlight markdown/MDX content
|       |   +-- components/    # Custom Astro components
|       |   +-- plugins/       # CEM loader, token loader
|       |   +-- styles/        # Custom CSS
|       +-- public/
|       |   +-- storybook/     # Storybook static build (copied at build time)
|       +-- scripts/           # Page generation scripts
|       +-- package.json
|
+-- tools/
|   +-- tokens/
|       +-- build-tokens.mjs
|       +-- sd.config.mjs
|
+-- docs/                      # Project-level documentation (this directory)
    +-- 02-architecture-and-system-design.md
    +-- 03-component-architecture-storybook-integration.md
    +-- 03-design-system-token-architecture.md
```

---

## Appendix B: Research Sources

This architecture was informed by the following sources, accessed February 2026:

**Astro & Starlight:**

- [Starlight Documentation](https://starlight.astro.build/)
- [Starlight 0.32 Release -- Route Data Middleware, Multisite Search](https://astro.build/blog/starlight-032/)
- [Astro 5 Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Astro Year in Review 2025](https://astro.build/blog/year-in-review-2025/)
- [What's New in Astro -- January 2026](https://astro.build/blog/whats-new-january-2026/)
- [What's New in Astro -- December 2025](https://astro.build/blog/whats-new-december-2025/)
- [Starlight GitHub Repository](https://github.com/withastro/starlight)

**Framework Comparison:**

- [Starlight vs. Docusaurus for Building Documentation (LogRocket)](https://blog.logrocket.com/starlight-vs-docusaurus-building-documentation/)
- [Comparing Docusaurus and Starlight (Distr)](https://distr.sh/blog/distr-docs/)
- [Choosing the Perfect Documentation Site (Movin Silva)](https://medium.com/@movin_silva/choosing-the-perfect-documentation-site-caf86a9a9e30)

**Search:**

- [Starlight Site Search Documentation](https://starlight.astro.build/guides/site-search/)
- [Pagefind Multi-Site Search Documentation](https://pagefind.app/docs/multisite/)
- [Hooking Up Search Results from Starlight in Other Sites (macwright.com)](https://macwright.com/2024/04/03/starlight-search-everywhere)
- [Starlight Configuration Reference -- Pagefind](https://starlight.astro.build/reference/configuration/)

**Custom Elements Manifest:**

- [Custom Elements Manifest Specification](https://github.com/webcomponents/custom-elements-manifest)
- [The Killer Feature of Web Components (Dave Rupert, 2025)](https://daverupert.com/2025/10/custom-elements-manifest-killer-feature)
- [CEM Analyzer Getting Started](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
- [API Viewer Element (Open WC)](https://github.com/open-wc/api-viewer-element)

**Storybook Integration:**

- [How to Build Docs with Storybook and Astro (Frontend Weekly)](https://medium.com/front-end-weekly/how-to-build-awsm-docs-with-storybook-and-astro-07375167a6b2)
- [Taking Starlight for a Spin: Design System Documentation (Adam Sedwick)](https://www.blind3y3design.com/writing/2024/starlight-design-system-docs/)
- [Storybook Embed Documentation](https://storybook.js.org/docs/sharing/embed)
- [Astro UXDS Web Components -- Storybook Showcase](https://storybook.js.org/showcase/rocketcom-astro-uxds/)

**Versioning:**

- [Versioned Documentation Support Discussion (Starlight #957)](https://github.com/withastro/starlight/discussions/957)
- [Versioned Documentation with Starlight & Vercel (webpro.nl)](https://webpro.nl/scraps/versioned-docs-with-starlight-and-vercel)
- [Starlight Versions Plugin](https://starlight-versions.vercel.app/getting-started/)

**Code Highlighting:**

- [Starlight Code Component Documentation](https://starlight.astro.build/components/code/)
- [Expressive Code Documentation](https://expressive-code.com/key-features/code-component/)
- [Shiki Languages](https://shiki.style/languages)

**Content Authoring:**

- [Starlight Authoring Content in Markdown](https://starlight.astro.build/guides/authoring-content/)
- [Starlight Using Components](https://starlight.astro.build/components/using-components/)
- [Starlight Plugins and Integrations](https://starlight.astro.build/resources/plugins/)
