---
title: Planning & Discovery Overview
description: How HELIX was designed — architecture decisions, component strategy, and the documentation system that makes it usable
---

## What This Section Documents

These are the planning and discovery documents produced before and during the build phase of HELIX. They capture the architectural decisions, tradeoffs, and rationale behind how the library is structured — not as retrospective analysis, but as the thinking that shaped what got built.

If you want to understand **why** HELIX works the way it does, this is the right place.

**Project**: HELiX — HTML Element Library for Interactive eXperiences
**Primary consumer**: Drupal CMS (Twig templates, Drupal behaviors)
**Stack**: Lit 3.x + TypeScript + Storybook 10.x + Astro/Starlight + Turborepo

---

## What Was Built

85 production-ready web components (73 standalone + 12 sub-components) in a Turborepo monorepo with:

- **Lit 3.x** for component authoring — 5KB runtime, native TypeScript, Shadow DOM encapsulation
- **`hx-tokens` package** — custom CSS custom property generation, three-tier token cascade
- **Storybook 10.x** — component playground with CEM-powered autodocs, axe-core a11y addon
- **Astro/Starlight** — this documentation hub, the guide system you're reading now
- **Vitest 3.x browser mode** — real Chromium tests via Playwright, 100+ test suite
- **Custom Elements Manifest (CEM)** — machine-readable API contract driving both Storybook and Starlight

---

## Key Differentiators

### Accessibility-First Design

WCAG 2.1 AA is the floor, not the ceiling. Healthcare mandates don't negotiate with "we'll add it later." Every component ships with:

- WCAG 2.1 AA minimum compliance (WCAG AAA targets for critical form components)
- High contrast mode and reduced motion support built in
- Form components via `ElementInternals` — proper label association, validation, screen reader announcements
- Four-level accessibility testing: author-time linting → Storybook a11y addon → Vitest axe-core → manual screen reader testing

### Drupal-Optimized — Zero Drupal Coupling

The library knows nothing about Drupal. Components are standard Web Components that happen to have APIs designed around Drupal's data structures (field values, menu trees, view results). This is a deliberate tradeoff that keeps the library usable outside Drupal while making Drupal integration straightforward.

See [Drupal Integration](/drupal-integration/overview/) for the complete integration system.

### Three-Tier Design Token Architecture

```
Primitive (raw values, not exported)
  → Semantic (--hx-color-primary, --hx-spacing-md) — the consumer API
    → Component (--hx-button-bg, --hx-card-padding) — what components consume
```

Consumers override at the semantic level. Components consume at the component level with semantic fallbacks:

```css
:host {
  --_bg: var(--hx-button-bg, var(--hx-color-primary));
}
```

This pattern means consumers can theme the entire library by setting ~20 semantic tokens, or go component-by-component for surgical overrides.

### Dual Documentation System

Two documentation systems serve two different audiences:

| System        | URL     | Audience                      | Purpose                          |
| ------------- | ------- | ----------------------------- | -------------------------------- |
| **Storybook** | `:3151` | Designers, component builders | Interactive playground, controls |
| **Starlight** | `:3150` | Drupal devs, architects       | Guides, integration patterns     |

CEM is the bridge — component source code annotations drive API documentation in both systems automatically.

---

## Document Index

### Architecture & System Design

The [Architecture & System Design](/pre-planning/architecture/) document covers:

- Overall system architecture (npm workspaces + Turborepo monorepo)
- Lit 3.x component patterns (Reactive Controllers, `ElementInternals`, CSS Parts)
- Drupal integration architecture (per-component loading via Drupal libraries)
- Testing strategy (Vitest 3.x Browser Mode with Playwright)
- Three-tier design token system
- Build and deployment pipeline
- Technology decision log with alternatives considered

### Component Architecture & Storybook Integration

[Component Architecture & Storybook Integration](/pre-planning/components/) covers:

- Component library structure (85 components across 9 categories)
- Storybook story configuration and variant strategy
- TypeScript and JSDoc strategy — 100% coverage requirement
- Drupal integration documentation strategy
- Testing implementation: unit, browser, accessibility
- Architecture decision records

### Design System & Token Architecture

[Design System & Token Architecture](/pre-planning/design-system/) covers:

- Three-tier token system implementation
- Light/dark/high-contrast mode architecture
- CSS architecture for Shadow DOM components
- Typography and spacing systems
- Accessibility-first CSS patterns

### Documentation Hub Architecture

[Documentation Hub Architecture](/pre-planning/docs-hub/) covers:

- Why Astro/Starlight (vs. alternatives considered)
- Two-system strategy (Storybook + Starlight) and the bridge between them
- CEM-powered API documentation generation
- Site information architecture across three audience types
- Build and deployment pipeline for both systems

### Component Building Guide

The [Component Building Guide](/pre-planning/building-guide/) is the reference for anyone building HELIX components:

- Drupal-friendly patterns (attributes, slots, event naming)
- Data structure patterns for Drupal field mapping
- Complete component specifications with Twig examples
- Testing checklist (40+ items)
- Anti-patterns to avoid
- Component lifecycle in the Drupal context

### Drupal Integration Guide

The [Drupal Integration Guide](/pre-planning/drupal-guide/) is the reference for Drupal teams consuming HELIX:

- Library installation (npm, CDN, Drupal module wrapper)
- Twig integration patterns
- Node template examples (article teaser, full article, landing page)
- Views integration, Form API integration
- JavaScript behaviors for event handling
- Performance optimization (lazy loading per-component)
- Troubleshooting guide

---

## Technology Stack

| Technology     | Version | Purpose                               |
| -------------- | ------- | ------------------------------------- |
| **Lit**        | 3.x     | Web Component framework (5KB runtime) |
| **TypeScript** | 5.x     | Type safety, JSDoc documentation      |
| **Storybook**  | 10.x    | Component playground, design system   |
| **Vitest**     | 3.x     | Testing framework (Browser Mode)      |
| **Astro**      | 5.x     | Documentation site generator          |
| **Starlight**  | 0.37+   | Documentation theme                   |
| **hx-tokens**  | —       | Custom design token system            |
| **npm**        | 10.x    | Monorepo package manager              |
| **Turborepo**  | —       | Monorepo build orchestration          |
| **Vite**       | 6.x     | Component build tool (library mode)   |

---

## Architecture Overview

### Monorepo Structure

```
helix/
├── packages/
│   ├── hx-library/           # @helix/library — Lit 3.x components
│   └── hx-tokens/            # @helix/tokens — design token system
│
├── apps/
│   ├── docs/                 # Astro/Starlight documentation hub
│   ├── storybook/            # Storybook component playground
│   └── admin/                # Admin Dashboard — health scoring
│
└── turbo.json                # Turborepo task pipeline
```

### Data Flow

```
Source Code (TypeScript + JSDoc)
    ↓
[CEM Analyzer] → custom-elements.json
    ↓
    ├─→ Storybook (autodocs, controls)
    └─→ Starlight (API reference pages)

hx-tokens package
    ↓
CSS Custom Properties (--hx-*)
    ↓
    ├─→ Lit Components (consume via var())
    └─→ Storybook (token visualization)
```

### Drupal Integration Points

```
@helix/library (npm package)
    ↓
Drupal libraries.yml (per-component asset loading)
    ↓
    ├─→ Twig Templates (component markup)
    ├─→ Drupal Behaviors (event handling)
    └─→ Theme CSS (--hx-* token overrides)
```

---

## What Made This Hard

**Shadow DOM and Drupal's theming pipeline** — Drupal themes expect to reach into DOM nodes and apply CSS. Shadow DOM encapsulation breaks that assumption. The `--hx-*` token system is the solution: Drupal themes set tokens at the `:root` level, components consume them internally. This required establishing the naming convention before the first component shipped.

**Form-associated custom elements** — The `ElementInternals` API for form participation was the least documented part of the Web Components spec when this project started. We invested heavily in getting it right because healthcare applications have non-negotiable form accessibility requirements.

**85 components, one quality bar** — Scaling from 3 prototype components to 85 production components while maintaining test coverage, accessibility audits, Storybook stories, and CEM accuracy required systematic tooling. The Admin Dashboard health scorer tracks component quality across all dimensions.

---

**Document Version**: 2.0
**Last Updated**: March 2026
