/**
 * @file
 * HELiX UI Starter Theme — component initialization and upgrade management.
 *
 * This module script runs AFTER the browser has parsed the initial HTML but
 * BEFORE Drupal.behaviors.attach() fires. It handles:
 *
 *   1. Custom element upgrade waiting — ensures hx-* elements are defined
 *      before the page makes them visible, preventing flash of unstyled content.
 *
 *   2. Event delegation — a single document-level listener for hx-* events
 *      that Drupal behaviors need to observe globally (e.g. hx-toast events).
 *
 *   3. Drupal AJAX integration — hooks into Drupal.ajax event lifecycle to
 *      re-initialize web components after AJAX replacements.
 *
 * This file is loaded as type="module" (declared in helixui.libraries.yml)
 * so it can use top-level await and ES module syntax. It runs deferred by
 * default in all modern browsers.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/whenDefined
 * @see https://www.drupal.org/docs/drupal-apis/javascript-api/ajax-api/ajax-requests
 */

// ---------------------------------------------------------------------------
// 1. Upgrade fence — wait for critical hx-* elements to define before
//    making the page interactive. Uses Promise.allSettled so a single
//    missing component definition does not block the rest.
// ---------------------------------------------------------------------------

const CRITICAL_COMPONENTS = [
  'hx-button',
  'hx-text-input',
  'hx-card',
  'hx-top-nav',
  'hx-nav',
  'hx-dialog',
  'hx-drawer',
  'hx-alert',
  'hx-toast',
];

/**
 * Waits for a custom element to be defined with a timeout.
 *
 * @param {string} tagName - Custom element tag name.
 * @param {number} [timeoutMs=3000] - Maximum wait time in milliseconds.
 * @returns {Promise<void>}
 */
function whenDefinedWithTimeout(tagName, timeoutMs = 3000) {
  return Promise.race([
    customElements.whenDefined(tagName),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

/**
 * Waits for all critical HELiX components to upgrade and records timing
 * in the browser's performance timeline for Lighthouse auditing.
 */
async function waitForCriticalComponents() {
  const startMark = 'helixui:components:start';
  const endMark = 'helixui:components:ready';

  if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
    performance.mark(startMark);
  }

  await Promise.allSettled(CRITICAL_COMPONENTS.map((tag) => whenDefinedWithTimeout(tag)));

  if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
    performance.mark(endMark);
    performance.measure('helixui:components:upgrade', startMark, endMark);
  }

  // Signal readiness — CSS transitions gated on this attribute can now run.
  document.documentElement.setAttribute('data-helixui-ready', 'true');
}

// Run the upgrade fence immediately (module execution is already deferred).
waitForCriticalComponents().catch(function () {
  // Non-critical: if component loading fails (e.g. CDN offline), the page
  // still renders because all HELiX elements are progressively enhanced.
  document.documentElement.setAttribute('data-helixui-ready', 'degraded');
});

// ---------------------------------------------------------------------------
// 2. Global event delegation — single listener for hx-* CustomEvents that
//    need to be observed at the document level.
// ---------------------------------------------------------------------------

/**
 * Central dispatch table for hx-* custom events.
 * Add entries to route events to specific handlers without per-element listeners.
 *
 * @type {Record<string, (event: CustomEvent) => void>}
 */
const HX_EVENT_HANDLERS = {
  /**
   * hx-card-navigate — fired by hx-card when hx-href is set.
   * Default handler performs a full navigation. Override via:
   *   window.helixui = window.helixui || {};
   *   window.helixui.onCardNavigate = (detail) => { ... };
   */
  'hx-navigate': function (event) {
    const detail = event.detail || {};
    const href = detail.href;
    if (!href) {
      return;
    }

    // Allow themes/modules to override navigation (e.g. for SPA routing).
    if (typeof window.helixui !== 'undefined' && typeof window.helixui.onNavigate === 'function') {
      window.helixui.onNavigate(detail);
      return;
    }

    if (detail.target === '_blank') {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = href;
    }
  },

  /**
   * hx-toast-show — emitted by hx-toast child alert elements when they
   * become visible. Useful for screen-reader announcements.
   */
  'hx-toast-show': function (event) {
    const detail = event.detail || {};
    // Announce via aria-live if no aria-live region is already handling it.
    const message = detail.message || '';
    if (!message) {
      return;
    }
    let announcer = document.getElementById('helixui-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'helixui-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'visually-hidden';
      document.body.appendChild(announcer);
    }
    announcer.textContent = '';
    // Force reflow to allow screen readers to announce the new content.
    void announcer.offsetHeight;
    announcer.textContent = message;
  },
};

// Register a single delegated listener for all hx-* events.
document.addEventListener(
  'hx-navigate',
  function (event) {
    const handler = HX_EVENT_HANDLERS['hx-navigate'];
    if (handler) {
      handler(event);
    }
  },
  false,
);

document.addEventListener(
  'hx-toast-show',
  function (event) {
    const handler = HX_EVENT_HANDLERS['hx-toast-show'];
    if (handler) {
      handler(event);
    }
  },
  false,
);

// ---------------------------------------------------------------------------
// 3. Drupal AJAX integration — re-trigger component initialization after
//    Drupal replaces DOM regions. Uses Drupal.Ajax event hooks if available.
// ---------------------------------------------------------------------------

/**
 * Schedules a Drupal.behaviors.attach() call after an AJAX response has
 * replaced content in the given context node.
 *
 * @param {Element} context - The DOM node that was replaced.
 */
function reAttachAfterAjax(context) {
  if (typeof Drupal === 'undefined' || typeof Drupal.attachBehaviors !== 'function') {
    return;
  }
  // Drupal.attachBehaviors() is idempotent when using once() correctly.
  requestAnimationFrame(function () {
    Drupal.attachBehaviors(context, window.drupalSettings || {});
  });
}

// Hook into Drupal Ajax system if it is available at module load time.
// DOMContentLoaded ensures Drupal.ajax is set up before we hook into it.
document.addEventListener('DOMContentLoaded', function () {
  if (typeof Drupal === 'undefined') {
    return;
  }

  // drupalAjaxSend fires before the AJAX request.
  // drupalAjaxComplete fires after the response has been processed.
  jQuery &&
    jQuery(document)
      .on('drupalAjaxInsert', function (event, target) {
        // target is the element whose innerHTML was replaced.
        if (target instanceof Element) {
          reAttachAfterAjax(target);
        }
      })
      .on('drupalAjaxInsertBefore', function (event, target) {
        if (target instanceof Element) {
          reAttachAfterAjax(target.parentElement || document);
        }
      });
});

// ---------------------------------------------------------------------------
// 4. Global helixui namespace — theme integrations may use this object to
//    share utilities across behaviors without tight coupling.
// ---------------------------------------------------------------------------

window.helixui = window.helixui || {};

/**
 * Programmatically shows a global toast notification.
 * This is a convenience wrapper — prefer using Drupal.helixui.notify() in
 * Drupal behaviors since that is set up after DOMContentLoaded.
 *
 * @param {string} message - Notification text.
 * @param {'info'|'success'|'warning'|'danger'} [variant='info'] - Alert variant.
 */
window.helixui.notify =
  window.helixui.notify ||
  function (message, variant) {
    const container = document.getElementById('helixui-toast-region');
    if (!container) {
      return;
    }
    const alert = document.createElement('hx-alert');
    alert.setAttribute('variant', variant || 'info');
    alert.textContent = message;
    container.appendChild(alert);
  };
