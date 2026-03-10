---
title: Tech Stack Validation
description: How we evaluated and validated the core technology choices for HELIX
---

> **Status**: Complete
> **Completed**: February 2026

---

## Technology Decisions

Every technology choice was evaluated against realistic alternatives. This document captures the rationale and what we found in practice.

### Component Framework: Lit 3.x

| Criteria      | Lit 3.x   | Stencil | Fast   | Vanilla   |
| ------------- | --------- | ------- | ------ | --------- |
| Bundle size   | 5KB       | 14KB    | 8KB    | 0KB       |
| TypeScript    | Native    | Native  | Native | Manual    |
| Drupal compat | Excellent | Good    | Good   | Excellent |
| SSR support   | Yes       | Yes     | No     | Yes       |
| Community     | Large     | Medium  | Small  | N/A       |
| Storybook     | Native    | Plugin  | Plugin | Manual    |

**Decision**: Lit 3.x — best balance of size, DX, and Drupal compatibility.

**Result**: Validated. Storybook 10.x + Vite + Lit integrated cleanly. Shadow DOM + `ElementInternals` form participation worked as expected. The 5KB runtime is consistently under budget per component.

### Design Tokens: Custom `hx-tokens` Package

We evaluated Terrazzo and Style Dictionary. Both added build pipeline complexity for what we needed. We built a lightweight custom token package (`hx-tokens`) that outputs CSS custom properties directly — no external build tool dependency, TypeScript-typed token references, and zero friction for Lit component consumption.

**Result**: The `hx-tokens` package generates `--hx-*` CSS custom properties via a TypeScript generator script. All 87 components consume tokens through the three-tier fallback pattern: `var(--hx-component-token, var(--hx-semantic-token))`.

### Testing: Vitest 3.x Browser Mode

| Criteria     | Vitest Browser | Jest + JSDOM | Web Test Runner |
| ------------ | -------------- | ------------ | --------------- |
| Real browser | Yes            | No           | Yes             |
| Speed        | Fast (2-10x)   | Slow         | Medium          |
| Storybook    | Native (v10)   | Plugin       | Manual          |
| Watch mode   | Yes            | Yes          | Yes             |

**Decision**: Vitest 3.x — real browser testing, native Storybook 10.x integration.

**Result**: Validated. Vitest browser mode with the Playwright provider runs against real Chromium. Shadow DOM queries, `ElementInternals` form participation, and custom event assertions all work correctly. We're running 100+ tests in browser mode.

**Note on version**: We're running Vitest 3.x, not 4.x. Vitest 3.x was the current stable release when this project was started and delivers everything we need.

### Documentation: Astro/Starlight + Storybook

**Dual system approach**:

- **Storybook**: Interactive component playground, visual regression, a11y testing
- **Astro/Starlight**: Comprehensive guides, architecture docs, Drupal integration tutorials

**Bridge**: Custom Elements Manifest (CEM) as single source of truth — drives Storybook autodocs and component API documentation in both systems.

**Result**: Both systems are live and integrated. CEM annotations on component source code drive automatic API documentation. The dual-system approach eliminated the "one size fits all" documentation problem: Storybook serves designers and component builders, Starlight serves Drupal teams and architects.

### Build Tool: Vite Library Mode

| Criteria     | Vite     | Rollup | esbuild |
| ------------ | -------- | ------ | ------- |
| Dev server   | Built-in | Manual | Manual  |
| Library mode | Native   | Native | Limited |
| Storybook    | Native   | Plugin | Plugin  |
| Tree-shaking | Yes      | Yes    | Partial |

**Decision**: Vite — native library mode, powers both Storybook and component build.

**Result**: Validated. Per-component entry points (`./components/*`) produce tree-shakeable ESM bundles. Drupal consumers can import only the components they use without pulling in the full library.

## Validation Results

- [x] Lit 3.x component renders in all target browsers (Chrome 90+, Firefox 88+, Safari 14+)
- [x] `hx-tokens` generates valid `--hx-*` CSS custom properties
- [x] Vitest 3.x browser mode runs tests against real Chromium
- [x] Storybook autodocs generate from CEM annotations
- [x] Starlight API pages render from CEM data
- [x] Vite library mode produces tree-shakeable ESM bundle
- [x] npm workspaces resolve cross-package dependencies
- [x] TypeScript strict mode catches type errors at build time
