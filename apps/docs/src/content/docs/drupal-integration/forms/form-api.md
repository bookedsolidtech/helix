---
title: Form API Integration
description: Deep dive into integrating HELIX web components with Drupal's Form API, including render arrays, custom form elements, and ElementInternals
order: 19
---

Drupal's Form API is a powerful system for building, validating, and processing HTML forms. This guide demonstrates how to integrate HELIX web components as first-class citizens in the Form API render pipeline, leveraging the native `ElementInternals` API for seamless form participation.

## Drupal Form API Overview

The Form API uses **render arrays** — nested PHP arrays that describe form structure, elements, validation, and submission handlers. Drupal renders these arrays server-side into HTML, then processes submitted values back through the same structure.

### Core Architecture

```
┌─────────────────────────────────────────┐
│         Form Definition (PHP)           │
│  buildForm() returns render array       │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      FormBuilder Render Pipeline        │
│  Expands render arrays to HTML          │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│         Twig Templates                  │
│  form.html.twig, input.html.twig        │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│         HELIX Components              │
│  ElementInternals + Shadow DOM          │
└─────────────────────────────────────────┘
```

### Key Concepts

| Concept                  | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| **Render Array**         | Associative PHP array describing form structure and behavior |
| **Form Element**         | Individual field or control (textfield, select, button)      |
| **#type**                | Defines element type (textfield, select, submit, etc.)       |
| **#attributes**          | HTML attributes passed to the rendered element               |
| **#title, #description** | Label and help text for the field                            |
| **#required**            | Marks field as mandatory                                     |
| **#default_value**       | Pre-populated value                                          |
| **#validate**            | Validation callback functions                                |
| **#submit**              | Submission handler functions                                 |

## Render Arrays Structure

A Form API render array follows a consistent structure:

```php
<?php
// ExampleForm.php
public function buildForm(array $form, FormStateInterface $form_state): array {
  $form['patient_name'] = [
    '#type' => 'textfield',
    '#title' => $this->t('Patient Name'),
    '#description' => $this->t('Enter the full legal name.'),
    '#required' => TRUE,
    '#default_value' => '',
    '#maxlength' => 255,
    '#attributes' => [
      'placeholder' => $this->t('John Doe'),
      'autocomplete' => 'name',
    ],
  ];

  $form['submit'] = [
    '#type' => 'submit',
    '#value' => $this->t('Save Patient'),
  ];

  return $form;
}
```

This array renders to HTML:

```html
<form method="post" action="/form/example">
  <div class="form-item">
    <label for="edit-patient-name">Patient Name <span class="form-required">*</span></label>
    <input
      type="text"
      id="edit-patient-name"
      name="patient_name"
      placeholder="John Doe"
      autocomplete="name"
      required
    />
    <div class="description">Enter the full legal name.</div>
  </div>
  <button type="submit">Save Patient</button>
</form>
```

## Standard Form Element Types

Drupal ships with 30+ form element types. Here are the most common:

| Type         | Description          | Rendered As                        |
| ------------ | -------------------- | ---------------------------------- |
| `textfield`  | Single-line text     | `<input type="text">`              |
| `textarea`   | Multi-line text      | `<textarea>`                       |
| `email`      | Email address        | `<input type="email">`             |
| `password`   | Password field       | `<input type="password">`          |
| `number`     | Numeric input        | `<input type="number">`            |
| `checkbox`   | Single on/off toggle | `<input type="checkbox">`          |
| `checkboxes` | Multiple checkboxes  | Multiple `<input type="checkbox">` |
| `radio`      | Single choice        | `<input type="radio">`             |
| `radios`     | Multiple radio group | Multiple `<input type="radio">`    |
| `select`     | Dropdown list        | `<select><option>`                 |
| `submit`     | Submit button        | `<button type="submit">`           |
| `button`     | Generic button       | `<button>`                         |

## Creating a Custom Form Element

To use HELIX components in Form API, create a **custom render element**. This bridges Drupal's render array system to your web component's HTML.

### Step 1: Define the Render Element Plugin

```php
<?php
// src/Element/HelixTextInput.php
namespace Drupal\my_module\Element;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element\FormElement;

/**
 * Provides an hx-text-input form element.
 *
 * @FormElement("helix_text_input")
 */
class HelixTextInput extends FormElement {

  /**
   * {@inheritdoc}
   */
  public function getInfo(): array {
    $class = static::class;
    return [
      '#input' => TRUE,
      '#size' => 60,
      '#maxlength' => 255,
      '#autocomplete_route_name' => FALSE,
      '#process' => [
        [$class, 'processHelixTextInput'],
      ],
      '#pre_render' => [
        [$class, 'preRenderHelixTextInput'],
      ],
      '#theme_wrappers' => ['form_element'],
    ];
  }

  /**
   * Processes the hx-text-input element.
   */
  public static function processHelixTextInput(
    array &$element,
    FormStateInterface $form_state,
    array &$complete_form
  ): array {
    // Set element defaults.
    $element['#attributes']['type'] = 'text';
    $element['#attributes']['name'] = $element['#name'];

    // Map #maxlength to maxlength attribute.
    if (isset($element['#maxlength']) && $element['#maxlength'] > 0) {
      $element['#attributes']['maxlength'] = $element['#maxlength'];
    }

    // Map #size (not applicable to web components, but preserve for compatibility).
    if (isset($element['#size']) && $element['#size'] > 0) {
      $element['#attributes']['size'] = $element['#size'];
    }

    // Map #placeholder.
    if (!empty($element['#placeholder'])) {
      $element['#attributes']['placeholder'] = $element['#placeholder'];
    }

    // Handle required attribute.
    if (!empty($element['#required'])) {
      $element['#attributes']['required'] = 'required';
    }

    // Handle disabled state.
    if (!empty($element['#disabled'])) {
      $element['#attributes']['disabled'] = 'disabled';
    }

    return $element;
  }

  /**
   * Prepares the element for rendering.
   */
  public static function preRenderHelixTextInput(array $element): array {
    // Ensure the element is wrapped in <hx-text-input> instead of <input>.
    $element['#theme'] = 'helix_text_input';
    return $element;
  }

}
```

### Step 2: Create the Twig Template

```twig
{# templates/helix-text-input.html.twig #}
{#
/**
 * @file
 * Renders an hx-text-input web component.
 *
 * Available variables:
 * - attributes: HTML attributes (name, required, disabled, etc.)
 * - label: The label text (from #title).
 * - value: The current value (from #default_value or submitted value).
 * - required: Boolean indicating required state.
 * - description: Help text (from #description).
 * - errors: Validation errors.
 */
#}
<hx-text-input
  {{ attributes }}
  {% if label %}label="{{ label }}"{% endif %}
  {% if value %}value="{{ value }}"{% endif %}
  {% if description %}help-text="{{ description }}"{% endif %}
  {% if errors %}error="{{ errors }}"{% endif %}
  {% if required %}required{% endif %}
>
</hx-text-input>
```

### Step 3: Register the Theme Hook

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

```php
<?php
// src/Form/PatientIntakeForm.php
public function buildForm(array $form, FormStateInterface $form_state): array {
  $form['patient_name'] = [
    '#type' => 'helix_text_input',
    '#title' => $this->t('Patient Name'),
    '#description' => $this->t('Enter full legal name as it appears on insurance.'),
    '#required' => TRUE,
    '#default_value' => '',
    '#maxlength' => 255,
    '#placeholder' => $this->t('Jane Doe'),
  ];

  return $form;
}
```

**Rendered HTML:**

```html
<div class="form-item form-type-helix-text-input">
  <hx-text-input
    name="patient_name"
    label="Patient Name"
    help-text="Enter full legal name as it appears on insurance."
    placeholder="Jane Doe"
    maxlength="255"
    required
  ></hx-text-input>
</div>
```

## ElementInternals + Form API Integration

HELIX components use the `ElementInternals` API for native form participation. This allows web components to:

1. **Report their value** to the containing `<form>` (via `setFormValue()`)
2. **Trigger validation** (via `setValidity()`)
3. **Participate in form submission** (native `FormData` inclusion)

### How ElementInternals Works

```typescript
// Inside hx-text-input.ts
export class HelixTextInput extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  @property({ type: String })
  value = '';

  private _handleInput(e: InputEvent): void {
    const input = e.target as HTMLInputElement;
    this.value = input.value;

    // Report value to containing form.
    this._internals.setFormValue(this.value);

    // Dispatch custom event for Drupal behaviors.
    this.dispatchEvent(
      new CustomEvent('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }
}
```

### Form Submission Flow

```
User types "Jane Doe" in hx-text-input
  ↓
hx-input event fires (Drupal Behavior can listen)
  ↓
ElementInternals.setFormValue("Jane Doe")
  ↓
User clicks <button type="submit">
  ↓
Native <form> submit event fires
  ↓
FormData includes: { patient_name: "Jane Doe" }
  ↓
Drupal FormBuilder processes $_POST['patient_name']
  ↓
Form validation runs on server
  ↓
submitForm() receives $form_state with value
```

**Key benefit:** No JavaScript bridging code needed. The web component _is_ the form control.

## Form Value Handling

### Default Values

Set initial values using `#default_value`:

```php
$form['medical_record_number'] = [
  '#type' => 'helix_text_input',
  '#title' => $this->t('MRN'),
  '#default_value' => $patient->getMRN(),
];
```

The Twig template passes this to the `value` attribute:

```twig
<hx-text-input
  name="medical_record_number"
  label="MRN"
  value="{{ value }}"
></hx-text-input>
```

### Retrieving Values on Submit

```php
public function submitForm(array &$form, FormStateInterface $form_state): void {
  $patient_name = $form_state->getValue('patient_name');
  $mrn = $form_state->getValue('medical_record_number');

  // Save to database, API, etc.
  $this->patientStorage->create([
    'name' => $patient_name,
    'mrn' => $mrn,
  ])->save();

  $this->messenger()->addStatus($this->t('Patient record saved.'));
}
```

### Multi-Value Fields

For checkboxes or multi-select, use arrays:

```php
$form['conditions'] = [
  '#type' => 'helix_checkbox_group', // Hypothetical custom element
  '#title' => $this->t('Pre-existing Conditions'),
  '#options' => [
    'diabetes' => $this->t('Diabetes'),
    'hypertension' => $this->t('Hypertension'),
    'asthma' => $this->t('Asthma'),
  ],
  '#default_value' => ['diabetes', 'hypertension'],
];
```

Submit handler:

```php
$conditions = $form_state->getValue('conditions'); // ['diabetes', 'hypertension']
```

## Validation Integration

### Client-Side Validation

HELIX components handle HTML5 constraint validation automatically:

```html
<hx-text-input
  name="email"
  type="email"
  required
  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
></hx-text-input>
```

The browser prevents form submission if constraints aren't met.

### Server-Side Validation

Add Drupal validation handlers to the render array:

```php
$form['email'] = [
  '#type' => 'helix_text_input',
  '#title' => $this->t('Email Address'),
  '#required' => TRUE,
  '#element_validate' => [
    [$this, 'validateEmail'],
  ],
];
```

Validation callback:

```php
public function validateEmail(
  array &$element,
  FormStateInterface $form_state,
  array &$complete_form
): void {
  $value = $element['#value'];

  if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
    $form_state->setError($element, $this->t('Please enter a valid email address.'));
  }

  // Check for duplicate in database.
  if ($this->emailExists($value)) {
    $form_state->setError($element, $this->t('This email is already registered.'));
  }
}
```

### Displaying Validation Errors

Errors set via `$form_state->setError()` are automatically passed to the Twig template:

```twig
<hx-text-input
  name="{{ name }}"
  label="{{ label }}"
  value="{{ value }}"
  {% if errors %}error="{{ errors }}"{% endif %}
></hx-text-input>
```

The `hx-text-input` component displays the error in its UI:

```html
<hx-text-input
  name="email"
  label="Email Address"
  value="invalid-email"
  error="Please enter a valid email address."
></hx-text-input>
```

### ElementInternals Validation API

For advanced scenarios, components can use `setValidity()`:

```typescript
// Inside hx-text-input.ts
private _validateValue(value: string): void {
  if (this.required && !value) {
    this._internals.setValidity(
      { valueMissing: true },
      'This field is required.',
      this._inputElement
    );
  } else if (this.pattern && !new RegExp(this.pattern).test(value)) {
    this._internals.setValidity(
      { patternMismatch: true },
      'Please match the requested format.',
      this._inputElement
    );
  } else {
    this._internals.setValidity({}); // Clear validity
  }
}
```

This integrates with `:invalid` CSS pseudo-class and `form.reportValidity()`.

## Submission Handling

### Standard Form Submission

When `action` is set on the `<form>`, submission happens server-side:

```php
$form['#action'] = '/patient/intake/submit';
$form['#method'] = 'post';
```

Form submits to Drupal's routing system, and `submitForm()` runs on the server.

### AJAX Submission

Use Form API's `#ajax` property for AJAX-enabled form elements:

```php
$form['patient_name'] = [
  '#type' => 'helix_text_input',
  '#title' => $this->t('Patient Name'),
  '#ajax' => [
    'callback' => [$this, 'validatePatientName'],
    'event' => 'hx-change', // Listen for web component's custom event
    'wrapper' => 'patient-name-validation',
    'progress' => [
      'type' => 'throbber',
      'message' => $this->t('Validating...'),
    ],
  ],
];

$form['validation_result'] = [
  '#type' => 'markup',
  '#markup' => '',
  '#prefix' => '<div id="patient-name-validation">',
  '#suffix' => '</div>',
];
```

AJAX callback:

```php
public function validatePatientName(array &$form, FormStateInterface $form_state): array {
  $name = $form_state->getValue('patient_name');

  if ($this->patientExists($name)) {
    return [
      '#type' => 'markup',
      '#markup' => '<hx-alert variant="warning">A patient with this name already exists.</hx-alert>',
    ];
  }

  return [
    '#type' => 'markup',
    '#markup' => '<hx-alert variant="success">Name available.</hx-alert>',
  ];
}
```

### Client-Side Submission (No Action)

When no `action` is set, use `hx-form` for client-side submission:

```html
<hx-form>
  <hx-text-input name="query" label="Search"></hx-text-input>
  <hx-button type="submit">Search</hx-button>
</hx-form>
```

Listen for the `hx-submit` event in a Drupal Behavior:

```javascript
(function (Drupal, once) {
  Drupal.behaviors.helixFormClientSubmit = {
    attach(context) {
      once('helix-form-submit', 'hx-form', context).forEach((form) => {
        form.addEventListener('hx-submit', (e) => {
          const { values } = e.detail;
          console.log('Client-side submit:', values);

          // Make AJAX request, update UI, etc.
          fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          })
            .then((res) => res.json())
            .then((data) => {
              // Update results in DOM
            });
        });
      });
    },
  };
})(Drupal, once);
```

## AJAX Form Integration

Drupal's AJAX Form API allows partial form updates without full page reloads. HELIX components integrate seamlessly with this system.

### Listening to Custom Events

By default, Drupal listens for `change` events. To listen for HELIX component events (e.g., `hx-change`), specify the `event` key:

```php
$form['diagnosis_code'] = [
  '#type' => 'helix_text_input',
  '#title' => $this->t('ICD-10 Code'),
  '#ajax' => [
    'callback' => [$this, 'lookupDiagnosis'],
    'event' => 'hx-change', // Component event
    'wrapper' => 'diagnosis-description',
  ],
];

$form['diagnosis_description'] = [
  '#type' => 'markup',
  '#markup' => '',
  '#prefix' => '<div id="diagnosis-description">',
  '#suffix' => '</div>',
];
```

AJAX callback:

```php
public function lookupDiagnosis(array &$form, FormStateInterface $form_state): array {
  $code = $form_state->getValue('diagnosis_code');
  $description = $this->icd10Service->lookup($code);

  return [
    '#type' => 'markup',
    '#markup' => $description
      ? "<hx-prose>{$description}</hx-prose>"
      : '<hx-alert variant="error">Invalid ICD-10 code.</hx-alert>',
  ];
}
```

### Debouncing AJAX Requests

To avoid excessive server requests during typing, use Drupal Behaviors to debounce:

```javascript
(function (Drupal, debounce) {
  Drupal.behaviors.helixAjaxDebounce = {
    attach(context) {
      const inputs = once(
        'ajax-debounce',
        'hx-text-input[data-drupal-ajax-event="hx-change"]',
        context,
      );

      inputs.forEach((input) => {
        const debouncedChange = debounce(() => {
          // Trigger the original AJAX event
          input.dispatchEvent(
            new CustomEvent('hx-change', {
              bubbles: true,
              detail: { value: input.value },
            }),
          );
        }, 500); // 500ms debounce

        input.addEventListener('hx-input', debouncedChange);
      });
    },
  };
})(Drupal, Drupal.debounce);
```

### AJAX Commands

Drupal AJAX can execute commands (insert, replace, invoke) after a response. These work seamlessly with HELIX components:

```php
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\InvokeCommand;

public function submitAjax(array &$form, FormStateInterface $form_state): AjaxResponse {
  $response = new AjaxResponse();

  // Replace content
  $response->addCommand(new HtmlCommand(
    '#result-container',
    '<hx-alert variant="success">Form submitted successfully.</hx-alert>'
  ));

  // Call JavaScript method on component
  $response->addCommand(new InvokeCommand(
    'hx-text-input[name="patient_name"]',
    'reset' // If component has a reset() method
  ));

  return $response;
}
```

## Complete Example: Patient Intake Form

This example demonstrates a complete patient intake form using HELIX components in Drupal Form API.

### Form Class

```php
<?php
// src/Form/PatientIntakeForm.php
namespace Drupal\patient_portal\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;

class PatientIntakeForm extends FormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'patient_intake_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    // Patient Information Section
    $form['patient_info'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Patient Information'),
    ];

    $form['patient_info']['full_name'] = [
      '#type' => 'helix_text_input',
      '#title' => $this->t('Full Name'),
      '#description' => $this->t('Legal name as it appears on insurance.'),
      '#required' => TRUE,
      '#maxlength' => 255,
      '#placeholder' => $this->t('Jane Marie Doe'),
    ];

    $form['patient_info']['date_of_birth'] = [
      '#type' => 'helix_text_input',
      '#title' => $this->t('Date of Birth'),
      '#required' => TRUE,
      '#attributes' => ['type' => 'date'],
    ];

    $form['patient_info']['email'] = [
      '#type' => 'helix_text_input',
      '#title' => $this->t('Email Address'),
      '#required' => TRUE,
      '#attributes' => ['type' => 'email'],
      '#element_validate' => [[$this, 'validateEmail']],
    ];

    $form['patient_info']['phone'] = [
      '#type' => 'helix_text_input',
      '#title' => $this->t('Phone Number'),
      '#required' => TRUE,
      '#attributes' => ['type' => 'tel'],
      '#placeholder' => $this->t('(555) 123-4567'),
    ];

    // Medical History Section
    $form['medical_history'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Medical History'),
    ];

    $form['medical_history']['conditions'] = [
      '#type' => 'helix_textarea',
      '#title' => $this->t('Pre-existing Conditions'),
      '#description' => $this->t('List any chronic conditions, allergies, or ongoing treatments.'),
      '#rows' => 5,
    ];

    $form['medical_history']['medications'] = [
      '#type' => 'helix_textarea',
      '#title' => $this->t('Current Medications'),
      '#description' => $this->t('Include dosage and frequency.'),
      '#rows' => 5,
    ];

    // Emergency Contact Section
    $form['emergency_contact'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Emergency Contact'),
    ];

    $form['emergency_contact']['emergency_name'] = [
      '#type' => 'helix_text_input',
      '#title' => $this->t('Contact Name'),
      '#required' => TRUE,
    ];

    $form['emergency_contact']['emergency_phone'] = [
      '#type' => 'helix_text_input',
      '#title' => $this->t('Contact Phone'),
      '#required' => TRUE,
      '#attributes' => ['type' => 'tel'],
    ];

    $form['emergency_contact']['relationship'] = [
      '#type' => 'helix_select',
      '#title' => $this->t('Relationship'),
      '#required' => TRUE,
      '#options' => [
        '' => $this->t('- Select -'),
        'spouse' => $this->t('Spouse'),
        'parent' => $this->t('Parent'),
        'sibling' => $this->t('Sibling'),
        'child' => $this->t('Child'),
        'friend' => $this->t('Friend'),
        'other' => $this->t('Other'),
      ],
    ];

    // Consent
    $form['consent'] = [
      '#type' => 'helix_checkbox',
      '#title' => $this->t('I consent to treatment and acknowledge the privacy policy.'),
      '#required' => TRUE,
    ];

    // Submit Button
    $form['actions'] = [
      '#type' => 'actions',
    ];

    $form['actions']['submit'] = [
      '#type' => 'helix_button',
      '#value' => $this->t('Submit Intake Form'),
      '#button_type' => 'primary',
    ];

    return $form;
  }

  /**
   * Validates email address.
   */
  public function validateEmail(array &$element, FormStateInterface $form_state, array &$complete_form): void {
    $value = $element['#value'];

    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
      $form_state->setError($element, $this->t('Please enter a valid email address.'));
      return;
    }

    // Check for duplicate registration
    $existing = \Drupal::entityQuery('patient')
      ->condition('email', $value)
      ->accessCheck(FALSE)
      ->execute();

    if (!empty($existing)) {
      $form_state->setError($element, $this->t('This email address is already registered.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    // Additional cross-field validation
    $dob = $form_state->getValue('date_of_birth');
    $age = date_diff(date_create($dob), date_create('today'))->y;

    if ($age < 18) {
      $relationship = $form_state->getValue('relationship');
      if ($relationship !== 'parent') {
        $form_state->setErrorByName('relationship',
          $this->t('Emergency contact must be a parent for patients under 18.')
        );
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    // Create patient entity
    $patient = \Drupal::entityTypeManager()
      ->getStorage('patient')
      ->create([
        'full_name' => $form_state->getValue('full_name'),
        'date_of_birth' => $form_state->getValue('date_of_birth'),
        'email' => $form_state->getValue('email'),
        'phone' => $form_state->getValue('phone'),
        'conditions' => $form_state->getValue('conditions'),
        'medications' => $form_state->getValue('medications'),
        'emergency_name' => $form_state->getValue('emergency_name'),
        'emergency_phone' => $form_state->getValue('emergency_phone'),
        'emergency_relationship' => $form_state->getValue('relationship'),
        'consent_date' => time(),
      ]);

    $patient->save();

    $this->messenger()->addStatus(
      $this->t('Thank you, @name. Your intake form has been submitted.', [
        '@name' => $form_state->getValue('full_name'),
      ])
    );

    // Redirect to confirmation page
    $form_state->setRedirect('patient_portal.intake_confirmation', [
      'patient' => $patient->id(),
    ]);
  }

}
```

### Custom Element Plugins

Create render element plugins for each HELIX component:

```php
<?php
// src/Element/HelixButton.php
namespace Drupal\my_module\Element;

use Drupal\Core\Render\Element\Button;

/**
 * @FormElement("helix_button")
 */
class HelixButton extends Button {

  public function getInfo(): array {
    return [
      '#input' => TRUE,
      '#button_type' => 'button',
      '#theme_wrappers' => ['helix_button'],
    ] + parent::getInfo();
  }

}
```

```php
<?php
// src/Element/HelixTextarea.php
namespace Drupal\my_module\Element;

use Drupal\Core\Render\Element\Textarea;

/**
 * @FormElement("helix_textarea")
 */
class HelixTextarea extends Textarea {

  public function getInfo(): array {
    return [
      '#input' => TRUE,
      '#rows' => 5,
      '#cols' => 60,
      '#theme_wrappers' => ['helix_textarea'],
    ] + parent::getInfo();
  }

}
```

### Twig Templates

```twig
{# templates/helix-button.html.twig #}
<hx-button
  {{ attributes }}
  type="{{ element['#button_type'] }}"
  {% if element['#disabled'] %}disabled{% endif %}
>
  {{ element['#value'] }}
</hx-button>
```

```twig
{# templates/helix-textarea.html.twig #}
<hx-textarea
  {{ attributes }}
  {% if element['#title'] %}label="{{ element['#title'] }}"{% endif %}
  {% if element['#value'] %}value="{{ element['#value'] }}"{% endif %}
  {% if element['#description'] %}help-text="{{ element['#description'] }}"{% endif %}
  {% if element['#rows'] %}rows="{{ element['#rows'] }}"{% endif %}
  {% if element['#required'] %}required{% endif %}
  {% if element['#disabled'] %}disabled{% endif %}
>
</hx-textarea>
```

### Rendered Output

```html
<form method="post" action="/patient/intake" id="patient-intake-form">
  <fieldset>
    <legend>Patient Information</legend>

    <hx-text-input
      name="full_name"
      label="Full Name"
      help-text="Legal name as it appears on insurance."
      placeholder="Jane Marie Doe"
      maxlength="255"
      required
    ></hx-text-input>

    <hx-text-input name="date_of_birth" label="Date of Birth" type="date" required></hx-text-input>

    <hx-text-input name="email" label="Email Address" type="email" required></hx-text-input>

    <hx-text-input
      name="phone"
      label="Phone Number"
      type="tel"
      placeholder="(555) 123-4567"
      required
    ></hx-text-input>
  </fieldset>

  <fieldset>
    <legend>Medical History</legend>

    <hx-textarea
      name="conditions"
      label="Pre-existing Conditions"
      help-text="List any chronic conditions, allergies, or ongoing treatments."
      rows="5"
    ></hx-textarea>

    <hx-textarea
      name="medications"
      label="Current Medications"
      help-text="Include dosage and frequency."
      rows="5"
    ></hx-textarea>
  </fieldset>

  <fieldset>
    <legend>Emergency Contact</legend>

    <hx-text-input name="emergency_name" label="Contact Name" required></hx-text-input>

    <hx-text-input name="emergency_phone" label="Contact Phone" type="tel" required></hx-text-input>

    <hx-select name="relationship" label="Relationship" required>
      <option value="">- Select -</option>
      <option value="spouse">Spouse</option>
      <option value="parent">Parent</option>
      <option value="sibling">Sibling</option>
      <option value="child">Child</option>
      <option value="friend">Friend</option>
      <option value="other">Other</option>
    </hx-select>
  </fieldset>

  <hx-checkbox
    name="consent"
    label="I consent to treatment and acknowledge the privacy policy."
    required
  ></hx-checkbox>

  <hx-button type="submit" variant="primary"> Submit Intake Form </hx-button>
</form>
```

## Best Practices

### 1. Always Use ElementInternals

HELIX components implement `ElementInternals` for native form participation. Do not bypass this with custom JavaScript value extraction.

**Good:**

```typescript
// Component automatically reports value via ElementInternals
this._internals.setFormValue(this.value);
```

**Bad:**

```javascript
// Manually reading values in submit handler
document.querySelector('hx-text-input').value; // Fragile, bypasses form API
```

### 2. Preserve Drupal's Render Array Structure

Custom form elements should follow Drupal conventions for `#title`, `#description`, `#required`, etc. Don't invent new keys.

**Good:**

```php
$form['name'] = [
  '#type' => 'helix_text_input',
  '#title' => $this->t('Name'),
  '#required' => TRUE,
];
```

**Bad:**

```php
$form['name'] = [
  '#type' => 'helix_text_input',
  '#label' => $this->t('Name'), // Wrong key
  '#mandatory' => TRUE, // Wrong key
];
```

### 3. Map Attributes Consistently

In `preRender` or `process` callbacks, map Form API properties to HTML attributes in a predictable way:

- `#maxlength` → `maxlength`
- `#placeholder` → `placeholder`
- `#required` → `required` (boolean attribute)
- `#disabled` → `disabled` (boolean attribute)

### 4. Support Progressive Enhancement

HELIX components should render meaningful HTML even before JavaScript loads. Use slots and semantic markup:

```html
<hx-text-input name="email" label="Email">
  <!-- Fallback for no-JS -->
  <input type="email" name="email" placeholder="Email Address" slot="fallback" />
</hx-text-input>
```

### 5. Use Drupal's Validation System

Don't rely solely on client-side validation. Always implement `#element_validate` or `validateForm()` for security.

**Why:** Client-side validation can be bypassed. Server-side validation is mandatory for data integrity.

### 6. Leverage AJAX for Real-Time Feedback

For complex forms (patient intake, insurance verification), use AJAX to validate as the user types:

```php
'#ajax' => [
  'callback' => [$this, 'validateInsuranceNumber'],
  'event' => 'hx-change',
  'wrapper' => 'insurance-validation',
  'progress' => ['type' => 'throbber'],
],
```

### 7. Use Fieldsets for Grouping

Group related fields with `#type => 'fieldset'` for better accessibility and UX:

```php
$form['patient_info'] = [
  '#type' => 'fieldset',
  '#title' => $this->t('Patient Information'),
];

$form['patient_info']['name'] = [ /* ... */ ];
$form['patient_info']['dob'] = [ /* ... */ ];
```

### 8. Handle Multi-Step Forms

For wizard-style forms, use `$form_state` storage to track progress across steps:

```php
public function buildForm(array $form, FormStateInterface $form_state): array {
  $step = $form_state->get('step') ?? 1;

  switch ($step) {
    case 1:
      return $this->buildStepOne($form, $form_state);
    case 2:
      return $this->buildStepTwo($form, $form_state);
    case 3:
      return $this->buildStepThree($form, $form_state);
  }
}
```

### 9. Test Form API Integration

Write functional tests to verify form submission, validation, and error handling:

```php
public function testPatientIntakeForm(): void {
  $this->drupalGet('/patient/intake');

  $this->submitForm([
    'full_name' => 'Jane Doe',
    'date_of_birth' => '1990-01-01',
    'email' => 'jane@example.com',
    'phone' => '555-1234',
    'consent' => TRUE,
  ], 'Submit Intake Form');

  $this->assertSession()->pageTextContains('Your intake form has been submitted.');
}
```

### 10. Document Custom Form Elements

Add JSDoc-style comments to custom render element plugins for developer discoverability:

```php
/**
 * Provides an hx-text-input form element.
 *
 * Usage:
 * @code
 * $form['email'] = [
 *   '#type' => 'helix_text_input',
 *   '#title' => $this->t('Email'),
 *   '#required' => TRUE,
 * ];
 * @endcode
 *
 * @FormElement("helix_text_input")
 */
class HelixTextInput extends FormElement { /* ... */ }
```

## Summary

HELIX web components integrate seamlessly with Drupal's Form API through:

1. **Custom render elements** that bridge render arrays to web component HTML
2. **ElementInternals API** for native form participation without JavaScript glue
3. **Twig templates** that map Drupal's `#title`, `#description`, `#required` to component attributes
4. **Server-side validation** using `#element_validate` and `validateForm()`
5. **AJAX support** by listening to custom events (`hx-change`, `hx-input`)

This architecture maintains Drupal's security model, accessibility standards, and developer ergonomics while leveraging modern web component capabilities.

**Next Steps:**

- [Twig Patterns](/drupal-integration/twig/) - Learn template syntax
- [Drupal Behaviors](/drupal-integration/behaviors/) - Add client-side interactivity
- [Troubleshooting](/drupal-integration/troubleshooting/) - Debug integration issues

**External Resources:**

- [Form API Reference](https://api.drupal.org/api/drupal/elements) - Official Drupal documentation
- [ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) - MDN Web Docs
- [Form-Associated Custom Elements](https://web.dev/articles/more-capable-form-controls) - web.dev guide
