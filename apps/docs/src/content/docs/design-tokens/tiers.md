---
title: Token Tiers
description: Understanding the three-tier design token hierarchy in HELIX
---

The three-tier system ensures flexibility, consistency, and maintainability across the entire component library.

## Tier 1: Primitive Tokens

Raw, brand-agnostic values. These are the foundation that everything else references.

```css
:root {
  /* Color ramps (8 ramps: primary, secondary, accent, neutral, success, warning, error, info) */
  --hx-color-primary-50: #eff6ff;
  --hx-color-primary-500: #2563eb;
  --hx-color-primary-900: #1e3050;
  --hx-color-neutral-0: #ffffff;
  --hx-color-neutral-900: #0f172a;
  --hx-color-error-500: #dc2626;
  --hx-color-success-500: #16a34a;

  /* Spacing (20 tokens from 0 to 64) */
  --hx-space-1: 0.25rem;
  --hx-space-2: 0.5rem;
  --hx-space-4: 1rem;
  --hx-space-8: 2rem;

  /* Typography */
  --hx-font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --hx-font-size-sm: 0.875rem;
  --hx-font-size-md: 1rem;
  --hx-font-size-lg: 1.125rem;
  --hx-font-weight-bold: 700;
}
```

## Tier 2: Semantic Tokens

Tokens that carry meaning and reference Primitive tokens. These enable theming by swapping references.

```css
:root {
  /* Text colors reference neutral ramp */
  --hx-color-text-primary: var(--hx-color-neutral-900);
  --hx-color-text-secondary: var(--hx-color-neutral-600);
  --hx-color-text-muted: var(--hx-color-neutral-500);
  --hx-color-text-inverse: var(--hx-color-neutral-0);
  --hx-color-text-on-primary: var(--hx-color-neutral-0);

  /* Surface colors */
  --hx-color-surface-default: var(--hx-color-neutral-0);
  --hx-color-surface-raised: var(--hx-color-neutral-50);
  --hx-color-surface-sunken: var(--hx-color-neutral-100);

  /* Border colors */
  --hx-color-border-default: var(--hx-color-neutral-200);
  --hx-color-border-focus: var(--hx-color-primary-500);

  /* Body-level semantics */
  --hx-body-bg: var(--hx-color-surface-default);
  --hx-body-color: var(--hx-color-text-primary);
  --hx-body-font-family: var(--hx-font-family-sans);
}
```

## Tier 3: Component Tokens

Component-specific tokens that reference Semantic tokens. These enable per-component customization without affecting the global system.

```css
:host {
  /* Button component tokens */
  --hx-button-bg: var(--hx-color-primary-500);
  --hx-button-color: var(--hx-color-text-on-primary);
  --hx-button-border-radius: var(--hx-border-radius-md);
  --hx-button-padding-x: var(--hx-space-4);
  --hx-button-padding-y: var(--hx-space-2);
  --hx-button-font-size: var(--hx-font-size-md);
  --hx-button-shadow: var(--hx-shadow-sm);
}
```

## Token Flow Example

When a user interacts with a primary button, the token cascade resolves like this:

```
User sees a blue button background
  → --hx-button-bg (Component Tier)
    → --hx-color-primary-500 (Primitive Tier)
      → #2563EB (raw hex value)

In dark mode, text color resolves differently:
  → --hx-body-color (Semantic Tier)
    → --hx-color-text-primary (Semantic Tier)
      → var(--hx-color-neutral-100) (Dark override)
        → #F1F5F9 (raw hex value)
```

The key insight: **dark mode only swaps Semantic references**, not Primitive values. `--hx-color-primary-500` stays `#2563EB` in both themes. What changes is which Primitive token the Semantic tokens point to.

## Next Steps

- [Theming](/design-tokens/theming/) -- How themes swap Semantic references
- [Customization](/design-tokens/customization/) -- Override tokens for your brand
