---
title: TWIG Integration Fundamentals
description: Deep dive into using HELIX web components in Drupal TWIG templates with comprehensive patterns and best practices
order: 7
---

HELIX web components integrate naturally with Drupal's TWIG templating system. This comprehensive guide covers everything you need to know about rendering web components in TWIG templates, from basic syntax to advanced patterns for complex Drupal content architectures.

## Understanding the Integration Model

HELIX components are native HTML custom elements. In TWIG templates, they work exactly like standard HTML tags. Drupal renders HTML server-side, and HELIX components hydrate client-side when the JavaScript loads.

### Progressive Enhancement Philosophy

```twig
{# Content is accessible BEFORE JavaScript loads #}
<hx-card variant="default" elevation="raised">
  <span slot="heading">Patient Information</span>
  <p>This content is visible immediately, even if JavaScript fails to load.</p>
  <div slot="footer">Last updated: 2026-02-16</div>
</hx-card>
```

**Key principle**: HELIX components enhance existing content rather than requiring JavaScript to render. This ensures:

- Content is indexable by search engines
- Users with JavaScript disabled can still access information
- Progressive enhancement for improved perceived performance
- WCAG 2.1 AA compliance in all scenarios

### Server-Side vs. Client-Side Rendering

| Aspect             | Rendered By   | When                                    |
| ------------------ | ------------- | --------------------------------------- |
| HTML structure     | Drupal/TWIG   | Server-side, during page render         |
| Component tag      | Drupal/TWIG   | Server-side (treated as HTML)           |
| Slot content       | Drupal/TWIG   | Server-side                             |
| Shadow DOM         | Browser/HELIX | Client-side, after JS loads             |
| Component styles   | Browser/HELIX | Client-side, encapsulated in Shadow DOM |
| Component behavior | Browser/HELIX | Client-side, event handlers attached    |

## Basic Component Usage in TWIG

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

Usage in a node template:

```twig
{# templates/node/node--article.html.twig #}
<article{{ attributes }}>
  {{ title_prefix }}
  <h1{{ title_attributes }}>{{ label }}</h1>
  {{ title_suffix }}

  <div{{ content_attributes }}>
    {{ content.body }}

    {% if content.field_cta_text %}
      <hx-button
        variant="primary"
        hx-size="lg"
        type="button"
      >
        {{ content.field_cta_text.0['#context'].value }}
      </hx-button>
    {% endif %}
  </div>
</article>
```

### Card with Multiple Slots

```twig
{# templates/node/node--patient-story.html.twig #}
<hx-card variant="featured" elevation="floating">
  {# Image slot #}
  {% if content.field_featured_image %}
    <div slot="image">
      {{ content.field_featured_image }}
    </div>
  {% endif %}

  {# Heading slot #}
  <span slot="heading">{{ label }}</span>

  {# Default slot: body content #}
  <div class="patient-story__body">
    {{ content.body }}
  </div>

  {# Footer slot #}
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

  {# Actions slot #}
  {% if content.field_read_more_link %}
    <div slot="actions">
      <hx-button variant="secondary" hx-size="md">
        Read Full Story
      </hx-button>
    </div>
  {% endif %}
</hx-card>
```

## Passing Attributes to Components

### String Attributes

String attributes map directly to component properties:

```twig
{# Standard string attribute #}
<hx-button variant="secondary">Click me</hx-button>

{# Dynamic from TWIG variable #}
<hx-button variant="{{ node.field_button_variant.value }}">
  {{ node.field_button_text.value }}
</hx-button>

{# With default fallback #}
<hx-button variant="{{ variant|default('primary') }}">
  Action
</hx-button>

{# Conditional variant #}
<hx-button variant="{% if is_featured %}primary{% else %}secondary{% endif %}">
  Submit
</hx-button>
```

### Boolean Attributes

Boolean attributes should be added/omitted based on conditions:

```twig
{# Correct: conditional presence #}
<hx-button
  variant="primary"
  {% if is_disabled %}disabled{% endif %}
  {% if is_required %}required{% endif %}
>
  Submit Form
</hx-button>

{# Incorrect: setting to string "false" #}
<hx-button disabled="false">Wrong</hx-button>

{# Correct alternative: using TWIG ternary #}
<hx-button {{ is_disabled ? 'disabled' : '' }}>
  Submit
</hx-button>
```

### Custom Attribute Names

HELIX components use `hx-` prefixed attributes to avoid conflicts with reserved HTML attributes:

```twig
{# hx-size (not size, which is reserved for input elements) #}
<hx-button hx-size="lg" variant="primary">Large Button</hx-button>

{# hx-href (not href, which creates routing ambiguity) #}
<hx-card hx-href="/patient/123" variant="default">
  <span slot="heading">Patient Record</span>
  Click anywhere on this card to navigate
</hx-card>
```

### Drupal Attributes Object

HELIX components work with Drupal's `attributes` object pattern:

```twig
{# Component template with attributes support #}
{# templates/components/custom-card.html.twig #}
<hx-card
  variant="{{ variant|default('default') }}"
  elevation="{{ elevation|default('flat') }}"
  {% if attributes %}{{ attributes }}{% endif %}
>
  <span slot="heading">{{ heading }}</span>
  {{ body }}
</hx-card>
```

Usage with Drupal's attribute system:

```twig
{# In your node template #}
{% set card_attributes = create_attribute() %}
{% set card_attributes = card_attributes.addClass('custom-class') %}
{% set card_attributes = card_attributes.setAttribute('data-patient-id', node.id) %}

<hx-card
  variant="featured"
  {{ card_attributes }}
>
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
</hx-card>
```

## Content Projection and Slots

### Understanding Slots in TWIG

Web component slots define insertion points for content. In TWIG, you project content into slots using the `slot` attribute on child elements.

### Default Slot

Content without a `slot` attribute goes to the default (unnamed) slot:

```twig
<hx-card variant="default">
  {# This content goes to the default slot #}
  <p>This is the main card body content.</p>
  <p>Multiple elements can project to the default slot.</p>
</hx-card>
```

### Named Slots

Named slots require the `slot="name"` attribute:

```twig
<hx-card variant="featured">
  {# Named slot: image #}
  <img slot="image" src="/path/to/image.jpg" alt="Patient photo">

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

### Slot Best Practices

1. **Use semantic wrappers for slots**:

```twig
{# Good: wrapper div for complex slot content #}
<hx-card>
  <div slot="footer">
    <span class="author">By Dr. Smith</span>
    <time datetime="2026-02-16">February 16, 2026</time>
  </div>
</hx-card>
```

2. **Conditional slot rendering**:

```twig
{# Only render slot if content exists #}
<hx-card>
  <span slot="heading">{{ title }}</span>

  {{ body }}

  {% if footer_content %}
    <div slot="footer">{{ footer_content }}</div>
  {% endif %}
</hx-card>
```

3. **Preserve render arrays in slots**:

```twig
{# Render Drupal field render arrays in slots #}
<hx-card>
  <div slot="image">
    {{ content.field_image }}
  </div>

  <span slot="heading">{{ label }}</span>

  {# Body field with full render array #}
  {{ content.body }}
</hx-card>
```

## Property vs. Attribute Passing

### HTML Attributes (Reflected)

Attributes are set as HTML attributes and reflected as component properties:

```twig
{# These set HTML attributes, which update component properties #}
<hx-button variant="primary" hx-size="lg" disabled>
  Submit
</hx-button>
```

Rendered HTML:

```html
<hx-button variant="primary" hx-size="lg" disabled> Submit </hx-button>
```

Component properties are synchronized:

- `component.variant === "primary"`
- `component.size === "lg"`
- `component.disabled === true`

### Complex Properties (JavaScript Required)

Some component properties accept objects or arrays. These cannot be set via HTML attributes in TWIG. Use Drupal Behaviors to set them with JavaScript:

```twig
{# templates/components/data-table.html.twig #}
<hx-data-table
  id="patient-table"
  data-drupal-columns="{{ columns|json_encode|escape }}"
>
  {# Fallback content for no-JS #}
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

JavaScript initialization via Drupal Behavior:

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxDataTable = {
    attach(context) {
      once('hx-data-table-init', 'hx-data-table', context).forEach((table) => {
        // Parse JSON from data attribute
        const columnsJson = table.getAttribute('data-drupal-columns');
        if (columnsJson) {
          try {
            table.columns = JSON.parse(columnsJson);
          } catch (e) {
            console.error('Failed to parse columns JSON', e);
          }
        }
      });
    },
  };
})(Drupal, once);
```

## TWIG Variables to Component Properties

### Direct Field Value Mapping

```twig
{# Access field value from node object #}
<hx-button variant="{{ node.field_button_style.value }}">
  {{ node.field_button_label.value }}
</hx-button>

{# Entity reference field #}
{% set author = node.field_author.entity %}
<hx-card>
  <span slot="heading">{{ author.label }}</span>
  <p>{{ author.field_bio.value }}</p>
</hx-card>
```

### Processed Field Values

```twig
{# Using content render array (processed) #}
<hx-card>
  <div slot="image">
    {{ content.field_image }}
  </div>
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
</hx-card>
```

### Field Value Transformations

```twig
{# Boolean field to component attribute #}
<hx-alert
  variant="{{ node.field_alert_type.value }}"
  {% if node.field_dismissible.value %}dismissible{% endif %}
>
  {{ content.field_alert_message }}
</hx-alert>

{# Taxonomy term to variant #}
{% set priority = node.field_priority.entity.name.value|lower %}
<hx-badge variant="{{ priority }}">
  {{ priority|capitalize }}
</hx-badge>

{# Date field formatting #}
<hx-card>
  <span slot="heading">{{ label }}</span>
  <time slot="footer" datetime="{{ node.created.value|date('c') }}">
    Published: {{ node.created.value|date('F j, Y') }}
  </time>
</hx-card>
```

### Multi-Value Fields

```twig
{# Loop through multi-value field #}
<div class="tags">
  {% for item in content.field_tags|field_value %}
    <hx-badge variant="secondary">
      {{ item.entity.label }}
    </hx-badge>
  {% endfor %}
</div>

{# Entity reference field - render as cards #}
{% for item in node.field_related_articles %}
  <hx-card variant="compact" elevation="raised">
    <span slot="heading">{{ item.entity.label }}</span>
    {{ item.entity.body.summary }}
  </hx-card>
{% endfor %}
```

## Drupal-Specific Patterns

### Content Type Templates

```twig
{# templates/node/node--article--full.html.twig #}
<article{{ attributes.addClass('article', 'article--full') }}>
  {{ title_prefix }}
  {{ title_suffix }}

  <hx-card variant="featured" elevation="floating">
    {# Featured image #}
    {% if content.field_featured_image|render|trim %}
      <div slot="image">
        {{ content.field_featured_image }}
      </div>
    {% endif %}

    {# Article title #}
    <h1 slot="heading"{{ title_attributes }}>{{ label }}</h1>

    {# Article metadata #}
    <div slot="footer" class="article__meta">
      <div class="article__author">
        {% if content.field_author|render|trim %}
          By {{ content.field_author }}
        {% else %}
          By {{ author_name }}
        {% endif %}
      </div>
      <time datetime="{{ node.created.value|date('c') }}">
        {{ node.created.value|date('F j, Y') }}
      </time>
      {% if content.field_read_time|render|trim %}
        <span class="article__read-time">
          {{ content.field_read_time }} min read
        </span>
      {% endif %}
    </div>

    {# Article body (default slot) #}
    <div class="article__body">
      {{ content.body }}
    </div>

    {# Call-to-action #}
    {% if content.field_cta_link|render|trim %}
      <div slot="actions">
        <hx-button
          variant="primary"
          hx-size="lg"
        >
          {{ content.field_cta_link.0['#title'] }}
        </hx-button>
      </div>
    {% endif %}
  </hx-card>

  {# Related content #}
  {% if content.field_related_articles|render|trim %}
    <aside class="article__related">
      <h2>Related Articles</h2>
      <div class="article__related-grid">
        {% for item in node.field_related_articles %}
          <hx-card
            variant="compact"
            elevation="raised"
            hx-href="{{ path('entity.node.canonical', {'node': item.target_id}) }}"
          >
            {% if item.entity.field_thumbnail %}
              <img
                slot="image"
                src="{{ file_url(item.entity.field_thumbnail.entity.uri.value) }}"
                alt="{{ item.entity.field_thumbnail.alt }}"
              >
            {% endif %}
            <span slot="heading">{{ item.entity.label }}</span>
            {{ item.entity.body.summary }}
          </hx-card>
        {% endfor %}
      </div>
    </aside>
  {% endif %}
</article>
```

### Views Templates

```twig
{# templates/views/views-view-unformatted--patient-list.html.twig #}
<div{{ attributes.addClass('patient-list') }}>
  {% for row in rows %}
    {% set row_content = row.content['#row'] %}

    <hx-card
      variant="default"
      elevation="raised"
      hx-href="{{ path('entity.node.canonical', {'node': row_content._entity.id}) }}"
    >
      {# Patient photo #}
      {% if row_content._entity.field_photo %}
        <img
          slot="image"
          src="{{ file_url(row_content._entity.field_photo.entity.uri.value) }}"
          alt="{{ row_content._entity.field_photo.alt }}"
        >
      {% endif %}

      {# Patient name #}
      <span slot="heading">{{ row_content._entity.label }}</span>

      {# Patient details #}
      <div class="patient__details">
        {% if row_content._entity.field_patient_id %}
          <div class="patient__id">
            <strong>ID:</strong>
            {{ row_content._entity.field_patient_id.value }}
          </div>
        {% endif %}

        {% if row_content._entity.field_department %}
          <div class="patient__department">
            <hx-badge variant="secondary">
              {{ row_content._entity.field_department.entity.name.value }}
            </hx-badge>
          </div>
        {% endif %}
      </div>

      {# Last visit date #}
      {% if row_content._entity.field_last_visit %}
        <time slot="footer" datetime="{{ row_content._entity.field_last_visit.value|date('c') }}">
          Last visit: {{ row_content._entity.field_last_visit.value|date('M j, Y') }}
        </time>
      {% endif %}

      {# Actions #}
      <div slot="actions">
        <hx-button variant="primary" hx-size="sm">
          View Record
        </hx-button>
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
      <div class="alert__content">
        {% if content.field_alert_icon|render|trim %}
          <span class="alert__icon">{{ content.field_alert_icon }}</span>
        {% endif %}
        <div class="alert__message">
          {{ content.field_alert_message }}
        </div>
      </div>
    </hx-alert>
  {% endblock %}
</div>
```

### Field Templates

```twig
{# templates/field/field--node--field-tags--article.html.twig #}
<div{{ attributes.addClass('field', 'field--tags') }}>
  {% if label %}
    <div class="field__label">{{ label }}</div>
  {% endif %}

  <div class="field__items">
    {% for item in items %}
      <hx-badge
        variant="secondary"
        hx-size="sm"
      >
        {{ item.content['#title'] }}
      </hx-badge>
    {% endfor %}
  </div>
</div>
```

## Form Integration

HELIX form components work with Drupal's Form API through native HTML form participation.

### Text Input Fields

```twig
{# Form element template override #}
{# templates/form/form-element--text.html.twig #}
<hx-text-input
  name="{{ name }}"
  label="{{ label }}"
  {% if required %}required{% endif %}
  {% if disabled %}disabled{% endif %}
  {% if errors %}error="{{ errors }}"{% endif %}
  value="{{ value|default('') }}"
  placeholder="{{ placeholder|default('') }}"
  type="{{ type|default('text') }}"
  {% if description %}help-text="{{ description }}"{% endif %}
>
</hx-text-input>
```

### Custom Form with HELIX Components

```twig
{# templates/form/contact-form.html.twig #}
<form{{ attributes }} method="post">
  {{ form_token }}

  <hx-text-input
    name="name"
    label="Full Name"
    required
    value="{{ form.name['#default_value']|default('') }}"
  ></hx-text-input>

  <hx-text-input
    name="email"
    label="Email Address"
    type="email"
    required
    value="{{ form.email['#default_value']|default('') }}"
  ></hx-text-input>

  <hx-textarea
    name="message"
    label="Message"
    required
    rows="6"
  >{{ form.message['#default_value']|default('') }}</hx-textarea>

  <hx-checkbox
    name="newsletter"
    {% if form.newsletter['#default_value'] %}checked{% endif %}
  >
    Subscribe to our newsletter
  </hx-checkbox>

  <div class="form-actions">
    <hx-button type="submit" variant="primary" hx-size="lg">
      Send Message
    </hx-button>
    <hx-button type="reset" variant="ghost">
      Clear Form
    </hx-button>
  </div>
</form>
```

### Form API Integration

```twig
{# Render entire Form API form with component wrappers #}
<form{{ attributes.addClass('contact-form') }}>
  {% for key, element in form|filter(v => v['#type'] is defined) %}
    {% if element['#type'] == 'textfield' %}
      <hx-text-input
        name="{{ key }}"
        label="{{ element['#title'] }}"
        {% if element['#required'] %}required{% endif %}
        value="{{ element['#default_value']|default('') }}"
        {% if element['#description'] %}help-text="{{ element['#description'] }}"{% endif %}
      ></hx-text-input>
    {% elseif element['#type'] == 'email' %}
      <hx-text-input
        name="{{ key }}"
        label="{{ element['#title'] }}"
        type="email"
        {% if element['#required'] %}required{% endif %}
        value="{{ element['#default_value']|default('') }}"
      ></hx-text-input>
    {% else %}
      {# Fallback to standard render #}
      {{ element }}
    {% endif %}
  {% endfor %}
</form>
```

## Complete Real-World Examples

### Example 1: Patient Record Card

```twig
{# templates/node/node--patient--card.html.twig #}
{#
/**
 * Available variables:
 * - node: The patient node entity
 * - content: Renderable array for the patient fields
 * - attributes: HTML attributes for the containing element
 */
#}

<hx-card
  variant="default"
  elevation="raised"
  hx-href="{{ url('entity.node.canonical', {'node': node.id}) }}"
  {{ attributes.addClass('patient-card') }}
>
  {# Patient photo #}
  {% if content.field_patient_photo|render|trim %}
    <div slot="image">
      {{ content.field_patient_photo }}
    </div>
  {% endif %}

  {# Patient name and ID #}
  <div slot="heading" class="patient-card__heading">
    <h3>{{ label }}</h3>
    {% if node.field_patient_id.value %}
      <span class="patient-card__id">ID: {{ node.field_patient_id.value }}</span>
    {% endif %}
  </div>

  {# Patient details (default slot) #}
  <div class="patient-card__details">
    {# Age and gender #}
    {% if node.field_date_of_birth.value or node.field_gender.value %}
      <div class="patient-card__demographics">
        {% if node.field_date_of_birth.value %}
          {% set age = "now"|date('Y') - node.field_date_of_birth.value|date('Y') %}
          <span>Age: {{ age }}</span>
        {% endif %}
        {% if node.field_gender.value %}
          <span>{{ node.field_gender.value|capitalize }}</span>
        {% endif %}
      </div>
    {% endif %}

    {# Department badge #}
    {% if node.field_department.entity %}
      <div class="patient-card__department">
        <hx-badge variant="secondary">
          {{ node.field_department.entity.name.value }}
        </hx-badge>
      </div>
    {% endif %}

    {# Primary diagnosis #}
    {% if content.field_primary_diagnosis|render|trim %}
      <div class="patient-card__diagnosis">
        <strong>Primary Diagnosis:</strong>
        {{ content.field_primary_diagnosis }}
      </div>
    {% endif %}

    {# Attending physician #}
    {% if node.field_attending_physician.entity %}
      <div class="patient-card__physician">
        <strong>Attending:</strong>
        {{ node.field_attending_physician.entity.label }}
      </div>
    {% endif %}
  </div>

  {# Last visit and status #}
  <div slot="footer" class="patient-card__footer">
    {% if node.field_last_visit.value %}
      <time datetime="{{ node.field_last_visit.value|date('c') }}">
        Last visit: {{ node.field_last_visit.value|date('M j, Y') }}
      </time>
    {% endif %}

    {% if node.field_status.value %}
      <hx-badge
        variant="{% if node.field_status.value == 'active' %}success{% else %}neutral{% endif %}"
      >
        {{ node.field_status.value|capitalize }}
      </hx-badge>
    {% endif %}
  </div>

  {# Action buttons #}
  <div slot="actions" class="patient-card__actions">
    <hx-button variant="primary" hx-size="sm">
      View Full Record
    </hx-button>
    <hx-button variant="ghost" hx-size="sm">
      Schedule Appointment
    </hx-button>
  </div>
</hx-card>
```

### Example 2: Alert Banner in page.html.twig

```twig
{# templates/page.html.twig #}
<!DOCTYPE html>
<html{{ html_attributes }}>
  <head>
    <head-placeholder token="{{ placeholder_token }}">
    <title>{{ head_title|safe_join(' | ') }}</title>
    <css-placeholder token="{{ placeholder_token }}">
    <js-placeholder token="{{ placeholder_token }}">
  </head>
  <body{{ attributes }}>
    <a href="#main-content" class="visually-hidden focusable skip-link">
      {{ 'Skip to main content'|t }}
    </a>
    {{ page_top }}

    {# Site-wide alert banner #}
    {% if page.alert_banner %}
      <div class="site-alert">
        <hx-alert
          variant="warning"
          dismissible
        >
          <div class="site-alert__content">
            {{ page.alert_banner }}
          </div>
        </hx-alert>
      </div>
    {% endif %}

    <div class="layout-container">
      <header role="banner">
        {{ page.header }}
      </header>

      <main role="main" id="main-content">
        <a id="main-content" tabindex="-1"></a>

        {# Breadcrumb #}
        {% if breadcrumb %}
          {{ breadcrumb }}
        {% endif %}

        {# Status messages #}
        {% if messages %}
          <div class="messages">
            {{ messages }}
          </div>
        {% endif %}

        {{ page.content }}
      </main>

      {% if page.sidebar_first %}
        <aside class="layout-sidebar-first" role="complementary">
          {{ page.sidebar_first }}
        </aside>
      {% endif %}

      <footer role="contentinfo">
        {{ page.footer }}
      </footer>
    </div>

    {{ page_bottom }}
    <js-bottom-placeholder token="{{ placeholder_token }}">
  </body>
</html>
```

### Example 3: Complex Form with Validation

```twig
{# templates/form/patient-intake-form.html.twig #}
<form{{ attributes.addClass('patient-intake-form') }} method="post">
  {{ form.form_build_id }}
  {{ form.form_token }}
  {{ form.form_id }}

  <hx-container max-width="md">
    <h1>Patient Intake Form</h1>

    {# Personal Information Section #}
    <fieldset>
      <legend>Personal Information</legend>

      <hx-text-input
        name="first_name"
        label="First Name"
        required
        value="{{ form.first_name['#default_value']|default('') }}"
        {% if form.first_name['#errors'] %}
          error="{{ form.first_name['#errors']|first }}"
        {% endif %}
      ></hx-text-input>

      <hx-text-input
        name="last_name"
        label="Last Name"
        required
        value="{{ form.last_name['#default_value']|default('') }}"
        {% if form.last_name['#errors'] %}
          error="{{ form.last_name['#errors']|first }}"
        {% endif %}
      ></hx-text-input>

      <hx-text-input
        name="date_of_birth"
        label="Date of Birth"
        type="date"
        required
        value="{{ form.date_of_birth['#default_value']|default('') }}"
      ></hx-text-input>

      <hx-radio-group
        name="gender"
        label="Gender"
        required
      >
        <hx-radio value="male" {% if form.gender['#default_value'] == 'male' %}checked{% endif %}>
          Male
        </hx-radio>
        <hx-radio value="female" {% if form.gender['#default_value'] == 'female' %}checked{% endif %}>
          Female
        </hx-radio>
        <hx-radio value="other" {% if form.gender['#default_value'] == 'other' %}checked{% endif %}>
          Other
        </hx-radio>
      </hx-radio-group>
    </fieldset>

    {# Contact Information Section #}
    <fieldset>
      <legend>Contact Information</legend>

      <hx-text-input
        name="phone"
        label="Phone Number"
        type="tel"
        required
        placeholder="(555) 555-5555"
        value="{{ form.phone['#default_value']|default('') }}"
        help-text="Include area code"
      ></hx-text-input>

      <hx-text-input
        name="email"
        label="Email Address"
        type="email"
        required
        value="{{ form.email['#default_value']|default('') }}"
      ></hx-text-input>

      <hx-textarea
        name="address"
        label="Street Address"
        required
        rows="3"
      >{{ form.address['#default_value']|default('') }}</hx-textarea>
    </fieldset>

    {# Emergency Contact Section #}
    <fieldset>
      <legend>Emergency Contact</legend>

      <hx-text-input
        name="emergency_contact_name"
        label="Contact Name"
        required
        value="{{ form.emergency_contact_name['#default_value']|default('') }}"
      ></hx-text-input>

      <hx-text-input
        name="emergency_contact_phone"
        label="Contact Phone"
        type="tel"
        required
        value="{{ form.emergency_contact_phone['#default_value']|default('') }}"
      ></hx-text-input>

      <hx-text-input
        name="emergency_contact_relationship"
        label="Relationship"
        required
        value="{{ form.emergency_contact_relationship['#default_value']|default('') }}"
      ></hx-text-input>
    </fieldset>

    {# Consent Section #}
    <fieldset>
      <legend>Consent and Acknowledgment</legend>

      <hx-checkbox
        name="consent_treatment"
        required
        {% if form.consent_treatment['#default_value'] %}checked{% endif %}
      >
        I consent to medical treatment
      </hx-checkbox>

      <hx-checkbox
        name="consent_privacy"
        required
        {% if form.consent_privacy['#default_value'] %}checked{% endif %}
      >
        I acknowledge the <a href="/privacy-policy" target="_blank">Privacy Policy</a>
      </hx-checkbox>

      <hx-checkbox
        name="newsletter"
        {% if form.newsletter['#default_value'] %}checked{% endif %}
      >
        Subscribe to health tips newsletter (optional)
      </hx-checkbox>
    </fieldset>

    {# Form Actions #}
    <div class="form-actions">
      <hx-button
        type="submit"
        variant="primary"
        hx-size="lg"
      >
        Submit Intake Form
      </hx-button>

      <hx-button
        type="button"
        variant="ghost"
        hx-size="lg"
      >
        Save as Draft
      </hx-button>
    </div>
  </hx-container>
</form>
```

## Best Practices

### 1. Always Provide Fallback Content

```twig
{# Good: content is accessible before JS loads #}
<hx-card variant="featured">
  <span slot="heading">Patient Information</span>
  <p>John Doe, Age 45</p>
  <p>Department: Cardiology</p>
</hx-card>

{# Bad: empty card until JS loads #}
<hx-card variant="featured" data-patient-id="123"></hx-card>
```

### 2. Use Semantic HTML in Slots

```twig
{# Good: semantic elements #}
<hx-card>
  <h2 slot="heading">{{ title }}</h2>
  <div>
    <p>{{ summary }}</p>
  </div>
  <time slot="footer" datetime="{{ date|date('c') }}">{{ date|date('F j, Y') }}</time>
</hx-card>

{# Bad: non-semantic markup #}
<hx-card>
  <span slot="heading">{{ title }}</span>
  <span>{{ summary }}</span>
  <span slot="footer">{{ date }}</span>
</hx-card>
```

### 3. Check Field Existence Before Rendering

```twig
{# Good: check if field exists and has content #}
{% if content.field_featured_image|render|trim %}
  <div slot="image">
    {{ content.field_featured_image }}
  </div>
{% endif %}

{# Bad: render even if empty #}
<div slot="image">
  {{ content.field_featured_image }}
</div>
```

### 4. Use Component-Specific Classes for Styling

```twig
{# Good: add custom classes to wrapper #}
<div class="patient-card-wrapper patient-card-wrapper--featured">
  <hx-card variant="featured" elevation="floating">
    {{ content }}
  </hx-card>
</div>

{# Style wrapper, not component internals #}
```

### 5. Preserve Drupal's Attribute System

```twig
{# Good: preserve Drupal attributes #}
<article{{ attributes.addClass('patient-node') }}>
  <hx-card variant="default">
    {{ content }}
  </hx-card>
</article>

{# Bad: discard Drupal attributes #}
<article class="patient-node">
  <hx-card variant="default">
    {{ content }}
  </hx-card>
</article>
```

### 6. Handle Empty States Gracefully

```twig
{# Good: provide meaningful fallback #}
<hx-card>
  <span slot="heading">{{ label }}</span>

  {% if content.body|render|trim %}
    {{ content.body }}
  {% else %}
    <p class="empty-state">No description available.</p>
  {% endif %}
</hx-card>
```

### 7. Use TWIG Filters for Data Transformation

```twig
{# Good: transform data in TWIG #}
<hx-badge variant="{{ node.field_priority.value|lower }}">
  {{ node.field_priority.value|upper }}
</hx-badge>

{# Date formatting #}
<time datetime="{{ node.created.value|date('c') }}">
  {{ node.created.value|date('F j, Y') }}
</time>
```

### 8. Keep Component Logic in JavaScript

```twig
{# Good: simple attribute passing in TWIG #}
<hx-data-table
  id="patient-table"
  data-source="/api/patients"
></hx-data-table>

{# Complex logic happens in Drupal Behavior JavaScript #}
```

### 9. Document Custom Template Variables

```twig
{# templates/node/node--patient--card.html.twig #}
{#
/**
 * Patient Card Template
 *
 * Available variables:
 * - node: The patient node entity
 * - content: Renderable array of patient fields
 * - attributes: HTML attributes for the outer element
 * - label: The patient's name
 * - url: The URL to the patient's full record
 *
 * Field Variables:
 * - content.field_patient_photo: Patient photograph
 * - content.field_patient_id: Unique patient identifier
 * - content.field_department: Department taxonomy reference
 * - content.field_last_visit: Date of most recent visit
 */
#}

<hx-card ...>
  {# Template implementation #}
</hx-card>
```

### 10. Optimize for Performance

```twig
{# Good: conditionally load heavy components #}
{% if show_advanced_chart %}
  <hx-chart-advanced
    data-patient-id="{{ node.id }}"
  ></hx-chart-advanced>
{% else %}
  <hx-chart-simple
    data-patient-id="{{ node.id }}"
  ></hx-chart-simple>
{% endif %}
```

## Debugging TWIG Templates with HELIX Components

### Enable TWIG Debugging

```php
// sites/default/services.yml
parameters:
  twig.config:
    debug: true
    auto_reload: true
    cache: false
```

### View Component Attributes in Browser

```twig
{# Add data attributes for debugging #}
<hx-card
  variant="featured"
  data-node-id="{{ node.id }}"
  data-template="{{ _self }}"
>
  {{ content }}
</hx-card>
```

Inspect in browser DevTools:

```html
<hx-card variant="featured" data-node-id="123" data-template="node--patient--card.html.twig">
  #shadow-root (open) ...
  <span slot="heading">John Doe</span>
  ...
</hx-card>
```

### Use TWIG dump() Function

```twig
{# Dump all available variables #}
{# {{ dump() }} #}

{# Dump specific variable #}
{# {{ dump(node.field_patient_id) }} #}

{# Dump in HTML comment (doesn't break layout) #}
{# <!--
{{ dump(content) }}
--> #}
```

## Migration Strategy

### Phase 1: Start with Leaf Components

Replace simple elements with HELIX components:

```twig
{# Before #}
<button class="btn btn-primary">Submit</button>

{# After #}
<hx-button variant="primary">Submit</hx-button>
```

### Phase 2: Composite Components

Replace complex patterns:

```twig
{# Before #}
<div class="card">
  <div class="card-header">{{ title }}</div>
  <div class="card-body">{{ body }}</div>
  <div class="card-footer">{{ footer }}</div>
</div>

{# After #}
<hx-card>
  <span slot="heading">{{ title }}</span>
  {{ body }}
  <div slot="footer">{{ footer }}</div>
</hx-card>
```

### Phase 3: Full Template Conversion

Convert entire node templates to use HELIX components exclusively.

## Additional Resources

- [Drupal TWIG Documentation](https://www.drupal.org/docs/theming-drupal/twig-in-drupal)
- [Drupal Template Naming Conventions](https://www.drupal.org/docs/theming-drupal/twig-in-drupal/twig-template-naming-conventions)
- [HELIX Component Library](/components/)
- [Drupal Behaviors Integration](/drupal-integration/behaviors/)
- [Asset Loading Strategies](/drupal-integration/installation/)

## Summary

HELIX web components integrate seamlessly with Drupal's TWIG templating system:

1. **Use components as HTML tags** in TWIG templates
2. **Pass attributes** using standard TWIG syntax
3. **Project content into slots** using the `slot` attribute
4. **Preserve progressive enhancement** by providing fallback content
5. **Leverage Drupal's render system** for field values and render arrays
6. **Combine with Drupal Behaviors** for advanced interactivity
7. **Follow best practices** for accessible, performant templates

HELIX components enhance Drupal's theming capabilities while maintaining full compatibility with Drupal's rendering pipeline and accessibility requirements.
