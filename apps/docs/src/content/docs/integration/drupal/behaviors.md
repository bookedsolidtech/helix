---
title: Drupal Behaviors with HELiX Components
description: Integrate HELiX web component custom events with Drupal's behaviors system — initialization patterns, AJAX reattachment, once() API, and component lifecycle coordination.
sidebar:
  order: 3
---

Drupal behaviors (`Drupal.behaviors`) are the standard mechanism for attaching JavaScript to DOM elements. They run on initial page load and re-run after every AJAX response. HELiX components dispatch custom events; behaviors are the right place to respond to those events in a Drupal context.

---

## The Core Pattern

A Drupal behavior that listens for HELiX component events follows this structure:

```js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixComponents = {
    attach(context, settings) {
      // once() prevents double-initialization on AJAX updates
      once('helix-init', 'hx-button[data-action]', context).forEach((el) => {
        el.addEventListener('hx-click', (event) => {
          // Handle the component event
          console.log('hx-button clicked', event.detail);
        });
      });
    },
  };
})(Drupal, once);
```

### Why `once()`?

`Drupal.behaviors.attach()` is called every time new HTML is inserted into the page — on initial load, after AJAX responses, and after BigPipe placeholder replacements. Without `once()`, the same element would get multiple event listeners attached each time `attach` runs.

`once('token', selector, context)` marks each matched element with a data attribute so it is only processed once per token. The context argument scopes the query to the newly inserted DOM fragment.

---

## Registering Event Listeners

### hx-dialog: open and close handling

```js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixDialog = {
    attach(context, settings) {
      // Listen for dialog open events to log analytics
      once('helix-dialog', 'hx-dialog', context).forEach((dialog) => {
        dialog.addEventListener('hx-show', () => {
          Drupal.announce(dialog.getAttribute('label') + ' dialog opened');
        });

        dialog.addEventListener('hx-hide', () => {
          Drupal.announce('Dialog closed');
        });
      });

      // Trigger buttons wired to dialogs
      once('helix-dialog-trigger', '[data-dialog-target]', context).forEach((trigger) => {
        trigger.addEventListener('hx-click', (event) => {
          const targetId = trigger.dataset.dialogTarget;
          const dialog = document.getElementById(targetId);
          if (dialog) {
            dialog.open = true;
          }
        });
      });
    },
  };
})(Drupal, once);
```

### hx-dropdown: navigation on selection

```js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixDropdown = {
    attach(context, settings) {
      once('helix-dropdown', 'hx-dropdown[data-nav]', context).forEach((dropdown) => {
        dropdown.addEventListener('hx-select', (event) => {
          const selectedValue = event.detail.value;
          if (selectedValue) {
            window.location.href = selectedValue;
          }
        });
      });
    },
  };
})(Drupal, once);
```

### hx-tabs: sync URL hash with active tab

```js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixTabs = {
    attach(context, settings) {
      once('helix-tabs', 'hx-tabs[data-url-sync]', context).forEach((tabs) => {
        // Restore active tab from URL hash on load
        const hash = window.location.hash.replace('#', '');
        if (hash) {
          const panel = tabs.querySelector(`hx-tab-panel[name="${hash}"]`);
          if (panel) {
            tabs.show(hash);
          }
        }

        // Update URL hash when tab changes
        tabs.addEventListener('hx-tab-show', (event) => {
          if (history.replaceState) {
            history.replaceState(null, '', '#' + event.detail.name);
          }
        });
      });
    },
  };
})(Drupal, once);
```

---

## AJAX and BigPipe Reattachment

Drupal's AJAX system and BigPipe both insert HTML into the page after initial load. Behaviors automatically reattach to the new content because Drupal calls `Drupal.attachBehaviors(newElement, settings)` after each insertion.

The `context` parameter is the newly inserted DOM element. Scoping queries to `context` prevents re-processing already-initialized elements.

### Correct: context-scoped query

```js
attach(context, settings) {
  // Queries only within the newly inserted fragment
  once('helix-card', 'hx-card[href]', context).forEach((card) => {
    card.addEventListener('hx-card-click', handler);
  });
},
```

### Incorrect: document-scoped query

```js
attach(context, settings) {
  // Queries the entire document — runs on EVERY ajax response
  // once() prevents double-binding but the query is wasteful
  document.querySelectorAll('hx-card[href]').forEach((card) => {
    card.addEventListener('hx-card-click', handler);
  });
},
```

### Waiting for component upgrade before binding

Web components upgrade asynchronously. On the first page load, the component's JavaScript may not have executed yet when the behavior runs. Use `customElements.whenDefined()` to ensure the component is ready:

```js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixToast = {
    attach(context, settings) {
      once('helix-toast-trigger', '[data-toast-message]', context).forEach((trigger) => {
        // Ensure hx-toast is defined before interacting with its API
        customElements.whenDefined('hx-toast').then(() => {
          trigger.addEventListener('click', () => {
            const toast = document.createElement('hx-toast');
            toast.variant = trigger.dataset.toastVariant || 'info';
            toast.message = trigger.dataset.toastMessage;
            document.body.appendChild(toast);
          });
        });
      });
    },
  };
})(Drupal, once);
```

---

## Detach: Cleaning Up Listeners

Behaviors can define a `detach` method that runs before elements are removed from the DOM (e.g., before an AJAX replacement). Use it to remove event listeners and avoid memory leaks.

```js
(function (Drupal, once) {
  'use strict';

  // Store handlers so detach can remove them
  const handlers = new WeakMap();

  Drupal.behaviors.helixSearch = {
    attach(context, settings) {
      once('helix-search', 'hx-combobox[data-search]', context).forEach((combobox) => {
        const handler = (event) => {
          const query = event.detail.value;
          // Perform search...
          performSearch(query);
        };

        handlers.set(combobox, handler);
        combobox.addEventListener('hx-input', handler);
      });
    },

    detach(context, settings, trigger) {
      // trigger === 'unload' when navigating away
      // trigger === 'serialize' when a form is being serialized
      if (trigger === 'unload') {
        context.querySelectorAll('hx-combobox[data-search]').forEach((combobox) => {
          const handler = handlers.get(combobox);
          if (handler) {
            combobox.removeEventListener('hx-input', handler);
            handlers.delete(combobox);
          }
        });
      }
    },
  };

  function performSearch(query) {
    // Implementation...
  }
})(Drupal, once);
```

---

## Programmatic Component Interaction

Behaviors can interact directly with HELiX component properties and methods — not just listen for events.

### Opening an hx-dialog from a behavior

```js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixConfirm = {
    attach(context, settings) {
      once('helix-confirm', '[data-confirm-action]', context).forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();

          const dialog = document.querySelector('#confirm-dialog');
          if (!dialog) return;

          // Set dialog content dynamically
          dialog.querySelector('[slot="body"]').textContent =
            button.dataset.confirmMessage || 'Are you sure?';

          // Open the dialog (property set on the element)
          dialog.open = true;

          // Listen for confirmation
          dialog.addEventListener(
            'hx-hide',
            (closeEvent) => {
              if (closeEvent.detail.reason === 'confirm') {
                window.location.href = button.dataset.confirmAction;
              }
            },
            { once: true },
          );
        });
      });
    },
  };
})(Drupal, once);
```

### Updating a toast stack after AJAX operations

```js
(function (Drupal, once) {
  'use strict';

  // Expose globally so other behaviors and AJAX callbacks can use it
  Drupal.helixNotify = function (message, variant = 'info') {
    customElements.whenDefined('hx-toast').then(() => {
      const toast = document.createElement('hx-toast');
      toast.setAttribute('variant', variant);
      toast.setAttribute('message', message);
      toast.setAttribute('duration', '5000');
      document.body.appendChild(toast);
    });
  };

  Drupal.behaviors.helixAjaxNotifications = {
    attach(context, settings) {
      // Listen for Drupal AJAX success events
      $(document).ajaxSuccess(function (event, xhr, options) {
        const response = xhr.responseJSON;
        if (response && response.helix_message) {
          Drupal.helixNotify(response.helix_message, response.helix_variant || 'success');
        }
      });
    },
  };
})(Drupal, once);
```

---

## Library Configuration

Behaviors scripts must be declared in `mytheme.libraries.yml` and explicitly attached. They should not use `type: module` because they rely on the `Drupal` and `once` globals.

```yaml
# mytheme.libraries.yml
helix_behaviors:
  version: 1.0.0
  js:
    js/behaviors/helix-components.js: {}
  dependencies:
    - core/drupal
    - core/once
    - mytheme/helix
```

Attach in a template or `mytheme.info.yml`:

```yaml
# mytheme.info.yml — global behaviors on every page
libraries:
  - mytheme/helix
  - mytheme/helix_behaviors
```

Or selectively in a template:

```twig
{{ attach_library('mytheme/helix_behaviors') }}
```

---

## HELiX Event Reference for Behaviors

| Component | Event | `event.detail` | When fired |
|---|---|---|---|
| `hx-button` | `hx-click` | `{}` | User clicks or activates |
| `hx-dialog` | `hx-show` | `{}` | Dialog opens |
| `hx-dialog` | `hx-hide` | `{ reason }` | Dialog closes |
| `hx-dropdown` | `hx-show` | `{}` | Dropdown opens |
| `hx-dropdown` | `hx-hide` | `{}` | Dropdown closes |
| `hx-dropdown` | `hx-select` | `{ value, label }` | Item selected |
| `hx-tabs` | `hx-tab-show` | `{ name }` | Tab activated |
| `hx-text-input` | `hx-input` | `{ value }` | Value changes |
| `hx-text-input` | `hx-change` | `{ value }` | Committed change |
| `hx-select` | `hx-change` | `{ value }` | Selection changes |
| `hx-combobox` | `hx-input` | `{ value }` | Text input changes |
| `hx-combobox` | `hx-select` | `{ value, label }` | Option selected |
| `hx-toast` | `hx-hide` | `{ reason }` | Toast dismissed |
| `hx-drawer` | `hx-show` | `{}` | Drawer opens |
| `hx-drawer` | `hx-hide` | `{ reason }` | Drawer closes |

All events bubble and are composed (cross Shadow DOM boundary).

---

## Next Steps

- [AJAX Compatibility](/integration/drupal/ajax/) — BigPipe, AJAX callbacks, partial replacement
- [Forms](/integration/drupal/forms/) — Form API integration and validation
- [Troubleshooting](/integration/drupal/troubleshooting/) — Behaviors not attaching, double-init issues
