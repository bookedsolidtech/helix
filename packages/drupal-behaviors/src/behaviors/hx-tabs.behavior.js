/**
 * @file
 * Drupal behavior for hx-tabs components.
 */

/* global Drupal, once */
(function (Drupal, once) {
  'use strict';

  /**
   * HELiX Tabs behavior.
   *
   * Attaches to wrapper elements with [data-drupal-tabs].
   * Reads data-active-tab for initial active tab selection.
   * Syncs active tab with URL hash for direct linking.
   *
   * @example
   * <div data-drupal-tabs data-active-tab="overview">
   *   <hx-tabs>...</hx-tabs>
   * </div>
   */
  Drupal.behaviors.hxTabs = {
    attach: function (context) {
      once('hx-tabs', '[data-drupal-tabs]', context).forEach(function (element) {
        var tabs =
          element.tagName.toLowerCase() === 'hx-tabs' ? element : element.querySelector('hx-tabs');
        if (!tabs) return;

        // Activate tab from URL hash first, then data attribute
        var hash = window.location.hash.slice(1);
        var initialTab = hash || element.dataset.activeTab;
        if (initialTab) {
          tabs.setAttribute('active', initialTab);
        }

        // Sync URL hash on tab change for direct linking
        tabs.addEventListener('hx-change', function (event) {
          if (event.detail && event.detail.value) {
            history.replaceState(null, '', '#' + event.detail.value);
          }
        });
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-tabs', '[data-drupal-tabs]', context);
      }
    },
  };
})(Drupal, once);
