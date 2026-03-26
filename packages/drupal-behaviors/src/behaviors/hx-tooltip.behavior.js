/**
 * @file
 * Drupal behavior for hx-tooltip components.
 */

/* global Drupal, once */
(function (Drupal, once) {
  'use strict';

  /**
   * HELiX Tooltip behavior.
   *
   * Attaches to wrapper elements with [data-drupal-tooltip].
   * Reads data-content and data-placement from data attributes.
   * Ensures keyboard accessibility with escape-to-dismiss.
   *
   * @example
   * <div data-drupal-tooltip data-content="More information" data-placement="top">
   *   <hx-tooltip>...</hx-tooltip>
   * </div>
   */
  Drupal.behaviors.hxTooltip = {
    attach: function (context) {
      once('hx-tooltip', '[data-drupal-tooltip]', context).forEach(function (element) {
        var tooltip =
          element.tagName.toLowerCase() === 'hx-tooltip'
            ? element
            : element.querySelector('hx-tooltip');
        if (!tooltip) return;

        // Initialize content and placement from data attributes
        if (element.dataset.content) {
          tooltip.setAttribute('content', element.dataset.content);
        }
        if (element.dataset.placement) {
          tooltip.setAttribute('placement', element.dataset.placement);
        }

        // Escape key to dismiss for keyboard users
        element.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') {
            tooltip.open = false;
          }
        });
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-tooltip', '[data-drupal-tooltip]', context);
      }
    },
  };
})(Drupal, once);
