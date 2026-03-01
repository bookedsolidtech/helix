# PRD: Helix Design System Expansion Roadmap

## Situation
Helix (wc-2026) is an enterprise healthcare web component library built on Lit 3.x with 13 prototype components (hx-button, hx-card, hx-text-input, hx-alert, hx-badge, hx-checkbox, hx-container, hx-form, hx-prose, hx-radio-group, hx-select, hx-switch, hx-textarea). The library has working Storybook, Starlight docs, admin dashboard, and Vitest browser tests but components are at prototype quality, not production-grade.

## Problem
The 13 existing components lack complete test coverage (80%+), comprehensive accessibility audits, full Storybook stories, extension API contracts, and production token architecture. The library needs to expand to 50+ components, support React/Vue/Angular via CEM-generated wrappers, provide a Tailwind preset and CLI, build an observability platform, and reach enterprise readiness with white-labeling and support tiers.

## Approach
5-phase roadmap: Phase 1 (months 1-3) hardens existing 13 components to Grade A health scores with W3C DTCG token pipeline, 80%+ test coverage, and npm publish. Phase 2 (months 4-8) adds 12 Tier 1 primitives + 10 Tier 2 composed components + CLI + Tailwind preset. Phase 3 (months 9-12) generates framework adapters from CEM. Phase 4 (months 13-18) builds Supabase-backed observability. Phase 5 (months 19-24) delivers enterprise features.

## Results
Production-grade library with 50+ components, @helix/react + @helix/vue + @helix/angular adapters, @helix/cli + @helix/tailwind-preset tooling, Supabase-backed observability platform (Panopticon v2), enterprise white-labeling and support tiers. npm published as @helixds namespace under MIT license.

## Constraints
All components must pass 7-gate quality pipeline (TypeScript strict, 80%+ test coverage, WCAG 2.1 AA, Storybook stories, CEM accuracy, <5KB per component, 3-tier code review),Healthcare mandate: WCAG 2.1 AA minimum, zero accessibility regressions,Shadow DOM encapsulation with --hx-* design tokens as only theming mechanism,CEM is single source of truth for Storybook, Starlight, framework adapters, Drupal SDC, MCP servers,Three-tier token fallback: var(--hx-COMPONENT-PROP, var(--hx-SEMANTIC-TOKEN, HARDCODED)),Drupal compatibility: all components work in Twig templates without modification,Bundle budget: <5KB per component gzipped, <50KB full bundle
