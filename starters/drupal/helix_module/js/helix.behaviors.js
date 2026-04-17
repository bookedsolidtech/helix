/**
 * @file
 * Drupal.behaviors integration for HELiX UI Components.
 *
 * Bridges HELiX custom events (hx-click, hx-change, hx-close, etc.)
 * to Drupal AJAX and form patterns. Uses once() to prevent double-
 * attachment on AJAX-refreshed page regions.
 *
 * Components are self-initializing custom elements — this file handles
 * only the Drupal-specific integration layer (AJAX, navigation, forms).
 *
 * @see https://cdn.jsdelivr.net/npm/@helixui/library/dist/
 */

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixModule = {
    /**
     * Attaches HELiX behaviors to the given context.
     *
     * Called on initial page load and after every Drupal AJAX response.
     * The once() utility prevents duplicate attachment to the same element.
     *
     * @param {Element|Document} context - The DOM context to search within.
     * @param {object} settings - Drupal.settings object.
     */
    attach: function (context, settings) {
      // AJAX bridge via data-helix-ajax attribute.
      // Any HELiX component with data-helix-ajax="<url>" executes a Drupal
      // AJAX request on hx-click (buttons, cards) or native click (fallback).
      //
      // Usage in Twig:
      //   <hx-button data-helix-ajax="/ajax/save-draft">Save Draft</hx-button>
      once('helix-ajax-bridge', '[data-helix-ajax]', context).forEach(function (el) {
        var eventName = el.tagName.indexOf('HX-') === 0 ? 'hx-click' : 'click';
        el.addEventListener(eventName, function () {
          var ajaxUrl = el.getAttribute('data-helix-ajax');
          if (ajaxUrl && Drupal.ajax) {
            Drupal.ajax({ url: ajaxUrl }).execute();
          }
        });
      });

      // Card navigation bridge.
      // hx-card components with hx-href dispatch hx-click with
      // detail: { href, originalEvent }. Bridge to Drupal navigation.
      once('helix-card-nav', 'hx-card[hx-href]', context).forEach(function (card) {
        card.addEventListener('hx-click', function (e) {
          if (e.detail && e.detail.href) {
            window.location.href = e.detail.href;
          }
        });
      });

      // Dialog trigger wiring.
      // Elements with data-hx-dialog-trigger="<dialog-id>" open the matching
      // hx-dialog. The component's open property is the idiomatic API — it
      // respects the dialog's modal configuration automatically.
      //
      // Usage:
      //   <hx-button data-hx-dialog-trigger="confirm-dialog">Open</hx-button>
      //   <hx-dialog id="confirm-dialog" heading="Confirm">...</hx-dialog>
      once('helix-dialog-trigger', '[data-hx-dialog-trigger]', context).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var dialogId = btn.getAttribute('data-hx-dialog-trigger');
          if (dialogId) {
            var dialog = document.getElementById(dialogId);
            if (dialog) {
              dialog.open = true;
            }
          }
        });
      });

      // Dialog AJAX on close.
      // hx-dialog elements with data-ajax-close="<url>" execute an AJAX
      // request when the dialog closes. Useful for refreshing form regions.
      once('helix-dialog-ajax-close', 'hx-dialog[data-ajax-close]', context).forEach(function (el) {
        el.addEventListener('hx-close', function () {
          var ajaxUrl = el.getAttribute('data-ajax-close');
          if (ajaxUrl && Drupal.ajax) {
            Drupal.ajax({ url: ajaxUrl }).execute();
          }
        });
      });

      // Badge dismiss bridge.
      // Removable hx-badge elements with data-ajax-remove="<url>" execute an
      // AJAX request when dismissed.
      //
      // Usage:
      //   <hx-badge removable data-ajax-remove="/api/badge/dismiss/42">New</hx-badge>
      once('helix-badge-remove', 'hx-badge[removable][data-ajax-remove]', context).forEach(function (badge) {
        badge.addEventListener('hx-remove', function () {
          var ajaxUrl = badge.getAttribute('data-ajax-remove');
          if (ajaxUrl && Drupal.ajax) {
            Drupal.ajax({ url: ajaxUrl }).execute();
          }
        });
      });
    },

    /**
     * Detaches HELiX behaviors when elements are removed by AJAX.
     *
     * Web components clean up their own shadow DOM listeners on disconnect.
     * Listeners registered via once() are garbage collected with their elements.
     *
     * @param {Element|Document} context - The DOM context being detached.
     * @param {object} settings - Drupal.settings object.
     * @param {string} trigger - The detach trigger ('unload', etc.).
     */
    detach: function (context, settings, trigger) {},
  };
})(Drupal, once);
