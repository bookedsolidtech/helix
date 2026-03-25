/**
 * @file
 * HELiX UI form-specific Drupal behaviors.
 *
 * Provides behaviors for integrating HELiX form web components with Drupal's
 * form handling, AJAX, and validation systems. Uses the once() pattern for
 * safe re-execution during AJAX form rebuilds and Layout Builder previews.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Form validation behavior.
   *
   * Bridges HELiX web component validation with Drupal's server-side
   * error messages. When Drupal returns form errors, this behavior maps
   * them to the corresponding hx-text-input error attributes.
   */
  Drupal.behaviors.helixuiFormValidation = {
    attach: function (context) {
      once('helixui-form-validation', 'form .messages--error', context).forEach(
        function (errorContainer) {
          var form = errorContainer.closest('form');
          if (!form) {
            return;
          }

          // Find Drupal error messages and map them to HELiX inputs.
          var errorItems = errorContainer.querySelectorAll('.messages__item, li');
          errorItems.forEach(function (item) {
            var text = item.textContent || '';
            // Drupal error messages typically reference the field label.
            // Find the matching hx-text-input by its label attribute.
            var inputs = form.querySelectorAll('hx-text-input, hx-textarea, hx-select');
            inputs.forEach(function (input) {
              var label = input.getAttribute('label') || '';
              if (label && text.toLowerCase().indexOf(label.toLowerCase()) !== -1) {
                input.setAttribute('error', text.trim());
              }
            });
          });
        },
      );
    },
  };

  /**
   * AJAX form rebuild behavior.
   *
   * After Drupal's AJAX system rebuilds a form region, this behavior
   * ensures HELiX form components retain proper state and re-apply
   * any server-side values.
   */
  Drupal.behaviors.helixuiFormAjax = {
    attach: function (context) {
      once('helixui-form-ajax', 'hx-text-input[data-drupal-selector]', context).forEach(
        function (input) {
          // Listen for the hx-change event and update any hidden Drupal
          // form element that may be paired with this web component.
          input.addEventListener('hx-change', function (event) {
            var name = input.getAttribute('name');
            if (!name) {
              return;
            }

            // If there is a hidden input with the same name (common in
            // Drupal AJAX forms), sync the value.
            var form = input.closest('form');
            if (form) {
              var hidden = form.querySelector('input[type="hidden"][name="' + name + '"]');
              if (hidden) {
                hidden.value = event.detail.value || input.value || '';
              }
            }
          });
        },
      );
    },
  };

  /**
   * Conditional field visibility behavior.
   *
   * Demonstrates how to show/hide HELiX form fields based on the value
   * of another field, using Drupal's #states-like pattern.
   *
   * Usage in Twig:
   *   <hx-select name="type" data-helixui-controls="type-details">
   *   <div data-helixui-controlled-by="type" data-helixui-show-when="other">
   *     <hx-textarea name="type_details" label="Please specify"></hx-textarea>
   *   </div>
   */
  Drupal.behaviors.helixuiConditionalFields = {
    attach: function (context) {
      once('helixui-conditional', '[data-helixui-controls]', context).forEach(function (control) {
        var targetId = control.dataset.helixuiControls;
        var targets = document.querySelectorAll('[data-helixui-controlled-by="' + targetId + '"]');

        function updateVisibility() {
          var value = control.value || '';
          targets.forEach(function (target) {
            var showWhen = target.dataset.helixuiShowWhen || '';
            var showValues = showWhen.split(',').map(function (v) {
              return v.trim();
            });
            target.hidden = showValues.indexOf(value) === -1;
          });
        }

        control.addEventListener('hx-change', updateVisibility);
        control.addEventListener('change', updateVisibility);
        // Initial state.
        updateVisibility();
      });
    },
  };

  /**
   * Inline form validation behavior.
   *
   * Provides real-time validation feedback as users interact with
   * HELiX form components. Validates on blur to avoid premature
   * error display.
   */
  Drupal.behaviors.helixuiInlineValidation = {
    attach: function (context) {
      once(
        'helixui-inline-validation',
        'hx-text-input[required], hx-textarea[required]',
        context,
      ).forEach(function (input) {
        input.addEventListener('blur', function () {
          var value = input.value || '';
          var type = input.getAttribute('type') || 'text';

          // Clear previous error.
          input.removeAttribute('error');

          // Required check.
          if (!value.trim()) {
            var label = input.getAttribute('label') || 'This field';
            input.setAttribute('error', label + ' is required.');
            return;
          }

          // Email format check.
          if (type === 'email' && value) {
            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
              input.setAttribute('error', 'Please enter a valid email address.');
              return;
            }
          }

          // Pattern check.
          var pattern = input.getAttribute('pattern');
          if (pattern && value) {
            var regex = new RegExp('^' + pattern + '$');
            if (!regex.test(value)) {
              input.setAttribute(
                'error',
                input.getAttribute('title') || 'Please match the required format.',
              );
            }
          }
        });

        // Clear error on input (user is correcting).
        input.addEventListener('hx-input', function () {
          if (input.hasAttribute('error')) {
            input.removeAttribute('error');
          }
        });
      });
    },
  };
})(Drupal, once);
