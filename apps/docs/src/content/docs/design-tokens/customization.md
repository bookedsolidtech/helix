---
title: Customization
description: How to customize HELIX design tokens for your brand
---

HELIX is designed for easy brand customization. Override tokens at any tier to match your organization's visual identity.

## Quick Customization

Override Semantic tokens at the `:root` level to change the entire look across all components:

```css
:root {
  /* Override primary color ramp */
  --hx-color-primary-500: #1a73e8;
  --hx-color-primary-600: #1557b0;
  --hx-color-primary-700: #0d47a1;

  /* Override typography */
  --hx-font-family-sans: 'Your Brand Font', -apple-system, BlinkMacSystemFont, sans-serif;
  --hx-font-family-mono: 'Your Mono Font', ui-monospace, monospace;

  /* Override spacing scale */
  --hx-space-4: 1.25rem;
  --hx-space-8: 2.5rem;

  /* Override border radius for rounder components */
  --hx-border-radius-md: 0.5rem;
  --hx-border-radius-lg: 0.75rem;
}
```

## Per-Component Overrides

Target Component-tier tokens on specific elements for surgical customization:

```css
/* Customize only buttons */
hx-button {
  --hx-button-bg: var(--hx-color-primary-600);
  --hx-button-border-radius: var(--hx-border-radius-lg);
  --hx-button-font-size: var(--hx-font-size-sm);
}

/* Customize only cards */
hx-card {
  --hx-card-shadow: var(--hx-shadow-lg);
  --hx-card-border-radius: var(--hx-border-radius-xl);
  --hx-card-padding: var(--hx-space-6);
}

/* Customize buttons inside a specific container */
.hero hx-button {
  --hx-button-bg: var(--hx-color-accent-500);
  --hx-button-shadow: var(--hx-shadow-xl);
}
```

## Token Override Cascade

Overrides follow CSS specificity. The cascade resolves in this order:

```
1. Default token value (defined in tokens.json)
   ↓
2. :root override (global brand customization)
   ↓
3. Element selector override (per-component)
   ↓
4. Class/ID selector override (contextual)
   ↓
5. Inline style override (runtime/JS)
```

Example of the cascade in action:

```css
/* tokens.json defines: --hx-color-primary-500: #2563EB */

/* 1. Global brand override */
:root {
  --hx-color-primary-500: #1a73e8;
}

/* 2. Component-level override */
hx-button {
  --hx-button-bg: var(--hx-color-accent-500);
}

/* 3. Contextual override */
.cta-section hx-button {
  --hx-button-bg: var(--hx-color-success-500);
}
```

## Customizing Dark Mode

When overriding tokens, provide corresponding dark mode values to maintain both themes:

```css
:root {
  --hx-color-primary-500: #1a73e8;
}

:root[data-theme='dark'] {
  --hx-color-primary-500: #5b9cf6;
}
```

## Best Practices

1. **Override Semantic tokens** for global brand changes -- they cascade to all components automatically
2. **Override Component tokens** for targeted component-specific tweaks
3. **Never modify Primitive color ramps** unless you are replacing an entire palette
4. **Test both themes** (light and dark) after any customization
5. **Verify WCAG AA compliance** -- run contrast checks on any custom color overrides
6. **Use `var()` references** in overrides to stay connected to the token system rather than hardcoding raw values
7. **Document overrides** so other teams understand which tokens have been customized and why
