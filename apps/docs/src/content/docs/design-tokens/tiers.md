---
title: Token Tiers
description: Understanding the three-tier design token hierarchy in HELIX
---

The three-tier system ensures flexibility, consistency, and maintainability across the entire component library.

## Tier 1: Primitive Tokens

Raw, brand-agnostic values. These are the foundation that everything else references.

```css
:root {
  /* Color ramps (8 ramps: primary, secondary, accent, neutral, success, warning, error, info).
     Shipped default brand is Apex (precision-cool teal). */
  --hx-color-primary-50: #ebf8f8;
  --hx-color-primary-500: #429797;
  --hx-color-primary-900: #0b3232;
  --hx-color-neutral-0: #ffffff;
  --hx-color-neutral-900: #0d1825;
  --hx-color-error-500: #e5493e;
  --hx-color-success-500: #3b9e58;

  /* Spacing (22 tokens from 0 to 64; finer 1px/2px stops + a `px` stop
     are available alongside the 4 / 8 ladder) */
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
  /* Text colors reference the neutral ramp. Secondary + muted both
     resolve to neutral-700 (AAA-strict 1.4.6 across all light surfaces);
     the collapse is intentional and documented in tokens.json. */
  --hx-color-text-primary: var(--hx-color-neutral-900);
  --hx-color-text-secondary: var(--hx-color-neutral-700);
  --hx-color-text-muted: var(--hx-color-neutral-700);
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
/* Inside hx-button's variant CSS — primary variant binds the component
   token to the canonical semantic action surface, not the primitive ramp. */
.button--primary {
  --hx-button-bg: var(--hx-color-action-primary-bg);
  --hx-button-color: var(--hx-color-text-on-primary);
  --hx-button-hover-bg: var(--hx-color-action-primary-bg-hover);
  --hx-button-active-bg: var(--hx-color-action-primary-bg-active);
}

:host {
  /* Shared base — values shipped on hx-button. Padding and radius are
   shared rules in the component's base styles, not exposed as
   --hx-button-padding-* / --hx-button-border-radius custom properties. */
  --hx-button-border-color: transparent;
  --hx-button-font-family: var(--hx-font-family-sans);
  --hx-button-font-weight: 500;
  --hx-button-focus-ring-color: var(--hx-focus-ring-color);
}
```

The component-level `--hx-button-bg` falls back to `--hx-color-action-primary-bg`, which currently
resolves to `--hx-color-primary-700` (AAA-strict 7:1 contrast with white across every shipped
brand). Override the **semantic** token to retheme; override the **component** token only when a
single variant needs to vary in isolation.

## Token Flow Example

When a user interacts with a primary button, the token cascade resolves like this:

```
User sees a teal button background (Apex default brand)
  → --hx-button-bg (Component Tier)
    → --hx-color-action-primary-bg (Semantic Tier)
      → --hx-color-primary-700 (Primitive Tier)
        → #0F6363 (raw hex value — Apex brand)

In dark mode, text color resolves differently:
  → --hx-body-color (Semantic Tier)
    → --hx-color-text-primary (Semantic Tier)
      → var(--hx-color-neutral-100) (Dark override)
        → #EBEEE9 (the dark-mode neutral-100 value)
```

The key insight: **dark mode only swaps Semantic references**, not Primitive values. The Apex
default `--hx-color-primary-500` stays `#429797` in both themes; brand registrations override the
primary/secondary ramp stops globally. What changes per mode is which Primitive token the Semantic
tokens point to.

## Component Token Binding Rule

When authoring a new component's CSS, bind to the correct tier so that Light, Dark, and High-Contrast modes flip correctly. The rule, in priority order:

- **Surfaces, text, and borders** users see globally bind to a **Semantic** token. These are the tokens that swap per mode. Use `--hx-color-surface-*`, `--hx-color-text-*`, and `--hx-color-border-*` — never `--hx-color-neutral-*` directly.
- **Brand action signals** (interactive surfaces: button bg, badge bg, pagination active, etc.) bind to the **Semantic** action tokens — `--hx-color-action-primary-bg`, `--hx-color-action-danger-bg`, `--hx-color-action-secondary-fg`. The action layer resolves to the correct ramp stop per mode (light vs dark vs inverted) and survives brand swaps cleanly. Do **not** bind component surfaces directly to `--hx-color-primary-500` — that bypasses the action layer's mode + brand handling.
- **Spatial values** (padding, radius, gap, font-size, line-height) bind to the **Primitive**. Sizes don't flip per mode.
- **Dark-surface components** (tooltips, inverse side-nav, dark-always cards) bind to `--hx-color-surface-inverse` + `--hx-color-text-inverse`. Never hardcode `neutral-900` or `neutral-50` on an inverse surface — those are primitives, and the whole point of `surface-inverse` is that it flips to a light surface in Dark mode.
- **Loading shimmers and decorative gradients** may bind to primitives so the animation reads identically across modes. Mark these with a one-line CSS comment explaining the carve-out.
- **When in doubt, semantic.** The default is "semantic unless proven brand."

Failing to follow this rule produces components that render correctly in Light mode but stay frozen in Light palette when the page switches to Dark or High-Contrast. Focus rings will be the only thing that flips. Healthcare WCAG contract requires full mode fidelity — primitive creep is a regression, not a style preference.

## Next Steps

- [Theming](/design-tokens/theming/) -- How themes swap Semantic references
- [Customization](/design-tokens/customization/) -- Override tokens for your brand
