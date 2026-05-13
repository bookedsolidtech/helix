---
title: Token Reference
description: Complete reference of all HELiX design tokens organized by category.
---

## Overview

HELiX ships ~464 design token leaves across 30 categories (light mode, dark mode, high contrast, plus
container, focus, transition, etc.). All tokens use the `--hx-` prefix. Light-mode token sheets are
adopted on `:root` via `document.adoptedStyleSheets`; dark and high-contrast overrides are applied
through scoped adopted stylesheets (driven by `hx-theme` or the `prefers-color-scheme` /
`forced-colors` media queries) rather than written to `:root` directly.

This reference is an overview, not an exhaustive list — the source of truth is{' '}
`packages/hx-tokens/src/tokens.json`. The categories below cover the most commonly consumed surface;
container widths, component-prefixed tokens, easing, opacity, transform, and aspect-ratio tokens
also exist and are documented in the source.

## Color (144 light-mode tokens)

Eight color ramps with 11 shades each (50–950), plus neutral with shade 0 (white). On top of the
ramps, the color subtree exposes semantic surfaces (`surface`, `border`, `text`, `action`,
`focus-ring`, `selection`, `accent`) and ramp-shorthand text tokens (`error-text`, `success-text`).

| Ramp | Usage |
|------|-------|
| `--hx-color-primary-*` | Primary brand actions, links, focus rings |
| `--hx-color-secondary-*` | Secondary actions, accents |
| `--hx-color-accent-*` | Decorative highlights |
| `--hx-color-neutral-*` | Backgrounds, borders, text |
| `--hx-color-success-*` | Success states, confirmations |
| `--hx-color-warning-*` | Warning states, caution indicators |
| `--hx-color-error-*` | Error states, destructive actions |
| `--hx-color-info-*` | Informational states |

### Semantic Text Colors

Use these for text content. Both tokens are AAA-strict (1.4.6, ≥7:1) on light surfaces.

| Token | Resolves to | Usage |
|-------|-------------|-------|
| `--hx-color-error-text` | `error-700` (#A21312, 7.96:1 on white) | Error message text |
| `--hx-color-success-text` | `success-800` (#0B4D23, 10.00:1 on white) | Success message text |

There is no `--hx-color-warning-text` token in the current source. For warning text, render against
the `surface.warning` callout backgrounds and use `--hx-color-text-primary` (or the appropriate
`text.on-warning` token from the on-color set).

Run `node scripts/token-contrast-audit.js` to verify contrast compliance against the live token
values.

## Spacing (22 tokens)

```
--hx-space-0     0
--hx-space-px    1px
--hx-space-0-5   0.125rem
--hx-space-1     0.25rem
--hx-space-1-5   0.375rem
--hx-space-2     0.5rem
--hx-space-3     0.75rem
--hx-space-4     1rem
--hx-space-5     1.25rem
--hx-space-6     1.5rem
--hx-space-7     1.75rem
--hx-space-8     2rem
--hx-space-10    2.5rem
--hx-space-12    3rem
--hx-space-14    3.5rem
--hx-space-16    4rem
--hx-space-20    5rem
--hx-space-24    6rem
--hx-space-32    8rem
--hx-space-40    10rem
--hx-space-48    12rem
--hx-space-64    16rem
```

## Typography (19 tokens)

### Font Family

| Token | Value |
|-------|-------|
| `--hx-font-family-sans` | Inter, system stack |
| `--hx-font-family-mono` | JetBrains Mono, monospace stack |

### Font Size

| Token | Value |
|-------|-------|
| `--hx-font-size-xs` | 0.75rem |
| `--hx-font-size-sm` | 0.875rem |
| `--hx-font-size-md` | 1rem |
| `--hx-font-size-lg` | 1.125rem |
| `--hx-font-size-xl` | 1.25rem |
| `--hx-font-size-2xl` | 1.5rem |
| `--hx-font-size-3xl` | 1.875rem |
| `--hx-font-size-4xl` | 2.25rem |

### Font Weight

| Token | Value |
|-------|-------|
| `--hx-font-weight-light` | 300 |
| `--hx-font-weight-normal` | 400 |
| `--hx-font-weight-medium` | 500 |
| `--hx-font-weight-semibold` | 600 |
| `--hx-font-weight-bold` | 700 |

## Border (11 tokens)

| Token | Value | Usage |
|-------|-------|-------|
| `--hx-border-width-thin` | 1px | Standard borders |
| `--hx-border-width-medium` | 2px | Emphasis borders |
| `--hx-border-width-thick` | 3px | Heavy borders |
| `--hx-border-radius-none` | 0 | Square corners |
| `--hx-border-radius-sm` | 0.25rem | Subtle rounding |
| `--hx-border-radius-md` | 0.375rem | Standard rounding |
| `--hx-border-radius-lg` | 0.5rem | Card rounding |
| `--hx-border-radius-xl` | 0.75rem | Large card rounding |
| `--hx-border-radius-2xl` | 1rem | Modal rounding |
| `--hx-border-radius-full` | 9999px | Pill/circle |

## Shadow (7 tokens)

| Token | Usage |
|-------|-------|
| `--hx-shadow-none` | No shadow |
| `--hx-shadow-sm` | Cards, inputs |
| `--hx-shadow-md` | Dropdowns, menus |
| `--hx-shadow-lg` | Modals, drawers |
| `--hx-shadow-xl` | Elevated panels |
| `--hx-shadow-2xl` | Maximum elevation |
| `--hx-shadow-inner` | Inset shadow |

## Focus (6 tokens)

| Token | Value | Usage |
|-------|-------|-------|
| `--hx-focus-ring-width` | 2px | Focus ring thickness |
| `--hx-focus-ring-offset` | 2px | Gap between element and ring |
| `--hx-focus-ring-color` | primary-500 | Focus ring color |

## Touch Targets (2 tokens)

| Token | Value | Usage |
|-------|-------|-------|
| `--hx-touch-target-min` | 2.75rem | Minimum interactive element size (WCAG 2.5.5 minimum, 2.5.5 enhanced for AAA) |
| `--hx-touch-target-size` | 44px | Explicit 44px target size — WCAG 2.5.5 Target Size (Enhanced, AAA) |

## Transitions (4 tokens)

| Token | Value |
|-------|-------|
| `--hx-transition-base` | 150ms ease |
| `--hx-transition-fast` | 150ms ease |
| `--hx-transition-normal` | 250ms ease |
| `--hx-transition-slow` | 350ms ease |

## Z-Index (9 tokens)

| Token | Value | Usage |
|-------|-------|-------|
| `--hx-z-index-base` | 0 | Default layer |
| `--hx-z-index-dropdown` | 1000 | Dropdowns, menus |
| `--hx-z-index-sticky` | 1100 | Sticky headers |
| `--hx-z-index-fixed` | 1200 | Fixed elements |
| `--hx-z-index-backdrop` | 1300 | Dialog / drawer backdrop |
| `--hx-z-index-modal` | 1400 | Modals, dialogs, drawers |
| `--hx-z-index-popover` | 1500 | Popovers |
| `--hx-z-index-tooltip` | 1600 | Tooltips |
| `--hx-z-index-toast` | 1700 | Toast notifications |

## Opacity (11 tokens)

| Token | Value |
|-------|-------|
| `--hx-opacity-0` | 0 |
| `--hx-opacity-5` | 0.05 |
| `--hx-opacity-10` | 0.1 |
| `--hx-opacity-25` | 0.25 |
| `--hx-opacity-50` | 0.5 |
| `--hx-opacity-75` | 0.75 |
| `--hx-opacity-90` | 0.9 |
| `--hx-opacity-100` | 1 |
| `--hx-opacity-disabled` | 0.5 |

## Breakpoints (5 tokens)

| Token | Value |
|-------|-------|
| `--hx-breakpoint-sm` | 640px |
| `--hx-breakpoint-md` | 768px |
| `--hx-breakpoint-lg` | 1024px |
| `--hx-breakpoint-xl` | 1280px |
| `--hx-breakpoint-2xl` | 1536px |

## Dark Mode & High Contrast

HELiX ships 42 dark-mode token overrides and 74 high-contrast (forced-colors) overrides in
`tokens.json`. Mode overrides are delivered via scoped adopted stylesheets — `hx-theme` toggles the
scope explicitly, and the package also reacts to `prefers-color-scheme` and `forced-colors` media
queries when consumer markup opts in.

See the [Theming guide](/design-tokens/theming/) for dark mode and forced-colors configuration.
