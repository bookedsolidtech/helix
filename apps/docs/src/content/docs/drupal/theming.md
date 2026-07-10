---
title: Theming HELiX Components in Drupal
description: Complete theming guide — CSS custom property architecture with --hx- prefix, global token overrides in :root or [data-theme], per-component overrides, Drupal theme CSS integration, adoptedStylesheets (built into @helixui/library), FOUC prevention, and color scheme support.
sidebar:
  order: 8
---

HELiX components are styled primarily through CSS custom properties. Shadow DOM encapsulation prevents external stylesheets from reaching inside components, but CSS custom properties inherit through Shadow DOM boundaries. `--hx-*` properties are the primary theming API; for structural changes that custom properties cannot express, components also expose documented `::part()` selectors (see the [CSS Parts](#css-parts-for-structural-overrides) section below).

---

## How Styling Works in HELiX

When an `hx-button` is rendered, its internal Shadow DOM reads values from CSS custom properties like `--hx-color-primary-500`. These properties are defined on `:root` (or a theme container), cascade through the DOM tree, cross the Shadow DOM boundary, and are consumed by the component's internal styles.

```
:root {
  --hx-color-primary-500: #2563eb;   ← defined externally
}
                ↓ inherits
<hx-button>
  #shadow-root
    <button style="background: var(--hx-color-primary-500)">  ← consumed inside
```

This is why you cannot style components with:

```css
/* WILL NOT WORK — cannot pierce Shadow DOM */
hx-button button {
  background-color: red;
}
```

And why this works:

```css
/* WORKS — custom properties inherit through the boundary */
hx-button {
  --hx-button-bg: red;
}
```

---

## The adoptedStylesheets Pattern

HELiX uses the **Constructable Stylesheets API** (`document.adoptedStyleSheets`) to inject component styles at runtime, with automatic fallback to `<style>` tag injection for environments that do not support it. This is implemented internally in `adoptedStylesheetRegistry.ts` — it is not a separate package.

You do not need to configure this. Loading `@helixui/library` activates it automatically. The practical consequence:

- Component base styles are injected once per page, shared by all instances of each component.
- You cannot override these base styles with external CSS — only with CSS custom properties.
- Style injection happens synchronously on component registration, before first render.

---

## Loading the Token System

### @helixui/tokens@3.9.4

The token package provides the foundational CSS custom property values. Load it before component scripts to prevent FOUC.

**CDN:**

```yaml
# mytheme.libraries.yml
helix-tokens:
  version: 0.3.4
  css:
    theme:
      https://cdn.jsdelivr.net/npm/@helixui/tokens@3.9.4/dist/tokens.css:
        type: external
```

**npm (local build):**

```yaml
helix-tokens:
  version: 0.3.4
  css:
    theme:
      dist/tokens.css: {}
```

Attach globally:

```yaml
# mytheme.info.yml
libraries:
  - mytheme/helix-tokens
```

---

## The Three-Tier Token Cascade

HELiX tokens follow a three-tier hierarchy:

**Tier 1 — Primitive tokens:** Concrete brand-palette values. Rarely overridden.

```css
--hx-color-primary-500: #429797;
--hx-color-primary-700: #0f6363;
--hx-space-4: 1rem;
--hx-font-size-md: 1rem;
```

**Tier 2 — Semantic / action tokens:** Reference primitives. Override these for brand customization.

```css
--hx-color-action-primary-bg: var(--hx-color-primary-700);
--hx-color-surface-default: #ffffff;
--hx-color-text-primary: #111827;
```

**Tier 3 — Component tokens:** Reference semantic tokens. Override for per-component customization.

```css
--hx-button-bg: var(--hx-color-action-primary-bg);
--hx-card-padding: var(--hx-space-4);
```

Overriding at Tier 2 propagates to all components that reference those semantics. Overriding at Tier 3 affects only the target component.

---

## Global Token Overrides in :root

Override semantic tokens in your theme's global CSS to change the design system's color palette, spacing, and typography across all components:

```css
/* web/themes/custom/mytheme/css/tokens.css */
:root {
  /* Brand primary palette (drives action.primary tokens by default) */
  --hx-color-primary-500: #1a56db;
  --hx-color-primary-700: #1e429f;
  --hx-color-primary-400: #3f83f8;

  /* Brand secondary palette */
  --hx-color-secondary-500: #6875f5;

  /* Typography */
  --hx-font-family-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --hx-body-font-size: 1rem;

  /* Spacing adjustments for dense UIs */
  --hx-space-4: 0.875rem;

  /* Border radius */
  --hx-border-radius-md: 6px;
  --hx-border-radius-full: 9999px;
}
```

Register this CSS in your theme library:

```yaml
# mytheme.libraries.yml
helix-theme-overrides:
  css:
    theme:
      css/tokens.css: {}
```

```yaml
# mytheme.info.yml
libraries:
  - mytheme/helix-tokens # Base token values
  - mytheme/helix-theme-overrides # Your brand overrides
```

---

## Theme Variants with [data-theme]

For sites that support multiple themes (e.g., light/dark, brand A/brand B, editorial/healthcare), scope overrides to a `[data-theme]` attribute on the `<body>` or a container element:

```css
/* Default: light mode */
:root {
  --hx-color-surface-default: #ffffff;
  --hx-color-text-primary: #111827;
  --hx-color-primary-500: #2563eb;
}

/* Dark mode */
[data-theme='dark'] {
  --hx-color-surface-default: #1f2937;
  --hx-color-text-primary: #f9fafb;
  --hx-color-primary-500: #60a5fa;
}

/* Healthcare brand */
[data-theme='healthcare'] {
  --hx-color-primary-500: #0d9488;
  --hx-color-primary-700: #0f766e;
}
```

Set the attribute in a Drupal preprocess function:

```php
function mytheme_preprocess_html(array &$variables): void {
  $theme = \Drupal::config('system.theme')->get('default');
  $variables['html_attributes']->setAttribute('data-theme', 'light');

  // Or from a site setting
  $color_scheme = \Drupal::config('mytheme.settings')->get('color_scheme') ?? 'light';
  $variables['attributes']['data-theme'] = $color_scheme;
}
```

```twig
{# html.html.twig #}
<html{{ html_attributes }}>
```

---

## Per-Component Overrides

Override component-specific tokens on the component's host element:

```css
/* Change button appearance for a specific context */
.hero-section hx-button {
  --hx-button-bg: transparent;
  --hx-button-color: #ffffff;
  --hx-button-border-color: #ffffff;
}

/* Change card border radius throughout a region */
.sidebar hx-card {
  --hx-card-border-radius: var(--hx-border-radius-sm);
}
```

Or via Twig inline styles (use sparingly — prefer CSS classes):

```twig
<hx-card style="--hx-card-bg: var(--hx-color-primary-50);">
  {{ content }}
</hx-card>
```

---

## Drupal Theme CSS Integration

The recommended load order:

1. **helix-tokens** — foundational `--hx-` values
2. **helix-fouc** — hide undefined components to prevent flash
3. **helix-theme-overrides** — your brand's token overrides
4. **Component scripts** — register Custom Elements
5. **Theme layout CSS** — Drupal regions, grid, spacing

```yaml
# mytheme.info.yml
libraries:
  - mytheme/helix-tokens
  - mytheme/helix-fouc
  - mytheme/helix-theme-overrides
  - core/drupal
  - core/once
```

Component libraries are attached per-template or per-route, not globally (unless every page uses every component).

---

## FOUC Prevention

Flash of Unstyled Content occurs when components render as plain HTML before their JavaScript upgrades them. The `@helixui/library` package ships a `fouc.css` file for this — it lives in the library package, not in `@helixui/tokens`:

```yaml
# mytheme.libraries.yml
helix-fouc:
  css:
    theme:
      https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/fouc.css:
        type: external
```

The packaged CSS hides components using `:not(:defined)` until they upgrade, at which point the rule no longer matches and the component becomes visible. The fade-in below is an **optional enhancement**, not part of the shipped stylesheet.

If you prefer to write it manually (the snippet below covers a small subset — for complete coverage use the shipped `@helixui/library/fouc.css`):

```css
/* Hide a subset of HELiX components before upgrade */
hx-button:not(:defined),
hx-card:not(:defined),
hx-text-input:not(:defined),
hx-select:not(:defined),
hx-checkbox:not(:defined),
hx-alert:not(:defined),
hx-badge:not(:defined),
hx-avatar:not(:defined) {
  visibility: hidden;
}

/* Fade in after upgrade — optional transition */
hx-button:defined,
hx-card:defined,
hx-text-input:defined {
  animation: hx-fade-in 0.15s ease-in;
}

@keyframes hx-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

For layout stability (preventing CLS), set explicit dimensions on host elements:

```css
hx-card {
  display: block;
  min-height: 200px;
}

hx-button {
  display: inline-block;
  min-width: 80px;
  min-height: 40px;
}
```

---

## Color Scheme Support

Integrate HELiX token overrides with the browser's `prefers-color-scheme` media query:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --hx-color-surface-default: #1f2937;
    --hx-color-text-primary: #f9fafb;
    --hx-color-primary-500: #60a5fa;
    --hx-color-neutral-100: #374151;
    --hx-color-neutral-200: #4b5563;
  }
}
```

For user-controlled preference (respecting Drupal's theme setting):

```css
/* Default light */
:root,
[data-color-scheme='light'] {
  --hx-color-surface-default: #ffffff;
  --hx-color-text-primary: #111827;
}

/* Explicit dark preference */
[data-color-scheme='dark'] {
  --hx-color-surface-default: #1f2937;
  --hx-color-text-primary: #f9fafb;
}

/* System dark preference — only applies when the user hasn't explicitly opted into light */
@media (prefers-color-scheme: dark) {
  :root:not([data-color-scheme='light']) {
    --hx-color-surface-default: #1f2937;
    --hx-color-text-primary: #f9fafb;
  }
}
```

---

## CSS Parts for Structural Overrides

For structural changes that cannot be achieved with custom properties, HELiX components expose `::part()` selectors. These pierce Shadow DOM for specific named parts:

```css
/* Style the button's inner <button> element directly */
hx-button::part(button) {
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Style the card's image container */
hx-card::part(image) {
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
```

Available parts are documented per-component in the component API reference. Prefer CSS custom properties over `::part()` when both achieve the same result — custom properties are more predictable and less likely to break on component updates.

---

## Debugging Token Values

To inspect which token values are active on a page:

```javascript
// Browser console
const styles = getComputedStyle(document.documentElement);
const tokens = [
  '--hx-color-primary-500',
  '--hx-color-surface-default',
  '--hx-color-text-primary',
  '--hx-font-size-md',
  '--hx-space-4',
];
tokens.forEach((t) => console.log(t, styles.getPropertyValue(t)));
```

To check what tokens a specific component is using:

```javascript
const card = document.querySelector('hx-card');
const inner = card.shadowRoot?.querySelector('[part="card"]');
if (inner) {
  const shadowStyles = getComputedStyle(inner);
  console.log('card bg:', shadowStyles.backgroundColor);
}
```

---

## Related

- [Performance: Overview](/drupal/performance/overview/) — Loading tokens and component libraries efficiently
- [FOUC Prevention](/drupal/performance/lazy-loading/) — Lazy loading while maintaining visual stability
- [SDC Variants](/drupal/sdc/variants/) — Using token overrides per content context
