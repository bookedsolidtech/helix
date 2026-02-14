---
title: Architecture Overview
description: High-level system architecture for the WC-2026 healthcare web component library
---

WC-2026 follows a **layered architecture** designed for enterprise healthcare organizations. The system prioritizes accessibility, performance, and Drupal CMS integration.

## System Layers

```
┌─────────────────────────────────────────────┐
│           Documentation Layer               │
│  Astro/Starlight + Storybook 10.x            │
├─────────────────────────────────────────────┤
│           Component Layer                   │
│  Lit 3.x Web Components + TypeScript        │
├─────────────────────────────────────────────┤
│           Token Layer                       │
│  Three-Tier Design Tokens (W3C DTCG)        │
├─────────────────────────────────────────────┤
│           Integration Layer                 │
│  Drupal TWIG + Behaviors + CDN              │
└─────────────────────────────────────────────┘
```

## Key Architectural Decisions

1. **Lit 3.x over React/Vue** - Framework-agnostic Web Components for CMS integration
2. **Three-tier tokens** - Global, Alias, Component tiers for maximum flexibility
3. **Dual documentation** - Storybook for playground, Starlight for guides
4. **Turborepo monorepo** - Efficient builds with intelligent caching
5. **WCAG 2.1 AA baseline** - Healthcare compliance as a first-class requirement

## Detailed Documentation

For the complete architecture specification (55,000+ words), see the [Pre-Planning Architecture document](/pre-planning/architecture/).

## Next Steps

- [Monorepo Structure](/architecture/monorepo/) - How the monorepo is organized
- [Build Pipeline](/architecture/build-pipeline/) - Turborepo build orchestration
- [Testing Strategy](/architecture/testing/) - Enterprise testing approach
