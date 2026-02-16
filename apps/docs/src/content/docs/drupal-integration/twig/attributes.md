---
title: TWIG Attributes Object
description: Master Drupal's attributes object pattern to seamlessly integrate HELIX web components with dynamic classes, data attributes, and conditional rendering
order: 10
---

Drupal's attributes object is a powerful abstraction that manages HTML attributes in TWIG templates. This comprehensive guide demonstrates how to leverage the attributes object with HELIX web components to build flexible, maintainable Drupal themes while preserving Drupal's attribute system for classes, IDs, data attributes, and ARIA properties.

## Understanding Drupal's Attributes Object

The attributes object in Drupal TWIG templates is a special object that contains HTML attributes for a given element. Drupal automatically populates this object with contextual classes, IDs, data attributes, and ARIA properties based on the content type, view mode, field configuration, and other factors.

### Why the Attributes Object Matters

```twig
{# Without attributes object - loses Drupal's contextual classes #}
<article class="patient-node">
  <h1>{{ label }}</h1>
  {{ content }}
</article>

{# With attributes object - preserves all Drupal functionality #}
<article{{ attributes.addClass('patient-node') }}>
  <h1{{ title_attributes }}>{{ label }}</h1>
  {{ content }}
</article>
```

The second example preserves:

- Contextual editing classes (`.contextual-region`)
- RDF attributes for semantic web
- Microdata and schema.org markup
- JavaScript behavior attachment points
- CSS hooks for theming
- ARIA attributes for accessibility
- Custom module-added attributes

### Attributes in Different Template Types

| Template Type          | Available Attributes Objects                                             |
| ---------------------- | ------------------------------------------------------------------------ |
| `node.html.twig`       | `attributes`, `title_attributes`, `content_attributes`                   |
| `field.html.twig`      | `attributes`, `title_attributes`, `item.attributes`                      |
| `block.html.twig`      | `attributes`, `title_attributes`                                         |
| `views-view.html.twig` | `attributes`, `title_attributes`, `header_attributes`, `rows_attributes` |
| `page.html.twig`       | `html_attributes`, `body_attributes`                                     |
| `paragraph.html.twig`  | `attributes`, `content_attributes`                                       |

## Creating and Manipulating Attributes

### The create_attribute() Function

Create a new attributes object for custom elements:

```twig
{# Create a new attributes object #}
{% set card_attributes = create_attribute() %}

{# Chain methods to build attributes #}
{% set card_attributes = card_attributes
  .addClass('custom-card')
  .addClass('custom-card--featured')
  .setAttribute('data-entity-id', node.id)
  .setAttribute('data-entity-type', 'node')
%}

{# Apply to HELIX component #}
<hx-card
  variant="featured"
  {{ card_attributes }}
>
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
</hx-card>
```

Rendered output:

```html
<hx-card
  variant="featured"
  class="custom-card custom-card--featured"
  data-entity-id="123"
  data-entity-type="node"
>
  <span slot="heading">Patient Information</span>
  <p>Medical details...</p>
</hx-card>
```

### Cloning Existing Attributes

Clone and modify Drupal's existing attributes:

```twig
{# Clone node attributes for use on component #}
{% set component_attributes = attributes.clone() %}
{% set component_attributes = component_attributes
  .addClass('enhanced-with-helix')
  .setAttribute('data-component-version', '2.0')
%}

<article{{ attributes }}>
  <hx-card {{ component_attributes }}>
    <span slot="heading">{{ label }}</span>
    {{ content }}
  </hx-card>
</article>
```

This preserves Drupal's original attributes on the `<article>` wrapper while creating a modified version for the HELIX component.

## addClass() Method

The `addClass()` method adds one or more CSS classes to an attributes object.

### Basic Usage

```twig
{# Add single class #}
<hx-card {{ attributes.addClass('patient-card') }}>
  {{ content }}
</hx-card>

{# Add multiple classes #}
<hx-card {{ attributes.addClass('patient-card', 'patient-card--featured') }}>
  {{ content }}
</hx-card>

{# Add classes from array #}
{% set card_classes = ['patient-card', 'patient-card--elevated'] %}
<hx-card {{ attributes.addClass(card_classes) }}>
  {{ content }}
</hx-card>
```

### Conditional Classes

```twig
{# Add class based on condition #}
<hx-card {{
  attributes.addClass(
    'patient-card',
    node.field_featured.value ? 'patient-card--featured' : 'patient-card--standard'
  )
}}>
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
</hx-card>

{# Multiple conditional classes #}
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

### BEM Class Naming Pattern

```twig
{# templates/node/node--patient--card.html.twig #}
{% set bem_block = 'patient-card' %}
{% set bem_modifiers = [] %}

{# Build BEM modifier classes #}
{% if node.field_priority.value == 'high' %}
  {% set bem_modifiers = bem_modifiers|merge(['patient-card--priority-high']) %}
{% endif %}
{% if node.field_status.value == 'active' %}
  {% set bem_modifiers = bem_modifiers|merge(['patient-card--active']) %}
{% endif %}

{# Apply BEM classes #}
<hx-card {{
  attributes.addClass([bem_block]|merge(bem_modifiers))
}}>
  <span slot="heading">{{ label }}</span>
  <div class="patient-card__body">
    {{ content.body }}
  </div>
</hx-card>
```

### View Mode Classes

```twig
{# Add view mode as class modifier #}
{% set view_mode_class = 'patient-card--' ~ view_mode|clean_class %}

<hx-card {{ attributes.addClass('patient-card', view_mode_class) }}>
  <span slot="heading">{{ label }}</span>
  {{ content }}
</hx-card>
```

Examples:

- `view_mode: 'full'` → `patient-card--full`
- `view_mode: 'teaser'` → `patient-card--teaser`
- `view_mode: 'search_result'` → `patient-card--search-result`

## setAttribute() Method

The `setAttribute()` method adds custom HTML attributes, commonly used for data attributes, ARIA labels, and component configuration.

### Data Attributes

```twig
{# Add single data attribute #}
<hx-card {{
  attributes.setAttribute('data-entity-id', node.id)
}}>
  {{ content }}
</hx-card>

{# Add multiple data attributes #}
<hx-card {{
  attributes
    .setAttribute('data-entity-id', node.id)
    .setAttribute('data-entity-type', 'node')
    .setAttribute('data-bundle', node.bundle)
    .setAttribute('data-view-mode', view_mode)
}}>
  {{ content }}
</hx-card>
```

Rendered output:

```html
<hx-card data-entity-id="123" data-entity-type="node" data-bundle="patient" data-view-mode="full">
  ...
</hx-card>
```

### ARIA Attributes

```twig
{# Add ARIA label for accessibility #}
<hx-card {{
  attributes
    .setAttribute('aria-label', 'Patient record for ' ~ label)
    .setAttribute('role', 'article')
}}>
  <span slot="heading">{{ label }}</span>
  {{ content }}
</hx-card>

{# ARIA live region for dynamic content #}
<hx-alert {{
  attributes
    .setAttribute('role', 'alert')
    .setAttribute('aria-live', 'polite')
    .setAttribute('aria-atomic', 'true')
}}>
  {{ message }}
</hx-alert>
```

### Component-Specific Attributes

```twig
{# Pass Drupal data to JavaScript via data attributes #}
<hx-data-table {{
  attributes
    .setAttribute('data-drupal-view', 'patient_list')
    .setAttribute('data-drupal-display', 'page_1')
    .setAttribute('data-drupal-ajax-path', '/views/ajax')
}}>
  {# Fallback table content #}
  {{ content }}
</hx-data-table>
```

### Conditional Attributes

```twig
{# Add attribute only if condition is met #}
<hx-card {{
  attributes
    .addClass('patient-card')
    .setAttribute('data-entity-id', node.id)
}}
{% if node.field_clickable.value %}
  {{
    attributes.setAttribute('hx-href', path('entity.node.canonical', {'node': node.id}))
  }}
{% endif %}
>
  <span slot="heading">{{ label }}</span>
  {{ content }}
</hx-card>
```

### JSON Data Attributes

Pass complex data structures to JavaScript:

```twig
{# Encode array as JSON for JavaScript consumption #}
{% set patient_data = {
  id: node.id,
  name: label,
  department: node.field_department.entity.name.value,
  last_visit: node.field_last_visit.value|date('Y-m-d')
} %}

<hx-card {{
  attributes.setAttribute('data-patient', patient_data|json_encode)
}}>
  <span slot="heading">{{ label }}</span>
  {{ content }}
</hx-card>
```

JavaScript access:

```javascript
(function (Drupal, once) {
  Drupal.behaviors.hxPatientCard = {
    attach(context) {
      once('hx-patient-card', 'hx-card[data-patient]', context).forEach((card) => {
        const patientData = JSON.parse(card.getAttribute('data-patient'));
        console.log('Patient:', patientData.name, 'Last visit:', patientData.last_visit);
      });
    },
  };
})(Drupal, once);
```

## removeAttribute() Method

Remove specific attributes from the attributes object.

### Basic Removal

```twig
{# Remove an attribute that Drupal added #}
<hx-card {{ attributes.removeAttribute('id') }}>
  {{ content }}
</hx-card>

{# Remove multiple attributes #}
<hx-card {{
  attributes
    .removeAttribute('id')
    .removeAttribute('data-history-node-id')
}}>
  {{ content }}
</hx-card>
```

### Removing and Replacing Attributes

```twig
{# Remove Drupal's generated ID and add custom ID #}
<hx-card {{
  attributes
    .removeAttribute('id')
    .setAttribute('id', 'patient-card-' ~ node.id)
}}>
  {{ content }}
</hx-card>
```

### Use Case: Avoiding ID Conflicts

When using the same node in multiple places on a page:

```twig
{# templates/node/node--patient--card.html.twig #}

{# Preserve Drupal attributes on wrapper #}
<article{{ attributes }}>
  {# Remove ID from inner component to avoid duplicates #}
  <hx-card {{
    create_attribute()
      .addClass(attributes.class)
      .setAttribute('data-entity-id', node.id)
  }}>
    <span slot="heading">{{ label }}</span>
    {{ content }}
  </hx-card>
</article>
```

## removeClass() Method

Remove one or more CSS classes from the attributes object.

### Basic Removal

```twig
{# Remove a single class #}
<hx-card {{ attributes.removeClass('node') }}>
  {{ content }}
</hx-card>

{# Remove multiple classes #}
<hx-card {{ attributes.removeClass('node', 'node--type-patient') }}>
  {{ content }}
</hx-card>

{# Remove classes from array #}
{% set classes_to_remove = ['node', 'node--promoted'] %}
<hx-card {{ attributes.removeClass(classes_to_remove) }}>
  {{ content }}
</hx-card>
```

### Removing and Replacing Classes

```twig
{# Replace Drupal's default classes with custom classes #}
<hx-card {{
  attributes
    .removeClass('node', 'node--type-patient', 'node--view-mode-full')
    .addClass('patient-record', 'patient-record--expanded')
}}>
  {{ content }}
</hx-card>
```

### Conditional Class Removal

```twig
{# Remove specific classes in certain view modes #}
{% if view_mode == 'teaser' %}
  {% set attributes = attributes.removeClass('node--promoted') %}
{% endif %}

<hx-card {{ attributes.addClass('patient-card') }}>
  {{ content }}
</hx-card>
```

## Spreading Attributes to Components

### Direct Spreading

Apply Drupal attributes directly to HELIX components:

```twig
{# templates/node/node--patient--card.html.twig #}

{# Spread all Drupal attributes to the component #}
<hx-card
  variant="default"
  elevation="raised"
  {{ attributes }}
>
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
</hx-card>
```

This preserves all Drupal-generated classes, IDs, and data attributes on the web component.

### Wrapped Pattern

Keep attributes on semantic wrapper, component inside:

```twig
{# Recommended: preserve semantic article element #}
<article{{ attributes.addClass('patient-node') }}>
  {{ title_prefix }}
  {{ title_suffix }}

  <hx-card variant="featured" elevation="raised">
    <h1 slot="heading"{{ title_attributes }}>{{ label }}</h1>
    <div{{ content_attributes }}>
      {{ content.body }}
    </div>
  </hx-card>
</article>
```

This pattern:

- Preserves semantic HTML (`<article>`)
- Maintains Drupal's attribute system
- Keeps contextual links functional
- Supports module-added attributes

### Hybrid Pattern

Spread some attributes to wrapper, create new attributes for component:

```twig
{# templates/node/node--patient--card.html.twig #}

{# Create component-specific attributes #}
{% set card_attributes = create_attribute()
  .addClass('patient-card')
  .addClass('patient-card--' ~ view_mode|clean_class)
  .setAttribute('data-entity-id', node.id)
  .setAttribute('data-entity-bundle', node.bundle)
%}

{# Drupal attributes on wrapper #}
<article{{ attributes.addClass('patient-wrapper') }}>
  {{ title_prefix }}
  {{ title_suffix }}

  {# Component-specific attributes on hx-card #}
  <hx-card
    variant="featured"
    {{ card_attributes }}
  >
    <span slot="heading">{{ label }}</span>
    {{ content }}
  </hx-card>
</article>
```

## Conditional Attributes

Build attributes dynamically based on field values and content state.

### Variant Selection Based on Field Value

```twig
{# Map field value to component variant #}
{% set alert_variant_map = {
  'info': 'info',
  'warning': 'warning',
  'error': 'danger',
  'success': 'success'
} %}

{% set alert_variant = alert_variant_map[node.field_alert_type.value] ?? 'info' %}

<hx-alert
  variant="{{ alert_variant }}"
  {{ attributes.addClass('system-alert') }}
>
  {{ content.field_alert_message }}
</hx-alert>
```

### Boolean Field Conditionals

```twig
{# Add attributes based on boolean fields #}
<hx-card
  variant="default"
  elevation="{{ node.field_elevated.value ? 'floating' : 'flat' }}"
  {% if node.field_clickable.value %}
    hx-href="{{ path('entity.node.canonical', {'node': node.id}) }}"
  {% endif %}
  {{ attributes }}
>
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
</hx-card>
```

### Taxonomy-Based Attributes

```twig
{# Use taxonomy term for component configuration #}
{% if node.field_priority.entity %}
  {% set priority = node.field_priority.entity.name.value|lower %}
  {% set priority_class = 'patient-card--priority-' ~ priority|clean_class %}
  {% set priority_variant = priority == 'high' ? 'danger' : 'info' %}
{% else %}
  {% set priority_class = 'patient-card--priority-default' %}
  {% set priority_variant = 'info' %}
{% endif %}

<hx-card {{
  attributes.addClass('patient-card', priority_class)
}}>
  <span slot="heading">{{ label }}</span>

  <hx-badge variant="{{ priority_variant }}">
    Priority: {{ priority|capitalize }}
  </hx-badge>

  {{ content.body }}
</hx-card>
```

### Entity Reference Field Attributes

```twig
{# Add department information as data attributes #}
{% if node.field_department.entity %}
  {% set dept_attributes = create_attribute()
    .setAttribute('data-department-id', node.field_department.target_id)
    .setAttribute('data-department-name', node.field_department.entity.name.value)
  %}
{% else %}
  {% set dept_attributes = create_attribute() %}
{% endif %}

<hx-card {{ attributes.merge(dept_attributes) }}>
  <span slot="heading">{{ label }}</span>
  {{ content }}
</hx-card>
```

## Merging Attributes

Combine multiple attributes objects into one.

### merge() Method

```twig
{# Create multiple attribute sets #}
{% set base_attributes = create_attribute()
  .addClass('patient-card')
  .setAttribute('data-entity-id', node.id)
%}

{% set conditional_attributes = create_attribute() %}
{% if node.field_featured.value %}
  {% set conditional_attributes = conditional_attributes.addClass('patient-card--featured') %}
{% endif %}

{# Merge attribute sets #}
<hx-card {{ base_attributes.merge(conditional_attributes) }}>
  <span slot="heading">{{ label }}</span>
  {{ content }}
</hx-card>
```

### Merging Drupal and Custom Attributes

```twig
{# Start with Drupal's attributes #}
{% set component_attributes = attributes.clone() %}

{# Add component-specific attributes #}
{% set component_attributes = component_attributes
  .addClass('patient-card')
  .setAttribute('data-component-type', 'card')
%}

{# Merge additional conditional attributes #}
{% set role_attributes = create_attribute() %}
{% if node.field_accessible_label.value %}
  {% set role_attributes = role_attributes
    .setAttribute('role', 'article')
    .setAttribute('aria-label', node.field_accessible_label.value)
  %}
{% endif %}

<hx-card {{ component_attributes.merge(role_attributes) }}>
  {{ content }}
</hx-card>
```

### Merging Arrays of Classes

```twig
{# Combine class arrays #}
{% set base_classes = ['patient-card'] %}
{% set view_mode_classes = ['patient-card--' ~ view_mode|clean_class] %}
{% set state_classes = [] %}

{% if node.isPromoted() %}
  {% set state_classes = state_classes|merge(['patient-card--promoted']) %}
{% endif %}
{% if node.isSticky() %}
  {% set state_classes = state_classes|merge(['patient-card--sticky']) %}
{% endif %}

{% set all_classes = base_classes|merge(view_mode_classes)|merge(state_classes) %}

<hx-card {{ attributes.addClass(all_classes) }}>
  {{ content }}
</hx-card>
```

## Real-World Examples

### Example 1: Patient List View

```twig
{# templates/views/views-view-unformatted--patient-list.html.twig #}
<div{{ attributes.addClass('patient-list') }}>
  {% for row in rows %}
    {% set row_content = row.content['#row'] %}
    {% set patient_node = row_content._entity %}

    {# Build card attributes based on patient data #}
    {% set card_attributes = create_attribute()
      .addClass('patient-list__item')
      .setAttribute('data-patient-id', patient_node.field_patient_id.value)
      .setAttribute('data-entity-id', patient_node.id)
    %}

    {# Add conditional classes #}
    {% if patient_node.field_status.value == 'active' %}
      {% set card_attributes = card_attributes.addClass('patient-list__item--active') %}
    {% endif %}

    {% if patient_node.field_urgent.value %}
      {% set card_attributes = card_attributes
        .addClass('patient-list__item--urgent')
        .setAttribute('aria-label', 'Urgent patient: ' ~ patient_node.label)
      %}
    {% endif %}

    <hx-card
      variant="default"
      elevation="raised"
      hx-href="{{ path('entity.node.canonical', {'node': patient_node.id}) }}"
      {{ card_attributes }}
    >
      {# Patient photo #}
      {% if patient_node.field_photo.entity %}
        <img
          slot="image"
          src="{{ file_url(patient_node.field_photo.entity.uri.value) }}"
          alt="{{ patient_node.field_photo.alt }}"
        >
      {% endif %}

      {# Patient name and ID #}
      <div slot="heading">
        <h3>{{ patient_node.label }}</h3>
        {% if patient_node.field_patient_id.value %}
          <span class="patient-list__patient-id">
            ID: {{ patient_node.field_patient_id.value }}
          </span>
        {% endif %}
      </div>

      {# Patient details #}
      <div class="patient-list__details">
        {% if patient_node.field_department.entity %}
          <hx-badge variant="secondary">
            {{ patient_node.field_department.entity.name.value }}
          </hx-badge>
        {% endif %}

        {% if patient_node.field_last_visit.value %}
          <time datetime="{{ patient_node.field_last_visit.value|date('c') }}">
            Last visit: {{ patient_node.field_last_visit.value|date('M j, Y') }}
          </time>
        {% endif %}
      </div>

      {# Status badge in footer #}
      {% if patient_node.field_status.value %}
        <div slot="footer">
          <hx-badge
            variant="{% if patient_node.field_status.value == 'active' %}success{% else %}neutral{% endif %}"
          >
            {{ patient_node.field_status.value|capitalize }}
          </hx-badge>
        </div>
      {% endif %}

      {# Action buttons #}
      <div slot="actions">
        <hx-button variant="primary" hx-size="sm">
          View Record
        </hx-button>
        {% if patient_node.field_allow_messaging.value %}
          <hx-button variant="ghost" hx-size="sm">
            Send Message
          </hx-button>
        {% endif %}
      </div>
    </hx-card>
  {% endfor %}
</div>
```

### Example 2: Contextual Alert Block

```twig
{# templates/block/block--system-alerts.html.twig #}

{# Create block-level attributes #}
{% set block_classes = ['block-system-alerts'] %}
{% if content.field_alert_position.value %}
  {% set block_classes = block_classes|merge(['block-system-alerts--' ~ content.field_alert_position.value]) %}
{% endif %}

<div{{ attributes.addClass(block_classes) }}>
  {{ title_prefix }}
  {% if label %}
    <h2{{ title_attributes.addClass('visually-hidden') }}>{{ label }}</h2>
  {% endif %}
  {{ title_suffix }}

  {% block content %}
    {# Map Drupal alert type to HELIX variant #}
    {% set alert_type = content.field_alert_type.0['#markup']|default('info') %}
    {% set variant_map = {
      'information': 'info',
      'warning': 'warning',
      'error': 'danger',
      'success': 'success'
    } %}
    {% set alert_variant = variant_map[alert_type] ?? 'info' %}

    {# Build alert attributes #}
    {% set alert_attributes = create_attribute()
      .addClass('block-system-alerts__alert')
      .setAttribute('role', 'alert')
      .setAttribute('aria-live', 'polite')
      .setAttribute('data-alert-id', content.field_alert_id.0['#markup'])
    %}

    {# Add dismissible attribute if enabled #}
    {% if content.field_dismissible.0['#markup'] == '1' %}
      {% set alert_attributes = alert_attributes
        .addClass('block-system-alerts__alert--dismissible')
        .setAttribute('data-dismissible', 'true')
      %}
    {% endif %}

    <hx-alert
      variant="{{ alert_variant }}"
      {% if content.field_dismissible.0['#markup'] == '1' %}dismissible{% endif %}
      {{ alert_attributes }}
    >
      <div class="block-system-alerts__content">
        {% if content.field_alert_icon|render|trim %}
          <span class="block-system-alerts__icon">
            {{ content.field_alert_icon }}
          </span>
        {% endif %}

        <div class="block-system-alerts__message">
          {% if content.field_alert_title|render|trim %}
            <h3 class="block-system-alerts__title">
              {{ content.field_alert_title }}
            </h3>
          {% endif %}

          {{ content.field_alert_message }}

          {% if content.field_alert_link|render|trim %}
            <div class="block-system-alerts__link">
              <hx-button variant="ghost" hx-size="sm">
                {{ content.field_alert_link }}
              </hx-button>
            </div>
          {% endif %}
        </div>
      </div>
    </hx-alert>
  {% endblock %}
</div>
```

### Example 3: Multi-View Mode Patient Card

```twig
{# templates/node/node--patient--card.html.twig #}
{#
/**
 * Patient card template with view mode support
 *
 * View modes:
 * - full: Complete patient record
 * - teaser: Summary card
 * - compact: Minimal card for lists
 */
#}

{# Base classes #}
{% set card_base_classes = [
  'patient-card',
  'patient-card--' ~ view_mode|clean_class,
  'patient-card--bundle-' ~ node.bundle|clean_class
] %}

{# State-based classes #}
{% set card_state_classes = [] %}
{% if node.isPromoted() %}
  {% set card_state_classes = card_state_classes|merge(['patient-card--promoted']) %}
{% endif %}
{% if node.isSticky() %}
  {% set card_state_classes = card_state_classes|merge(['patient-card--sticky']) %}
{% endif %}

{# Field-based classes #}
{% if node.field_status.value == 'active' %}
  {% set card_state_classes = card_state_classes|merge(['patient-card--active']) %}
{% elseif node.field_status.value == 'inactive' %}
  {% set card_state_classes = card_state_classes|merge(['patient-card--inactive']) %}
{% endif %}

{# Priority classes #}
{% if node.field_priority.entity %}
  {% set priority_slug = node.field_priority.entity.name.value|lower|clean_class %}
  {% set card_state_classes = card_state_classes|merge(['patient-card--priority-' ~ priority_slug]) %}
{% endif %}

{# Merge all classes #}
{% set all_card_classes = card_base_classes|merge(card_state_classes) %}

{# Build card attributes #}
{% set card_attributes = create_attribute()
  .addClass(all_card_classes)
  .setAttribute('data-entity-id', node.id)
  .setAttribute('data-entity-bundle', node.bundle)
  .setAttribute('data-view-mode', view_mode)
%}

{# Add patient-specific data attributes #}
{% if node.field_patient_id.value %}
  {% set card_attributes = card_attributes.setAttribute('data-patient-id', node.field_patient_id.value) %}
{% endif %}

{# Add accessibility attributes #}
{% set card_attributes = card_attributes
  .setAttribute('role', 'article')
  .setAttribute('aria-labelledby', 'patient-heading-' ~ node.id)
%}

{# Determine variant based on view mode #}
{% set card_variant_map = {
  'full': 'featured',
  'teaser': 'default',
  'compact': 'compact'
} %}
{% set card_variant = card_variant_map[view_mode] ?? 'default' %}

{# Determine elevation based on view mode #}
{% set card_elevation_map = {
  'full': 'floating',
  'teaser': 'raised',
  'compact': 'flat'
} %}
{% set card_elevation = card_elevation_map[view_mode] ?? 'raised' %}

{# Wrapper with Drupal attributes #}
<article{{ attributes.addClass('patient-wrapper') }}>
  {{ title_prefix }}
  {{ title_suffix }}

  {# HELIX card with custom attributes #}
  <hx-card
    variant="{{ card_variant }}"
    elevation="{{ card_elevation }}"
    {% if view_mode != 'full' %}
      hx-href="{{ url('entity.node.canonical', {'node': node.id}) }}"
    {% endif %}
    {{ card_attributes }}
  >
    {# Patient photo (only in full and teaser modes) #}
    {% if view_mode in ['full', 'teaser'] and content.field_patient_photo|render|trim %}
      <div slot="image">
        {{ content.field_patient_photo }}
      </div>
    {% endif %}

    {# Heading #}
    <div slot="heading" id="patient-heading-{{ node.id }}">
      {% if view_mode == 'full' %}
        <h1{{ title_attributes }}>{{ label }}</h1>
      {% else %}
        <h3>{{ label }}</h3>
      {% endif %}

      {% if node.field_patient_id.value %}
        <span class="patient-card__id">ID: {{ node.field_patient_id.value }}</span>
      {% endif %}
    </div>

    {# Body content (variable by view mode) #}
    <div class="patient-card__body">
      {% if view_mode == 'full' %}
        {{ content.body }}
        {{ content.field_medical_history }}
      {% elseif view_mode == 'teaser' %}
        {{ content.body|field_value|first.summary }}
      {% else %}
        {# Compact mode: just department and status #}
        {% if node.field_department.entity %}
          <hx-badge variant="secondary">
            {{ node.field_department.entity.name.value }}
          </hx-badge>
        {% endif %}
      {% endif %}
    </div>

    {# Footer #}
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

    {# Actions (view mode dependent) #}
    {% if view_mode == 'full' %}
      <div slot="actions" class="patient-card__actions">
        <hx-button variant="primary" hx-size="lg">
          Edit Record
        </hx-button>
        <hx-button variant="secondary" hx-size="lg">
          Print Record
        </hx-button>
        <hx-button variant="ghost" hx-size="lg">
          Schedule Appointment
        </hx-button>
      </div>
    {% elseif view_mode == 'teaser' %}
      <div slot="actions">
        <hx-button variant="primary" hx-size="md">
          View Full Record
        </hx-button>
      </div>
    {% endif %}
  </hx-card>
</article>
```

### Example 4: Paragraph with Dynamic Attributes

```twig
{# templates/paragraph/paragraph--featured-content.html.twig #}

{# Build paragraph wrapper attributes #}
{% set wrapper_classes = [
  'paragraph',
  'paragraph--type-' ~ paragraph.bundle|clean_class,
  'paragraph--view-mode-' ~ view_mode|clean_class
] %}

{# Add layout classes from paragraph field #}
{% if content.field_layout_width|render|trim %}
  {% set layout_width = content.field_layout_width.0['#markup'] %}
  {% set wrapper_classes = wrapper_classes|merge(['paragraph--width-' ~ layout_width]) %}
{% endif %}

{# Add background color class #}
{% if content.field_background_color|render|trim %}
  {% set bg_color = content.field_background_color.0['#markup']|clean_class %}
  {% set wrapper_classes = wrapper_classes|merge(['paragraph--bg-' ~ bg_color]) %}
{% endif %}

<div{{ attributes.addClass(wrapper_classes) }}>
  {# Build card attributes #}
  {% set card_attributes = create_attribute()
    .addClass('paragraph__card')
    .setAttribute('data-paragraph-id', paragraph.id.value)
    .setAttribute('data-paragraph-type', paragraph.bundle)
  %}

  {# Add animation attributes if enabled #}
  {% if content.field_enable_animation.0['#markup'] == '1' %}
    {% set card_attributes = card_attributes
      .setAttribute('data-aos', 'fade-up')
      .setAttribute('data-aos-duration', '600')
    %}
  {% endif %}

  <hx-card
    variant="{{ content.field_card_variant.0['#markup']|default('default') }}"
    elevation="{{ content.field_elevation.0['#markup']|default('raised') }}"
    {{ card_attributes }}
  >
    {# Featured image #}
    {% if content.field_featured_image|render|trim %}
      <div slot="image">
        {{ content.field_featured_image }}
      </div>
    {% endif %}

    {# Heading #}
    {% if content.field_heading|render|trim %}
      <div slot="heading">
        {{ content.field_heading }}
      </div>
    {% endif %}

    {# Body content #}
    {{ content.field_body }}

    {# Call to action #}
    {% if content.field_cta_link|render|trim %}
      <div slot="actions">
        <hx-button
          variant="{{ content.field_cta_style.0['#markup']|default('primary') }}"
          hx-size="lg"
        >
          {{ content.field_cta_link.0['#title'] }}
        </hx-button>
      </div>
    {% endif %}
  </hx-card>
</div>
```

## Best Practices

### 1. Preserve Drupal Attributes on Wrappers

```twig
{# Good: Drupal attributes on semantic wrapper #}
<article{{ attributes }}>
  <hx-card variant="featured">
    {{ content }}
  </hx-card>
</article>

{# Avoid: losing Drupal's contextual attributes #}
<hx-card variant="featured">
  {{ content }}
</hx-card>
```

### 2. Clone Attributes Before Modification

```twig
{# Good: clone before modifying #}
{% set component_attrs = attributes.clone().addClass('patient-card') %}
<article{{ attributes }}>
  <hx-card {{ component_attrs }}>{{ content }}</hx-card>
</article>

{# Bad: modifying original attributes #}
<article{{ attributes }}>
  <hx-card {{ attributes.addClass('patient-card') }}>{{ content }}</hx-card>
</article>
```

### 3. Use create_attribute() for New Elements

```twig
{# Good: create new attributes object #}
{% set card_attrs = create_attribute()
  .addClass('custom-card')
  .setAttribute('data-id', node.id)
%}
<hx-card {{ card_attrs }}>{{ content }}</hx-card>

{# Avoid: manually building attribute strings #}
<hx-card class="custom-card" data-id="{{ node.id }}">{{ content }}</hx-card>
```

### 4. Chain Methods for Readability

```twig
{# Good: chained method calls #}
{% set attrs = create_attribute()
  .addClass('patient-card')
  .addClass('patient-card--featured')
  .setAttribute('data-entity-id', node.id)
  .setAttribute('role', 'article')
%}

{# Avoid: repeated assignment #}
{% set attrs = create_attribute() %}
{% set attrs = attrs.addClass('patient-card') %}
{% set attrs = attrs.addClass('patient-card--featured') %}
{% set attrs = attrs.setAttribute('data-entity-id', node.id) %}
{% set attrs = attrs.setAttribute('role', 'article') %}
```

### 5. Build Conditional Classes with Arrays

```twig
{# Good: build array of classes #}
{% set classes = ['patient-card'] %}
{% if featured %}
  {% set classes = classes|merge(['patient-card--featured']) %}
{% endif %}
{% if urgent %}
  {% set classes = classes|merge(['patient-card--urgent']) %}
{% endif %}

<hx-card {{ attributes.addClass(classes) }}>
  {{ content }}
</hx-card>
```

### 6. Use Data Attributes for JavaScript

```twig
{# Good: data attributes for Drupal Behaviors #}
<hx-card {{
  attributes
    .setAttribute('data-entity-id', node.id)
    .setAttribute('data-entity-type', 'node')
    .setAttribute('data-bundle', node.bundle)
}}>
  {{ content }}
</hx-card>
```

### 7. Add ARIA Attributes for Accessibility

```twig
{# Good: ARIA labels for screen readers #}
<hx-card {{
  attributes
    .setAttribute('role', 'article')
    .setAttribute('aria-labelledby', 'heading-' ~ node.id)
}}>
  <h2 slot="heading" id="heading-{{ node.id }}">{{ label }}</h2>
  {{ content }}
</hx-card>
```

### 8. Remove Conflicting Attributes

```twig
{# Good: remove ID to avoid conflicts #}
{% set card_attrs = attributes.clone()
  .removeAttribute('id')
  .setAttribute('data-original-id', attributes.id)
%}

<hx-card {{ card_attrs }}>{{ content }}</hx-card>
```

### 9. Document Complex Attribute Logic

```twig
{#
/**
 * Build card attributes based on:
 * - View mode (full, teaser, compact)
 * - Patient status (active, inactive)
 * - Priority level (high, normal, low)
 */
#}
{% set card_classes = ['patient-card'] %}
{# Add view mode class #}
{% set card_classes = card_classes|merge(['patient-card--' ~ view_mode]) %}
{# Add status class #}
{% if node.field_status.value %}
  {% set card_classes = card_classes|merge(['patient-card--' ~ node.field_status.value]) %}
{% endif %}

<hx-card {{ attributes.addClass(card_classes) }}>
  {{ content }}
</hx-card>
```

### 10. Test Attributes in Multiple Contexts

Always test templates with:

- Different view modes
- Various field combinations (empty, single, multiple values)
- Contextual editing enabled
- Modules that add attributes (RDF, Microdata, Layout Builder)

## Summary

Drupal's attributes object is essential for integrating HELIX web components with Drupal's rendering system:

1. **Use `create_attribute()`** to build custom attributes for HELIX components
2. **Use `addClass()`** to add CSS classes dynamically
3. **Use `setAttribute()`** for data attributes, ARIA labels, and component configuration
4. **Use `removeAttribute()`** and `removeClass()`\*\* to clean up Drupal-generated attributes
5. **Clone and merge** attributes objects to combine Drupal and custom attributes
6. **Spread attributes** to HELIX components while preserving semantic HTML wrappers
7. **Build conditional classes** based on field values, view modes, and content state
8. **Document complex logic** in template comments for maintainability

The attributes object pattern ensures HELIX components work seamlessly with Drupal's theming system, module ecosystem, and accessibility requirements while maintaining clean, maintainable TWIG templates.
