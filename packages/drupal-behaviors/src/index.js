/**
 * @file
 * HELiX Drupal Behaviors — combined bundle.
 *
 * Registers behaviors for all interactive HELiX components with Drupal.
 * Include this file via your Drupal module's libraries.yml to attach all
 * HELiX component behaviors in one load.
 *
 * For selective loading, require individual behavior files instead:
 * - src/behaviors/hx-accordion.behavior.js
 * - src/behaviors/hx-dialog.behavior.js
 * - src/behaviors/hx-drawer.behavior.js
 * - src/behaviors/hx-menu.behavior.js
 * - src/behaviors/hx-tabs.behavior.js
 * - src/behaviors/hx-popover.behavior.js
 * - src/behaviors/hx-toast.behavior.js
 * - src/behaviors/hx-tooltip.behavior.js
 */

/* global Drupal, once */
(function (Drupal, once) {
  'use strict';

  // ─── hx-accordion ────────────────────────────────────────────────────────────

  Drupal.behaviors.hxAccordion = {
    attach: function (context) {
      once('hx-accordion', '[data-drupal-accordion]', context).forEach(function (element) {
        var accordion =
          element.tagName.toLowerCase() === 'hx-accordion'
            ? element
            : element.querySelector('hx-accordion');
        if (!accordion) return;

        if (element.dataset.openFirst === 'true') {
          var firstPanel = accordion.querySelector('hx-accordion-panel');
          if (firstPanel) {
            firstPanel.open = true;
          }
        }

        accordion.addEventListener('hx-open', function () {
          if (typeof Drupal.announce === 'function') {
            Drupal.announce(Drupal.t('Panel expanded'));
          }
        });

        accordion.addEventListener('hx-close', function () {
          if (typeof Drupal.announce === 'function') {
            Drupal.announce(Drupal.t('Panel collapsed'));
          }
        });
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-accordion', '[data-drupal-accordion]', context);
      }
    },
  };

  // ─── hx-dialog ───────────────────────────────────────────────────────────────

  Drupal.behaviors.hxDialog = {
    attach: function (context) {
      once('hx-dialog', '[data-drupal-dialog]', context).forEach(function (element) {
        var dialog =
          element.tagName.toLowerCase() === 'hx-dialog'
            ? element
            : element.querySelector('hx-dialog');
        if (!dialog) return;

        var triggerSelector = element.dataset.triggerSelector;
        var triggerEl = triggerSelector ? document.querySelector(triggerSelector) : null;

        if (triggerEl) {
          triggerEl.addEventListener('click', function () {
            dialog.open = true;
          });
        }

        dialog.addEventListener('hx-close', function () {
          dialog.open = false;
          if (triggerEl) {
            triggerEl.focus();
          }
        });

        dialog.addEventListener('hx-cancel', function () {
          dialog.open = false;
          if (triggerEl) {
            triggerEl.focus();
          }
        });
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-dialog', '[data-drupal-dialog]', context);
      }
    },
  };

  // ─── hx-drawer ───────────────────────────────────────────────────────────────

  Drupal.behaviors.hxDrawer = {
    attach: function (context) {
      once('hx-drawer', '[data-drupal-drawer]', context).forEach(function (element) {
        var drawer =
          element.tagName.toLowerCase() === 'hx-drawer'
            ? element
            : element.querySelector('hx-drawer');
        if (!drawer) return;

        if (element.dataset.direction) {
          drawer.setAttribute('direction', element.dataset.direction);
        }
        if (element.dataset.size) {
          drawer.setAttribute('size', element.dataset.size);
        }

        var triggerSelector = element.dataset.triggerSelector;
        var triggerEl = triggerSelector ? document.querySelector(triggerSelector) : null;

        if (triggerEl) {
          triggerEl.addEventListener('click', function () {
            drawer.open = true;
          });
        }

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

  // ─── hx-menu ─────────────────────────────────────────────────────────────────

  Drupal.behaviors.hxMenu = {
    attach: function (context) {
      once('hx-menu', '[data-drupal-menu]', context).forEach(function (element) {
        var menu =
          element.tagName.toLowerCase() === 'hx-menu' ? element : element.querySelector('hx-menu');
        if (!menu) return;

        function closeOnOutside(event) {
          if (!element.contains(event.target)) {
            menu.open = false;
          }
        }

        document.addEventListener('click', closeOnOutside);
        element._hxMenuCloseHandler = closeOnOutside;

        element.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') {
            menu.open = false;
          }
        });
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-menu', '[data-drupal-menu]', context).forEach(function (element) {
          if (element._hxMenuCloseHandler) {
            document.removeEventListener('click', element._hxMenuCloseHandler);
            delete element._hxMenuCloseHandler;
          }
        });
      }
    },
  };

  // ─── hx-tabs ─────────────────────────────────────────────────────────────────

  Drupal.behaviors.hxTabs = {
    attach: function (context) {
      once('hx-tabs', '[data-drupal-tabs]', context).forEach(function (element) {
        var tabs =
          element.tagName.toLowerCase() === 'hx-tabs' ? element : element.querySelector('hx-tabs');
        if (!tabs) return;

        var hash = window.location.hash.slice(1);
        var initialTab = hash || element.dataset.activeTab;
        if (initialTab) {
          tabs.setAttribute('active', initialTab);
        }

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

  // ─── hx-popover ──────────────────────────────────────────────────────────────

  Drupal.behaviors.hxPopover = {
    attach: function (context) {
      once('hx-popover', '[data-drupal-popover]', context).forEach(function (element) {
        var popover =
          element.tagName.toLowerCase() === 'hx-popover'
            ? element
            : element.querySelector('hx-popover');
        if (!popover) return;

        if (element.dataset.placement) {
          popover.setAttribute('placement', element.dataset.placement);
        }

        element.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') {
            popover.open = false;
          }
        });

        if (element.dataset.trigger === 'click') {
          function closeOnOutside(event) {
            if (!element.contains(event.target)) {
              popover.open = false;
            }
          }
          document.addEventListener('click', closeOnOutside);
          element._hxPopoverCloseHandler = closeOnOutside;
        }
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-popover', '[data-drupal-popover]', context).forEach(function (element) {
          if (element._hxPopoverCloseHandler) {
            document.removeEventListener('click', element._hxPopoverCloseHandler);
            delete element._hxPopoverCloseHandler;
          }
        });
      }
    },
  };

  // ─── hx-toast ────────────────────────────────────────────────────────────────

  Drupal.behaviors.hxToast = {
    attach: function (context) {
      once('hx-toast', '[data-drupal-toast]', context).forEach(function (element) {
        var toast =
          element.tagName.toLowerCase() === 'hx-toast'
            ? element
            : element.querySelector('hx-toast');
        if (!toast) return;

        var duration = parseInt(element.dataset.duration, 10);
        if (duration > 0) {
          toast.setAttribute('duration', String(duration));
        }

        var closeBtn = element.querySelector('[data-toast-close]');
        if (closeBtn) {
          closeBtn.addEventListener('click', function () {
            toast.open = false;
          });
        }

        if (element.dataset.show === 'true') {
          toast.open = true;
        }
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-toast', '[data-drupal-toast]', context);
      }
    },
  };

  // ─── hx-tooltip ──────────────────────────────────────────────────────────────

  Drupal.behaviors.hxTooltip = {
    attach: function (context) {
      once('hx-tooltip', '[data-drupal-tooltip]', context).forEach(function (element) {
        var tooltip =
          element.tagName.toLowerCase() === 'hx-tooltip'
            ? element
            : element.querySelector('hx-tooltip');
        if (!tooltip) return;

        if (element.dataset.content) {
          tooltip.setAttribute('content', element.dataset.content);
        }
        if (element.dataset.placement) {
          tooltip.setAttribute('placement', element.dataset.placement);
        }

        element.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') {
            tooltip.open = false;
          }
        });
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-tooltip', '[data-drupal-tooltip]', context);
      }
    },
  };
})(Drupal, once);
