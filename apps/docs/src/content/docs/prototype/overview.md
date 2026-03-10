---
title: Phase 0 Overview
description: How we validated the HELIX architecture before committing to 85 components
---

> **Status**: Complete
> **Completed**: February 2026

---

## What Phase 0 Was For

Before committing to a 85-component library, we built a thin vertical slice — three components that exercised every layer of the architecture. The goal was simple: find the hard problems before they became expensive problems.

Every integration point that could fail was stressed:

- Component authoring (Lit 3.x with TypeScript)
- Design token consumption from the `hx-tokens` package
- Storybook integration (autodocs, controls, a11y addon)
- CEM generation feeding API documentation
- Drupal TWIG template rendering
- Vitest browser mode tests against real Chromium
- Vite library mode build and per-component entry points

## What We Delivered

| Deliverable               | Description                                                    | Status   |
| ------------------------- | -------------------------------------------------------------- | -------- |
| Monorepo setup            | npm workspaces + Turborepo, TypeScript strict, ESLint/Prettier | Complete |
| `hx-button` component     | First proof-of-concept component                               | Complete |
| `hx-card` component       | Content card with slots and variants                           | Complete |
| `hx-text-input` component | Form input with validation and ElementInternals                | Complete |
| Design token pipeline     | `hx-tokens` package → CSS custom properties consumed by Lit    | Complete |
| Storybook instance        | Stories, autodocs, a11y testing                                | Complete |
| Docs site                 | Astro/Starlight with initial architecture docs                 | Complete |
| Vitest testing            | Browser-mode unit testing via Playwright/Chromium              | Complete |

## What We Learned

The prototype surface-tested the obvious failure modes but the real lessons came from edge cases. The Storybook 10.x + Vite + Lit integration worked first time — no surprises. The harder problem was Shadow DOM CSS isolation in Drupal's theming pipeline, which forced us to establish the `--hx-*` token convention early.

For the full retrospective, see the [Architecture decisions](/architecture/overview/) and the [Build Pipeline documentation](/architecture/build-pipeline/).

## Where This Led

Phase 0 proved the stack. Everything that came after — all 85 components — is built on the patterns we established here. The [Planning & Discovery](/pre-planning/overview/) documents capture the comprehensive build plan that followed.
