/* global Drupal, once, document */

/**
 * @file hx-drawer.drupal.js
 * Drupal behaviors for wiring open/close triggers to hx-drawer elements.
 *
 * ## Trigger Pattern
 *
 * Add `data-hx-drawer-trigger` and `data-hx-drawer-target` attributes to any
 * clickable element to wire it as a drawer trigger. The `data-hx-drawer-target`
 * value must match the `id` attribute on the target `<hx-drawer>` element.
 *
 * @example Twig — open trigger
 *   <button
 *     data-hx-drawer-trigger
 *     data-hx-drawer-target="patient-detail-drawer"
 *   >
 *     View Patient Details
 *   </button>
 *
 * @example Twig — drawer element
 *   <hx-drawer id="patient-detail-drawer" placement="end" size="lg">
 *     <span slot="label">Patient Details</span>
 *     <!-- drawer body content -->
 *   </hx-drawer>
 *
 * ## Close Trigger Pattern
 *
 * Add `data-hx-drawer-close` and `data-hx-drawer-target` to any element
 * to wire it as an explicit close trigger (in addition to the built-in
 * close button and Escape key).
 *
 * @example Twig — close trigger
 *   <button
 *     data-hx-drawer-close
 *     data-hx-drawer-target="patient-detail-drawer"
 *   >
 *     Cancel
 *   </button>
 *
 * ## Event Listening
 *
 * Listen for hx-drawer events in a separate behavior or extend this one:
 *
 * @example
 *   once('my-drawer-events', '#patient-detail-drawer', context).forEach((el) => {
 *     el.addEventListener('hx-show', () => {
 *       // Drawer is beginning to open — load content via AJAX if needed
 *     });
 *     el.addEventListener('hx-after-hide', () => {
 *       // Drawer has fully closed — refresh the parent view if needed
 *     });
 *   });
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Wire open triggers to hx-drawer elements.
   *
   * Finds all elements with [data-hx-drawer-trigger] and attaches a click
   * handler that calls .show() on the target drawer.
   */
  Drupal.behaviors.hxDrawerTrigger = {
    /**
     * @param {HTMLElement|Document} context
     */
    attach: function (context) {
      once('hx-drawer-trigger', '[data-hx-drawer-trigger]', context).forEach(function (trigger) {
        trigger.addEventListener('click', function () {
          var targetId = trigger.dataset.hxDrawerTarget;
          if (!targetId) {
            return;
          }
          var drawer = document.getElementById(targetId);
          if (drawer && typeof drawer.show === 'function') {
            drawer.show();
          }
        });
      });
    },

    /**
     * @param {HTMLElement|Document} context
     * @param {object} _settings
     * @param {string} trigger
     */
    detach: function (context, _settings, trigger) {
      if (trigger !== 'unload') {
        return;
      }
      // once() tracks attached nodes — no manual cleanup needed for the
      // event listeners themselves. Removing the once key allows re-attachment
      // after content is rebuilt by AJAX.
      once.remove('hx-drawer-trigger', '[data-hx-drawer-trigger]', context);
    },
  };

  /**
   * Wire explicit close triggers to hx-drawer elements.
   *
   * Finds all elements with [data-hx-drawer-close] and attaches a click
   * handler that calls .hide() on the target drawer.
   */
  Drupal.behaviors.hxDrawerClose = {
    /**
     * @param {HTMLElement|Document} context
     */
    attach: function (context) {
      once('hx-drawer-close', '[data-hx-drawer-close]', context).forEach(function (trigger) {
        trigger.addEventListener('click', function () {
          var targetId = trigger.dataset.hxDrawerTarget;
          if (!targetId) {
            return;
          }
          var drawer = document.getElementById(targetId);
          if (drawer && typeof drawer.hide === 'function') {
            drawer.hide();
          }
        });
      });
    },

    /**
     * @param {HTMLElement|Document} context
     * @param {object} _settings
     * @param {string} trigger
     */
    detach: function (context, _settings, trigger) {
      if (trigger !== 'unload') {
        return;
      }
      once.remove('hx-drawer-close', '[data-hx-drawer-close]', context);
    },
  };
})(Drupal, once);
