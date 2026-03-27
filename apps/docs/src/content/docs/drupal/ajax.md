---
title: AJAX Integration
description: Behaviors re-initialization after AJAX, once() pattern for AJAX safety, Drupal.AjaxCommands for component updates, BigPipe integration, and component state reset on AJAX replace.
sidebar:
  order: 7
---

Drupal's AJAX framework replaces DOM regions without full page reloads. HELiX web components in replaced regions upgrade automatically. JavaScript behaviors need the `once()` pattern to re-initialize correctly without double-attaching.

---

## How AJAX Triggers Behavior Re-Attachment

When Drupal AJAX replaces a DOM region, it calls `Drupal.attachBehaviors(newContext, drupalSettings)` on the replaced subtree. All registered behaviors have their `attach()` method called with the new DOM node as `context`.

```text
User interaction → AJAX request → Server response
    ↓
Drupal processes AJAX commands (HtmlCommand, ReplaceCommand, etc.)
    ↓
Browser DOM updated
    ↓
Drupal.attachBehaviors(replacedSubtree) called
    ↓
All behaviors run with context = replacedSubtree
    ↓
Custom Elements in replacedSubtree upgrade automatically
```

This means:
- Any `hx-*` element in the replaced HTML will be upgraded by the browser without extra work.
- Your behaviors will re-run — but only on elements inside `replacedSubtree`, not on the full document.

---

## The once() Pattern

`once()` from `core/once` tracks which elements have had a behavior attached. It prevents double-initialization when `attach()` is called multiple times.

### Without once() — double-init risk

```javascript
// WRONG — listener added twice if AJAX runs attach() again
Drupal.behaviors.helixCard = {
  attach(context) {
    document.querySelectorAll('hx-card').forEach((card) => {
      card.addEventListener('hx-click', handleClick);
    });
  },
};
```

After AJAX replaces the region and `attach()` runs again on the full document, existing `hx-card` elements get a second `hx-click` listener.

### With once() — correct pattern

```javascript
// CORRECT — once() registers each element+namespace pair exactly once
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixCard = {
    attach(context) {
      // 'hx-card-events' is the namespace — must be unique per behavior
      // context limits the query to the replaced subtree
      once('hx-card-events', 'hx-card', context).forEach((card) => {
        card.addEventListener('hx-click', handleClick);
      });
    },

    detach(context, settings, trigger) {
      // Optional: clean up when a region is about to be replaced
      if (trigger === 'serialize') return;
      once.remove('hx-card-events', 'hx-card', context);
    },
  };

  function handleClick(e) {
    console.log('Card clicked:', e.currentTarget.dataset.nodeId);
  }

})(Drupal, once);
```

`once()` returns an array of elements that have NOT yet been initialized with the given namespace. On subsequent calls with the same context (or if elements already exist in the tracking set), it returns an empty array — so the `forEach` body is a no-op for already-initialized elements.

---

## AJAX-Safe Initialization Pattern

For behaviors that need to wait for component upgrade before running:

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixFormInit = {
    async attach(context) {
      const inputs = once('helix-form-init', 'hx-text-input', context);

      if (!inputs.length) return;

      // Wait for all targeted components to be defined before accessing their API
      await customElements.whenDefined('hx-text-input');

      inputs.forEach((input) => {
        // Safe to access component properties now
        input.addEventListener('hx-change', (e) => {
          console.log('Input changed:', e.detail.value);
        });
      });
    },
  };

})(Drupal, once);
```

---

## Drupal.AjaxCommands for Component Updates

Custom AJAX commands let you update component properties or call component methods from PHP AJAX callbacks without replacing entire DOM regions.

### Registering a custom AJAX command

```javascript
// js/helix-ajax-commands.js
(function (Drupal) {
  'use strict';

  /**
   * Command: Update a HELiX component property.
   *
   * Data: { selector, property, value }
   */
  Drupal.AjaxCommands.prototype.helixSetProperty = function (ajax, response) {
    const el = document.querySelector(response.selector);
    if (el && response.property in el) {
      el[response.property] = response.value;
    }
  };

  /**
   * Command: Call a method on a HELiX component.
   *
   * Data: { selector, method, args }
   */
  Drupal.AjaxCommands.prototype.helixCallMethod = function (ajax, response) {
    const el = document.querySelector(response.selector);
    if (el && typeof el[response.method] === 'function') {
      el[response.method](...(response.args || []));
    }
  };

})(Drupal);
```

### PHP: Sending custom commands

```php
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\InvokeCommand;

public function ajaxCallback(array &$form, FormStateInterface $form_state): AjaxResponse {
  $response = new AjaxResponse();

  // Set an hx-alert's variant property via InvokeCommand.
  // InvokeCommand calls a jQuery/DOM method — here we use setAttribute
  // to set component properties from the server.
  $response->addCommand(new InvokeCommand(
    '#status-alert',
    'setAttribute',
    ['variant', 'success'],
  ));

  $response->addCommand(new InvokeCommand(
    '#status-alert',
    'setAttribute',
    ['message', 'Form submitted successfully.'],
  ));

  return $response;
}
```

### Standard AJAX commands with HELiX components

Standard `HtmlCommand`, `ReplaceCommand`, and `AppendCommand` all work correctly with HELiX. Elements in inserted HTML upgrade as Custom Elements:

```php
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\AppendCommand;
use Drupal\Core\Ajax\ReplaceCommand;

// Replace region contents
$response->addCommand(new HtmlCommand('#results', [
  '#markup' => '<hx-alert variant="success">Saved successfully.</hx-alert>',
  '#attached' => ['library' => ['mytheme/helix-alert']],
]));

// Append a new card to a list
$response->addCommand(new AppendCommand('#card-list', [
  '#theme' => 'node',
  '#node' => $node,
  '#view_mode' => 'teaser',
  '#attached' => ['library' => ['mytheme/helix-card']],
]));
```

---

## BigPipe Integration

BigPipe streams lazy-built placeholders. Components inside BigPipe-replaced content need their libraries attached to the lazy builder render array.

```php
// In a lazy builder service
public function buildCard(string $node_id): array {
  $node = $this->nodeStorage->load($node_id);

  return [
    '#type' => 'html_tag',
    '#tag' => 'hx-card',
    '#attributes' => ['variant' => 'default'],
    '#value' => $this->renderer->render($node->toRenderable()),
    '#attached' => [
      'library' => ['mytheme/helix-card'],
    ],
    '#cache' => [
      'keys' => ['hx-card', $node_id],
      'tags' => $node->getCacheTags(),
    ],
  ];
}
```

BigPipe calls `Drupal.attachBehaviors()` on the placeholder replacement automatically. Your behaviors run once the content streams in.

---

## Component State Reset on AJAX Replace

When AJAX replaces a region containing a stateful component (expanded accordion, open modal, active tab), the state is destroyed with the DOM node. Decide whether to preserve or reset state.

### Preserve state before replacement

```javascript
Drupal.behaviors.helixStatefulComponents = {
  attach(context) {
    once('helix-state-save', 'hx-accordion[id]', context).forEach((accordion) => {
      // Save state before AJAX replaces this region
      Drupal.ajax.instances.forEach((instance) => {
        instance.options.beforeSend = function () {
          const state = { expanded: accordion.expanded };
          sessionStorage.setItem(`hx-accordion-${accordion.id}`, JSON.stringify(state));
        };
      });

      // Restore state after AJAX replacement
      const saved = sessionStorage.getItem(`hx-accordion-${accordion.id}`);
      if (saved) {
        const state = JSON.parse(saved);
        accordion.expanded = state.expanded;
      }
    });
  },
};
```

### Reset state intentionally

When the replaced content is logically new (different results, different entity), resetting state is the correct behavior. Do nothing — the new DOM node starts with default state.

### Avoid replacing components when only data changes

If only the data inside a component needs to change (not the component structure), use `helixSetProperty` or `helixCallMethod` custom commands instead of replacing the DOM node. This preserves focus, scroll position, and component state.

```php
// Update the card's heading text without replacing the entire card
$response->addCommand(new InvokeCommand(
  '#patient-card',
  'setAttribute',
  ['heading', $updated_patient_name],
));
```

---

## Scoping Behaviors to AJAX Regions

Attach behaviors to specific AJAX wrapper elements, not the full document, to avoid unintended side effects:

```javascript
// Scope to the search results region
Drupal.behaviors.searchResults = {
  attach(context) {
    // Only initialize cards inside the search results wrapper
    once('search-card', 'hx-card', context).forEach((card) => {
      if (card.closest('#search-results-wrapper')) {
        card.addEventListener('hx-click', handleSearchResultClick);
      }
    });
  },
};
```

---

## Debugging AJAX + Behaviors

### Confirm attach() is called after AJAX

```javascript
Drupal.behaviors.debugBehavior = {
  attach(context) {
    if (context !== document) {
      // This log appears only for AJAX-replaced content
      console.log('Behaviors attached to AJAX context:', context);
    }
  },
};
```

### Confirm once() tracking

```javascript
// Check which elements once() has already processed
const processed = once.filter('hx-card-events', document.querySelectorAll('hx-card'));
console.log('Already initialized cards:', processed.length);

const unprocessed = once('hx-card-events', 'hx-card', document);
console.log('Newly initialized cards:', unprocessed.length);
```

### Inspect AJAX response commands

DevTools → Network → click the AJAX request → Response:

```json
[
  {"command": "settings", "settings": {...}},
  {"command": "insert", "method": "html", "selector": "#results", "data": "<hx-card>...</hx-card>"},
  {"command": "settings", "settings": {...}, "merge": true}
]
```

If `attachBehaviors` is not in the command list, Drupal's behavior attachment is handled by the `settings` merge step — behaviors always run after any insert/replace command.

---

## Related

- [Behaviors: Fundamentals](/drupal/behaviors/fundamentals/) — `Drupal.behaviors` structure
- [Behaviors: once() API](/drupal/behaviors/once-api/) — Complete `once()` reference
- [Views Integration](/drupal/views/) — Views AJAX with exposed filters
- [Forms: Form API](/drupal/forms/form-api/) — `#ajax` property and event handling
