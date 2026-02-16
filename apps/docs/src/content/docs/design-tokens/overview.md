---
title: Design Tokens Overview
description: Three-tier design token system for the HELIX enterprise healthcare component library
---

HELIX uses a **three-tier design token system** with CSS custom properties. Tokens are generated using a **custom build pipeline (`generate-css.ts`)** that reads `tokens.json` and outputs production CSS.

## Three-Tier Architecture

```
┌────────────────────────────────────────────┐
│         Component Tokens (Tier 3)          │
│  --hx-button-bg, --hx-card-padding        │
│  Component-specific, references Semantic   │
├────────────────────────────────────────────┤
│          Semantic Tokens (Tier 2)          │
│  --hx-color-text-primary, --hx-body-bg    │
│  Semantic meaning, references Primitive    │
├────────────────────────────────────────────┤
│         Primitive Tokens (Tier 1)          │
│  --hx-color-primary-500, --hx-space-4     │
│  Raw values, brand-agnostic               │
└────────────────────────────────────────────┘
```

## Token Categories

| Category           | Count                | Example                     | Purpose                              |
| ------------------ | -------------------- | --------------------------- | ------------------------------------ |
| **Color**          | 8 ramps + semantic   | `--hx-color-primary-500`    | Brand, status, surface, text, border |
| **Space**          | 20                   | `--hx-space-4`              | Padding, margins, gaps               |
| **Font**           | family, size, weight | `--hx-font-size-lg`         | Font families, sizes, weights        |
| **Line Height**    | 5                    | `--hx-line-height-normal`   | Text line heights                    |
| **Letter Spacing** | 6                    | `--hx-letter-spacing-tight` | Tracking                             |
| **Border**         | radius + width       | `--hx-border-radius-md`     | Border radii and widths              |
| **Shadow**         | 7                    | `--hx-shadow-lg`            | Box shadows for elevation            |
| **Duration**       | 6                    | `--hx-duration-fast`        | Animation/transition durations       |
| **Easing**         | 5                    | `--hx-easing-default`       | Timing functions                     |
| **Transition**     | 3                    | `--hx-transition-normal`    | Shorthand transitions                |
| **Focus**          | 5                    | `--hx-focus-ring-width`     | Focus ring styling                   |
| **Z-Index**        | 9                    | `--hx-z-index-modal`        | Stacking layers                      |
| **Opacity**        | 10                   | `--hx-opacity-disabled`     | Transparency levels                  |
| **Size**           | 12                   | `--hx-size-touch-target`    | Fixed dimensions                     |
| **Container**      | 5                    | `--hx-container-lg`         | Layout widths                        |
| **Breakpoint**     | 5                    | `--hx-breakpoint-md`        | Responsive breakpoints               |

## Theme Support

HELIX ships with two themes:

1. **Light** -- Default theme for standard usage
2. **Dark** -- Dark mode with adjusted contrast, surfaces, and shadows

Themes are applied via `data-theme="dark"` on the document root or automatically via `@media (prefers-color-scheme: dark)`.

## Build Pipeline

Tokens are defined in `tokens.json` and processed by `generate-css.ts` to output:

- `:root` CSS with all light-mode tokens
- `@media (prefers-color-scheme: dark)` overrides
- `[data-theme="dark"]` manual override block
- Lit `CSSResult` for shadow DOM consumption

## Next Steps

- [Token Tiers](/design-tokens/tiers/) -- Understanding each tier
- [Theming](/design-tokens/theming/) -- How to apply themes
- [Customization](/design-tokens/customization/) -- Overriding tokens for your brand
