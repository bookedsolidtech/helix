---
title: The once() API
description: Drupal's once() API for preventing double-initialization — namespaced key format, once() with context, once.remove() cleanup, Drupal 9/10/11 compatibility, and testing patterns.
sidebar:
  order: 3
---

The `once()` function is the mechanism Drupal uses to guarantee that a JavaScript initialization runs exactly once per element, regardless of how many times `Drupal.behaviors.attach()` is called. It is a required part of every `Drupal.behaviors` implementation that manipulates the DOM.

---

## Why once() Exists

`Drupal.behaviors.attach()` is called multiple times throughout a page's lifecycle: on initial page load, after every AJAX response, after BigPipe streams content, and whenever any code calls `Drupal.attachBehaviors()`. Without `once()`, every call to `attach()` would re-process elements that were already initialized.

### The Problem Without once()

```javascript
// WITHOUT once() — broken pattern
Drupal.behaviors.hxButtons = {
  attach(context, settings) {
    // This query finds ALL hx-button elements, not just new ones
    context.querySelectorAll('hx-button').forEach((button) => {
      button.addEventListener('click', handleClick);
    });
  },
};
```

After three `attach()` calls on the same element:

- The element has three `click` listeners
- The handler fires three times per click
- Memory leaks grow with each AJAX response

### The Solution

```javascript
// WITH once() — correct pattern
Drupal.behaviors.hxButtons = {
  attach(context, settings) {
    once('mysite:button-tracker', 'hx-button', context).forEach((button) => {
      button.addEventListener('click', handleClick);
    });
  },
};
```

`once()` marks each element it processes. On subsequent calls with the same key, already-marked elements are excluded from the returned array. The `click` listener is added exactly once per element.

---

## The once() Function Signature

```javascript
once(id, selector, context)
```

| Parameter | Type | Description |
|---|---|---|
| `id` | string | Unique key identifying this initialization. Elements are marked with this key to prevent re-processing. |
| `selector` | string \| Element \| NodeList \| Array&lt;Element&gt; | CSS selector string, single DOM element, NodeList, or array of elements to process. |
| `context` | Element or Document | Root element to search within. Always pass the `context` from `Drupal.behaviors.attach()`. |

Returns: an array of elements that had not yet been marked with `id`. If all elements were already marked, returns an empty array.

---

## Namespaced Key Format

The shipped `@helixui/drupal-behaviors` package uses `hx-*` once IDs (e.g. `hx-dialog`, `hx-tooltip`) to namespace its keys. For project-local behaviors that build on top of HELiX components, pick a distinct project namespace (e.g. `mysite:patient-card-init`, `clinic:appointment-toolbar`) so your keys never collide with the package's.

```javascript
// Correct namespacing
once('mysite:card-init', 'hx-card', context)
once('mysite:button-tracker', 'hx-button', context)
once('mysite:data-table-columns', 'hx-data-table[data-columns]', context)
once('mysite:alert-dismiss', 'hx-alert[dismissible]', context)
once('mysite:patient-list-enhance', '.patient-list hx-card', context)
once('mysite:form-validation', 'form[data-helix-validate]', context)

// Avoid: generic names without namespace
once('init', 'hx-card', context)         // Too generic
once('card', 'hx-card', context)         // No namespace
once('hx-card-init', 'hx-card', context) // Collides with @helixui/drupal-behaviors hx-* keys
```

### Multiple Behaviors on the Same Element

Different behaviors on the same element each get their own key. Each key is tracked independently:

```javascript
// First behavior: tracks clicks
once('mysite:card-click', 'hx-card', context).forEach((card) => {
  card.addEventListener('hx-click', handleCardClick);
});

// Second behavior: tracks impressions
once('mysite:card-impression', 'hx-card', context).forEach((card) => {
  observeCardVisibility(card);
});
```

If new cards are added via AJAX, both behaviors run on the new cards and neither re-runs on the existing cards.

---

## Passing context

Always pass the `context` parameter from `attach()` as the third argument to `once()`. The `context` parameter is the DOM subtree of newly added content.

```javascript
Drupal.behaviors.hxInit = {
  attach(context, settings) {
    // Correct: scoped to context
    once('mysite:init', 'hx-card', context).forEach((card) => {
      // ...
    });

    // Wrong: queries the entire document
    once('mysite:init', 'hx-card', document).forEach((card) => {
      // This works but defeats the purpose of context scoping.
      // It will also fail to find elements added to a modal or specific region.
    });
  },
};
```

On initial page load, `context` is `document`. On AJAX responses, `context` is the inserted container. Using `context` consistently ensures `once()` only processes newly arrived elements.

---

## Checking once() State with `once.filter()`

`once.filter()` returns the subset of elements that have already been marked with a given key, without marking any new ones. Use it to check initialization state without triggering initialization.

```javascript
// Check which cards are already initialized
const initializedCards = once.filter('mysite:card-init', document.querySelectorAll('hx-card'));
console.log(`${initializedCards.length} cards are already initialized`);

// Check if a specific element is initialized — guard against missing element
// since once.filter() on `[null]` will throw.
const card = document.querySelector('#patient-card-123');
const isInitialized = card !== null && once.filter('mysite:card-init', [card]).length > 0;
```

---

## Removing once() Marks with `once.remove()`

`once.remove()` strips the marks from elements, allowing `once()` to process them again. This is needed for cleanup in `detach()` when the element will be re-initialized later.

```javascript
Drupal.behaviors.hxModalContent = {
  attach(context, settings) {
    once('mysite:modal-init', '.modal hx-card', context).forEach((card) => {
      initializeModalCard(card);
    });
  },

  detach(context, settings, trigger) {
    // When the modal closes, remove once marks so the content
    // can be re-initialized when the modal opens again
    once.remove('mysite:modal-init', context.querySelectorAll('.modal hx-card'), context);
  },
};
```

### `once.remove()` Signature

```javascript
once.remove(id, selector, context)
```

`once.remove()` accepts the same parameter shape as `once()` — the optional `context` (Element or Document) scopes the search so you only strip marks under the node you're cleaning up. Pass the `context` from `detach()` to limit cleanup to the unloading subtree.

---

## Drupal 9/10/11 Compatibility

### The `once` Global (Drupal 9.2+)

Since Drupal 9.2, Drupal ships a standalone `core/once` library that provides the `once` global function. This is the correct API for Drupal 10 and 11.

Declare `core/once` as a dependency in your `mytheme.libraries.yml`:

```yaml
helix-behaviors:
  js:
    js/behaviors/hx-card-init.js: {}
  dependencies:
    - core/drupal
    - core/once
```

Use it in the IIFE:

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxCardInit = {
    attach(context, settings) {
      once('mysite:card-init', 'hx-card', context).forEach((card) => {
        // ...
      });
    },
  };

})(Drupal, once);
```

### jQuery `$.once()` (Legacy — Drupal 7 / early Drupal 8)

Older Drupal code used jQuery's `$.once()` plugin. That plugin was removed from Drupal core in 10.x — it is not available in Drupal 10 or 11 at all. (The unrelated `drupal/jquery_ui` package does not provide `$.once()`.) **Do not use `$.once()` in new code**.

```javascript
// OLD — jQuery.once() — DO NOT USE in Drupal 10/11
$(context).find('hx-card').once('hx-card-init').each(function () {
  // ...
});

// NEW — standalone once() — use this
once('mysite:card-init', 'hx-card', context).forEach((card) => {
  // ...
});
```

---

## Common Patterns

### Initializing with a CSS Selector String

```javascript
// Most common form: selector string
once('mysite:card-click', 'hx-card[hx-href]', context).forEach((card) => {
  card.addEventListener('hx-click', () => {
    window.location.href = card.getAttribute('href');
  });
});
```

### Initializing a Single Element

```javascript
// Single element: wrap in an array or use a NodeList
const mainNav = context.querySelector('.main-navigation hx-button');
if (mainNav) {
  once('mysite:nav-button', [mainNav]).forEach((button) => {
    button.addEventListener('hx-click', toggleNavigation);
  });
}
```

### Initializing the context Element Itself

```javascript
// When the context element IS what you want to initialize
once('mysite:region-init', context === document ? document.body : context).forEach((el) => {
  el.setAttribute('data-helix-region-ready', 'true');
});
```

### Filtering Elements Before Processing

```javascript
// only initialize cards that have an entity ID
once('mysite:patient-card', 'hx-card', context)
  .filter((card) => card.hasAttribute('data-entity-id'))
  .forEach((card) => {
    initializePatientCard(card);
  });
```

---

## once() Implementation Details

`once()` stores initialization state by setting a custom DOM attribute on each element. The attribute name is derived from the `id` parameter.

```html
<!-- Before once() -->
<hx-card variant="default">...</hx-card>

<!-- After once('mysite:card-init', 'hx-card', context) -->
<hx-card variant="default" data-once="mysite:card-init">...</hx-card>
```

The attribute is `data-once`, and its value is a space-separated list of all once keys that have been applied to the element. Drupal's `once()` stores the id verbatim — there is no special colon-to-hyphen serialization step. (Older revisions of these docs implied otherwise; the runtime preserves the id as-is.)

Knowing this lets you:

- Inspect initialization state in browser DevTools
- Write CSS selectors that target initialized elements
- Verify that `once.remove()` worked correctly

```javascript
// Check initialization state in browser console
const card = document.querySelector('hx-card');
console.log('once data:', card.getAttribute('data-once'));
// "helixui-card-init helixui-card-click"
```

---

## Testing once() Behavior

### Manual Test: AJAX Response

To verify your behavior handles AJAX correctly:

1. Load the page and inspect `data-once` attributes on your elements.
2. Trigger an AJAX response (e.g., click a Views pager link).
3. Inspect newly added elements — they should have `data-once` after the Behavior runs.
4. Inspect the original elements — their `data-once` attribute should not have changed (no duplicate initialization).

### Automated Test Approach

```javascript
// Simulating multiple attach() calls in a test
// (Using plain DOM, no test framework dependency shown)

const container = document.createElement('div');
container.innerHTML = '<hx-card data-test></hx-card>';
document.body.appendChild(container);

let callCount = 0;
Drupal.behaviors.hxTestBehavior = {
  attach(context, settings) {
    once('mysite:test', 'hx-card[data-test]', context).forEach((card) => {
      callCount++;
    });
  },
};

// First call
Drupal.behaviors.hxTestBehavior.attach(container, {});
console.assert(callCount === 1, 'Should initialize once');

// Second call — same context
Drupal.behaviors.hxTestBehavior.attach(container, {});
console.assert(callCount === 1, 'Should not re-initialize');

// Third call — new container with same content
const container2 = document.createElement('div');
container2.innerHTML = '<hx-card data-test></hx-card>';
document.body.appendChild(container2);
Drupal.behaviors.hxTestBehavior.attach(container2, {});
console.assert(callCount === 2, 'Should initialize new element');
```

---

## once() Quick Reference

| Function | Purpose |
|---|---|
| `once(id, selector, context)` | Find elements matching `selector` in `context` that have not been marked with `id`; mark them; return them. |
| `once.filter(id, elements)` | Return the subset of `elements` already marked with `id`. Does not mark anything new. |
| `once.remove(id, elements)` | Remove the `id` mark from `elements`, allowing them to be processed by `once()` again. |
| `once.find(id, context)` | Return all elements in `context` that are marked with `id`. Equivalent to `once.filter(id, context.querySelectorAll('[data-once]'))`. |

---

## Additional Resources

- [Drupal Behaviors Fundamentals](/drupal/behaviors/fundamentals/)
- [Behavior Patterns](/drupal/behaviors/patterns/)
- [Behaviors with Web Components](/drupal/behaviors/web-components/)
- [core/once Drupal.org documentation](https://www.drupal.org/docs/drupal-apis/javascript-api/javascript-api-overview#once)
