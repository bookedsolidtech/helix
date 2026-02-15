---
title: Token Tiers
description: Understanding the three-tier design token hierarchy in HELIX
---

The three-tier system ensures flexibility, consistency, and maintainability across the entire component library.

## Tier 1: Global Tokens

Raw, brand-agnostic values. These are the foundation that everything else references.

```css
:root {
  /* Colors */
  --wc-blue-50: #eff6ff;
  --wc-blue-600: #2563eb;
  --wc-blue-900: #1e3a5f;

  /* Spacing */
  --wc-space-4: 0.25rem;
  --wc-space-8: 0.5rem;
  --wc-space-16: 1rem;
  --wc-space-24: 1.5rem;

  /* Typography */
  --wc-font-size-sm: 0.875rem;
  --wc-font-size-base: 1rem;
  --wc-font-size-lg: 1.125rem;
}
```

## Tier 2: Alias Tokens

Semantic tokens that reference Global tokens. These carry meaning and enable theming.

```css
:root {
  --wc-color-primary: var(--wc-blue-600);
  --wc-color-on-primary: var(--wc-white);
  --wc-color-surface: var(--wc-gray-50);
  --wc-color-text-primary: var(--wc-gray-900);
  --wc-space-md: var(--wc-space-16);
  --wc-font-size-body: var(--wc-font-size-base);
}
```

## Tier 3: Component Tokens

Component-specific tokens that reference Alias tokens. These enable per-component customization.

```css
:host {
  --wc-button-bg: var(--wc-color-primary);
  --wc-button-color: var(--wc-color-on-primary);
  --wc-button-padding: var(--wc-space-sm) var(--wc-space-md);
  --wc-button-font-size: var(--wc-font-size-body);
  --wc-button-border-radius: var(--wc-border-radius-md);
}
```

## Token Flow Example

```
User clicks "Primary Button"
  → --wc-button-bg (Component Tier)
    → --wc-color-primary (Alias Tier)
      → --wc-blue-600 (Global Tier)
        → #2563eb (raw value)
```

## Next Steps

- [Theming](/design-tokens/theming/) - How themes swap Alias references
- [Customization](/design-tokens/customization/) - Override tokens for your brand
