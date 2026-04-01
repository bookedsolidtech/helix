/**
 * @file
 * HELiX UI Starter Theme — Drupal behaviors.
 *
 * Provides theme-level Drupal.behaviors for HELiX web component integration.
 *
 * All behaviors use the once() pattern to ensure safe re-execution during:
 *   - AJAX form rebuilds
 *   - Layout Builder live previews
 *   - Drupal's BigPipe page rendering
 *   - Experience Builder (XB) component previews
 *
 * Pattern:
 *   once(key, selector, context).forEach(fn)  — initialize on first attach
 *   once.remove(key, selector, context)        — clean up on detach
 *
 * @see https://www.drupal.org/docs/drupal-apis/javascript-api/javascript-api-overview
 * @see https://www.drupal.org/docs/drupal-apis/javascript-api/once
 */

(function (Drupal, once) {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. helixuiTheme — general-purpose initialization gate.
  //    Marks elements carrying [data-helixui] as initialized and fires any
  //    custom setup registered on the element via helixui-init data attributes.
  // ---------------------------------------------------------------------------

  Drupal.behaviors.helixuiTheme = {
    attach: function (context, settings) {
      once('helixui-init', '[data-helixui]', context).forEach(function (element) {
        // Mark the element as initialized so that CSS :not([data-helixui-ready])
        // selectors can be used to show loading states.
        element.setAttribute('data-helixui-ready', 'true');

        // If the element declares a component name via data-helixui="hx-button",
        // wait for that element to upgrade before marking it ready.
        var tagName = element.dataset.helixui;
        if (tagName && typeof customElements !== 'undefined') {
          customElements.whenDefined(tagName).then(function () {
            element.setAttribute('data-helixui-defined', 'true');
          });
        }
      });
    },

    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('helixui-init', '[data-helixui]', context).forEach(function (element) {
          element.removeAttribute('data-helixui-ready');
          element.removeAttribute('data-helixui-defined');
        });
      }
    },
  };

  // ---------------------------------------------------------------------------
  // 2. helixuiAdoptedStylesheets — adopted-stylesheets light-DOM bridge.
  //    Uses @helixui/adopted-stylesheets (imported as a Drupal module JS) to
  //    inject light-DOM complement styles into shadow roots at runtime.
  //
  //    This behavior is a no-op if the adoptStyles global is not available.
  //    It is safe to include even when @helixui/adopted-stylesheets is not
  //    configured — it fails silently.
  // ---------------------------------------------------------------------------

  Drupal.behaviors.helixuiAdoptedStylesheets = {
    attach: function (context) {
      // adoptStyles is exported by @helixui/adopted-stylesheets and may be
      // exposed as a global by the module's asset loading configuration.
      if (
        typeof window.helixui === 'undefined' ||
        typeof window.helixui.adoptStyles !== 'function'
      ) {
        return;
      }

      once('helixui-adopted-styles', 'hx-theme, [data-helixui-scope]', context).forEach(
        function (scopeRoot) {
          // Wait for the custom element to define its shadow root, then adopt
          // the theme's global token sheet into that shadow root.
          if (typeof customElements !== 'undefined') {
            customElements.whenDefined(scopeRoot.tagName.toLowerCase()).then(function () {
              var shadowRoot = scopeRoot.shadowRoot;
              if (shadowRoot && typeof window.helixui.globalTokenSheet !== 'undefined') {
                window.helixui.adoptStyles(shadowRoot, window.helixui.globalTokenSheet);
              }
            });
          }
        },
      );
    },

    detach: function (context, settings, trigger) {
      if (trigger !== 'unload') {
        return;
      }
      if (
        typeof window.helixui === 'undefined' ||
        typeof window.helixui.removeStyles !== 'function'
      ) {
        return;
      }

      once
        .remove('helixui-adopted-styles', 'hx-theme, [data-helixui-scope]', context)
        .forEach(function (scopeRoot) {
          var shadowRoot = scopeRoot.shadowRoot;
          if (shadowRoot && typeof window.helixui.globalTokenSheet !== 'undefined') {
            window.helixui.removeStyles(shadowRoot, window.helixui.globalTokenSheet);
          }
        });
    },
  };

  // ---------------------------------------------------------------------------
  // 3. helixuiFocusManagement — focus trap and restoration for dialogs/drawers.
  //    When an hx-dialog or hx-drawer opens, record the trigger element so
  //    focus can be returned when it closes.
  // ---------------------------------------------------------------------------

  Drupal.behaviors.helixuiFocusManagement = {
    attach: function (context) {
      once('helixui-focus-mgmt', 'hx-dialog, hx-drawer', context).forEach(function (component) {
        var lastFocusedElement = null;

        component.addEventListener('hx-show', function () {
          lastFocusedElement = document.activeElement;
        });

        component.addEventListener('hx-hide', function () {
          if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            // Defer by one frame to allow the component to finish its close
            // animation before returning focus.
            requestAnimationFrame(function () {
              lastFocusedElement.focus();
              lastFocusedElement = null;
            });
          }
        });

        component.addEventListener('hx-close', function () {
          if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            requestAnimationFrame(function () {
              lastFocusedElement.focus();
              lastFocusedElement = null;
            });
          }
        });
      });
    },
  };

  // ---------------------------------------------------------------------------
  // 4. helixuiToastRegion — global toast notification region.
  //    Creates a single hx-toast container in the document and exposes
  //    Drupal.helixui.notify() as a convenience API for other behaviors.
  // ---------------------------------------------------------------------------

  Drupal.behaviors.helixuiToastRegion = {
    attach: function (context) {
      // Only initialize once per page load, not per behavior attach.
      once('helixui-toast-region', 'body', context).forEach(function (body) {
        if (typeof customElements === 'undefined') {
          return;
        }

        customElements.whenDefined('hx-toast').then(function () {
          var toastContainer = document.createElement('hx-toast');
          toastContainer.setAttribute('placement', 'bottom-end');
          toastContainer.id = 'helixui-toast-region';
          body.appendChild(toastContainer);

          // Expose a simple notify() API for other Drupal behaviors.
          Drupal.helixui = Drupal.helixui || {};
          Drupal.helixui.notify = function (message, variant) {
            if (!toastContainer) {
              return;
            }
            var alert = document.createElement('hx-alert');
            alert.setAttribute('variant', variant || 'info');
            alert.textContent = message;
            toastContainer.appendChild(alert);
          };
        });
      });
    },
  };

  // ---------------------------------------------------------------------------
  // 5. helixuiFormEnhancement — enhance Drupal form elements with hx-* event
  //    integration. Syncs hx-change events back to Drupal's AJAX form system.
  // ---------------------------------------------------------------------------

  Drupal.behaviors.helixuiFormEnhancement = {
    attach: function (context) {
      // Text inputs — sync value to adjacent hidden Drupal input on hx-input.
      once(
        'helixui-form-enhance',
        'hx-text-input[data-drupal-selector], hx-textarea[data-drupal-selector], hx-select[data-drupal-selector]',
        context,
      ).forEach(function (component) {
        var drupalSelector = component.dataset.drupalSelector;
        if (!drupalSelector) {
          return;
        }

        component.addEventListener('hx-change', function (event) {
          var value = (event.detail && event.detail.value) || component.value || '';
          // Notify Drupal AJAX if this field has an AJAX binding.
          if (typeof Drupal.Ajax !== 'undefined') {
            var ajaxElements = document.querySelectorAll(
              '[data-drupal-ajax-target="' + drupalSelector + '"]',
            );
            ajaxElements.forEach(function (ajaxEl) {
              if (typeof ajaxEl.ajaxSubmit === 'function') {
                ajaxEl.ajaxSubmit({ value: value });
              }
            });
          }
        });
      });

      // Submit buttons — prevent double-submission on hx-button[type=submit].
      once('helixui-form-submit', 'form:has(hx-button[type="submit"])', context).forEach(
        function (form) {
          var submitButton = form.querySelector('hx-button[type="submit"]');
          if (!submitButton) {
            return;
          }

          form.addEventListener('submit', function () {
            submitButton.setAttribute('loading', 'true');
            submitButton.setAttribute('disabled', 'true');
          });
        },
      );
    },

    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove(
          'helixui-form-enhance',
          'hx-text-input[data-drupal-selector], hx-textarea[data-drupal-selector], hx-select[data-drupal-selector]',
          context,
        );
        once.remove('helixui-form-submit', 'form:has(hx-button[type="submit"])', context);
      }
    },
  };

  // ---------------------------------------------------------------------------
  // 6. helixuiMobileDrawer — mobile navigation drawer toggle.
  //    Manages hx-drawer open/close state and body scroll locking for the
  //    site-header mobile nav.
  // ---------------------------------------------------------------------------

  Drupal.behaviors.helixuiMobileDrawer = {
    attach: function (context) {
      once('helixui-mobile-drawer', '.mobile-drawer', context).forEach(function (element) {
        var drawer = element.querySelector('hx-drawer');
        var trigger = document.querySelector('.mobile-drawer__trigger');
        var close = element.querySelector('.mobile-drawer__close');

        if (trigger && drawer) {
          trigger.setAttribute('aria-controls', drawer.id || 'mobile-nav-drawer');
          trigger.addEventListener('click', function () {
            drawer.open = true;
            document.body.style.overflow = 'hidden';
            trigger.setAttribute('aria-expanded', 'true');
          });
        }

        if (close && drawer) {
          close.addEventListener('click', function () {
            drawer.open = false;
            document.body.style.overflow = '';
            if (trigger) {
              trigger.setAttribute('aria-expanded', 'false');
            }
          });
        }

        if (drawer) {
          drawer.addEventListener('hx-close', function () {
            document.body.style.overflow = '';
            if (trigger) {
              trigger.setAttribute('aria-expanded', 'false');
            }
          });
        }
      });
    },

    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('helixui-mobile-drawer', '.mobile-drawer', context).forEach(function () {
          document.body.style.overflow = '';
        });
      }
    },
  };
})(Drupal, once);
