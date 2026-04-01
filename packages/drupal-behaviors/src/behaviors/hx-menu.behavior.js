/**
 * @file
 * Drupal behavior for hx-menu components.
 */

/* global Drupal, once */
(function (Drupal, once) {
  'use strict';

  /**
   * HELiX Menu behavior.
   *
   * Attaches to wrapper elements with [data-drupal-menu].
   * Listens for the hx-close event dispatched by hx-menu (on Escape or item
   * selection) and hides the containing wrapper. Manages aria-expanded on an
   * optional trigger button ([data-drupal-menu-trigger]) and returns focus to
   * the trigger when the menu closes.
   *
   * @example
   * <button data-drupal-menu-trigger aria-expanded="false" aria-controls="my-menu-wrapper">
   *   Open menu
   * </button>
   * <div id="my-menu-wrapper" data-drupal-menu hidden>
   *   <hx-menu>...</hx-menu>
   * </div>
   */
  Drupal.behaviors.hxMenu = {
    attach: function (context) {
      once('hx-menu', '[data-drupal-menu]', context).forEach(function (element) {
        var menu =
          element.tagName.toLowerCase() === 'hx-menu' ? element : element.querySelector('hx-menu');
        if (!menu) return;

        // Locate an associated trigger button by aria-controls or data attribute.
        var triggerId = element.getAttribute('id');
        var trigger = triggerId
          ? context.querySelector
            ? context.querySelector('[data-drupal-menu-trigger][aria-controls="' + triggerId + '"]')
            : document.querySelector(
                '[data-drupal-menu-trigger][aria-controls="' + triggerId + '"]',
              )
          : null;

        // Handle hx-close event dispatched by hx-menu (Escape key or programmatic close).
        function onHxClose() {
          element.hidden = true;
          if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();
          }
        }

        menu.addEventListener('hx-close', onHxClose);
        element._hxMenuCloseHandler = onHxClose;

        // Click-outside to close
        function closeOnOutside(event) {
          if (!element.contains(event.target) && !(trigger && trigger.contains(event.target))) {
            element.hidden = true;
            if (trigger) {
              trigger.setAttribute('aria-expanded', 'false');
            }
          }
        }

        document.addEventListener('click', closeOnOutside);
        element._hxMenuOutsideClickHandler = closeOnOutside;

        // If a trigger exists, wire up open/close toggle.
        if (trigger) {
          function onTriggerClick() {
            var isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
              element.hidden = true;
              trigger.setAttribute('aria-expanded', 'false');
            } else {
              element.hidden = false;
              trigger.setAttribute('aria-expanded', 'true');
              menu.focus ? menu.focus() : menu.focusFirst && menu.focusFirst();
            }
          }
          trigger.addEventListener('click', onTriggerClick);
          element._hxMenuTriggerClickHandler = onTriggerClick;
          element._hxMenuTrigger = trigger;
        }
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-menu', '[data-drupal-menu]', context).forEach(function (element) {
          var menu =
            element.tagName.toLowerCase() === 'hx-menu'
              ? element
              : element.querySelector('hx-menu');

          if (menu && element._hxMenuCloseHandler) {
            menu.removeEventListener('hx-close', element._hxMenuCloseHandler);
            delete element._hxMenuCloseHandler;
          }

          if (element._hxMenuOutsideClickHandler) {
            document.removeEventListener('click', element._hxMenuOutsideClickHandler);
            delete element._hxMenuOutsideClickHandler;
          }

          if (element._hxMenuTrigger && element._hxMenuTriggerClickHandler) {
            element._hxMenuTrigger.removeEventListener('click', element._hxMenuTriggerClickHandler);
            delete element._hxMenuTriggerClickHandler;
            delete element._hxMenuTrigger;
          }
        });
      }
    },
  };
})(Drupal, once);
