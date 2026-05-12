---
title: Property Binding in Twig
description: How to bind Drupal content to HELiX component properties — the property vs attribute distinction, scalar binding, dynamic field values, conditional properties, and NULL/empty handling.
sidebar:
  order: 2
---

HELiX web components expose two distinct interfaces for receiving data: HTML attributes (strings only) and JavaScript properties (any type). Twig templates interact with the attribute interface. Understanding the distinction, type coercion rules, and the correct patterns for each property type prevents the most common integration bugs.

---

## Properties vs. Attributes: The Foundation

### HTML Attributes Are Always Strings

When Drupal renders a Twig template, every attribute value in the resulting HTML is a string — even when the original Twig variable was a number or boolean.

```html
<!-- Drupal output: all values are strings in HTML -->
<hx-button variant="primary" hx-size="lg" disabled></hx-button>
```

Attributes have these characteristics:

- **String-only** — even `min="0"` is the string `"0"`, not the number `0`
- **Case-insensitive names** — HTML normalizes attribute names to lowercase
- **Visible in DOM** — attributes appear in DevTools and the page source
- **No complex types** — cannot represent objects, arrays, or functions

### JavaScript Properties Are Full JavaScript Values

Component properties are accessed and set in JavaScript on the element instance:

```javascript
const button = document.querySelector('hx-button');
button.variant = 'primary'; // string
button.disabled = true; // boolean
button.size = 'lg'; // string (internal property name may differ from attribute)

// Real object-typed properties exist on components like hx-data-table:
const table = document.querySelector('hx-data-table');
table.columns = [{ key: 'name', label: 'Name' }]; // array — impossible via plain HTML attribute
```

### Property-Attribute Reflection

HELiX components use Lit's `@property({ reflect: true })` decorator so that certain properties stay synchronized with their HTML attributes. When you set `variant="primary"` in Twig, Lit reads that attribute on upgrade and sets the `variant` property. If the JavaScript then changes `component.variant = 'secondary'`, the attribute in the DOM updates too.

Non-reflected properties may still be **initialized** from an HTML attribute on upgrade — they simply don't write subsequent property changes back to the DOM. They are not "JavaScript-only" in the sense of being unreachable from Twig; the asymmetry only matters when the script mutates the value after upgrade.

### When to Use Attributes vs. Properties

| Use Case                    | Method                         | Example                                  |
| --------------------------- | ------------------------------ | ---------------------------------------- |
| Static string configuration | Attribute in Twig              | `variant="primary"`                      |
| Dynamic string from field   | Attribute in Twig              | `variant="{{ node.field_style.value }}"` |
| Boolean state               | Attribute presence/absence     | `{% if disabled %}disabled{% endif %}`   |
| Numbers passed as strings   | Attribute in Twig              | `rows="8"`                               |
| Objects or arrays           | JavaScript via Drupal Behavior | `element.columns = [...]`                |

---

## Binding String Properties

### Basic String Binding

```twig
{# Static value #}
<hx-button variant="primary">Submit</hx-button>

{# From a Twig variable #}
<hx-button variant="{{ button_variant }}">{{ button_label }}</hx-button>

{# From a Drupal entity field #}
<hx-button variant="{{ node.field_button_style.value }}">
  {{ node.field_button_text.value }}
</hx-button>
```

### Default Fallback with the `default` Filter

Always provide a fallback for optional fields. Without one, a null field value renders as an empty attribute (`variant=""`), which may not match any component variant and falls back to the component's own default — but the empty attribute is still in the DOM and can interfere with CSS selectors.

```twig
{# Use the default filter to guarantee a valid value #}
<hx-button variant="{{ variant|default('primary') }}">
  {{ label|default('Submit') }}
</hx-button>

{# Field with fallback #}
<hx-button variant="{{ node.field_variant.value|default('secondary') }}">
  {{ content.field_label }}
</hx-button>
```

### Conditional String Values

```twig
{# Ternary operator #}
<hx-button variant="{{ is_primary ? 'primary' : 'secondary' }}">
  {{ action_label }}
</hx-button>

{# If-elseif-else block #}
<hx-button
  variant="{% if node.field_priority.value == 'high' %}primary
           {% elseif node.field_priority.value == 'medium' %}secondary
           {% else %}ghost{% endif %}"
>
  {{ button_text }}
</hx-button>

{# Map field value to component variant using a Twig hash #}
{% set variant_map = {
  'important': 'primary',
  'normal': 'secondary',
  'optional': 'ghost'
} %}
<hx-button variant="{{ variant_map[node.field_importance.value]|default('secondary') }}">
  Take Action
</hx-button>
```

### Size Properties (`hx-size`)

HELiX components use `hx-size` instead of the native `size` attribute to avoid conflicts with the HTML `size` attribute on `<input>` and `<select>` elements.

```twig
{# Always use hx-size, never size #}
<hx-button hx-size="lg" variant="primary">Large Button</hx-button>
<hx-badge hx-size="sm" variant="secondary">New</hx-badge>

{# Dynamic size from field #}
<hx-button
  hx-size="{{ node.field_button_size.value|default('md') }}"
  variant="primary"
>
  {{ button_text }}
</hx-button>

{# Context-dependent size #}
<hx-button hx-size="{{ is_hero_section ? 'lg' : 'md' }}" variant="primary">
  Call to Action
</hx-button>
```

---

## Binding Boolean Properties

Boolean properties in web components follow the HTML specification: the **presence** of the attribute means `true`; the **absence** means `false`. The value of the attribute is irrelevant.

### The Critical Rule

```twig
{# CORRECT: attribute is absent when false #}
<hx-button
  variant="primary"
  {% if is_disabled %}disabled{% endif %}
>
  Submit
</hx-button>

{# WRONG: disabled="false" still disables the button #}
{# The string "false" is a truthy value in HTML attribute semantics #}
<hx-button disabled="false">Still disabled!</hx-button>

{# WRONG: renders disabled="" when is_disabled is false, which is still truthy #}
<hx-button disabled="{{ is_disabled }}">Also wrong</hx-button>
```

### Boolean Coercion Table

| Twig Output                         | HTML                       | Property Value | Why                        |
| ----------------------------------- | -------------------------- | -------------- | -------------------------- |
| `{% if true %}disabled{% endif %}`  | `<el disabled>`            | `true`         | Attribute present          |
| `{% if false %}disabled{% endif %}` | `<el>`                     | `false`        | Attribute absent           |
| `disabled=""`                       | `<el disabled="">`         | `true`         | Empty string is truthy     |
| `disabled="false"`                  | `<el disabled="false">`    | `true`         | Any string value is truthy |
| `disabled="disabled"`               | `<el disabled="disabled">` | `true`         | Conventional pattern       |

### Common Boolean Properties

```twig
{# hx-checkbox #}
<hx-checkbox
  name="newsletter"
  label="Subscribe to updates"
  {% if user.preferences.newsletter %}checked{% endif %}
>
</hx-checkbox>

{# hx-text-input #}
<hx-text-input
  name="patient_name"
  label="Patient Name"
  value="{{ patient.name }}"
  {% if is_edit_mode %}required{% endif %}
  {% if is_locked %}disabled{% endif %}
>
</hx-text-input>

{# hx-alert dismissible #}
<hx-alert
  variant="warning"
  {% if content.field_dismissible.0['#markup'] == '1' %}dismissible{% endif %}
>
  {{ content.field_alert_message }}
</hx-alert>
```

### Boolean Properties from Drupal Form API

```twig
{# Map Form API #required and #disabled to component attributes #}
<hx-text-input
  name="{{ element['#name'] }}"
  label="{{ element['#title'] }}"
  value="{{ element['#default_value']|default('') }}"
  {% if element['#required'] %}required{% endif %}
  {% if element['#disabled'] %}disabled{% endif %}
>
</hx-text-input>
```

---

## Binding Number Properties

Lit automatically converts string attribute values to numbers when the property is declared with `type: Number`. You pass a string in Twig; the component receives a number in JavaScript.

```twig
{# rows: string "8" → number 8 inside the component.
   hx-textarea has no default slot — text content goes in the `value` attribute. #}
<hx-textarea
  name="notes"
  label="Clinical Notes"
  rows="8"
  placeholder="Enter detailed notes..."
  value="{{ node.field_clinical_notes.value }}"
></hx-textarea>

{# Dynamic number from a Drupal field #}
<hx-textarea
  name="description"
  label="Description"
  rows="{{ node.field_textarea_rows.value|default(4) }}"
  value="{{ node.field_description.value }}"
></hx-textarea>

{# Numeric constraints require hx-number-input — hx-text-input does not
   expose `min` / `max` attributes. Use hx-number-input for clinical numerics. #}
<hx-number-input
  name="heart_rate"
  label="Heart Rate (BPM)"
  min="{{ vital_config.min_heart_rate|default(40) }}"
  max="{{ vital_config.max_heart_rate|default(200) }}"
  value="{{ reading.heart_rate }}"
  required
></hx-number-input>
```

---

## Object and Array Properties Require JavaScript

Most object/array-typed properties cannot be serialized to plain HTML attributes — but some components ship JSON-string attribute converters that accept the serialized form directly. The default pattern is:

1. **First check the component's CEM** — if `columns`, `rows`, etc. are declared as string-typed attributes (as `hx-data-table` does), pass JSON inline from Twig.
2. **Otherwise**: JSON-encode the data into a `data-` attribute and assign the JavaScript property in a Drupal Behavior.

### Components with JSON attribute converters — pass directly from Twig

```twig
{# hx-data-table accepts `columns`, `rows`, and `label` as JSON-string attributes.
   No Drupal Behavior required for the array data path. #}
<hx-data-table
  id="patient-table-{{ node.id }}"
  label="{{ 'Patient records'|t }}"
  columns="{{ columns|json_encode|e('html_attr') }}"
  rows="{{ rows|json_encode|e('html_attr') }}"
></hx-data-table>
```

### Components without JSON converters — Behavior-hydrate the property

```twig
{# Step 1: store data in a data- attribute on a component that does NOT
   expose JSON-typed attributes. #}
<hx-some-component
  id="some-instance-{{ node.id }}"
  data-config="{{ config|json_encode|escape }}"
></hx-some-component>
```

```javascript
// Step 2: parse and assign in a Drupal Behavior
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxSomeComponentInit = {
    attach(context) {
      once('helixui:some-component', 'hx-some-component[data-config]', context).forEach((el) => {
        customElements.whenDefined('hx-some-component').then(() => {
          try {
            el.config = JSON.parse(el.getAttribute('data-config'));
          } catch (error) {
            console.error('[HELiX] hx-some-component initialization failed:', error);
          }
        });
      });
    },
  };
})(Drupal, once);
```

> The earlier draft of this guide showed `hx-data-table` going through the data-attribute + behavior path and assigned `table.data = …`. The component's public property is `rows`, not `data`, and the attribute converter pattern above is the documented contract — prefer it unless you need to compute `columns`/`rows` post-upgrade.

---

## NULL and Empty String Handling

These are not the same thing and behave differently at the component level.

```twig
{# Empty string: attribute is present with value "" #}
<hx-text-input
  name="middle_name"
  label="Middle Name"
  value=""
>
</hx-text-input>
{# → component receives value property = "" (empty string) #}

{# Attribute absent: component uses its own default value #}
<hx-text-input
  name="middle_name"
  label="Middle Name"
>
</hx-text-input>
{# → component receives value property = "" (default), but no attribute in DOM #}

{# Null from Drupal field → renders as empty string via the default filter #}
<hx-text-input
  name="middle_name"
  label="Middle Name"
  value="{{ node.field_middle_name.value|default('') }}"
>
</hx-text-input>
```

Use the `default` filter whenever a field value might be null to ensure a predictable attribute value.

---

## Drupal Field-to-Property Mapping

### Text Fields → String Properties

```twig
{# Plain text field → attribute value #}
<hx-text-input
  name="title"
  label="Article Title"
  value="{{ node.title.value }}"
  required
>
</hx-text-input>

{# Formatted text field → slot (rendered HTML, not attribute) #}
<hx-card>
  <div>{{ content.body }}</div>
</hx-card>
```

### Boolean Fields → Boolean Attributes

```twig
{# Boolean field → conditional attribute presence #}
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

### List Fields → Select or Radio

```twig
{# Allowed-values list field → select component #}
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
```

### Date Fields → Text Input with Type

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

{# DateTime field — hx-text-input only supports the platform input types its
   underlying <input> exposes; `datetime-local` is **not** in the component's
   public type enum. Split the date and time into the dedicated pickers, or
   keep the value in a hidden field and assemble it in a behavior. #}
<hx-date-picker
  name="visit_date"
  label="Visit Date"
  value="{{ node.field_visit_time.value|date('Y-m-d') }}"
  required
></hx-date-picker>
<hx-time-picker
  name="visit_time"
  label="Visit Time"
  value="{{ node.field_visit_time.value|date('H:i') }}"
  required
></hx-time-picker>
```

### Taxonomy Terms → Variant Strings

```twig
{# Taxonomy term drives badge variant #}
{% set term = node.field_category.entity %}
<hx-badge variant="{{ term.field_badge_variant.value|default('secondary') }}">
  {{ term.name.value }}
</hx-badge>

{# Map term name to component variant.
   hx-badge variants: primary | secondary | success | warning | error | neutral | info.
   There is no `danger` variant — use `error` for high-severity statuses. #}
{% set priority = node.field_priority.entity.name.value|lower %}
{% set priority_variant_map = {
  'urgent': 'error',
  'high': 'warning',
  'normal': 'info',
  'low': 'neutral'
} %}
<hx-badge variant="{{ priority_variant_map[priority]|default('info') }}">
  {{ priority|capitalize }}
</hx-badge>
```

---

## Attribute Sanitization

Twig auto-escapes HTML entities in attribute values by default. This means `"`, `'`, `<`, `>`, and `&` are converted to their HTML entity equivalents, preventing XSS through attribute injection.

```twig
{# Auto-escaped: safe by default #}
<hx-text-input
  label="{{ user_input }}"
  placeholder="{{ field_value }}"
>
</hx-text-input>

{# Explicit escape: redundant but documents intent #}
<hx-text-input
  label="{{ user_input|escape }}"
>
</hx-text-input>

{# Raw: ONLY for trusted, pre-sanitized content #}
<hx-text-input
  label="{{ trusted_content|raw }}"
>
</hx-text-input>
```

---

## Best Practices Summary

1. **Use `default` filter** for any field-sourced attribute to prevent empty or null attribute values.
2. **Boolean attributes must be conditional presence** — never `disabled="{{ value }}"`.
3. **Use `hx-size`** not `size` for component size configuration.
4. **Use `hx-href` for `hx-card` navigation** (it dispatches `hx-click`, not browser navigation); the `href` attribute applies to components whose CEM declares it (e.g. `hx-button`).
5. **Check the CEM first for JSON-attribute support** — components like `hx-data-table` accept `columns`/`rows` as JSON strings directly from Twig; only fall back to the data-attribute + Drupal Behavior pattern for components without converters.
6. **Keep property logic in Twig** — derive variant values, size values, and conditional states in the template rather than JavaScript.
7. **Check field existence** before accessing `.value` to avoid Twig errors on nodes without that field type.

---

## Additional Resources

- [Twig Integration Fundamentals](/drupal/twig-templates/fundamentals/)
- [Slot Patterns in Twig](/drupal/twig-templates/slots/)
- [Behaviors with Web Components](/drupal/behaviors/web-components/)
- [Lit Property System](https://lit.dev/docs/components/properties/)
