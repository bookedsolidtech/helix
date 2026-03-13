# hx-icon-button — Drupal Integration Guide

## Overview

`hx-icon-button` renders a square icon-only button (or anchor link) with full accessibility support. The `label` attribute is mandatory — it provides the accessible name via `aria-label` and a native tooltip via `title`. The component renders nothing and emits a `console.warn` when `label` is absent.

**Note on `hx-size`:** The size attribute uses the non-standard `hx-size` name (not `size`). This must be set explicitly in Twig templates.

## Twig Template

Use the provided `hx-icon-button.twig` template or render the component directly:

```twig
{# Direct render — ghost icon button with hx-icon #}
<hx-icon-button label="Edit patient record" variant="ghost" hx-size="md">
  <hx-icon name="edit" aria-hidden="true"></hx-icon>
</hx-icon-button>
```

```twig
{# Include via template #}
{% include 'hx-icon-button.twig' with {
  label: 'Delete appointment',
  variant: 'danger',
  hx_size: 'sm',
  icon: '<hx-icon name="trash" aria-hidden="true"></hx-icon>',
} %}
```

## Template Variables

| Variable     | Type                                                       | Default   | Description                                                                       |
|--------------|---------------------------------------------------------------|-----------|-----------------------------------------------------------------------------------|
| `label`      | string                                                        | —         | **Required.** Accessible name (aria-label + title). Component renders nothing if absent. |
| `variant`    | `'ghost'` \| `'primary'` \| `'secondary'` \| `'tertiary'` \| `'danger'` | `'ghost'` | Visual style variant |
| `hx_size`    | `'sm'` \| `'md'` \| `'lg'`                                   | `'md'`    | Button size. Maps to the `hx-size` attribute (not `size`).                        |
| `type`       | `'button'` \| `'submit'` \| `'reset'`                        | `'button'`| Button type. Ignored when `href` is set.                                          |
| `disabled`   | boolean                                                       | `false`   | Disables the button.                                                              |
| `href`       | string                                                        |           | When set, renders an `<a>` element. Disabled anchor sets `tabindex="-1"`.         |
| `name`       | string                                                        |           | Form field name (button mode only).                                               |
| `value`      | string                                                        |           | Form field value (button mode only).                                              |
| `icon`       | markup                                                        | —         | **Required.** Icon markup for the default slot (hx-icon, SVG, or img).           |
| `attributes` | Drupal attributes object                                      |           | Additional HTML attributes forwarded to the element.                              |

## Attribute Reference

| Attribute   | Drupal-safe? | Notes                                                                                            |
|-------------|:------------:|--------------------------------------------------------------------------------------------------|
| `label`     | Yes          | Required for accessibility. Use a meaningful action description, not just an icon name.          |
| `variant`   | Yes          | String enum. `ghost` is appropriate for toolbar actions.                                         |
| `hx-size`   | Yes          | Note the `hx-` prefix — this is NOT a standard HTML attribute name.                             |
| `disabled`  | Yes          | Boolean attribute. Set via `?disabled=${disabled}` in PHP or `{% if disabled %}disabled{% endif %}` in Twig. |
| `href`      | Yes          | String. When present, renders `<a>` instead of `<button>`.                                       |

## Healthcare Label Guidance

In healthcare contexts, icon button labels must be specific enough for screen reader users to understand the action in context:

```twig
{# Wrong — generic label #}
<hx-icon-button label="Edit">
  <hx-icon name="edit" aria-hidden="true"></hx-icon>
</hx-icon-button>

{# Correct — contextual label #}
<hx-icon-button label="Edit medication order for patient Margaret Thompson">
  <hx-icon name="edit" aria-hidden="true"></hx-icon>
</hx-icon-button>

{# For repeated items in a list, use aria-labelledby from adjacent content #}
{# Or generate the label server-side with patient/record context #}
<hx-icon-button label="{{ 'Edit order for @patient'|t({'@patient': patient.name}) }}">
  <hx-icon name="edit" aria-hidden="true"></hx-icon>
</hx-icon-button>
```

## Event Handling with Drupal Behaviors

```javascript
(function (Drupal, once) {
  Drupal.behaviors.hxIconButtonActions = {
    attach(context) {
      once('hx-icon-btn', '[data-action-edit]', context).forEach((el) => {
        el.addEventListener('hx-click', (e) => {
          const recordId = el.dataset.recordId;
          // Trigger AJAX or navigate
          Drupal.ajax({ url: `/edit/${recordId}` }).execute();
        });
      });
    },
  };
})(Drupal, once);
```

## Form Submit/Reset Usage

When used as a form control, the component participates in native form submission via ElementInternals:

```twig
<form method="post" action="{{ form_action }}">
  {{ form_fields }}
  <hx-icon-button
    label="Submit form"
    type="submit"
    variant="primary"
  >
    <hx-icon name="check" aria-hidden="true"></hx-icon>
  </hx-icon-button>
</form>
```

## Asset Loading

```yaml
# mytheme.libraries.yml
hx-icon-button:
  js:
    https://cdn.example.com/@helixui/library/dist/hx-icon-button.js:
      type: external
      attributes:
        type: module
```

Attach in your template:

```twig
{{ attach_library('mytheme/hx-icon-button') }}
```
