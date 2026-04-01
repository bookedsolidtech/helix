/**
 * @file
 * Drupal behavior for hx-popover components.
 */

/* global Drupal, once */
(function (Drupal, once) {
  'use strict';

  /**
   * HELiX Popover behavior.
   *
   * Attaches to wrapper elements with [data-drupal-popover].
   * Reads data-placement and data-trigger (hover|click) from data attributes.
   * Handles escape key and click-outside dismissal.
   *
   * @example
   * <div data-drupal-popover data-placement="bottom" data-trigger="click">
   *   <hx-popover>...</hx-popover>
   * </div>
   */
  Drupal.behaviors.hxPopover = {
    attach: function (context) {
      once('hx-popover', '[data-drupal-popover]', context).forEach(function (element) {
        var popover =
          element.tagName.toLowerCase() === 'hx-popover'
            ? element
            : element.querySelector('hx-popover');
        if (!popover) return;

        // Initialize placement from data attribute
        if (element.dataset.placement) {
          popover.setAttribute('placement', element.dataset.placement);
        }

        // Escape key to close
        element.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') {
            popover.open = false;
          }
        });

        // Click-outside to close for click-triggered popovers
        if (element.dataset.trigger === 'click') {
          function closeOnOutside(event) {
            if (!element.contains(event.target)) {
              popover.open = false;
            }
          }
          document.addEventListener('click', closeOnOutside);
          element._hxPopoverCloseHandler = closeOnOutside;
        }
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-popover', '[data-drupal-popover]', context).forEach(function (element) {
          if (element._hxPopoverCloseHandler) {
            document.removeEventListener('click', element._hxPopoverCloseHandler);
            delete element._hxPopoverCloseHandler;
          }
        });
      }
    },
  };
})(Drupal, once);
