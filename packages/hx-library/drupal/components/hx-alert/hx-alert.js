/**
 * HX Alert - Drupal SDC integration.
 * Registers the custom element and initializes adopted stylesheets.
 */
import '@helixui/library/components/hx-alert';

// Initialize adopted stylesheets for shadow DOM style injection
// @see https://www.drupal.org/project/adopted_stylesheets
if (typeof window !== 'undefined' && window.AdoptedStylesheetsController) {
  new window.AdoptedStylesheetsController('hx-alert');
}
