/**
 * HX Carousel Item - Drupal SDC integration.
 * Registers the custom element and initializes adopted stylesheets.
 */
import '@helixui/library/components/hx-carousel-item';

// Initialize adopted stylesheets for shadow DOM style injection
// @see https://www.drupal.org/project/adopted_stylesheets
if (typeof window !== 'undefined' && window.AdoptedStylesheetsController) {
  new window.AdoptedStylesheetsController('hx-carousel-item');
}
