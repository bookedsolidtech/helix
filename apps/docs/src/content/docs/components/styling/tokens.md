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

Design tokens are **named entities that store visual design decisions**. Instead of hardcoding values like `#2563eb` or `0.5rem` directly in component styles, you reference tokens like `--wc-color-primary-500` or `--wc-space-2`.

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
  background: var(--wc-button-bg, var(--wc-color-primary-500, #2563eb));
  padding: var(--wc-space-2, 0.5rem) var(--wc-space-4, 1rem);
  font-weight: var(--wc-button-font-weight, var(--wc-font-weight-semibold, 600));
  border-radius: var(--wc-button-border-radius, var(--wc-border-radius-md, 0.375rem));
}
```

**Benefits:**

- Global theme change: override `--wc-color-primary-500` once
- Dark mode: swap token values, components adapt automatically
- White-label: each brand defines their own token values
- Design decisions are explicit and documented

### How Tokens Work with Shadow DOM

CSS custom properties (the mechanism behind tokens) are unique among CSS properties: they **inherit across shadow boundaries**. This is not a bug — it is the design.

```html
<style>
  :root {
    --wc-color-primary-500: #007878; /* Teal brand color */
  }
</style>

<wc-button>
  #shadow-root
  <style>
    .button {
      background: var(--wc-color-primary-500, #2563eb);
      /* Resolves to #007878 (inherited from :root) */
    }
  </style>
  <button class="button">Click Me</button>
</wc-button>
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
│  Purpose-based — --wc-color-primary-500, --wc-space-4       │
│  PUBLIC API — the primary theming interface                 │
│  Mode-aware — light/dark/high-contrast variants             │
└──────────────────────────────────────────────────────────────┘
         │  (aliased by)
         ↓
┌──────────────────────────────────────────────────────────────┐
│  TIER 3: COMPONENT TOKENS                                    │
│  Component-specific — --wc-button-bg, --wc-card-padding     │
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
- Duplicated work: `--wc-button-bg`, `--wc-link-color`, `--wc-badge-bg` all set to the same value

**Three tiers** (primitives + semantic + component):

- **Global theming**: Override `--wc-color-primary-500` once, all components adapt
- **Component precision**: Override `--wc-button-bg` for one specific component
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
--wc-blue-50: #eff6ff;
--wc-blue-100: #dbeafe;
--wc-blue-200: #bfdbfe;
--wc-blue-300: #93c5fd;
--wc-blue-400: #60a5fa;
--wc-blue-500: #3b82f6; /* Base blue */
--wc-blue-600: #2563eb;
--wc-blue-700: #1d4ed8;
--wc-blue-800: #1e40af;
--wc-blue-900: #1e3a8a;
--wc-blue-950: #172554;
```

```css
/* Neutral palette (grayscale) */
--wc-neutral-0: #ffffff;
--wc-neutral-50: #f8f9fa;
--wc-neutral-100: #f1f5f9;
--wc-neutral-200: #e9ecef;
--wc-neutral-300: #dee2e6;
--wc-neutral-400: #ced4da;
--wc-neutral-500: #adb5bd;
--wc-neutral-600: #6c757d;
--wc-neutral-700: #495057;
--wc-neutral-800: #343a40;
--wc-neutral-900: #212529;
--wc-neutral-950: #1a1a1a;
```

### Spacing Primitives

```css
/* 4px base unit scale */
--wc-spacing-0: 0;
--wc-spacing-px: 1px;
--wc-spacing-0-5: 0.125rem; /* 2px */
--wc-spacing-1: 0.25rem; /* 4px */
--wc-spacing-1-5: 0.375rem; /* 6px */
--wc-spacing-2: 0.5rem; /* 8px */
--wc-spacing-3: 0.75rem; /* 12px */
--wc-spacing-4: 1rem; /* 16px */
--wc-spacing-5: 1.25rem; /* 20px */
--wc-spacing-6: 1.5rem; /* 24px */
--wc-spacing-8: 2rem; /* 32px */
--wc-spacing-10: 2.5rem; /* 40px */
--wc-spacing-12: 3rem; /* 48px */
--wc-spacing-16: 4rem; /* 64px */
--wc-spacing-20: 5rem; /* 80px */
--wc-spacing-24: 6rem; /* 96px */
```

### Typography Primitives

```css
/* Font families */
--wc-font-family-sans-primitive:
  system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--wc-font-family-serif-primitive: Georgia, 'Times New Roman', Times, serif;
--wc-font-family-mono-primitive: 'Courier New', Courier, monospace;

/* Font weights */
--wc-font-weight-normal-primitive: 400;
--wc-font-weight-medium-primitive: 500;
--wc-font-weight-semibold-primitive: 600;
--wc-font-weight-bold-primitive: 700;

/* Font sizes (Major Third scale, ratio 1.250) */
--wc-font-size-2xs-primitive: 0.625rem; /* 10px */
--wc-font-size-xs-primitive: 0.75rem; /* 12px */
--wc-font-size-sm-primitive: 0.875rem; /* 14px */
--wc-font-size-md-primitive: 1rem; /* 16px */
--wc-font-size-lg-primitive: 1.125rem; /* 18px */
--wc-font-size-xl-primitive: 1.25rem; /* 20px */
--wc-font-size-2xl-primitive: 1.5rem; /* 24px */
--wc-font-size-3xl-primitive: 1.875rem; /* 30px */
--wc-font-size-4xl-primitive: 2.25rem; /* 36px */
--wc-font-size-5xl-primitive: 3rem; /* 48px */

/* Line heights */
--wc-line-height-tight-primitive: 1.25;
--wc-line-height-snug-primitive: 1.375;
--wc-line-height-normal-primitive: 1.5;
--wc-line-height-relaxed-primitive: 1.625;
--wc-line-height-loose-primitive: 2;
```

### Other Primitive Categories

```css
/* Border radii */
--wc-border-radius-none-primitive: 0;
--wc-border-radius-sm-primitive: 0.125rem; /* 2px */
--wc-border-radius-md-primitive: 0.25rem; /* 4px */
--wc-border-radius-lg-primitive: 0.375rem; /* 6px */
--wc-border-radius-xl-primitive: 0.5rem; /* 8px */
--wc-border-radius-2xl-primitive: 0.75rem; /* 12px */
--wc-border-radius-full-primitive: 9999px;

/* Border widths */
--wc-border-width-thin-primitive: 1px;
--wc-border-width-medium-primitive: 2px;
--wc-border-width-thick-primitive: 4px;

/* Shadows */
--wc-shadow-sm-primitive: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--wc-shadow-md-primitive: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--wc-shadow-lg-primitive: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--wc-shadow-xl-primitive: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--wc-shadow-2xl-primitive: 0 25px 50px -12px rgb(0 0 0 / 0.25);

/* Transitions */
--wc-transition-fast-primitive: 150ms ease;
--wc-transition-normal-primitive: 250ms ease;
--wc-transition-slow-primitive: 350ms ease;
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
--wc-color-primary-50: var(--wc-blue-50-primitive, #eff6ff);
--wc-color-primary-100: var(--wc-blue-100-primitive, #dbeafe);
--wc-color-primary-200: var(--wc-blue-200-primitive, #bfdbfe);
--wc-color-primary-300: var(--wc-blue-300-primitive, #93c5fd);
--wc-color-primary-400: var(--wc-blue-400-primitive, #60a5fa);
--wc-color-primary-500: var(--wc-blue-500-primitive, #3b82f6);
--wc-color-primary-600: var(--wc-blue-600-primitive, #2563eb);
--wc-color-primary-700: var(--wc-blue-700-primitive, #1d4ed8);
--wc-color-primary-800: var(--wc-blue-800-primitive, #1e40af);
--wc-color-primary-900: var(--wc-blue-900-primitive, #1e3a8a);
--wc-color-primary-950: var(--wc-blue-950-primitive, #172554);
```

#### Neutral Colors

```css
/* Neutral colors (text, backgrounds, borders) */
--wc-color-neutral-0: var(--wc-neutral-0-primitive, #ffffff);
--wc-color-neutral-50: var(--wc-neutral-50-primitive, #f8f9fa);
--wc-color-neutral-100: var(--wc-neutral-100-primitive, #f1f5f9);
--wc-color-neutral-200: var(--wc-neutral-200-primitive, #e9ecef);
--wc-color-neutral-300: var(--wc-neutral-300-primitive, #dee2e6);
--wc-color-neutral-400: var(--wc-neutral-400-primitive, #ced4da);
--wc-color-neutral-500: var(--wc-neutral-500-primitive, #adb5bd);
--wc-color-neutral-600: var(--wc-neutral-600-primitive, #6c757d);
--wc-color-neutral-700: var(--wc-neutral-700-primitive, #495057);
--wc-color-neutral-800: var(--wc-neutral-800-primitive, #343a40);
--wc-color-neutral-900: var(--wc-neutral-900-primitive, #212529);
```

#### Feedback Colors

```css
/* Success (green) */
--wc-color-success-50: #ecfdf5;
--wc-color-success-100: #d1fae5;
--wc-color-success-500: #10b981;
--wc-color-success-700: #15803d;
--wc-color-success-800: #166534;

/* Warning (yellow/amber) */
--wc-color-warning-50: #fffbeb;
--wc-color-warning-100: #fef3c7;
--wc-color-warning-500: #f59e0b;
--wc-color-warning-700: #b45309;
--wc-color-warning-800: #92400e;

/* Error (red) */
--wc-color-error-50: #fef2f2;
--wc-color-error-100: #fee2e2;
--wc-color-error-500: #ef4444;
--wc-color-error-700: #b91c1c;
--wc-color-error-800: #991b1b;

/* Info (blue) */
--wc-color-info-50: #e8f4fd;
--wc-color-info-100: #d1e9fb;
--wc-color-info-500: #3b82f6;
--wc-color-info-700: #1d4ed8;
--wc-color-info-800: #1e40af;
```

### Spacing Semantics

```css
/* Space scale (general-purpose spacing) */
--wc-space-0: 0;
--wc-space-px: 1px;
--wc-space-0-5: 0.125rem;
--wc-space-1: 0.25rem;
--wc-space-1-5: 0.375rem;
--wc-space-2: 0.5rem;
--wc-space-3: 0.75rem;
--wc-space-4: 1rem;
--wc-space-5: 1.25rem;
--wc-space-6: 1.5rem;
--wc-space-8: 2rem;
--wc-space-10: 2.5rem;
--wc-space-12: 3rem;
--wc-space-16: 4rem;
--wc-space-20: 5rem;
--wc-space-24: 6rem;

/* Size scale (for fixed dimensions like min-height) */
--wc-size-4: 1rem; /* 16px */
--wc-size-5: 1.25rem; /* 20px */
--wc-size-8: 2rem; /* 32px */
--wc-size-10: 2.5rem; /* 40px */
--wc-size-12: 3rem; /* 48px */
--wc-size-16: 4rem; /* 64px */
--wc-size-20: 5rem; /* 80px */
```

### Typography Semantics

```css
/* Font families */
--wc-font-family-sans: var(--wc-font-family-sans-primitive, system-ui, sans-serif);
--wc-font-family-serif: var(--wc-font-family-serif-primitive, Georgia, serif);
--wc-font-family-mono: var(--wc-font-family-mono-primitive, 'Courier New', monospace);

/* Font weights */
--wc-font-weight-normal: var(--wc-font-weight-normal-primitive, 400);
--wc-font-weight-medium: var(--wc-font-weight-medium-primitive, 500);
--wc-font-weight-semibold: var(--wc-font-weight-semibold-primitive, 600);
--wc-font-weight-bold: var(--wc-font-weight-bold-primitive, 700);

/* Font sizes */
--wc-font-size-2xs: var(--wc-font-size-2xs-primitive, 0.625rem);
--wc-font-size-xs: var(--wc-font-size-xs-primitive, 0.75rem);
--wc-font-size-sm: var(--wc-font-size-sm-primitive, 0.875rem);
--wc-font-size-md: var(--wc-font-size-md-primitive, 1rem);
--wc-font-size-lg: var(--wc-font-size-lg-primitive, 1.125rem);
--wc-font-size-xl: var(--wc-font-size-xl-primitive, 1.25rem);
--wc-font-size-2xl: var(--wc-font-size-2xl-primitive, 1.5rem);
--wc-font-size-3xl: var(--wc-font-size-3xl-primitive, 1.875rem);
--wc-font-size-4xl: var(--wc-font-size-4xl-primitive, 2.25rem);
--wc-font-size-5xl: var(--wc-font-size-5xl-primitive, 3rem);

/* Line heights */
--wc-line-height-tight: var(--wc-line-height-tight-primitive, 1.25);
--wc-line-height-snug: var(--wc-line-height-snug-primitive, 1.375);
--wc-line-height-normal: var(--wc-line-height-normal-primitive, 1.5);
--wc-line-height-relaxed: var(--wc-line-height-relaxed-primitive, 1.625);
--wc-line-height-loose: var(--wc-line-height-loose-primitive, 2);
```

### Other Semantic Categories

```css
/* Border radii */
--wc-border-radius-none: 0;
--wc-border-radius-sm: 0.125rem;
--wc-border-radius-md: 0.25rem;
--wc-border-radius-lg: 0.375rem;
--wc-border-radius-xl: 0.5rem;
--wc-border-radius-2xl: 0.75rem;
--wc-border-radius-full: 9999px;

/* Border widths */
--wc-border-width-thin: 1px;
--wc-border-width-medium: 2px;
--wc-border-width-thick: 4px;

/* Shadows */
--wc-shadow-none: none;
--wc-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--wc-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--wc-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--wc-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--wc-shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

/* Transitions */
--wc-transition-fast: 150ms ease;
--wc-transition-normal: 250ms ease;
--wc-transition-slow: 350ms ease;

/* Focus ring */
--wc-focus-ring-width: 2px;
--wc-focus-ring-offset: 2px;
--wc-focus-ring-color: var(--wc-color-primary-500, #2563eb);
--wc-focus-ring-opacity: 0.25;

/* Opacity */
--wc-opacity-disabled: 0.5;
--wc-opacity-hover: 0.9;
--wc-opacity-active: 0.8;

/* Transforms */
--wc-transform-lift-sm: -1px;
--wc-transform-lift-md: -2px;
--wc-transform-lift-lg: -4px;
```

### Semantic Token Rules

1. **Name by purpose, not appearance** — `--wc-color-primary-500` not `--wc-color-blue`
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
/* wc-button tokens (all optional) */
--wc-button-bg: var(--wc-color-primary-500, #2563eb);
--wc-button-color: var(--wc-color-neutral-0, #ffffff);
--wc-button-border-color: transparent;
--wc-button-border-radius: var(--wc-border-radius-md, 0.375rem);
--wc-button-font-family: var(--wc-font-family-sans, sans-serif);
--wc-button-font-weight: var(--wc-font-weight-semibold, 600);
--wc-button-focus-ring-color: var(--wc-focus-ring-color, #2563eb);
--wc-button-padding-x: var(--wc-space-4, 1rem);
--wc-button-padding-y: var(--wc-space-2, 0.5rem);
```

**Usage in wc-button component:**

```typescript
// wc-button.styles.ts
export const wcButtonStyles = css`
  :host {
    display: inline-block;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--wc-space-2, 0.5rem);
    padding: var(--wc-space-2, 0.5rem) var(--wc-space-4, 1rem);

    /* Component token → Semantic token → Primitive fallback */
    background-color: var(--wc-button-bg, var(--wc-color-primary-500, #2563eb));
    color: var(--wc-button-color, var(--wc-color-neutral-0, #ffffff));
    border: var(--wc-border-width-thin, 1px) solid var(--wc-button-border-color, transparent);
    border-radius: var(--wc-button-border-radius, var(--wc-border-radius-md, 0.375rem));

    font-family: var(--wc-button-font-family, var(--wc-font-family-sans, sans-serif));
    font-weight: var(--wc-button-font-weight, var(--wc-font-weight-semibold, 600));

    cursor: pointer;
    transition:
      background-color var(--wc-transition-fast, 150ms ease),
      color var(--wc-transition-fast, 150ms ease),
      border-color var(--wc-transition-fast, 150ms ease);
  }

  .button:focus-visible {
    outline: var(--wc-focus-ring-width, 2px) solid
      var(--wc-button-focus-ring-color, var(--wc-focus-ring-color, #2563eb));
    outline-offset: var(--wc-focus-ring-offset, 2px);
  }

  .button:hover {
    filter: brightness(var(--wc-filter-brightness-hover, 0.9));
  }
`;
```

### Card Component Tokens

```css
/* wc-card tokens (all optional) */
--wc-card-bg: var(--wc-color-neutral-0, #ffffff);
--wc-card-color: var(--wc-color-neutral-800, #212529);
--wc-card-border-color: var(--wc-color-neutral-200, #dee2e6);
--wc-card-border-radius: var(--wc-border-radius-lg, 0.5rem);
--wc-card-padding: var(--wc-space-6, 1.5rem);
--wc-card-shadow: var(--wc-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
```

### Input Component Tokens

```css
/* wc-text-input tokens (all optional) */
--wc-input-bg: var(--wc-color-neutral-0, #ffffff);
--wc-input-color: var(--wc-color-neutral-800, #212529);
--wc-input-border-color: var(--wc-color-neutral-300, #ced4da);
--wc-input-border-radius: var(--wc-border-radius-md, 0.375rem);
--wc-input-font-family: var(--wc-font-family-sans, sans-serif);
--wc-input-label-color: var(--wc-color-neutral-700, #343a40);
--wc-input-focus-ring-color: var(--wc-focus-ring-color, #2563eb);
--wc-input-error-color: var(--wc-color-error-500, #dc3545);
```

### Alert Component Tokens

```css
/* wc-alert tokens (all optional) */
--wc-alert-gap: var(--wc-space-3, 0.75rem);
--wc-alert-padding: var(--wc-space-4, 1rem);
--wc-alert-border-width: var(--wc-border-width-thin, 1px);
--wc-alert-border-radius: var(--wc-border-radius-md, 0.375rem);
--wc-alert-font-family: var(--wc-font-family-sans, sans-serif);
--wc-alert-bg: var(--wc-color-info-50, #e8f4fd);
--wc-alert-border-color: var(--wc-color-info-200, #b3d9ef);
--wc-alert-color: var(--wc-color-info-800, #1a3a4a);
--wc-alert-icon-color: var(--wc-color-info-500, #3b82f6);
```

### Component Token Rules

1. **Always fallback to semantic tokens** — Never hardcode component token values
2. **Flat hierarchy** — `--wc-button-bg` not `--wc-button-primary-bg` (variants handled in component CSS)
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

**Pattern**: `--wc-color-{palette}-{shade}`

```css
--wc-color-primary-500      /* Primary brand color (base) */
--wc-color-primary-50       /* Very light primary */
--wc-color-primary-900      /* Very dark primary */

--wc-color-neutral-0        /* Pure white */
--wc-color-neutral-800      /* Near black */

--wc-color-success-500      /* Success green */
--wc-color-error-500        /* Error red */
--wc-color-warning-500      /* Warning yellow/amber */
--wc-color-info-500         /* Info blue */
```

### Spacing Token Names

**Pattern**: `--wc-space-{scale}` or `--wc-size-{scale}`

```css
--wc-space-1       /* 0.25rem = 4px */
--wc-space-2       /* 0.5rem = 8px */
--wc-space-4       /* 1rem = 16px */
--wc-space-6       /* 1.5rem = 24px */

--wc-size-10       /* Fixed size 2.5rem = 40px (for min-height, etc.) */
--wc-size-12       /* Fixed size 3rem = 48px */
```

### Typography Token Names

**Pattern**: `--wc-font-{property}-{scale}`

```css
--wc-font-family-sans       /* Sans-serif stack */
--wc-font-family-serif      /* Serif stack */
--wc-font-family-mono       /* Monospace stack */

--wc-font-weight-normal     /* 400 */
--wc-font-weight-semibold   /* 600 */
--wc-font-weight-bold       /* 700 */

--wc-font-size-xs           /* Extra small */
--wc-font-size-sm           /* Small */
--wc-font-size-md           /* Medium (base) */
--wc-font-size-lg           /* Large */
--wc-font-size-xl           /* Extra large */

--wc-line-height-tight      /* 1.25 */
--wc-line-height-normal     /* 1.5 */
--wc-line-height-loose      /* 2 */
```

### Component Token Names

**Pattern**: `--wc-{component}-{property}`

```css
--wc-button-bg              /* Button background */
--wc-button-color           /* Button text color */
--wc-button-border-radius   /* Button corner radius */

--wc-card-bg                /* Card background */
--wc-card-padding           /* Card inner padding */
--wc-card-border-color      /* Card border */

--wc-input-border-color     /* Input border */
--wc-input-focus-ring-color /* Input focus ring */
--wc-input-error-color      /* Input error state */
```

### Naming Rules

1. **All lowercase** — No camelCase, PascalCase, or UPPER_CASE
2. **Hyphen-separated** — Use `-` between segments
3. **Prefix always first** — `--wc-` comes before everything
4. **No abbreviations** (except universal ones) — `bg` ✓, `clr` ✗
5. **Scale as suffix** — `primary-500` not `500-primary`
6. **State as final suffix** — `primary-hover` not `hover-primary`

---

## Fallback Chains

Every CSS custom property in wc-2026 uses a **two-level fallback chain** (or three-level for component tokens).

### The Two-Level Pattern

```css
property: var(--wc-semantic-token, primitive-value);
```

**Example:**

```css
.button {
  background: var(--wc-color-primary-500, #2563eb);
  /*          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   *          Semantic token         | Primitive fallback
   */
}
```

**Resolution order:**

1. `--wc-color-primary-500` (semantic token — can be overridden by consumer)
2. `#2563eb` (primitive fallback — last resort if token unset)

### The Three-Level Pattern

```css
property: var(--wc-component-token, var(--wc-semantic-token, primitive-value));
```

**Example:**

```css
.button {
  background: var(--wc-button-bg, var(--wc-color-primary-500, #2563eb));
  /*          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   *          Component token  | Semantic token      | Primitive fallback
   */
}
```

**Resolution order:**

1. `--wc-button-bg` (component token — most specific, optional)
2. `--wc-color-primary-500` (semantic token — global theming)
3. `#2563eb` (primitive fallback — last resort)

### Why This Pattern?

**Problem: One level**

```css
/* One-level fallback */
.button {
  background: var(--wc-button-bg, #2563eb);
}
```

- **Con**: No global theming. To change the primary color, you must override every component token individually.
- **Con**: Duplicates values across multiple component tokens.

**Problem: Three levels without semantic**

```css
/* Three levels, but missing semantic */
.button {
  background: var(--wc-button-bg, var(--wc-blue-600, #2563eb));
}
```

- **Con**: Still no semantic layer. Consumers override primitives directly, which leaks implementation details.

**Solution: Two or three levels with semantic**

```css
/* Two levels (most common) */
.card {
  background: var(--wc-color-neutral-0, #ffffff);
}

/* Three levels (for component customization) */
.button {
  background: var(--wc-button-bg, var(--wc-color-primary-500, #2563eb));
}
```

- **Pro**: Global theming works (override `--wc-color-primary-500`)
- **Pro**: Component precision works (override `--wc-button-bg`)
- **Pro**: Fallback works (primitive value if everything unset)

### Fallback Chain Examples

**Spacing:**

```css
.card {
  padding: var(--wc-card-padding, var(--wc-space-6, 1.5rem));
}
```

**Typography:**

```css
.button {
  font-family: var(--wc-button-font-family, var(--wc-font-family-sans, sans-serif));
  font-weight: var(--wc-button-font-weight, var(--wc-font-weight-semibold, 600));
  font-size: var(--wc-font-size-md, 1rem);
}
```

**Borders:**

```css
.card {
  border: var(--wc-border-width-thin, 1px) solid
    var(--wc-card-border-color, var(--wc-color-neutral-200, #dee2e6));
  border-radius: var(--wc-card-border-radius, var(--wc-border-radius-lg, 0.5rem));
}
```

**Shadows:**

```css
.card {
  box-shadow: var(--wc-card-shadow, var(--wc-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1)));
}
```

**Focus ring:**

```css
.button:focus-visible {
  outline: var(--wc-focus-ring-width, 2px) solid
    var(--wc-button-focus-ring-color, var(--wc-focus-ring-color, #2563eb));
  outline-offset: var(--wc-focus-ring-offset, 2px);
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
  --wc-color-primary-50: #e6f7f7;
  --wc-color-primary-100: #cceff0;
  --wc-color-primary-200: #99dfe0;
  --wc-color-primary-300: #66cfd1;
  --wc-color-primary-400: #33bfc1;
  --wc-color-primary-500: #007878; /* Base teal */
  --wc-color-primary-600: #006666;
  --wc-color-primary-700: #005555;
  --wc-color-primary-800: #004444;
  --wc-color-primary-900: #003333;
  --wc-color-primary-950: #002222;
}
```

**Result:** All components that use `--wc-color-primary-*` now render in teal.

### Component-Specific Theming

**Use case:** Style one button differently without affecting others.

```css
/* Hero CTA button — gradient background */
wc-button.hero-cta {
  --wc-button-bg: linear-gradient(135deg, #ff6b35, #f7931e);
  --wc-button-color: #ffffff;
  --wc-button-border-radius: 2rem; /* Pill shape */
  --wc-button-font-size: 1.25rem;
}
```

```html
<wc-button class="hero-cta" variant="primary"> Get Started Free </wc-button>
```

### Dark Mode Theming

**Use case:** Support light and dark color schemes.

```css
/* Light mode (default) */
:root {
  --wc-color-neutral-0: #ffffff;
  --wc-color-neutral-50: #f8f9fa;
  --wc-color-neutral-800: #343a40;
  --wc-color-neutral-900: #212529;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --wc-color-neutral-0: #212529; /* Inverted */
    --wc-color-neutral-50: #343a40;
    --wc-color-neutral-800: #f8f9fa;
    --wc-color-neutral-900: #ffffff;
  }
}

/* Explicit dark theme via data attribute */
[data-theme='dark'] {
  --wc-color-neutral-0: #212529;
  --wc-color-neutral-50: #343a40;
  --wc-color-neutral-800: #f8f9fa;
  --wc-color-neutral-900: #ffffff;
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
  --wc-font-family-sans: 'Inter', 'Helvetica Neue', Arial, sans-serif;
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
      --wc-font-family-sans: 'Inter', system-ui, sans-serif;
    }
  </style>
</head>
```

### Spacing Theming

**Use case:** Tighter spacing for compact UIs.

```css
:root {
  --wc-space-1: 0.125rem; /* Half of default */
  --wc-space-2: 0.25rem;
  --wc-space-3: 0.5rem;
  --wc-space-4: 0.75rem;
  --wc-space-6: 1rem;
}
```

### High Contrast Mode

**Use case:** Support users with low vision.

```css
@media (prefers-contrast: more) {
  :root {
    /* Increase border thickness */
    --wc-border-width-thin: 2px;
    --wc-border-width-medium: 3px;

    /* Use stronger borders */
    --wc-color-neutral-200: #000000;
    --wc-color-neutral-300: #000000;

    /* Increase focus ring visibility */
    --wc-focus-ring-width: 3px;
    --wc-focus-ring-offset: 3px;
  }
}
```

---

## Token Documentation in Components

Every component documents its tokens via JSDoc so they appear in Custom Elements Manifest (CEM) and IDE autocomplete.

### Example: wc-button

```typescript
/**
 * A button component with multiple variants and sizes.
 *
 * @slot - Button text content
 * @slot icon - Icon slot (before text)
 *
 * @cssprop [--wc-button-bg=var(--wc-color-primary-500)] - Button background color.
 * @cssprop [--wc-button-color=var(--wc-color-neutral-0)] - Button text color.
 * @cssprop [--wc-button-border-color=transparent] - Button border color.
 * @cssprop [--wc-button-border-radius=var(--wc-border-radius-md)] - Button corner radius.
 * @cssprop [--wc-button-font-family=var(--wc-font-family-sans)] - Button font family.
 * @cssprop [--wc-button-font-weight=var(--wc-font-weight-semibold)] - Button font weight.
 * @cssprop [--wc-button-focus-ring-color=var(--wc-focus-ring-color)] - Focus ring color.
 * @cssprop [--wc-button-padding-x=var(--wc-space-4)] - Horizontal padding.
 * @cssprop [--wc-button-padding-y=var(--wc-space-2)] - Vertical padding.
 *
 * @csspart button - The native button element.
 *
 * @fires wc-click - Fired when button is clicked (event forwarding from native click)
 */
@customElement('wc-button')
export class WcButton extends LitElement {
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
  background: var(--wc-button-bg, var(--wc-color-primary-500, #2563eb));
  padding: var(--wc-space-2, 0.5rem) var(--wc-space-4, 1rem);
  font-weight: var(--wc-button-font-weight, var(--wc-font-weight-semibold, 600));
  border-radius: var(--wc-button-border-radius, var(--wc-border-radius-md, 0.375rem));
}
```

### 2. Always Use Two-Level Fallback Chains

```css
/* BAD (missing semantic fallback) */
.card {
  background: var(--wc-card-bg, #ffffff);
}

/* GOOD */
.card {
  background: var(--wc-card-bg, var(--wc-color-neutral-0, #ffffff));
}
```

### 3. Document All Public Tokens

```typescript
/**
 * @cssprop [--wc-card-bg=var(--wc-color-neutral-0)] - Card background color.
 * @cssprop [--wc-card-border-color=var(--wc-color-neutral-200)] - Card border color.
 * @cssprop [--wc-card-border-radius=var(--wc-border-radius-lg)] - Card corner radius.
 * @cssprop [--wc-card-padding=var(--wc-space-6)] - Card inner padding.
 */
@customElement('wc-card')
export class WcCard extends LitElement {}
```

### 4. Maintain Contrast Ratios

All token combinations must meet WCAG 2.1 AA contrast requirements:

- **4.5:1** for normal text (16px and below)
- **3:1** for large text (18pt+ or 14pt+ bold)
- **3:1** for UI components (borders, icons)

```css
/* VERIFY: Does this meet 4.5:1? */
.button {
  background: var(--wc-color-primary-500, #2563eb);
  color: var(--wc-color-neutral-0, #ffffff);
}
/* Answer: Yes — #2563eb on #ffffff = 7.2:1 ratio */
```

Use online contrast checkers or browser DevTools to verify all color combinations.

### 5. Respect Reduced Motion

Every component with transitions or animations respects `prefers-reduced-motion`:

```css
.button {
  transition: background-color var(--wc-transition-fast, 150ms ease);
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
  background: var(--wc-card-bg, #ffffff) !important;
}

/* GOOD — allows override cascade */
:host {
  background: var(--wc-card-bg, var(--wc-color-neutral-0, #ffffff));
}
```

### 7. Use Semantic Tokens in Components

```css
/* BAD — references primitive directly */
.button {
  background: var(--wc-blue-600, #2563eb);
}

/* GOOD — references semantic token */
.button {
  background: var(--wc-button-bg, var(--wc-color-primary-500, #2563eb));
}
```

### 8. Consistent Token Usage Across Components

If multiple components use the same concept, they should reference the same semantic token:

```css
/* All primary buttons use the same token */
.button--primary {
  background: var(--wc-color-primary-500, #2563eb);
}

.badge--primary {
  background: var(--wc-color-primary-500, #2563eb);
}

.link--primary {
  color: var(--wc-color-primary-500, #2563eb);
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
