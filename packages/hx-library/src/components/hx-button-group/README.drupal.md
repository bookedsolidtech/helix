# hx-button-group — Drupal Integration Guide

## Overview

`hx-button-group` groups related `hx-button` elements into a cohesive action set. It eliminates double borders between adjacent buttons and applies a unified border-radius. Use it for any set of related actions: form controls, filters, toolbar actions, or patient record operations.

## Asset Loading

### CDN Strategy (simplest)

Add to your theme's `mytheme.libraries.yml`:

```yaml
hx-button-group:
  js:
    https://cdn.example.com/@helixui/library/dist/hx-button-group.js:
      type: external
      attributes:
        type: module
  dependencies:
    - core/once
```

Then attach the library in a hook or template:

```php
// mytheme.theme or module .module file
function mytheme_preprocess_page(&$variables) {
  $variables['#attached']['library'][] = 'mytheme/hx-button-group';
}
```

### npm + Theme Build Pipeline

Install `@helixui/library` via npm and bundle it with your theme's build process (Webpack, Vite, etc.):

```yaml
hx-button-group:
  js:
    dist/js/hx-button-group.js:
      attributes:
        type: module
```

## Twig Template

Use the provided `hx-button-group.twig` template, or render the component directly:

```twig
{# Direct inline rendering #}
<hx-button-group orientation="horizontal" aria-label="Patient record actions">
  <hx-button variant="secondary">View Chart</hx-button>
  <hx-button variant="secondary">Orders</hx-button>
  <hx-button variant="secondary">Notes</hx-button>
</hx-button-group>
```

```twig
{# Using the template #}
{% include 'hx-button-group.twig' with {
  orientation: 'horizontal',
  aria_label: 'Patient record actions',
  buttons: [
    { label: 'View Chart', variant: 'secondary' },
    { label: 'Orders', variant: 'secondary' },
    { label: 'Notes', variant: 'secondary' },
  ]
} %}
```

## Template Variables

| Variable      | Type                           | Default        | Description                                             |
|---------------|--------------------------------|----------------|---------------------------------------------------------|
| `orientation` | `'horizontal'` \| `'vertical'` | `'horizontal'` | Layout direction of the button group                    |
| `size`        | `'sm'` \| `'md'` \| `'lg'`    | `'md'`         | Size variant cascaded to all child buttons              |
| `aria_label`  | string                         | required       | Accessible name for the group (required for WCAG)       |
| `buttons`     | array of button objects        |                | See Button Object below                                 |

### Button Object Properties

| Property   | Type                                          | Required | Description                            |
|------------|-----------------------------------------------|----------|----------------------------------------|
| `label`    | string                                        | Yes      | Button label text                      |
| `variant`  | `'primary'` \| `'secondary'` \| `'ghost'`     | No       | Visual variant (default: `'secondary'`) |
| `disabled` | boolean                                       | No       | If true, button is disabled            |
| `type`     | `'button'` \| `'submit'` \| `'reset'`         | No       | HTML button type (default: `'button'`) |

## Attribute Notes

### `hx-size` Attribute

The `hx-size` attribute uses the `hx-` prefix — this is valid HTML and works correctly in Drupal. To set it via Drupal's attribute API:

```php
// In a preprocess hook or render array
$variables['attributes']->setAttribute('hx-size', 'sm');
```

```twig
{# In Twig — the hx- prefix is valid and renders correctly #}
<hx-button-group hx-size="sm" aria-label="Size actions">
  <hx-button>Small</hx-button>
</hx-button-group>
```

The `hx-size` value cascades to all child `hx-button` elements automatically via a CSS custom property (`--hx-button-group-size`). You do NOT need to set `hx-size` on each individual `hx-button`.

### Boolean Attributes

`orientation` and `hx-size` are string attributes, not boolean. Render them normally:

```twig
{# Conditional orientation #}
<hx-button-group
  orientation="{{ is_vertical ? 'vertical' : 'horizontal' }}"
  aria-label="{{ group_label }}"
>
```

## Drupal Behaviors Integration

To handle button clicks at the group level using Drupal behaviors:

```js
(function (Drupal, once) {
  Drupal.behaviors.hxButtonGroup = {
    attach(context) {
      once('hx-button-group-init', 'hx-button-group', context).forEach((group) => {
        // hx-button fires hx-click on activation
        group.addEventListener('hx-click', (e) => {
          const button = e.target;
          // Handle the clicked button — check variant, data attributes, etc.
        });
      });
    },
  };
})(Drupal, once);
```

## Accessibility Requirements

`hx-button-group` uses `role="group"` internally. For WCAG 2.1 AA compliance, **always provide an accessible label** via:

- `aria-label` attribute (preferred for concise labels)
- `aria-labelledby` attribute pointing to an existing heading or label element

```twig
{# Option 1: aria-label (preferred for short labels) #}
<hx-button-group aria-label="Patient record actions">
  ...
</hx-button-group>

{# Option 2: aria-labelledby pointing to an existing heading #}
<h3 id="actions-heading">Quick Actions</h3>
<hx-button-group aria-labelledby="actions-heading">
  ...
</hx-button-group>
```

Without an accessible label, screen readers announce "group" with no context. This is particularly important in healthcare contexts where multiple button groups may appear on the same page.
