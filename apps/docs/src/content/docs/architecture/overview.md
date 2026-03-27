---
title: Architecture Overview
description: High-level system architecture for the HELIX enterprise web component library
---

HELIX follows a **layered architecture** designed for enterprise content organizations. The system prioritizes accessibility, performance, and Drupal CMS integration.

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
│  Drupal Twig + Behaviors + CDN              │
└─────────────────────────────────────────────┘
```

## Key Architectural Decisions

1. **Lit 3.x over React/Vue** — Framework-agnostic Web Components for CMS integration
2. **Three-tier tokens** — Primitive, Semantic, Component tiers for maximum flexibility
3. **Dual documentation** — Storybook for playground, Starlight for guides
4. **Turborepo + pnpm monorepo** — Efficient builds with intelligent caching
5. **WCAG 2.1 AA baseline** — Accessibility compliance as a first-class requirement

## Monorepo at a Glance

The repository is managed with **pnpm workspaces** and **Turborepo**. Key packages:

| Package | Purpose |
| --- | --- |
| `packages/hx-library` | Core Lit 3.x web component source |
| `packages/hx-tokens` | Design token definitions (W3C DTCG) |
| `packages/hx-react` | Auto-generated React wrappers (CEM-driven) |
| `packages/drupal-starter` | Drupal SDC scaffold and Twig templates |
| `packages/drupal-behaviors` | Drupal-specific JS behaviors |
| `packages/helixui-mcp` | MCP server for AI-assisted development |
| `apps/docs` | Astro/Starlight documentation site |
| `apps/storybook` | Storybook 10.x component playground |
| `apps/admin` | Internal admin application |
| `apps/mcp-servers/*` | Specialized MCP server applications |

## Next Steps

- [Monorepo Structure](/architecture/monorepo/) — How the monorepo is organized
- [Build Pipeline](/architecture/build-pipeline/) — Turborepo build orchestration
- [Testing Strategy](/architecture/testing/) — Enterprise testing approach
