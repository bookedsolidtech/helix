---
title: Rapid Prototype
description: Building the first proof-of-concept components to validate the WC-2026 architecture
---

> **Status**: In Progress
> **Timeline**: February 2026

---

## Prototype Strategy

The rapid prototype focuses on building a **thin vertical slice** through the entire architecture. Rather than building many components, we build 2-3 components that exercise every integration point.

### Why Prototype First?

- **Reduce risk** - Validate technology choices before committing to 40+ components
- **Expose integration issues** - Find problems where systems connect (Lit ↔ Storybook ↔ Drupal ↔ Docs)
- **Establish patterns** - The first component sets the pattern for all future components
- **Build confidence** - Demonstrate working software early

## Target Components

### 1. `wc-button` (Atom)

The simplest interactive component - validates the core authoring pattern.

**Validates:**
- Lit 3.x component authoring with TypeScript
- CSS custom properties for theming
- Slot-based content projection
- Form association via ElementInternals
- Accessibility (focus management, ARIA)
- Storybook controls and autodocs
- CEM generation from JSDoc

### 2. `wc-card` (Organism)

A complex content component - validates composition patterns.

**Validates:**
- Multi-slot composition (image, heading, body, footer)
- Responsive layout with container queries
- Design token consumption
- Event dispatching (`wc-card-click`)
- Drupal field mapping (node → component props)
- Visual regression testing with Chromatic

### 3. `wc-text-input` (Atom)

A form component - validates form integration.

**Validates:**
- Form-associated custom elements (ElementInternals)
- Validation states and error messaging
- Label association and accessibility
- Drupal Form API integration
- Custom event dispatching (`wc-input`, `wc-change`)

## Build Sequence

```
Week 1: Environment setup
  ├── npm workspaces + Turborepo initialization
  ├── TypeScript strict configuration
  ├── Lit 3.x + Vite library mode
  ├── Storybook 8.x installation
  └── Terrazzo token pipeline

Week 2: First component
  ├── wc-button implementation
  ├── Storybook stories + controls
  ├── Vitest browser tests
  ├── CEM generation
  └── Accessibility audit

Week 3: Complex components
  ├── wc-content-card implementation
  ├── wc-text-input implementation
  ├── Drupal TWIG integration test
  └── Documentation generation

Week 4: Integration validation
  ├── Full build pipeline test
  ├── npm package dry-run publish
  ├── Drupal site integration
  └── Phase 0 retrospective
```

## Outcome

At the end of Phase 0, we will have:

1. A working monorepo with 3 published components
2. Validated build pipeline (author → test → build → publish → integrate)
3. Confidence in technology choices
4. Patterns documented for Phase 1+ component development
