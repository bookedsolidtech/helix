/**
 * @file
 * Drupal behavior for hx-dialog components.
 */

/* global Drupal, once */
(function (Drupal, once) {
  'use strict';

  /**
   * HELiX Dialog behavior.
   *
   * Attaches to wrapper elements with [data-drupal-dialog].
   * Binds trigger elements and handles AJAX-complete dialog opening.
   *
   * @example
   * <div data-drupal-dialog data-trigger-selector="#open-dialog-btn">
   *   <hx-dialog>...</hx-dialog>
   * </div>
   * <button id="open-dialog-btn">Open</button>
   */
  Drupal.behaviors.hxDialog = {
    attach: function (context) {
      once('hx-dialog', '[data-drupal-dialog]', context).forEach(function (element) {
        var dialog =
          element.tagName.toLowerCase() === 'hx-dialog'
            ? element
            : element.querySelector('hx-dialog');
        if (!dialog) return;

        var triggerSelector = element.dataset.triggerSelector;
        var triggerEl = triggerSelector ? document.querySelector(triggerSelector) : null;

        // Bind trigger element to open the dialog
        if (triggerEl) {
          triggerEl.addEventListener('click', function () {
            dialog.open = true;
          });
        }

        // Return focus to trigger on close
        dialog.addEventListener('hx-close', function () {
          dialog.open = false;
          if (triggerEl) {
            triggerEl.focus();
          }
        });

        dialog.addEventListener('hx-cancel', function () {
          dialog.open = false;
          if (triggerEl) {
            triggerEl.focus();
          }
        });
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-dialog', '[data-drupal-dialog]', context);
      }
    },
  };
})(Drupal, once);
