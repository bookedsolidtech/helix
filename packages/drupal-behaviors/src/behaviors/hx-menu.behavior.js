/**
 * @file
 * Drupal behavior for hx-menu components.
 */

/* global Drupal, once */
(function (Drupal, once) {
  'use strict';

  /**
   * HELiX Menu behavior.
   *
   * Attaches to wrapper elements with [data-drupal-menu].
   * Handles click-outside closing and escape key dismissal.
   *
   * @example
   * <div data-drupal-menu>
   *   <hx-menu>...</hx-menu>
   * </div>
   */
  Drupal.behaviors.hxMenu = {
    attach: function (context) {
      once('hx-menu', '[data-drupal-menu]', context).forEach(function (element) {
        var menu =
          element.tagName.toLowerCase() === 'hx-menu' ? element : element.querySelector('hx-menu');
        if (!menu) return;

        // Click-outside to close
        function closeOnOutside(event) {
          if (!element.contains(event.target)) {
            menu.open = false;
          }
        }

        document.addEventListener('click', closeOnOutside);
        element._hxMenuCloseHandler = closeOnOutside;

        // Escape key to close
        element.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') {
            menu.open = false;
          }
        });
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-menu', '[data-drupal-menu]', context).forEach(function (element) {
          if (element._hxMenuCloseHandler) {
            document.removeEventListener('click', element._hxMenuCloseHandler);
            delete element._hxMenuCloseHandler;
          }
        });
      }
    },
  };
})(Drupal, once);
