---
title: Form Element Plugins
description: Creating custom Drupal FormElement plugins that wrap HELiX web components, including getInfo(), #input, #process, #pre_render, #element_validate, and valueCallback.
sidebar:
  order: 2
---

A FormElement plugin makes a HELiX component available as a first-class `#type` in the Drupal Form API. Without one, using a web component in a form requires constructing raw HTML strings — bypassing validation, AJAX support, and CSRF protection. With one, you write `'#type' => 'helix_text_input'` and the Form API handles the rest.

This guide walks through the complete anatomy of a FormElement plugin using `helix_text_input` as the primary example, then provides abbreviated examples for `helix_select` and `helix_checkbox`.

---

## Plugin Architecture

Drupal discovers FormElement plugins by scanning `src/Element/` directories in enabled modules. The `@FormElement` annotation registers the plugin ID.

```text
@FormElement("helix_text_input")
    ↓
Plugin discovery (cache)
    ↓
getInfo() → returns default render array properties
    ↓
#process callbacks → map Form API keys to #attributes
    ↓
#pre_render callbacks → set label, help-text, error on #attributes
    ↓
#theme hook → Twig template renders <hx-text-input{{ attributes }}>
    ↓
Browser: ElementInternals reports value to <form>
```

---

## Creating helix_text_input

### Plugin class

```php
<?php
// src/Element/HelixTextInput.php
namespace Drupal\my_module\Element;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element\FormElementBase;

/**
 * Provides an hx-text-input form element.
 *
 * Usage:
 * @code
 * $form['email'] = [
 *   '#type' => 'helix_text_input',
 *   '#title' => $this->t('Email Address'),
 *   '#required' => TRUE,
 *   '#attributes' => ['type' => 'email'],
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
      // #input = TRUE tells FormBuilder this element submits a value.
      // Enables CSRF token handling, value extraction, and #default_value.
      '#input' => TRUE,

      // Default property values
      '#maxlength' => 255,
      '#size' => 60,

      // Process callbacks transform render array keys into #attributes.
      '#process' => [
        [$class, 'processHelixTextInput'],
        [$class, 'processAjaxForm'],   // Enables #ajax support
      ],

      // Pre-render callbacks run just before Twig rendering.
      '#pre_render' => [
        [$class, 'preRenderHelixTextInput'],
      ],

      // Twig template hook (registered in hook_theme).
      '#theme' => 'helix_text_input',

      // form_element wrapper adds .form-item div, handles error display.
      '#theme_wrappers' => ['form_element'],

      // Attach the component library automatically.
      '#attached' => [
        'library' => ['my_module/helix-forms'],
      ],
    ];
  }

  /**
   * {@inheritdoc}
   *
   * Determines the value shown in the element. Called during form processing.
   */
  public static function valueCallback(
    &$element,
    $input,
    FormStateInterface $form_state
  ) {
    // $input is FALSE before form submission, otherwise contains POST value.
    if ($input !== FALSE && $input !== NULL) {
      return (string) $input;
    }
    return $element['#default_value'] ?? '';
  }

  /**
   * Process callback: maps Form API properties to HTML attributes.
   *
   * Runs during form build. Transforms standard Drupal keys (#required,
   * #placeholder, etc.) into the #attributes array consumed by the Twig
   * template.
   */
  public static function processHelixTextInput(
    array &$element,
    FormStateInterface $form_state,
    array &$complete_form
  ): array {
    // name attribute is required for form submission to work.
    $element['#attributes']['name'] = $element['#name'];

    // Optional: input type (text, email, password, tel, url, number).
    if (!empty($element['#input_type'])) {
      $element['#attributes']['type'] = $element['#input_type'];
    }

    if (!empty($element['#maxlength'])) {
      $element['#attributes']['maxlength'] = $element['#maxlength'];
    }

    if (!empty($element['#placeholder'])) {
      $element['#attributes']['placeholder'] = $element['#placeholder'];
    }

    if (!empty($element['#required'])) {
      $element['#attributes']['required'] = 'required';
      $element['#attributes']['aria-required'] = 'true';
    }

    if (!empty($element['#disabled'])) {
      $element['#attributes']['disabled'] = 'disabled';
    }

    if (!empty($element['#readonly'])) {
      $element['#attributes']['readonly'] = 'readonly';
    }

    if (!empty($element['#pattern'])) {
      $element['#attributes']['pattern'] = $element['#pattern'];
    }

    // hx-text-input does NOT expose or forward min/max/step — those
    // belong on a numeric input. For numeric ranges, build a separate
    // `helix_number_input` plugin that renders <hx-number-input>
    // (which exposes min/max/step natively).

    // Pass current value to the component.
    if (isset($element['#value']) && $element['#value'] !== '') {
      $element['#attributes']['value'] = $element['#value'];
    }

    return $element;
  }

  /**
   * Pre-render callback: maps title, description, and errors to component
   * attributes just before Twig rendering.
   *
   * Pre-render runs after process. Separating these concerns keeps process
   * focused on structural attributes and pre-render focused on presentation.
   */
  public static function preRenderHelixTextInput(array $element): array {
    // Map #title → label attribute on the component.
    if (!empty($element['#title'])) {
      $element['#attributes']['label'] = (string) $element['#title'];
    }

    // Map #description → help-text attribute on the component.
    if (!empty($element['#description'])) {
      $element['#attributes']['help-text'] = (string) $element['#description'];
    }

    // Map Form API errors → error attribute on the component.
    if (!empty($element['#errors'])) {
      $element['#attributes']['error'] = (string) $element['#errors'];
      $element['#attributes']['aria-invalid'] = 'true';
    }

    return $element;
  }

}
```

### Twig template

```twig
{# templates/helix-text-input.html.twig #}
{#
 * All attributes (name, type, value, label, help-text, required, error, etc.)
 * are collected into the `attributes` object by the pre_render callback.
 * Rendering {{ attributes }} onto the element is sufficient.
 #}
<hx-text-input{{ attributes }}></hx-text-input>
```

### hook_theme registration

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

After creating the plugin and template, clear caches:

```bash
drush cr
```

### Usage

```php
$form['username'] = [
  '#type' => 'helix_text_input',
  '#title' => $this->t('Username'),
  '#description' => $this->t('Between 3 and 32 characters.'),
  '#required' => TRUE,
  '#maxlength' => 32,
  '#placeholder' => $this->t('jane.doe'),
  '#element_validate' => [[$this, 'validateUsername']],
];
```

---

## The #input Flag

`'#input' => TRUE` is the most important property in `getInfo()`. It signals to the Form API that:

1. This element **submits a value** — Drupal processes its `$_POST` key
2. The `valueCallback()` method controls how the submitted value is extracted
3. CSRF token validation applies
4. `#default_value` is respected
5. `$form_state->getValue('field_name')` returns the element's value in submit handlers

Without `#input => TRUE`, the element renders but its value is ignored by Drupal.

---

## #process vs #pre_render

These two callback arrays serve different purposes:

| Callback | Runs | Purpose |
|---|---|---|
| `#process` | During form build | Add child elements, map structural attributes, integrate AJAX |
| `#pre_render` | Just before Twig | Map label/description/errors, final attribute adjustments |

The separation exists because `#process` callbacks can add nested elements to the render array (e.g., a hidden input alongside the component), while `#pre_render` operates on the finalized structure.

---

## #element_validate

Validation callbacks are configured by the form builder, not the element plugin. They receive `$element['#value']` — the already-extracted submitted value — and call `$form_state->setError()` to fail validation:

```php
public function validateUsername(
  array &$element,
  FormStateInterface $form_state,
  array &$complete_form
): void {
  $value = $element['#value'];

  if (strlen($value) < 3) {
    $form_state->setError($element, $this->t('Username must be at least 3 characters.'));
    return;
  }

  if (!preg_match('/^[a-z0-9._-]+$/i', $value)) {
    $form_state->setError($element, $this->t('Username may only contain letters, numbers, periods, underscores, and hyphens.'));
  }
}
```

Drupal passes errors set this way back to the element's `#errors` key on the next render cycle, and the `preRenderHelixTextInput` callback maps that to the component's `error` attribute automatically.

---

## helix_select Plugin

```php
<?php
// src/Element/HelixSelect.php
namespace Drupal\my_module\Element;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element\FormElementBase;

/**
 * @FormElement("helix_select")
 */
class HelixSelect extends FormElementBase {

  public function getInfo(): array {
    $class = static::class;

    // hx-select is a single-value combobox — there is no `multiple`
    // attribute, no array value handling, and no name[] mutation. For
    // multi-value selection use hx-combobox or hx-checkbox-group; build
    // a separate element plugin (helix_combobox / helix_checkbox_group)
    // for those cases.

    return [
      '#input' => TRUE,
      '#options' => [],
      '#process' => [
        [$class, 'processHelixSelect'],
        [$class, 'processAjaxForm'],
      ],
      '#pre_render' => [
        [$class, 'preRenderHelixSelect'],
      ],
      '#theme' => 'helix_select',
      '#theme_wrappers' => ['form_element'],
      '#attached' => [
        'library' => ['my_module/helix-forms'],
      ],
    ];
  }

  public static function valueCallback(&$element, $input, FormStateInterface $form_state) {
    if ($input !== FALSE && $input !== NULL) {
      return (string) $input;
    }
    return $element['#default_value'] ?? '';
  }

  public static function processHelixSelect(
    array &$element,
    FormStateInterface $form_state,
    array &$complete_form
  ): array {
    $element['#attributes']['name'] = $element['#name'];

    if (!empty($element['#required'])) {
      $element['#attributes']['required'] = 'required';
    }

    if (!empty($element['#disabled'])) {
      $element['#attributes']['disabled'] = 'disabled';
    }

    // Store options and selected value for the template.
    $element['#helix_options'] = $element['#options'];
    $element['#helix_value'] = $element['#value'] ?? $element['#default_value'] ?? '';

    return $element;
  }

  public static function preRenderHelixSelect(array $element): array {
    if (!empty($element['#title'])) {
      $element['#attributes']['label'] = (string) $element['#title'];
    }
    if (!empty($element['#description'])) {
      $element['#attributes']['help-text'] = (string) $element['#description'];
    }
    if (!empty($element['#errors'])) {
      $element['#attributes']['error'] = (string) $element['#errors'];
    }
    return $element;
  }

}
```

Twig template:

```twig
{# templates/helix-select.html.twig #}
<hx-select{{ attributes }}>
  {% for key, label in element['#helix_options'] %}
    <option value="{{ key }}" {% if element['#helix_value'] == key %}selected{% endif %}>
      {{- label -}}
    </option>
  {% endfor %}
</hx-select>
```

---

## helix_checkbox Plugin

```php
<?php
// src/Element/HelixCheckbox.php
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
      '#attached' => [
        'library' => ['my_module/helix-forms'],
      ],
    ];
  }

  public static function valueCallback(&$element, $input, FormStateInterface $form_state) {
    // A submitted-but-unchecked checkbox arrives as NULL — treat it as
    // unchecked regardless of #default_value. Only fall back to
    // #default_value during the pre-submit FALSE case (initial render).
    if ($input === FALSE) {
      return !empty($element['#default_value']) ? $element['#return_value'] : 0;
    }
    return $input !== NULL ? $element['#return_value'] : 0;
  }

  public static function processHelixCheckbox(
    array &$element,
    FormStateInterface $form_state,
    array &$complete_form
  ): array {
    $element['#attributes']['name'] = $element['#name'];
    $element['#attributes']['value'] = $element['#return_value'];

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
    if (!empty($element['#title'])) {
      $element['#attributes']['label'] = (string) $element['#title'];
    }
    if (!empty($element['#description'])) {
      $element['#attributes']['help-text'] = (string) $element['#description'];
    }
    if (!empty($element['#errors'])) {
      $element['#attributes']['error'] = (string) $element['#errors'];
    }
    return $element;
  }

}
```

Twig template:

```twig
{# templates/helix-checkbox.html.twig #}
<hx-checkbox{{ attributes }}></hx-checkbox>
```

---

## Plugin Discovery and Cache

Drupal discovers plugins at cache build time. After creating or modifying a plugin class:

```bash
drush cr
```

To verify a plugin is registered:

```bash
drush eval "var_dump(array_key_exists('helix_text_input', \Drupal::service('plugin.manager.element_info')->getDefinitions()));"
```

---

## Template Suggestions

Add template suggestions so themes can override specific element types:

```php
/**
 * Implements hook_theme_suggestions_helix_text_input().
 */
function my_module_theme_suggestions_helix_text_input(array $variables): array {
  $suggestions = [];
  $element = $variables['element'];

  // Suggestion by input type (e.g., helix-text-input--email.html.twig)
  if (!empty($element['#input_type'])) {
    $suggestions[] = 'helix_text_input__' . $element['#input_type'];
  }

  return $suggestions;
}
```

---

## Summary

A complete FormElement plugin for a HELiX component requires:

1. **Plugin class** in `src/Element/` with `@FormElement` annotation
2. **`getInfo()`** — sets `#input`, `#theme`, `#theme_wrappers`, `#process`, `#pre_render`, `#attached`
3. **`valueCallback()`** — extracts submitted value from `$_POST`
4. **`#process` callback** — maps `#required`, `#placeholder`, `#maxlength`, etc. to `#attributes`
5. **`#pre_render` callback** — maps `#title`, `#description`, `#errors` to component-specific attributes
6. **Twig template** — renders the chosen HELiX tag with the collected attribute object, e.g. `<hx-text-input{{ attributes }}></hx-text-input>`
7. **`hook_theme()`** — registers the template

Once registered, any form can use `'#type' => 'helix_text_input'` with full Form API support.

---

## Related

- [Form API Integration](/drupal/forms/form-api/) — Render arrays, AJAX, submission handling
- [Twig Attributes](/drupal/twig-templates/attributes/) — How Drupal's `attributes` object works
- [AJAX Integration](/drupal/ajax/) — Wiring `#ajax` to HELiX component events
