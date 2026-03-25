<?php

/**
 * @file
 * Theme and preprocess functions for HELiX UI Components.
 *
 * Each preprocess function maps Drupal's Form API render array variables
 * to the corresponding hx-* component attributes. These functions add
 * theme hook suggestions so Drupal resolves the correct HELiX template.
 *
 * Pattern: helix_module_preprocess_<element>() reads the incoming * Drupal element variables and
injects the normalized HELiX attribute * names that the Twig templates consume. */
declare(strict_types=1); /** * Prepares variables for text-field form inputs. * * Maps the Drupal
#type values text, email, password, number, tel, and url * to the hx-text-input component. Adds the
'helix_form_input' theme * suggestion so the correct template is rendered. * * @param array
$variables * Variables available to the template, as provided by form API. */ function
helix_module_preprocess_input(array &$variables): void { $element = $variables['element']; $type =
$element['#type'] ?? $element['#attributes']['type'] ?? 'text'; $helix_input_types = ['text',
'email', 'password', 'number', 'tel', 'url', 'search']; if (!in_array($type, $helix_input_types,
TRUE)) { return; } // Inject HELiX-mapped variables for the helix-form-input template.
$variables['helix_type'] = $type; $variables['helix_name'] = $element['#name'] ?? '';
$variables['helix_value'] = $element['#value'] ?? ''; $variables['helix_label'] = $element['#title']
?? ''; $variables['helix_placeholder'] = $element['#attributes']['placeholder'] ?? NULL;
$variables['helix_required'] = !empty($element['#required']); $variables['helix_disabled'] =
!empty($element['#attributes']['disabled']); $variables['helix_error'] =
!empty($variables['errors']) ? (string) $variables['errors'] : NULL; $variables['helix_help_text'] =
!empty($element['#description']) ? (string) $element['#description'] : NULL; // Theme suggestion:
input__text → helix_form_input. $variables['theme_hook_suggestions'][] = 'helix_form_input'; } /** *
Prepares variables for select form elements. * * Maps Drupal select elements to the hx-select
component. Options from * the render array #options key are normalised into the flat * [{value,
label}] structure the Twig template expects. * * @param array $variables * Variables available to
the template. */ function helix_module_preprocess_select(array &$variables): void { $element =
$variables['element']; $options = []; foreach (($element['#options'] ?? []) as $option_value =>
$option_label) { // Handle optgroup arrays (nested key => label pairs). if (is_array($option_label))
{ foreach ($option_label as $sub_value => $sub_label) { $options[] = ['value' => (string)
$sub_value, 'label' => (string) $sub_label]; } } else { $options[] = ['value' => (string)
$option_value, 'label' => (string) $option_label]; } } $variables['helix_label'] =
$element['#title'] ?? ''; $variables['helix_name'] = $element['#name'] ?? '';
$variables['helix_options'] = $options; $variables['helix_selected'] = $element['#value'] ?? NULL;
$variables['helix_required'] = !empty($element['#required']); $variables['helix_disabled'] =
!empty($element['#attributes']['disabled']); $variables['helix_error'] =
!empty($variables['errors']) ? (string) $variables['errors'] : NULL; $variables['helix_help_text'] =
!empty($element['#description']) ? (string) $element['#description'] : NULL;
$variables['theme_hook_suggestions'][] = 'helix_form_select'; } /** * Prepares variables for
checkbox form elements. * * Maps Drupal #type = 'checkbox' elements to hx-checkbox. The checked *
state is derived from #checked or by comparing #value to #return_value. * * @param array $variables
* Variables available to the template. */ function helix_module_preprocess_checkbox(array
&$variables): void { $element = $variables['element']; // Drupal sets #checked on preprocessed
checkbox elements. $checked = !empty($element['#checked']); $variables['helix_label'] =
$element['#title'] ?? ''; $variables['helix_name'] = $element['#name'] ?? '';
$variables['helix_value'] = $element['#return_value'] ?? 'on'; $variables['helix_checked'] =
$checked; $variables['helix_disabled'] = !empty($element['#attributes']['disabled']);
$variables['helix_required'] = !empty($element['#required']); $variables['helix_error'] =
!empty($variables['errors']) ? (string) $variables['errors'] : NULL; $variables['helix_help_text'] =
!empty($element['#description']) ? (string) $element['#description'] : NULL;
$variables['helix_size'] = $element['#attributes']['hx-size'] ?? 'md';
$variables['theme_hook_suggestions'][] = 'helix_checkbox'; } /** * Prepares variables for radio form
elements. * * Maps Drupal #type = 'radio' elements to hx-radio. Individual radio * elements are
typically rendered inside an hx-radio-group; this hook * handles the single-radio case in Drupal
Form API. * * @param array $variables * Variables available to the template. */ function
helix_module_preprocess_radio(array &$variables): void { $element = $variables['element'];
$variables['helix_label'] = $element['#title'] ?? ''; $variables['helix_name'] = $element['#name']
?? ''; $variables['helix_value'] = $element['#return_value'] ?? ''; $variables['helix_checked'] =
!empty($element['#checked']); $variables['helix_disabled'] =
!empty($element['#attributes']['disabled']); $variables['helix_required'] =
!empty($element['#required']); $variables['helix_error'] = !empty($variables['errors']) ? (string)
$variables['errors'] : NULL; $variables['theme_hook_suggestions'][] = 'helix_radio'; } /** *
Prepares variables for button and submit form elements. * * Maps Drupal #type = 'submit' and
'button' elements to hx-button. * The variant is determined from the button's CSS classes or a
custom * #helix_variant attribute if set on the element. * * @param array $variables * Variables
available to the template. */ function helix_module_preprocess_button(array &$variables): void {
$element = $variables['element']; // Allow themes to set an explicit HELiX variant on the render
element. $variant = $element['#helix_variant'] ?? 'primary'; // Map Drupal's built-in button roles
to sensible defaults when not overridden. if ($variant === 'primary') { $classes =
$element['#attributes']['class'] ?? []; if (in_array('button--danger', $classes, TRUE) ||
in_array('button--delete', $classes, TRUE)) { $variant = 'danger'; } elseif
(in_array('button--secondary', $classes, TRUE)) { $variant = 'secondary'; } }
$variables['helix_label'] = $element['#value'] ?? ''; $variables['helix_variant'] = $variant;
$variables['helix_type'] = $element['#type'] === 'submit' ? 'submit' : 'button';
$variables['helix_disabled'] = !empty($element['#attributes']['disabled']); $variables['helix_name']
= $element['#name'] ?? NULL; $variables['helix_value'] = $element['#attributes']['value'] ?? NULL;
$variables['helix_loading'] = !empty($element['#helix_loading']); $variables['helix_size'] =
$element['#attributes']['hx-size'] ?? 'md'; $variables['theme_hook_suggestions'][] = 'helix_button';
} /** * Prepares variables for general form element wrappers. * * This hook runs for all form
elements wrapped in a form-element template * (e.g. the label + description + error wrapper). It
ensures HELiX * components receive consistent description and error variable names. * * @param array
$variables * Variables available to the template. */ function
helix_module_preprocess_form_element(array &$variables): void { $element = $variables['element']; //
Expose a normalised helix_help_text variable for sub-templates. if
(!empty($element['#description'])) { $variables['helix_help_text'] = $element['#description']; } //
Expose helix_required flag for label rendering. $variables['helix_required'] =
!empty($element['#required']); // Expose the field type so sub-templates can conditionally apply
HELiX // component wrappers. $variables['helix_input_type'] = $element['#type'] ?? NULL; }
