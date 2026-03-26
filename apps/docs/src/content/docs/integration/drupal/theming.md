---
title: Theming HELiX Components in Drupal
description: Override HELiX design tokens in Drupal themes using CSS custom properties — global overrides, per-component tokens, and theme-specific patterns.
sidebar:
  order: 4
---

HELiX components are styled exclusively through CSS custom properties (design tokens). There are no theme functions to override, no PHP render arrays to modify, and no Twig variables that control visual output. Visual customization happens entirely in CSS.

This guide covers how to apply your organization's brand in a Drupal theme.

---

## How Token Overrides Work

HELiX uses a three-tier token cascade:

```
Primitive tokens  →  Semantic tokens  →  Component tokens
(raw values)         (--hx-color-primary)  (--hx-button-bg)
```

CSS custom properties inherit through the DOM, including across the Shadow DOM boundary. Setting `--hx-color-primary` on `:root` makes it available inside every `<hx-button>` and `<hx-card>` shadow root.

**Rule:** Override semantic tokens for brand-level changes. Override component tokens for component-specific adjustments.

---

## Global Token Overrides

Create a CSS file in your theme for token overrides:

```css
/* mytheme/css/helix-tokens.css */

:root {
  /* Brand colors */
  --hx-color-primary: #005eb8;
  --hx-color-primary-hover: #003f80;
  --hx-color-primary-active: #002b57;
  --hx-color-primary-subtle: #e5f0fb;

  /* Secondary palette */
  --hx-color-secondary: #00843d;
  --hx-color-secondary-hover: #005c2b;

  /* Neutrals */
  --hx-color-neutral-0: #ffffff;
  --hx-color-neutral-50: #f8f9fa;
  --hx-color-neutral-100: #f1f3f5;
  --hx-color-neutral-200: #e9ecef;
  --hx-color-neutral-700: #495057;
  --hx-color-neutral-900: #212529;

  /* Feedback colors */
  --hx-color-success: #00843d;
  --hx-color-warning: #e5a000;
  --hx-color-danger: #c00000;
  --hx-color-info: #005eb8;

  /* Typography */
  --hx-font-family-base: 'Inter', 'Segoe UI', sans-serif;
  --hx-font-family-mono: 'JetBrains Mono', 'Consolas', monospace;
  --hx-font-size-base: 1rem;
  --hx-line-height-base: 1.5;

  /* Spacing */
  --hx-spacing-xs: 0.25rem;
  --hx-spacing-sm: 0.5rem;
  --hx-spacing-md: 1rem;
  --hx-spacing-lg: 1.5rem;
  --hx-spacing-xl: 2rem;
  --hx-spacing-2xl: 3rem;

  /* Border radius */
  --hx-radius-sm: 2px;
  --hx-radius-md: 4px;
  --hx-radius-lg: 8px;
  --hx-radius-full: 9999px;

  /* Shadows */
  --hx-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
  --hx-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --hx-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Focus ring */
  --hx-focus-ring-color: #005eb8;
  --hx-focus-ring-width: 2px;
  --hx-focus-ring-offset: 2px;
}
```

Register this file in `mytheme.libraries.yml`:

```yaml
helix_tokens:
  version: 1.0.0
  css:
    theme:
      css/helix-tokens.css: {}
  dependencies:
    - mytheme/helix
```

Attach globally in `mytheme.info.yml`:

```yaml
libraries:
  - mytheme/helix
  - mytheme/helix_tokens
```

---

## Component-Level Token Overrides

For precise per-component adjustments, override component-specific tokens. These tokens accept `var()` fallbacks to the semantic tier.

### Button overrides

```css
:root {
  /* Primary button */
  --hx-button-primary-bg: var(--hx-color-primary);
  --hx-button-primary-bg-hover: var(--hx-color-primary-hover);
  --hx-button-primary-text: #ffffff;
  --hx-button-primary-border: transparent;

  /* Secondary button */
  --hx-button-secondary-bg: transparent;
  --hx-button-secondary-bg-hover: var(--hx-color-primary-subtle);
  --hx-button-secondary-text: var(--hx-color-primary);
  --hx-button-secondary-border: var(--hx-color-primary);

  /* Danger button */
  --hx-button-danger-bg: var(--hx-color-danger);
  --hx-button-danger-bg-hover: #a00000;
  --hx-button-danger-text: #ffffff;

  /* Button sizing */
  --hx-button-height-sm: 2rem;
  --hx-button-height-md: 2.5rem;
  --hx-button-height-lg: 3rem;
  --hx-button-padding-x-md: 1.25rem;
  --hx-button-radius: var(--hx-radius-md);
}
```

### Card overrides

```css
:root {
  --hx-card-bg: var(--hx-color-neutral-0);
  --hx-card-border: 1px solid var(--hx-color-neutral-200);
  --hx-card-radius: var(--hx-radius-lg);
  --hx-card-shadow: var(--hx-shadow-sm);
  --hx-card-shadow-hover: var(--hx-shadow-md);
  --hx-card-padding: var(--hx-spacing-lg);
  --hx-card-heading-size: 1.125rem;
  --hx-card-heading-weight: 600;
}
```

### Form input overrides

```css
:root {
  --hx-input-bg: var(--hx-color-neutral-0);
  --hx-input-border: 1px solid var(--hx-color-neutral-200);
  --hx-input-border-focus: 2px solid var(--hx-color-primary);
  --hx-input-border-error: 1px solid var(--hx-color-danger);
  --hx-input-radius: var(--hx-radius-md);
  --hx-input-height: 2.5rem;
  --hx-input-padding-x: 0.75rem;
  --hx-input-text: var(--hx-color-neutral-900);
  --hx-input-placeholder: var(--hx-color-neutral-500);
  --hx-label-size: 0.875rem;
  --hx-label-weight: 500;
  --hx-label-color: var(--hx-color-neutral-700);
}
```

---

## Scoped Overrides: Per-Section Theming

Override tokens on a specific element to apply different values to a section of the page. CSS custom properties are scoped to the element and its descendants.

### Dark sidebar

```css
/* Applies to hx-* components inside .sidebar-dark */
.sidebar-dark {
  --hx-color-primary: #60a5fa;
  --hx-color-neutral-900: #f8fafc;
  --hx-card-bg: #1e293b;
  --hx-card-border: 1px solid #334155;
  --hx-button-secondary-text: #60a5fa;
  --hx-button-secondary-border: #60a5fa;
}
```

In a Twig template:

```twig
<aside class="sidebar-dark">
  {{ page.sidebar_first }}
</aside>
```

### High-contrast mode for clinical areas

```css
/* Forced high contrast for clinical data display */
.clinical-display {
  --hx-color-primary: #0000cc;
  --hx-color-danger: #cc0000;
  --hx-color-success: #006600;
  --hx-font-size-base: 1.125rem;
  --hx-line-height-base: 1.6;
  --hx-focus-ring-width: 3px;
}
```

---

## Overrides in Twig Templates

For one-off component styling driven by Drupal data, set custom property values as inline styles.

### Node-driven color theming

```twig
{# node--department.html.twig #}
{% set dept_color = content.field_department_color[0]['#markup']|default('#005eb8') %}

<hx-card
  variant="featured"
  style="--hx-card-accent-color: {{ dept_color }};"
>
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
</hx-card>
```

### Taxonomy term badge colors

```twig
{# taxonomy-term--status-badge.html.twig #}
{% set status_colors = {
  'active': '#00843d',
  'pending': '#e5a000',
  'inactive': '#6c757d',
  'critical': '#c00000',
} %}

{% set color = status_colors[term.name.value]|default('#6c757d') %}

<hx-badge style="--hx-badge-bg: {{ color }}; --hx-badge-text: #ffffff;">
  {{ term.name.value }}
</hx-badge>
```

---

## Dark Mode

HELiX components support dark mode through the `prefers-color-scheme` media query. Override tokens for dark mode in your theme CSS:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --hx-color-primary: #60a5fa;
    --hx-color-primary-hover: #93c5fd;
    --hx-color-neutral-0: #0f172a;
    --hx-color-neutral-50: #1e293b;
    --hx-color-neutral-100: #334155;
    --hx-color-neutral-900: #f8fafc;
    --hx-card-bg: #1e293b;
    --hx-card-border: 1px solid #334155;
    --hx-input-bg: #1e293b;
    --hx-input-border: 1px solid #475569;
  }
}
```

For user-controlled dark mode (toggle switch), use the `hx-theme` component or a `data-theme` attribute pattern:

```css
[data-theme="dark"] {
  --hx-color-primary: #60a5fa;
  /* ... dark mode tokens ... */
}
```

```twig
{# html.html.twig — read theme preference from cookie or user account #}
<html
  lang="{{ language.getId() }}"
  data-theme="{{ theme_preference|default('light') }}"
>
```

---

## CSS Parts: Targeted Shadow DOM Styling

For cases where token overrides are insufficient, HELiX components expose CSS `::part()` selectors. These allow direct styling of elements inside the Shadow DOM.

### Styling the internal button element of hx-button

```css
hx-button::part(button) {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}
```

### Styling the input element inside hx-text-input

```css
hx-text-input::part(input) {
  font-family: var(--hx-font-family-mono);
}
```

### Scoped part styling for clinical data fields

```css
.clinical-phi hx-text-input::part(input) {
  background-color: #fffde7;
  border-color: #f59e0b;
}
```

CSS parts are documented in each component's API reference. Use them as a last resort — prefer token overrides for consistency and maintainability.

---

## Libraries.yml Configuration for Theming

```yaml
# mytheme.libraries.yml

# Base HELiX library (component JavaScript)
helix:
  version: 0.1.0
  js:
    dist/js/helix.js:
      preprocess: false
      attributes:
        type: module

# Design token overrides (loads after helix to take precedence)
helix_tokens:
  version: 1.0.0
  css:
    theme:
      css/helix-tokens.css: {}
  dependencies:
    - mytheme/helix

# Dark mode token overrides
helix_tokens_dark:
  version: 1.0.0
  css:
    theme:
      css/helix-tokens-dark.css: {}
  dependencies:
    - mytheme/helix_tokens
```

---

## Preprocess: Dynamic Token Injection

For tokens that must be derived from Drupal configuration (site branding, taxonomy colors, user preferences), use a preprocess function to inject CSS variables:

```php
// mytheme.theme

function mytheme_preprocess_html(&$variables) {
  // Pull brand color from site config
  $config = \Drupal::config('system.site');
  $brand_color = $config->get('helix_primary_color') ?: '#005eb8';

  $variables['helix_token_overrides'] = [
    '--hx-color-primary' => $brand_color,
  ];
}
```

```twig
{# html.html.twig #}
{% if helix_token_overrides %}
  <style>
    :root {
      {% for token, value in helix_token_overrides %}
        {{ token }}: {{ value }};
      {% endfor %}
    }
  </style>
{% endif %}
```

---

## Next Steps

- [Architecture](/integration/drupal/architecture/) — Token cascade and Shadow DOM model
- [Migration](/integration/drupal/migration/) — Replacing theme CSS with token overrides
- [Troubleshooting](/integration/drupal/troubleshooting/) — Styles not applying, specificity issues
