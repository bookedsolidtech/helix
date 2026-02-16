---
title: Property Binding in TWIG
description: Deep dive into binding component properties in Drupal TWIG templates with type coercion, boolean handling, complex data structures, and best practices
order: 9
---

Understanding how to correctly bind properties to HELIX web components in TWIG templates is critical for enterprise healthcare applications. This comprehensive guide covers the distinction between HTML attributes and JavaScript properties, type coercion behaviors, binding patterns, and Drupal-specific integration strategies.

## Properties vs. Attributes: The Foundation

Web components expose two distinct interfaces for receiving data: HTML attributes (strings only) and JavaScript properties (any type). Understanding this distinction is essential for correct TWIG integration.

### HTML Attributes

HTML attributes are **always strings**. They appear in the markup as name-value pairs and are visible in the DOM.

```html
<!-- Attributes are strings in HTML -->
<hx-button variant="primary" hx-size="lg" disabled> Submit Form </hx-button>
```

Attributes have these characteristics:

- **String-only**: All attribute values are strings, regardless of how they appear
- **Case-insensitive names**: HTML normalizes attribute names to lowercase
- **Visible in DOM**: Attributes appear in browser DevTools and HTML source
- **Limited data types**: Can only represent strings, not objects, arrays, or complex types

### JavaScript Properties

JavaScript properties are **real JavaScript values** with full type support. They exist on the component instance and are accessed via JavaScript.

```javascript
const button = document.querySelector('hx-button');
// Properties can be any JavaScript type
button.variant = 'primary'; // string
button.disabled = true; // boolean
button.size = 'lg'; // string
button.config = { theme: 'dark' }; // object
```

Properties have these characteristics:

- **Any JavaScript type**: strings, numbers, booleans, objects, arrays, functions
- **Case-sensitive names**: Properties use JavaScript naming conventions (camelCase)
- **Invisible in HTML**: Properties don't appear in markup (unless reflected)
- **Rich data structures**: Can represent complex objects and arrays

### Property-Attribute Reflection

HELIX components use Lit's `@property` decorator with `reflect: true` to synchronize certain properties back to attributes:

```typescript
// In hx-button.ts
@property({ type: String, reflect: true })
variant: 'primary' | 'secondary' | 'ghost' = 'primary';

@property({ type: Boolean, reflect: true })
disabled = false;
```

**Reflected properties**:

- When the property changes, the attribute updates automatically
- Enables CSS attribute selectors: `hx-button[variant="primary"]`
- Makes state visible in DevTools for debugging
- Maintains sync between HTML and JavaScript

**Non-reflected properties**:

- Changing the property does NOT update the attribute
- More efficient (no DOM mutation overhead)
- Used for internal state or complex types

### When to Use Attributes vs. Properties

| Use Case               | Method                                  | Example                                  |
| ---------------------- | --------------------------------------- | ---------------------------------------- |
| Static string values   | Attribute in TWIG                       | `variant="{{ node.field_style.value }}"` |
| Boolean states         | Attribute presence                      | `{% if disabled %}disabled{% endif %}`   |
| Numbers as strings     | Attribute                               | `max="100"`                              |
| Complex objects/arrays | JavaScript property via Drupal Behavior | `element.options = [{...}]`              |
| Dynamic updates        | JavaScript property                     | `element.value = newValue`               |

## Binding String Properties in TWIG

String properties are the most common and straightforward binding pattern.

### Basic String Binding

```twig
{# Direct string value #}
<hx-button variant="primary">
  Submit
</hx-button>

{# From TWIG variable #}
<hx-button variant="{{ button_variant }}">
  {{ button_label }}
</hx-button>

{# From Drupal field #}
<hx-button variant="{{ node.field_button_style.value }}">
  {{ node.field_button_text.value }}
</hx-button>
```

### String Property with Default Fallback

```twig
{# Use TWIG default filter for fallback values #}
<hx-button variant="{{ variant|default('primary') }}">
  {{ label|default('Submit') }}
</hx-button>

{# Field with default fallback #}
<hx-button variant="{{ node.field_variant.value|default('secondary') }}">
  {{ content.field_label }}
</hx-button>
```

### Conditional String Values

```twig
{# Ternary operator for conditional variant #}
<hx-button variant="{{ is_primary ? 'primary' : 'secondary' }}">
  {{ action_label }}
</hx-button>

{# If-else block for complex logic #}
<hx-button variant="{% if node.field_priority.value == 'high' %}primary{% elseif node.field_priority.value == 'medium' %}secondary{% else %}ghost{% endif %}">
  {{ button_text }}
</hx-button>

{# Map field value to component variant #}
{% set variant_map = {
  'important': 'primary',
  'normal': 'secondary',
  'optional': 'ghost'
} %}
<hx-button variant="{{ variant_map[node.field_importance.value]|default('secondary') }}">
  Take Action
</hx-button>
```

### Size Properties (Custom Attribute Names)

HELIX components use `hx-size` instead of `size` to avoid conflicts with native HTML `size` attribute:

```twig
{# Correct: use hx-size #}
<hx-button hx-size="lg" variant="primary">
  Large Button
</hx-button>

{# From field #}
<hx-button hx-size="{{ node.field_button_size.value|default('md') }}" variant="primary">
  {{ button_text }}
</hx-button>

{# Conditional size #}
<hx-button hx-size="{% if is_hero_section %}lg{% else %}md{% endif %}" variant="primary">
  Call to Action
</hx-button>
```

### Multi-Line String Values

```twig
{# Help text for form components #}
<hx-text-input
  name="patient_mrn"
  label="Medical Record Number"
  help-text="Enter the 7-digit MRN without spaces or dashes"
  required
>
</hx-text-input>

{# Long help text from field #}
<hx-text-input
  name="address"
  label="Street Address"
  help-text="{{ node.field_help_text.value }}"
>
</hx-text-input>
```

## Binding Boolean Properties in TWIG

Boolean properties control component state. In HTML, boolean attributes are handled by **presence** (truthy) or **absence** (falsy), not by string values.

### Correct Boolean Binding Patterns

```twig
{# ✅ CORRECT: Conditional presence #}
<hx-button
  variant="primary"
  {% if is_disabled %}disabled{% endif %}
  {% if is_required %}required{% endif %}
>
  Submit Form
</hx-button>

{# ✅ CORRECT: From boolean field #}
<hx-checkbox
  name="consent"
  label="I agree to the terms"
  {% if node.field_consent_required.value %}required{% endif %}
  {% if node.field_checked_default.value %}checked{% endif %}
>
</hx-checkbox>

{# ✅ CORRECT: Ternary operator #}
<hx-button
  variant="primary"
  {{ user.is_guest ? 'disabled' : '' }}
>
  Save Changes
</hx-button>
```

### Incorrect Boolean Binding (Common Mistakes)

```twig
{# ❌ WRONG: Setting disabled="false" #}
<hx-button disabled="false">
  Submit
</hx-button>
<!-- The presence of the attribute makes disabled=true, regardless of value! -->

{# ❌ WRONG: Setting boolean to string #}
<hx-button disabled="{{ is_disabled }}">
  Submit
</hx-button>
<!-- If is_disabled is false, this renders disabled="" which is STILL truthy -->

{# ❌ WRONG: Using "true" string #}
<hx-checkbox checked="true">
  Subscribe
</hx-checkbox>
<!-- This works accidentally, but is not the correct pattern -->
```

### Boolean Property Type Coercion

HTML boolean attributes follow these rules:

| Attribute State              | Resulting Property Value |
| ---------------------------- | ------------------------ |
| `disabled` (no value)        | `true`                   |
| `disabled=""` (empty string) | `true`                   |
| `disabled="disabled"`        | `true`                   |
| `disabled="false"`           | `true` (!)               |
| `disabled="true"`            | `true`                   |
| Attribute absent             | `false`                  |

**Critical insight**: The string `"false"` is a **truthy value** in HTML. Only the complete absence of the attribute results in `false`.

### Form Component Boolean Examples

```twig
{# hx-checkbox: checked and required #}
<hx-checkbox
  name="newsletter"
  label="Subscribe to updates"
  {% if user.preferences.newsletter %}checked{% endif %}
>
</hx-checkbox>

{# hx-text-input: required and disabled #}
<hx-text-input
  name="patient_name"
  label="Patient Name"
  value="{{ patient.name }}"
  {% if is_edit_mode %}required{% endif %}
  {% if is_locked %}disabled{% endif %}
>
</hx-text-input>

{# hx-switch: checked state #}
<hx-switch
  name="notifications"
  label="Enable notifications"
  {% if user.settings.notifications_enabled %}checked{% endif %}
>
</hx-switch>

{# hx-select: required and disabled #}
<hx-select
  name="department"
  label="Department"
  {% if is_required_field %}required{% endif %}
  {% if is_read_only %}disabled{% endif %}
>
  <option value="">Select a department</option>
  <option value="cardiology">Cardiology</option>
  <option value="neurology">Neurology</option>
</hx-select>
```

### Boolean Properties in Drupal Form API

```twig
{# Map Form API #required to component attribute #}
<hx-text-input
  name="{{ element['#name'] }}"
  label="{{ element['#title'] }}"
  value="{{ element['#default_value']|default('') }}"
  {% if element['#required'] %}required{% endif %}
  {% if element['#disabled'] %}disabled{% endif %}
>
</hx-text-input>

{# Checkbox with Form API states #}
<hx-checkbox
  name="{{ element['#name'] }}"
  {% if element['#default_value'] %}checked{% endif %}
  {% if element['#required'] %}required{% endif %}
  {% if element['#attributes'].disabled %}disabled{% endif %}
>
  {{ element['#title'] }}
</hx-checkbox>
```

## Binding Number Properties in TWIG

Number properties in HELIX components are typically passed as **string attributes** and converted internally via Lit's type system.

### Number Property Binding

```twig
{# Input type="number" with min/max constraints #}
<hx-text-input
  type="number"
  name="age"
  label="Patient Age"
  min="0"
  max="120"
  value="{{ patient.age|default('') }}"
  required
>
</hx-text-input>

{# Textarea with row count #}
<hx-textarea
  name="notes"
  label="Clinical Notes"
  rows="8"
  placeholder="Enter detailed notes here..."
>
  {{ node.field_clinical_notes.value }}
</hx-textarea>
```

### Number Type Coercion

Lit automatically converts string attributes to numbers when the property is defined with `type: Number`:

```typescript
// In component TypeScript
@property({ type: Number })
rows = 4;
```

TWIG binding:

```twig
{# These all resolve to number property rows = 8 #}
<hx-textarea rows="8"></hx-textarea>
<hx-textarea rows="{{ row_count }}"></hx-textarea>
<hx-textarea rows="{{ node.field_rows.value }}"></hx-textarea>
```

### Numeric String Validation

```twig
{# Ensure numeric field values are valid #}
{% set max_length = node.field_max_length.value|default(100) %}
<hx-text-input
  name="description"
  label="Description"
  maxlength="{{ max_length }}"
>
</hx-text-input>

{# With range validation #}
<hx-text-input
  type="number"
  name="heart_rate"
  label="Heart Rate (BPM)"
  min="{{ vital_signs_config.min_heart_rate|default(40) }}"
  max="{{ vital_signs_config.max_heart_rate|default(200) }}"
  value="{{ reading.heart_rate }}"
  required
>
</hx-text-input>
```

## Binding Object and Array Properties

Complex data structures (objects, arrays) **cannot be passed as HTML attributes**. They must be set via JavaScript after component initialization.

### The Problem: Objects Don't Serialize to Attributes

```twig
{# ❌ WRONG: Objects cannot be passed as attributes #}
<hx-data-table
  columns="{{ columns }}"
  data="{{ rows }}"
></hx-data-table>
<!-- This will stringify to "[object Object]" and fail -->
```

### Solution: Data Attributes + Drupal Behaviors

**Step 1**: Store JSON-encoded data in `data-` attributes:

```twig
{# templates/components/patient-table.html.twig #}
<hx-data-table
  id="patient-table"
  data-columns="{{ columns|json_encode|escape }}"
  data-rows="{{ rows|json_encode|escape }}"
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

**Step 2**: Parse and assign via Drupal Behavior:

```javascript
// mytheme/js/behaviors/hx-data-table-init.js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxDataTableInit = {
    attach(context) {
      once('hx-data-table-init', 'hx-data-table[data-columns]', context).forEach((table) => {
        try {
          // Parse JSON from data attributes
          const columnsJson = table.getAttribute('data-columns');
          const rowsJson = table.getAttribute('data-rows');

          if (columnsJson) {
            table.columns = JSON.parse(columnsJson);
          }

          if (rowsJson) {
            table.data = JSON.parse(rowsJson);
          }

          // Remove fallback table after hydration
          const fallbackTable = table.querySelector('table');
          if (fallbackTable) {
            fallbackTable.remove();
          }
        } catch (error) {
          console.error('Failed to initialize hx-data-table:', error);
        }
      });
    },
  };
})(Drupal, once);
```

### Configuration Objects

```twig
{# Chart component with configuration object #}
<hx-chart
  id="vital-signs-chart"
  data-config="{{ chart_config|json_encode|escape }}"
  data-series="{{ vital_signs_data|json_encode|escape }}"
>
  {# Fallback: static image or table #}
  <img src="{{ fallback_chart_url }}" alt="Vital signs chart">
</hx-chart>
```

Drupal Behavior:

```javascript
Drupal.behaviors.hxChartInit = {
  attach(context) {
    once('hx-chart-init', 'hx-chart[data-config]', context).forEach((chart) => {
      const configJson = chart.getAttribute('data-config');
      const seriesJson = chart.getAttribute('data-series');

      if (configJson) {
        chart.config = JSON.parse(configJson);
      }

      if (seriesJson) {
        chart.series = JSON.parse(seriesJson);
      }
    });
  },
};
```

### Array Properties

```twig
{# Multi-select with array of selected values #}
<hx-multi-select
  id="patient-conditions"
  name="conditions"
  label="Current Conditions"
  data-selected="{{ selected_conditions|json_encode|escape }}"
  data-options="{{ all_conditions|json_encode|escape }}"
>
</hx-multi-select>
```

JavaScript initialization:

```javascript
Drupal.behaviors.hxMultiSelectInit = {
  attach(context) {
    once('hx-multi-select-init', 'hx-multi-select[data-options]', context).forEach((select) => {
      const optionsJson = select.getAttribute('data-options');
      const selectedJson = select.getAttribute('data-selected');

      if (optionsJson) {
        select.options = JSON.parse(optionsJson);
      }

      if (selectedJson) {
        select.selectedValues = JSON.parse(selectedJson);
      }
    });
  },
};
```

## Type Coercion and Edge Cases

Understanding how browsers and Lit convert attribute strings to property types prevents subtle bugs.

### String to Boolean Coercion

```typescript
// Lit property definition
@property({ type: Boolean, reflect: true })
disabled = false;
```

Attribute string → Property value mapping:

| TWIG Attribute        | HTML Result                | Property Value | Why                    |
| --------------------- | -------------------------- | -------------- | ---------------------- |
| `disabled`            | `<el disabled>`            | `true`         | Attribute presence     |
| `disabled=""`         | `<el disabled="">`         | `true`         | Empty string is truthy |
| `disabled="false"`    | `<el disabled="false">`    | `true`         | Any string is truthy   |
| `disabled="disabled"` | `<el disabled="disabled">` | `true`         | Standard HTML pattern  |
| (no attribute)        | `<el>`                     | `false`        | Attribute absent       |

### String to Number Coercion

```typescript
// Lit property definition
@property({ type: Number })
maxlength = 100;
```

Coercion behavior:

| TWIG Attribute                | Property Value | Notes                |
| ----------------------------- | -------------- | -------------------- |
| `maxlength="50"`              | `50`           | Valid number         |
| `maxlength="{{ field_max }}"` | `(parsed)`     | Drupal field value   |
| `maxlength=""`                | `0`            | Empty string → 0     |
| `maxlength="abc"`             | `NaN`          | Invalid number → NaN |
| (no attribute)                | `100`          | Default value        |

### Null vs. Empty String

```twig
{# Empty string is NOT the same as null/undefined #}
<hx-text-input
  name="middle_name"
  label="Middle Name"
  value=""
>
</hx-text-input>
<!-- value property is "" (empty string), not null -->

{# Omitting the attribute results in component default #}
<hx-text-input
  name="middle_name"
  label="Middle Name"
>
</hx-text-input>
<!-- value property is component default (typically "") -->
```

### Attribute Sanitization

TWIG automatically escapes HTML in attribute values:

```twig
{# TWIG auto-escapes potentially dangerous characters #}
<hx-text-input
  label="{{ user_input }}"
  placeholder="{{ unsafe_value }}"
>
</hx-text-input>
<!-- TWIG converts ", ', <, >, & to HTML entities -->

{# Explicit escaping #}
<hx-text-input
  label="{{ user_input|escape }}"
>
</hx-text-input>

{# Force raw (DANGEROUS - only use for trusted content) #}
<hx-text-input
  label="{{ trusted_content|raw }}"
>
</hx-text-input>
```

## ADR-001: Property Patterns for Atomic Components

HELIX follows ADR-001 architectural decision: **atomic components favor properties for configuration, composition for content**.

### Property-Based Configuration

Atomic components (buttons, inputs, badges) receive configuration via **properties**:

```twig
{# hx-button: configuration via properties #}
<hx-button
  variant="primary"
  hx-size="lg"
  type="submit"
  disabled
>
  Submit Form
</hx-button>

{# hx-badge: minimal configuration #}
<hx-badge variant="success" hx-size="sm">
  Active
</hx-badge>

{# hx-text-input: form field properties #}
<hx-text-input
  name="email"
  label="Email Address"
  type="email"
  required
  placeholder="you@example.com"
  help-text="We'll never share your email"
>
</hx-text-input>
```

### Composition-Based Content

Components use **slots** for content projection, not properties:

```twig
{# ✅ CORRECT: Content via default slot #}
<hx-button variant="primary">
  Save Patient Record
</hx-button>

{# ❌ WRONG: Don't pass content as property #}
<hx-button variant="primary" label="Save Patient Record"></hx-button>
<!-- Anti-pattern: reduces flexibility, breaks internationalization -->

{# ✅ CORRECT: Rich content in slots #}
<hx-card variant="featured">
  <h2 slot="heading">Patient Information</h2>
  <div class="patient-details">
    <p><strong>Name:</strong> {{ patient.name }}</p>
    <p><strong>MRN:</strong> {{ patient.mrn }}</p>
    <p><strong>DOB:</strong> {{ patient.dob|date('Y-m-d') }}</p>
  </div>
  <div slot="footer">
    <time datetime="{{ patient.last_visit|date('c') }}">
      Last visit: {{ patient.last_visit|date('F j, Y') }}
    </time>
  </div>
</hx-card>
```

### Why Slots Over Properties

**Slots provide**:

- **HTML support**: Rich markup, not just strings
- **Render arrays**: Full Drupal rendering pipeline
- **Internationalization**: Content managed in Drupal's translation system
- **SEO**: Content visible to search engines before JS loads
- **Accessibility**: Screen readers access real DOM content
- **Flexibility**: Consumers control structure and styling

**Properties provide**:

- **Type safety**: Boolean, number, enum validation
- **Reflection**: Sync to attributes for CSS selectors
- **API surface**: Programmatic control via JavaScript
- **Default values**: Component-defined fallbacks

### Atomic Component Property Checklist

HELIX atomic components should:

1. Accept **configuration** via properties (variant, size, disabled, required)
2. Accept **content** via slots (labels, body text, nested elements)
3. Reflect **state properties** to attributes (disabled, checked, invalid)
4. Provide **form integration** via ElementInternals (name, value, validation)
5. Emit **custom events** for user interaction (hx-change, hx-input, hx-click)

## Drupal Field-to-Property Mapping

### Text Fields

```twig
{# Plain text field #}
<hx-text-input
  name="title"
  label="Article Title"
  value="{{ node.title.value }}"
  required
>
</hx-text-input>

{# Formatted text field (use slot for rich content) #}
<hx-prose>
  {{ content.body }}
</hx-prose>
```

### Boolean Fields

```twig
{# Boolean field → component boolean attribute #}
<hx-checkbox
  name="featured"
  label="Featured Article"
  {% if node.field_featured.value %}checked{% endif %}
>
</hx-checkbox>

<hx-switch
  name="published"
  label="Published"
  {% if node.status.value %}checked{% endif %}
>
</hx-switch>
```

### List Fields (Allowed Values)

```twig
{# List field → select component #}
<hx-select
  name="priority"
  label="Priority"
  value="{{ node.field_priority.value }}"
  required
>
  <option value="">Select priority</option>
  {% for key, label in field_priority_options %}
    <option value="{{ key }}" {% if node.field_priority.value == key %}selected{% endif %}>
      {{ label }}
    </option>
  {% endfor %}
</hx-select>

{# List field → radio group #}
<hx-radio-group
  name="department"
  label="Department"
  value="{{ node.field_department.value }}"
  required
>
  {% for key, label in field_department_options %}
    <hx-radio value="{{ key }}" {% if node.field_department.value == key %}checked{% endif %}>
      {{ label }}
    </hx-radio>
  {% endfor %}
</hx-radio-group>
```

### Number Fields

```twig
{# Integer field #}
<hx-text-input
  type="number"
  name="patient_age"
  label="Patient Age"
  value="{{ node.field_age.value }}"
  min="{{ field_age_settings.min }}"
  max="{{ field_age_settings.max }}"
  required
>
</hx-text-input>

{# Decimal field #}
<hx-text-input
  type="number"
  name="dosage"
  label="Dosage (mg)"
  value="{{ node.field_dosage.value }}"
  step="0.1"
  required
>
</hx-text-input>
```

### Date Fields

```twig
{# Date field #}
<hx-text-input
  type="date"
  name="appointment_date"
  label="Appointment Date"
  value="{{ node.field_appointment_date.value|date('Y-m-d') }}"
  required
>
</hx-text-input>

{# DateTime field #}
<hx-text-input
  type="datetime-local"
  name="visit_time"
  label="Visit Time"
  value="{{ node.field_visit_time.value|date('Y-m-d\\TH:i') }}"
  required
>
</hx-text-input>
```

### Entity Reference Fields

```twig
{# Entity reference → select #}
<hx-select
  name="author"
  label="Author"
  value="{{ node.field_author.target_id }}"
  required
>
  <option value="">Select author</option>
  {% for author in authors %}
    <option
      value="{{ author.id }}"
      {% if node.field_author.target_id == author.id %}selected{% endif %}
    >
      {{ author.label }}
    </option>
  {% endfor %}
</hx-select>

{# Multi-value entity reference → checkboxes #}
<fieldset>
  <legend>Related Conditions</legend>
  {% for condition in available_conditions %}
    <hx-checkbox
      name="conditions[]"
      value="{{ condition.id }}"
      {% if condition.id in selected_condition_ids %}checked{% endif %}
    >
      {{ condition.label }}
    </hx-checkbox>
  {% endfor %}
</fieldset>
```

### Taxonomy Term References

```twig
{# Taxonomy term → badge variant #}
{% set term = node.field_category.entity %}
<hx-badge variant="{{ term.field_badge_variant.value|default('secondary') }}">
  {{ term.name.value }}
</hx-badge>

{# Taxonomy vocabulary → select #}
<hx-select
  name="tags"
  label="Tags"
  value="{{ node.field_tags.0.target_id }}"
>
  <option value="">Select a tag</option>
  {% for term in vocabulary_terms %}
    <option value="{{ term.tid.value }}">
      {{ term.name.value }}
    </option>
  {% endfor %}
</hx-select>
```

## Best Practices

### 1. Always Validate Field Existence

```twig
{# ✅ CORRECT: Check field before accessing #}
{% if node.field_variant.value %}
  <hx-button variant="{{ node.field_variant.value }}">
    {{ button_label }}
  </hx-button>
{% else %}
  <hx-button variant="primary">
    {{ button_label }}
  </hx-button>
{% endif %}

{# ✅ CORRECT: Use default filter #}
<hx-button variant="{{ node.field_variant.value|default('primary') }}">
  {{ button_label }}
</hx-button>
```

### 2. Use Semantic Property Names

```twig
{# ✅ CORRECT: Use component's documented property names #}
<hx-text-input
  name="email"
  label="Email Address"
  type="email"
  required
>
</hx-text-input>

{# ❌ WRONG: Don't use non-standard attributes #}
<hx-text-input
  field-name="email"
  field-label="Email Address"
  input-type="email"
>
</hx-text-input>
```

### 3. Provide Default Values

```twig
{# ✅ CORRECT: Always provide defaults for optional properties #}
<hx-button
  variant="{{ variant|default('primary') }}"
  hx-size="{{ size|default('md') }}"
>
  {{ label|default('Submit') }}
</hx-button>

{# ✅ CORRECT: Component default fallback #}
<hx-text-input
  value="{{ node.field_value.value|default('') }}"
  placeholder="{{ placeholder|default('Enter value...') }}"
>
</hx-text-input>
```

### 4. Escape User-Generated Content

```twig
{# ✅ CORRECT: Escape untrusted content #}
<hx-text-input
  label="{{ user_input|escape }}"
  placeholder="{{ user_placeholder|escape }}"
>
</hx-text-input>

{# ✅ CORRECT: Auto-escaping in attribute context #}
<hx-button aria-label="{{ node.field_accessible_label.value }}">
  {{ button_text }}
</hx-button>
```

### 5. Document Complex Property Patterns

```twig
{# templates/node/node--patient--form.html.twig #}
{#
/**
 * Patient Intake Form Template
 *
 * Property Mappings:
 * - field_patient_first_name → hx-text-input[name="first_name"]
 * - field_patient_last_name → hx-text-input[name="last_name"]
 * - field_patient_dob → hx-text-input[type="date"][name="dob"]
 * - field_patient_gender → hx-radio-group[name="gender"]
 * - field_consent_treatment → hx-checkbox[name="consent"]
 */
#}

<form method="post" action="{{ form_action }}">
  <hx-text-input
    name="first_name"
    label="First Name"
    value="{{ node.field_patient_first_name.value|default('') }}"
    required
  >
  </hx-text-input>
  {# ... more fields ... #}
</form>
```

### 6. Use Type-Appropriate Components

```twig
{# ✅ CORRECT: Boolean field → checkbox/switch #}
<hx-checkbox
  name="subscribe"
  {% if node.field_subscribe.value %}checked{% endif %}
>
  Subscribe to newsletter
</hx-checkbox>

{# ❌ WRONG: Boolean field → text input #}
<hx-text-input
  name="subscribe"
  value="{{ node.field_subscribe.value ? 'yes' : 'no' }}"
>
</hx-text-input>
```

### 7. Maintain Progressive Enhancement

```twig
{# ✅ CORRECT: Meaningful content before JS loads #}
<hx-card variant="featured">
  <h2 slot="heading">{{ patient.name }}</h2>
  <div>
    <p><strong>MRN:</strong> {{ patient.mrn }}</p>
    <p><strong>Department:</strong> {{ patient.department }}</p>
  </div>
</hx-card>

{# ❌ WRONG: Empty until JavaScript runs #}
<hx-card variant="featured" data-patient-id="{{ patient.id }}"></hx-card>
```

### 8. Prefer Attributes for Simple Values

```twig
{# ✅ CORRECT: Static configuration via attributes #}
<hx-button variant="primary" hx-size="lg" type="submit">
  Submit
</hx-button>

{# ❌ WRONG: Unnecessary JavaScript for static values #}
<hx-button id="submit-btn"></hx-button>
<script>
  document.getElementById('submit-btn').variant = 'primary';
  document.getElementById('submit-btn').size = 'lg';
</script>
```

### 9. Keep Property Logic in TWIG

```twig
{# ✅ CORRECT: Derive properties in TWIG #}
{% set is_urgent = node.field_priority.value == 'urgent' %}
{% set button_variant = is_urgent ? 'primary' : 'secondary' %}
<hx-button variant="{{ button_variant }}">
  {{ is_urgent ? 'Urgent Action' : 'Standard Action' }}
</hx-button>

{# ❌ WRONG: Don't defer simple logic to JavaScript #}
<hx-button id="action-btn" data-priority="{{ node.field_priority.value }}">
  Action
</hx-button>
<script>
  const btn = document.getElementById('action-btn');
  btn.variant = btn.dataset.priority === 'urgent' ? 'primary' : 'secondary';
</script>
```

### 10. Test All Property Combinations

```twig
{# Test matrix for form component states #}

{# Default state #}
<hx-text-input name="test1" label="Default">
</hx-text-input>

{# Required #}
<hx-text-input name="test2" label="Required" required>
</hx-text-input>

{# Disabled #}
<hx-text-input name="test3" label="Disabled" disabled value="Cannot edit">
</hx-text-input>

{# With error #}
<hx-text-input name="test4" label="With Error" error="This field is invalid" required>
</hx-text-input>

{# With help text #}
<hx-text-input name="test5" label="With Help" help-text="Guidance text here">
</hx-text-input>

{# All states combined #}
<hx-text-input
  name="test6"
  label="Required with Help"
  required
  help-text="Please provide accurate information"
  value="Pre-filled value"
>
</hx-text-input>
```

## Summary

Property binding in HELIX web components for Drupal TWIG templates follows these core principles:

1. **String properties**: Pass directly as HTML attributes using TWIG interpolation
2. **Boolean properties**: Control via conditional attribute **presence**, never string values
3. **Number properties**: Pass as string attributes; Lit converts to numbers automatically
4. **Object/array properties**: Store as JSON in `data-` attributes, parse via Drupal Behaviors
5. **ADR-001 compliance**: Configuration via properties, content via slots
6. **Type coercion**: Understand HTML attribute → JavaScript property conversion rules
7. **Field mapping**: Map Drupal field types to appropriate component properties
8. **Progressive enhancement**: Always provide fallback content before JavaScript loads
9. **Validation**: Check field existence, provide defaults, escape user input
10. **Documentation**: Comment complex property mapping patterns in templates

Correct property binding ensures HELIX components integrate seamlessly with Drupal's rendering pipeline, maintain WCAG 2.1 AA accessibility, and provide a robust foundation for enterprise healthcare applications.

## Additional Resources

- [TWIG Integration Fundamentals](/drupal-integration/twig/fundamentals/)
- [Drupal Behaviors Integration](/drupal-integration/behaviors/)
- [Form API Integration](/drupal-integration/forms/form-api/)
- [HELIX Component API Reference](/component-library/overview/)
- [Lit Property System](https://lit.dev/docs/components/properties/)
