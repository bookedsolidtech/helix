---
title: Customization
description: How to customize HELIX design tokens for your brand
---

HELIX is designed for easy brand customization. Override tokens at any tier to match your organization's visual identity.

## Quick Customization

Override **primitive ramps + semantic typography/spacing tokens** at the `:root` level to change the entire look across all components. The examples below mix tiers — the primary palette stops are primitive tokens; the font/spacing/radius tokens are the canonical semantic surfaces:

```css
:root {
  /* Override primary color ramp (primitive tier) — every component drawing
     from action.primary.bg / text.link / focus-ring picks this up */
  --hx-color-primary-500: #1a73e8;
  --hx-color-primary-600: #1557b0;
  --hx-color-primary-700: #0d47a1;

  /* Semantic typography tokens */
  --hx-font-family-sans: 'Your Brand Font', -apple-system, BlinkMacSystemFont, sans-serif;
  --hx-font-family-mono: 'Your Mono Font', ui-monospace, monospace;

  /* Semantic spacing scale (--hx-space-*) */
  --hx-space-4: 1.25rem;
  --hx-space-8: 2.5rem;

  /* Semantic border-radius scale (--hx-border-radius-*) */
  --hx-border-radius-md: 0.5rem;
  --hx-border-radius-lg: 0.75rem;
}
```

## Per-Component Overrides

Target Component-tier tokens on specific elements for surgical customization:

```css
/* Customize primary buttons globally.
   hx-button re-resolves --hx-button-bg inside its variant rules, so a host-
   level override of --hx-button-bg is shadowed for the canonical variants.
   Target the semantic action token instead — variant rules read from it. */
hx-button[variant='primary'] {
  --hx-color-action-primary-bg: var(--hx-color-primary-700);
}

hx-button {
  --hx-button-border-radius: var(--hx-border-radius-lg);
  /* --hx-button-font-size / --hx-button-shadow are NOT exposed by hx-button —
     use the hx-size attribute (sm/md/lg) for sizing; box-shadow is fixed. */
}

/* Customize only cards — hx-card exposes these tokens via its CEM:
   --hx-card-bg, --hx-card-color, --hx-card-border-color,
   --hx-card-border-radius, --hx-card-padding, --hx-card-gap,
   --hx-card-image-aspect-ratio. (No --hx-card-shadow.) */
hx-card {
  --hx-card-border-radius: var(--hx-border-radius-lg);
  --hx-card-padding: var(--hx-space-6);
}

/* Customize buttons inside a specific container by chaining the semantic token */
.hero hx-button[variant='primary'] {
  --hx-color-action-primary-bg: var(--hx-color-primary-900);
}
```

## Token Override Cascade

Overrides follow CSS specificity. The cascade resolves in this order:

```
1. Default token value (primitive tier defaults live in tokens.json;
   semantic + component-tier defaults are defined inside the component or
   token-CSS files emitted from the @helixui/tokens package)
   ↓
2. :root override (global brand customization)
   ↓
3. Element selector override (per-component)
   ↓
4. Class/ID selector override (contextual)
   ↓
5. Inline style override (runtime/JS)
```

Example of the cascade in action (using the default Apex brand where `--hx-color-primary-500` is `#429797`):

```css
/* Default (Apex brand): --hx-color-primary-500: #429797 */

/* 1. Global brand override */
:root {
  --hx-color-primary-500: #1a73e8;
}

/* 2. Component-level override — drive primary buttons via the semantic action token */
hx-button[variant='primary'] {
  --hx-color-action-primary-bg: var(--hx-color-primary-800);
}

/* 3. Contextual override */
.cta-section hx-button[variant='primary'] {
  --hx-color-action-primary-bg: var(--hx-color-success-700);
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
5. **Verify WCAG 2.2 contrast** -- AA (4.5:1 text, 3:1 UI/large text) as a floor and AAA (7:1 body text) on P0-surface pairings (per `aaa-verdicts.json`); run contrast checks on any custom color overrides
6. **Use `var()` references** in overrides to stay connected to the token system rather than hardcoding raw values
7. **Document overrides** so other teams understand which tokens have been customized and why
