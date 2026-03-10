---
title: Architecture Overview
description: High-level system architecture for the HELIX enterprise web component library
---

HELIX is a **layered architecture** built for enterprise content organizations. Every decision prioritizes accessibility, performance, and Drupal CMS integration — in that order.

## System Layers

```
┌─────────────────────────────────────────────┐
│           Documentation Layer               │
│  Astro 5.x / Starlight + Storybook 10.x     │
├─────────────────────────────────────────────┤
│           Component Layer                   │
│  Lit 3.x Web Components + TypeScript 5.x   │
├─────────────────────────────────────────────┤
│           Token Layer                       │
│  Three-Tier Design Tokens (@helix/tokens)   │
├─────────────────────────────────────────────┤
│           Integration Layer                 │
│  Drupal Twig + Behaviors + CDN              │
└─────────────────────────────────────────────┘
```

## Key Architectural Decisions

### 1. Lit 3.x Over React/Vue

Components are standard Web Components — they work in Drupal Twig templates, React portals, Angular wrappers, or plain HTML without framework coupling. The 5KB Lit runtime means we're well under the `<50KB total bundle` performance budget.

Alternatives considered: Stencil (14KB runtime, more build complexity), FAST (smaller ecosystem), Vanilla (no reactivity, more boilerplate per component).

### 2. Three-Tier Token Architecture

```css
/* What components actually write */
:host {
  --_bg: var(--hx-button-bg, var(--hx-color-primary));
}
```

Consumers set ~20 semantic tokens (`--hx-color-primary`, `--hx-spacing-md`) to theme the entire library. Components expose component-level tokens for surgical overrides. Primitive values are internal — never part of the public API.

### 3. Dual Documentation Systems

Two systems, two audiences, one source of truth:

| System        | Port   | Audience                      | Purpose                                |
| ------------- | ------ | ----------------------------- | -------------------------------------- |
| **Storybook** | `3151` | Component builders, designers | Interactive playground, controls, VRT  |
| **Starlight** | `3150` | Drupal teams, architects      | Guides, integration patterns, this doc |

The Custom Elements Manifest (CEM) is the bridge — JSDoc annotations on component source drive API tables in both systems automatically.

### 4. Turborepo Monorepo

Intelligent build caching means CI doesn't rebuild unchanged packages. Task ordering is dependency-aware: `hx-library` builds first, then `storybook` and `docs` can build in parallel.

### 5. WCAG 2.1 AA as a Floor

Healthcare mandate. Not a stretch goal, not "nice to have." Every component ships with:

- Verified WCAG 2.1 AA compliance minimum
- `ElementInternals` for proper form association (label binding, validation, screen reader announcements)
- High contrast mode and reduced motion support
- Four-level testing: lint → Storybook axe addon → Vitest axe-core → manual screen reader

## Package Map

```
helix/
├── packages/
│   ├── hx-library/   # @helix/library — 85 Lit 3.x components
│   └── hx-tokens/    # @helix/tokens — CSS custom property generation
│
├── apps/
│   ├── docs/         # Astro/Starlight docs hub (port 3150)
│   ├── storybook/    # Storybook 10.x playground (port 3151)
│   └── admin/        # Admin Dashboard health scoring (port 3159)
│
└── .claude/agents/   # 18 specialized engineering agents
```

## Data Flow

```
Component source (TypeScript + JSDoc annotations)
    ↓
[npm run cem] → packages/hx-library/custom-elements.json
    ↓
    ├─→ Storybook 10.x (autodocs, controls, a11y addon)
    └─→ Starlight (API reference pages)

packages/hx-tokens
    ↓
CSS Custom Properties (--hx-* variables)
    ↓
    ├─→ Lit components (consume via var())
    └─→ Drupal themes (override at :root)
```

## Detailed Documentation

- [Monorepo Structure](/architecture/monorepo/) — workspace topology and task pipeline
- [Build Pipeline](/architecture/build-pipeline/) — Turborepo build orchestration and CI
- [Testing Strategy](/architecture/testing/) — Vitest browser mode, VRT, axe-core
- [Pre-Planning Architecture](/pre-planning/architecture/) — complete 55,000-word specification with decision rationale
