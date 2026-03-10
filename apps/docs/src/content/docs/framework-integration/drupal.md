---
title: 'Drupal Integration'
description: 'Using HELIX web components in Drupal CMS — Twig templates, Drupal behaviors, and CDN/npm installation overview.'
sidebar:
  order: 6
---

# Drupal Integration

HELIX is purpose-built for Drupal. The full integration guide lives in the [Drupal Integration](/drupal-integration/overview) section. This page is a quick-start summary covering the essential patterns.

## Installation

Two options are available:

### Via npm (recommended for custom themes)

```bash
npm install @helix/library
```

Reference the built files from your theme's `.libraries.yml`.

### Via CDN

```yaml
# mytheme.libraries.yml
helix:
  js:
    https://cdn.jsdelivr.net/npm/@helix/library/dist/index.js: { type: external, attributes: { type: module } }
```

See [CDN Installation](/drupal-integration/installation/cdn) for the full setup.

## Using Components in Twig

HELIX elements are standard HTML — use them directly in `.html.twig` templates:

```twig
{# templates/block--my-block.html.twig #}

<hx-button variant="primary" type="button">
  {{ 'Save changes'|t }}
</hx-button>
```

### Passing Dynamic Values

Use Twig variable interpolation to set attributes:

```twig
<hx-button
  variant="{{ button_variant|default('primary') }}"
  {% if disabled %}disabled{% endif %}
>
  {{ label }}
</hx-button>
```

### Boolean Attributes in Twig

Follow HELIX's [boolean attribute semantics](/guides/boolean-attributes). Output the attribute name without a value when true; omit it entirely when false:

```twig
{# Correct #}
<hx-button {% if is_disabled %}disabled{% endif %}>
  {{ label }}
</hx-button>

{# Wrong — disabled="false" still disables #}
<hx-button disabled="{{ is_disabled ? 'true' : 'false' }}">
  {{ label }}
</hx-button>
```

### Using Slots

Twig child content maps to the default slot:

```twig
<hx-card>
  <span slot="header">{{ card_title }}</span>
  <div>{{ card_body }}</div>
</hx-card>
```

See [Slots in Twig](/drupal-integration/twig/slots) for named slot patterns.

## Drupal Behaviors for Event Handling

Drupal Behaviors are the correct place to attach JavaScript event listeners to HELIX components. They re-fire on AJAX updates.

```js
// js/my-feature.js
(function (Drupal) {
  Drupal.behaviors.myFeature = {
    attach(context) {
      const buttons = context.querySelectorAll('hx-button[data-my-action]');

      buttons.forEach((btn) => {
        if (btn.dataset.behaviorAttached) return; // prevent double-attach
        btn.dataset.behaviorAttached = 'true';

        btn.addEventListener('hx-click', (event) => {
          Drupal.ajax({ url: btn.dataset.url }).execute();
        });
      });
    },
  };
})(Drupal);
```

See [Drupal Behaviors — With Web Components](/drupal-integration/behaviors/web-components) for detailed patterns.

## Form API Integration

HELIX form components participate in native HTML forms. In Drupal, combine with the Form API's `#attributes` key:

```php
$form['email'] = [
  '#type' => 'html_tag',
  '#tag' => 'hx-text-input',
  '#attributes' => [
    'name' => 'email',
    'type' => 'email',
    'required' => TRUE,
    'placeholder' => $this->t('Enter your email'),
  ],
];
```

For full Drupal Form API element plugins, see [Form API Integration](/drupal-integration/forms/form-api).

## Per-Component Loading

For performance, load only the components used on each page:

```yaml
# mytheme.libraries.yml
helix-button:
  js:
    /path/to/hx-button.js: { attributes: { type: module } }

helix-text-input:
  js:
    /path/to/hx-text-input.js: { attributes: { type: module } }
```

See [Per-Component Loading](/drupal-integration/per-component-loading) for the full strategy.

## Full Documentation

This page covers the basics. The complete Drupal integration guide includes:

- [Installation (npm, CDN, Drupal Module)](/drupal-integration/installation/overview)
- [Twig Templates — Fundamentals](/drupal-integration/twig/fundamentals)
- [Twig — Properties & Attributes](/drupal-integration/twig/properties)
- [Drupal Behaviors](/drupal-integration/behaviors/fundamentals)
- [Library System](/drupal-integration/library-system)
- [Forms — Form API](/drupal-integration/forms/form-api)
- [Performance & Lazy Loading](/drupal-integration/performance/overview)
- [Troubleshooting](/drupal-integration/troubleshooting/common-issues)

## Next Steps

- [Full Drupal Integration Guide](/drupal-integration/overview)
- [Boolean Attributes reference](/guides/boolean-attributes)
- [Component Library](/component-library/overview)
