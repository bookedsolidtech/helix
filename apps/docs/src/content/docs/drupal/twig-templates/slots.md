---
title: Slot Patterns in Twig
description: Content projection with Shadow DOM slots in Drupal Twig templates — default slots, named slots, Drupal field content in slots, media elements, complex slot patterns, and fallback content.
sidebar:
  order: 3
---

Slots are the HTML-native mechanism for projecting content into a web component's Shadow DOM. Everything you place inside an `<hx-card>` tag in a Twig template is Light DOM — content owned by the document, not by the component. The component's Shadow DOM has `<slot>` elements that act as insertion points, distributing your Light DOM content into the correct positions in the component's rendered output.

Understanding slots is the key to using HELiX components effectively in Drupal Twig templates.

---

## How Slots Work

### Light DOM vs. Shadow DOM

```
Your Twig markup (Light DOM):
┌─────────────────────────────────┐
│ <hx-card>                       │
│   <span slot="heading">…</span> │  ← you own this content
│   <p>Body text</p>              │  ← you own this too
│   <div slot="footer">…</div>    │  ← and this
│ </hx-card>                      │
└─────────────────────────────────┘

Component Shadow DOM (owned by the library):
┌─────────────────────────────────────────────┐
│ <div class="card">                          │
│   <div class="card__header">                │
│     <slot name="heading"></slot>  ← receives <span slot="heading"> │
│   </div>                                    │
│   <div class="card__body">                  │
│     <slot></slot>             ← receives <p>Body text</p>          │
│   </div>                                    │
│   <div class="card__footer">                │
│     <slot name="footer"></slot>   ← receives <div slot="footer">   │
│   </div>                                    │
│ </div>                                      │
└─────────────────────────────────────────────┘
```

From Drupal's perspective, all the slot content is normal HTML that Drupal renders server-side. The slot distribution happens in the browser, client-side, after the component upgrades.

### Why Slots Matter for Drupal

Slots preserve the full Drupal rendering pipeline for your content:

- **Render arrays work** — `{{ content.field_image }}` inside a slot renders through Drupal's field formatters.
- **Translation works** — text in slots goes through `t()` and language negotiation.
- **Cache tags propagate** — Drupal's cache layer still tracks which content is on the page.
- **Contextual links work** — Drupal's contextual editing hooks remain intact.
- **SEO works** — content in slots is in the Light DOM, visible to crawlers without JavaScript.

---

## The Default Slot

Content without a `slot` attribute goes to the component's default (unnamed) slot. Most components have a default slot for their primary body content.

```twig
{# Everything inside hx-card without a slot= attribute goes to the default slot #}
<hx-card variant="default">
  <p>This is the main card body content.</p>
  <p>Multiple elements project to the default slot.</p>
  <ul>
    <li>List item one</li>
    <li>List item two</li>
  </ul>
</hx-card>
```

### Default Slot with Drupal Field Content

```twig
<hx-card variant="featured">
  <span slot="heading">{{ label }}</span>

  {# The body field renders into the default slot #}
  {{ content.body }}
</hx-card>
```

```twig
{# Multiple fields in the default slot #}
<hx-card variant="default">
  <span slot="heading">{{ label }}</span>

  <div class="patient__details">
    {{ content.field_diagnosis }}
    {{ content.field_treatment_plan }}
  </div>
</hx-card>
```

### `hx-button` Default Slot

For simple components like `hx-button`, the entire content is a default slot:

```twig
{# Text content #}
<hx-button variant="primary">Submit Form</hx-button>

{# Rich content: icon + text #}
<hx-button variant="primary" hx-size="lg">
  <svg aria-hidden="true" slot="icon">...</svg>
  Save Patient Record
</hx-button>

{# From Drupal field #}
<hx-button variant="{{ button_variant|default('primary') }}">
  {{ node.field_button_text.value }}
</hx-button>
```

---

## Named Slots

Named slots require the `slot="name"` attribute on the element being projected. The element is distributed into the Shadow DOM's `<slot name="name">` insertion point.

### Basic Named Slot Usage

```twig
<hx-card variant="featured" elevation="raised">

  {# slot="image" — visual header of the card #}
  <img slot="image" src="/images/hero.jpg" alt="Hero image">

  {# slot="heading" — card title area #}
  <h2 slot="heading">Patient Name</h2>

  {# no slot attribute — default slot body #}
  <p>Medical history details...</p>

  {# slot="footer" — metadata below the body #}
  <div slot="footer">
    <time>Last visit: 2026-02-15</time>
  </div>

  {# slot="actions" — action buttons #}
  <div slot="actions">
    <hx-button variant="primary">View Record</hx-button>
    <hx-button variant="secondary">Print</hx-button>
  </div>

</hx-card>
```

### Named Slots with Drupal Field Render Arrays

Drupal field render arrays work inside named slots — Twig renders the field through its formatter, and the resulting HTML lands in the slot:

```twig
<hx-card variant="featured">

  {# Image field rendered through Drupal's image formatter #}
  {% if content.field_featured_image|render|trim %}
    <div slot="image">
      {{ content.field_featured_image }}
    </div>
  {% endif %}

  {# Node title in the heading slot #}
  <h2 slot="heading"{{ title_attributes }}>{{ label }}</h2>

  {# Body field in the default slot #}
  {{ content.body }}

  {# Taxonomy reference field in the footer slot #}
  {% if content.field_department|render|trim %}
    <div slot="footer">
      <hx-badge variant="secondary">
        {{ node.field_department.entity.name.value }}
      </hx-badge>
    </div>
  {% endif %}

</hx-card>
```

---

## Conditional Slot Rendering

Always check that content exists before rendering a slot element. Rendering an empty slot wrapper can cause visual artifacts (extra padding, empty borders) in components that style their slot containers.

```twig
<hx-card variant="default">
  <span slot="heading">{{ title }}</span>

  {{ body }}

  {# Only render footer slot if there's something to show #}
  {% if footer_content %}
    <div slot="footer">{{ footer_content }}</div>
  {% endif %}
</hx-card>
```

```twig
{# Guard with |render|trim for render arrays #}
<hx-card variant="featured">

  {% if content.field_image|render|trim %}
    <div slot="image">{{ content.field_image }}</div>
  {% endif %}

  <span slot="heading">{{ label }}</span>

  {{ content.body }}

  {% if content.field_author|render|trim or content.field_date|render|trim %}
    <div slot="footer">
      {% if content.field_author|render|trim %}
        <span>By {{ content.field_author }}</span>
      {% endif %}
      {% if content.field_date|render|trim %}
        <time datetime="{{ node.created.value|date('c') }}">
          {{ node.created.value|date('F j, Y') }}
        </time>
      {% endif %}
    </div>
  {% endif %}

</hx-card>
```

---

## Media Elements in Slots

### Images

```twig
{# Drupal-managed image via file_url() #}
{% if node.field_patient_photo.entity %}
  <img
    slot="image"
    src="{{ file_url(node.field_patient_photo.entity.uri.value) }}"
    alt="{{ node.field_patient_photo.alt }}"
    loading="lazy"
  >
{% endif %}

{# Image field rendered through Drupal's responsive image formatter #}
{% if content.field_featured_image|render|trim %}
  <div slot="image">
    {{ content.field_featured_image }}
  </div>
{% endif %}
```

### Video Embeds

```twig
{% if content.field_video_embed|render|trim %}
  <div slot="image" class="card__video">
    {{ content.field_video_embed }}
  </div>
{% endif %}
```

### Icons

```twig
{# SVG icon in a named icon slot #}
<hx-button variant="primary">
  <svg slot="icon" aria-hidden="true" width="16" height="16">
    <use href="#icon-save"></use>
  </svg>
  Save Record
</hx-button>
```

---

## Complex Slot Patterns

### Multiple Elements in One Slot

A single named slot can receive multiple elements when you wrap them in a container:

```twig
<hx-card>
  <span slot="heading">{{ label }}</span>

  {{ content.body }}

  {# Footer slot with multiple child elements #}
  <div slot="footer" class="patient-card__footer">
    {% if node.field_department.entity %}
      <hx-badge variant="secondary">
        {{ node.field_department.entity.name.value }}
      </hx-badge>
    {% endif %}
    {% if node.field_last_visit.value %}
      <time datetime="{{ node.field_last_visit.value|date('c') }}">
        Last visit: {{ node.field_last_visit.value|date('M j, Y') }}
      </time>
    {% endif %}
    {% if node.field_status.value %}
      <hx-badge
        variant="{{ node.field_status.value == 'active' ? 'success' : 'neutral' }}"
      >
        {{ node.field_status.value|capitalize }}
      </hx-badge>
    {% endif %}
  </div>
</hx-card>
```

### Heading Slot with Semantic Hierarchy

Match the heading level to the page context rather than always using `<span>`:

```twig
{# Full node page: h1 is appropriate #}
{% if view_mode == 'full' %}
  <h1 slot="heading"{{ title_attributes }}>{{ label }}</h1>
{% elseif view_mode == 'teaser' %}
  <h2 slot="heading">{{ label }}</h2>
{% else %}
  <h3 slot="heading">{{ label }}</h3>
{% endif %}
```

### Actions Slot with Conditional Buttons

```twig
<hx-card variant="default">
  <span slot="heading">{{ label }}</span>
  {{ content.body }}

  <div slot="actions">
    <hx-button variant="primary" hx-size="sm">
      View Full Record
    </hx-button>

    {% if node.field_allow_messaging.value %}
      <hx-button variant="ghost" hx-size="sm">
        Send Message
      </hx-button>
    {% endif %}

    {% if node.field_allow_appointment.value %}
      <hx-button variant="secondary" hx-size="sm">
        Schedule Appointment
      </hx-button>
    {% endif %}
  </div>
</hx-card>
```

### Nested Components in Slots

HELiX components can be nested in slots. The outer component receives another HELiX component as slot content:

```twig
<hx-card variant="featured">
  <span slot="heading">Patient Dashboard</span>

  <div class="patient__status-row">
    <hx-badge variant="success">Active</hx-badge>
    <hx-badge variant="info">Cardiology</hx-badge>
    <hx-badge variant="warning">Follow-up Required</hx-badge>
  </div>

  {{ content.body }}

  <div slot="actions">
    <hx-button variant="primary" hx-size="md">Edit Record</hx-button>
    <hx-button variant="ghost" hx-size="md">Print</hx-button>
  </div>
</hx-card>
```

---

## Slot Fallback Content

HELiX components may define fallback content inside their Shadow DOM `<slot>` elements. This fallback renders only when no Light DOM content is projected into that slot. You never need to render fallback content yourself in Twig — the component handles it automatically.

However, you should still guard optional slots with `{% if %}` checks to avoid empty wrapper elements ending up in the Light DOM:

```twig
{# Without guard: an empty <div slot="footer"> is in the DOM even with no content #}
<hx-card>
  <span slot="heading">{{ label }}</span>
  <div slot="footer">{{ content.field_optional_footer }}</div>
</hx-card>

{# With guard: footer slot is absent when there's no content; component fallback activates #}
<hx-card>
  <span slot="heading">{{ label }}</span>
  {% if content.field_optional_footer|render|trim %}
    <div slot="footer">{{ content.field_optional_footer }}</div>
  {% endif %}
</hx-card>
```

---

## Views Integration

Views templates commonly map view result fields to component slots:

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
      {# Image slot #}
      {% if patient.field_photo.entity %}
        <img
          slot="image"
          src="{{ file_url(patient.field_photo.entity.uri.value) }}"
          alt="{{ patient.field_photo.alt }}"
          loading="lazy"
        >
      {% endif %}

      {# Heading slot #}
      <div slot="heading">
        <span>{{ patient.label }}</span>
        {% if patient.field_patient_id.value %}
          <small>ID: {{ patient.field_patient_id.value }}</small>
        {% endif %}
      </div>

      {# Default slot: details #}
      <div class="patient-list__details">
        {% if patient.field_department.entity %}
          <hx-badge variant="secondary">
            {{ patient.field_department.entity.name.value }}
          </hx-badge>
        {% endif %}
      </div>

      {# Footer slot #}
      {% if patient.field_last_visit.value %}
        <time
          slot="footer"
          datetime="{{ patient.field_last_visit.value|date('c') }}"
        >
          Last visit: {{ patient.field_last_visit.value|date('M j, Y') }}
        </time>
      {% endif %}

      {# Actions slot #}
      <div slot="actions">
        <hx-button variant="primary" hx-size="sm">View Record</hx-button>
      </div>
    </hx-card>
  {% endfor %}
</div>
```

---

## Slot Best Practices

### Use Semantic HTML Inside Slots

```twig
{# Good: semantically correct elements #}
<hx-card>
  <h2 slot="heading">{{ title }}</h2>
  <div>
    <p>{{ summary }}</p>
  </div>
  <time slot="footer" datetime="{{ date|date('c') }}">
    {{ date|date('F j, Y') }}
  </time>
</hx-card>

{# Avoid: span-soup removes semantic meaning #}
<hx-card>
  <span slot="heading">{{ title }}</span>
  <span>{{ summary }}</span>
  <span slot="footer">{{ date }}</span>
</hx-card>
```

### One Container Per Named Slot

Each named slot should have a single direct child element (which can contain multiple children):

```twig
{# Good: single container wrapping multiple elements #}
<hx-card>
  <div slot="footer">
    <span class="author">By Dr. Smith</span>
    <time datetime="2026-02-16">February 16, 2026</time>
  </div>
</hx-card>

{# Ambiguous: multiple direct children competing for the same slot #}
{# Only the first may be rendered depending on component implementation #}
<hx-card>
  <span slot="footer">By Dr. Smith</span>
  <time slot="footer">February 16, 2026</time>
</hx-card>
```

### Check Before Rendering Slot Wrappers

```twig
{# Good: guard ensures no empty slot wrapper #}
{% if node.field_author.value or node.field_date.value %}
  <div slot="footer">
    {% if node.field_author.value %}
      <span>{{ node.field_author.value }}</span>
    {% endif %}
    {% if node.field_date.value %}
      <time datetime="{{ node.field_date.value|date('c') }}">
        {{ node.field_date.value|date('F j, Y') }}
      </time>
    {% endif %}
  </div>
{% endif %}
```

---

## Additional Resources

- [Twig Integration Fundamentals](/drupal/twig-templates/fundamentals/)
- [Property Binding in Twig](/drupal/twig-templates/properties/)
- [Twig Attributes Object](/drupal/twig-templates/attributes/)
- [Behaviors with Web Components](/drupal/behaviors/web-components/)
- [MDN — Using templates and slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots)
