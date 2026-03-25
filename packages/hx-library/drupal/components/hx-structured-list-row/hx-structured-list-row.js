/**
 * HX Structured List Row - Drupal SDC integration.
 * Registers the custom element and initializes adopted stylesheets.
 */
import '@helixui/library/components/hx-structured-list-row';

// Initialize adopted stylesheets for shadow DOM style injection
// @see https://www.drupal.org/project/adopted_stylesheets
if (typeof window !== 'undefined' && window.AdoptedStylesheetsController) {
  new window.AdoptedStylesheetsController('hx-structured-list-row');
}
