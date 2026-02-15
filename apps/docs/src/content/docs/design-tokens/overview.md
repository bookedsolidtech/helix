---
title: Design Tokens Overview
description: Three-tier W3C DTCG-compliant design token system for HELIX
---

HELIX uses a **three-tier design token system** compliant with the [W3C Design Token Community Group (DTCG)](https://tr.designtokens.org/format/) specification. Tokens are generated using **Terrazzo** for multi-platform output.

## Three-Tier Architecture

```
┌────────────────────────────────────────┐
│        Component Tokens (Tier 3)       │
│  --wc-button-bg, --wc-card-padding     │
│  Component-specific, references Alias  │
├────────────────────────────────────────┤
│          Alias Tokens (Tier 2)         │
│  --wc-color-primary, --wc-space-md     │
│  Semantic meaning, references Global   │
├────────────────────────────────────────┤
│         Global Tokens (Tier 1)         │
│  --wc-blue-600, --wc-space-16          │
│  Raw values, brand-agnostic            │
└────────────────────────────────────────┘
```

## Token Categories

| Category       | Example                 | Purpose                                     |
| -------------- | ----------------------- | ------------------------------------------- |
| **Color**      | `--wc-color-primary`    | Brand colors, status colors, surfaces       |
| **Typography** | `--wc-font-size-lg`     | Font families, sizes, weights, line heights |
| **Spacing**    | `--wc-space-md`         | Padding, margins, gaps                      |
| **Border**     | `--wc-border-radius-md` | Border widths, radii, styles                |
| **Shadow**     | `--wc-shadow-elevated`  | Box shadows for elevation                   |
| **Motion**     | `--wc-duration-fast`    | Transition durations and easing             |

## Theme Support

HELIX ships with three themes:

1. **Light** - Default theme for standard usage
2. **Dark** - Dark mode with appropriate contrast
3. **High Contrast** - WCAG AAA compliance for accessibility needs

## Detailed Specification

For the complete token architecture (70,000+ words), see the [Pre-Planning: Design System & Token Architecture](/pre-planning/design-system/).

## Next Steps

- [Token Tiers](/design-tokens/tiers/) - Understanding each tier
- [Theming](/design-tokens/theming/) - How to apply themes
- [Customization](/design-tokens/customization/) - Creating custom themes
