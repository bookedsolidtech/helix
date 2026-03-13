/* global Drupal, once */

/**
 * @file hx-split-button.drupal.js
 * Drupal behaviors for wiring hx-split-button analytics and AJAX actions.
 *
 * ## Basic Event Listening
 *
 * hx-split-button dispatches two events that Drupal behaviors can intercept:
 *
 * - `hx-click`  — fired when the primary button is activated.
 *                 detail: { originalEvent: MouseEvent }
 * - `hx-select` — fired when a dropdown menu item is selected.
 *                 detail: { value: string, label: string }
 *
 * Both events bubble and are composed, so they can be captured at any ancestor.
 *
 * ## AJAX Action Pattern
 *
 * Add `data-hx-split-button-action` to the host element with the AJAX endpoint
 * URL for the primary button action. Add `data-hx-menu-action-<value>` for
 * per-menu-item AJAX endpoints.
 *
 * @example Twig — primary action with AJAX
 *   <hx-split-button
 *     label="Save Record"
 *     data-hx-split-button-action="/admin/records/{{ node.id }}/save"
 *   >
 *     <hx-menu-item slot="menu" value="draft">Save as Draft</hx-menu-item>
 *     <hx-menu-item slot="menu" value="publish">Publish</hx-menu-item>
 *   </hx-split-button>
 *
 * @example Twig — per-item AJAX actions
 *   <hx-split-button
 *     label="Save Record"
 *     data-hx-split-button-action="/records/save"
 *     data-hx-menu-action-draft="/records/save-draft"
 *     data-hx-menu-action-publish="/records/publish"
 *   >
 *     <hx-menu-item slot="menu" value="draft">Save as Draft</hx-menu-item>
 *     <hx-menu-item slot="menu" value="publish">Publish</hx-menu-item>
 *   </hx-split-button>
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Wire primary button `hx-click` events to AJAX actions.
   *
   * Targets any `hx-split-button[data-hx-split-button-action]` element and
   * executes a Drupal AJAX request when the primary button is activated.
   */
  Drupal.behaviors.hxSplitButtonPrimary = {
    /**
     * @param {HTMLElement|Document} context
     */
    attach: function (context) {
      once(
        'hx-split-button-primary',
        'hx-split-button[data-hx-split-button-action]',
        context,
      ).forEach(function (el) {
        el.addEventListener('hx-click', function () {
          var url = el.dataset.hxSplitButtonAction;
          if (url) {
            Drupal.ajax({ url: url }).execute();
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
      once.remove(
        'hx-split-button-primary',
        'hx-split-button[data-hx-split-button-action]',
        context,
      );
    },
  };

  /**
   * Wire dropdown `hx-select` events to per-item AJAX actions.
   *
   * When a menu item is selected, looks for a `data-hx-menu-action-<value>`
   * attribute on the host element and executes the corresponding AJAX request.
   *
   * Example: selecting a menu item with value="draft" will look for
   * `data-hx-menu-action-draft` on the hx-split-button host.
   */
  Drupal.behaviors.hxSplitButtonMenu = {
    /**
     * @param {HTMLElement|Document} context
     */
    attach: function (context) {
      once('hx-split-button-menu', 'hx-split-button', context).forEach(function (el) {
        el.addEventListener('hx-select', function (e) {
          var value = e.detail && e.detail.value;
          if (!value) {
            return;
          }
          // Convert value to dataset key: "save-draft" → "hxMenuActionSaveDraft"
          var normalized = String(value).replace(/[-_]+([a-zA-Z0-9])/g, function (_, c) {
            return c.toUpperCase();
          });
          var dataKey = 'hxMenuAction' + normalized.charAt(0).toUpperCase() + normalized.slice(1);

          var url = el.dataset[dataKey];
          if (url) {
            Drupal.ajax({ url: url }).execute();
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
      once.remove('hx-split-button-menu', 'hx-split-button', context);
    },
  };
})(Drupal, once);
