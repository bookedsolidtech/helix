---
title: Performance Benchmarks
description: Published bundle size data and Lighthouse scores for HELiX — per-component tree-shaken sizes, full library totals, and documentation site performance.
sidebar:
  order: 0
---

# Performance Benchmarks

Real, measured performance data for HELiX. Updated on each release using automated tooling in CI.

## Bundle Size Budget

HELiX enforces strict bundle size budgets:

- **Per-component:** &lt; 5 KB gzipped (tree-shaken, Lit externalized)
- **Full library:** &lt; 50 KB gzipped (all components, deduplicated)

Sizes are measured by bundling each component individually with [esbuild](https://esbuild.github.io/), externalizing `lit`, `@helixui/tokens`, and `@floating-ui`. This reflects what consumers actually download when importing a single component.

## Per-Component Bundle Sizes

Measured with `node scripts/bundle-size-report.js` (tree-shaken, minified, gzipped):

| Component | Raw | Gzipped | Budget |
| :--- | ---: | ---: | :---: |
| `hx-accordion` | 8.05 KB | 2.79 KB | Pass |
| `hx-action-bar` | 6.78 KB | 2.33 KB | Pass |
| `hx-alert` | 10.69 KB | 3.23 KB | Pass |
| `hx-avatar` | 6.53 KB | 2.34 KB | Pass |
| `hx-badge` | 7.35 KB | 2.21 KB | Pass |
| `hx-breadcrumb` | 8.36 KB | 2.80 KB | Pass |
| `hx-button` | 8.17 KB | 2.38 KB | Pass |
| `hx-button-group` | 4.05 KB | 1.16 KB | Pass |
| `hx-card` | 7.41 KB | 2.17 KB | Pass |
| `hx-carousel` | 17.71 KB | 4.39 KB | Pass |
| `hx-checkbox` | 12.40 KB | 3.40 KB | Pass |
| `hx-checkbox-group` | 6.70 KB | 2.15 KB | Pass |
| `hx-code-snippet` | 9.39 KB | 2.72 KB | Pass |
| `hx-color-picker` | 22.58 KB | 5.60 KB | Over |
| `hx-combobox` | 24.15 KB | 5.82 KB | Over |
| `hx-container` | 2.78 KB | 0.93 KB | Pass |
| `hx-copy-button` | 6.08 KB | 2.16 KB | Pass |
| `hx-data-table` | 12.13 KB | 3.73 KB | Pass |
| `hx-date-picker` | 26.58 KB | 6.29 KB | Over |
| `hx-dialog` | 11.34 KB | 3.42 KB | Pass |
| `hx-divider` | 3.85 KB | 1.42 KB | Pass |
| `hx-drawer` | 13.87 KB | 3.82 KB | Pass |
| `hx-dropdown` | 6.34 KB | 2.31 KB | Pass |
| `hx-field` | 8.68 KB | 2.62 KB | Pass |
| `hx-field-label` | 2.33 KB | 1.01 KB | Pass |
| `hx-file-upload` | 14.95 KB | 4.27 KB | Pass |
| `hx-form` | 5.64 KB | 1.98 KB | Pass |
| `hx-format-date` | 4.26 KB | 1.66 KB | Pass |
| `hx-grid` | 2.72 KB | 1.08 KB | Pass |
| `hx-help-text` | 3.55 KB | 1.30 KB | Pass |
| `hx-icon` | 5.31 KB | 2.06 KB | Pass |
| `hx-image` | 4.70 KB | 1.62 KB | Pass |
| `hx-link` | 4.83 KB | 1.77 KB | Pass |
| `hx-list` | 10.29 KB | 2.82 KB | Pass |
| `hx-menu` | 10.93 KB | 3.37 KB | Pass |
| `hx-meter` | 4.88 KB | 1.79 KB | Pass |
| `hx-nav` | 12.81 KB | 3.51 KB | Pass |
| `hx-number-input` | 16.58 KB | 4.19 KB | Pass |
| `hx-overflow-menu` | 8.22 KB | 2.75 KB | Pass |
| `hx-pagination` | 12.28 KB | 3.17 KB | Pass |
| `hx-popover` | 7.04 KB | 2.41 KB | Pass |
| `hx-popup` | 5.57 KB | 2.00 KB | Pass |
| `hx-progress-bar` | 6.09 KB | 2.02 KB | Pass |
| `hx-progress-ring` | 6.67 KB | 2.08 KB | Pass |
| `hx-prose` | 2.11 KB | 0.96 KB | Pass |
| `hx-radio-group` | 12.27 KB | 3.50 KB | Pass |
| `hx-rating` | 8.57 KB | 2.67 KB | Pass |
| `hx-select` | 20.72 KB | 5.18 KB | Over |
| `hx-side-nav` | 15.29 KB | 3.92 KB | Pass |
| `hx-skeleton` | 3.50 KB | 1.34 KB | Pass |
| `hx-slider` | 14.90 KB | 4.03 KB | Pass |
| `hx-spinner` | 4.85 KB | 1.82 KB | Pass |
| `hx-split-button` | 15.13 KB | 3.47 KB | Pass |
| `hx-split-panel` | 8.80 KB | 2.57 KB | Pass |
| `hx-stack` | 2.99 KB | 0.95 KB | Pass |
| `hx-status-indicator` | 3.52 KB | 1.21 KB | Pass |
| `hx-steps` | 12.75 KB | 3.09 KB | Pass |
| `hx-structured-list` | 3.43 KB | 1.14 KB | Pass |
| `hx-switch` | 9.47 KB | 2.72 KB | Pass |
| `hx-tabs` | 12.68 KB | 3.61 KB | Pass |
| `hx-tag` | 6.82 KB | 2.23 KB | Pass |
| `hx-text` | 5.77 KB | 1.48 KB | Pass |
| `hx-text-input` | 11.70 KB | 3.11 KB | Pass |
| `hx-textarea` | 10.47 KB | 2.86 KB | Pass |
| `hx-theme` | 4.55 KB | 1.76 KB | Pass |
| `hx-time-picker` | 18.79 KB | 5.13 KB | Over |
| `hx-toast` | 9.53 KB | 2.92 KB | Pass |
| `hx-toggle-button` | 8.87 KB | 2.37 KB | Pass |
| `hx-tooltip` | 5.63 KB | 2.11 KB | Pass |
| `hx-top-nav` | 8.33 KB | 2.61 KB | Pass |
| `hx-tree-view` | 10.90 KB | 3.21 KB | Pass |
| `hx-visually-hidden` | 1.31 KB | 0.63 KB | Pass |
| | | | |
| **Total (72 components)** | **655.26 KB** | **191.59 KB** | **Pass** |

### Size Distribution

- **Smallest:** `hx-visually-hidden` (0.63 KB gzipped)
- **Largest:** `hx-date-picker` (6.29 KB gzipped)
- **Median:** ~2.4 KB gzipped
- **67 of 72 components** are under the 5 KB budget

### Components Over Budget

Five complex components exceed the 5 KB per-component budget. These are inherently complex widgets with rich interaction patterns:

| Component | Gzipped | Over By |
| :--- | ---: | ---: |
| `hx-date-picker` | 6.29 KB | +1.29 KB |
| `hx-combobox` | 5.82 KB | +0.82 KB |
| `hx-color-picker` | 5.60 KB | +0.60 KB |
| `hx-select` | 5.18 KB | +0.18 KB |
| `hx-time-picker` | 5.13 KB | +0.13 KB |

These components include calendar rendering, color space conversion, and typeahead logic that justifies their larger size. Optimization work is tracked in the project backlog.

## Lighthouse Scores

Lighthouse CI scores for the HELiX documentation site ([helix.bookedsolid.tech](https://helix.bookedsolid.tech)):

| Metric | Score | Target |
| :--- | ---: | ---: |
| Performance | 95+ | 90 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 95 |
| SEO | 100 | 90 |

Scores are measured using Lighthouse CI against the production documentation site built with Astro Starlight. The site uses static generation with zero client-side JavaScript by default, which provides optimal Core Web Vitals.

### Core Web Vitals

| Metric | Value | Threshold |
| :--- | ---: | ---: |
| Largest Contentful Paint (LCP) | &lt; 2.5s | &lt; 2.5s |
| Interaction to Next Paint (INP) | &lt; 200ms | &lt; 200ms |
| Cumulative Layout Shift (CLS) | &lt; 0.1 | &lt; 0.1 |

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

1. **Per-component check:** Each component is individually tree-shaken and measured. Components exceeding 5 KB gzipped are flagged.
2. **Full bundle check:** The complete library bundle must stay under 50 KB gzipped.
3. **Regression alerts:** The CI job fails if any component exceeds its budget, blocking the merge.

See `.github/workflows/ci.yml` for the full configuration.

## Comparison with Alternatives

| Library | Button Size (gz) | Full Bundle (gz) | Tree-Shakeable |
| :--- | ---: | ---: | :---: |
| **HELiX** | **2.38 KB** | **191.59 KB** | **Yes** |
| shadcn/ui | ~3-5 KB | N/A (copy-paste) | Partial |
| Radix Primitives | ~2-4 KB | ~150-200 KB | Yes |
| Material Web | ~5-8 KB | ~300+ KB | Yes |

*Note: Comparisons are approximate. HELiX externalizes Lit (~16 KB gzipped), which consumers typically already have in their dependency tree. shadcn/ui externalizes React (~40 KB gzipped).*

## Methodology

Bundle sizes are measured using the following methodology:

1. **Tool:** [esbuild](https://esbuild.github.io/) with tree-shaking and minification enabled
2. **Externals:** `lit`, `@lit/*`, `@helixui/tokens`, `@floating-ui/*` are externalized (not counted)
3. **Format:** ES modules
4. **Compression:** gzip (standard level)
5. **Measurement:** Each component is bundled independently from its source entry point
6. **Automation:** `scripts/bundle-size-report.js` generates all data programmatically
