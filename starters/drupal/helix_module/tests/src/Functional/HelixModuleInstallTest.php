<?php

declare(strict_types=1);

namespace Drupal\Tests\helix_module\Functional;

use Drupal\Tests\BrowserTestBase;

/**
 * Tests that the HELiX module installs correctly and attaches assets.
 *
 * Verifies:
 *   - The module can be installed without errors.
 *   - The helix_module/helix library is attached on standard pages.
 *   - The CDN script tag is present with type="module".
 *   - HELiX Twig templates exist and render hx-* elements.
 *
 * @group helix_module
 */
class HelixModuleInstallTest extends BrowserTestBase {

  /**
   * Modules to enable for this test.
   *
   * @var array<string>
   */
  protected static $modules = ['helix_module'];

  /**
   * The default theme to use for functional tests.
   *
   * @var string
   */
  protected $defaultTheme = 'stark';

  /**
   * Tests that the module installs without throwing exceptions.
   */
  public function testModuleInstalls(): void {
    $this->assertTrue(
      \Drupal::moduleHandler()->moduleExists('helix_module'),
      'The helix_module is installed.'
    );
  }

  /**
   * Tests that the HELiX CDN library is attached on a standard page.
   *
   * The module attaches helix_module/helix via hook_page_attachments(), which
   * loads the @helixui/library bundle from the jsDelivr CDN as a module script.
   */
  public function testHelixLibraryIsAttached(): void {
    $this->drupalGet('<front>');
    $this->assertSession()->statusCodeEquals(200);

    // The CDN script tag should be present on the page.
    $this->assertSession()->elementExists('css', 'script[src*="cdn.jsdelivr.net"]');
  }

  /**
   * Tests that the CDN script uses type="module" for ES module loading.
   *
   * HELiX components are ES modules. The type="module" attribute is required
   * for the browser to parse and execute the bundle correctly.
   */
  public function testHelixScriptIsTypeModule(): void {
    $this->drupalGet('<front>');

    $scripts = $this->getSession()->getPage()->findAll(
      'css',
      'script[src*="helixui"]'
    );

    $found_module = FALSE;
    foreach ($scripts as $script) {
      if ($script->getAttribute('type') === 'module') {
        $found_module = TRUE;
        break;
      }
    }

    $this->assertTrue(
      $found_module,
      'A script tag with type="module" loading @helixui/library was found.'
    );
  }

  /**
   * Tests that the Drupal behaviors JS is loaded alongside the component bundle.
   *
   * The helix.behaviors.js file bridges HELiX custom events to Drupal AJAX
   * and must be present on every page where helix_module/helix is attached.
   */
  public function testHelixBehaviorsJsIsLoaded(): void {
    $this->drupalGet('<front>');

    $this->assertSession()->elementExists(
      'css',
      'script[src*="helix.behaviors"]'
    );
  }

  /**
   * Tests that HELiX Twig templates are registered as theme hooks.
   *
   * helix_module_theme() registers all hx-* component theme hooks. Verifies
   * that the key hooks exist in the theme registry.
   */
  public function testHelixThemeHooksAreRegistered(): void {
    /** @var \Drupal\Core\Theme\Registry $theme_registry */
    $theme_registry = \Drupal::service('theme.registry');
    $registry = $theme_registry->getRuntime();

    $expected_hooks = [
      'helix_button',
      'helix_card',
      'helix_form_input',
      'helix_form_select',
      'helix_alert',
      'helix_badge',
      'helix_checkbox',
      'helix_radio',
      'helix_tooltip',
      'helix_modal',
    ];

    foreach ($expected_hooks as $hook) {
      $this->assertArrayHasKey(
        $hook,
        $registry->get(),
        sprintf('Theme hook "%s" is registered.', $hook)
      );
    }
  }

  /**
   * Tests that helix_button renders an hx-button element.
   *
   * Renders the helix_button theme hook via the Drupal renderer and verifies
   * that the output contains an hx-button custom element tag.
   */
  public function testHelixButtonTemplateRendersHxButton(): void {
    $render = [
      '#theme'   => 'helix_button',
      '#label'   => 'Save Record',
      '#variant' => 'primary',
      '#type'    => 'submit',
    ];

    $output = (string) \Drupal::service('renderer')->renderInIsolation($render);

    $this->assertStringContainsString('<hx-button', $output, 'helix_button theme hook renders an hx-button element.');
    $this->assertStringContainsString('Save Record', $output, 'Button label is present in rendered output.');
    $this->assertStringContainsString('variant="primary"', $output, 'Button variant attribute is rendered.');
  }

  /**
   * Tests that helix_alert renders an hx-alert element.
   *
   * Verifies the alert template maps variant and message to the correct
   * hx-alert attributes.
   */
  public function testHelixAlertTemplateRendersHxAlert(): void {
    $render = [
      '#theme'   => 'helix_alert',
      '#variant' => 'error',
      '#message' => 'An error occurred.',
      '#title'   => 'Submission failed',
    ];

    $output = (string) \Drupal::service('renderer')->renderInIsolation($render);

    $this->assertStringContainsString('<hx-alert', $output, 'helix_alert theme hook renders an hx-alert element.');
    $this->assertStringContainsString('variant="error"', $output, 'Alert variant attribute is rendered.');
    $this->assertStringContainsString('An error occurred.', $output, 'Alert message is present in rendered output.');
  }

}
