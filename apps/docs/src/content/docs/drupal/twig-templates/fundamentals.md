---
title: Twig Integration Fundamentals
description: Core concepts for using HELiX web components as HTML tags in Drupal Twig templates, including progressive enhancement, server-side vs client-side rendering, and basic component usage patterns.
sidebar:
  order: 1
---

HELiX web components are native HTML custom elements. In Drupal Twig templates they work exactly like standard HTML tags — Drupal renders the markup server-side, and the HELiX JavaScript hydrates the components client-side when it loads. This document covers the mental model, basic usage patterns, and the structural rules you need before writing your first template.

---

## The Integration Model

### Web Components Are HTML

Custom elements are part of the HTML specification. A browser that has not yet loaded the HELiX JavaScript will still parse `<hx-card>` as a valid (but un-upgraded) HTML element. All child content — slots, text, nested elements — is available immediately in the DOM.

```twig
{# Drupal renders this markup during the server-side template pass #}
<hx-card variant="default" elevation="raised">
  <span slot="heading">Patient Information</span>
  <p>John Doe — Cardiology — MRN 00412309</p>
</hx-card>
```

When the `@helixui/library` script executes, the browser upgrades every `<hx-card>` instance it finds, attaching the Shadow DOM and component behaviour. Content that was already in the Light DOM (the slot content) moves into the appropriate slots automatically.

### Progressive Enhancement Philosophy

Because slot content lives in the Light DOM before JavaScript loads, HELiX components follow progressive enhancement by default:

- **Content is indexable** — search engines see all text without executing JavaScript.
- **Accessible before hydration** — screen readers can traverse slot content even if the Shadow DOM has not attached.
- **No flash of unstyled content** — component styles are encapsulated; there is no FOUC from external stylesheets.
- **Works without JavaScript** — essential information is readable even when JS fails entirely.

```twig
{# Good: content is visible immediately #}
<hx-card variant="featured">
  <span slot="heading">Appointment Confirmed</span>
  <p>Dr. Smith — March 28, 2026 at 2:30 PM</p>
  <div slot="footer">Cardiology — Room 412</div>
</hx-card>

{# Bad: card is empty until JavaScript runs #}
<hx-card variant="featured" data-appointment-id="789"></hx-card>
```

### Server-Side vs. Client-Side Rendering

| Concern | Rendered By | When |
|---|---|---|
| HTML structure (tags, attributes) | Drupal / Twig | Server-side, during page render |
| Slot content | Drupal / Twig | Server-side |
| Shadow DOM layout | Browser / HELiX | Client-side, after script loads |
| Component styles | Browser / HELiX | Client-side, encapsulated in Shadow DOM |
| Event handlers | Browser / HELiX | Client-side |
| Complex properties (objects, arrays) | Drupal Behavior JS | Client-side, via `customElements.whenDefined()` |

---

## Basic Component Usage in Twig

### Simple Button

```twig
{# templates/components/cta-button.html.twig #}
<hx-button
  variant="{{ variant|default('primary') }}"
  hx-size="{{ size|default('md') }}"
  {% if disabled %}disabled{% endif %}
>
  {{ button_text }}
</hx-button>
```

In a node template:

```twig
{# templates/node/node--article.html.twig #}
<article{{ attributes }}>
  {{ title_prefix }}
  <h1{{ title_attributes }}>{{ label }}</h1>
  {{ title_suffix }}

  <div{{ content_attributes }}>
    {{ content.body }}

    {% if content.field_cta_text %}
      <hx-button variant="primary" hx-size="lg" type="button">
        {{ content.field_cta_text.0['#context'].value }}
      </hx-button>
    {% endif %}
  </div>
</article>
```

### Alert Banner

```twig
{# Inline alert from a block field #}
<hx-alert
  variant="{{ content.field_alert_type.0['#markup']|default('info') }}"
  {% if content.field_dismissible.0['#markup'] == '1' %}dismissible{% endif %}
>
  {{ content.field_alert_message }}
</hx-alert>
```

### Card with Multiple Slots

```twig
{# templates/node/node--story.html.twig #}
<hx-card variant="featured" elevation="floating">

  {# image slot #}
  {% if content.field_featured_image|render|trim %}
    <div slot="image">
      {{ content.field_featured_image }}
    </div>
  {% endif %}

  {# heading slot #}
  <span slot="heading">{{ label }}</span>

  {# default slot: body content #}
  <div class="story__body">
    {{ content.body }}
  </div>

  {# footer slot #}
  {% if content.field_author or content.field_date %}
    <div slot="footer">
      {% if content.field_author %}
        <span>By {{ content.field_author.0['#context'].value }}</span>
      {% endif %}
      {% if content.field_date %}
        <time datetime="{{ content.field_date.0['#markup'] }}">
          {{ content.field_date.0['#markup']|date('F j, Y') }}
        </time>
      {% endif %}
    </div>
  {% endif %}

  {# actions slot #}
  {% if content.field_cta_link|render|trim %}
    <div slot="actions">
      <hx-button variant="secondary" hx-size="md">
        Read Full Story
      </hx-button>
    </div>
  {% endif %}

</hx-card>
```

---

## Attribute Passing Patterns

### String Attributes

String attributes map directly to component reflected properties:

```twig
{# Static value #}
<hx-button variant="secondary">Click me</hx-button>

{# Dynamic from Twig variable #}
<hx-button variant="{{ button_variant }}">{{ button_label }}</hx-button>

{# From Drupal field #}
<hx-button variant="{{ node.field_button_style.value }}">
  {{ node.field_button_text.value }}
</hx-button>

{# With default fallback #}
<hx-button variant="{{ variant|default('primary') }}">Action</hx-button>

{# Inline conditional #}
<hx-button variant="{% if is_featured %}primary{% else %}secondary{% endif %}">
  Submit
</hx-button>
```

### The `hx-` Prefix Convention

HELiX uses `hx-` prefixed attribute names where native HTML already reserves the plain name:

```twig
{# hx-size — avoids conflict with the native `size` attribute on <input> #}
<hx-button hx-size="lg" variant="primary">Large Button</hx-button>
<hx-badge hx-size="sm" variant="secondary">New</hx-badge>

{# href — makes the whole card a link; fires hx-click on activation #}
<hx-card href="/patient/{{ node.id }}" variant="default">
  <span slot="heading">{{ label }}</span>
  Click anywhere on this card to navigate
</hx-card>
```

Always use `hx-size` rather than `size`. `hx-card` uses `href` directly — it reflects to the `href` HTML attribute and activates via click or Enter/Space.

### Boolean Attributes

Boolean attributes are controlled by **presence** (truthy) or **absence** (falsy). Never set them to the string `"false"`:

```twig
{# Correct: conditional attribute presence #}
<hx-button
  variant="primary"
  {% if is_disabled %}disabled{% endif %}
  {% if is_required %}required{% endif %}
>
  Submit Form
</hx-button>

{# Correct: ternary produces empty string when false #}
<hx-button variant="primary" {{ user.is_guest ? 'disabled' : '' }}>
  Save Changes
</hx-button>

{# WRONG: the presence of disabled="false" still disables the button #}
<hx-button disabled="false">This is still disabled</hx-button>
```

### Drupal Attributes Object

HELiX components work with Drupal's `create_attribute()` pattern:

```twig
{% set card_attributes = create_attribute() %}
{% set card_attributes = card_attributes
  .addClass('patient-card')
  .setAttribute('data-entity-id', node.id)
  .setAttribute('data-entity-type', 'node')
%}

<hx-card
  variant="featured"
  elevation="raised"
  {{ card_attributes }}
>
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
</hx-card>
```

---

## Content Projection and Slots

Slots are the HTML-native mechanism for passing content into a web component's Shadow DOM. In Twig, content is assigned to a slot by adding a `slot="name"` attribute to the element you want to project.

### Default Slot

Content without a `slot` attribute goes to the unnamed default slot:

```twig
<hx-card variant="default">
  {# Everything here goes to the default slot #}
  <p>This is the main card body content.</p>
  <p>Multiple elements can project to the default slot.</p>
</hx-card>
```

### Named Slots

```twig
<hx-card variant="featured">
  {# Named slot: image #}
  <img slot="image" src="/images/hero.jpg" alt="Hero image">

  {# Named slot: heading #}
  <h2 slot="heading">Patient Name</h2>

  {# Default slot: body #}
  <p>Medical history details...</p>

  {# Named slot: footer #}
  <div slot="footer">
    <time>Last visit: 2026-02-15</time>
  </div>

  {# Named slot: actions #}
  <div slot="actions">
    <hx-button variant="primary">View Record</hx-button>
    <hx-button variant="secondary">Print</hx-button>
  </div>
</hx-card>
```

### Conditional Slot Rendering

Render a slot only when its content exists:

```twig
<hx-card>
  <span slot="heading">{{ title }}</span>

  {{ body }}

  {% if footer_content %}
    <div slot="footer">{{ footer_content }}</div>
  {% endif %}
</hx-card>
```

---

## Complex Properties Require JavaScript

HTML attributes are always strings. Component properties that accept objects or arrays cannot be set from Twig. Pass the data as a JSON-encoded `data-` attribute and initialize it in a Drupal Behavior:

```twig
{# templates/components/data-table.html.twig #}
<hx-data-table
  id="patient-table-{{ node.id }}"
  data-drupal-columns="{{ columns|json_encode|escape }}"
>
  {# Accessible fallback for no-JS #}
  <table>
    <thead>
      <tr>
        {% for col in columns %}
          <th>{{ col.label }}</th>
        {% endfor %}
      </tr>
    </thead>
    <tbody>
      {% for row in rows %}
        <tr>
          {% for col in columns %}
            <td>{{ row[col.field] }}</td>
          {% endfor %}
        </tr>
      {% endfor %}
    </tbody>
  </table>
</hx-data-table>
```

```javascript
// mytheme/js/behaviors/hx-data-table.js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxDataTable = {
    attach(context) {
      once('helixui:data-table-init', 'hx-data-table[data-drupal-columns]', context).forEach((table) => {
        customElements.whenDefined('hx-data-table').then(() => {
          const columnsJson = table.getAttribute('data-drupal-columns');
          if (columnsJson) {
            try {
              table.columns = JSON.parse(columnsJson);
            } catch (e) {
              console.error('[HELiX] Failed to parse columns JSON', e);
            }
          }
        });
      });
    },
  };
})(Drupal, once);
```

See the [Behaviors documentation](/drupal/behaviors/fundamentals/) for the complete pattern.

---

## Drupal-Specific Patterns

### Node Templates

```twig
{# templates/node/node--article--full.html.twig #}
<article{{ attributes.addClass('article', 'article--full') }}>
  {{ title_prefix }}
  {{ title_suffix }}

  <hx-card variant="featured" elevation="floating">

    {% if content.field_featured_image|render|trim %}
      <div slot="image">{{ content.field_featured_image }}</div>
    {% endif %}

    <h1 slot="heading"{{ title_attributes }}>{{ label }}</h1>

    <div slot="footer" class="article__meta">
      <time datetime="{{ node.created.value|date('c') }}">
        {{ node.created.value|date('F j, Y') }}
      </time>
      {% if content.field_read_time|render|trim %}
        <span>{{ content.field_read_time }} min read</span>
      {% endif %}
    </div>

    <div class="article__body">{{ content.body }}</div>

    {% if content.field_cta_link|render|trim %}
      <div slot="actions">
        <hx-button variant="primary" hx-size="lg">
          {{ content.field_cta_link.0['#title'] }}
        </hx-button>
      </div>
    {% endif %}

  </hx-card>
</article>
```

### Views Templates

```twig
{# templates/views/views-view-unformatted--patient-list.html.twig #}
<div{{ attributes.addClass('patient-list') }}>
  {% for row in rows %}
    {% set patient = row.content['#row']._entity %}

    <hx-card
      variant="default"
      elevation="raised"
      href="{{ path('entity.node.canonical', {'node': patient.id}) }}"
    >
      {% if patient.field_photo.entity %}
        <img
          slot="image"
          src="{{ file_url(patient.field_photo.entity.uri.value) }}"
          alt="{{ patient.field_photo.alt }}"
        >
      {% endif %}

      <span slot="heading">{{ patient.label }}</span>

      <div class="patient__details">
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
      </div>
    </hx-card>
  {% endfor %}
</div>
```

### Block Templates

```twig
{# templates/block/block--alert-banner.html.twig #}
<div{{ attributes.addClass('block', 'block-alert') }}>
  {{ title_prefix }}
  {% if label %}
    <h2{{ title_attributes }}>{{ label }}</h2>
  {% endif %}
  {{ title_suffix }}

  {% block content %}
    <hx-alert
      variant="{{ content.field_alert_type.0['#markup']|default('info') }}"
      {% if content.field_dismissible.0['#markup'] == '1' %}dismissible{% endif %}
    >
      {{ content.field_alert_message }}
    </hx-alert>
  {% endblock %}
</div>
```

---

## Best Practices

### Always Provide Fallback Content

```twig
{# Good: content is accessible before JS loads #}
<hx-card variant="featured">
  <span slot="heading">Patient Information</span>
  <p>John Doe — Age 45 — Cardiology</p>
</hx-card>

{# Bad: empty card until JS runs #}
<hx-card variant="featured" data-patient-id="123"></hx-card>
```

### Check Field Existence Before Rendering

```twig
{# Good: guard before projecting into a slot #}
{% if content.field_featured_image|render|trim %}
  <div slot="image">
    {{ content.field_featured_image }}
  </div>
{% endif %}

{# Bad: always renders the slot wrapper even when empty #}
<div slot="image">
  {{ content.field_featured_image }}
</div>
```

### Preserve Drupal's Attribute System

```twig
{# Good: Drupal attributes on the semantic wrapper #}
<article{{ attributes.addClass('patient-node') }}>
  <hx-card variant="default">
    {{ content }}
  </hx-card>
</article>

{# Bad: discards Drupal's contextual and accessibility attributes #}
<article class="patient-node">
  <hx-card variant="default">
    {{ content }}
  </hx-card>
</article>
```

### Keep Logic in Twig, Not JavaScript

```twig
{# Good: derive variant from field value in Twig #}
{% set variant = node.field_priority.value == 'urgent' ? 'primary' : 'secondary' %}
<hx-button variant="{{ variant }}">
  {{ node.field_priority.value == 'urgent' ? 'Urgent Action' : 'Standard Action' }}
</hx-button>

{# Bad: defer simple string logic to a Drupal Behavior #}
<hx-button id="action-btn" data-priority="{{ node.field_priority.value }}">
  Action
</hx-button>
```

---

## Additional Resources

- [Property Binding in Twig](/drupal/twig-templates/properties/)
- [Slot Patterns in Twig](/drupal/twig-templates/slots/)
- [Twig Attributes Object](/drupal/twig-templates/attributes/)
- [Twig Debugging](/drupal/twig-templates/debugging/)
- [Drupal Behaviors](/drupal/behaviors/fundamentals/)
- [Drupal Twig Documentation](https://www.drupal.org/docs/theming-drupal/twig-in-drupal)
