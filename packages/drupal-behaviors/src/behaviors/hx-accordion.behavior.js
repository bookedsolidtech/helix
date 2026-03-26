/**
 * @file
 * Drupal behavior for hx-accordion components.
 */

/* global Drupal, once */
(function (Drupal, once) {
  'use strict';

  /**
   * HELiX Accordion behavior.
   *
   * Attaches to wrapper elements with [data-drupal-accordion].
   * Reads data-open-first to auto-expand the first panel on initialization.
   *
   * @example
   * <div data-drupal-accordion data-open-first="true">
   *   <hx-accordion>...</hx-accordion>
   * </div>
   */
  Drupal.behaviors.hxAccordion = {
    attach: function (context) {
      once('hx-accordion', '[data-drupal-accordion]', context).forEach(function (element) {
        var accordion =
          element.tagName.toLowerCase() === 'hx-accordion'
            ? element
            : element.querySelector('hx-accordion');
        if (!accordion) return;

        // Auto-expand first panel from data attribute
        if (element.dataset.openFirst === 'true') {
          var firstPanel = accordion.querySelector('hx-accordion-panel');
          if (firstPanel) {
            firstPanel.open = true;
          }
        }

        // Announce panel state changes for screen readers
        accordion.addEventListener('hx-open', function () {
          if (typeof Drupal.announce === 'function') {
            Drupal.announce(Drupal.t('Panel expanded'));
          }
        });

        accordion.addEventListener('hx-close', function () {
          if (typeof Drupal.announce === 'function') {
            Drupal.announce(Drupal.t('Panel collapsed'));
          }
        });
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-accordion', '[data-drupal-accordion]', context);
      }
    },
  };
})(Drupal, once);
