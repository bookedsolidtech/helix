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

## Component Token Binding Rule

When authoring a new component's CSS, bind to the correct tier so that Light, Dark, and High-Contrast modes flip correctly. The rule, in priority order:

- **Surfaces, text, and borders** users see globally bind to a **Semantic** token. These are the tokens that swap per mode. Use `--hx-color-surface-*`, `--hx-color-text-*`, and `--hx-color-border-*` — never `--hx-color-neutral-*` directly.
- **Brand-identity signals** (the ramps at 400–700 for `primary`, `error`, `success`, `warning`, `info`) bind to the **Primitive**. Brand colors stay constant across modes — a blue "Save" button should read as blue in Dark mode too.
- **Spatial values** (padding, radius, gap, font-size, line-height) bind to the **Primitive**. Sizes don't flip per mode.
- **Dark-surface components** (tooltips, inverse side-nav, dark-always cards) bind to `--hx-color-surface-inverse` + `--hx-color-text-inverse`. Never hardcode `neutral-900` or `neutral-50` on an inverse surface — those are primitives, and the whole point of `surface-inverse` is that it flips to a light surface in Dark mode.
- **Loading shimmers and decorative gradients** may bind to primitives so the animation reads identically across modes. Mark these with a one-line CSS comment explaining the carve-out.
- **When in doubt, semantic.** The default is "semantic unless proven brand."

Failing to follow this rule produces components that render correctly in Light mode but stay frozen in Light palette when the page switches to Dark or High-Contrast. Focus rings will be the only thing that flips. Healthcare WCAG contract requires full mode fidelity — primitive creep is a regression, not a style preference.

## Next Steps

- [Theming](/design-tokens/theming/) -- How themes swap Semantic references
- [Customization](/design-tokens/customization/) -- Override tokens for your brand
