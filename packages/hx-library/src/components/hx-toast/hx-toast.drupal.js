/* global Drupal */

/**
 * @file hx-toast.drupal.js
 * Drupal behaviors for programmatic toast triggering via hx-toast.
 *
 * Attach trigger elements with a `data-hx-toast` attribute containing a JSON
 * object of toast options. The behavior calls the imperative `toast()` utility
 * from @wc-2026/library when the trigger is clicked.
 *
 * @example Twig template
 *   <button
 *     data-hx-toast='{"message":"Record saved.","variant":"success","duration":4000}'
 *   >
 *     Save Record
 *   </button>
 *
 * @example Programmatic trigger (data attributes)
 *   <button
 *     data-hx-toast='{"message":"Medication interaction detected.","variant":"warning"}'
 *   >
 *     Check Interactions
 *   </button>
 */

(function (Drupal) {
  'use strict';

  Drupal.behaviors.hxToast = {
    /**
     * Attach click handlers to elements with `data-hx-toast` attributes.
     *
     * @param {HTMLElement|Document} context - The DOM context from Drupal.
     */
    attach: function (context) {
      context.querySelectorAll('[data-hx-toast]').forEach(function (trigger) {
        if (trigger.dataset.hxToastAttached) {
          return;
        }
        trigger.dataset.hxToastAttached = 'true';

        trigger.addEventListener('click', function () {
          var rawOptions;
          try {
            rawOptions = JSON.parse(trigger.dataset.hxToast);
          } catch {
            Drupal.announce(
              Drupal.t('Toast configuration is invalid. Contact your site administrator.'),
              'assertive',
            );
            return;
          }

          import('@wc-2026/library/components/hx-toast/index.js')
            .then(function (module) {
              module.toast(rawOptions);
            })
            .catch(function () {
              Drupal.announce(
                Drupal.t('Unable to display notification. Please try again.'),
                'assertive',
              );
            });
        });
      });
    },

    /**
     * Detach: remove the attached marker so re-attachment works on partial DOM
     * updates (e.g., AJAX replaced content).
     *
     * @param {HTMLElement|Document} context - The DOM context from Drupal.
     * @param {object} _settings - Drupal settings (unused).
     * @param {string} trigger - Detach trigger ('unload' | 'serialize').
     */
    detach: function (context, _settings, trigger) {
      if (trigger !== 'unload') {
        return;
      }
      context.querySelectorAll('[data-hx-toast]').forEach(function (el) {
        delete el.dataset.hxToastAttached;
      });
    },
  };
})(Drupal);
