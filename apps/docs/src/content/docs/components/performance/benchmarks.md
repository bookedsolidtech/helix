---
title: Performance Benchmarks
description: Published bundle size data and Lighthouse scores for HELiX — per-component tree-shaken sizes, full library totals, and documentation site performance.
sidebar:
  order: 0
---

# Performance Benchmarks

Real, measured performance data for HELiX. Updated on each release using automated tooling in CI.

## Bundle Size Budget

HELiX enforces two distinct bundle-size targets:

- **CI ceiling (enforced):** 16 KB gzipped per component, 200 KB gzipped total — read from [`bundle-budgets.json`](https://github.com/bookedsolidtech/helix/blob/main/bundle-budgets.json) and gated by `scripts/bundle-size-report.js --ci`. Exceeding the ceiling fails the PR.
- **Aspirational floor (regression flag):** &lt;5 KB gzipped per component / &lt;50 KB gzipped total — read from [`.bundle-budget.json`](https://github.com/bookedsolidtech/helix/blob/main/.bundle-budget.json). Going over the floor surfaces a regression flag but does not block the merge.

Sizes are measured by bundling each component individually with [esbuild](https://esbuild.github.io/), externalizing `lit`, `@helixui/tokens`, `@helixui/icons`, and `@floating-ui`. The "Full library" total in the table below is the **sum of those independently bundled per-component outputs** — it is not a single deduplicated bundle of all components. That number reflects worst-case "import every component separately" rather than what a real consumer ships.

## Per-Component Bundle Sizes

The table below is a **historical snapshot** from an earlier release. Run `node scripts/bundle-size-report.js --markdown` against the current `main` to regenerate it; the values, the "72 components" count, and the over-budget list below all change with the source.

The shipped library currently exposes 81 component directories that register 102 custom elements (`packages/hx-library/custom-elements.json` is authoritative). Re-render this section against the live report before relying on the numbers.

Measured with `node scripts/bundle-size-report.js` (tree-shaken, minified, gzipped):

| Component                 |           Raw |       Gzipped |  Budget  |
| :------------------------ | ------------: | ------------: | :------: |
| `hx-accordion`            |       8.05 KB |       2.79 KB |   Pass   |
| `hx-action-bar`           |       6.78 KB |       2.33 KB |   Pass   |
| `hx-alert`                |      10.69 KB |       3.23 KB |   Pass   |
| `hx-avatar`               |       6.53 KB |       2.34 KB |   Pass   |
| `hx-badge`                |       7.35 KB |       2.21 KB |   Pass   |
| `hx-breadcrumb`           |       8.36 KB |       2.80 KB |   Pass   |
| `hx-button`               |       8.17 KB |       2.38 KB |   Pass   |
| `hx-button-group`         |       4.05 KB |       1.16 KB |   Pass   |
| `hx-card`                 |       7.41 KB |       2.17 KB |   Pass   |
| `hx-carousel`             |      17.71 KB |       4.39 KB |   Pass   |
| `hx-checkbox`             |      12.40 KB |       3.40 KB |   Pass   |
| `hx-checkbox-group`       |       6.70 KB |       2.15 KB |   Pass   |
| `hx-code-snippet`         |       9.39 KB |       2.72 KB |   Pass   |
| `hx-color-picker`         |      22.58 KB |       5.60 KB |   Over   |
| `hx-combobox`             |      24.15 KB |       5.82 KB |   Over   |
| `hx-container`            |       2.78 KB |       0.93 KB |   Pass   |
| `hx-copy-button`          |       6.08 KB |       2.16 KB |   Pass   |
| `hx-data-table`           |      12.13 KB |       3.73 KB |   Pass   |
| `hx-date-picker`          |      26.58 KB |       6.29 KB |   Over   |
| `hx-dialog`               |      11.34 KB |       3.42 KB |   Pass   |
| `hx-divider`              |       3.85 KB |       1.42 KB |   Pass   |
| `hx-drawer`               |      13.87 KB |       3.82 KB |   Pass   |
| `hx-dropdown`             |       6.34 KB |       2.31 KB |   Pass   |
| `hx-field`                |       8.68 KB |       2.62 KB |   Pass   |
| `hx-field-label`          |       2.33 KB |       1.01 KB |   Pass   |
| `hx-file-upload`          |      14.95 KB |       4.27 KB |   Pass   |
| `hx-form`                 |       5.64 KB |       1.98 KB |   Pass   |
| `hx-format-date`          |       4.26 KB |       1.66 KB |   Pass   |
| `hx-grid`                 |       2.72 KB |       1.08 KB |   Pass   |
| `hx-help-text`            |       3.55 KB |       1.30 KB |   Pass   |
| `hx-icon`                 |       5.31 KB |       2.06 KB |   Pass   |
| `hx-image`                |       4.70 KB |       1.62 KB |   Pass   |
| `hx-link`                 |       4.83 KB |       1.77 KB |   Pass   |
| `hx-list`                 |      10.29 KB |       2.82 KB |   Pass   |
| `hx-menu`                 |      10.93 KB |       3.37 KB |   Pass   |
| `hx-meter`                |       4.88 KB |       1.79 KB |   Pass   |
| `hx-nav`                  |      12.81 KB |       3.51 KB |   Pass   |
| `hx-number-input`         |      16.58 KB |       4.19 KB |   Pass   |
| `hx-overflow-menu`        |       8.22 KB |       2.75 KB |   Pass   |
| `hx-pagination`           |      12.28 KB |       3.17 KB |   Pass   |
| `hx-popover`              |       7.04 KB |       2.41 KB |   Pass   |
| `hx-popup`                |       5.57 KB |       2.00 KB |   Pass   |
| `hx-progress-bar`         |       6.09 KB |       2.02 KB |   Pass   |
| `hx-progress-ring`        |       6.67 KB |       2.08 KB |   Pass   |
| `hx-prose`                |       2.11 KB |       0.96 KB |   Pass   |
| `hx-radio-group`          |      12.27 KB |       3.50 KB |   Pass   |
| `hx-rating`               |       8.57 KB |       2.67 KB |   Pass   |
| `hx-select`               |      20.72 KB |       5.18 KB |   Over   |
| `hx-side-nav`             |      15.29 KB |       3.92 KB |   Pass   |
| `hx-skeleton`             |       3.50 KB |       1.34 KB |   Pass   |
| `hx-slider`               |      14.90 KB |       4.03 KB |   Pass   |
| `hx-spinner`              |       4.85 KB |       1.82 KB |   Pass   |
| `hx-split-button`         |      15.13 KB |       3.47 KB |   Pass   |
| `hx-split-panel`          |       8.80 KB |       2.57 KB |   Pass   |
| `hx-stack`                |       2.99 KB |       0.95 KB |   Pass   |
| `hx-status-indicator`     |       3.52 KB |       1.21 KB |   Pass   |
| `hx-steps`                |      12.75 KB |       3.09 KB |   Pass   |
| `hx-structured-list`      |       3.43 KB |       1.14 KB |   Pass   |
| `hx-switch`               |       9.47 KB |       2.72 KB |   Pass   |
| `hx-tabs`                 |      12.68 KB |       3.61 KB |   Pass   |
| `hx-tag`                  |       6.82 KB |       2.23 KB |   Pass   |
| `hx-text`                 |       5.77 KB |       1.48 KB |   Pass   |
| `hx-text-input`           |      11.70 KB |       3.11 KB |   Pass   |
| `hx-textarea`             |      10.47 KB |       2.86 KB |   Pass   |
| `hx-theme`                |       4.55 KB |       1.76 KB |   Pass   |
| `hx-time-picker`          |      18.79 KB |       5.13 KB |   Over   |
| `hx-toast`                |       9.53 KB |       2.92 KB |   Pass   |
| `hx-toggle-button`        |       8.87 KB |       2.37 KB |   Pass   |
| `hx-tooltip`              |       5.63 KB |       2.11 KB |   Pass   |
| `hx-top-nav`              |       8.33 KB |       2.61 KB |   Pass   |
| `hx-tree-view`            |      10.90 KB |       3.21 KB |   Pass   |
| `hx-visually-hidden`      |       1.31 KB |       0.63 KB |   Pass   |
|                           |               |               |          |
| **Total (72 components)** | **655.26 KB** | **191.59 KB** | **Pass** |

### Size Distribution

- **Smallest:** `hx-visually-hidden` (0.63 KB gzipped)
- **Largest:** `hx-date-picker` (6.29 KB gzipped)
- **Median:** ~2.4 KB gzipped
- **67 of 72 components** are under the 5 KB budget

### Components Over the Aspirational Floor

Against the **aspirational 5 KB floor**, a handful of complex widgets historically exceeded it — calendar rendering, color space conversion, and typeahead logic carry weight that's hard to compress further. Against the **CI-enforced 16 KB ceiling**, zero shipping components are currently over budget; `node scripts/bundle-size-report.js --ci` exits non-zero only when a component blows the ceiling, not when it merely crosses the floor.

To see the current over-floor list against your local source:

```bash
node scripts/bundle-size-report.js --markdown | grep -E "Over|over"
```

Optimization work for components that hover above the floor is tracked in the project backlog.

## Lighthouse Scores (manual, not a CI artifact)

There is no Lighthouse CI workflow wired into the repo at the moment — these numbers come from **manual, dated Lighthouse runs** against the production documentation site ([helix.bookedsolid.tech](https://helix.bookedsolid.tech)) and should be retaken before relying on them. The table is illustrative of the target band, not a continuously regenerated artifact:

| Metric         | Score (latest manual) | Target |
| :------------- | --------------------: | -----: |
| Performance    |                   95+ |     90 |
| Accessibility  |                   100 |    100 |
| Best Practices |                   100 |     95 |
| SEO            |                   100 |     90 |

The docs site uses Astro Starlight's static-generation output. It is **not** a zero-JS surface — Astro injects an inline browser script for view transitions, and Starlight ships small interactive components (search input, theme/version toggles, sidebar collapse). The hydrated JS footprint is intentionally minimal, but "zero client-side JavaScript" overstates it; we'd describe it as _static-first with a thin interactive surface_.

### Core Web Vitals

| Metric                          |      Value |  Threshold |
| :------------------------------ | ---------: | ---------: |
| Largest Contentful Paint (LCP)  |  &lt; 2.5s |  &lt; 2.5s |
| Interaction to Next Paint (INP) | &lt; 200ms | &lt; 200ms |
| Cumulative Layout Shift (CLS)   |   &lt; 0.1 |   &lt; 0.1 |

## How to Run Locally

### Bundle Size Report

```bash
# Human-readable table
node scripts/bundle-size-report.js

# JSON output (for tooling integration)
node scripts/bundle-size-report.js --json

# Markdown table (for documentation updates)
node scripts/bundle-size-report.js --markdown

# CI mode (exits non-zero on budget violations)
node scripts/bundle-size-report.js --ci
```

### Lighthouse

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run against production site
lhci autorun --collect.url=https://helix.bookedsolid.tech

# Run against local dev server
lhci autorun --collect.url=http://localhost:3150
```

## CI Enforcement

Bundle sizes are checked on every pull request:

1. **Per-component CI ceiling:** Each component is individually tree-shaken and measured. The configured ceiling is **16 KB gzipped** per component (`bundle-budgets.json`). Exceeding the ceiling fails the PR.
2. **Per-component floor:** A separate 5 KB aspirational floor (`.bundle-budget.json`) surfaces a regression flag without blocking — useful for catching gradual growth.
3. **Full-library total:** `bundle-size-report --ci` currently exits non-zero **only on per-component ceiling violations**; the 200 KB total is reported but not (yet) wired as a hard failure condition. Track that gap as a follow-up if you need a total-failure gate.

See `.github/workflows/ci.yml` for the full configuration.

## Comparison with Alternatives

| Library          |                     Button Size (gz) |                     Full Bundle (gz) | Tree-Shakeable |
| :--------------- | -----------------------------------: | -----------------------------------: | :------------: |
| **HELiX**        | regenerate from `bundle-size-report` | regenerate from `bundle-size-report` |    **Yes**     |
| shadcn/ui        |                              ~3-5 KB |                     N/A (copy-paste) |    Partial     |
| Radix Primitives |                              ~2-4 KB |                          ~150-200 KB |      Yes       |
| Material Web     |                              ~5-8 KB |                             ~300+ KB |      Yes       |

_Note: Comparisons are approximate and the third-party numbers are uncited estimates — treat them as a directional sanity check, not a benchmark. HELiX externalizes Lit (~16 KB gzipped), which consumers typically already have in their dependency tree. shadcn/ui externalizes React (~40 KB gzipped). Run `bundle-size-report --markdown` to fill in the live HELiX row before publishing._

## Methodology

Bundle sizes are measured using the following methodology:

1. **Tool:** [esbuild](https://esbuild.github.io/) with tree-shaking and minification enabled
2. **Externals:** `lit`, `@lit/*`, `@helixui/tokens`, `@floating-ui/*` are externalized (not counted)
3. **Format:** ES modules
4. **Compression:** gzip (standard level)
5. **Measurement:** Each component is bundled independently from its source entry point
6. **Automation:** `scripts/bundle-size-report.js` generates all data programmatically
