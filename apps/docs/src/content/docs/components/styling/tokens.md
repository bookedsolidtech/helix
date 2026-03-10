---
title: Design Token Architecture
description: Complete guide to the three-tier design token system powering wc-2026 components, including primitive tokens, semantic tokens, component tokens, token naming conventions, fallback chains, and theming strategies.
sidebar:
  order: 3
---

Design tokens are the **single source of truth** for all visual design decisions in wc-2026. They form a cascading three-tier system that enables global theming, component-level customization, and multi-brand deployments without modifying component internals.

This guide covers the complete token architecture: primitive tokens, semantic tokens, component tokens, naming conventions, fallback chains, token categories (color, spacing, typography, timing), real-world examples from wc-2026, and theming strategies for consumers.

---

## Prerequisites

Before diving into token architecture, ensure you understand:

- [Component Styling Fundamentals](/components/styling/fundamentals) — Shadow DOM styling, `:host` selectors, CSS custom properties
- Basic CSS custom properties (`--property-name` syntax)
- CSS cascade and inheritance rules

---

## What Are Design Tokens?

Design tokens are **named entities that store visual design decisions**. Instead of hardcoding values like `#2563eb` or `0.5rem` directly in component styles, you reference tokens like `--hx-color-primary-500` or `--hx-space-2`.

### Why Tokens Matter

**Without tokens:**

```css
/* Component styles — hardcoded values */
.button {
  background: #2563eb;
  padding: 0.5rem 1rem;
  font-weight: 600;
  border-radius: 0.375rem;
}
```

**Problems:**

- Changing the brand color requires editing every component
- No way to support dark mode without rewriting styles
- Impossible to create white-label themes
- Design decisions buried in implementation details

**With tokens:**

```css
/* Component styles — token-based */
.button {
  background: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));
  padding: var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem);
  font-weight: var(--hx-button-font-weight, var(--hx-font-weight-semibold, 600));
  border-radius: var(--hx-button-border-radius, var(--hx-border-radius-md, 0.375rem));
}
```

**Benefits:**

- Global theme change: override `--hx-color-primary-500` once
- Dark mode: swap token values, components adapt automatically
- White-label: each brand defines their own token values
- Design decisions are explicit and documented

### How Tokens Work with Shadow DOM

CSS custom properties (the mechanism behind tokens) are unique among CSS properties: they **inherit across shadow boundaries**. This is not a bug — it is the design.

```html
<style>
  :root {
    --hx-color-primary-500: #007878; /* Teal brand color */
  }
</style>

<hx-button>
  #shadow-root
  <style>
    .button {
      background: var(--hx-color-primary-500, #2563eb);
      /* Resolves to #007878 (inherited from :root) */
    }
  </style>
  <button class="button">Click Me</button>
</hx-button>
```

Even though the shadow boundary blocks external selectors from reaching into the component, CSS custom properties **inherit naturally** from parent to child, crossing shadow boundaries. This makes tokens the perfect theming mechanism for Web Components.

---

## Three-Tier Token Architecture

wc-2026 uses a **three-tier cascade** that separates raw values (primitives), purpose-based values (semantic), and component-specific overrides (component tokens).

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  TIER 1: PRIMITIVE TOKENS                                    │
│  Raw values — #2563eb, 1rem, 600                            │
│  No semantic meaning — "blue-500" not "primary"             │
│  PRIVATE — never exposed to consumers                        │
└──────────────────────────────────────────────────────────────┘
         │  (aliased by)
         ↓
┌──────────────────────────────────────────────────────────────┐
│  TIER 2: SEMANTIC TOKENS                                     │
│  Purpose-based — --hx-color-primary-500, --hx-space-4       │
│  PUBLIC API — the primary theming interface                 │
│  Mode-aware — light/dark/high-contrast variants             │
└──────────────────────────────────────────────────────────────┘
         │  (aliased by)
         ↓
┌──────────────────────────────────────────────────────────────┐
│  TIER 3: COMPONENT TOKENS                                    │
│  Component-specific — --hx-button-bg, --hx-card-padding     │
│  OPTIONAL — defaults to semantic tokens if unset            │
│  Override points — surgical component customization          │
└──────────────────────────────────────────────────────────────┘
```

### Why Three Tiers?

**One tier** (only primitives):

- Consumers must know which blue shade to use for every context
- No consistency: button might use `blue-500`, card uses `blue-600`
- Theming requires changing 50+ individual values

**Two tiers** (primitives + component):

- No global theming layer
- To change the primary color, you must override every component token individually
- Duplicated work: `--hx-button-bg`, `--hx-link-color`, `--hx-badge-bg` all set to the same value

**Three tiers** (primitives + semantic + component):

- **Global theming**: Override `--hx-color-primary-500` once, all components adapt
- **Component precision**: Override `--hx-button-bg` for one specific component
- **Consistency**: All "primary" uses reference the same semantic token by default
- **Flexibility**: Choose the right level of granularity for each use case

---

## Tier 1: Primitive Tokens

Primitive tokens define **what** styles are available. They are raw, context-free values that form the palette and scales of the design system.

### Characteristics

- **Private** — Consumers never reference primitives directly
- **Context-free** — No semantic meaning (e.g., "blue-500" not "primary")
- **Comprehensive** — Full palette/scale, not just what's currently used
- **Hardcoded fallbacks** — The last resort in fallback chains

### Color Primitives

```css
/* Primitive tokens (used internally, not exposed) */
--hx-blue-50: #eff6ff;
--hx-blue-100: #dbeafe;
--hx-blue-200: #bfdbfe;
--hx-blue-300: #93c5fd;
--hx-blue-400: #60a5fa;
--hx-blue-500: #3b82f6; /* Base blue */
--hx-blue-600: #2563eb;
--hx-blue-700: #1d4ed8;
--hx-blue-800: #1e40af;
--hx-blue-900: #1e3a8a;
--hx-blue-950: #172554;
```

```css
/* Neutral palette (grayscale) */
--hx-neutral-0: #ffffff;
--hx-neutral-50: #f8f9fa;
--hx-neutral-100: #f1f5f9;
--hx-neutral-200: #e9ecef;
--hx-neutral-300: #dee2e6;
--hx-neutral-400: #ced4da;
--hx-neutral-500: #adb5bd;
--hx-neutral-600: #6c757d;
--hx-neutral-700: #495057;
--hx-neutral-800: #343a40;
--hx-neutral-900: #212529;
--hx-neutral-950: #1a1a1a;
```

### Spacing Primitives

```css
/* 4px base unit scale */
--hx-spacing-0: 0;
--hx-spacing-px: 1px;
--hx-spacing-0-5: 0.125rem; /* 2px */
--hx-spacing-1: 0.25rem; /* 4px */
--hx-spacing-1-5: 0.375rem; /* 6px */
--hx-spacing-2: 0.5rem; /* 8px */
--hx-spacing-3: 0.75rem; /* 12px */
--hx-spacing-4: 1rem; /* 16px */
--hx-spacing-5: 1.25rem; /* 20px */
--hx-spacing-6: 1.5rem; /* 24px */
--hx-spacing-8: 2rem; /* 32px */
--hx-spacing-10: 2.5rem; /* 40px */
--hx-spacing-12: 3rem; /* 48px */
--hx-spacing-16: 4rem; /* 64px */
--hx-spacing-20: 5rem; /* 80px */
--hx-spacing-24: 6rem; /* 96px */
```

### Typography Primitives

```css
/* Font families */
--hx-font-family-sans-primitive:
  system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--hx-font-family-serif-primitive: Georgia, 'Times New Roman', Times, serif;
--hx-font-family-mono-primitive: 'Courier New', Courier, monospace;

/* Font weights */
--hx-font-weight-normal-primitive: 400;
--hx-font-weight-medium-primitive: 500;
--hx-font-weight-semibold-primitive: 600;
--hx-font-weight-bold-primitive: 700;

/* Font sizes (Major Third scale, ratio 1.250) */
--hx-font-size-2xs-primitive: 0.625rem; /* 10px */
--hx-font-size-xs-primitive: 0.75rem; /* 12px */
--hx-font-size-sm-primitive: 0.875rem; /* 14px */
--hx-font-size-md-primitive: 1rem; /* 16px */
--hx-font-size-lg-primitive: 1.125rem; /* 18px */
--hx-font-size-xl-primitive: 1.25rem; /* 20px */
--hx-font-size-2xl-primitive: 1.5rem; /* 24px */
--hx-font-size-3xl-primitive: 1.875rem; /* 30px */
--hx-font-size-4xl-primitive: 2.25rem; /* 36px */
--hx-font-size-5xl-primitive: 3rem; /* 48px */

/* Line heights */
--hx-line-height-tight-primitive: 1.25;
--hx-line-height-snug-primitive: 1.375;
--hx-line-height-normal-primitive: 1.5;
--hx-line-height-relaxed-primitive: 1.625;
--hx-line-height-loose-primitive: 2;
```

### Other Primitive Categories

```css
/* Border radii */
--hx-border-radius-none-primitive: 0;
--hx-border-radius-sm-primitive: 0.125rem; /* 2px */
--hx-border-radius-md-primitive: 0.25rem; /* 4px */
--hx-border-radius-lg-primitive: 0.375rem; /* 6px */
--hx-border-radius-xl-primitive: 0.5rem; /* 8px */
--hx-border-radius-2xl-primitive: 0.75rem; /* 12px */
--hx-border-radius-full-primitive: 9999px;

/* Border widths */
--hx-border-width-thin-primitive: 1px;
--hx-border-width-medium-primitive: 2px;
--hx-border-width-thick-primitive: 4px;

/* Shadows */
--hx-shadow-sm-primitive: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--hx-shadow-md-primitive: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--hx-shadow-lg-primitive: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--hx-shadow-xl-primitive: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--hx-shadow-2xl-primitive: 0 25px 50px -12px rgb(0 0 0 / 0.25);

/* Transitions */
--hx-transition-fast-primitive: 150ms ease;
--hx-transition-normal-primitive: 250ms ease;
--hx-transition-slow-primitive: 350ms ease;
```

### Primitive Token Rules

1. **Never expose primitives to consumers** — They are internal implementation details
2. **Use descriptive scale naming** — `blue-500` not `primary-blue`
3. **Provide comprehensive scales** — Include shades you don't currently use (future-proofing)
4. **No semantic meaning** — `blue-600` does not imply "button background"

---

## Tier 2: Semantic Tokens

Semantic tokens define **how** primitive values are applied. They carry purpose and meaning. These are the **public API** of the design system — the tokens that consumers and theme authors interact with.

### Characteristics

- **Public** — Exposed to consumers for theming
- **Purpose-driven** — Names describe intent (e.g., `color-primary-500` not `blue-600`)
- **Mode-aware** — Can have different values in light/dark/high-contrast modes
- **Consistency** — Used consistently across all components

### Color Semantics

#### Primary Colors

```css
/* Primary color (brand identity) */
--hx-color-primary-50: var(--hx-blue-50-primitive, #eff6ff);
--hx-color-primary-100: var(--hx-blue-100-primitive, #dbeafe);
--hx-color-primary-200: var(--hx-blue-200-primitive, #bfdbfe);
--hx-color-primary-300: var(--hx-blue-300-primitive, #93c5fd);
--hx-color-primary-400: var(--hx-blue-400-primitive, #60a5fa);
--hx-color-primary-500: var(--hx-blue-500-primitive, #3b82f6);
--hx-color-primary-600: var(--hx-blue-600-primitive, #2563eb);
--hx-color-primary-700: var(--hx-blue-700-primitive, #1d4ed8);
--hx-color-primary-800: var(--hx-blue-800-primitive, #1e40af);
--hx-color-primary-900: var(--hx-blue-900-primitive, #1e3a8a);
--hx-color-primary-950: var(--hx-blue-950-primitive, #172554);
```

#### Neutral Colors

```css
/* Neutral colors (text, backgrounds, borders) */
--hx-color-neutral-0: var(--hx-neutral-0-primitive, #ffffff);
--hx-color-neutral-50: var(--hx-neutral-50-primitive, #f8f9fa);
--hx-color-neutral-100: var(--hx-neutral-100-primitive, #f1f5f9);
--hx-color-neutral-200: var(--hx-neutral-200-primitive, #e9ecef);
--hx-color-neutral-300: var(--hx-neutral-300-primitive, #dee2e6);
--hx-color-neutral-400: var(--hx-neutral-400-primitive, #ced4da);
--hx-color-neutral-500: var(--hx-neutral-500-primitive, #adb5bd);
--hx-color-neutral-600: var(--hx-neutral-600-primitive, #6c757d);
--hx-color-neutral-700: var(--hx-neutral-700-primitive, #495057);
--hx-color-neutral-800: var(--hx-neutral-800-primitive, #343a40);
--hx-color-neutral-900: var(--hx-neutral-900-primitive, #212529);
```

#### Feedback Colors

```css
/* Success (green) */
--hx-color-success-50: #ecfdf5;
--hx-color-success-100: #d1fae5;
--hx-color-success-500: #10b981;
--hx-color-success-700: #15803d;
--hx-color-success-800: #166534;

/* Warning (yellow/amber) */
--hx-color-warning-50: #fffbeb;
--hx-color-warning-100: #fef3c7;
--hx-color-warning-500: #f59e0b;
--hx-color-warning-700: #b45309;
--hx-color-warning-800: #92400e;

/* Error (red) */
--hx-color-error-50: #fef2f2;
--hx-color-error-100: #fee2e2;
--hx-color-error-500: #ef4444;
--hx-color-error-700: #b91c1c;
--hx-color-error-800: #991b1b;

/* Info (blue) */
--hx-color-info-50: #e8f4fd;
--hx-color-info-100: #d1e9fb;
--hx-color-info-500: #3b82f6;
--hx-color-info-700: #1d4ed8;
--hx-color-info-800: #1e40af;
```

### Spacing Semantics

```css
/* Space scale (general-purpose spacing) */
--hx-space-0: 0;
--hx-space-px: 1px;
--hx-space-0-5: 0.125rem;
--hx-space-1: 0.25rem;
--hx-space-1-5: 0.375rem;
--hx-space-2: 0.5rem;
--hx-space-3: 0.75rem;
--hx-space-4: 1rem;
--hx-space-5: 1.25rem;
--hx-space-6: 1.5rem;
--hx-space-8: 2rem;
--hx-space-10: 2.5rem;
--hx-space-12: 3rem;
--hx-space-16: 4rem;
--hx-space-20: 5rem;
--hx-space-24: 6rem;

/* Size scale (for fixed dimensions like min-height) */
--hx-size-4: 1rem; /* 16px */
--hx-size-5: 1.25rem; /* 20px */
--hx-size-8: 2rem; /* 32px */
--hx-size-10: 2.5rem; /* 40px */
--hx-size-12: 3rem; /* 48px */
--hx-size-16: 4rem; /* 64px */
--hx-size-20: 5rem; /* 80px */
```

### Typography Semantics

```css
/* Font families */
--hx-font-family-sans: var(--hx-font-family-sans-primitive, system-ui, sans-serif);
--hx-font-family-serif: var(--hx-font-family-serif-primitive, Georgia, serif);
--hx-font-family-mono: var(--hx-font-family-mono-primitive, 'Courier New', monospace);

/* Font weights */
--hx-font-weight-normal: var(--hx-font-weight-normal-primitive, 400);
--hx-font-weight-medium: var(--hx-font-weight-medium-primitive, 500);
--hx-font-weight-semibold: var(--hx-font-weight-semibold-primitive, 600);
--hx-font-weight-bold: var(--hx-font-weight-bold-primitive, 700);

/* Font sizes */
--hx-font-size-2xs: var(--hx-font-size-2xs-primitive, 0.625rem);
--hx-font-size-xs: var(--hx-font-size-xs-primitive, 0.75rem);
--hx-font-size-sm: var(--hx-font-size-sm-primitive, 0.875rem);
--hx-font-size-md: var(--hx-font-size-md-primitive, 1rem);
--hx-font-size-lg: var(--hx-font-size-lg-primitive, 1.125rem);
--hx-font-size-xl: var(--hx-font-size-xl-primitive, 1.25rem);
--hx-font-size-2xl: var(--hx-font-size-2xl-primitive, 1.5rem);
--hx-font-size-3xl: var(--hx-font-size-3xl-primitive, 1.875rem);
--hx-font-size-4xl: var(--hx-font-size-4xl-primitive, 2.25rem);
--hx-font-size-5xl: var(--hx-font-size-5xl-primitive, 3rem);

/* Line heights */
--hx-line-height-tight: var(--hx-line-height-tight-primitive, 1.25);
--hx-line-height-snug: var(--hx-line-height-snug-primitive, 1.375);
--hx-line-height-normal: var(--hx-line-height-normal-primitive, 1.5);
--hx-line-height-relaxed: var(--hx-line-height-relaxed-primitive, 1.625);
--hx-line-height-loose: var(--hx-line-height-loose-primitive, 2);
```

### Other Semantic Categories

```css
/* Border radii */
--hx-border-radius-none: 0;
--hx-border-radius-sm: 0.125rem;
--hx-border-radius-md: 0.25rem;
--hx-border-radius-lg: 0.375rem;
--hx-border-radius-xl: 0.5rem;
--hx-border-radius-2xl: 0.75rem;
--hx-border-radius-full: 9999px;

/* Border widths */
--hx-border-width-thin: 1px;
--hx-border-width-medium: 2px;
--hx-border-width-thick: 4px;

/* Shadows */
--hx-shadow-none: none;
--hx-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--hx-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--hx-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--hx-shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

/* Transitions */
--hx-transition-fast: 150ms ease;
--hx-transition-normal: 250ms ease;
--hx-transition-slow: 350ms ease;

/* Focus ring */
--hx-focus-ring-width: 2px;
--hx-focus-ring-offset: 2px;
--hx-focus-ring-color: var(--hx-color-primary-500, #2563eb);
--hx-focus-ring-opacity: 0.25;

/* Opacity */
--hx-opacity-disabled: 0.5;
--hx-opacity-hover: 0.9;
--hx-opacity-active: 0.8;

/* Transforms */
--hx-transform-lift-sm: -1px;
--hx-transform-lift-md: -2px;
--hx-transform-lift-lg: -4px;
```

### Semantic Token Rules

1. **Name by purpose, not appearance** — `--hx-color-primary-500` not `--hx-color-blue`
2. **Provide complete scales** — Include all shades of each palette
3. **Mode-aware defaults** — Semantic tokens can change in dark mode
4. **Document thoroughly** — Every token has JSDoc describing usage

---

## Tier 3: Component Tokens

Component tokens define **where** semantic values are applied to specific component surfaces. They act as override points — if unset, they fall back to their semantic alias.

### Characteristics

- **Optional** — Components work fine with only semantic tokens
- **Surgical** — Override one component without affecting others
- **Fallback** — Always alias to semantic tokens by default
- **Documented** — Listed in component JSDoc and CEM

### Button Component Tokens

```css
/* hx-button tokens (all optional) */
--hx-button-bg: var(--hx-color-primary-500, #2563eb);
--hx-button-color: var(--hx-color-neutral-0, #ffffff);
--hx-button-border-color: transparent;
--hx-button-border-radius: var(--hx-border-radius-md, 0.375rem);
--hx-button-font-family: var(--hx-font-family-sans, sans-serif);
--hx-button-font-weight: var(--hx-font-weight-semibold, 600);
--hx-button-focus-ring-color: var(--hx-focus-ring-color, #2563eb);
--hx-button-padding-x: var(--hx-space-4, 1rem);
--hx-button-padding-y: var(--hx-space-2, 0.5rem);
```

**Usage in hx-button component:**

```typescript
// hx-button.styles.ts
export const wcButtonStyles = css`
  :host {
    display: inline-block;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-2, 0.5rem);
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem);

    /* Component token → Semantic token → Primitive fallback */
    background-color: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));
    color: var(--hx-button-color, var(--hx-color-neutral-0, #ffffff));
    border: var(--hx-border-width-thin, 1px) solid var(--hx-button-border-color, transparent);
    border-radius: var(--hx-button-border-radius, var(--hx-border-radius-md, 0.375rem));

    font-family: var(--hx-button-font-family, var(--hx-font-family-sans, sans-serif));
    font-weight: var(--hx-button-font-weight, var(--hx-font-weight-semibold, 600));

    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease);
  }

  .button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-button-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .button:hover {
    filter: brightness(var(--hx-filter-brightness-hover, 0.9));
  }
`;
```

### Card Component Tokens

```css
/* hx-card tokens (all optional) */
--hx-card-bg: var(--hx-color-neutral-0, #ffffff);
--hx-card-color: var(--hx-color-neutral-800, #212529);
--hx-card-border-color: var(--hx-color-neutral-200, #dee2e6);
--hx-card-border-radius: var(--hx-border-radius-lg, 0.5rem);
--hx-card-padding: var(--hx-space-6, 1.5rem);
--hx-card-shadow: var(--hx-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
```

### Input Component Tokens

```css
/* hx-text-input tokens (all optional) */
--hx-input-bg: var(--hx-color-neutral-0, #ffffff);
--hx-input-color: var(--hx-color-neutral-800, #212529);
--hx-input-border-color: var(--hx-color-neutral-300, #ced4da);
--hx-input-border-radius: var(--hx-border-radius-md, 0.375rem);
--hx-input-font-family: var(--hx-font-family-sans, sans-serif);
--hx-input-label-color: var(--hx-color-neutral-700, #343a40);
--hx-input-focus-ring-color: var(--hx-focus-ring-color, #2563eb);
--hx-input-error-color: var(--hx-color-error-500, #dc3545);
```

### Alert Component Tokens

```css
/* hx-alert tokens (all optional) */
--hx-alert-gap: var(--hx-space-3, 0.75rem);
--hx-alert-padding: var(--hx-space-4, 1rem);
--hx-alert-border-width: var(--hx-border-width-thin, 1px);
--hx-alert-border-radius: var(--hx-border-radius-md, 0.375rem);
--hx-alert-font-family: var(--hx-font-family-sans, sans-serif);
--hx-alert-bg: var(--hx-color-info-50, #e8f4fd);
--hx-alert-border-color: var(--hx-color-info-200, #b3d9ef);
--hx-alert-color: var(--hx-color-info-800, #1a3a4a);
--hx-alert-icon-color: var(--hx-color-info-500, #3b82f6);
```

### Component Token Rules

1. **Always fallback to semantic tokens** — Never hardcode component token values
2. **Flat hierarchy** — `--hx-button-bg` not `--hx-button-primary-bg` (variants handled in component CSS)
3. **Consistent naming** — `{component}-{property}` pattern
4. **Optional adoption** — Add component tokens only when consumers need them

---

## Token Naming Conventions

All wc-2026 tokens follow a strict naming pattern for consistency and discoverability.

### Naming Structure

```
--{prefix}-{category}-{property}-{variant?}-{state?}
```

| Segment    | Required | Description          | Examples                     |
| ---------- | -------- | -------------------- | ---------------------------- |
| `prefix`   | Yes      | Namespace (`wc`)     | `wc`                         |
| `category` | Yes      | Token category       | `color`, `space`, `font`     |
| `property` | Yes      | Specific property    | `primary`, `neutral`, `size` |
| `variant`  | Optional | Shade/scale position | `50`, `100`, `500`, `900`    |
| `state`    | Optional | Interactive state    | `hover`, `active`, `focus`   |

### Color Token Names

**Pattern**: `--hx-color-{palette}-{shade}`

```css
--hx-color-primary-500      /* Primary brand color (base) */
--hx-color-primary-50       /* Very light primary */
--hx-color-primary-900      /* Very dark primary */

--hx-color-neutral-0        /* Pure white */
--hx-color-neutral-800      /* Near black */

--hx-color-success-500      /* Success green */
--hx-color-error-500        /* Error red */
--hx-color-warning-500      /* Warning yellow/amber */
--hx-color-info-500         /* Info blue */
```

### Spacing Token Names

**Pattern**: `--hx-space-{scale}` or `--hx-size-{scale}`

```css
--hx-space-1       /* 0.25rem = 4px */
--hx-space-2       /* 0.5rem = 8px */
--hx-space-4       /* 1rem = 16px */
--hx-space-6       /* 1.5rem = 24px */

--hx-size-10       /* Fixed size 2.5rem = 40px (for min-height, etc.) */
--hx-size-12       /* Fixed size 3rem = 48px */
```

### Typography Token Names

**Pattern**: `--hx-font-{property}-{scale}`

```css
--hx-font-family-sans       /* Sans-serif stack */
--hx-font-family-serif      /* Serif stack */
--hx-font-family-mono       /* Monospace stack */

--hx-font-weight-normal     /* 400 */
--hx-font-weight-semibold   /* 600 */
--hx-font-weight-bold       /* 700 */

--hx-font-size-xs           /* Extra small */
--hx-font-size-sm           /* Small */
--hx-font-size-md           /* Medium (base) */
--hx-font-size-lg           /* Large */
--hx-font-size-xl           /* Extra large */

--hx-line-height-tight      /* 1.25 */
--hx-line-height-normal     /* 1.5 */
--hx-line-height-loose      /* 2 */
```

### Component Token Names

**Pattern**: `--hx-{component}-{property}`

```css
--hx-button-bg              /* Button background */
--hx-button-color           /* Button text color */
--hx-button-border-radius   /* Button corner radius */

--hx-card-bg                /* Card background */
--hx-card-padding           /* Card inner padding */
--hx-card-border-color      /* Card border */

--hx-input-border-color     /* Input border */
--hx-input-focus-ring-color /* Input focus ring */
--hx-input-error-color      /* Input error state */
```

### Naming Rules

1. **All lowercase** — No camelCase, PascalCase, or UPPER_CASE
2. **Hyphen-separated** — Use `-` between segments
3. **Prefix always first** — `--hx-` comes before everything
4. **No abbreviations** (except universal ones) — `bg` ✓, `clr` ✗
5. **Scale as suffix** — `primary-500` not `500-primary`
6. **State as final suffix** — `primary-hover` not `hover-primary`

---

## Fallback Chains

Every CSS custom property in wc-2026 uses a **two-level fallback chain** (or three-level for component tokens).

### The Two-Level Pattern

```css
property: var(--hx-semantic-token, primitive-value);
```

**Example:**

```css
.button {
  background: var(--hx-color-primary-500, #2563eb);
  /*          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   *          Semantic token         | Primitive fallback
   */
}
```

**Resolution order:**

1. `--hx-color-primary-500` (semantic token — can be overridden by consumer)
2. `#2563eb` (primitive fallback — last resort if token unset)

### The Three-Level Pattern

```css
property: var(--hx-component-token, var(--hx-semantic-token, primitive-value));
```

**Example:**

```css
.button {
  background: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));
  /*          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   *          Component token  | Semantic token      | Primitive fallback
   */
}
```

**Resolution order:**

1. `--hx-button-bg` (component token — most specific, optional)
2. `--hx-color-primary-500` (semantic token — global theming)
3. `#2563eb` (primitive fallback — last resort)

### Why This Pattern?

**Problem: One level**

```css
/* One-level fallback */
.button {
  background: var(--hx-button-bg, #2563eb);
}
```

- **Con**: No global theming. To change the primary color, you must override every component token individually.
- **Con**: Duplicates values across multiple component tokens.

**Problem: Three levels without semantic**

```css
/* Three levels, but missing semantic */
.button {
  background: var(--hx-button-bg, var(--hx-blue-600, #2563eb));
}
```

- **Con**: Still no semantic layer. Consumers override primitives directly, which leaks implementation details.

**Solution: Two or three levels with semantic**

```css
/* Two levels (most common) */
.card {
  background: var(--hx-color-neutral-0, #ffffff);
}

/* Three levels (for component customization) */
.button {
  background: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));
}
```

- **Pro**: Global theming works (override `--hx-color-primary-500`)
- **Pro**: Component precision works (override `--hx-button-bg`)
- **Pro**: Fallback works (primitive value if everything unset)

### Fallback Chain Examples

**Spacing:**

```css
.card {
  padding: var(--hx-card-padding, var(--hx-space-6, 1.5rem));
}
```

**Typography:**

```css
.button {
  font-family: var(--hx-button-font-family, var(--hx-font-family-sans, sans-serif));
  font-weight: var(--hx-button-font-weight, var(--hx-font-weight-semibold, 600));
  font-size: var(--hx-font-size-md, 1rem);
}
```

**Borders:**

```css
.card {
  border: var(--hx-border-width-thin, 1px) solid
    var(--hx-card-border-color, var(--hx-color-neutral-200, #dee2e6));
  border-radius: var(--hx-card-border-radius, var(--hx-border-radius-lg, 0.5rem));
}
```

**Shadows:**

```css
.card {
  box-shadow: var(--hx-card-shadow, var(--hx-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1)));
}
```

**Focus ring:**

```css
.button:focus-visible {
  outline: var(--hx-focus-ring-width, 2px) solid
    var(--hx-button-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
  outline-offset: var(--hx-focus-ring-offset, 2px);
}
```

---

## Theming Strategies

Tokens enable powerful theming capabilities. Here are common theming patterns for consumers.

### Global Brand Theming

**Use case:** Change the primary brand color across all components.

```css
/* Consumer's theme file */
:root {
  /* Override primary color (teal instead of blue) */
  --hx-color-primary-50: #e6f7f7;
  --hx-color-primary-100: #cceff0;
  --hx-color-primary-200: #99dfe0;
  --hx-color-primary-300: #66cfd1;
  --hx-color-primary-400: #33bfc1;
  --hx-color-primary-500: #007878; /* Base teal */
  --hx-color-primary-600: #006666;
  --hx-color-primary-700: #005555;
  --hx-color-primary-800: #004444;
  --hx-color-primary-900: #003333;
  --hx-color-primary-950: #002222;
}
```

**Result:** All components that use `--hx-color-primary-*` now render in teal.

### Component-Specific Theming

**Use case:** Style one button differently without affecting others.

```css
/* Hero CTA button — gradient background */
hx-button.hero-cta {
  --hx-button-bg: linear-gradient(135deg, #ff6b35, #f7931e);
  --hx-button-color: #ffffff;
  --hx-button-border-radius: 2rem; /* Pill shape */
  --hx-button-font-size: 1.25rem;
}
```

```html
<hx-button class="hero-cta" variant="primary"> Get Started Free </hx-button>
```

### Dark Mode Theming

**Use case:** Support light and dark color schemes.

```css
/* Light mode (default) */
:root {
  --hx-color-neutral-0: #ffffff;
  --hx-color-neutral-50: #f8f9fa;
  --hx-color-neutral-800: #343a40;
  --hx-color-neutral-900: #212529;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --hx-color-neutral-0: #212529; /* Inverted */
    --hx-color-neutral-50: #343a40;
    --hx-color-neutral-800: #f8f9fa;
    --hx-color-neutral-900: #ffffff;
  }
}

/* Explicit dark theme via data attribute */
[data-theme='dark'] {
  --hx-color-neutral-0: #212529;
  --hx-color-neutral-50: #343a40;
  --hx-color-neutral-800: #f8f9fa;
  --hx-color-neutral-900: #ffffff;
}
```

**Usage:**

```html
<!-- System preference (default) -->
<html>
  <!-- Force dark theme -->
  <html data-theme="dark">
    <!-- Force light theme -->
    <html data-theme="light"></html>
  </html>
</html>
```

### Typography Theming

**Use case:** Use a custom font family across all components.

```css
:root {
  --hx-font-family-sans: 'Inter', 'Helvetica Neue', Arial, sans-serif;
}
```

**With web font loading:**

```html
<head>
  <!-- Preload font for performance -->
  <link rel="preload" href="/fonts/inter-variable.woff2" as="font" type="font/woff2" crossorigin />

  <style>
    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter-variable.woff2') format('woff2-variations');
      font-weight: 100 900;
      font-display: swap;
    }

    :root {
      --hx-font-family-sans: 'Inter', system-ui, sans-serif;
    }
  </style>
</head>
```

### Spacing Theming

**Use case:** Tighter spacing for compact UIs.

```css
:root {
  --hx-space-1: 0.125rem; /* Half of default */
  --hx-space-2: 0.25rem;
  --hx-space-3: 0.5rem;
  --hx-space-4: 0.75rem;
  --hx-space-6: 1rem;
}
```

### High Contrast Mode

**Use case:** Support users with low vision.

```css
@media (prefers-contrast: more) {
  :root {
    /* Increase border thickness */
    --hx-border-width-thin: 2px;
    --hx-border-width-medium: 3px;

    /* Use stronger borders */
    --hx-color-neutral-200: #000000;
    --hx-color-neutral-300: #000000;

    /* Increase focus ring visibility */
    --hx-focus-ring-width: 3px;
    --hx-focus-ring-offset: 3px;
  }
}
```

---

## Token Documentation in Components

Every component documents its tokens via JSDoc so they appear in Custom Elements Manifest (CEM) and IDE autocomplete.

### Example: hx-button

```typescript
/**
 * A button component with multiple variants and sizes.
 *
 * @slot - Button text content
 * @slot icon - Icon slot (before text)
 *
 * @cssprop [--hx-button-bg=var(--hx-color-primary-500)] - Button background color.
 * @cssprop [--hx-button-color=var(--hx-color-neutral-0)] - Button text color.
 * @cssprop [--hx-button-border-color=transparent] - Button border color.
 * @cssprop [--hx-button-border-radius=var(--hx-border-radius-md)] - Button corner radius.
 * @cssprop [--hx-button-font-family=var(--hx-font-family-sans)] - Button font family.
 * @cssprop [--hx-button-font-weight=var(--hx-font-weight-semibold)] - Button font weight.
 * @cssprop [--hx-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-button-padding-x=var(--hx-space-4)] - Horizontal padding.
 * @cssprop [--hx-button-padding-y=var(--hx-space-2)] - Vertical padding.
 *
 * @csspart button - The native button element.
 *
 * @fires hx-click - Fired when button is clicked (event forwarding from native click)
 */
@customElement('hx-button')
export class HxButton extends LitElement {
  // Component implementation
}
```

### JSDoc Format

```typescript
/**
 * @cssprop [{token-name}={default-value}] - Description of what this token controls.
 */
```

**Rules:**

- Token name in square brackets (optional to override)
- Default value shows the fallback chain
- Description is concise and actionable
- List tokens in logical order (background, text, border, spacing, typography)

---

## Best Practices

### 1. Never Hardcode Values

```css
/* BAD */
.button {
  background: #2563eb;
  padding: 0.5rem 1rem;
  font-weight: 600;
  border-radius: 0.375rem;
}

/* GOOD */
.button {
  background: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));
  padding: var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem);
  font-weight: var(--hx-button-font-weight, var(--hx-font-weight-semibold, 600));
  border-radius: var(--hx-button-border-radius, var(--hx-border-radius-md, 0.375rem));
}
```

### 2. Always Use Two-Level Fallback Chains

```css
/* BAD (missing semantic fallback) */
.card {
  background: var(--hx-card-bg, #ffffff);
}

/* GOOD */
.card {
  background: var(--hx-card-bg, var(--hx-color-neutral-0, #ffffff));
}
```

### 3. Document All Public Tokens

```typescript
/**
 * @cssprop [--hx-card-bg=var(--hx-color-neutral-0)] - Card background color.
 * @cssprop [--hx-card-border-color=var(--hx-color-neutral-200)] - Card border color.
 * @cssprop [--hx-card-border-radius=var(--hx-border-radius-lg)] - Card corner radius.
 * @cssprop [--hx-card-padding=var(--hx-space-6)] - Card inner padding.
 */
@customElement('hx-card')
export class HxCard extends LitElement {}
```

### 4. Maintain Contrast Ratios

All token combinations must meet WCAG 2.1 AA contrast requirements:

- **4.5:1** for normal text (16px and below)
- **3:1** for large text (18pt+ or 14pt+ bold)
- **3:1** for UI components (borders, icons)

```css
/* VERIFY: Does this meet 4.5:1? */
.button {
  background: var(--hx-color-primary-500, #2563eb);
  color: var(--hx-color-neutral-0, #ffffff);
}
/* Answer: Yes — #2563eb on #ffffff = 7.2:1 ratio */
```

Use online contrast checkers or browser DevTools to verify all color combinations.

### 5. Respect Reduced Motion

Every component with transitions or animations respects `prefers-reduced-motion`:

```css
.button {
  transition: background-color var(--hx-transition-fast, 150ms ease);
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }
}
```

### 6. Avoid `!important` with Tokens

```css
/* BAD — prevents consumer customization */
:host {
  background: var(--hx-card-bg, #ffffff) !important;
}

/* GOOD — allows override cascade */
:host {
  background: var(--hx-card-bg, var(--hx-color-neutral-0, #ffffff));
}
```

### 7. Use Semantic Tokens in Components

```css
/* BAD — references primitive directly */
.button {
  background: var(--hx-blue-600, #2563eb);
}

/* GOOD — references semantic token */
.button {
  background: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));
}
```

### 8. Consistent Token Usage Across Components

If multiple components use the same concept, they should reference the same semantic token:

```css
/* All primary buttons use the same token */
.button--primary {
  background: var(--hx-color-primary-500, #2563eb);
}

.badge--primary {
  background: var(--hx-color-primary-500, #2563eb);
}

.link--primary {
  color: var(--hx-color-primary-500, #2563eb);
}
```

---

## Token Versioning

Design tokens are versioned independently from components using semantic versioning.

### Version Bumps

| Change Type       | Version   | Examples                                                   |
| ----------------- | --------- | ---------------------------------------------------------- |
| **Patch** (0.0.x) | Bug fixes | Correcting a contrast ratio, fixing a typo in a token name |
| **Minor** (0.x.0) | Additions | New tokens added, new variants, new component tokens       |
| **Major** (x.0.0) | Breaking  | Removed tokens, renamed tokens, restructured hierarchy     |

### Breaking Changes

**These require a major version bump:**

- Removing a semantic token
- Renaming a semantic token
- Changing the structure of token naming
- Removing a component token that consumers rely on

**These do NOT require a major version bump:**

- Adding new tokens
- Changing primitive values (consumers don't reference primitives)
- Adding new component tokens
- Changing fallback values (primitives in fallback chains)

---

## Summary

Design tokens are the foundation of wc-2026's theming architecture. They provide:

- **Consistency** — All components use the same visual language
- **Flexibility** — Global theming and component-level customization
- **Maintainability** — Change once, apply everywhere
- **Accessibility** — Contrast ratios and visual clarity enforced at the token level
- **Multi-brand support** — White-label deployments through token overrides

**Key takeaways:**

1. **Three-tier architecture** — Primitive → Semantic → Component
2. **Two-level fallback chains** — Semantic token → Primitive fallback (or three-level for component tokens)
3. **Semantic tokens are the public API** — Consumers override these for theming
4. **Component tokens are optional** — Add them when surgical customization is needed
5. **Never hardcode values** — Always use tokens with fallback chains
6. **Document all tokens** — JSDoc for every CSS custom property
7. **Maintain contrast ratios** — WCAG 2.1 AA minimum (4.5:1 for text, 3:1 for UI)
8. **Respect user preferences** — Dark mode, high contrast, reduced motion

---

## Next Steps

- [CSS Parts Guide](/components/shadow-dom/parts) — Expose controlled styling hooks for consumers
- [Slots Guide](/components/shadow-dom/slots) — Compose light DOM into shadow DOM templates
- [Component Fundamentals](/components/fundamentals/overview) — Core concepts and lifecycle
- [Theming Guide](/components/styling/theming) — Complete guide to creating custom themes

---

## Sources

- [MDN: Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [web.dev: Shadow DOM v1](https://web.dev/articles/shadowdom-v1)
- [Design Tokens Community Group](https://www.designtokens.org/)
- [WCAG 2.1: Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Design Token-Based UI Architecture (Martin Fowler)](https://martinfowler.com/articles/design-token-based-ui-architecture.html)
