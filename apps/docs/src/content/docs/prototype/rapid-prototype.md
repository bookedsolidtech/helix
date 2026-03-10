---
title: Rapid Prototype
description: How we built the first proof-of-concept components to validate the HELIX architecture
---

> **Status**: Complete
> **Completed**: February 2026

---

## The Strategy

The prototype was a **thin vertical slice** through the entire architecture. Rather than building many components shallowly, we built three components that touched every integration point — component authoring, tokens, Storybook, CEM, Drupal, testing.

### Why Prototype First?

Starting with a vertical slice instead of building broad and shallow paid off immediately. We found three non-obvious integration issues in the first week:

- Shadow DOM CSS isolation in Drupal required the `--hx-*` naming convention to be established before any component stabilized their token API
- CEM generation required specific JSDoc annotation patterns that Storybook autodocs needed to consume correctly
- Vitest browser mode required explicit Playwright provider configuration that wasn't obvious from the docs

Each of these would have caused expensive rework if discovered after 20+ components existed.

## The Three Components

### 1. `hx-button` (Atom)

The simplest interactive component — validates the core authoring pattern.

**Validated:**

- Lit 3.x component authoring with TypeScript
- CSS custom properties (`--hx-*`) for theming
- Slot-based content projection
- Form association via `ElementInternals`
- Accessibility: focus management, ARIA roles
- Storybook controls and autodocs from CEM
- CEM generation from JSDoc annotations

### 2. `hx-card` (Organism)

A complex content component — validates composition patterns.

**Validated:**

- Multi-slot composition (image, heading, body, footer)
- Responsive layout with container queries
- Design token consumption from `hx-tokens`
- Custom event dispatching (`hx-click`)
- Drupal field mapping (node → component properties)

### 3. `hx-text-input` (Atom)

A form component — validates form integration.

**Validated:**

- Form-associated custom elements (`ElementInternals`)
- Validation states and error messaging
- Label association and accessibility
- Drupal Form API integration
- Custom event dispatching (`hx-input`, `hx-change`)

## How It Ran

```
Week 1: Environment setup
  ├── npm workspaces + Turborepo initialization
  ├── TypeScript strict configuration
  ├── Lit 3.x + Vite library mode
  ├── Storybook 10.x installation
  └── hx-tokens design token pipeline

Week 2: First component
  ├── hx-button implementation
  ├── Storybook stories + controls
  ├── Vitest browser tests
  ├── CEM generation
  └── Accessibility audit (axe-core)

Week 3: Complex components
  ├── hx-card implementation
  ├── hx-text-input implementation
  ├── Drupal TWIG integration test
  └── CEM → Starlight API documentation generation

Week 4: Integration validation
  ├── Full build pipeline end-to-end
  ├── npm package dry-run publish
  ├── Drupal site integration
  └── Phase 0 retrospective
```

## What Phase 0 Delivered

1. A working monorepo with 3 published components
2. A validated build pipeline: author → test → build → publish → integrate
3. Established patterns documented for all 87 subsequent components
4. Three concrete integration issues found and resolved before they scaled
