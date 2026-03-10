# Helix — Enterprise Healthcare Web Component Library

## Project Overview

**Helix** (internal repo: `wc-2026`) is an enterprise-grade Web Component library built with Lit 3.x, targeting healthcare organizations that build mission-critical design systems. The library is framework-agnostic by design (web standards only) with zero runtime dependencies beyond Lit.

**Repository:** `git@github.com:clarity-house-press/helix.git`
**Organization:** clarity-house-press

## Mission

Build the factory, not the furniture. Helix is infrastructure for design systems at organizations where software failures can impact patient care. Every component is tested, documented, accessible, and token-driven.

## Architecture

### Monorepo (Turborepo + npm workspaces)

```
helix/
├── apps/
│   ├── admin/          # Next.js 15 + React 19 — Panopticon dashboard
│   ├── docs/           # Astro 5 + Starlight — public documentation
│   ├── storybook/      # Storybook 10 web-components-vite adapter
│   └── mcp-servers/    # Custom MCP tools (cem-analyzer, health-scorer, typescript-diagnostics)
└── packages/
    ├── hx-library/     # @helixui/library — core Lit 3.x web components
    └── hx-tokens/      # @helixui/tokens — design token definitions (CSS, Lit, JSON)
```

### Design Token System

Design tokens are the single source of truth for all visual values:

- `@helixui/tokens` exports CSS custom properties, Lit CSS literals, and raw JSON
- All components import tokens via `@helixui/tokens/lit` — never hardcode values

### Web Component Conventions

- Components are Lit 3.x `LitElement` subclasses
- Tag names prefixed `hx-*` (e.g., `hx-button`, `hx-card`)
- Each component lives in `packages/hx-library/src/components/{name}/`
- CEM (Custom Elements Manifest) is auto-generated and shipped with the package
- Shadow DOM — CSS Parts documented in JSDoc `@csspart`
- A11y tested via axe-core in Vitest browser tests

### Quality Gates (7 — ALL must pass)

1. **Type check** — `tsc --noEmit`, zero errors
2. **Lint** — ESLint 9 flat config + typescript-eslint strict, zero warnings
3. **Format** — Prettier, no diffs
4. **Test** — Vitest browser mode (axe + behavior)
5. **VRT** — Playwright visual regression against Storybook
6. **Build** — Vite library mode via Turborepo
7. **Bundle size** — per-component <5KB gzipped, full bundle <50KB gzipped

## Current Component Inventory

- hx-button, hx-card, hx-text-input, hx-alert, hx-badge, hx-checkbox
- hx-container, hx-form, hx-prose, hx-radio-group, hx-select, hx-switch
- hx-textarea

## Key Tooling

- **Turbo:** build/test/lint caching and orchestration
- **Changeset:** semantic versioning and changelogs
- **Husky:** pre-commit (type-check, lint, format), commit-msg (convention), pre-push (full gates)
- **Lint-staged:** scoped checks on changed files
- **Custom hooks:** 20+ quality gate scripts in `scripts/hooks/`

## Git Strategy

- Single branch: `main` (currently — recommended to add `dev` + `staging`)
- PRs target `main`
- CI enforces all 7 quality gates before merge
