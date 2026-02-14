---
title: Phase 0 Overview
description: Rapid prototyping phase - validate core technology decisions before full implementation
---

> **Status**: In Progress
> **Timeline**: February 2026
> **Goal**: Validate core technology stack and architecture decisions through working prototypes

---

## Objectives

1. **Validate Technology Stack** - Confirm Lit 3.x + Storybook 10.x + Astro/Starlight work together seamlessly
2. **Prove Component Architecture** - Build 2-3 proof-of-concept components that demonstrate the full pattern
3. **Test Drupal Integration** - Verify web components render correctly in Drupal TWIG templates
4. **Establish Build Pipeline** - Set up monorepo, TypeScript, build tooling, and CI/CD
5. **Create Documentation Hub** - Stand up the Astro/Starlight docs site with initial content

## What This Phase Covers

Phase 0 is about **reducing risk** before committing to a full 40+ component build. By building a small vertical slice (button, card, form field), we validate every layer of the architecture:

- Component authoring (Lit 3.x with TypeScript)
- Design tokens (Terrazzo + W3C DTCG format) *(planned)*
- Storybook integration (autodocs, controls, a11y addon) *(complete)*
- Documentation generation (CEM → Starlight API pages)
- Drupal integration (TWIG templates, behaviors)
- Testing (Vitest browser mode, axe-core) *(planned)*
- Build & publish (Vite library mode, npm package)

## Phase 0 Deliverables

| Deliverable | Description | Status |
|------------|-------------|--------|
| Monorepo setup | npm workspaces + Turborepo, TypeScript strict, ESLint/Prettier | Complete |
| `wc-button` component | First proof-of-concept component | Complete |
| `wc-card` component | Content card with slots and variants | Complete |
| `wc-text-input` component | Form input with validation and ElementInternals | Complete |
| Design token pipeline | Terrazzo config → CSS custom properties | Planned |
| Storybook instance | Stories, autodocs, a11y testing | Complete |
| Docs site | Astro/Starlight with initial architecture docs | Complete |
| Vitest testing | Browser-mode unit testing | Planned |
| Drupal prototype | TWIG template rendering web components | Planned |

## Success Criteria

- [ ] `wc-button` renders in Storybook with full controls
- [ ] Design tokens generate correctly from DTCG JSON
- [ ] Components pass axe-core accessibility audit
- [ ] TWIG template successfully renders `wc-button`
- [ ] CEM generates accurate API documentation
- [ ] Vitest browser tests pass for all prototype components
- [ ] Documentation site builds and deploys

## Next Phase

Once Phase 0 validates the architecture, [Planning & Discovery](/pre-planning/overview) provides the comprehensive build plan for the full 40+ component library.
