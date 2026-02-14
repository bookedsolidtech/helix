---
title: Design System & Token Architecture
description: Three-tier W3C DTCG-compliant design token system with Terrazzo generation
---

> **Author**: Design System Developer Agent
> **Last Updated**: 2026-02-13
> **Status**: Complete

---

## Table of Contents

1. [Executive Summary](#31-executive-summary)
2. [3-Tier Design Token System](#32-3-tier-design-token-system)
3. [Token Naming Conventions](#33-token-naming-conventions)
4. [Token Format & Tooling](#34-token-format--tooling)
5. [Light/Dark Mode Architecture](#35-lightdark-mode-architecture)
6. [CSS Architecture for Web Components](#36-css-architecture-for-web-components)
7. [Typography System](#37-typography-system)
8. [Spacing & Layout System](#38-spacing--layout-system)
9. [Healthcare-Specific Accessibility](#39-healthcare-specific-accessibility)
10. [Storybook Integration](#310-storybook-integration)
11. [Drupal Integration Strategy](#311-drupal-integration-strategy)
12. [Implementation Roadmap](#312-implementation-roadmap)

---

## 3.1 Executive Summary

This section defines the design system architecture for an enterprise-grade Web Component library targeting healthcare organizations. The architecture is built on three foundational pillars:

1. **W3C DTCG Compliance** -- The Design Tokens Community Group released its first stable specification (2025.10) in October 2025, establishing a vendor-neutral, production-ready format for design tokens. Our token system is built natively on this standard.

2. **3-Tier Token Architecture** -- Primitive tokens define the raw palette, semantic tokens assign purpose, and component tokens bind decisions to specific UI surfaces. This separation enables multi-brand theming, accessibility modes, and white-label deployments without touching component internals.

3. **Shadow DOM + CSS Custom Properties** -- Lit Web Components use Shadow DOM for style encapsulation, but CSS custom properties (variables) pierce shadow boundaries by design. This is the primary theming mechanism: tokens are distributed as CSS custom properties and inherited through the DOM tree.

**Why this matters for healthcare**: Healthcare organizations face strict accessibility requirements (WCAG 2.1/2.2 AAA for critical content), diverse user populations (patients with low vision, motor impairments, cognitive differences), and enterprise brand management needs. A well-architected token system makes it possible to deliver accessible, branded, consistent UI across an entire content hub without per-component overrides.

---

## 3.2 3-Tier Design Token System

### Architecture Overview

```
+------------------------------------------------------------------+
|  TIER 1: PRIMITIVE TOKENS (What)                                  |
|  Raw values -- color palettes, spacing scales, type scales        |
|  No semantic meaning -- "blue-500" not "primary"                  |
|  PRIVATE to the design system -- consumers never reference these  |
+------------------------------------------------------------------+
         |  aliases/references
         v
+------------------------------------------------------------------+
|  TIER 2: SEMANTIC TOKENS (How)                                    |
|  Purpose-based -- "color-surface-primary", "color-text-danger"    |
|  Mode-aware -- light/dark/high-contrast variants                  |
|  PUBLIC API -- the primary interface for theme customization      |
+------------------------------------------------------------------+
         |  aliases/references
         v
+------------------------------------------------------------------+
|  TIER 3: COMPONENT TOKENS (Where)                                 |
|  Component-specific -- "button-bg-primary", "card-border-radius"  |
|  Override points -- fine-grained per-component customization      |
|  OPTIONAL -- defaults to semantic tokens if unset                 |
+------------------------------------------------------------------+
```

### Tier 1: Primitive Tokens

Primitive tokens define **what** styles are available. They are raw, context-free values that form the palette and scales of the design system. Consumers should never reference primitives directly -- they exist only to be aliased by semantic tokens.

```json
// tokens/primitive/color.tokens.json (DTCG 2025.10 format)
{
  "color": {
    "$type": "color",
    "blue": {
      "50":  { "$value": "oklch(0.97 0.014 240)" },
      "100": { "$value": "oklch(0.93 0.032 240)" },
      "200": { "$value": "oklch(0.87 0.058 240)" },
      "300": { "$value": "oklch(0.78 0.098 240)" },
      "400": { "$value": "oklch(0.68 0.142 240)" },
      "500": { "$value": "oklch(0.58 0.168 240)" },
      "600": { "$value": "oklch(0.50 0.172 240)" },
      "700": { "$value": "oklch(0.42 0.158 240)" },
      "800": { "$value": "oklch(0.34 0.128 240)" },
      "900": { "$value": "oklch(0.26 0.098 240)" },
      "950": { "$value": "oklch(0.18 0.068 240)" }
    },
    "neutral": {
      "0":   { "$value": "oklch(1.00 0 0)" },
      "50":  { "$value": "oklch(0.97 0.002 240)" },
      "100": { "$value": "oklch(0.93 0.004 240)" },
      "200": { "$value": "oklch(0.87 0.006 240)" },
      "300": { "$value": "oklch(0.78 0.008 240)" },
      "400": { "$value": "oklch(0.62 0.010 240)" },
      "500": { "$value": "oklch(0.50 0.010 240)" },
      "600": { "$value": "oklch(0.42 0.010 240)" },
      "700": { "$value": "oklch(0.34 0.010 240)" },
      "800": { "$value": "oklch(0.26 0.010 240)" },
      "900": { "$value": "oklch(0.20 0.010 240)" },
      "950": { "$value": "oklch(0.14 0.010 240)" },
      "1000": { "$value": "oklch(0.00 0 0)" }
    },
    "red": {
      "500": { "$value": "oklch(0.58 0.200 25)" },
      "600": { "$value": "oklch(0.50 0.200 25)" },
      "700": { "$value": "oklch(0.42 0.180 25)" }
    },
    "green": {
      "500": { "$value": "oklch(0.60 0.160 145)" },
      "600": { "$value": "oklch(0.52 0.160 145)" },
      "700": { "$value": "oklch(0.44 0.140 145)" }
    },
    "amber": {
      "500": { "$value": "oklch(0.75 0.160 80)" },
      "600": { "$value": "oklch(0.67 0.160 80)" },
      "700": { "$value": "oklch(0.59 0.140 80)" }
    }
  }
}
```

```json
// tokens/primitive/spacing.tokens.json
{
  "spacing": {
    "$type": "dimension",
    "0":    { "$value": "0" },
    "px":   { "$value": "1px" },
    "0.5":  { "$value": "0.125rem" },
    "1":    { "$value": "0.25rem" },
    "1.5":  { "$value": "0.375rem" },
    "2":    { "$value": "0.5rem" },
    "3":    { "$value": "0.75rem" },
    "4":    { "$value": "1rem" },
    "5":    { "$value": "1.25rem" },
    "6":    { "$value": "1.5rem" },
    "8":    { "$value": "2rem" },
    "10":   { "$value": "2.5rem" },
    "12":   { "$value": "3rem" },
    "16":   { "$value": "4rem" },
    "20":   { "$value": "5rem" },
    "24":   { "$value": "6rem" }
  }
}
```

```json
// tokens/primitive/typography.tokens.json
{
  "font-family": {
    "$type": "fontFamily",
    "sans":  { "$value": ["Inter", "system-ui", "-apple-system", "sans-serif"] },
    "serif": { "$value": ["Merriweather", "Georgia", "Times New Roman", "serif"] },
    "mono":  { "$value": ["JetBrains Mono", "Fira Code", "Consolas", "monospace"] }
  },
  "font-weight": {
    "$type": "fontWeight",
    "regular":  { "$value": 400 },
    "medium":   { "$value": 500 },
    "semibold": { "$value": 600 },
    "bold":     { "$value": 700 }
  },
  "font-size": {
    "$type": "dimension",
    "$description": "Major third type scale (1.250 ratio)",
    "xs":   { "$value": "0.75rem" },
    "sm":   { "$value": "0.875rem" },
    "base": { "$value": "1rem" },
    "lg":   { "$value": "1.125rem" },
    "xl":   { "$value": "1.25rem" },
    "2xl":  { "$value": "1.5rem" },
    "3xl":  { "$value": "1.875rem" },
    "4xl":  { "$value": "2.25rem" },
    "5xl":  { "$value": "3rem" }
  },
  "line-height": {
    "$type": "number",
    "tight":   { "$value": 1.25 },
    "snug":    { "$value": 1.375 },
    "normal":  { "$value": 1.5 },
    "relaxed": { "$value": 1.625 },
    "loose":   { "$value": 2 }
  }
}
```

**Key design decisions for primitives**:

- **OKLCH color space**: We use OKLCH (Oklab Lightness, Chroma, Hue) as the canonical color format. OKLCH is perceptually uniform -- a lightness value of 0.50 looks equally bright regardless of hue. This is critical for healthcare accessibility because it makes contrast ratio calculations predictable and palette generation mathematically consistent. The DTCG 2025.10 spec supports OKLCH natively, and Terrazzo/Style Dictionary handle automatic downconversion to hex/rgb for older browsers.

- **4px spacing grid**: The spacing scale follows a 4px base unit (0.25rem). This produces consistent vertical rhythm and aligns with common design tool grid systems.

- **Major Third type scale (1.250)**: A conservative ratio that produces readable, well-differentiated sizes without extreme jumps -- appropriate for healthcare content where readability is paramount.

### Tier 2: Semantic Tokens

Semantic tokens define **how** primitive values are applied. They carry meaning and intent. These are the public API of the design system -- the tokens that consumers and theme authors interact with.

```json
// tokens/semantic/color.tokens.json
{
  "color": {
    "$type": "color",

    "surface": {
      "$description": "Background surface colors",
      "primary":   {
        "$value": "{color.neutral.0}",
        "$extensions": {
          "mode": {
            "light": "{color.neutral.0}",
            "dark": "{color.neutral.900}",
            "high-contrast-light": "{color.neutral.0}",
            "high-contrast-dark": "{color.neutral.1000}"
          }
        }
      },
      "secondary": {
        "$value": "{color.neutral.50}",
        "$extensions": {
          "mode": {
            "light": "{color.neutral.50}",
            "dark": "{color.neutral.800}",
            "high-contrast-light": "{color.neutral.0}",
            "high-contrast-dark": "{color.neutral.950}"
          }
        }
      },
      "elevated":  {
        "$value": "{color.neutral.0}",
        "$extensions": {
          "mode": {
            "light": "{color.neutral.0}",
            "dark": "{color.neutral.800}",
            "high-contrast-light": "{color.neutral.0}",
            "high-contrast-dark": "{color.neutral.900}"
          }
        }
      },
      "inverse":   {
        "$value": "{color.neutral.900}",
        "$extensions": {
          "mode": {
            "light": "{color.neutral.900}",
            "dark": "{color.neutral.100}"
          }
        }
      }
    },

    "text": {
      "$description": "Foreground text colors",
      "primary": {
        "$value": "{color.neutral.900}",
        "$extensions": {
          "mode": {
            "light": "{color.neutral.900}",
            "dark": "{color.neutral.50}",
            "high-contrast-light": "{color.neutral.1000}",
            "high-contrast-dark": "{color.neutral.0}"
          }
        }
      },
      "secondary": {
        "$value": "{color.neutral.600}",
        "$extensions": {
          "mode": {
            "light": "{color.neutral.600}",
            "dark": "{color.neutral.300}",
            "high-contrast-light": "{color.neutral.800}",
            "high-contrast-dark": "{color.neutral.200}"
          }
        }
      },
      "disabled": {
        "$value": "{color.neutral.400}",
        "$extensions": {
          "mode": {
            "light": "{color.neutral.400}",
            "dark": "{color.neutral.500}"
          }
        }
      },
      "inverse": {
        "$value": "{color.neutral.0}",
        "$extensions": {
          "mode": {
            "light": "{color.neutral.0}",
            "dark": "{color.neutral.900}"
          }
        }
      },
      "on-primary": {
        "$value": "{color.neutral.0}",
        "$description": "Text color on primary-colored surfaces"
      }
    },

    "interactive": {
      "$description": "Interactive element colors (links, buttons)",
      "primary": {
        "$value": "{color.blue.600}",
        "$extensions": {
          "mode": {
            "light": "{color.blue.600}",
            "dark": "{color.blue.400}",
            "high-contrast-light": "{color.blue.800}",
            "high-contrast-dark": "{color.blue.300}"
          }
        }
      },
      "primary-hover": {
        "$value": "{color.blue.700}",
        "$extensions": {
          "mode": {
            "light": "{color.blue.700}",
            "dark": "{color.blue.300}"
          }
        }
      },
      "primary-active": {
        "$value": "{color.blue.800}",
        "$extensions": {
          "mode": {
            "light": "{color.blue.800}",
            "dark": "{color.blue.200}"
          }
        }
      }
    },

    "feedback": {
      "$description": "Status and feedback colors",
      "success":    { "$value": "{color.green.600}" },
      "warning":    { "$value": "{color.amber.600}" },
      "danger":     { "$value": "{color.red.600}" },
      "info":       { "$value": "{color.blue.500}" }
    },

    "border": {
      "$description": "Border colors",
      "default": {
        "$value": "{color.neutral.200}",
        "$extensions": {
          "mode": {
            "light": "{color.neutral.200}",
            "dark": "{color.neutral.700}",
            "high-contrast-light": "{color.neutral.900}",
            "high-contrast-dark": "{color.neutral.200}"
          }
        }
      },
      "strong": {
        "$value": "{color.neutral.400}",
        "$extensions": {
          "mode": {
            "light": "{color.neutral.400}",
            "dark": "{color.neutral.500}",
            "high-contrast-light": "{color.neutral.1000}",
            "high-contrast-dark": "{color.neutral.0}"
          }
        }
      },
      "focus": {
        "$value": "{color.blue.500}",
        "$description": "Focus ring color -- must meet 3:1 contrast with adjacent colors"
      }
    }
  }
}
```

```json
// tokens/semantic/spacing.tokens.json
{
  "space": {
    "$type": "dimension",
    "inset": {
      "$description": "Padding inside containers",
      "xs":  { "$value": "{spacing.1}" },
      "sm":  { "$value": "{spacing.2}" },
      "md":  { "$value": "{spacing.4}" },
      "lg":  { "$value": "{spacing.6}" },
      "xl":  { "$value": "{spacing.8}" },
      "2xl": { "$value": "{spacing.12}" }
    },
    "stack": {
      "$description": "Vertical spacing between stacked elements",
      "xs":  { "$value": "{spacing.1}" },
      "sm":  { "$value": "{spacing.2}" },
      "md":  { "$value": "{spacing.4}" },
      "lg":  { "$value": "{spacing.6}" },
      "xl":  { "$value": "{spacing.10}" }
    },
    "inline": {
      "$description": "Horizontal spacing between inline elements",
      "xs":  { "$value": "{spacing.1}" },
      "sm":  { "$value": "{spacing.2}" },
      "md":  { "$value": "{spacing.3}" },
      "lg":  { "$value": "{spacing.4}" }
    }
  }
}
```

```json
// tokens/semantic/typography.tokens.json
{
  "type": {
    "heading": {
      "$description": "Heading typography composites",
      "1": {
        "$type": "typography",
        "$value": {
          "fontFamily": "{font-family.sans}",
          "fontWeight": "{font-weight.bold}",
          "fontSize": "{font-size.4xl}",
          "lineHeight": "{line-height.tight}",
          "letterSpacing": "-0.02em"
        }
      },
      "2": {
        "$type": "typography",
        "$value": {
          "fontFamily": "{font-family.sans}",
          "fontWeight": "{font-weight.bold}",
          "fontSize": "{font-size.3xl}",
          "lineHeight": "{line-height.tight}",
          "letterSpacing": "-0.01em"
        }
      },
      "3": {
        "$type": "typography",
        "$value": {
          "fontFamily": "{font-family.sans}",
          "fontWeight": "{font-weight.semibold}",
          "fontSize": "{font-size.2xl}",
          "lineHeight": "{line-height.snug}",
          "letterSpacing": "0"
        }
      },
      "4": {
        "$type": "typography",
        "$value": {
          "fontFamily": "{font-family.sans}",
          "fontWeight": "{font-weight.semibold}",
          "fontSize": "{font-size.xl}",
          "lineHeight": "{line-height.snug}",
          "letterSpacing": "0"
        }
      }
    },
    "body": {
      "default": {
        "$type": "typography",
        "$value": {
          "fontFamily": "{font-family.sans}",
          "fontWeight": "{font-weight.regular}",
          "fontSize": "{font-size.base}",
          "lineHeight": "{line-height.normal}",
          "letterSpacing": "0"
        }
      },
      "large": {
        "$type": "typography",
        "$value": {
          "fontFamily": "{font-family.sans}",
          "fontWeight": "{font-weight.regular}",
          "fontSize": "{font-size.lg}",
          "lineHeight": "{line-height.relaxed}",
          "letterSpacing": "0"
        }
      },
      "small": {
        "$type": "typography",
        "$value": {
          "fontFamily": "{font-family.sans}",
          "fontWeight": "{font-weight.regular}",
          "fontSize": "{font-size.sm}",
          "lineHeight": "{line-height.normal}",
          "letterSpacing": "0"
        }
      }
    },
    "label": {
      "default": {
        "$type": "typography",
        "$value": {
          "fontFamily": "{font-family.sans}",
          "fontWeight": "{font-weight.medium}",
          "fontSize": "{font-size.sm}",
          "lineHeight": "{line-height.normal}",
          "letterSpacing": "0.01em"
        }
      }
    }
  }
}
```

### Tier 3: Component Tokens

Component tokens define **where** semantic values are applied to specific component surfaces. They act as override points -- if unset, they fall back to their semantic alias. Consumers can override individual component tokens without affecting the global theme.

```json
// tokens/component/button.tokens.json
{
  "button": {
    "primary": {
      "bg": {
        "$type": "color",
        "$value": "{color.interactive.primary}",
        "$description": "Primary button background"
      },
      "bg-hover": {
        "$type": "color",
        "$value": "{color.interactive.primary-hover}"
      },
      "bg-active": {
        "$type": "color",
        "$value": "{color.interactive.primary-active}"
      },
      "text": {
        "$type": "color",
        "$value": "{color.text.on-primary}"
      },
      "border-radius": {
        "$type": "dimension",
        "$value": "{radius.md}"
      },
      "padding-x": {
        "$type": "dimension",
        "$value": "{space.inset.md}"
      },
      "padding-y": {
        "$type": "dimension",
        "$value": "{space.inset.sm}"
      },
      "font": {
        "$type": "typography",
        "$value": "{type.label.default}"
      }
    },
    "secondary": {
      "bg": {
        "$type": "color",
        "$value": "transparent"
      },
      "text": {
        "$type": "color",
        "$value": "{color.interactive.primary}"
      },
      "border": {
        "$type": "color",
        "$value": "{color.border.default}"
      }
    },
    "danger": {
      "bg": {
        "$type": "color",
        "$value": "{color.feedback.danger}"
      },
      "text": {
        "$type": "color",
        "$value": "{color.text.on-primary}"
      }
    }
  }
}
```

```json
// tokens/component/card.tokens.json
{
  "card": {
    "bg": {
      "$type": "color",
      "$value": "{color.surface.elevated}"
    },
    "border": {
      "$type": "color",
      "$value": "{color.border.default}"
    },
    "border-radius": {
      "$type": "dimension",
      "$value": "{radius.lg}"
    },
    "padding": {
      "$type": "dimension",
      "$value": "{space.inset.lg}"
    },
    "shadow": {
      "$type": "shadow",
      "$value": {
        "offsetX": "0",
        "offsetY": "1px",
        "blur": "3px",
        "spread": "0",
        "color": "oklch(0 0 0 / 0.1)"
      }
    }
  }
}
```

**Key design decisions for component tokens**:

- **Fallback-first**: Component tokens alias semantic tokens by default. A healthcare org can override `--button-primary-bg` without overriding `--color-interactive-primary`, and vice versa.
- **Flat hierarchy**: Component tokens use a flat `component-element-property` naming pattern. No nesting deeper than 3 levels.
- **Optional adoption**: Not every component needs component tokens. Simple components (badge, divider) can reference semantic tokens directly. Component tokens are added when a specific override use case is identified.

### Token Relationship Diagram

```
Primitive                 Semantic                    Component
-------------------------------------------------------------------
color.blue.600    --->    color.interactive.primary   --->   button.primary.bg
color.neutral.0   --->    color.surface.primary       --->   card.bg
spacing.4         --->    space.inset.md              --->   button.primary.padding-x
font-size.sm      --->    type.label.default.fontSize --->   button.primary.font
```

---

## 3.3 Token Naming Conventions

### Naming Structure

We use a modified **CTI (Category-Type-Item)** naming convention adapted for DTCG compatibility:

```
{category}.{type}.{item}[-{state}][-{scale}]
```

**Examples**:

| Token Path | CSS Custom Property | Purpose |
|---|---|---|
| `color.surface.primary` | `--color-surface-primary` | Primary background surface |
| `color.text.secondary` | `--color-text-secondary` | Secondary text color |
| `color.interactive.primary-hover` | `--color-interactive-primary-hover` | Hovered interactive element |
| `color.feedback.danger` | `--color-feedback-danger` | Danger/error state |
| `space.inset.md` | `--space-inset-md` | Medium padding |
| `space.stack.lg` | `--space-stack-lg` | Large vertical gap |
| `type.heading.2` | `--type-heading-2-*` | H2 typography composite |
| `button.primary.bg` | `--button-primary-bg` | Button background |
| `button.primary.bg-hover` | `--button-primary-bg-hover` | Button hover background |
| `card.border-radius` | `--card-border-radius` | Card border radius |

### Naming Rules

1. **Lowercase kebab-case** for multi-word segments: `border-radius`, not `borderRadius`
2. **Descriptive category first**: `color.surface`, not `surface.color`
3. **State as suffix**: `primary-hover`, `primary-active`, `primary-disabled`
4. **Scale as suffix**: `inset-sm`, `inset-md`, `inset-lg`
5. **No abbreviations** except universally understood ones: `bg`, `sm`, `md`, `lg`, `xl`
6. **No framework-specific naming**: no `tw-`, `bs-`, or similar prefixes
7. **Prefix CSS custom properties with a namespace**: `--hds-color-surface-primary` (where `hds` = Healthcare Design System, configurable per client)

### CSS Custom Property Prefix

All generated CSS custom properties carry a configurable namespace prefix to avoid collisions with Drupal themes, third-party stylesheets, or other component libraries:

```css
/* Default namespace: hds (Healthcare Design System) */
:root {
  --hds-color-surface-primary: oklch(1.00 0 0);
  --hds-color-text-primary: oklch(0.20 0.010 240);
  --hds-space-inset-md: 1rem;
}

/* Components reference the prefixed properties */
:host {
  background: var(--hds-button-primary-bg, var(--hds-color-interactive-primary));
}
```

The prefix is configured in the Terrazzo build pipeline and applied during token generation, not hardcoded in source tokens.

---

## 3.4 Token Format & Tooling

### W3C DTCG 2025.10 Specification

As of October 2025, the Design Tokens Community Group released the first stable version of their specification. This is the foundation of our token format:

- **File format**: JSON with `.tokens.json` extension
- **Media type**: `application/design-tokens+json`
- **Property prefix**: `$` prefix for meta properties (`$value`, `$type`, `$description`, `$extensions`)
- **Alias syntax**: Curly brace references `"{color.blue.600}"`
- **Supported types**: `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`, `strokeStyle`, `border`, `transition`, `shadow`, `gradient`, `typography`
- **Color spaces**: Full support for Display P3, OKLCH, and CSS Color Module 4

### Token Build Pipeline: Terrazzo

**Why Terrazzo over Style Dictionary**: Terrazzo (the successor to Cobalt UI 2.0) is purpose-built for DTCG tokens. While Style Dictionary v4 supports DTCG as a secondary format (alongside its legacy format), Terrazzo is DTCG-native. It produces smaller output, handles modes/theming natively, and generates P3/OKLCH color fallbacks automatically. For a greenfield project in 2026, Terrazzo is the right choice.

**Pipeline architecture**:

```
tokens/*.tokens.json          Source token files (DTCG 2025.10 format)
        |
        v
  terrazzo.config.js           Build configuration
        |
        v
  Terrazzo CLI (`tz build`)    Transforms + generates
        |
        +---> dist/tokens.css        CSS custom properties
        +---> dist/tokens.d.ts       TypeScript type definitions
        +---> dist/tokens.json       Flat JSON for runtime use
        +---> dist/tokens.scss       SCSS variables (Drupal compat)
```

### Terrazzo Configuration

```javascript
// terrazzo.config.js
import { defineConfig } from "@terrazzo/cli";
import pluginCSS from "@terrazzo/plugin-css";
import pluginTS from "@terrazzo/plugin-ts";
import pluginJSON from "@terrazzo/plugin-json";

export default defineConfig({
  tokens: [
    "tokens/primitive/**/*.tokens.json",
    "tokens/semantic/**/*.tokens.json",
    "tokens/component/**/*.tokens.json",
  ],
  outDir: "dist/",
  plugins: [
    pluginCSS({
      filename: "tokens.css",
      // Configurable namespace prefix
      variableName: (id) => `--hds-${id.replace(/\./g, "-")}`,
      // Base selector for default token values
      baseSelector: ":root",
      // Enable color-scheme property
      baseScheme: "light dark",
      // OKLCH with automatic sRGB fallback
      colorDepth: 36,
      // Mode-to-selector mapping for theming
      modeSelectors: [
        {
          mode: "light",
          selectors: [
            '@media (prefers-color-scheme: light)',
            '[data-theme="light"]',
          ],
          scheme: "light",
        },
        {
          mode: "dark",
          selectors: [
            '@media (prefers-color-scheme: dark)',
            '[data-theme="dark"]',
          ],
          scheme: "dark",
        },
        {
          mode: "high-contrast-light",
          selectors: [
            '@media (prefers-contrast: more) and (prefers-color-scheme: light)',
            '[data-theme="high-contrast-light"]',
          ],
          scheme: "light",
        },
        {
          mode: "high-contrast-dark",
          selectors: [
            '@media (prefers-contrast: more) and (prefers-color-scheme: dark)',
            '[data-theme="high-contrast-dark"]',
          ],
          scheme: "dark",
        },
      ],
      // Exclude primitives from CSS output (private)
      exclude: ["color.blue.*", "color.neutral.*", "color.red.*",
                "color.green.*", "color.amber.*", "spacing.*",
                "font-family.*", "font-weight.*", "font-size.*",
                "line-height.*"],
    }),
    pluginTS({
      filename: "tokens.d.ts",
    }),
    pluginJSON({
      filename: "tokens.json",
    }),
  ],
});
```

### Generated CSS Output

```css
/* dist/tokens.css (generated -- do not edit) */

:root {
  color-scheme: light dark;

  /* Semantic: Surface */
  --hds-color-surface-primary: oklch(1.00 0 0);
  --hds-color-surface-secondary: oklch(0.97 0.002 240);
  --hds-color-surface-elevated: oklch(1.00 0 0);

  /* Semantic: Text */
  --hds-color-text-primary: oklch(0.20 0.010 240);
  --hds-color-text-secondary: oklch(0.42 0.010 240);
  --hds-color-text-disabled: oklch(0.62 0.010 240);

  /* Semantic: Interactive */
  --hds-color-interactive-primary: oklch(0.50 0.172 240);
  --hds-color-interactive-primary-hover: oklch(0.42 0.158 240);

  /* Semantic: Feedback */
  --hds-color-feedback-success: oklch(0.52 0.160 145);
  --hds-color-feedback-danger: oklch(0.50 0.200 25);

  /* Semantic: Border */
  --hds-color-border-default: oklch(0.87 0.006 240);
  --hds-color-border-focus: oklch(0.58 0.168 240);

  /* Semantic: Spacing */
  --hds-space-inset-xs: 0.25rem;
  --hds-space-inset-sm: 0.5rem;
  --hds-space-inset-md: 1rem;
  --hds-space-inset-lg: 1.5rem;

  /* Component: Button */
  --hds-button-primary-bg: var(--hds-color-interactive-primary);
  --hds-button-primary-bg-hover: var(--hds-color-interactive-primary-hover);
  --hds-button-primary-text: oklch(1.00 0 0);
  --hds-button-primary-border-radius: 0.5rem;

  /* Component: Card */
  --hds-card-bg: var(--hds-color-surface-elevated);
  --hds-card-border: var(--hds-color-border-default);
  --hds-card-border-radius: 0.75rem;
  --hds-card-padding: 1.5rem;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --hds-color-surface-primary: oklch(0.20 0.010 240);
    --hds-color-surface-secondary: oklch(0.26 0.010 240);
    --hds-color-text-primary: oklch(0.97 0.002 240);
    --hds-color-text-secondary: oklch(0.78 0.008 240);
    --hds-color-interactive-primary: oklch(0.68 0.142 240);
    --hds-color-border-default: oklch(0.34 0.010 240);
  }
}

[data-theme="dark"] {
  --hds-color-surface-primary: oklch(0.20 0.010 240);
  --hds-color-surface-secondary: oklch(0.26 0.010 240);
  --hds-color-text-primary: oklch(0.97 0.002 240);
  --hds-color-text-secondary: oklch(0.78 0.008 240);
  --hds-color-interactive-primary: oklch(0.68 0.142 240);
  --hds-color-border-default: oklch(0.34 0.010 240);
}

/* High contrast light */
@media (prefers-contrast: more) and (prefers-color-scheme: light) {
  :root {
    --hds-color-surface-primary: oklch(1.00 0 0);
    --hds-color-text-primary: oklch(0.00 0 0);
    --hds-color-border-default: oklch(0.20 0.010 240);
    --hds-color-border-strong: oklch(0.00 0 0);
  }
}

/* High contrast dark */
@media (prefers-contrast: more) and (prefers-color-scheme: dark) {
  :root {
    --hds-color-surface-primary: oklch(0.00 0 0);
    --hds-color-text-primary: oklch(1.00 0 0);
    --hds-color-border-default: oklch(0.87 0.006 240);
    --hds-color-border-strong: oklch(1.00 0 0);
  }
}
```

### TypeScript Integration

Terrazzo generates type definitions so components can reference tokens with full type safety:

```typescript
// dist/tokens.d.ts (generated)
export type ColorToken =
  | "color.surface.primary"
  | "color.surface.secondary"
  | "color.text.primary"
  | "color.text.secondary"
  | "color.interactive.primary"
  // ... all semantic + component color tokens

export type SpacingToken =
  | "space.inset.xs"
  | "space.inset.sm"
  | "space.inset.md"
  // ... all spacing tokens

export function token(id: ColorToken | SpacingToken | ...): string;
```

### Version Management

Tokens are versioned independently from components using semver:

- **Patch** (0.0.x): Bug fixes to token values (e.g., correcting a contrast ratio)
- **Minor** (0.x.0): New tokens added, new modes, new component tokens
- **Major** (x.0.0): Removed tokens, renamed tokens, restructured hierarchy

Token changes are tracked in `tokens/CHANGELOG.md` and published as an npm package (`@hds/tokens`).

---

## 3.5 Light/Dark Mode Architecture

### Strategy Overview

The theming system uses a **layered detection and override** approach:

```
1. System preference   @media (prefers-color-scheme: dark)
2. User override       [data-theme="dark"] on <html> or provider element
3. Component override  [data-theme="dark"] on individual component (rare)
```

Each layer can be overridden by the next. System preference is the default, user override takes priority, and per-component override is available for edge cases (e.g., a dark card on a light page).

### Theme Detection and Persistence

```typescript
// src/theme/theme-manager.ts

export type ThemeMode = "light" | "dark" | "system";

export class ThemeManager {
  private static STORAGE_KEY = "hds-theme-preference";
  private mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  /** Get the resolved theme (never "system") */
  get resolvedTheme(): "light" | "dark" {
    const preference = this.preference;
    if (preference === "system") {
      return this.mediaQuery.matches ? "dark" : "light";
    }
    return preference;
  }

  /** Get the user's explicit preference */
  get preference(): ThemeMode {
    const stored = localStorage.getItem(ThemeManager.STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return "system";
  }

  /** Set theme preference */
  setTheme(mode: ThemeMode): void {
    if (mode === "system") {
      localStorage.removeItem(ThemeManager.STORAGE_KEY);
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem(ThemeManager.STORAGE_KEY, mode);
      document.documentElement.setAttribute("data-theme", mode);
    }
    // Dispatch event for Lit components to react
    window.dispatchEvent(
      new CustomEvent("hds-theme-change", {
        detail: { mode, resolved: this.resolvedTheme },
      })
    );
  }

  /** Listen for system preference changes */
  observe(callback: (resolved: "light" | "dark") => void): () => void {
    const handler = () => callback(this.resolvedTheme);
    this.mediaQuery.addEventListener("change", handler);
    return () => this.mediaQuery.removeEventListener("change", handler);
  }
}
```

### Preventing Flash of Incorrect Theme (FOIT)

A critical UX concern: if the page loads with light theme and then switches to dark after JavaScript evaluates, users see a flash. We prevent this with an inline script in `<head>`:

```html
<!-- Inline in <head> BEFORE any stylesheets -->
<script>
  (function() {
    var stored = localStorage.getItem('hds-theme-preference');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  })();
</script>
```

This runs synchronously before any rendering occurs, ensuring the correct `data-theme` attribute is present when CSS first evaluates.

### How CSS Custom Properties Enable Theme Switching

Because CSS custom properties inherit through the DOM tree -- including piercing Shadow DOM boundaries -- setting `data-theme` on the document root automatically cascades new values into every Web Component:

```
<html data-theme="dark">               <-- Theme set here
  <body>
    <hds-header>                        <-- Shadow DOM
      #shadow-root
        <nav style="background: var(--hds-color-surface-primary)">
                                        ^^^  Resolves to dark value
    <hds-card>                          <-- Shadow DOM
      #shadow-root
        <div style="background: var(--hds-card-bg)">
                                        ^^^  Also resolves to dark value
```

No JavaScript, no reactive property updates, no re-rendering required. The browser handles it entirely through CSS inheritance. This is why CSS custom properties are the ideal theming mechanism for Web Components.

### Smooth Theme Transitions

```css
/* Applied globally -- not inside Shadow DOM */
:root {
  /* Transition only color-related properties to avoid layout thrashing */
  transition:
    background-color 200ms ease-in-out,
    color 200ms ease-in-out,
    border-color 200ms ease-in-out;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  :root {
    transition: none;
  }
}
```

### CSS `light-dark()` Function (Progressive Enhancement)

The CSS `light-dark()` function (87% browser support as of early 2026) provides a clean syntax for dual-mode values. We use it as progressive enhancement where supported:

```css
:root {
  color-scheme: light dark;
}

/* Inside a component's Shadow DOM */
:host {
  /* Automatically switches based on color-scheme */
  background: light-dark(
    var(--hds-color-surface-primary),  /* light value */
    var(--hds-color-surface-primary)   /* dark value -- same var, different resolved value */
  );
}
```

However, our primary mechanism remains the `data-theme` attribute approach because it gives explicit JavaScript control needed for user preference persistence and Drupal integration.

---

## 3.6 CSS Architecture for Web Components

### Shadow DOM Encapsulation Strategy

Lit components use Shadow DOM by default, which provides three guarantees:

1. **Style isolation**: Component CSS does not leak out to the document
2. **Protection**: Document CSS does not leak into the component
3. **Scoped selectors**: Simple selectors like `.header` are safe without BEM or prefixing

**The one exception**: CSS custom properties inherit through shadow boundaries by design. This is not a bug -- it is the mechanism that makes theming possible.

### Component CSS Architecture

Each Lit component follows this CSS structure:

```typescript
// src/components/hds-button/hds-button.ts
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("hds-button")
export class HdsButton extends LitElement {
  static styles = css`
    /* ============================================
     * Layer 1: CSS Custom Property API
     * These are the "knobs" consumers can turn.
     * Fallback chain: component token -> semantic token -> hardcoded default
     * ============================================ */

    :host {
      /* Explicit declaration of all customizable properties */
      --_bg: var(--hds-button-primary-bg, var(--hds-color-interactive-primary, #2563eb));
      --_bg-hover: var(--hds-button-primary-bg-hover, var(--hds-color-interactive-primary-hover, #1d4ed8));
      --_text: var(--hds-button-primary-text, var(--hds-color-text-on-primary, #fff));
      --_radius: var(--hds-button-primary-border-radius, var(--hds-radius-md, 0.5rem));
      --_padding-x: var(--hds-button-primary-padding-x, var(--hds-space-inset-md, 1rem));
      --_padding-y: var(--hds-button-primary-padding-y, var(--hds-space-inset-sm, 0.5rem));
      --_font-size: var(--hds-button-font-size, var(--hds-font-size-sm, 0.875rem));
      --_font-weight: var(--hds-button-font-weight, var(--hds-font-weight-medium, 500));
      --_focus-ring: var(--hds-color-border-focus, #3b82f6);
      --_transition-duration: 150ms;

      display: inline-block;
    }

    /* ============================================
     * Layer 2: Base Styles
     * Uses private custom properties (--_prefix)
     * ============================================ */

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--hds-space-inline-sm, 0.5rem);
      padding: var(--_padding-y) var(--_padding-x);
      background: var(--_bg);
      color: var(--_text);
      border: none;
      border-radius: var(--_radius);
      font-size: var(--_font-size);
      font-weight: var(--_font-weight);
      font-family: inherit;
      line-height: 1.5;
      cursor: pointer;
      transition:
        background-color var(--_transition-duration) ease-in-out,
        box-shadow var(--_transition-duration) ease-in-out;
      /* Minimum touch target for healthcare accessibility */
      min-height: 44px;
      min-width: 44px;
    }

    /* ============================================
     * Layer 3: Interactive States
     * ============================================ */

    button:hover:not(:disabled) {
      background: var(--_bg-hover);
    }

    button:focus-visible {
      outline: 2px solid var(--_focus-ring);
      outline-offset: 2px;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ============================================
     * Layer 4: Reduced Motion
     * ============================================ */

    @media (prefers-reduced-motion: reduce) {
      button {
        transition: none;
      }
    }
  `;

  @property({ type: String }) variant: "primary" | "secondary" | "danger" = "primary";
  @property({ type: Boolean }) disabled = false;

  render() {
    return html`
      <button ?disabled=${this.disabled} part="button">
        <slot></slot>
      </button>
    `;
  }
}
```

### CSS Custom Property Injection Pattern

The component CSS uses a **three-level fallback chain** for every customizable property:

```css
/*
 * Resolution order:
 * 1. Component token:  --hds-button-primary-bg        (most specific)
 * 2. Semantic token:   --hds-color-interactive-primary (theme-level)
 * 3. Hardcoded value:  #2563eb                         (last resort)
 */
--_bg: var(--hds-button-primary-bg, var(--hds-color-interactive-primary, #2563eb));
```

The private `--_` prefix convention (two hyphens + underscore) indicates these are internal component variables not meant for external override. External consumers customize via the `--hds-` prefixed properties.

### CSS `::part()` for Targeted Styling

For cases where CSS custom properties alone are insufficient (e.g., a consumer needs to add a specific pseudo-element), Lit components expose `part` attributes:

```typescript
// Component template
render() {
  return html`
    <button part="button">
      <span part="label"><slot></slot></span>
      <span part="icon"><slot name="icon"></slot></span>
    </button>
  `;
}
```

```css
/* Consumer stylesheet (outside shadow DOM) */
hds-button::part(button) {
  text-transform: uppercase;
}
```

We use `::part()` sparingly -- CSS custom properties are the preferred customization mechanism. Parts are a safety valve for the 5% of cases tokens cannot handle.

### Shared Style Modules

Common styles are extracted into reusable modules to avoid duplication:

```typescript
// src/styles/shared/focus.styles.ts
import { css } from "lit";

export const focusStyles = css`
  :focus-visible {
    outline: 2px solid var(--hds-color-border-focus, #3b82f6);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    :focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;

// src/styles/shared/reset.styles.ts
export const resetStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :host {
    display: block;
  }

  :host([hidden]) {
    display: none !important;
  }
`;
```

```typescript
// Consumed by components:
import { focusStyles } from "../../styles/shared/focus.styles.js";
import { resetStyles } from "../../styles/shared/reset.styles.js";

static styles = [resetStyles, focusStyles, css`
  /* Component-specific styles */
`];
```

### Constructable Stylesheets Performance

Lit uses Constructable Stylesheets (via `adoptedStyleSheets`) when the browser supports them. This means:

- The browser parses the CSS **exactly once** per class
- All instances of the same component share the parsed stylesheet object
- This is significantly more efficient than duplicating `<style>` elements per instance
- 100 instances of `<hds-card>` on a page = 1 parsed stylesheet, not 100

### No CSS Layers Inside Shadow DOM

CSS `@layer` declarations do not cross Shadow DOM boundaries -- layer identifiers in the light DOM have no impact on identically named layers in the shadow DOM. Therefore, we do not use `@layer` inside component Shadow DOM. Our component CSS is flat and scoped by the shadow boundary itself.

For the light DOM (global document), the consuming application can organize our token stylesheet into layers:

```css
/* Consuming application's global CSS */
@layer tokens, theme, utilities;

@import url("@hds/tokens/tokens.css") layer(tokens);
@import url("@hds/tokens/theme-overrides.css") layer(theme);
```

---

## 3.7 Typography System

### Type Scale

We use a **Major Third** scale (ratio: 1.250) anchored at 1rem (16px). This ratio provides clear visual hierarchy without extreme size jumps -- appropriate for healthcare content where readability is the priority over dramatic display typography.

| Token | Size (rem) | Size (px) | Use Case |
|---|---|---|---|
| `font-size.xs` | 0.75 | 12 | Captions, fine print |
| `font-size.sm` | 0.875 | 14 | Labels, helper text, metadata |
| `font-size.base` | 1.0 | 16 | Body text, paragraphs |
| `font-size.lg` | 1.125 | 18 | Lead paragraphs, emphasized body |
| `font-size.xl` | 1.25 | 20 | H4, subheadings |
| `font-size.2xl` | 1.5 | 24 | H3 |
| `font-size.3xl` | 1.875 | 30 | H2 |
| `font-size.4xl` | 2.25 | 36 | H1 |
| `font-size.5xl` | 3.0 | 48 | Display headings (hero) |

### Fluid Typography with Accessibility Guardrails

We use CSS `clamp()` for fluid typography that scales between viewport breakpoints while preserving zoom accessibility:

```css
/* IMPORTANT: Use rem + vw combination, never vw alone */
/* Pure vw units break browser zoom (WCAG 1.4.4 Resize Text failure) */

:root {
  /* Body: 16px at 320px viewport, scales to 18px at 1280px */
  --hds-font-size-fluid-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);

  /* H1: 28px at 320px viewport, scales to 36px at 1280px */
  --hds-font-size-fluid-4xl: clamp(1.75rem, 1.5rem + 1.25vw, 2.25rem);

  /* H2: 24px at 320px viewport, scales to 30px at 1280px */
  --hds-font-size-fluid-3xl: clamp(1.5rem, 1.3rem + 1vw, 1.875rem);
}
```

**Why `clamp()` with `rem + vw`**: Pure `vw` units prevent browser zoom from increasing text size, which is a WCAG 1.4.4 failure. The `rem` base ensures that browser zoom (Ctrl/Cmd +) still scales the text proportionally, while the `vw` component adds fluid scaling between breakpoints.

### Font Loading Strategy

Web fonts loaded via `@font-face` in the document's light DOM are available inside Shadow DOM -- the browser resolves font names globally. However, we need a loading strategy that avoids layout shifts and handles slow networks gracefully.

```css
/* tokens/fonts.css -- loaded in the document, not inside Shadow DOM */

/* Inter -- Primary UI font */
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-variable.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC,
                 U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
                 U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212,
                 U+2215, U+FEFF, U+FFFD;
}

/* Inter Latin Extended -- loaded only if needed */
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-variable-latin-ext.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
  unicode-range: U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F,
                 U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0,
                 U+2113, U+2C60-2C7F, U+A720-A7FF;
}
```

**Key decisions**:

1. **Variable fonts only**: A single variable font file (Inter Variable) replaces 8+ static files. Smaller total download, more flexible weight options.

2. **`font-display: swap`**: Text renders immediately in a fallback system font, then swaps when the custom font loads. This is the right choice for healthcare content where readability is more important than preventing a brief style shift.

3. **Unicode subsetting**: Only load the character ranges needed for the content language. Latin base covers 99%+ of English healthcare content.

4. **Document-level loading**: Fonts are declared in the document (not inside Shadow DOM) because `@font-face` declarations in Shadow DOM create duplicate font downloads. The browser handles font-family name resolution globally.

5. **Preload critical fonts**:
   ```html
   <link rel="preload" href="/fonts/inter-variable.woff2"
         as="font" type="font/woff2" crossorigin>
   ```

### Line Height and Readability

Healthcare content demands generous line height for readability:

| Context | Line Height | Rationale |
|---|---|---|
| Body text | 1.5 (24px at 16px) | WCAG 1.4.8 recommends 1.5 for body |
| Headings | 1.25 | Tighter for visual hierarchy |
| Small text | 1.5 | Maintains readability at smaller sizes |
| Inputs/Labels | 1.5 | Consistent with body |

WCAG AAA (Success Criterion 1.4.8) specifies: "Line spacing is at least space-and-a-half within paragraphs." Our default `line-height: 1.5` meets this requirement.

---

## 3.8 Spacing & Layout System

### Spacing Scale

The spacing system uses a **4px base unit** (0.25rem). This creates a predictable, harmonic rhythm:

| Token | Value | Pixels | Common Use |
|---|---|---|---|
| `spacing.0` | 0 | 0 | Reset |
| `spacing.px` | 1px | 1 | Hairline borders |
| `spacing.0.5` | 0.125rem | 2 | Tight gaps |
| `spacing.1` | 0.25rem | 4 | Icon spacing |
| `spacing.1.5` | 0.375rem | 6 | Small insets |
| `spacing.2` | 0.5rem | 8 | Compact padding |
| `spacing.3` | 0.75rem | 12 | Default gap |
| `spacing.4` | 1rem | 16 | Standard padding |
| `spacing.5` | 1.25rem | 20 | Comfortable padding |
| `spacing.6` | 1.5rem | 24 | Card padding |
| `spacing.8` | 2rem | 32 | Section spacing |
| `spacing.10` | 2.5rem | 40 | Large gaps |
| `spacing.12` | 3rem | 48 | Section gaps |
| `spacing.16` | 4rem | 64 | Page section spacing |
| `spacing.20` | 5rem | 80 | Major section spacing |
| `spacing.24` | 6rem | 96 | Hero spacing |

### Semantic Spacing Categories

Rather than using raw spacing values, components use semantic spacing tokens organized by purpose:

- **`space.inset.*`**: Padding inside containers (card padding, button padding)
- **`space.stack.*`**: Vertical spacing between stacked elements (paragraph gaps, section gaps)
- **`space.inline.*`**: Horizontal spacing between inline elements (icon-to-label gap, badge gaps)

This prevents inconsistency -- a developer choosing between `spacing.3` and `spacing.4` for button padding gets a clear answer from `space.inset.sm`.

### Container Queries vs. Media Queries

**For Web Components, container queries are the correct choice for responsive behavior.** Media queries respond to viewport width, but a Web Component does not know where it will be placed -- it could be in a full-width layout or a 300px sidebar. Container queries respond to the component's own container size.

```typescript
// src/components/hds-card/hds-card.ts
static styles = css`
  :host {
    container-type: inline-size;
    container-name: hds-card;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: var(--hds-space-stack-sm);
  }

  /* When the card has at least 600px available */
  @container hds-card (min-width: 600px) {
    .card-content {
      flex-direction: row;
      gap: var(--hds-space-inline-lg);
    }
  }

  /* Use container query units for proportional sizing */
  .card-image {
    width: 100%;
  }

  @container hds-card (min-width: 600px) {
    .card-image {
      width: 40cqi; /* 40% of container inline size */
    }
  }
`;
```

**Container query browser support** (early 2026): 93%+ global support. For legacy Safari gaps, a polyfill exists but is unlikely to be needed for a healthcare enterprise deploying in 2026.

### Responsive Breakpoints

While components use container queries internally, the consuming application (Drupal theme) may still need viewport breakpoints for page layout:

| Token | Value | Use Case |
|---|---|---|
| `breakpoint.sm` | 640px | Mobile landscape |
| `breakpoint.md` | 768px | Tablet portrait |
| `breakpoint.lg` | 1024px | Tablet landscape / small desktop |
| `breakpoint.xl` | 1280px | Desktop |
| `breakpoint.2xl` | 1536px | Large desktop |

These are exposed as CSS custom properties and TypeScript constants, but are primarily for application-level layout, not component internals.

---

## 3.9 Healthcare-Specific Accessibility

### WCAG Compliance Targets

| Category | Target Level | Rationale |
|---|---|---|
| Color contrast (text) | **AAA (7:1)** | Healthcare users include elderly, low-vision patients |
| Color contrast (large text) | **AAA (4.5:1)** | Enhanced readability for all heading sizes |
| Color contrast (non-text) | **AA (3:1)** | UI controls, borders, icons |
| Focus indicators | **AA (3:1)** against adjacent colors | Keyboard navigation must be visible |
| Text resizing | **200% zoom** without loss | WCAG 1.4.4 |
| Text spacing | **Adjustable** | WCAG 1.4.12 |
| Reduced motion | **Respected** | WCAG 2.3.3 |
| Target size | **44x44px minimum** | WCAG 2.5.8 (enhanced) |

### Color Contrast Enforcement

OKLCH makes contrast checking systematic. With perceptually uniform lightness, we can establish floor rules:

```
AAA text contrast (7:1):
- Light mode: text lightness <= 0.35 on surface lightness >= 0.90
- Dark mode: text lightness >= 0.85 on surface lightness <= 0.25

AA non-text contrast (3:1):
- Adjacent colors must differ by >= 0.30 in OKLCH lightness
```

These rules are enforced in the token build pipeline via a custom Terrazzo plugin that fails the build if any semantic token pairing violates contrast minimums.

### High Contrast Mode Support

We support four modes through our token system:

1. **Light** (default): Standard light theme
2. **Dark**: Dark theme with inverted surfaces
3. **High Contrast Light**: Maximum contrast on light background (AAA everywhere)
4. **High Contrast Dark**: Maximum contrast on dark background

Additionally, we support Windows High Contrast Mode / Forced Colors through CSS:

```css
/* Inside every component */
@media (forced-colors: active) {
  button {
    /* Let the system handle colors entirely */
    border: 1px solid ButtonText;
    background: ButtonFace;
    color: ButtonText;
    forced-color-adjust: auto;
  }

  button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  button:disabled {
    color: GrayText;
    border-color: GrayText;
  }
}
```

**System color keywords** (`ButtonText`, `ButtonFace`, `Highlight`, `GrayText`) are the correct approach for forced-colors mode. Never use `forced-color-adjust: none` unless you have a specific, documented accessibility reason.

### Reduced Motion

Every component with animation or transition includes a reduced-motion media query:

```css
/* Standard transition */
button {
  transition: background-color 150ms ease-in-out;
}

/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  button {
    transition: none;
  }
}
```

This is a build-time lint rule: any CSS `transition` or `animation` property that does not have a corresponding `prefers-reduced-motion: reduce` override will fail the lint check.

### Prefers-Contrast Support

```css
@media (prefers-contrast: more) {
  :host {
    --_border-width: 2px; /* Thicker borders */
    --_border-color: var(--hds-color-border-strong);
  }
}

@media (prefers-contrast: less) {
  :host {
    --_border-color: transparent; /* Softer appearance */
  }
}
```

### Focus Management

Focus styles are critical for healthcare applications where keyboard navigation may be the only option:

```css
/* Two-ring focus indicator for maximum visibility */
button:focus-visible {
  outline: 2px solid var(--hds-color-border-focus);
  outline-offset: 2px;
}

/* Ensure focus ring meets 3:1 contrast against both light and dark backgrounds */
/* This is handled at the token level -- the focus color is tested against
   all surface colors in both light and dark modes */
```

### Touch Target Sizing

WCAG 2.5.8 (Target Size Enhanced, Level AAA) requires 44x44px minimum for touch targets. Every interactive component enforces this:

```css
button, a, input, select, textarea {
  min-height: 44px;
  min-width: 44px;
}

/* For small visual elements that need a larger hit area */
.icon-button {
  position: relative;
  /* Visual size can be smaller */
  width: 24px;
  height: 24px;
}

.icon-button::before {
  content: "";
  position: absolute;
  /* Touch target extends beyond visual bounds */
  inset: -10px;
}
```

### Text Spacing Override Support (WCAG 1.4.12)

Components must not break when users override text spacing via browser extensions or custom CSS:

```css
/* Components must tolerate these overrides without losing content */
/* WCAG 1.4.12 specifies these as minimum adjustable values: */
/* - Line height: 1.5x font size */
/* - Paragraph spacing: 2x font size */
/* - Letter spacing: 0.12x font size */
/* - Word spacing: 0.16x font size */

/* We achieve this by: */
/* 1. Never using fixed heights on text containers */
/* 2. Using min-height instead of height */
/* 3. Allowing overflow to be visible, not hidden */
/* 4. Testing all components with the WCAG text spacing bookmarklet */
```

---

## 3.10 Storybook Integration

### Token Documentation in Storybook

Storybook serves as the living documentation for the design system. We use the `storybook-design-token` addon to auto-generate token documentation from our CSS output.

#### Storybook Configuration

```javascript
// .storybook/main.ts
import type { StorybookConfig } from "@storybook/web-components-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|mdx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",         // Accessibility auditing
    "storybook-design-token",         // Token documentation
  ],
  framework: {
    name: "@storybook/web-components-vite",
    options: {},
  },
  docs: {
    autodocs: true,
  },
};
export default config;
```

#### Custom Elements Manifest for Autodocs

Lit components generate a Custom Elements Manifest (`custom-elements.json`) that Storybook uses for automatic prop/attribute/event documentation:

```javascript
// .storybook/preview.ts
import { setCustomElementsManifest } from "@storybook/web-components";
import manifest from "../custom-elements.json";

setCustomElementsManifest(manifest);

export const parameters = {
  // Enable design token display
  designToken: {
    disable: false,
  },
};
```

Generate the manifest with:
```bash
npx @custom-elements-manifest/analyzer analyze --litelement
```

#### Token Documentation Pages

We create dedicated MDX documentation pages for each token category:

```mdx
{/* src/stories/tokens/Colors.mdx */}
import { Meta } from "@storybook/blocks";
import { DesignTokenDocBlock } from "storybook-design-token";

<Meta title="Design Tokens/Colors" />

# Color Tokens

## Surface Colors
<DesignTokenDocBlock
  categoryName="Surface Colors"
  viewType="card"
/>

## Text Colors
<DesignTokenDocBlock
  categoryName="Text Colors"
  viewType="table"
/>

## Interactive Colors
<DesignTokenDocBlock
  categoryName="Interactive Colors"
  viewType="card"
/>

## Feedback Colors
<DesignTokenDocBlock
  categoryName="Feedback Colors"
  viewType="card"
/>
```

#### Theme Switcher in Storybook

A custom toolbar addon allows designers and developers to preview components in all four modes:

```typescript
// .storybook/preview.ts
export const globalTypes = {
  theme: {
    name: "Theme",
    description: "Global theme for components",
    defaultValue: "light",
    toolbar: {
      icon: "circlehollow",
      items: [
        { value: "light", title: "Light", icon: "sun" },
        { value: "dark", title: "Dark", icon: "moon" },
        { value: "high-contrast-light", title: "High Contrast Light", icon: "contrast" },
        { value: "high-contrast-dark", title: "High Contrast Dark", icon: "contrast" },
      ],
      showName: true,
    },
  },
};

// Decorator that applies theme to the preview iframe
export const decorators = [
  (story: () => unknown, context: { globals: { theme: string } }) => {
    const theme = context.globals.theme;
    document.documentElement.setAttribute("data-theme", theme);
    return story();
  },
];
```

#### Accessibility Testing in Stories

Every component story includes an accessibility check panel via the `@storybook/addon-a11y` addon (which uses axe-core):

```typescript
// src/components/hds-button/hds-button.stories.ts
import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "./hds-button.js";

const meta: Meta = {
  title: "Components/Button",
  component: "hds-button",
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger"],
    },
    disabled: {
      control: "boolean",
    },
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          // Enforce AAA contrast for healthcare
          { id: "color-contrast-enhanced", enabled: true },
        ],
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Primary: Story = {
  args: { variant: "primary" },
  render: (args) => html`
    <hds-button variant=${args.variant} ?disabled=${args.disabled}>
      Schedule Appointment
    </hds-button>
  `,
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
      <hds-button variant="primary">Primary</hds-button>
      <hds-button variant="secondary">Secondary</hds-button>
      <hds-button variant="danger">Cancel</hds-button>
      <hds-button variant="primary" disabled>Disabled</hds-button>
    </div>
  `,
};
```

---

## 3.11 Drupal Integration Strategy

### How Web Components Connect to Drupal Theming

Drupal renders server-side HTML and applies its own theme layer. Our Web Components integrate at three points:

#### 1. Token Stylesheet Injection

The token CSS file is loaded as a Drupal library:

```yaml
# mytheme.libraries.yml
hds-tokens:
  version: 1.x
  css:
    theme:
      dist/tokens.css: {}

hds-components:
  version: 1.x
  js:
    dist/hds-components.es.js: { attributes: { type: module } }
  dependencies:
    - mytheme/hds-tokens
```

#### 2. Theme Override Mechanism

The Drupal theme can override any semantic or component token by declaring CSS custom properties at a higher specificity:

```css
/* mytheme.css */
:root {
  /* Override primary brand color for this healthcare org */
  --hds-color-interactive-primary: oklch(0.48 0.14 160);  /* Teal */
  --hds-color-interactive-primary-hover: oklch(0.40 0.14 160);

  /* Override card styling */
  --hds-card-border-radius: 1rem;
  --hds-card-padding: 2rem;
}
```

This is the power of the 3-tier system: the Drupal theme overrides semantic tokens, and all components automatically pick up the changes without any Drupal-specific code in the component library.

#### 3. Dark Mode via Drupal

The Drupal theme controls the `data-theme` attribute on `<html>`. This can be set:

- Statically in the theme template (for dark-only sections)
- Dynamically via the ThemeManager JavaScript module
- Per-block using Drupal's Layout Builder (a block can have `data-theme="dark"` on its wrapper)

#### Declarative Shadow DOM (Server-Side Rendering)

As of 2025, Declarative Shadow DOM is supported in all major browsers and is being integrated into Drupal's theming future. For server-rendered pages, components can include their shadow DOM declaratively:

```html
<!-- Drupal Twig template -->
<hds-card>
  <template shadowrootmode="open">
    <style>
      /* Component styles inlined for SSR */
    </style>
    <div class="card-content">
      <slot></slot>
    </div>
  </template>
  <h2>Patient Portal</h2>
  <p>Access your health records securely.</p>
</hds-card>
```

This eliminates the flash-of-unstyled-content (FOUC) that occurs when Web Components hydrate client-side. Lit supports Declarative Shadow DOM via `@lit-labs/ssr`.

### Single Directory Components (SDC) Compatibility

Drupal's Single Directory Components (SDC) module (stable in Drupal 11) provides a standardized component model. Our Web Components can be wrapped as SDCs:

```
components/
  hds-card/
    hds-card.component.yml
    hds-card.twig
    hds-card.css  (optional: light DOM overrides only)
```

```yaml
# hds-card.component.yml
name: HDS Card
status: stable
props:
  type: object
  properties:
    variant:
      type: string
      enum: [default, elevated, outlined]
    heading:
      type: string
slots:
  default:
    title: Card Content
```

```twig
{# hds-card.twig #}
<hds-card variant="{{ variant }}">
  {% if heading %}
    <h2 slot="heading">{{ heading }}</h2>
  {% endif %}
  {{ children }}
</hds-card>
```

---

## 3.12 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

| Task | Deliverable |
|---|---|
| Set up token file structure | `tokens/primitive/`, `tokens/semantic/`, `tokens/component/` |
| Configure Terrazzo build pipeline | `terrazzo.config.js`, npm scripts |
| Define primitive color palette (OKLCH) | Color tokens with AAA contrast verification |
| Define primitive spacing scale | 4px grid system |
| Define primitive type scale | Major Third ratio |
| Generate CSS custom properties | `dist/tokens.css` with light/dark/high-contrast modes |
| Set up Storybook with token documentation | Token pages, theme switcher |

### Phase 2: Core Tokens (Weeks 2-3)

| Task | Deliverable |
|---|---|
| Define all semantic color tokens | Surface, text, interactive, feedback, border |
| Define semantic spacing tokens | Inset, stack, inline categories |
| Define semantic typography tokens | Heading, body, label composites |
| Build contrast checking plugin | Automated AAA verification in build |
| Set up font loading | Variable font, preload, `@font-face` declarations |
| Document all tokens in Storybook | MDX pages with card/table views |

### Phase 3: Component Tokens (Weeks 3-4)

| Task | Deliverable |
|---|---|
| Define button component tokens | All variants (primary, secondary, danger) |
| Define card component tokens | Surface, border, spacing |
| Define input component tokens | Field, label, error, helper text |
| Define alert component tokens | Info, success, warning, error |
| Verify fallback chains work | Component -> semantic -> hardcoded |
| Drupal theme integration proof-of-concept | Token override from Drupal CSS |

### Phase 4: Polish & Documentation (Week 4)

| Task | Deliverable |
|---|---|
| Full accessibility audit | WCAG AAA compliance report |
| Forced colors mode testing | Windows High Contrast Mode verification |
| Reduced motion testing | All transitions have `prefers-reduced-motion` |
| Storybook a11y addon configuration | AAA rules enabled |
| Token versioning setup | Semver, CHANGELOG, npm package |
| Drupal SDC wrapper templates | Twig templates for all components |

---

## References & Sources

### Specifications
- [W3C Design Tokens Specification 2025.10](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- [Design Tokens Community Group](https://www.designtokens.org/)
- [WCAG 2.1 Contrast (Enhanced) - Understanding SC 1.4.6](https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html)

### Tooling
- [Terrazzo -- DTCG Token Build Tool](https://terrazzo.app/)
- [Terrazzo Modes + Theming](https://terrazzo.app/docs/guides/modes/)
- [Terrazzo CSS Integration](https://terrazzo.app/docs/integrations/css/)
- [Style Dictionary v4 DTCG Support](https://styledictionary.com/info/dtcg/)
- [Style Dictionary Configuration](https://styledictionary.com/reference/config/)

### Web Components & Lit
- [Lit Component Styles](https://lit.dev/docs/components/styles/)
- [Lit Cheat Sheet](https://lit.dev/articles/lit-cheat-sheet/)
- [Web Components: Working With Shadow DOM (Smashing Magazine)](https://www.smashingmagazine.com/2025/07/web-components-working-with-shadow-dom/)
- [Container Queries in Web Components (Max Boeck)](https://mxb.dev/blog/container-queries-web-components/)
- [CSS Container Queries in Web Components (Cory Rylan)](https://coryrylan.com/blog/css-container-queries-in-web-components)

### Design Token Architecture
- [Design Token-Based UI Architecture (Martin Fowler)](https://martinfowler.com/articles/design-token-based-ui-architecture.html)
- [Design Tokens -- VA.gov Design System](https://design.va.gov/foundation/design-tokens)
- [Naming Best Practices (Smashing Magazine)](https://www.smashingmagazine.com/2024/05/naming-best-practices/)
- [Naming Tokens in Design Systems (Nathan Curtis / EightShapes)](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676)
- [Design Tokens Explained (Contentful)](https://www.contentful.com/blog/design-token-system/)

### Theming & Dark Mode
- [CSS light-dark() function (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark)
- [Dark Mode 2025: CSS light-dark() Guide](https://medium.com/front-end-weekly/forget-javascript-achieve-dark-mode-effortlessly-with-brand-new-css-function-light-dark-2024-94981c61756b)
- [Container Style Queries & Scoped CSS Variables 2025](https://johal.in/container-style-queries-scoped-css-variables-2025/)

### Typography & Accessibility
- [Fluid Type Scale with CSS Clamp (Aleksandr Hovhannisyan)](https://www.aleksandrhovhannisyan.com/blog/fluid-type-scale-with-css-clamp/)
- [Addressing Accessibility Concerns with Fluid Type (Smashing Magazine)](https://www.smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type/)
- [Color Contrast Accessibility: WCAG 2025 Guide](https://www.allaccessible.org/blog/color-contrast-accessibility-wcag-guide-2025)
- [CSS Media Features for Accessibility](https://a11y-blog.dev/en/articles/css-media-features-for-a11y/)

### Drupal Integration
- [Declarative Shadow DOM and the Future of Drupal Theming](https://john.albin.net/presentations/2025-11-18/declarative-shadow-dom-and-future-drupal-theming)
- [Drupal Meets Design Systems (Enterprise UI Consistency)](https://medium.com/@drupart-digital/drupal-meets-design-systems-a-new-era-in-enterprise-ui-consistency-86b4cc4a0b8a)
- [Web Components Drupal Module](https://www.drupal.org/project/webcomponents)
- [Custom Elements Drupal Module](https://www.drupal.org/project/custom_elements)

### Storybook
- [Storybook Design Token Addon](https://storybook.js.org/addons/storybook-design-token)
- [Documenting Web Components with Storybook (James Ives)](https://jamesiv.es/blog/frontend/javascript/2025/02/19/documenting-web-components-with-storybook/)
- [Custom Elements Manifest (Open WC)](https://custom-elements-manifest.open-wc.org/blog/intro/)
- [Storybook Helpers (WC Toolkit)](https://wc-toolkit.com/integrations/storybook/)
