/**
 * @file
 * Drupal behavior for hx-toast components.
 */

/* global Drupal, once */
(function (Drupal, once) {
  'use strict';

  /**
   * HELiX Toast behavior.
   *
   * Attaches to wrapper elements with [data-drupal-toast].
   * Reads data-duration for auto-dismiss timing and data-show to auto-display.
   *
   * @example
   * <div data-drupal-toast data-duration="5000" data-show="true">
   *   <hx-toast>Success! Your changes have been saved.</hx-toast>
   * </div>
   */
  Drupal.behaviors.hxToast = {
    attach: function (context) {
      once('hx-toast', '[data-drupal-toast]', context).forEach(function (element) {
        var toast =
          element.tagName.toLowerCase() === 'hx-toast'
            ? element
            : element.querySelector('hx-toast');
        if (!toast) return;

        // Set auto-dismiss duration from data attribute
        var duration = parseInt(element.dataset.duration, 10);
        if (duration > 0) {
          toast.setAttribute('duration', String(duration));
        }

        // Wire close button
        var closeBtn = element.querySelector('[data-toast-close]');
        if (closeBtn) {
          closeBtn.addEventListener('click', function () {
            toast.open = false;
          });
        }

        // Auto-show if requested
        if (element.dataset.show === 'true') {
          toast.open = true;
        }
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-toast', '[data-drupal-toast]', context);
      }
    },
  };
})(Drupal, once);
