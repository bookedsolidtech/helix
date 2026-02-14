---
title: Tech Stack Validation
description: Validating core technology choices for the WC-2026 component library
---

> **Status**: In Progress
> **Last Updated**: 2026-02-13

---

## Technology Decisions

Each technology choice was evaluated against alternatives. This document captures the rationale and validation status.

### Component Framework: Lit 3.x

| Criteria | Lit 3.x | Stencil | Fast | Vanilla |
|----------|---------|---------|------|---------|
| Bundle size | 5KB | 14KB | 8KB | 0KB |
| TypeScript | Native | Native | Native | Manual |
| Drupal compat | Excellent | Good | Good | Excellent |
| SSR support | Yes | Yes | No | Yes |
| Community | Large | Medium | Small | N/A |
| Storybook | Native | Plugin | Plugin | Manual |

**Decision**: Lit 3.x - best balance of size, DX, and Drupal compatibility.

**Validation**: Build `wc-button` and verify Storybook integration, Drupal rendering, and bundle analysis.

### Design Tokens: Terrazzo + W3C DTCG

| Criteria | Terrazzo | Style Dictionary | Theo |
|----------|----------|------------------|------|
| W3C DTCG spec | Native | Plugin | No |
| Output formats | CSS, JS, SCSS | CSS, JS, SCSS+ | CSS, JS |
| Type safety | Yes | Partial | No |
| Active dev | Yes | Yes | Archived |

**Decision**: Terrazzo - native DTCG support, successor to Cobalt UI.

**Validation**: Generate CSS custom properties from DTCG JSON and consume in Lit components.

### Testing: Vitest 4.x Browser Mode

| Criteria | Vitest Browser | Jest + JSDOM | Web Test Runner |
|----------|---------------|--------------|-----------------|
| Real browser | Yes | No | Yes |
| Speed | Fast (2-10x) | Slow | Medium |
| Storybook | Native (v10) | Plugin | Manual |
| Watch mode | Yes | Yes | Yes |

**Decision**: Vitest 4.x - real browser testing, native Storybook 10.x integration.

**Validation**: Write tests for prototype components and benchmark against Jest baseline.

### Documentation: Astro/Starlight + Storybook

**Dual system approach**:
- **Storybook**: Interactive design system (component playground, visual testing)
- **Astro/Starlight**: Comprehensive guides (architecture, integration, tutorials)

**Bridge**: Custom Elements Manifest (CEM) as single source of truth for API docs in both systems.

**Validation**: Generate API pages from CEM annotations on prototype components.

### Build Tool: Vite Library Mode

| Criteria | Vite | Rollup | esbuild |
|----------|------|--------|---------|
| Dev server | Built-in | Manual | Manual |
| Library mode | Native | Native | Limited |
| Storybook | Native | Plugin | Plugin |
| Tree-shaking | Yes | Yes | Partial |

**Decision**: Vite - native library mode, powers both Storybook and component build.

**Validation**: Build prototype components and verify tree-shakeable ESM output.

## Validation Checklist

- [ ] Lit 3.x component renders in all target browsers (Chrome 90+, Firefox 88+, Safari 14+)
- [ ] Terrazzo generates valid CSS custom properties from DTCG tokens
- [ ] Vitest browser mode runs tests against real Chromium
- [ ] Storybook autodocs generate from CEM annotations
- [ ] Starlight API pages render from CEM data
- [ ] Vite library mode produces tree-shakeable ESM bundle
- [ ] npm workspaces resolve cross-package dependencies
- [ ] TypeScript strict mode catches type errors at build time
