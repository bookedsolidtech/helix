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
 * @see https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/
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
      // ─── Component initialization hook ────────────────────────────────
      // Custom elements are already self-initializing. This hook is for
      // Drupal-specific post-initialization tasks such as logging,
      // analytics integration, or custom attribute mapping.
      once(
        'helix-module-init',
        'hx-button, hx-text-input, hx-select, hx-checkbox, hx-radio, hx-card, hx-alert, hx-badge, hx-tooltip, hx-dialog',
        context,
      ).forEach(function (el) {
        // Custom element is already self-initializing; this hook is for
        // Drupal-specific post-initialization tasks.
        // Example: el.setAttribute('data-drupal-initialized', 'true');
      });

      // ─── AJAX bridge via data-helix-ajax attribute ─────────────────────
      // Any HELiX component with data-helix-ajax="<url>" will execute a
      // Drupal AJAX request when the component fires an hx-click event.
      //
      // Example usage in Twig:
      //   <hx-button data-helix-ajax="/ajax/save-draft">Save Draft</hx-button>
      once('helix-ajax-bridge', '[data-helix-ajax]', context).forEach(function (el) {
        el.addEventListener('hx-click', function (e) {
          var ajaxUrl = el.getAttribute('data-helix-ajax');
          if (ajaxUrl) {
            Drupal.ajax({ url: ajaxUrl }).execute();
          }
        });
      });

      // ─── Card navigation bridge ────────────────────────────────────────
      // hx-card components with hx-href dispatch an hx-click event with
      // detail: { href, originalEvent }. Bridge this to Drupal navigation.
      once('helix-card-nav', 'hx-card[hx-href]', context).forEach(function (card) {
        card.addEventListener('hx-click', function (e) {
          if (e.detail && e.detail.href) {
            window.location.href = e.detail.href;
          }
        });
      });

      // ─── Dialog trigger wiring ─────────────────────────────────────────
      // Buttons with data-hx-dialog-trigger="<dialog-id>" open the
      // matching hx-dialog element. Focus restoration is handled by the
      // component automatically.
      //
      // Example:
      //   <hx-button data-hx-dialog-trigger="confirm-dialog">Open</hx-button>
      //   <hx-dialog id="confirm-dialog" heading="Confirm">...</hx-dialog>
      once('helix-dialog-trigger', '[data-hx-dialog-trigger]', context).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var dialogId = btn.getAttribute('data-hx-dialog-trigger');
          if (dialogId) {
            var dialog = document.getElementById(dialogId);
            if (dialog && typeof dialog.showModal === 'function') {
              dialog.showModal();
            }
          }
        });
      });

      // ─── Dialog AJAX on close ──────────────────────────────────────────
      // hx-dialog elements with data-ajax-close="<url>" execute an AJAX
      // request when the dialog closes. Useful for refreshing form regions.
      once('helix-dialog-ajax-close', 'hx-dialog[data-ajax-close]', context).forEach(function (el) {
        el.addEventListener('hx-close', function () {
          var ajaxUrl = el.getAttribute('data-ajax-close');
          if (ajaxUrl) {
            Drupal.ajax({ url: ajaxUrl }).execute();
          }
        });
      });

      // ─── Form validation bridge ────────────────────────────────────────
      // Listens for hx-change events from form components. When the parent
      // form has data-helix-validate, Drupal form validation hooks can be
      // triggered. For standard form submission, no action is needed here.
      once(
        'helix-form-validation',
        'hx-text-input, hx-select, hx-checkbox, hx-radio',
        context,
      ).forEach(function (el) {
        el.addEventListener('hx-change', function (e) {
          var form = el.closest('form');
          if (form && form.dataset.helixValidate) {
            // Trigger custom Drupal form validation hooks if configured.
            // e.detail.value — the new field value
            // e.detail.checked — for checkboxes/radios
          }
        });
      });

      // ─── Badge dismiss bridge ──────────────────────────────────────────
      // hx-badge elements with data-removable-id fire an hx-remove event
      // when the dismiss button is clicked. Bridge to Drupal AJAX.
      once('helix-badge-remove', 'hx-badge[data-removable-id]', context).forEach(function (badge) {
        badge.addEventListener('hx-remove', function () {
          var id = badge.getAttribute('data-removable-id');
          if (id) {
            Drupal.ajax({ url: '/helix/badge/remove/' + id }).execute();
          }
        });
      });
    },

    /**
     * Detaches HELiX behaviors when elements are removed by AJAX.
     *
     * The once() utility deduplicates re-attachment automatically, so
     * explicit cleanup is only needed for long-lived event listeners
     * registered outside of once().
     *
     * @param {Element|Document} context - The DOM context being detached.
     * @param {object} settings - Drupal.settings object.
     * @param {string} trigger - The detach trigger ('unload', etc.).
     */
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        // Web components clean up their own shadow DOM event listeners
        // when disconnected. No explicit cleanup needed for component-
        // internal listeners. Custom listeners registered above are
        // garbage collected with their elements.
      }
    },
  };
})(Drupal, once);
