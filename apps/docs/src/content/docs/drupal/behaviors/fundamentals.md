---
title: Drupal Behaviors Fundamentals
description: Complete guide to the Drupal.behaviors API — IIFE wrapper, attach/detach lifecycle, context parameter, settings parameter, why behaviors beat DOMContentLoaded, and naming conventions.
sidebar:
  order: 1
---

Drupal Behaviors are the JavaScript lifecycle system for Drupal 10 and 11. Every JavaScript that interacts with the DOM in a Drupal theme or module should be written as a Behavior. This is not a stylistic convention — it is the only way to guarantee your code runs correctly on AJAX-loaded content, BigPipe-streamed regions, and dynamically injected HTML.

---

## Why Behaviors Exist

### The Problem with `DOMContentLoaded`

In a traditional web page you might initialize JavaScript like this:

```javascript
// FRAGILE: only runs once on initial page load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('hx-button').forEach((button) => {
    button.addEventListener('click', handleButtonClick);
  });
});
```

This breaks in Drupal because content is added to the page dynamically after the initial load:

- **Views AJAX pager** — clicking "Next" loads a new set of results via AJAX and injects them
- **BigPipe** — lazy-loaded blocks stream in after the initial HTML
- **Modal dialogs** — content loaded into an overlay dialog
- **Inline form errors** — Drupal re-renders form regions after validation
- **Contextual links** — Drupal adds contextual link wrappers dynamically

After any of these events, your `DOMContentLoaded` listener has long since fired. The new content gets no initialization.

### The Solution: `Drupal.behaviors.attach()`

Drupal calls `Drupal.attachBehaviors(context, settings)` after every event that adds content to the DOM. Any behavior registered on `Drupal.behaviors` has its `attach` method called with the new content's context node.

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxButtonTracker = {
    attach(context, settings) {
      // This runs on page load AND after every AJAX response
      once('helixui:button-tracker', 'hx-button', context).forEach((button) => {
        button.addEventListener('click', handleButtonClick);
      });
    },
  };
})(Drupal, once);
```

Now every `<hx-button>` — whether on the initial page load or injected via AJAX — gets the click listener.

---

## The IIFE Wrapper

Every Drupal Behavior is wrapped in an Immediately Invoked Function Expression:

```javascript
(function (Drupal, once) {
  'use strict';

  // Your behavior code here

})(Drupal, once);
```

### Why the IIFE Pattern

**Scope isolation**: Variables declared inside the IIFE are not accessible from the global scope. This prevents naming collisions between your behavior and code from other themes, modules, or third-party libraries.

**Dependency injection through parameters**: The outer parameters `(Drupal, once)` are passed from the global scope as arguments. Inside the function, you refer to them as local variables. This:

- Makes dependencies explicit and documented
- Allows linters and minifiers to rename the local variables safely
- Works correctly even if the global `once` reference is re-assigned by another script

**Strict mode**: The `'use strict';` directive inside the IIFE enables strict mode for the behavior without enabling it for all global code.

### What Goes in the IIFE

The IIFE should contain:

1. Helper functions used only by this behavior
2. The `Drupal.behaviors.yourBehaviorName` object definition
3. No global variable declarations (use `Drupal.behaviors` namespace or closure variables)

```javascript
(function (Drupal, once) {
  'use strict';

  /**
   * Helper function — private to this behavior.
   */
  function initializeCard(card) {
    const entityId = card.getAttribute('data-entity-id');
    if (entityId) {
      card.setAttribute('aria-label', `View patient record ${entityId}`);
    }
  }

  /**
   * Patient card initialization behavior.
   */
  Drupal.behaviors.hxPatientCard = {
    attach(context, settings) {
      once('helixui:patient-card', 'hx-card[data-entity-bundle="patient"]', context).forEach(initializeCard);
    },
  };

})(Drupal, once);
```

---

## The `attach()` Method

### Signature

```javascript
Drupal.behaviors.myBehavior = {
  attach(context, settings) {
    // initialization code
  },
};
```

### The `context` Parameter

`context` is a DOM node representing the subtree of content that was just added to the page. It is always one of:

- `document` — on the initial page load
- A DOM element — on AJAX responses, it is the container that received new content

**Always pass `context` to `once()`** and to any DOM query inside `attach()`. This ensures you only process newly added elements, not elements that were already initialized on a previous `attach()` call.

```javascript
attach(context, settings) {
  // CORRECT: scoped to context, only processes new content
  once('helixui:my-init', 'hx-card', context).forEach((card) => {
    // initialize card
  });

  // WRONG: queries the entire document, re-processes already-initialized elements
  document.querySelectorAll('hx-card').forEach((card) => {
    // initialize card — may run twice on same element
  });
},
```

### The `settings` Parameter

`settings` is the `drupalSettings` object — a JavaScript representation of server-side settings passed from PHP. Access it to read module configuration, user data, or page-specific values:

```javascript
attach(context, settings) {
  const apiBase = settings.helixui?.apiBase || '/api';
  const userId = settings.user?.uid || 0;

  once('helixui:api-init', 'hx-data-table', context).forEach((table) => {
    table.setAttribute('data-api-base', apiBase);
    table.setAttribute('data-user-id', userId);
  });
},
```

Pass `drupalSettings` from PHP using `#attached`:

```php
// In a preprocess function or block plugin
$build['#attached']['drupalSettings']['helixui']['apiBase'] = '/api/v2';
```

---

## The `detach()` Method

`detach()` is called when content is about to be removed from the DOM — for example, when a modal dialog closes or an AJAX request is about to replace a region.

```javascript
Drupal.behaviors.hxLiveUpdates = {
  attach(context, settings) {
    once('helixui:live-updates', '.live-region', context).forEach((region) => {
      const interval = setInterval(() => {
        // poll for updates
      }, 5000);

      // Store the interval ID on the element for cleanup
      region._hxLiveUpdatesInterval = interval;
    });
  },

  detach(context, settings, trigger) {
    // context contains the elements being removed
    context.querySelectorAll('.live-region').forEach((region) => {
      if (region._hxLiveUpdatesInterval) {
        clearInterval(region._hxLiveUpdatesInterval);
        region._hxLiveUpdatesInterval = null;
      }
    });
  },
};
```

### The `trigger` Parameter

`trigger` tells you why `detach()` was called:

| Value | Meaning |
|---|---|
| `'unload'` | The page is navigating away |
| `'serialize'` | Form elements are being serialized for AJAX submission |
| (other) | Module-specific trigger |

For most HELiX behaviors `detach()` is optional. It is required only when you:

- Start intervals or timeouts
- Establish WebSocket or EventSource connections
- Add event listeners to elements outside `context` (e.g., `window`, `document`)

---

## Behavior Naming Conventions

### Naming the Behavior Object

Use camelCase starting with a lowercase prefix that identifies your theme or module:

```javascript
// Theme: "mytheme"
Drupal.behaviors.mythemeHxCards = { ... };
Drupal.behaviors.mythemeHxPatientList = { ... };

// Module: "my_module"
Drupal.behaviors.myModuleHxAlerts = { ... };
```

Avoid generic names that may collide:

```javascript
// Too generic — may collide with another module
Drupal.behaviors.cards = { ... };
Drupal.behaviors.init = { ... };
```

### Naming the `once()` Key

The `once()` key is a namespaced string that identifies the specific initialization. Use the `helixui:` prefix for HELiX-specific behaviors:

```javascript
once('helixui:patient-card-init', 'hx-card[data-bundle="patient"]', context)
once('helixui:badge-tooltip', 'hx-badge[title]', context)
once('helixui:data-table-columns', 'hx-data-table[data-columns]', context)
```

The full namespacing format is `helixui:behavior-name`. This prevents collisions with other modules that may also use `once()` on the same elements.

---

## Registering JavaScript as a Drupal Library

Behaviors are attached to pages through Drupal's Libraries API.

### `mytheme.libraries.yml`

```yaml
# mytheme.libraries.yml

helix-behaviors:
  js:
    js/behaviors/hx-card-init.js: {}
    js/behaviors/hx-patient-list.js: {}
  dependencies:
    - core/drupal
    - core/once
```

The `core/drupal` dependency provides the `Drupal` global. The `core/once` dependency provides the `once` global used in the IIFE wrapper.

### Attaching the Library

```twig
{# In a template, attach the library for this template #}
{{ attach_library('mytheme/helix-behaviors') }}
```

Or in a preprocess function:

```php
// mytheme.theme
function mytheme_preprocess_node(&$variables) {
  $variables['#attached']['library'][] = 'mytheme/helix-behaviors';
}
```

Or declare the library globally in `mytheme.info.yml`:

```yaml
# mytheme.info.yml
libraries:
  - mytheme/helix-behaviors
```

---

## Behaviors vs. Other Patterns

### Behaviors vs. `DOMContentLoaded`

| Pattern | Initial load | AJAX content | BigPipe |
|---|---|---|---|
| `DOMContentLoaded` | Yes | No | No |
| `Drupal.behaviors` | Yes | Yes | Yes |

Always use Behaviors for any code that touches the DOM.

### Behaviors vs. Module `<script>` Tags

Inline `<script>` tags execute once when parsed. They cannot be called again for AJAX content. Use them only for configuration data (e.g., `drupalSettings`) or one-shot page-level setup, never for element initialization.

### Behaviors vs. Web Component Lifecycle Callbacks

HELiX components handle their own internal initialization via Lit's `connectedCallback` and `firstUpdated`. You do not need a Behavior to get components to render. Behaviors are needed for:

- Setting JavaScript properties that cannot be set via HTML attributes (objects, arrays)
- Attaching event listeners that need to interact with Drupal's systems
- Reading `drupalSettings` and configuring components based on server values
- Coordinating between multiple components or Drupal APIs

---

## A Minimal Complete Behavior

```javascript
// mytheme/js/behaviors/hx-alert-dismiss.js

(function (Drupal, once) {
  'use strict';

  /**
   * Track alert dismissals and store in session storage.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches dismissal tracking to all dismissible hx-alert elements.
   * @prop {Drupal~behaviorDetach} detach
   *   No cleanup required for this behavior.
   */
  Drupal.behaviors.mythemeHxAlertDismiss = {
    attach(context, settings) {
      once('helixui:alert-dismiss', 'hx-alert[dismissible]', context).forEach((alert) => {
        const alertId = alert.getAttribute('data-alert-id');

        // Skip if already dismissed in this session
        if (alertId && sessionStorage.getItem(`alert-dismissed-${alertId}`)) {
          alert.hidden = true;
          return;
        }

        alert.addEventListener('hx-dismiss', () => {
          if (alertId) {
            sessionStorage.setItem(`alert-dismissed-${alertId}`, '1');
          }
        });
      });
    },
  };

})(Drupal, once);
```

---

## Drupal 10 and 11 Compatibility

The `Drupal.behaviors` API and `once()` function work identically in Drupal 10 and 11. There are no breaking changes between the two versions for the patterns shown in this document.

The `once` global (provided by `core/once`) replaced jQuery's `$.once()` in Drupal 9.2. If you are maintaining legacy code that uses `$.once()`, migrate it to the standalone `once()` function. See [Once API](/drupal/behaviors/once-api/) for details.

---

## Additional Resources

- [Behavior Patterns](/drupal/behaviors/patterns/)
- [Once API](/drupal/behaviors/once-api/)
- [Behaviors with Web Components](/drupal/behaviors/web-components/)
- [Drupal JavaScript API Overview](https://www.drupal.org/docs/drupal-apis/javascript-api/javascript-api-overview)
