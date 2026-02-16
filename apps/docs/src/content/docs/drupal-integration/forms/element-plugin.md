---
title: Form Element Plugins
description: Complete guide to creating custom Drupal FormElement plugins for HELIX web components, including process callbacks, theme functions, value callbacks, and validation integration
order: 20
---

Drupal's **Plugin API** provides a powerful mechanism for extending the Form API with custom element types. This guide demonstrates how to create **FormElement plugins** that integrate HELIX web components into Drupal's render pipeline as first-class form elements.

By creating FormElement plugins, you enable developers to use HELIX components with the same familiar syntax as native Drupal form elements like `textfield` or `select`, while maintaining full compatibility with Drupal's validation, AJAX, and processing systems.

## Why Create FormElement Plugins?

### The Problem

Without a custom FormElement plugin, using HELIX components in forms requires verbose render arrays and manual attribute mapping:

```php
// Without FormElement plugin (verbose, error-prone)
$form['patient_name'] = [
  '#type' => 'markup',
  '#markup' => '<hx-text-input name="patient_name" label="Patient Name" required></hx-text-input>',
  '#allowed_tags' => ['hx-text-input'],
];
```

**Issues:**

- No Form API property support (`#title`, `#required`, `#default_value`)
- Manual HTML string building (security risk, poor maintainability)
- No validation integration
- No AJAX support
- Bypasses Drupal's render pipeline

### The Solution

A FormElement plugin makes HELIX components work like native form elements:

```php
// With FormElement plugin (clean, Form API native)
$form['patient_name'] = [
  '#type' => 'helix_text_input',
  '#title' => $this->t('Patient Name'),
  '#required' => TRUE,
  '#default_value' => $patient->getName(),
  '#element_validate' => [[$this, 'validatePatientName']],
];
```

**Benefits:**

- Native Form API syntax
- Full validation and AJAX support
- Automatic attribute mapping
- Consistent with Drupal conventions
- Type-safe in IDEs (with proper annotations)
- Maintainable and testable

## FormElement Plugin Architecture

Drupal's Plugin API uses **annotations** to discover and register plugins. FormElement plugins extend the base `FormElementBase` class (or `FormElement` for older Drupal versions) and implement several key methods and callbacks.

### Plugin Discovery Flow

```
┌─────────────────────────────────────────┐
│  FormElement Plugin Annotation          │
│  @FormElement("helix_text_input")       │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  Plugin Discovery (Cache)               │
│  src/Element/*.php scanned              │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  getInfo() - Define defaults            │
│  Returns element info array             │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  #process callbacks                     │
│  Transform render array properties      │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  #pre_render callbacks                  │
│  Prepare for theme function             │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  #theme / #theme_wrappers               │
│  Render via Twig template               │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  HTML Output (hx-* component)         │
└─────────────────────────────────────────┘
```

### Key Plugin Components

| Component             | Purpose                                                | When Called                      |
| --------------------- | ------------------------------------------------------ | -------------------------------- |
| **Annotation**        | Registers the plugin type (e.g., `helix_text_input`)   | Plugin discovery (cache rebuild) |
| **getInfo()**         | Defines default properties, callbacks, and theme hooks | Element initialization           |
| **#process**          | Transforms render array properties to attributes       | During form build                |
| **#pre_render**       | Final preparation before theme rendering               | Before template render           |
| **#value_callback**   | Extracts and validates submitted values                | Form submission                  |
| **#theme**            | Twig template for rendering the element                | Render phase                     |
| **#element_validate** | Server-side validation callbacks                       | Form validation phase            |

## Creating a FormElement Plugin

Let's create a complete FormElement plugin for `hx-text-input`.

### Step 1: Plugin Class Structure

```php
<?php
// src/Element/HelixTextInput.php
namespace Drupal\my_module\Element;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element\FormElementBase;

/**
 * Provides an hx-text-input form element.
 *
 * This element integrates the HELIX hx-text-input web component with
 * Drupal's Form API, supporting all standard form properties including
 * validation, AJAX, and ElementInternals-based form submission.
 *
 * Usage:
 * @code
 * $form['email'] = [
 *   '#type' => 'helix_text_input',
 *   '#title' => $this->t('Email Address'),
 *   '#required' => TRUE,
 *   '#default_value' => 'user@example.com',
 *   '#placeholder' => $this->t('Enter your email'),
 *   '#input_type' => 'email',
 * ];
 * @endcode
 *
 * @FormElement("helix_text_input")
 */
class HelixTextInput extends FormElementBase {

  /**
   * {@inheritdoc}
   */
  public function getInfo(): array {
    $class = static::class;

    return [
      // Indicates this is an input element (participates in form submission)
      '#input' => TRUE,

      // Default size attribute (for backwards compatibility)
      '#size' => 60,

      // Default maxlength
      '#maxlength' => 255,

      // Input type (text, email, password, tel, url, search, number)
      '#input_type' => 'text',

      // Autocomplete route (Drupal autocomplete integration)
      '#autocomplete_route_name' => FALSE,

      // Process callbacks: transform render array to attributes
      '#process' => [
        [$class, 'processHelixTextInput'],
        [$class, 'processAutocomplete'],
        [$class, 'processAjaxForm'],
      ],

      // Pre-render callbacks: final preparation before theme
      '#pre_render' => [
        [$class, 'preRenderHelixTextInput'],
      ],

      // Theme hook for rendering
      '#theme' => 'helix_text_input',

      // Theme wrappers (adds form-item wrapper with label, description, errors)
      '#theme_wrappers' => ['form_element'],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public static function valueCallback(
    &$element,
    $input,
    FormStateInterface $form_state
  ) {
    // If input exists (form was submitted), return it
    if ($input !== FALSE && $input !== NULL) {
      return (string) $input;
    }

    // Otherwise, return the default value
    return $element['#default_value'] ?? '';
  }

  /**
   * Processes the hx-text-input element.
   *
   * Maps Form API properties to HTML attributes that will be passed to
   * the hx-text-input web component.
   *
   * @param array $element
   *   The element render array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The current form state.
   * @param array $complete_form
   *   The complete form structure.
   *
   * @return array
   *   The processed element.
   */
  public static function processHelixTextInput(
    array &$element,
    FormStateInterface $form_state,
    array &$complete_form
  ): array {
    // Set element name (required for form submission)
    $element['#attributes']['name'] = $element['#name'];

    // Map input type
    if (!empty($element['#input_type'])) {
      $element['#attributes']['type'] = $element['#input_type'];
    }

    // Map maxlength
    if (isset($element['#maxlength']) && $element['#maxlength'] > 0) {
      $element['#attributes']['maxlength'] = $element['#maxlength'];
    }

    // Map size (not used by web components, but preserve for compatibility)
    if (isset($element['#size']) && $element['#size'] > 0) {
      $element['#attributes']['size'] = $element['#size'];
    }

    // Map placeholder
    if (!empty($element['#placeholder'])) {
      $element['#attributes']['placeholder'] = $element['#placeholder'];
    }

    // Map required attribute
    if (!empty($element['#required'])) {
      $element['#attributes']['required'] = 'required';
    }

    // Map disabled state
    if (!empty($element['#disabled'])) {
      $element['#attributes']['disabled'] = 'disabled';
    }

    // Map readonly state
    if (!empty($element['#readonly'])) {
      $element['#attributes']['readonly'] = 'readonly';
    }

    // Map pattern for validation
    if (!empty($element['#pattern'])) {
      $element['#attributes']['pattern'] = $element['#pattern'];
    }

    // Map autocomplete attribute
    if (!empty($element['#autocomplete'])) {
      $element['#attributes']['autocomplete'] = $element['#autocomplete'];
    }

    // Map min/max for number inputs
    if (isset($element['#min'])) {
      $element['#attributes']['min'] = $element['#min'];
    }
    if (isset($element['#max'])) {
      $element['#attributes']['max'] = $element['#max'];
    }
    if (isset($element['#step'])) {
      $element['#attributes']['step'] = $element['#step'];
    }

    // Add value attribute
    if (isset($element['#value']) && $element['#value'] !== '') {
      $element['#attributes']['value'] = $element['#value'];
    }

    return $element;
  }

  /**
   * Prepares the element for rendering.
   *
   * This is the final callback before the element is passed to the theme
   * function. Use this for any last-minute transformations.
   *
   * @param array $element
   *   The element render array.
   *
   * @return array
   *   The prepared element.
   */
  public static function preRenderHelixTextInput(array $element): array {
    // Ensure the element has a unique ID for accessibility
    if (empty($element['#id'])) {
      $element['#id'] = \Drupal::service('uuid')->generate();
    }

    // Add help text as help-text attribute if present
    if (!empty($element['#description'])) {
      $element['#attributes']['help-text'] = $element['#description'];
    }

    // Add label as label attribute if present
    if (!empty($element['#title'])) {
      $element['#attributes']['label'] = $element['#title'];
    }

    // Add error state if validation errors exist
    if (!empty($element['#errors'])) {
      $element['#attributes']['error'] = $element['#errors'];
      $element['#attributes']['aria-invalid'] = 'true';
    }

    return $element;
  }

}
```

### Step 2: Twig Template

Create the Twig template that renders the `hx-text-input` element.

```twig
{# templates/helix-text-input.html.twig #}
{#
/**
 * @file
 * Theme template for the hx-text-input element.
 *
 * Available variables:
 * - attributes: HTML attributes for the hx-text-input element.
 *   - name: Input name for form submission.
 *   - type: Input type (text, email, password, etc.).
 *   - value: Current value.
 *   - label: Label text.
 *   - help-text: Help text.
 *   - error: Error message.
 *   - required: Boolean attribute for required fields.
 *   - disabled: Boolean attribute for disabled fields.
 *   - placeholder: Placeholder text.
 *   - maxlength: Maximum length.
 * - element: The full render array of the element.
 *
 * Note: The form_element theme wrapper will add the surrounding
 * .form-item div, label, and description. This template only renders
 * the hx-text-input component itself.
 */
#}
<hx-text-input{{ attributes }}>
</hx-text-input>
```

### Step 3: Register Theme Hook

Register the theme hook in your module's `.module` file:

```php
<?php
// my_module.module

/**
 * Implements hook_theme().
 */
function my_module_theme($existing, $type, $theme, $path): array {
  return [
    'helix_text_input' => [
      'render element' => 'element',
      'template' => 'helix-text-input',
    ],
  ];
}
```

### Step 4: Use in a Form

Now you can use the custom element type in any Form API form:

```php
<?php
// src/Form/ExampleForm.php
public function buildForm(array $form, FormStateInterface $form_state): array {
  $form['patient_email'] = [
    '#type' => 'helix_text_input',
    '#title' => $this->t('Email Address'),
    '#description' => $this->t('We will send appointment confirmations to this address.'),
    '#required' => TRUE,
    '#input_type' => 'email',
    '#placeholder' => $this->t('patient@example.com'),
    '#default_value' => '',
    '#maxlength' => 255,
    '#autocomplete' => 'email',
  ];

  return $form;
}
```

**Rendered HTML:**

```html
<div class="form-item form-type-helix-text-input">
  <hx-text-input
    name="patient_email"
    type="email"
    label="Email Address"
    help-text="We will send appointment confirmations to this address."
    placeholder="patient@example.com"
    maxlength="255"
    autocomplete="email"
    required
  ></hx-text-input>
</div>
```

## Process Callbacks in Depth

Process callbacks are the workhorse of FormElement plugins. They transform high-level Form API properties into low-level HTML attributes.

### Callback Execution Order

Process callbacks run in the order defined in `getInfo()`:

```php
'#process' => [
  [$class, 'processHelixTextInput'],    // 1. Custom element processing
  [$class, 'processAutocomplete'],      // 2. Autocomplete integration
  [$class, 'processAjaxForm'],          // 3. AJAX integration
],
```

Each callback receives the element array and can modify it before passing to the next callback.

### Standard Process Callback Pattern

```php
public static function processElementType(
  array &$element,
  FormStateInterface $form_state,
  array &$complete_form
): array {
  // 1. Set required attributes
  $element['#attributes']['name'] = $element['#name'];

  // 2. Map Form API properties to HTML attributes
  if (!empty($element['#required'])) {
    $element['#attributes']['required'] = 'required';
  }

  // 3. Add default values
  if (isset($element['#value'])) {
    $element['#attributes']['value'] = $element['#value'];
  }

  // 4. Process nested elements (if applicable)
  // $element['child_element'] = [ ... ];

  // 5. Add ARIA attributes for accessibility
  if (!empty($element['#errors'])) {
    $element['#attributes']['aria-invalid'] = 'true';
  }

  return $element;
}
```

### Advanced: Conditional Processing

Process callbacks can inspect form state and conditionally modify elements:

```php
public static function processHelixTextInput(
  array &$element,
  FormStateInterface $form_state,
  array &$complete_form
): array {
  // Get triggering element (for AJAX rebuilds)
  $triggering_element = $form_state->getTriggeringElement();

  // Conditional attributes based on form state
  if ($form_state->getValue('enable_mrn_lookup')) {
    $element['#attributes']['data-autocomplete'] = 'patient-mrn';
    $element['#attributes']['data-ajax-url'] = '/api/patient/search';
  }

  // Conditional validation
  if ($element['#required'] && empty($element['#default_value'])) {
    $element['#attributes']['aria-required'] = 'true';
  }

  return $element;
}
```

### Reusing Parent Callbacks

If extending an existing FormElement (e.g., `Textfield`), call parent process callbacks:

```php
use Drupal\Core\Render\Element\Textfield;

class HelixTextInput extends Textfield {

  public static function processHelixTextInput(
    array &$element,
    FormStateInterface $form_state,
    array &$complete_form
  ): array {
    // Call parent process callback first
    $element = parent::processTextfield($element, $form_state, $complete_form);

    // Add custom processing
    $element['#attributes']['data-helix'] = 'text-input';

    return $element;
  }

}
```

## Value Callbacks

The `valueCallback()` method determines how the element's value is extracted from submitted form data.

### Default Implementation

The `FormElementBase` class provides a default implementation:

```php
public static function valueCallback(
  &$element,
  $input,
  FormStateInterface $form_state
) {
  // If form was submitted, return the submitted value
  if ($input !== FALSE && $input !== NULL) {
    return $input;
  }

  // Otherwise, return the default value
  return $element['#default_value'] ?? NULL;
}
```

### Custom Value Callback

Override `valueCallback()` for custom value processing:

```php
/**
 * Example: Checkbox that stores 1/0 instead of TRUE/FALSE
 */
public static function valueCallback(
  &$element,
  $input,
  FormStateInterface $form_state
) {
  if ($input !== FALSE && $input !== NULL) {
    // Convert checkbox value to integer
    return $input === 'on' ? 1 : 0;
  }

  // Return default as integer
  return !empty($element['#default_value']) ? 1 : 0;
}
```

### Multi-Value Callback

For elements that submit multiple values (checkboxes, multi-select):

```php
/**
 * Example: Multi-checkbox group returning array of values
 */
public static function valueCallback(
  &$element,
  $input,
  FormStateInterface $form_state
) {
  if ($input !== FALSE && $input !== NULL) {
    // Filter out unchecked values and return array
    return array_filter($input, function($value) {
      return $value !== 0;
    });
  }

  // Return default value as array
  return $element['#default_value'] ?? [];
}
```

### Sanitization in Value Callback

Value callbacks should NOT perform sanitization or validation. Use `#element_validate` for that:

```php
// GOOD: Return raw value
public static function valueCallback(&$element, $input, FormStateInterface $form_state) {
  return $input ?? $element['#default_value'] ?? '';
}

// BAD: Don't sanitize in valueCallback
public static function valueCallback(&$element, $input, FormStateInterface $form_state) {
  return strip_tags($input); // Wrong place for sanitization
}
```

## Theme Functions vs Templates

Drupal supports two rendering approaches: **theme functions** (PHP) and **theme templates** (Twig). For HELIX components, **always use Twig templates**.

### Why Twig Templates?

| Reason                     | Explanation                           |
| -------------------------- | ------------------------------------- |
| **Security**               | Auto-escaping prevents XSS attacks    |
| **Separation of Concerns** | Presentation logic stays out of PHP   |
| **Theme Overrides**        | Easier for site builders to customize |
| **Debugging**              | Twig debug mode shows template paths  |
| **Standard Practice**      | Drupal 10/11 best practice            |

### Template Override Hierarchy

Site builders can override your template at multiple levels:

```
my_module/templates/helix-text-input.html.twig (base)
  ↓ (can be overridden by)
themes/custom_theme/templates/helix-text-input.html.twig (theme override)
  ↓ (can be overridden by)
themes/custom_theme/templates/helix-text-input--patient-form.html.twig (suggestion)
```

### Providing Template Suggestions

Add template suggestions in a preprocess function:

```php
/**
 * Implements hook_preprocess_helix_text_input().
 */
function my_module_preprocess_helix_text_input(&$variables): void {
  $element = $variables['element'];

  // Add suggestion based on input type
  if (!empty($element['#input_type'])) {
    $variables['theme_hook_suggestions'][] = 'helix_text_input__' . $element['#input_type'];
  }

  // Add suggestion based on form ID
  if (!empty($element['#array_parents'])) {
    $form_id = reset($element['#array_parents']);
    $variables['theme_hook_suggestions'][] = 'helix_text_input__' . $form_id;
  }
}
```

This allows templates like:

- `helix-text-input--email.html.twig` (for email inputs)
- `helix-text-input--patient-intake-form.html.twig` (for specific forms)

## Validation Integration

FormElement plugins integrate with Drupal's validation system through `#element_validate` callbacks.

### Element-Level Validation

Add validation callbacks in the form builder:

```php
$form['medical_record_number'] = [
  '#type' => 'helix_text_input',
  '#title' => $this->t('MRN'),
  '#required' => TRUE,
  '#element_validate' => [
    [$this, 'validateMRN'],
  ],
];
```

Validation callback:

```php
public function validateMRN(
  array &$element,
  FormStateInterface $form_state,
  array &$complete_form
): void {
  $value = $element['#value'];

  // Check format
  if (!preg_match('/^[A-Z]{2}\d{6}$/', $value)) {
    $form_state->setError($element, $this->t('MRN must be in format: AA123456'));
    return;
  }

  // Check database uniqueness
  $existing = \Drupal::entityQuery('patient')
    ->condition('mrn', $value)
    ->accessCheck(FALSE)
    ->execute();

  if (!empty($existing)) {
    $form_state->setError($element, $this->t('This MRN is already registered.'));
  }
}
```

### Built-In Validators

Drupal provides reusable validators for common patterns:

```php
use Drupal\Core\Render\Element\Email;
use Drupal\Core\Render\Element\Tel;
use Drupal\Core\Render\Element\Url;

$form['contact_email'] = [
  '#type' => 'helix_text_input',
  '#input_type' => 'email',
  '#element_validate' => [
    [Email::class, 'validateEmail'], // Reuse Drupal's email validator
  ],
];

$form['website'] = [
  '#type' => 'helix_text_input',
  '#input_type' => 'url',
  '#element_validate' => [
    [Url::class, 'validateUrl'], // Reuse Drupal's URL validator
  ],
];
```

### Validation Error Display

Errors set via `$form_state->setError()` are automatically passed to the Twig template:

```twig
<hx-text-input
  {{ attributes }}
  {% if element['#errors'] %}error="{{ element['#errors'] }}"{% endif %}
></hx-text-input>
```

The `hx-text-input` component will render the error message in its UI.

### Client-Side + Server-Side Validation

Combine HTML5 constraint validation with server-side checks:

```php
$form['age'] = [
  '#type' => 'helix_text_input',
  '#title' => $this->t('Age'),
  '#input_type' => 'number',
  '#min' => 0,
  '#max' => 120,
  '#required' => TRUE,
  '#element_validate' => [
    [$this, 'validateAge'], // Server-side fallback
  ],
];
```

Client-side validation happens in the browser (via `hx-text-input`'s ElementInternals), but server-side validation always runs for security.

## Complete Plugin Examples

### Example 1: hx-textarea Plugin

```php
<?php
namespace Drupal\my_module\Element;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element\FormElementBase;

/**
 * @FormElement("helix_textarea")
 */
class HelixTextarea extends FormElementBase {

  public function getInfo(): array {
    $class = static::class;

    return [
      '#input' => TRUE,
      '#rows' => 5,
      '#cols' => 60,
      '#resizable' => TRUE,
      '#process' => [
        [$class, 'processHelixTextarea'],
      ],
      '#pre_render' => [
        [$class, 'preRenderHelixTextarea'],
      ],
      '#theme' => 'helix_textarea',
      '#theme_wrappers' => ['form_element'],
    ];
  }

  public static function valueCallback(&$element, $input, FormStateInterface $form_state) {
    if ($input !== FALSE && $input !== NULL) {
      return (string) $input;
    }
    return $element['#default_value'] ?? '';
  }

  public static function processHelixTextarea(
    array &$element,
    FormStateInterface $form_state,
    array &$complete_form
  ): array {
    $element['#attributes']['name'] = $element['#name'];

    if (isset($element['#rows'])) {
      $element['#attributes']['rows'] = $element['#rows'];
    }

    if (isset($element['#maxlength'])) {
      $element['#attributes']['maxlength'] = $element['#maxlength'];
    }

    if (!empty($element['#placeholder'])) {
      $element['#attributes']['placeholder'] = $element['#placeholder'];
    }

    if (!empty($element['#required'])) {
      $element['#attributes']['required'] = 'required';
    }

    if (!empty($element['#disabled'])) {
      $element['#attributes']['disabled'] = 'disabled';
    }

    if (!empty($element['#readonly'])) {
      $element['#attributes']['readonly'] = 'readonly';
    }

    if (isset($element['#resizable']) && !$element['#resizable']) {
      $element['#attributes']['resize'] = 'none';
    }

    if (isset($element['#value'])) {
      $element['#attributes']['value'] = $element['#value'];
    }

    return $element;
  }

  public static function preRenderHelixTextarea(array $element): array {
    if (!empty($element['#description'])) {
      $element['#attributes']['help-text'] = $element['#description'];
    }

    if (!empty($element['#title'])) {
      $element['#attributes']['label'] = $element['#title'];
    }

    if (!empty($element['#errors'])) {
      $element['#attributes']['error'] = $element['#errors'];
    }

    return $element;
  }

}
```

**Twig Template:**

```twig
{# templates/helix-textarea.html.twig #}
<hx-textarea{{ attributes }}>
</hx-textarea>
```

**Usage:**

```php
$form['medical_history'] = [
  '#type' => 'helix_textarea',
  '#title' => $this->t('Medical History'),
  '#description' => $this->t('Please list all chronic conditions and allergies.'),
  '#rows' => 8,
  '#maxlength' => 2000,
  '#required' => TRUE,
];
```

### Example 2: hx-select Plugin

```php
<?php
namespace Drupal\my_module\Element;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element\FormElementBase;

/**
 * @FormElement("helix_select")
 */
class HelixSelect extends FormElementBase {

  public function getInfo(): array {
    $class = static::class;

    return [
      '#input' => TRUE,
      '#multiple' => FALSE,
      '#options' => [],
      '#process' => [
        [$class, 'processHelixSelect'],
      ],
      '#pre_render' => [
        [$class, 'preRenderHelixSelect'],
      ],
      '#theme' => 'helix_select',
      '#theme_wrappers' => ['form_element'],
    ];
  }

  public static function valueCallback(&$element, $input, FormStateInterface $form_state) {
    if ($input !== FALSE && $input !== NULL) {
      // Multi-select returns array
      if (!empty($element['#multiple'])) {
        return is_array($input) ? $input : [$input];
      }
      return (string) $input;
    }

    // Default value
    if (!empty($element['#multiple'])) {
      return $element['#default_value'] ?? [];
    }
    return $element['#default_value'] ?? '';
  }

  public static function processHelixSelect(
    array &$element,
    FormStateInterface $form_state,
    array &$complete_form
  ): array {
    $element['#attributes']['name'] = $element['#name'];

    if (!empty($element['#multiple'])) {
      $element['#attributes']['multiple'] = 'multiple';
      // Add [] to name for multi-select
      $element['#attributes']['name'] .= '[]';
    }

    if (!empty($element['#required'])) {
      $element['#attributes']['required'] = 'required';
    }

    if (!empty($element['#disabled'])) {
      $element['#attributes']['disabled'] = 'disabled';
    }

    // Store options for template
    $element['#helix_options'] = $element['#options'];

    // Store selected value(s)
    if (isset($element['#value'])) {
      $element['#helix_value'] = $element['#value'];
    }

    return $element;
  }

  public static function preRenderHelixSelect(array $element): array {
    if (!empty($element['#description'])) {
      $element['#attributes']['help-text'] = $element['#description'];
    }

    if (!empty($element['#title'])) {
      $element['#attributes']['label'] = $element['#title'];
    }

    if (!empty($element['#errors'])) {
      $element['#attributes']['error'] = $element['#errors'];
    }

    return $element;
  }

}
```

**Twig Template:**

```twig
{# templates/helix-select.html.twig #}
<hx-select{{ attributes }}>
  {% for key, label in element['#helix_options'] %}
    <option value="{{ key }}" {% if element['#helix_value'] == key %}selected{% endif %}>
      {{ label }}
    </option>
  {% endfor %}
</hx-select>
```

**Usage:**

```php
$form['insurance_provider'] = [
  '#type' => 'helix_select',
  '#title' => $this->t('Insurance Provider'),
  '#options' => [
    '' => $this->t('- Select -'),
    'bcbs' => $this->t('Blue Cross Blue Shield'),
    'aetna' => $this->t('Aetna'),
    'united' => $this->t('UnitedHealthcare'),
    'cigna' => $this->t('Cigna'),
  ],
  '#required' => TRUE,
  '#default_value' => 'bcbs',
];
```

### Example 3: hx-checkbox Plugin

```php
<?php
namespace Drupal\my_module\Element;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element\FormElementBase;

/**
 * @FormElement("helix_checkbox")
 */
class HelixCheckbox extends FormElementBase {

  public function getInfo(): array {
    $class = static::class;

    return [
      '#input' => TRUE,
      '#return_value' => 1,
      '#process' => [
        [$class, 'processHelixCheckbox'],
      ],
      '#pre_render' => [
        [$class, 'preRenderHelixCheckbox'],
      ],
      '#theme' => 'helix_checkbox',
      '#theme_wrappers' => ['form_element'],
    ];
  }

  public static function valueCallback(&$element, $input, FormStateInterface $form_state) {
    if ($input !== FALSE && $input !== NULL) {
      // Checkbox was checked
      return $element['#return_value'];
    }

    // Return default value or 0
    return !empty($element['#default_value']) ? $element['#return_value'] : 0;
  }

  public static function processHelixCheckbox(
    array &$element,
    FormStateInterface $form_state,
    array &$complete_form
  ): array {
    $element['#attributes']['name'] = $element['#name'];

    if (!empty($element['#return_value'])) {
      $element['#attributes']['value'] = $element['#return_value'];
    }

    if (!empty($element['#default_value'])) {
      $element['#attributes']['checked'] = 'checked';
    }

    if (!empty($element['#required'])) {
      $element['#attributes']['required'] = 'required';
    }

    if (!empty($element['#disabled'])) {
      $element['#attributes']['disabled'] = 'disabled';
    }

    return $element;
  }

  public static function preRenderHelixCheckbox(array $element): array {
    if (!empty($element['#description'])) {
      $element['#attributes']['help-text'] = $element['#description'];
    }

    if (!empty($element['#title'])) {
      $element['#attributes']['label'] = $element['#title'];
    }

    if (!empty($element['#errors'])) {
      $element['#attributes']['error'] = $element['#errors'];
    }

    return $element;
  }

}
```

**Twig Template:**

```twig
{# templates/helix-checkbox.html.twig #}
<hx-checkbox{{ attributes }}>
</hx-checkbox>
```

**Usage:**

```php
$form['consent'] = [
  '#type' => 'helix_checkbox',
  '#title' => $this->t('I consent to treatment'),
  '#description' => $this->t('By checking this box, you agree to the terms of service.'),
  '#required' => TRUE,
  '#return_value' => 'agreed',
];
```

## Registration and Discovery

Drupal automatically discovers plugins in the `src/Element/` directory of enabled modules.

### File Naming Convention

```
my_module/
└── src/
    └── Element/
        ├── HelixTextInput.php
        ├── HelixTextarea.php
        ├── HelixSelect.php
        ├── HelixCheckbox.php
        ├── HelixRadioGroup.php
        └── HelixSwitch.php
```

### Namespace Convention

```php
<?php
namespace Drupal\my_module\Element;
```

Must match the module name and directory structure.

### Cache Rebuild

After adding a new plugin, rebuild the cache:

```bash
drush cr
```

Or via the admin UI: **Configuration → Development → Performance → Clear all caches**

### Verify Plugin Discovery

Check if your plugin is registered:

```php
$plugin_manager = \Drupal::service('plugin.manager.element_info');
$definitions = $plugin_manager->getDefinitions();

if (isset($definitions['helix_text_input'])) {
  echo "Plugin discovered!";
}
```

Or use Drush:

```bash
drush eval "var_dump(\Drupal::service('plugin.manager.element_info')->getDefinitions());"
```

## Best Practices

### 1. Extend Existing Plugins When Possible

If your element is similar to an existing Drupal element, extend it:

```php
// Extends Textfield instead of FormElementBase
class HelixTextInput extends Textfield {
  // Inherit all textfield behavior, override only what's needed
}
```

### 2. Use Strict Types

Enable strict type checking for robustness:

```php
<?php
declare(strict_types=1);

namespace Drupal\my_module\Element;
```

### 3. Document All Properties

Add comprehensive JSDoc-style comments:

```php
/**
 * Provides an hx-text-input form element.
 *
 * Properties:
 * - #input_type: (string) Input type (text, email, password, tel, url, search, number).
 * - #placeholder: (string) Placeholder text.
 * - #maxlength: (int) Maximum character length.
 * - #pattern: (string) Regex pattern for validation.
 * - #autocomplete: (string) Autocomplete attribute value.
 *
 * @FormElement("helix_text_input")
 */
class HelixTextInput extends FormElementBase { }
```

### 4. Provide Default Values

Always provide sensible defaults in `getInfo()`:

```php
return [
  '#input' => TRUE,
  '#size' => 60,
  '#maxlength' => 255,
  '#input_type' => 'text',
];
```

### 5. Preserve Form API Conventions

Map Drupal properties to web component attributes consistently:

| Drupal Property  | Web Component Attribute |
| ---------------- | ----------------------- |
| `#title`         | `label`                 |
| `#description`   | `help-text`             |
| `#required`      | `required`              |
| `#disabled`      | `disabled`              |
| `#placeholder`   | `placeholder`           |
| `#default_value` | `value`                 |

### 6. Handle Empty Values Gracefully

Check for empty/undefined values before mapping:

```php
if (!empty($element['#placeholder'])) {
  $element['#attributes']['placeholder'] = $element['#placeholder'];
}
```

### 7. Add ARIA Attributes

Ensure accessibility by adding ARIA attributes in process callbacks:

```php
if (!empty($element['#required'])) {
  $element['#attributes']['aria-required'] = 'true';
}

if (!empty($element['#errors'])) {
  $element['#attributes']['aria-invalid'] = 'true';
}
```

### 8. Test Plugin Integration

Write functional tests for your plugins:

```php
/**
 * Tests the HelixTextInput element.
 */
public function testHelixTextInputElement(): void {
  $form = $this->formBuilder->getForm(ExampleForm::class);

  $this->assertArrayHasKey('patient_email', $form);
  $this->assertEquals('helix_text_input', $form['patient_email']['#type']);

  // Submit the form
  $this->submitForm([
    'patient_email' => 'test@example.com',
  ], 'Submit');

  $this->assertSession()->pageTextContains('Form submitted successfully');
}
```

### 9. Support Theme Overrides

Add template suggestions for flexibility:

```php
function my_module_theme_suggestions_helix_text_input(array $variables): array {
  $suggestions = [];
  $element = $variables['element'];

  if (!empty($element['#input_type'])) {
    $suggestions[] = 'helix_text_input__' . $element['#input_type'];
  }

  return $suggestions;
}
```

### 10. Use Dependency Injection

For complex plugins, inject services via `create()`:

```php
use Symfony\Component\DependencyInjection\ContainerInterface;

class HelixTextInput extends FormElementBase implements ContainerFactoryPluginInterface {

  protected $entityTypeManager;

  public static function create(
    ContainerInterface $container,
    array $configuration,
    $plugin_id,
    $plugin_definition
  ) {
    $instance = new static($configuration, $plugin_id, $plugin_definition);
    $instance->entityTypeManager = $container->get('entity_type.manager');
    return $instance;
  }

}
```

## Summary

FormElement plugins are the bridge between Drupal's Form API and HELIX web components. By creating plugins, you enable:

1. **Native Form API syntax** — Developers use `#type => 'helix_text_input'` just like `#type => 'textfield'`
2. **Automatic attribute mapping** — `#title`, `#required`, `#default_value` map to component attributes
3. **Full validation support** — `#element_validate` callbacks integrate with server-side validation
4. **AJAX compatibility** — `#ajax` property works with component events like `hx-change`
5. **Theme override support** — Site builders can customize templates at multiple levels

**Key Components:**

- **Annotation** (`@FormElement("helix_text_input")`) — Registers the plugin type
- **getInfo()** — Defines defaults, callbacks, and theme hooks
- **#process** — Transforms render array properties to HTML attributes
- **#pre_render** — Final preparation before template rendering
- **#value_callback** — Extracts submitted values from form data
- **#theme** — Twig template for rendering

**Next Steps:**

- [Form API Integration](/drupal-integration/forms/form-api/) — Learn the full Form API system
- [Twig Fundamentals](/drupal-integration/twig/fundamentals/) — Master Twig template syntax
- [AJAX Integration](/drupal-integration/ajax/overview/) — Add AJAX to form elements

**External Resources:**

- [Form API Reference](https://www.drupal.org/docs/drupal-apis/form-api) - Official Drupal documentation
- [FormElement Class](https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Render!Element!FormElementBase.php/class/FormElementBase) - API documentation
- [Form Render Elements](https://www.drupal.org/docs/drupal-apis/form-api/form-render-elements) - Drupal.org guide
- [Plugin API](https://www.drupal.org/docs/drupal-apis/plugin-api) - Understanding Drupal plugins
