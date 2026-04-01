---
title: Twig Attributes Object
description: Using Drupal's attributes object with HELiX web components — addClass(), setAttribute(), merging Drupal attributes with component attributes, ARIA attributes, and data attributes for JavaScript behaviors.
sidebar:
  order: 4
---

Drupal's `attributes` object is a Twig-level abstraction that manages HTML attributes for template elements. When you write `{{ attributes }}` in a template, Drupal prints a series of HTML attributes that it has assembled from context: CSS classes for the content type and view mode, data attributes for contextual links, ARIA attributes, and anything added by modules.

Discarding these attributes by writing a plain `class="my-class"` instead of `{{ attributes.addClass('my-class') }}` silently breaks contextual editing, module hooks, and accessibility features. This document covers how to work with Drupal's attributes system when the element receiving those attributes is a HELiX web component.

---

## Why the Attributes Object Matters

```twig
{# Without attributes object — loses Drupal's contextual classes #}
<article class="patient-node">
  <hx-card variant="featured">{{ content }}</hx-card>
</article>

{# With attributes object — preserves all Drupal functionality #}
<article{{ attributes.addClass('patient-node') }}>
  <hx-card variant="featured">{{ content }}</hx-card>
</article>
```

The second form preserves:

- `.contextual-region` — contextual editing overlays
- RDF attributes for semantic web / schema.org
- `data-history-node-id` — page history tracking
- Module-added attributes from hooks
- CSS hooks for theming and Layout Builder
- ARIA attributes for accessibility

---

## Attributes Objects Available by Template Type

| Template | Available Objects |
|---|---|
| `node.html.twig` | `attributes`, `title_attributes`, `content_attributes` |
| `field.html.twig` | `attributes`, `title_attributes`, `item.attributes` |
| `block.html.twig` | `attributes`, `title_attributes` |
| `paragraph.html.twig` | `attributes`, `content_attributes` |
| `views-view.html.twig` | `attributes`, `title_attributes`, `rows_attributes` |
| `page.html.twig` | `html_attributes`, `body_attributes` |

---

## `create_attribute()` — Building New Attribute Objects

Use `create_attribute()` when you need a fresh attributes object for an inner element (like an `hx-card`) that is separate from the Drupal-provided `attributes` object.

```twig
{# Create a new, empty attributes object #}
{% set card_attrs = create_attribute() %}

{# Chain methods to build it up #}
{% set card_attrs = card_attrs
  .addClass('patient-card')
  .addClass('patient-card--featured')
  .setAttribute('data-entity-id', node.id)
  .setAttribute('data-entity-type', 'node')
%}

{# Apply to the HELiX component #}
<hx-card
  variant="featured"
  elevation="raised"
  {{ card_attrs }}
>
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
</hx-card>
```

Rendered HTML:

```html
<hx-card
  variant="featured"
  elevation="raised"
  class="patient-card patient-card--featured"
  data-entity-id="123"
  data-entity-type="node"
>
  <span slot="heading">Patient Name</span>
  ...
</hx-card>
```

---

## `addClass()` — Adding CSS Classes

### Basic Usage

```twig
{# Single class #}
<hx-card {{ attributes.addClass('patient-card') }}>
  {{ content }}
</hx-card>

{# Multiple classes in one call #}
<hx-card {{ attributes.addClass('patient-card', 'patient-card--featured') }}>
  {{ content }}
</hx-card>

{# From a Twig array #}
{% set card_classes = ['patient-card', 'patient-card--elevated'] %}
<hx-card {{ attributes.addClass(card_classes) }}>
  {{ content }}
</hx-card>
```

### Conditional Classes

```twig
{# Add class based on field value #}
<hx-card {{
  attributes.addClass(
    'patient-card',
    node.field_featured.value ? 'patient-card--featured' : 'patient-card--standard'
  )
}}>
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
</hx-card>

{# Build an array of classes conditionally #}
{% set card_classes = ['patient-card'] %}
{% if node.field_featured.value %}
  {% set card_classes = card_classes|merge(['patient-card--featured']) %}
{% endif %}
{% if node.field_urgent.value %}
  {% set card_classes = card_classes|merge(['patient-card--urgent']) %}
{% endif %}

<hx-card {{ attributes.addClass(card_classes) }}>
  {{ content }}
</hx-card>
```

### View Mode Classes

```twig
{# Append view mode as a BEM modifier #}
{% set view_mode_class = 'patient-card--' ~ view_mode|clean_class %}

<hx-card {{ attributes.addClass('patient-card', view_mode_class) }}>
  <span slot="heading">{{ label }}</span>
  {{ content }}
</hx-card>
```

The `|clean_class` filter converts underscores to hyphens and lowercases the string, so `search_result` becomes `search-result`.

---

## `setAttribute()` — Adding HTML Attributes

### Data Attributes for JavaScript

Data attributes bridge Twig-rendered content to Drupal Behaviors:

```twig
{# Add entity identifiers for JavaScript #}
<hx-card {{
  attributes
    .setAttribute('data-entity-id', node.id)
    .setAttribute('data-entity-type', 'node')
    .setAttribute('data-entity-bundle', node.bundle)
    .setAttribute('data-view-mode', view_mode)
}}>
  {{ content }}
</hx-card>
```

Access in a Drupal Behavior:

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxPatientCard = {
    attach(context) {
      once('helixui:patient-card', 'hx-card[data-entity-bundle="patient"]', context).forEach((card) => {
        const entityId = card.getAttribute('data-entity-id');
        const viewMode = card.getAttribute('data-view-mode');
        // use entityId and viewMode for further initialization
      });
    },
  };
})(Drupal, once);
```

### ARIA Attributes

Set accessibility attributes that depend on rendered node data:

```twig
{# ARIA label incorporating the node title #}
<hx-card {{
  attributes
    .setAttribute('aria-label', 'Patient record for ' ~ label)
    .setAttribute('role', 'article')
}}>
  <span slot="heading">{{ label }}</span>
  {{ content }}
</hx-card>

{# Live region for alerts #}
<hx-alert {{
  attributes
    .setAttribute('role', 'alert')
    .setAttribute('aria-live', 'polite')
    .setAttribute('aria-atomic', 'true')
}}>
  {{ content.field_alert_message }}
</hx-alert>
```

### JSON Data Attributes for Complex Initialization

When a Drupal Behavior needs structured data, pass it as a JSON-encoded `data-` attribute:

```twig
{% set patient_data = {
  id: node.id,
  name: label,
  department: node.field_department.entity.name.value,
  last_visit: node.field_last_visit.value|date('Y-m-d')
} %}

<hx-card {{
  attributes
    .addClass('patient-card')
    .setAttribute('data-patient', patient_data|json_encode)
}}>
  <span slot="heading">{{ label }}</span>
  {{ content }}
</hx-card>
```

Parse in the Behavior:

```javascript
once('helixui:patient-data', 'hx-card[data-patient]', context).forEach((card) => {
  const data = JSON.parse(card.getAttribute('data-patient'));
  // initialize with data.id, data.name, etc.
});
```

---

## `removeAttribute()` and `removeClass()`

### Removing Drupal-Generated IDs

Drupal may add an `id` attribute to nodes. When the same node appears multiple times on a page (e.g., in a View), duplicate IDs break HTML validity:

```twig
{# Remove the Drupal-generated ID from the component #}
{# Keep it on the semantic wrapper instead #}
<article{{ attributes }}>
  <hx-card {{
    create_attribute()
      .addClass('patient-card')
      .setAttribute('data-entity-id', node.id)
  }}>
    <span slot="heading">{{ label }}</span>
    {{ content.body }}
  </hx-card>
</article>
```

Or remove it explicitly:

```twig
<hx-card {{ attributes.removeAttribute('id').addClass('patient-card') }}>
  {{ content }}
</hx-card>
```

### Removing Drupal Classes Before Adding Custom Ones

```twig
{# Remove generic node classes and replace with BEM classes #}
<hx-card {{
  attributes
    .removeClass('node', 'node--type-patient', 'node--view-mode-full')
    .addClass('patient-record', 'patient-record--expanded')
}}>
  {{ content }}
</hx-card>
```

---

## Merging Attribute Sets

### `attributes.clone()` — Modifying Without Mutating

`attributes` is a mutable object. If you call `.addClass()` directly on it, you modify the original. When you need the original attributes on one element and a modified version on another, clone first:

```twig
{# Clone before modifying — original attributes go on <article> #}
{% set component_attrs = attributes.clone().addClass('patient-card') %}

<article{{ attributes }}>
  {{ title_prefix }}
  {{ title_suffix }}
  <hx-card {{ component_attrs }}>
    <span slot="heading">{{ label }}</span>
    {{ content.body }}
  </hx-card>
</article>
```

### `merge()` — Combining Two Attribute Sets

```twig
{# Build base attributes #}
{% set base_attrs = create_attribute()
  .addClass('patient-card')
  .setAttribute('data-entity-id', node.id)
%}

{# Build conditional attributes separately #}
{% set state_attrs = create_attribute() %}
{% if node.field_featured.value %}
  {% set state_attrs = state_attrs.addClass('patient-card--featured') %}
{% endif %}
{% if node.field_urgent.value %}
  {% set state_attrs = state_attrs
    .addClass('patient-card--urgent')
    .setAttribute('aria-label', 'Urgent patient: ' ~ label)
  %}
{% endif %}

{# Merge and apply #}
<hx-card {{ base_attrs.merge(state_attrs) }}>
  <span slot="heading">{{ label }}</span>
  {{ content }}
</hx-card>
```

---

## The Wrapped Pattern vs. Direct Spreading

### Option A: Semantic Wrapper (Recommended)

Keep the semantic HTML element for its structural meaning and accessibility. Drupal attributes go on the wrapper; component attributes are built separately.

```twig
{# Drupal attributes on <article>; HELiX attributes on <hx-card> #}
<article{{ attributes.addClass('patient-node') }}>
  {{ title_prefix }}
  {{ title_suffix }}

  <hx-card
    variant="featured"
    elevation="raised"
    {{ create_attribute()
      .addClass('patient-card')
      .setAttribute('data-entity-id', node.id)
    }}
  >
    <h1 slot="heading"{{ title_attributes }}>{{ label }}</h1>
    <div{{ content_attributes }}>{{ content.body }}</div>
  </hx-card>
</article>
```

### Option B: Direct Spreading onto the Component

When a semantic wrapper adds no value, spread Drupal attributes directly onto the component:

```twig
{# All Drupal attributes land on hx-card #}
<hx-card
  variant="default"
  elevation="raised"
  {{ attributes.addClass('patient-card') }}
>
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
</hx-card>
```

This is simpler but loses the semantic `<article>` element. Use it when the component itself carries sufficient semantic meaning for the context.

---

## Real-World Example: Patient List View

```twig
{# templates/views/views-view-unformatted--patient-list.html.twig #}
<div{{ attributes.addClass('patient-list') }}>
  {% for row in rows %}
    {% set patient = row.content['#row']._entity %}

    {# Build per-card attributes #}
    {% set card_attrs = create_attribute()
      .addClass('patient-list__item')
      .setAttribute('data-patient-id', patient.field_patient_id.value)
      .setAttribute('data-entity-id', patient.id)
    %}
    {% if patient.field_status.value == 'active' %}
      {% set card_attrs = card_attrs.addClass('patient-list__item--active') %}
    {% endif %}
    {% if patient.field_urgent.value %}
      {% set card_attrs = card_attrs
        .addClass('patient-list__item--urgent')
        .setAttribute('aria-label', 'Urgent patient: ' ~ patient.label)
      %}
    {% endif %}

    <hx-card
      variant="default"
      elevation="raised"
      hx-href="{{ path('entity.node.canonical', {'node': patient.id}) }}"
      {{ card_attrs }}
    >
      {% if patient.field_photo.entity %}
        <img
          slot="image"
          src="{{ file_url(patient.field_photo.entity.uri.value) }}"
          alt="{{ patient.field_photo.alt }}"
        >
      {% endif %}

      <div slot="heading">
        <span>{{ patient.label }}</span>
        {% if patient.field_patient_id.value %}
          <small>ID: {{ patient.field_patient_id.value }}</small>
        {% endif %}
      </div>

      <div class="patient-list__details">
        {% if patient.field_department.entity %}
          <hx-badge variant="secondary">
            {{ patient.field_department.entity.name.value }}
          </hx-badge>
        {% endif %}
      </div>

      {% if patient.field_last_visit.value %}
        <time slot="footer" datetime="{{ patient.field_last_visit.value|date('c') }}">
          Last visit: {{ patient.field_last_visit.value|date('M j, Y') }}
        </time>
      {% endif %}

      <div slot="actions">
        <hx-button variant="primary" hx-size="sm">View Record</hx-button>
        {% if patient.field_allow_messaging.value %}
          <hx-button variant="ghost" hx-size="sm">Send Message</hx-button>
        {% endif %}
      </div>
    </hx-card>
  {% endfor %}
</div>
```

---

## Best Practices

### Always Clone Before Modification

```twig
{# Good: clone preserves the original for the wrapper #}
{% set card_attrs = attributes.clone().addClass('patient-card') %}
<article{{ attributes }}>
  <hx-card {{ card_attrs }}>{{ content }}</hx-card>
</article>

{# Bad: attributes is mutated; wrapper and component share modified state #}
<article{{ attributes }}>
  <hx-card {{ attributes.addClass('patient-card') }}>{{ content }}</hx-card>
</article>
```

### Use `create_attribute()` for Inner Elements

```twig
{# Good: explicit new attributes object for the component #}
{% set card_attrs = create_attribute()
  .addClass('patient-card')
  .setAttribute('data-id', node.id)
%}
<hx-card {{ card_attrs }}>{{ content }}</hx-card>

{# Avoid: raw HTML attribute strings break Drupal's attribute merging #}
<hx-card class="patient-card" data-id="{{ node.id }}">{{ content }}</hx-card>
```

### Chain Methods for Readability

```twig
{# Good: chained calls on a single variable #}
{% set attrs = create_attribute()
  .addClass('patient-card', 'patient-card--' ~ view_mode|clean_class)
  .setAttribute('data-entity-id', node.id)
  .setAttribute('role', 'article')
  .setAttribute('aria-labelledby', 'heading-' ~ node.id)
%}
```

### Document Complex Attribute Logic

```twig
{#
 * Build card attributes based on:
 * - View mode (full, teaser, compact) → class modifier
 * - Patient status (active, inactive) → class modifier + ARIA
 * - Priority level → class modifier
 #}
{% set card_classes = [
  'patient-card',
  'patient-card--' ~ view_mode|clean_class,
] %}
```

---

## Additional Resources

- [Twig Integration Fundamentals](/drupal/twig-templates/fundamentals/)
- [Property Binding in Twig](/drupal/twig-templates/properties/)
- [Twig Debugging](/drupal/twig-templates/debugging/)
- [Drupal Behaviors](/drupal/behaviors/fundamentals/)
- [Drupal Twig Attributes Documentation](https://www.drupal.org/docs/theming-drupal/twig-in-drupal/using-attributes-in-templates)
