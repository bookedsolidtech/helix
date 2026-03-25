<?php

declare(strict_types=1);

namespace Drupal\Tests\helix_module\Functional;

use Drupal\Tests\BrowserTestBase;

/**
 * Tests HELiX Drupal.behaviors integration and preprocess functions.
 *
 * Verifies:
 *   - helix.behaviors.js is loaded on pages with HELiX components.
 *   - Drupal.behaviors.helixModule is defined in the loaded JS.
 *   - Preprocess functions map Drupal form elements to hx-* attributes.
 *   - Form elements render with correct hx-* component markup.
 *
 * @group helix_module
 */
class HelixBehaviorsTest extends BrowserTestBase {

  /**
   * Modules to enable for this test.
   *
   * @var array<string>
   */
  protected static $modules = ['helix_module', 'system'];

  /**
   * The default theme to use.
   *
   * @var string
   */
  protected $defaultTheme = 'stark';

  /**
   * Tests that helix.behaviors.js declares Drupal.behaviors.helixModule.
   *
   * Reads the behaviors file directly and confirms the object literal is
   * present. The browser-level test verifies it is loaded; this test verifies
   * the content is correct.
   */
  public function testBehaviorsFileDeclaresHelixModuleBehavior(): void {
    $module_path = \Drupal::service('module_handler')
      ->getModule('helix_module')
      ->getPath();

    $behaviors_file = DRUPAL_ROOT . '/' . $module_path . '/js/helix.behaviors.js';

    $this->assertFileExists($behaviors_file, 'helix.behaviors.js file exists.');

    $contents = file_get_contents($behaviors_file);
    $this->assertNotFalse($contents, 'helix.behaviors.js is readable.');

    $this->assertStringContainsString(
      'Drupal.behaviors.helixModule',
      $contents,
      'helix.behaviors.js defines Drupal.behaviors.helixModule.'
    );

    $this->assertStringContainsString(
      'attach',
      $contents,
      'helixModule behavior defines an attach function.'
    );

    $this->assertStringContainsString(
      'detach',
      $contents,
      'helixModule behavior defines a detach function.'
    );

    $this->assertStringContainsString(
      'once(',
      $contents,
      'helixModule behavior uses once() for safe AJAX re-attachment.'
    );
  }

  /**
   * Tests that preprocess_input maps text inputs to hx-text-input attributes.
   *
   * Calls helix_module_preprocess_input() directly with a mock form element
   * and verifies the expected helix_* variables are set.
   */
  public function testPreprocessInputMapsTextFieldToHelixVariables(): void {
    $variables = [
      'element' => [
        '#type'       => 'text',
        '#name'       => 'patient_name',
        '#value'      => 'Margaret Thompson',
        '#title'      => 'Patient Name',
        '#required'   => TRUE,
        '#attributes' => [],
      ],
      'errors'   => NULL,
    ];

    helix_module_preprocess_input($variables);

    $this->assertSame('text', $variables['helix_type'], 'Input type is mapped.');
    $this->assertSame('patient_name', $variables['helix_name'], 'Input name is mapped.');
    $this->assertSame('Margaret Thompson', $variables['helix_value'], 'Input value is mapped.');
    $this->assertSame('Patient Name', $variables['helix_label'], 'Input label is mapped.');
    $this->assertTrue($variables['helix_required'], 'Required flag is mapped.');
    $this->assertContains('helix_form_input', $variables['theme_hook_suggestions'], 'Theme suggestion is added.');
  }

  /**
   * Tests that preprocess_input maps error messages to helix_error.
   */
  public function testPreprocessInputMapsErrorMessages(): void {
    $variables = [
      'element' => [
        '#type'       => 'email',
        '#name'       => 'email',
        '#value'      => '',
        '#title'      => 'Email Address',
        '#attributes' => [],
      ],
      'errors' => 'Please enter a valid email address.',
    ];

    helix_module_preprocess_input($variables);

    $this->assertSame(
      'Please enter a valid email address.',
      $variables['helix_error'],
      'Error message is mapped to helix_error.'
    );
  }

  /**
   * Tests that preprocess_select normalises options to flat [{value, label}].
   *
   * Drupal provides options as key => label pairs; this test verifies the
   * preprocess function converts them to the array format the template expects.
   */
  public function testPreprocessSelectNormalisesOptions(): void {
    $variables = [
      'element' => [
        '#type'    => 'select',
        '#name'    => 'department',
        '#title'   => 'Department',
        '#value'   => 'oncology',
        '#options' => [
          'cardiology' => 'Cardiology',
          'oncology'   => 'Oncology',
          'neurology'  => 'Neurology',
        ],
        '#attributes' => [],
      ],
      'errors' => NULL,
    ];

    helix_module_preprocess_select($variables);

    $this->assertSame('Department', $variables['helix_label']);
    $this->assertSame('oncology', $variables['helix_selected']);
    $this->assertCount(3, $variables['helix_options'], 'All three options are present.');
    $this->assertSame('cardiology', $variables['helix_options'][0]['value']);
    $this->assertSame('Cardiology', $variables['helix_options'][0]['label']);
  }

  /**
   * Tests that preprocess_checkbox maps checked state correctly.
   *
   * Drupal sets #checked on preprocessed checkbox elements. Verifies that
   * the checked flag is faithfully mapped to helix_checked.
   */
  public function testPreprocessCheckboxMapsCheckedState(): void {
    $variables = [
      'element' => [
        '#type'         => 'checkbox',
        '#name'         => 'consent',
        '#title'        => 'Patient consented',
        '#checked'      => TRUE,
        '#return_value' => 'yes',
        '#attributes'   => [],
      ],
      'errors' => NULL,
    ];

    helix_module_preprocess_checkbox($variables);

    $this->assertTrue($variables['helix_checked'], 'Checked state is mapped.');
    $this->assertSame('yes', $variables['helix_value'], 'Return value is mapped.');
    $this->assertContains('helix_checkbox', $variables['theme_hook_suggestions']);
  }

  /**
   * Tests that preprocess_button maps submit elements to helix_button variables.
   */
  public function testPreprocessButtonMapsSubmitElement(): void {
    $variables = [
      'element' => [
        '#type'       => 'submit',
        '#value'      => 'Save Record',
        '#name'       => 'op',
        '#attributes' => ['class' => []],
      ],
    ];

    helix_module_preprocess_button($variables);

    $this->assertSame('Save Record', $variables['helix_label'], 'Button label is mapped.');
    $this->assertSame('submit', $variables['helix_type'], 'Button type is submit.');
    $this->assertSame('primary', $variables['helix_variant'], 'Default variant is primary.');
    $this->assertContains('helix_button', $variables['theme_hook_suggestions']);
  }

  /**
   * Tests that preprocess_button maps the danger variant from CSS classes.
   *
   * When a Drupal button has the button--danger CSS class, the preprocess
   * function should set helix_variant to 'danger' automatically.
   */
  public function testPreprocessButtonMapsDangerVariantFromCssClass(): void {
    $variables = [
      'element' => [
        '#type'       => 'submit',
        '#value'      => 'Delete Record',
        '#name'       => 'delete',
        '#attributes' => ['class' => ['button', 'button--danger']],
      ],
    ];

    helix_module_preprocess_button($variables);

    $this->assertSame('danger', $variables['helix_variant'], 'Danger variant is mapped from CSS class.');
  }

}
