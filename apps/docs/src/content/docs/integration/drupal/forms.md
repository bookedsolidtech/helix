---
title: Drupal Form API Integration
description: Use HELiX form components (hx-text-input, hx-select, hx-checkbox) with Drupal's Form API — hook_form_alter, preprocess patterns, and form-associated custom elements.
sidebar:
  order: 5
---

HELiX form components are [form-associated custom elements](https://web.dev/articles/more-capable-form-controls). They use the browser's `ElementInternals` API to participate in native HTML form submission without requiring JavaScript for the submission to work. This makes them compatible with Drupal's server-side Form API.

---

## How Form-Associated Custom Elements Work

A standard `<input>` reports its value to the parent `<form>` via native form submission. HELiX form components replicate this behavior:

- `hx-text-input` reports its value under the `name` attribute
- `hx-select` reports its selected value under the `name` attribute
- `hx-checkbox` reports its checked state under the `name` attribute
- `hx-textarea` reports its value under the `name` attribute
- `hx-radio-group` reports the selected radio value under the `name` attribute

Because they use `ElementInternals.setFormValue()`, Drupal's server-side form processing receives the values exactly as it would from native inputs. No custom PHP is required to read HELiX form values.

---

## Basic Form Example

A complete patient intake form built with HELiX components:

```twig
{# webform--patient-intake.html.twig #}
{{ attach_library('mytheme/helix_forms') }}

<form
  id="{{ attributes.id }}"
  method="post"
  action="{{ form_action }}"
  novalidate
>
  {{ form_hidden_fields }}

  <hx-form>
    <hx-text-input
      name="patient_name"
      label="{{ 'Full Name'|t }}"
      required
      autocomplete="name"
    ></hx-text-input>

    <hx-text-input
      name="date_of_birth"
      type="date"
      label="{{ 'Date of Birth'|t }}"
      required
      autocomplete="bday"
    ></hx-text-input>

    <hx-select
      name="insurance_provider"
      label="{{ 'Insurance Provider'|t }}"
      required
    >
      <option value="">{{ 'Select provider...'|t }}</option>
      {% for provider in insurance_providers %}
        <option value="{{ provider.id }}">{{ provider.name }}</option>
      {% endfor %}
    </hx-select>

    <hx-checkbox
      name="consent"
      value="1"
      label="{{ 'I consent to treatment'|t }}"
      required
    ></hx-checkbox>

    <div slot="actions">
      <hx-button type="submit" variant="primary">
        {{ 'Submit'|t }}
      </hx-button>
    </div>
  </hx-form>
</form>
```

---

## hook_form_alter Integration

Use `hook_form_alter` to modify existing Drupal forms and render HELiX components in place of standard form elements.

### Approach 1: #markup with pre-rendered component

For simple cases, use `#markup` to inject the component HTML directly:

```php
// mytheme.theme

function mytheme_form_node_article_form_alter(&$form, FormStateInterface $form_state, $form_id) {
  // Replace the standard title input with hx-text-input
  $default_value = $form['title']['widget'][0]['value']['#default_value'] ?? '';

  $form['title']['widget'][0]['value'] = [
    '#markup' => '<hx-text-input '
      . 'name="title[0][value]" '
      . 'label="' . t('Title') . '" '
      . 'value="' . htmlspecialchars($default_value, ENT_QUOTES) . '" '
      . 'required '
      . '></hx-text-input>',
    '#attached' => ['library' => ['mytheme/helix_forms']],
  ];
}
```

### Approach 2: Custom form element plugin

For reusable integration, create a custom `FormElement` plugin that renders an `hx-text-input`:

```php
// src/Element/HelixTextInput.php

namespace Drupal\mytheme\Element;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element\FormElement;

/**
 * Provides an hx-text-input form element.
 *
 * @FormElement("helix_text_input")
 */
class HelixTextInput extends FormElement {

  public function getInfo(): array {
    return [
      '#input' => TRUE,
      '#process' => [[$this, 'processInput']],
      '#theme' => 'helix_text_input',
      '#label' => '',
      '#description' => '',
      '#required' => FALSE,
      '#disabled' => FALSE,
      '#default_value' => '',
      '#attached' => ['library' => ['mytheme/helix_forms']],
    ];
  }

  public static function processInput(
    array &$element,
    FormStateInterface $form_state,
    array &$complete_form
  ): array {
    $element['#name'] = $element['#name'] ?? $element['#id'];
    return $element;
  }

  public static function valueCallback(
    &$element,
    $input,
    FormStateInterface $form_state
  ): mixed {
    if ($input !== FALSE) {
      return $input;
    }
    return $element['#default_value'] ?? '';
  }
}
```

Usage in a form class:

```php
$form['patient_name'] = [
  '#type' => 'helix_text_input',
  '#label' => $this->t('Patient Name'),
  '#required' => TRUE,
  '#default_value' => $patient->getName(),
];
```

---

## Preprocess Functions for Form Templates

Use preprocess to pass structured data to Twig form templates without complex `#markup` strings:

```php
// mytheme.theme

function mytheme_preprocess_form_element(&$variables) {
  // Flag form elements that should use HELiX components
  $element = $variables['element'];

  if (isset($element['#use_helix']) && $element['#use_helix']) {
    $variables['use_helix'] = TRUE;
    $variables['helix_component'] = $element['#helix_component'] ?? 'hx-text-input';
    $variables['helix_variant'] = $element['#helix_variant'] ?? 'default';
  }
}
```

---

## Form Validation and Error Display

HELiX form components accept error messages via a named slot. Map Drupal's Form API errors into the component's error slot.

### In a Twig template

```twig
{# templates/form-element--patient-name.html.twig #}
{{ attach_library('mytheme/helix_forms') }}

<hx-text-input
  name="{{ element['#name'] }}"
  label="{{ element['#title'] }}"
  value="{{ element['#value']|default('') }}"
  {% if element['#required'] %}required{% endif %}
  {% if element['#disabled'] %}disabled{% endif %}
  {% if errors %}invalid{% endif %}
>
  {% if element['#description'] %}
    <div slot="help">{{ element['#description'] }}</div>
  {% endif %}

  {% if errors %}
    <div slot="error" role="alert">
      {% for error in errors %}
        {{ error }}
      {% endfor %}
    </div>
  {% endif %}
</hx-text-input>
```

### Setting errors via preprocess

```php
function mytheme_preprocess_form_element(&$variables) {
  $element = $variables['element'];

  // Collect form errors for this element
  $errors = \Drupal::service('form_error_handler')
    ->getErrors($element);

  if (!empty($errors)) {
    $variables['errors'] = $errors;
  }
}
```

---

## hx-select with Drupal Options

The `hx-select` component renders a custom dropdown. Populate its options from Drupal data in the preprocess layer:

```php
function mytheme_preprocess_form(&$variables) {
  // Load department options for the patient form
  $terms = \Drupal::entityTypeManager()
    ->getStorage('taxonomy_term')
    ->loadByProperties(['vid' => 'departments', 'status' => 1]);

  $variables['department_options'] = array_map(function ($term) {
    return [
      'value' => $term->id(),
      'label' => $term->label(),
    ];
  }, $terms);
}
```

```twig
<hx-select name="department" label="{{ 'Department'|t }}" required>
  <option value="">{{ 'Select a department...'|t }}</option>
  {% for option in department_options %}
    <option
      value="{{ option.value }}"
      {% if current_department == option.value %}selected{% endif %}
    >
      {{ option.label }}
    </option>
  {% endfor %}
</hx-select>
```

---

## hx-checkbox-group with Drupal Taxonomy

For multi-select checkboxes backed by taxonomy terms:

```twig
{# templates/form-element--specialty-checkboxes.html.twig #}
{{ attach_library('mytheme/helix_forms') }}

<hx-checkbox-group
  label="{{ 'Clinical Specialties'|t }}"
  name="specialties"
>
  {% for option in element['#options'] %}
    <hx-checkbox
      value="{{ option.key }}"
      label="{{ option.value }}"
      {% if option.key in element['#value'] %}checked{% endif %}
    ></hx-checkbox>
  {% endfor %}
</hx-checkbox-group>
```

---

## Webform Module Integration

When using the Webform module, override webform templates to use HELiX components:

```twig
{# webform/webform--contact.html.twig #}
{{ attach_library('mytheme/helix_forms') }}

<form{{ attributes }}>
  {{ form_children }}
</form>
```

```twig
{# webform/webform-element--textfield.html.twig #}
<hx-text-input
  name="{{ element['#name'] }}"
  label="{{ element['#title'] }}"
  type="{{ element['#type']|default('text') }}"
  value="{{ element['#value']|default('') }}"
  {% if element['#required'] %}required{% endif %}
  {% if element['#disabled'] %}disabled{% endif %}
  {% if element['#placeholder'] %}placeholder="{{ element['#placeholder'] }}"{% endif %}
>
  {% if element['#description'] %}
    <div slot="help">{{ element['#description']|render }}</div>
  {% endif %}
</hx-text-input>
```

---

## Progressive Enhancement Guarantee

Because HELiX form components use `ElementInternals`, they submit their values even if the component JavaScript has not fully upgraded. The browser degrades gracefully:

1. **JavaScript loaded, component upgraded:** Full HELiX UI with validation, formatting, and accessibility features.
2. **JavaScript loading (slow connection):** The custom element tag is in the DOM, Drupal rendered the page. The form cannot submit until the component upgrades (the component's JavaScript sets form values via `ElementInternals`).
3. **JavaScript disabled:** HELiX form components will not submit values. Provide a `<noscript>` fallback:

```twig
<noscript>
  <input
    type="text"
    name="patient_name"
    value="{{ default_value }}"
    required
  >
</noscript>
<hx-text-input
  name="patient_name"
  label="{{ 'Patient Name'|t }}"
  value="{{ default_value }}"
  required
></hx-text-input>
```

For healthcare forms where data submission is mission-critical, always include `<noscript>` fallbacks.

---

## Libraries Configuration for Forms

```yaml
# mytheme.libraries.yml
helix_forms:
  version: 0.1.0
  js:
    dist/js/helix-forms.js:
      preprocess: false
      attributes:
        type: module
  dependencies:
    - core/drupal
    - core/once
    - mytheme/helix_tokens
```

---

## Next Steps

- [Behaviors](/integration/drupal/behaviors/) — Client-side form validation with Drupal behaviors
- [AJAX](/integration/drupal/ajax/) — Form submission via AJAX and response handling
- [Troubleshooting](/integration/drupal/troubleshooting/) — Form values not submitting, validation errors not displaying
