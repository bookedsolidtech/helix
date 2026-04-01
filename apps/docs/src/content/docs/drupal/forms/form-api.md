---
title: Form API Integration
description: Integrating HELiX web components with Drupal's Form API using render arrays, #attributes, hook_theme, ElementInternals form participation, and #attached libraries.
sidebar:
  order: 1
---

Drupal's Form API is a server-side render pipeline that converts PHP arrays into HTML forms. HELiX web components integrate into this pipeline through custom render element plugins, Twig templates, and the browser's native `ElementInternals` API for form participation.

---

## How the Form API Works

The Form API uses **render arrays** — PHP associative arrays that describe structure and behavior. Each element has a `#type` key that maps to a render element plugin, which defines how the element is converted to HTML.

```
buildForm() returns render array
    ↓
FormBuilder expands #type keys via element plugins
    ↓
#process callbacks map API properties to #attributes
    ↓
Twig template renders #attributes onto the HTML element
    ↓
Browser: Custom Element upgrades, ElementInternals registers value
    ↓
submitForm() receives $form_state with submitted value
```

---

## Render Arrays and #attributes

The `#attributes` key passes arbitrary HTML attributes to the rendered element. This is the primary mechanism for passing HELiX component properties from PHP to HTML.

```php
<?php
// src/Form/ContactForm.php
public function buildForm(array $form, FormStateInterface $form_state): array {
  $form['full_name'] = [
    '#type' => 'helix_text_input',
    '#title' => $this->t('Full Name'),
    '#description' => $this->t('Enter your legal name.'),
    '#required' => TRUE,
    '#default_value' => '',
    '#maxlength' => 255,
    '#placeholder' => $this->t('Jane Doe'),
    '#attributes' => [
      'autocomplete' => 'name',
    ],
  ];

  $form['department'] = [
    '#type' => 'helix_select',
    '#title' => $this->t('Department'),
    '#required' => TRUE,
    '#options' => [
      '' => $this->t('- Select Department -'),
      'engineering' => $this->t('Engineering'),
      'clinical' => $this->t('Clinical'),
      'operations' => $this->t('Operations'),
    ],
  ];

  $form['actions']['#type'] = 'actions';
  $form['actions']['submit'] = [
    '#type' => 'submit',
    '#value' => $this->t('Submit'),
    '#attributes' => ['variant' => 'primary'],
  ];

  return $form;
}
```

**Key render array properties for HELiX components:**

| Property | Maps to Component Attribute | Notes |
|---|---|---|
| `#title` | `label` | Passed by custom element plugin |
| `#description` | `help-text` | Passed by custom element plugin |
| `#required` | `required` (boolean) | Mapped in `#process` callback |
| `#disabled` | `disabled` (boolean) | Mapped in `#process` callback |
| `#placeholder` | `placeholder` | Mapped in `#process` callback |
| `#default_value` | `value` | Mapped in `#pre_render` callback |
| `#attributes` | passed through directly | Arbitrary component attributes |

---

## Using hx-text-input, hx-select, hx-checkbox

With a custom element plugin in place (see [Element Plugin guide](/drupal/forms/element-plugin/)), forms use HELiX components exactly like native Drupal elements.

### Text Input

```php
$form['email'] = [
  '#type' => 'helix_text_input',
  '#title' => $this->t('Email Address'),
  '#required' => TRUE,
  '#attributes' => [
    'type' => 'email',
    'autocomplete' => 'email',
  ],
  '#element_validate' => [[$this, 'validateEmail']],
];
```

Rendered output:

```html
<hx-text-input
  name="email"
  type="email"
  label="Email Address"
  autocomplete="email"
  required
></hx-text-input>
```

### Select

```php
$form['role'] = [
  '#type' => 'helix_select',
  '#title' => $this->t('Role'),
  '#required' => TRUE,
  '#options' => [
    '' => $this->t('- Select -'),
    'admin' => $this->t('Administrator'),
    'editor' => $this->t('Editor'),
    'viewer' => $this->t('Viewer'),
  ],
  '#default_value' => 'editor',
];
```

Rendered output:

```html
<hx-select name="role" label="Role" required>
  <option value="">- Select -</option>
  <option value="admin">Administrator</option>
  <option value="editor" selected>Editor</option>
  <option value="viewer">Viewer</option>
</hx-select>
```

### Checkbox

```php
$form['agree_terms'] = [
  '#type' => 'helix_checkbox',
  '#title' => $this->t('I agree to the terms of service.'),
  '#required' => TRUE,
  '#return_value' => 'agreed',
];
```

Rendered output:

```html
<hx-checkbox
  name="agree_terms"
  label="I agree to the terms of service."
  value="agreed"
  required
></hx-checkbox>
```

---

## ElementInternals and Native Form Participation

HELiX form components implement the `ElementInternals` API (`formAssociated = true`). This allows them to participate in native HTML form submission without any JavaScript bridging code.

```typescript
// Inside hx-text-input (simplified)
export class HxTextInput extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  @property({ type: String }) value = '';

  private _handleInput(e: InputEvent): void {
    this.value = (e.target as HTMLInputElement).value;
    // Reports value directly to the containing <form>
    this._internals.setFormValue(this.value);
  }
}
```

**What this means for Drupal:**

- `FormData` collected on submit automatically includes the component's value under its `name`
- Drupal's `$_POST` contains the value just like a native `<input>`
- `$form_state->getValue('field_name')` works without any extra setup
- Server-side `#element_validate` callbacks receive the value in `$element['#value']`

### Confirming form association in the browser

```javascript
// DevTools console
const input = document.querySelector('hx-text-input[name="email"]');
console.log(input.form);   // Returns the parent <form> element
console.log(input.value);  // Returns current value
```

---

## Registering Twig Templates with hook_theme

Custom element plugins define a `#theme` key that maps to a Twig template registered via `hook_theme`.

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
    'helix_select' => [
      'render element' => 'element',
      'template' => 'helix-select',
    ],
    'helix_checkbox' => [
      'render element' => 'element',
      'template' => 'helix-checkbox',
    ],
    'helix_textarea' => [
      'render element' => 'element',
      'template' => 'helix-textarea',
    ],
  ];
}
```

The corresponding Twig template renders the component:

```twig
{# templates/helix-text-input.html.twig #}
<hx-text-input{{ attributes }}></hx-text-input>
```

All attributes — including `name`, `label`, `help-text`, `required`, `value`, and `error` — are collected into the `attributes` object by the element plugin's `#pre_render` callback before template rendering.

---

## Attaching Libraries with #attached

Use `#attached` to ensure the HELiX component library loads whenever a form element is rendered. This keeps library attachment co-located with the element definition.

### In a render element plugin

```php
public function getInfo(): array {
  return [
    '#input' => TRUE,
    '#theme' => 'helix_text_input',
    '#theme_wrappers' => ['form_element'],
    '#attached' => [
      'library' => ['my_module/helix-forms'],
    ],
  ];
}
```

### In a form builder

```php
public function buildForm(array $form, FormStateInterface $form_state): array {
  $form['#attached']['library'][] = 'my_module/helix-forms';

  $form['name'] = [
    '#type' => 'helix_text_input',
    '#title' => $this->t('Name'),
    '#required' => TRUE,
  ];

  return $form;
}
```

### Defining the library

```yaml
# my_module.libraries.yml
helix-forms:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/components/hx-text-input/index.js:
      type: external
      preprocess: false
      attributes:
        type: module
    https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/components/hx-select/index.js:
      type: external
      preprocess: false
      attributes:
        type: module
    https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/components/hx-checkbox/index.js:
      type: external
      preprocess: false
      attributes:
        type: module
  dependencies:
    - core/drupal
    - core/once
```

Or load the full bundle:

```yaml
helix-forms:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/index.js:
      type: external
      preprocess: false
      attributes:
        type: module
```

---

## Validation Integration

### #element_validate

Server-side validation callbacks receive the submitted value and can set errors on the form state:

```php
$form['phone'] = [
  '#type' => 'helix_text_input',
  '#title' => $this->t('Phone'),
  '#required' => TRUE,
  '#attributes' => ['type' => 'tel'],
  '#element_validate' => [[$this, 'validatePhone']],
];
```

```php
public function validatePhone(
  array &$element,
  FormStateInterface $form_state,
  array &$complete_form
): void {
  $value = $element['#value'];
  if (!preg_match('/^\+?[\d\s\-().]{7,20}$/', $value)) {
    $form_state->setError($element, $this->t('Enter a valid phone number.'));
  }
}
```

### Displaying validation errors

The element plugin's `#pre_render` callback passes `$element['#errors']` to the `error` attribute on the component. No additional template logic is required:

```html
<!-- With a validation error, the component receives: -->
<hx-text-input
  name="phone"
  label="Phone"
  value="+1-invalid"
  error="Enter a valid phone number."
  aria-invalid="true"
></hx-text-input>
```

### AJAX form validation

```php
$form['mrn'] = [
  '#type' => 'helix_text_input',
  '#title' => $this->t('MRN'),
  '#required' => TRUE,
  '#ajax' => [
    'callback' => [$this, 'validateMrnAjax'],
    'event' => 'hx-change',
    'wrapper' => 'mrn-validation-result',
    'progress' => ['type' => 'throbber'],
  ],
];

$form['mrn_result'] = [
  '#type' => 'markup',
  '#markup' => '',
  '#prefix' => '<div id="mrn-validation-result">',
  '#suffix' => '</div>',
];
```

```php
public function validateMrnAjax(array &$form, FormStateInterface $form_state): array {
  $mrn = $form_state->getValue('mrn');
  $exists = $this->patientStorage->mrnExists($mrn);

  return [
    '#markup' => $exists
      ? '<hx-alert variant="warning">MRN already registered.</hx-alert>'
      : '<hx-alert variant="success">MRN available.</hx-alert>',
  ];
}
```

Note: HELiX components emit `hx-change` on commit, not native `change`. The `event` key in `#ajax` maps directly to the DOM event name that triggers the AJAX request.

---

## Complete Form Example

```php
<?php
namespace Drupal\my_module\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;

class UserProfileForm extends FormBase {

  public function getFormId(): string {
    return 'user_profile_form';
  }

  public function buildForm(array $form, FormStateInterface $form_state): array {
    $form['#attached']['library'][] = 'my_module/helix-forms';

    $form['personal'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Personal Information'),
    ];

    $form['personal']['full_name'] = [
      '#type' => 'helix_text_input',
      '#title' => $this->t('Full Name'),
      '#required' => TRUE,
      '#maxlength' => 255,
      '#attributes' => ['autocomplete' => 'name'],
    ];

    $form['personal']['email'] = [
      '#type' => 'helix_text_input',
      '#title' => $this->t('Email'),
      '#required' => TRUE,
      '#attributes' => ['type' => 'email', 'autocomplete' => 'email'],
      '#element_validate' => [[$this, 'validateEmail']],
    ];

    $form['personal']['role'] = [
      '#type' => 'helix_select',
      '#title' => $this->t('Role'),
      '#required' => TRUE,
      '#options' => [
        '' => $this->t('- Select -'),
        'admin' => $this->t('Administrator'),
        'editor' => $this->t('Editor'),
      ],
    ];

    $form['consent'] = [
      '#type' => 'helix_checkbox',
      '#title' => $this->t('I agree to the terms of service.'),
      '#required' => TRUE,
      '#return_value' => 'agreed',
    ];

    $form['actions']['#type'] = 'actions';
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Save Profile'),
    ];

    return $form;
  }

  public function validateEmail(array &$element, FormStateInterface $form_state, array &$complete_form): void {
    if (!filter_var($element['#value'], FILTER_VALIDATE_EMAIL)) {
      $form_state->setError($element, $this->t('Enter a valid email address.'));
    }
  }

  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $this->messenger()->addStatus($this->t('Profile saved for @name.', [
      '@name' => $form_state->getValue('full_name'),
    ]));
  }

}
```

---

## Best Practices

- Use `#element_validate` for all server-side validation — never rely solely on client-side HTML5 constraints.
- Always set `#input => TRUE` in the element plugin's `getInfo()` so Drupal handles value extraction and CSRF protection.
- Use standard Form API keys (`#title`, `#description`, `#required`, `#default_value`) rather than inventing new ones. Element plugins map these to component attributes consistently.
- Attach component libraries through `#attached` on the element plugin or the form, not via raw `<script>` tags in templates.
- Use the `hx-change` event (not `change`) in `#ajax['event']` because HELiX inputs dispatch their own custom events.

---

## Related

- [Form Element Plugins](/drupal/forms/element-plugin/) — How to create custom `@FormElement` plugins
- [Behaviors](/drupal/behaviors/fundamentals/) — Attaching JavaScript lifecycle to form components
- [AJAX Integration](/drupal/ajax/) — Full AJAX command reference with HELiX components
