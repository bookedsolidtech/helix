---
title: Interview Prep
description: Technical preparation materials and key talking points for the WC-2026 project
---

> **Context**: Materials prepared for the tech lead position presentation
> **Date**: Monday, February 17, 2026

---

## Key Talking Points

### 1. CEM as Single Source of Truth
- Custom Elements Manifest powers both Storybook autodocs and Starlight API pages
- Eliminates manual documentation drift
- JSDoc annotations drive 100% documentation coverage

### 2. Healthcare Compliance Leadership
- WCAG 2.1 AA legally mandated (HHS May 2026)
- WCAG AAA targets for competitive advantage
- 4-level accessibility testing strategy
- High contrast mode and reduced motion support

### 3. Drupal-First Integration Strategy
- Zero coupling (library is framework-agnostic)
- Component APIs designed for Drupal field structures
- Complete TWIG integration examples in Storybook
- Minimal Drupal team effort (comprehensive integration guide)

### 4. Enterprise-Grade Architecture
- W3C DTCG-compliant design tokens (2025.10 spec)
- Vitest 4.x Browser Mode (2-10x faster than Jest)
- Storybook 10.x with native Vitest integration
- Terrazzo for cutting-edge token generation

### 5. Dual Documentation System
- Storybook for interactive design system
- Astro/Starlight for comprehensive guides
- Unified search across both systems (Pagefind)
- Audience-specific documentation (builders, Drupal teams, designers)

### 6. Latest 2025-2026 Technologies
- Lit 3.x Reactive Controllers (vs. mixins)
- Form-associated custom elements (ElementInternals)
- Shadow DOM CSS Parts for escape-hatch styling
- OKLCH color space for perceptual consistency
- Container queries for responsive components

### 7. Production-Ready Testing
- 60/30/10 test pyramid
- Visual regression with Chromatic
- Accessibility automation with axe-core
- Real browser testing (not JSDOM)

---

## Demo Walkthrough

### Architecture Overview
- Monorepo with npm workspaces + Turborepo
- Library as standalone npm package, Storybook as dev environment
- CEM as the contract between systems
- 3-tier design token system aligned with W3C spec

### Healthcare Expertise
- HHS accessibility mandate (May 2026 deadline)
- WCAG AAA targets, not just AA minimum
- 4-level accessibility testing strategy catches issues early

### Drupal Understanding
- 12 complete component specifications with TWIG examples
- 3 library installation methods for Drupal teams
- Understanding of the Drupal render pipeline (preprocess, TWIG, behaviors)

### Documentation Strategy
- Dual system: Storybook for design system, Starlight for guides
- Audience segmentation: component builders, Drupal teams, designers
- Single source of truth prevents documentation drift

---

## Build Plan Summary

This project encompasses a 6-document comprehensive build plan:

1. **[Planning & Discovery Overview](/pre-planning/overview)** - Project scope, objectives, success criteria
2. **[Architecture & System Design](/pre-planning/architecture)** - Monorepo structure, build pipeline, CI/CD
3. **[Component Architecture](/pre-planning/components)** - Lit patterns, Storybook integration, 40+ component specs
4. **[Design System & Tokens](/pre-planning/design-system)** - 3-tier W3C DTCG token system
5. **[Documentation Hub](/pre-planning/docs-hub)** - Astro/Starlight + Storybook dual system
6. **[Component Building Guide](/pre-planning/building-guide)** - Step-by-step developer guide
7. **[Drupal Integration Guide](/pre-planning/drupal-guide)** - TWIG templates, behaviors, installation

### Key Numbers
- **40+** component specifications
- **44+** authoritative sources researched
- **3** design token tiers (global, semantic, component)
- **6** comprehensive documentation sections
- **4** testing levels (unit, visual, a11y, integration)
