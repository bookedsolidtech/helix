---
title: Architecture & System Design
description: Complete system architecture, technology decisions, and infrastructure design for HELIX
---

> **Section Owner**: Principal Engineer
> **Last Updated**: 2026-02-13
> **Status**: Active

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Overall System Architecture](#2-overall-system-architecture)
3. [Package Structure & Monorepo Strategy](#3-package-structure--monorepo-strategy)
4. [Build Pipeline](#4-build-pipeline)
5. [Lit + Storybook Integration (2025-2026 State of the Art)](#5-lit--storybook-integration-2025-2026-state-of-the-art)
6. [Custom Elements Manifest Pipeline](#6-custom-elements-manifest-pipeline)
7. [3-Tier Design Token System](#7-3-tier-design-token-system)
8. [Drupal Integration Architecture](#8-drupal-integration-architecture)
9. [Testing Strategy Architecture](#9-testing-strategy-architecture)
10. [Accessibility Architecture (WCAG 2.1 AA)](#10-accessibility-architecture-wcag-21-aa)
11. [CI/CD Pipeline](#11-cicd-pipeline)
12. [Technology Decision Log](#12-technology-decision-log)

---

## 1. Executive Summary

This document defines the architecture for an enterprise-grade Web Component library targeting an organization's public-facing content platform. The system is designed as two independent but complementary artifacts:

1. **`@helix/library`** -- A standalone, framework-agnostic Web Component package built with Lit and TypeScript, distributable via npm or CDN
2. **Storybook** -- A development and documentation environment that consumes the library as a dependency, providing interactive component previews, automated API documentation, and visual testing

The architecture prioritizes:

- **Framework agnosticism**: Components work in any HTML context (Drupal, React, Vue, static HTML)
- **Enterprise durability**: Pure TypeScript with 100% JSDoc coverage, zero runtime framework lock-in
- **Accessibility compliance**: WCAG 2.1 AA baked into component architecture from day one
- **Clean integration boundary**: The WC library has zero knowledge of Drupal; Drupal consumes it as a static asset

---

## 2. Overall System Architecture

### System Boundary Diagram (Text Representation)

```
+------------------------------------------------------------------+
|                   MONOREPO (npm workspaces + Turborepo)           |
|                                                                  |
|  +-------------------------+    +----------------------------+   |
|  |  packages/hx-library    |    |  apps/storybook            |   |
|  |                         |    |                            |   |
|  |  - Lit Web Components   |    |  - Storybook 10.x           |   |
|  |  - Design Tokens        |    |  - @storybook/web-         |   |
|  |  - TypeScript source    |    |    components-vite          |   |
|  |  - CEM Analyzer         |    |  - Component stories       |   |
|  |  - Vitest + Playwright  |    |  - Autodocs (from CEM)     |   |
|  |                         |    |  - Visual regression tests  |   |
|  |  OUTPUT:                |    |                            |   |
|  |  - ES modules (.js)     |    |  CONSUMES:                 |   |
|  |  - Type defs (.d.ts)    |    |  - @helix/library         |   |
|  |  - CEM (JSON)           |    |    (npm workspace link)    |   |
|  |  - CSS token files      |    |  - custom-elements.json    |   |
|  |  - npm package          |    |                            |   |
|  +----------+--------------+    +----------------------------+   |
|             |                                                    |
+------------|-----------------------------------------------------+
             |
             |  npm publish / CDN upload
             v
+------------------------------------------------------------------+
|                      DRUPAL CMS (Client Team)                    |
|                                                                  |
|  +----------------------------+  +---------------------------+   |
|  |  libraries.yml             |  |  Twig Templates           |   |
|  |  - @helix/library entry   |  |  - <org-card>             |   |
|  |  - ES module import        |  |  - <org-hero>             |   |
|  |  - CSS token stylesheet    |  |  - SDC wrapping (opt.)    |   |
|  +----------------------------+  +---------------------------+   |
|                                                                  |
|  +----------------------------+                                  |
|  |  Token Override Layer      |                                  |
|  |  - :root { --org-* }      |                                  |
|  |  - Theme-specific values   |                                  |
|  +----------------------------+                                  |
+------------------------------------------------------------------+
```

### Architectural Principles

| Principle                                    | Rationale                                                                                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Library has zero consumer knowledge**      | The WC package never imports Drupal, Storybook, or any consumer framework. It is a pure Web Components package.                               |
| **Storybook is a dev dependency only**       | Storybook consumes the library. It is never shipped to production.                                                                            |
| **Tokens pierce Shadow DOM by design**       | CSS custom properties inherit through Shadow DOM boundaries, making them the only viable theming mechanism for encapsulated components.       |
| **ES modules as distribution format**        | Standard ES2021 modules -- no CommonJS, no UMD. Modern Drupal (10.3+) and all evergreen browsers support ES modules natively.                 |
| **Custom Elements Manifest as the contract** | The `custom-elements.json` file is the machine-readable API contract between the library and all consumers (Storybook, IDEs, Drupal tooling). |

---

## 3. Package Structure & Monorepo Strategy

### Why a Monorepo

Even with only two packages (library + Storybook), a monorepo provides:

- **Atomic changes**: A component change and its story update ship in one commit
- **Shared tooling**: TypeScript config, linting, formatting shared at the root
- **Workspace linking**: Storybook references the library via npm workspace linking, always using the latest local build
- **Single CI pipeline**: One pipeline builds, tests, and validates everything

### Package Manager: npm with Turborepo

**Decision**: npm (v10.8+) as the package manager with Turborepo (v2.3+) for task orchestration.

**Rationale**: npm is the standard package manager bundled with Node.js, eliminating an extra installation step for all contributors. npm workspaces (configured in root `package.json`) provide workspace linking for local package references. Turborepo provides intelligent task orchestration with caching, parallel execution, and dependency-aware build ordering -- capabilities that become essential as the monorepo grows. This combination delivers zero-install friction with production-grade build performance.

### Directory Structure

```
helix/
|
+-- package.json                      # Workspace root (workspaces, scripts, shared devDependencies)
+-- turbo.json                        # Turborepo pipeline configuration
+-- package-lock.json                 # Lockfile (committed)
+-- tsconfig.base.json                # Shared TypeScript configuration
+-- .eslintrc.cjs                     # Shared lint rules
+-- .prettierrc                       # Shared formatting
+-- custom-elements-manifest.config.mjs  # CEM analyzer config (root)
|
+-- packages/
|   +-- wc-library/
|       +-- package.json              # @helix/library
|       +-- tsconfig.json             # Extends ../tsconfig.base.json
|       +-- custom-elements-manifest.config.mjs
|       +-- src/
|       |   +-- index.ts              # Barrel export (all components)
|       |   +-- components/
|       |   |   +-- card/
|       |   |   |   +-- card.ts       # <org-card> component
|       |   |   |   +-- card.styles.ts # Lit CSS tagged template
|       |   |   |   +-- card.test.ts  # Component unit tests
|       |   |   |   +-- index.ts      # Re-export
|       |   |   +-- hero/
|       |   |   |   +-- hero.ts
|       |   |   |   +-- hero.styles.ts
|       |   |   |   +-- hero.test.ts
|       |   |   |   +-- index.ts
|       |   |   +-- button/
|       |   |       +-- ...
|       |   +-- tokens/
|       |   |   +-- base.tokens.json     # Tier 1: Option tokens (DTCG format)
|       |   |   +-- semantic.tokens.json # Tier 2: Decision tokens
|       |   |   +-- component.tokens.json # Tier 3: Component tokens
|       |   +-- styles/
|       |   |   +-- tokens.css           # Generated CSS custom properties
|       |   |   +-- reset.css            # Minimal reset for components
|       |   +-- utils/
|       |       +-- types.ts             # Shared TypeScript types
|       |       +-- mixins.ts            # Shared Lit mixins
|       +-- dist/                        # Build output (gitignored)
|       |   +-- index.js                 # Compiled ES2021 modules
|       |   +-- index.d.ts              # Type declarations
|       |   +-- components/             # Per-component entry points
|       |   +-- styles/
|       |       +-- tokens.css          # Compiled token stylesheet
|       +-- custom-elements.json        # Generated CEM (committed)
|
+-- apps/
|   +-- storybook/
|       +-- package.json              # Storybook dev dependencies
|       +-- .storybook/
|       |   +-- main.ts               # Framework: web-components-vite
|       |   +-- preview.ts            # CEM loading, global decorators
|       |   +-- manager.ts            # Storybook UI customization
|       |   +-- theme.ts              # Custom Storybook theme (branding)
|       +-- stories/
|       |   +-- foundations/
|       |   |   +-- Colors.mdx        # Token documentation
|       |   |   +-- Typography.mdx    # Type scale documentation
|       |   |   +-- Spacing.mdx       # Spacing scale documentation
|       |   +-- components/
|       |       +-- Card.stories.ts    # <org-card> stories
|       |       +-- Hero.stories.ts
|       |       +-- Button.stories.ts
|       +-- public/                    # Static assets for Storybook
|
+-- tools/
|   +-- tokens/
|       +-- build-tokens.mjs          # Style Dictionary build script
|       +-- sd.config.mjs             # Style Dictionary configuration
|
+-- docs/                             # Project documentation
    +-- 01-project-overview.md
    +-- 02-architecture-and-system-design.md  (this document)
    +-- 03-component-inventory.md
    +-- ...
```

### Workspace Configuration (Root `package.json`)

npm workspaces are declared in the root `package.json` (no separate workspace config file needed):

```json
{
  "name": "helix",
  "private": true,
  "packageManager": "npm@10.8.2",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "dev:docs": "turbo dev --filter=docs",
    "build": "turbo build",
    "build:tokens": "node tools/tokens/build-tokens.mjs",
    "type-check": "turbo type-check",
    "lint": "turbo lint",
    "clean": "turbo clean"
  }
}
```

Turborepo handles all task orchestration with intelligent caching and dependency-aware parallel execution. Run `turbo run dev` to start all apps, or `turbo run dev --filter=docs` to target a specific workspace.

### Library `package.json` (`packages/hx-library/package.json`)

```json
{
  "name": "@helix/library",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./components/*": {
      "types": "./dist/components/*/index.d.ts",
      "default": "./dist/components/*/index.js"
    },
    "./styles/tokens.css": "./dist/styles/tokens.css"
  },
  "files": ["dist/", "custom-elements.json"],
  "customElements": "custom-elements.json",
  "scripts": {
    "build": "tsc && npm run build:tokens",
    "build:tokens": "node ../../tools/tokens/build-tokens.mjs",
    "cem": "cem analyze --litelement",
    "test": "vitest run",
    "test:ui": "vitest --browser.enabled",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "lit": "^4.1.0"
  },
  "devDependencies": {
    "@custom-elements-manifest/analyzer": "^0.10.0",
    "typescript": "^5.7.0"
  }
}
```

Key points:

- The `"customElements"` field points Storybook and IDEs to the manifest
- The `"exports"` map enables tree-shakeable per-component imports
- Lit is the **only** runtime dependency
- `"type": "module"` enforces ES module format throughout

---

## 4. Build Pipeline

### TypeScript Compilation (Library)

The library compiles TypeScript to ES2021 JavaScript using `tsc` directly -- no bundler required for the library package. This follows Lit's official recommendation: **do not bundle reusable component packages**.

**Why no bundler for the library?**

Lit's publishing guide is explicit: "Bundling and other optimizations are application concerns." Bundling a library risks:

- Duplicating Lit's runtime if the consumer also uses Lit
- Breaking tree-shaking for consumers who only need a subset of components
- Introducing unexpected side effects from bundler transformations

The library ships plain ES modules. The consumer (Drupal, Storybook, or any app) handles bundling.

### `tsconfig.json` (Library)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "es2021",
    "module": "es2015",
    "moduleResolution": "node",
    "lib": ["es2021", "dom", "dom.iterable"],
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "dist"]
}
```

**Critical settings explained:**

| Setting                          | Value    | Why                                                                                                                                                                                                                                  |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `target`                         | `es2021` | Lit's recommended compile target. Supported by all evergreen browsers.                                                                                                                                                               |
| `experimentalDecorators`         | `true`   | Lit recommends experimental decorators over TC39 standard decorators for now (Lit 3.x). Standard decorators support is in progress but experimental produces more optimal output today.                                              |
| `useDefineForClassFields`        | `false`  | **Required** by Lit's decorator system. Without this, reactive properties will silently fail because TypeScript's class field emit would shadow Lit's accessors. This is the single most common misconfiguration in Lit+TS projects. |
| `declaration` + `declarationMap` | `true`   | Generates `.d.ts` files and source maps so consumers get full IntelliSense and "Go to Definition" navigates to the original `.ts` source.                                                                                            |

### Build Sequence

```
1. Style Dictionary: tokens JSON --> tokens.css
2. TypeScript Compiler: src/**/*.ts --> dist/**/*.js + dist/**/*.d.ts
3. CEM Analyzer: src/**/*.ts --> custom-elements.json
4. (Optional) Copy static assets: src/styles/*.css --> dist/styles/*.css
```

Each step is idempotent and can run independently. The full sequence is orchestrated by the root `build` script.

### Storybook Build (Dev + Production)

Storybook uses Vite as its build tool via `@storybook/web-components-vite`. In development mode, Vite serves the library's TypeScript source directly (no pre-compilation needed) through its on-demand transform pipeline. For production builds (static documentation site), Vite bundles everything through Rollup.

```
Development:  Vite dev server --> transforms TS on-demand --> browser
Production:   Vite build (Rollup) --> static HTML/JS/CSS --> deploy to hosting
```

---

## 5. Lit + Storybook Integration (2025-2026 State of the Art)

### Framework Selection: Storybook 10.x + `@storybook/web-components-vite`

**Current state (February 2026):**

- Storybook 10 was released in June 2025, with Storybook 10.1 following in July 2025
- The `@storybook/web-components-vite` framework is the canonical path for Lit components
- The old `@storybook/lit` package was deprecated and merged into `@storybook/web-components`
- Storybook 10 ships with built-in Vitest integration ("Storybook Test") for interaction, accessibility, and visual testing

**Key Storybook 10 features relevant to this project:**

| Feature                            | Benefit                                                                                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Built-in Vitest integration**    | Component tests run directly inside Storybook; no separate test infrastructure needed for story-level tests                                                                  |
| **Autodocs from CEM**              | Automatic API documentation generated from the Custom Elements Manifest -- attributes, properties, events, slots, CSS custom properties all documented without manual effort |
| **48% leaner install**             | Flatter dependency structure reduces `node_modules` bloat, meaningful for CI cache sizes                                                                                     |
| **Storybook Tags**                 | Organize components by status (stable, beta, deprecated) in the sidebar                                                                                                      |
| **Accessibility testing built-in** | Axe-based a11y checks run as part of the testing suite, critical for enterprise accessibility compliance                                                                     |

### Storybook Configuration

**`.storybook/main.ts`**

```typescript
import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|ts)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y', '@storybook/addon-links'],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
};

export default config;
```

**`.storybook/preview.ts`**

```typescript
import type { Preview } from '@storybook/web-components-vite';
import { setCustomElementsManifest } from '@storybook/web-components-vite';
import { setStorybookHelpersConfig } from '@wc-toolkit/storybook-helpers';
import customElementsManifest from '@helix/library/custom-elements.json';

// Load the Custom Elements Manifest for autodocs
setCustomElementsManifest(customElementsManifest);

// Configure wc-toolkit helpers for enhanced controls
setStorybookHelpersConfig({
  // Optionally hide internal-only properties
  // hideArgRef: ['_internalProp'],
  setComponentVariable: true,
});

const preview: Preview = {
  parameters: {
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
    docs: {
      toc: true,
    },
  },
  tags: ['autodocs'],
};

export default preview;
```

### Story Structure Pattern

Each component story follows this pattern, using `@wc-toolkit/storybook-helpers` to eliminate boilerplate:

```typescript
// stories/components/Card.stories.ts
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { getStorybookHelpers } from '@wc-toolkit/storybook-helpers';
import { html } from 'lit';
import type { OrgCard } from '@helix/library/components/card';

// Side-effect import to register the custom element
import '@helix/library/components/card';

const { args, argTypes, template } = getStorybookHelpers<OrgCard>('org-card');

const meta: Meta<OrgCard> = {
  title: 'Components/Card',
  component: 'org-card',
  tags: ['autodocs', 'stable'],
  args,
  argTypes,
  render: (storyArgs) => template(storyArgs),
};

export default meta;
type Story = StoryObj<OrgCard>;

export const Default: Story = {};

export const WithImage: Story = {
  args: {
    heading: 'Content Resources',
    variant: 'featured',
  },
  render: (storyArgs) =>
    template(
      storyArgs,
      html`
        <img slot="image" src="/placeholder-content.jpg" alt="Content resource" />
        <p>Access our comprehensive resource library.</p>
      `,
    ),
};

export const DarkMode: Story = {
  args: {
    heading: 'Dark Mode Card',
  },
  decorators: [(story) => html`<div data-theme="dark">${story()}</div>`],
};
```

### The `@wc-toolkit/storybook-helpers` Integration

This is the critical automation layer between the Custom Elements Manifest and Storybook. It:

1. **Reads the CEM** to discover all attributes, properties, CSS custom properties, slots, and events
2. **Generates typed Storybook controls** automatically (text inputs for strings, toggles for booleans, selects for enums, color pickers for color properties)
3. **Creates a template function** with two-way binding between controls and the component
4. **Prevents naming collisions** when an attribute, property, slot, and CSS part share the same name (common in real components)
5. **Logs events** to the Storybook Actions panel automatically

This eliminates hundreds of lines of manual `argTypes` configuration per component.

---

## 6. Custom Elements Manifest Pipeline

The Custom Elements Manifest (CEM) is the **single source of truth** for the component library's public API. It is a JSON file conforming to the community standard at `custom-elements-manifest.open-wc.org`.

### What the CEM Contains

```json
{
  "schemaVersion": "2.1.0",
  "readme": "",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "src/components/card/card.ts",
      "declarations": [
        {
          "kind": "class",
          "name": "OrgCard",
          "tagName": "org-card",
          "attributes": [
            { "name": "heading", "type": { "text": "string" }, "description": "The card heading text" }
          ],
          "members": [...],
          "events": [...],
          "slots": [
            { "name": "", "description": "Default slot for card body content" },
            { "name": "image", "description": "Slot for card image" }
          ],
          "cssProperties": [
            { "name": "--org-card-padding", "description": "Internal padding", "default": "var(--org-spacing-md)" }
          ],
          "cssParts": [
            { "name": "header", "description": "The card header container" }
          ]
        }
      ]
    }
  ]
}
```

### How JSDoc Drives the CEM

The analyzer extracts most information from TypeScript types automatically. However, CSS custom properties, slots, CSS parts, and events require JSDoc annotations:

```typescript
/**
 * A card component for displaying content in a contained, elevated surface.
 *
 * @tagname org-card
 *
 * @slot - Default slot for card body content
 * @slot image - Slot for the card's hero image
 * @slot actions - Slot for action buttons
 *
 * @csspart header - The card header container
 * @csspart body - The card body container
 * @csspart footer - The card footer container
 *
 * @cssprop [--org-card-padding=var(--org-spacing-md)] - Internal padding
 * @cssprop [--org-card-radius=var(--org-radius-lg)] - Border radius
 * @cssprop [--org-card-bg=var(--org-surface-primary)] - Background color
 * @cssprop [--org-card-shadow=var(--org-shadow-md)] - Box shadow
 *
 * @fires card-click - Fired when the card is clicked
 */
@customElement('org-card')
export class OrgCard extends LitElement {
  /** The card heading text */
  @property({ type: String })
  heading: string = '';

  /** Visual variant of the card */
  @property({ type: String, reflect: true })
  variant: 'default' | 'featured' | 'compact' = 'default';

  // ...
}
```

This JSDoc-first approach achieves two goals simultaneously:

1. **100% JSDoc coverage** (project requirement) -- every public API surface is documented in-source
2. **Automated Storybook documentation** -- the CEM feeds directly into Storybook autodocs and `@wc-toolkit/storybook-helpers`

### CEM Analyzer Configuration

```javascript
// custom-elements-manifest.config.mjs
import { litPlugin } from '@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js';

export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['**/*.test.ts', '**/*.styles.ts'],
  plugins: [litPlugin()],
  litelement: true,
  outdir: '.',
};
```

### CEM in the Workflow

```
Source Code (.ts)          CEM Analyzer          custom-elements.json
with JSDoc         --->    (cem analyze    --->  (committed to repo,
annotations                 --litelement)         included in npm package)
                                                       |
                                            +----------+----------+
                                            |          |          |
                                        Storybook   VS Code    Drupal
                                        (autodocs)  (IntelliSense)  (optional
                                                                  tooling)
```

The CEM is **committed to the repository** (not gitignored) because:

- It is part of the npm package distribution
- It enables Storybook to function without running the analyzer first
- It serves as a reviewable API changelog in pull requests

---

## 7. 3-Tier Design Token System

### Architecture Overview

The token system follows the industry-standard 3-tier architecture aligned with the W3C Design Tokens Community Group (DTCG) specification that reached its first stable version (2025.10) in October 2025.

```
+--------------------------------------------------+
|  TIER 1: Option Tokens (Base / Primitive)        |
|  "WHAT styles exist"                              |
|                                                  |
|  color.blue.100 = #dbeafe                        |
|  color.blue.500 = #3b82f6                        |
|  color.blue.900 = #1e3a5f                        |
|  spacing.100 = 0.25rem                           |
|  spacing.400 = 1rem                              |
|  font.family.sans = "Inter, sans-serif"          |
|                                                  |
|  Format: DTCG JSON ($value, $type)               |
|  Visibility: PRIVATE (not exported to CSS)       |
+--------------------------------------------------+
                      |
                      | references via {color.blue.500}
                      v
+--------------------------------------------------+
|  TIER 2: Decision Tokens (Semantic)              |
|  "HOW styles are applied contextually"            |
|                                                  |
|  color.surface.primary = {color.neutral.50}      |
|  color.surface.secondary = {color.neutral.100}   |
|  color.text.primary = {color.neutral.900}        |
|  color.accent = {color.blue.600}                 |
|  color.error = {color.red.600}                   |
|  spacing.component.padding = {spacing.400}       |
|  radius.md = {spacing.200}                       |
|                                                  |
|  Format: DTCG JSON                               |
|  Visibility: PUBLIC (exported as CSS vars)       |
|  CSS Output: --org-color-accent: #2563eb;        |
+--------------------------------------------------+
                      |
                      | references via {color.accent}
                      v
+--------------------------------------------------+
|  TIER 3: Component Tokens                        |
|  "WHERE styles are applied specifically"          |
|                                                  |
|  card.background = {color.surface.primary}       |
|  card.border-color = {color.border.default}      |
|  card.padding = {spacing.component.padding}      |
|  button.primary.bg = {color.accent}              |
|  button.primary.text = {color.text.on-accent}    |
|                                                  |
|  Format: DTCG JSON                               |
|  Visibility: PUBLIC (exported as CSS vars)       |
|  CSS Output: --org-card-bg: var(--org-surface-primary); |
+--------------------------------------------------+
```

### DTCG Token Format

Following the W3C DTCG stable specification (2025.10), tokens use the `$value` / `$type` / `$description` format:

```json
{
  "color": {
    "blue": {
      "500": {
        "$value": "#3b82f6",
        "$type": "color",
        "$description": "Primary blue, mid-range"
      }
    }
  }
}
```

Semantic tokens reference base tokens using the alias syntax:

```json
{
  "color": {
    "accent": {
      "$value": "{color.blue.600}",
      "$type": "color",
      "$description": "Primary accent color for interactive elements"
    }
  }
}
```

### Style Dictionary Build Pipeline

Style Dictionary 4.x transforms the DTCG JSON tokens into platform-specific outputs. For this project, the primary output is CSS custom properties:

```javascript
// tools/tokens/sd.config.mjs
import StyleDictionary from 'style-dictionary';

export default {
  source: ['packages/hx-library/src/tokens/**/*.tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'org',
      buildPath: 'packages/hx-library/src/styles/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          filter: (token) => {
            // Only export Tier 2 (semantic) and Tier 3 (component) tokens
            // Tier 1 (option/base) tokens remain private
            return token.filePath.includes('semantic') || token.filePath.includes('component');
          },
          options: {
            outputReferences: true, // Preserve token references in output
          },
        },
      ],
    },
    // Future: iOS, Android, Figma if needed
  },
};
```

### Generated CSS Output

```css
/* tokens.css -- Generated by Style Dictionary. DO NOT EDIT. */

:root {
  /* Tier 2: Semantic Tokens */
  --org-color-surface-primary: #fafafa;
  --org-color-surface-secondary: #f5f5f5;
  --org-color-text-primary: #171717;
  --org-color-text-secondary: #525252;
  --org-color-accent: #2563eb;
  --org-color-error: #dc2626;
  --org-color-success: #16a34a;
  --org-spacing-xs: 0.25rem;
  --org-spacing-sm: 0.5rem;
  --org-spacing-md: 1rem;
  --org-spacing-lg: 1.5rem;
  --org-spacing-xl: 2rem;
  --org-radius-sm: 0.25rem;
  --org-radius-md: 0.5rem;
  --org-radius-lg: 0.75rem;
  --org-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --org-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);

  /* Tier 3: Component Tokens */
  --org-card-bg: var(--org-color-surface-primary);
  --org-card-padding: var(--org-spacing-md);
  --org-card-radius: var(--org-radius-lg);
  --org-card-shadow: var(--org-shadow-md);
  --org-button-primary-bg: var(--org-color-accent);
  --org-button-primary-text: #ffffff;
  --org-button-radius: var(--org-radius-md);
}
```

### How Tokens Integrate with Lit Components

CSS custom properties **inherit through Shadow DOM boundaries**. This is the fundamental mechanism that makes theming work with Web Components:

```typescript
// card.styles.ts
import { css } from 'lit';

export const cardStyles = css`
  :host {
    display: block;
    background: var(--org-card-bg, #ffffff);
    padding: var(--org-card-padding, 1rem);
    border-radius: var(--org-card-radius, 0.75rem);
    box-shadow: var(--org-card-shadow, 0 4px 6px rgba(0, 0, 0, 0.07));
  }

  :host([variant='featured']) {
    border-left: 4px solid var(--org-color-accent, #2563eb);
  }

  .card__heading {
    color: var(--org-color-text-primary, #171717);
    font-family: var(--org-font-heading, serif);
    margin: 0 0 var(--org-spacing-sm, 0.5rem);
  }

  .card__body {
    color: var(--org-color-text-secondary, #525252);
    font-family: var(--org-font-body, sans-serif);
  }
`;
```

**Key pattern**: Every CSS custom property usage includes a **fallback value**. This ensures the component renders correctly even without the token stylesheet loaded -- a critical resilience pattern for enterprise deployment where assets may load out of order.

### Light/Dark Mode Architecture

Dark mode is implemented by overriding Tier 2 semantic tokens at the `:root` or attribute level:

```css
/* tokens-dark.css */
[data-theme='dark'],
:root.dark {
  --org-color-surface-primary: #1a1a1a;
  --org-color-surface-secondary: #262626;
  --org-color-text-primary: #fafafa;
  --org-color-text-secondary: #a3a3a3;
  --org-color-accent: #60a5fa;
  --org-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --org-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
}
```

**Why this works**: Because Tier 3 (component) tokens reference Tier 2 tokens via `var()`, swapping Tier 2 values automatically cascades to all components. No component code changes needed. Dark mode is purely a token-layer concern.

**Drupal integration**: The client team can toggle dark mode by adding `data-theme="dark"` to the `<html>` or `<body>` element. Components react automatically.

---

## 8. Drupal Integration Architecture

### Scope Boundary

The Web Component library has **zero knowledge of Drupal**. All integration is the client team's responsibility. However, we must provide:

1. **Clear integration documentation** with working examples
2. **A clean asset delivery mechanism** (npm package + CDN)
3. **A token override strategy** so the client can customize without forking

### Asset Delivery Strategy

**Primary: npm package**

```bash
npm install @helix/library
```

The client team's Drupal build process (Composer + npm via Asset Packagist, or a custom Node build step) pulls the package and copies the dist files into the Drupal theme's asset directory.

**Secondary: CDN (for rapid prototyping or non-npm environments)**

The built package is also published to a CDN (jsDelivr auto-syncs from npm, or a dedicated CloudFront distribution for enterprise SLA requirements):

```
https://cdn.jsdelivr.net/npm/@helix/library@latest/dist/index.js
https://cdn.jsdelivr.net/npm/@helix/library@latest/dist/styles/tokens.css
```

Note: For production enterprise deployments, a self-hosted CDN (e.g., CloudFront) is recommended over public CDNs for security and availability guarantees.

### Drupal `libraries.yml` Integration

The client team declares the Web Component library as a Drupal library:

```yaml
# mytheme.libraries.yml

helix:
  version: VERSION
  css:
    theme:
      # Design tokens (CSS custom properties)
      node_modules/@helix/library/dist/styles/tokens.css: { minified: true }
      # Optional: dark mode overrides
      css/tokens-dark.css: {}
  js:
    # ES module entry point
    node_modules/@helix/library/dist/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies: []
```

Or, for CDN delivery:

```yaml
helix-cdn:
  version: VERSION
  css:
    theme:
      https://cdn.example.com/wc-library/latest/styles/tokens.css:
        type: external
        minified: true
  js:
    https://cdn.example.com/wc-library/latest/index.js:
      type: external
      attributes:
        type: module
      minified: true
      preprocess: false
```

### Usage in Twig Templates

Once the library is attached, Web Components work as standard HTML elements in any Twig template:

```twig
{# Attach the library #}
{{ attach_library('mytheme/helix') }}

{# Use components as standard HTML elements #}
<org-card heading="{{ node.label }}" variant="featured">
  {% if node.field_image.entity %}
    <img slot="image"
         src="{{ file_url(node.field_image.entity.fileuri) }}"
         alt="{{ node.field_image.alt }}" />
  {% endif %}

  {{ content.body }}

  <div slot="actions">
    <org-button variant="primary" href="{{ path('entity.node.canonical', {'node': node.id}) }}">
      Read More
    </org-button>
  </div>
</org-card>
```

### SDC (Single Directory Components) Wrapping Strategy

For teams using Drupal's Single Directory Components (available since Drupal 10.3 core), Web Components can be wrapped in an SDC for tighter Drupal integration:

```
components/
  health-card/
    health-card.component.yml
    health-card.twig
    health-card.css (optional overrides)
```

```yaml
# health-card.component.yml
name: Health Card
status: stable
props:
  type: object
  properties:
    heading:
      type: string
      title: Heading
    variant:
      type: string
      enum: [default, featured, compact]
    image_url:
      type: string
      title: Image URL
    image_alt:
      type: string
      title: Image Alt Text
    body:
      type: string
      title: Body Content
libraryOverrides:
  dependencies:
    - mytheme/helix
```

```twig
{# health-card.twig #}
<org-card heading="{{ heading }}" variant="{{ variant }}">
  {% if image_url %}
    <img slot="image" src="{{ image_url }}" alt="{{ image_alt }}" />
  {% endif %}
  {{ body }}
</org-card>
```

This gives the Drupal team the best of both worlds: the Web Component library handles rendering and encapsulation, while the SDC layer handles Drupal's component discovery, props validation, and library attachment.

### Token Customization by Client Team

The client team can override any token at the Drupal theme level without modifying the library:

```css
/* mytheme/css/token-overrides.css */
:root {
  /* Override brand colors */
  --org-color-accent: #0e7c61; /* Brand teal */
  --org-color-error: #b91c1c;

  /* Override spacing for their density preference */
  --org-spacing-md: 1.25rem;

  /* Override specific component tokens */
  --org-card-radius: 0.25rem; /* Sharper corners */
}
```

This works because CSS custom properties cascade from the document root through Shadow DOM boundaries into every component.

---

## 9. Testing Strategy Architecture

### Testing Pyramid

```
                    /\
                   /  \         E2E / Visual Regression
                  /    \        (Storybook Test + Chromatic)
                 /------\
                /        \      Integration Tests
               /          \     (Component + DOM interaction)
              /            \    (Vitest Browser Mode + Playwright)
             /--------------\
            /                \  Unit Tests
           /                  \ (Pure logic, utilities, token validation)
          /                    \ (Vitest, no browser needed)
         /______________________\
```

### Framework Decision: Vitest (not @web/test-runner)

**Decision**: Vitest with Browser Mode (Playwright provider)

**Rationale**:

| Factor                    | @web/test-runner                      | Vitest Browser Mode                                                     |
| ------------------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| **Industry momentum**     | Stable but stagnant (Open WC project) | Vitest 4 marked Browser Mode stable; rapidly growing adoption           |
| **Lit support**           | Native, purpose-built for WC          | Community package available; Vitest 4 added Lit to supported frameworks |
| **Performance**           | Good (real browser)                   | 2-10x faster than Jest; real browser via Playwright                     |
| **Storybook integration** | None                                  | Storybook 10 has native Vitest integration ("Storybook Test")           |
| **Ecosystem alignment**   | Separate toolchain                    | Same test runner for unit + browser + Storybook tests                   |
| **DX**                    | Good                                  | Excellent (watch mode, inline snapshots, TypeScript native)             |

The decisive factor is **Storybook 10's native Vitest integration**. Using Vitest for component tests means the same test runner powers both standalone component tests and Storybook interaction/a11y tests. One test runner, one configuration, one mental model.

### Test Layers

#### Layer 1: Unit Tests (Vitest, no browser)

For pure logic that does not require DOM:

```typescript
// src/utils/format-date.test.ts
import { describe, it, expect } from 'vitest';
import { formatHealthDate } from './format-date.js';

describe('formatHealthDate', () => {
  it('formats ISO date to human-readable', () => {
    expect(formatHealthDate('2026-02-13')).toBe('February 13, 2026');
  });

  it('returns empty string for invalid input', () => {
    expect(formatHealthDate('')).toBe('');
    expect(formatHealthDate('not-a-date')).toBe('');
  });
});
```

#### Layer 2: Component Tests (Vitest Browser Mode + Playwright)

For testing components in a real browser context:

```typescript
// src/components/card/card.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { fixture, html } from '@open-wc/testing-helpers';
import './card.js';
import type { OrgCard } from './card.js';

describe('org-card', () => {
  let element: OrgCard;

  beforeEach(async () => {
    element = await fixture<OrgCard>(html`
      <org-card heading="Test Heading" variant="default">
        <p>Card content</p>
      </org-card>
    `);
  });

  it('renders the heading', () => {
    const heading = element.shadowRoot!.querySelector('.card__heading');
    expect(heading?.textContent).toBe('Test Heading');
  });

  it('reflects the variant attribute', () => {
    expect(element.getAttribute('variant')).toBe('default');
    element.variant = 'featured';
    expect(element.getAttribute('variant')).toBe('featured');
  });

  it('projects slot content', () => {
    const slot = element.shadowRoot!.querySelector('slot:not([name])') as HTMLSlotElement;
    const assigned = slot.assignedNodes({ flatten: true });
    expect(assigned.length).toBeGreaterThan(0);
  });

  it('applies token-based styles', () => {
    const computed = getComputedStyle(element);
    // Verify the component respects token overrides
    element.style.setProperty('--org-card-padding', '2rem');
    // After next render cycle, verify computed style changed
  });

  it('fires card-click event on interaction', async () => {
    const clickPromise = new Promise<CustomEvent>((resolve) => {
      element.addEventListener('card-click', (e) => resolve(e as CustomEvent));
    });
    element.click();
    const event = await clickPromise;
    expect(event).toBeDefined();
    expect(event.bubbles).toBe(true);
  });
});
```

#### Layer 3: Accessibility Tests

**Two complementary strategies:**

1. **Automated axe-core in component tests** (catches ~30-40% of a11y issues):

```typescript
// src/components/card/card.test.ts (continued)
import { axe, toHaveNoViolations } from 'jest-axe';
// Note: jest-axe works with Vitest

it('passes automated accessibility checks', async () => {
  const results = await axe(element);
  expect(results).toHaveNoViolations();
});
```

2. **Storybook addon-a11y** (visual a11y panel in Storybook):

The `@storybook/addon-a11y` addon runs axe checks on every story automatically and displays results in a dedicated panel. In Storybook 10, this integrates directly with the test runner for CI enforcement.

3. **Manual testing protocol** (catches the other 60-70%): Keyboard navigation, screen reader testing (NVDA, VoiceOver), high-contrast mode validation. Documented as a checklist in the component contribution guide.

#### Layer 4: Visual Regression Tests

Storybook 10's built-in visual testing captures screenshots of every story and diffs against baselines:

```typescript
// In CI pipeline
// Storybook Test runs visual regression against every story
// Changes detected → fail CI → require explicit approval of visual diff
```

For enterprise environments, Chromatic (by the Storybook team) provides cloud-hosted visual regression with review workflows. Alternative self-hosted options include Percy or reg-suit.

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit tests (no browser needed)
    include: ['src/utils/**/*.test.ts'],

    // Browser tests for components
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
    },
  },
});
```

```typescript
// vitest.workspace.ts (for separating unit and browser tests)
export default [
  {
    test: {
      name: 'unit',
      include: ['src/utils/**/*.test.ts'],
      environment: 'node',
    },
  },
  {
    test: {
      name: 'components',
      include: ['src/components/**/*.test.ts'],
      browser: {
        enabled: true,
        provider: 'playwright',
        instances: [{ browser: 'chromium' }],
      },
    },
  },
];
```

---

## 10. Accessibility Architecture (WCAG 2.1 AA)

### Why This Is Non-Negotiable

Accessibility requirements are expanding rapidly across industries. The European Accessibility Act (EAA) has been enforcing WCAG 2.1 AA compliance since June 2025 with six-figure fines, and similar regulations are emerging worldwide. This is not aspirational -- it is a baseline requirement for enterprise content platforms.

### Component-Level A11y Patterns

Every component in the library must implement:

| Requirement             | Implementation                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Keyboard navigation** | All interactive elements reachable via Tab; custom keyboard handlers for complex widgets (arrow keys in menus, Escape to close modals) |
| **ARIA attributes**     | Correct `role`, `aria-label`, `aria-expanded`, `aria-describedby` on all interactive elements                                          |
| **Focus management**    | Visible focus indicators via `:focus-visible`; focus trap in modals; focus restoration on close                                        |
| **Color contrast**      | All text meets 4.5:1 ratio (AA normal text) or 3:1 (AA large text); enforced at the token level                                        |
| **Motion**              | Respect `prefers-reduced-motion` media query; no auto-playing animations                                                               |
| **Text scaling**        | All text uses relative units (`rem`); components reflow correctly at 200% zoom                                                         |

### A11y in the Token System

Color contrast compliance is enforced at the token level, not the component level:

```json
{
  "color": {
    "text": {
      "primary": {
        "$value": "#171717",
        "$type": "color",
        "$description": "Primary text color. MUST maintain 4.5:1 contrast against surface-primary."
      }
    }
  }
}
```

A token validation script runs in CI to verify contrast ratios between text and surface token pairs.

---

## 11. CI/CD Pipeline

### Pipeline Stages

```
[Push to Branch]
       |
       v
[1. Install]     npm ci
       |
       v
[2. Lint]        eslint + prettier check
       |
       v
[3. Type Check]  tsc --noEmit (both packages)
       |
       v
[4. Build Tokens] Style Dictionary: JSON --> CSS
       |
       v
[5. Build Library] tsc (compile to dist/)
       |
       v
[6. Generate CEM]  cem analyze --litelement
       |
       v
[7. Unit Tests]    vitest run (unit workspace)
       |
       v
[8. Component Tests] vitest run (browser workspace, Playwright)
       |
       v
[9. Build Storybook] storybook build (validates all stories compile)
       |
       v
[10. A11y Tests]   Storybook Test (axe on every story)
       |
       v
[11. Visual Tests]  Screenshot comparison (Chromatic or self-hosted)
       |
       v
[12. Publish]      (on tagged release) npm publish + CDN deploy
```

### GitHub Actions (Simplified)

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build:tokens
      - run: npm run build
      - run: npx turbo build:cem
      - run: npm run test
      - run: npx turbo build --filter=storybook
      # Visual regression via Chromatic (or equivalent)
      # - uses: chromaui/action@latest
      #   with:
      #     projectToken: ${{ secrets.CHROMATIC_TOKEN }}

  publish:
    needs: build-and-test
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm run build:tokens && npm run build && npx turbo build:cem
      - run: cd packages/hx-library && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 12. Technology Decision Log

| Decision                     | Choice                                 | Alternatives Considered               | Rationale                                                                                                                                                                                                   |
| ---------------------------- | -------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Component framework**      | Lit 3.x                                | Stencil, FAST, Vanilla WC             | Lit is the most widely adopted WC library, backed by Google, smallest runtime (~5KB), strongest TypeScript support, and the CEM ecosystem is built around it                                                |
| **Package manager**          | npm (v10.8+)                           | pnpm, yarn, bun                       | Bundled with Node.js (zero extra install); npm workspaces provide workspace linking; `package-lock.json` is universally understood; lowest onboarding friction for contributors                             |
| **Monorepo orchestration**   | Turborepo (v2.3+)                      | Nx, Lerna, npm scripts only           | Intelligent caching avoids redundant rebuilds; dependency-aware parallel execution; `--filter` syntax for targeted builds; minimal config (`turbo.json`); complements npm workspaces without replacing them |
| **Storybook framework**      | `@storybook/web-components-vite` (9.x) | Webpack variant, Rsbuild              | Vite is the standard for new projects; fastest dev server; Storybook 10 has strongest Vite integration                                                                                                      |
| **Storybook helpers**        | `@wc-toolkit/storybook-helpers`        | Manual argTypes, custom helpers       | Eliminates hundreds of lines of boilerplate; two-way binding; maintained by the WC community                                                                                                                |
| **Build tool (library)**     | `tsc` only (no bundler)                | Rollup, Vite lib mode, esbuild        | Lit's official guidance: do not bundle libraries. Plain `tsc` output is the cleanest distribution format.                                                                                                   |
| **Build tool (Storybook)**   | Vite (built into Storybook)            | Webpack                               | Default for Storybook 10; faster builds and HMR                                                                                                                                                             |
| **Test runner**              | Vitest 4.x (Browser Mode)              | @web/test-runner, Jest, Playwright CT | Unified test runner for unit + browser + Storybook tests; 2-10x faster than Jest; Storybook 10 native integration; Browser Mode stable since Vitest 4                                                       |
| **Browser provider (tests)** | Playwright                             | WebDriverIO                           | Parallel execution support; richer API; industry standard                                                                                                                                                   |
| **Design tokens format**     | DTCG (W3C 2025.10 stable)              | Style Dictionary legacy format        | Standards-aligned; future-proof; supported by Style Dictionary 4, Tokens Studio, Figma                                                                                                                      |
| **Token build tool**         | Style Dictionary 4.x                   | Theo, custom scripts                  | Industry standard; DTCG support; multi-platform output; extensible                                                                                                                                          |
| **Token distribution**       | CSS custom properties                  | Sass variables, JS objects            | Only mechanism that penetrates Shadow DOM; runtime-swappable for theming; zero JS overhead                                                                                                                  |
| **CEM analyzer**             | `@custom-elements-manifest/analyzer`   | Manual JSON, Stencil docs             | Community standard; Lit plugin built-in; feeds Storybook, VS Code, JetBrains                                                                                                                                |
| **Decorator style (Lit)**    | Experimental decorators                | TC39 standard decorators              | Lit team recommends experimental for now; produces more optimal output; standard decorator support in Lit still experimental                                                                                |
| **TypeScript target**        | ES2021                                 | ES2022, ESNext                        | Lit's recommended target; covers all evergreen browsers; avoids `useDefineForClassFields` issues at higher targets                                                                                          |
| **Accessibility standard**   | WCAG 2.1 AA                            | WCAG 2.2 AA                           | 2.1 AA is the current baseline for enterprise compliance (EAA and emerging regulations); 2.2 AA aspirational for future iteration                                                                           |
| **Drupal delivery**          | npm package (primary), CDN (secondary) | CDN-only, vendor directory            | npm gives version pinning and integrity checking; CDN for rapid prototyping; avoid Drupal vendor dir pattern                                                                                                |

---

## Appendix A: Key Dependencies (Version Matrix)

| Package                              | Version | Purpose                            |
| ------------------------------------ | ------- | ---------------------------------- |
| `lit`                                | ^4.1.0  | Web Component framework            |
| `typescript`                         | ^5.7.0  | Language compiler                  |
| `@storybook/web-components-vite`     | ^9.1.0  | Storybook framework                |
| `@storybook/addon-essentials`        | ^9.1.0  | Core Storybook addons              |
| `@storybook/addon-a11y`              | ^9.1.0  | Accessibility testing              |
| `@wc-toolkit/storybook-helpers`      | ^2.0.0  | CEM-to-Storybook automation        |
| `@custom-elements-manifest/analyzer` | ^0.10.0 | API manifest generation            |
| `style-dictionary`                   | ^4.3.0  | Design token build                 |
| `vitest`                             | ^4.0.0  | Test runner                        |
| `@vitest/browser`                    | ^4.0.0  | Browser testing                    |
| `playwright`                         | ^1.50.0 | Browser automation (test provider) |
| `@open-wc/testing-helpers`           | ^4.0.0  | WC test fixtures                   |
| `vite`                               | ^6.0.0  | Dev server + build (via Storybook) |
| `npm`                                | ^10.8.0 | Package manager                    |
| `turbo`                              | ^2.3.0  | Monorepo task orchestration        |
| `eslint`                             | ^9.0.0  | Linting (flat config)              |
| `prettier`                           | ^3.4.0  | Formatting                         |

---

## Appendix B: Research Sources

This architecture was informed by the following sources, accessed February 2026:

**Lit & Web Components:**

- [Lit Official Documentation -- Building for Production](https://lit.dev/docs/tools/production/)
- [Lit Official Documentation -- Publishing](https://lit.dev/docs/tools/publishing/)
- [Lit Official Documentation -- Decorators](https://lit.dev/docs/components/decorators/)
- [Lit Official Documentation -- Shadow DOM Styling](https://lit.dev/docs/components/styles/)
- [Web Components 2025: Shadow DOM, Lit 3.0, and Browser Compatibility](https://markaicode.com/web-components-2025-shadow-dom-lit-browser-compatibility/)

**Storybook:**

- [Storybook 10 Official Release](https://storybook.js.org/releases/9.0)
- [Storybook for Web Components & Vite (9.x docs)](https://storybook.js.org/docs/9/get-started/frameworks/web-components-vite)
- [Storybook 10 -- Built-in Testing](https://storybook.js.org/blog/storybook-9-beta/)
- [Storybook Releases Storybook v9 with Improved Testing Support (InfoQ)](https://www.infoq.com/news/2025/07/storybook-v9-released/)

**Custom Elements Manifest:**

- [Custom Elements Manifest -- Getting Started](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
- [The Killer Feature of Web Components (Dave Rupert, 2025)](https://daverupert.com/2025/10/custom-elements-manifest-killer-feature)
- [Documenting Web Components With Storybook (James Ives, 2025)](https://jamesiv.es/blog/frontend/javascript/2025/02/19/documenting-web-components-with-storybook/)
- [WC-Toolkit Storybook Helpers](https://wc-toolkit.com/integrations/storybook/)

**Design Tokens:**

- [Design Token-Based UI Architecture (Martin Fowler)](https://martinfowler.com/articles/design-token-based-ui-architecture.html)
- [W3C DTCG Specification Reaches First Stable Version (2025.10)](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- [Style Dictionary Documentation](https://styledictionary.com/)
- [The Developer's Guide to Design Tokens and CSS Variables (Penpot)](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/)

**Testing:**

- [Vitest Browser Mode Documentation](https://vitest.dev/guide/browser/)
- [Vitest in 2026: The New Standard for Modern JavaScript Testing](https://jeffbruchado.com.br/en/blog/vitest-2026-standard-modern-javascript-testing)
- [Testing Lit with Vitest Browser and Playwright (Comparison)](https://github.com/oscarmarina/lit-vitest-testing-comparison)
- [Vitest Browser Mode vs Playwright (Epic Web Dev)](https://www.epicweb.dev/vitest-browser-mode-vs-playwright)

**Drupal Integration:**

- [Web Components Module for Drupal](https://www.drupal.org/project/webcomponents)
- [Adding Assets via libraries.yml (Drupal docs)](https://www.drupal.org/docs/develop/creating-modules/adding-assets-css-js-to-a-drupal-module-via-librariesyml)
- [Drupal Single Directory Components Documentation](https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components/quickstart)
- [Component-Based Design in Drupal (Vardot)](https://www.vardot.com/en-us/ideas/blog/component-based-design-drupal)

**Accessibility & Compliance:**

- [WCAG 2.1 Specification (W3C)](https://www.w3.org/TR/WCAG21/)
- [European Accessibility Act (EAA)](https://ec.europa.eu/social/main.jsp?catId=1202)
- [2026 ADA Web Accessibility Standards & Requirements](https://www.accessibility.works/blog/wcag-ada-website-compliance-standards-requirements/)

**Monorepo & Tooling:**

- [Web Components Monorepo Starter (Turborepo + Lit + TypeScript)](https://github.com/neoki07/web-components-monorepo-starter)
- [Complete Monorepo Guide: npm Workspaces + Turborepo](https://turbo.build/repo/docs/crafting-your-repository)
- [Structuring a Repository (Turborepo docs)](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository)
