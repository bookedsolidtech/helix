/**
 * @file
 * Drupal behavior for hx-drawer components.
 */

/* global Drupal, once */
(function (Drupal, once) {
  'use strict';

  /**
   * HELiX Drawer behavior.
   *
   * Attaches to wrapper elements with [data-drupal-drawer].
   * Reads data-trigger-selector, data-direction, and data-size.
   * Manages body scroll lock when drawer is open.
   *
   * @example
   * <div data-drupal-drawer data-trigger-selector="#nav-toggle" data-direction="left">
   *   <hx-drawer>...</hx-drawer>
   * </div>
   */
  Drupal.behaviors.hxDrawer = {
    attach: function (context) {
      once('hx-drawer', '[data-drupal-drawer]', context).forEach(function (element) {
        var drawer =
          element.tagName.toLowerCase() === 'hx-drawer'
            ? element
            : element.querySelector('hx-drawer');
        if (!drawer) return;

        // Initialize from data attributes
        if (element.dataset.direction) {
          drawer.setAttribute('direction', element.dataset.direction);
        }
        if (element.dataset.size) {
          drawer.setAttribute('size', element.dataset.size);
        }

        var triggerSelector = element.dataset.triggerSelector;
        var triggerEl = triggerSelector ? document.querySelector(triggerSelector) : null;

        // Bind trigger element
        if (triggerEl) {
          triggerEl.addEventListener('click', function () {
            drawer.open = true;
          });
        }

        // Body scroll lock while drawer is open
        drawer.addEventListener('hx-open', function () {
          document.body.style.overflow = 'hidden';
        });

        drawer.addEventListener('hx-close', function () {
          document.body.style.overflow = '';
          if (triggerEl) {
            triggerEl.focus();
          }
        });
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-drawer', '[data-drupal-drawer]', context).forEach(function () {
          document.body.style.overflow = '';
        });
      }
    },
  };
})(Drupal, once);
