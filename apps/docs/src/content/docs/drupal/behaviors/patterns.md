---
title: Behavior Patterns
description: Common Drupal behavior patterns for HELiX components — initialization, property setting after customElements.whenDefined(), event handling, AJAX compatibility, multiple component initialization, and cleanup in detach.
sidebar:
  order: 2
---

This document covers the patterns you will use most often when integrating HELiX web components with Drupal Behaviors. Each pattern addresses a specific integration need and includes working code you can adapt to your project.

---

## Pattern 1: Basic Component Initialization

The most fundamental pattern: find HELiX components in context, guard against double-initialization with `once()`, and run initialization code.

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.mythemeHxCardInit = {
    attach(context, settings) {
      once('helixui:card-init', 'hx-card', context).forEach((card) => {
        // Add entity data from a data- attribute
        const entityId = card.getAttribute('data-entity-id');
        if (entityId) {
          card.setAttribute('aria-label', `Patient record ${entityId}`);
        }
      });
    },
  };

})(Drupal, once);
```

---

## Pattern 2: Setting Properties After `customElements.whenDefined()`

HTML attributes set in Twig become available immediately on the DOM element. But JavaScript **properties** — especially those that accept objects or arrays — must be set after the component's class is registered.

`customElements.whenDefined()` returns a Promise that resolves when the component is defined. Use it whenever you need to set JavaScript properties.

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxDataTableInit = {
    attach(context, settings) {
      once('helixui:data-table-init', 'hx-data-table[data-columns]', context).forEach((table) => {
        customElements.whenDefined('hx-data-table').then(() => {
          const columnsJson = table.getAttribute('data-columns');
          const rowsJson = table.getAttribute('data-rows');

          try {
            if (columnsJson) table.columns = JSON.parse(columnsJson);
            if (rowsJson) table.data = JSON.parse(rowsJson);
          } catch (error) {
            console.error('[HELiX] hx-data-table: failed to parse JSON data', error);
          }
        });
      });
    },
  };

})(Drupal, once);
```

### When `whenDefined()` Is Not Needed

If the HELiX library loads before your behavior runs (which is typical when both are declared in the same Drupal library with correct weight), the component is already defined by the time `attach()` executes. You only strictly need `whenDefined()` when:

- Setting non-reflected JavaScript properties (objects, arrays, functions)
- Calling component methods that do not exist until after upgrade

For setting string or boolean **attributes** (which work at the HTML level before upgrade), `whenDefined()` is not required.

---

## Pattern 3: Event Handling

HELiX components emit custom DOM events. Listen for them in a Behavior to integrate with Drupal's systems.

### Listening for Component Events

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxFormChangeTracker = {
    attach(context, settings) {
      once('helixui:form-change', 'form hx-text-input, form hx-select, form hx-checkbox', context).forEach((field) => {
        field.addEventListener('hx-change', (event) => {
          const form = field.closest('form');
          if (form) {
            // Mark the form as having unsaved changes
            form.setAttribute('data-unsaved', 'true');
          }
        });
      });
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        // No cleanup needed; event listeners are garbage-collected with the elements
      }
    },
  };

})(Drupal, once);
```

### AJAX Form Submission via Behavior

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxPatientSearchForm = {
    attach(context, settings) {
      once('helixui:patient-search', 'hx-button[data-search-submit]', context).forEach((button) => {
        button.addEventListener('hx-click', (event) => {
          event.preventDefault();

          const form = button.closest('form');
          if (!form) return;

          const searchInput = form.querySelector('hx-text-input[name="query"]');
          const query = searchInput ? searchInput.value : '';

          // Trigger Drupal AJAX
          Drupal.ajax({
            url: settings.helixui?.patientSearchUrl || '/patient/search',
            submit: { query },
          }).execute();
        });
      });
    },
  };

})(Drupal, once);
```

### Composed Events and Shadow DOM

Events emitted from inside a Shadow DOM do not automatically cross the shadow boundary unless `composed: true` is set. HELiX components set `composed: true` on all their public events so you can listen at any level of the DOM tree.

```javascript
// Listening at the document level catches composed events from any HELiX component
document.addEventListener('hx-change', (event) => {
  console.log('hx-change from:', event.target, 'value:', event.detail?.value);
});

// In a Behavior: listen at context level
once('helixui:composed-handler', 'form', context).forEach((form) => {
  form.addEventListener('hx-change', (event) => {
    // event.target is the originating hx-* component inside the form
    console.log('Field changed:', event.target.name, event.detail?.value);
  });
});
```

---

## Pattern 4: AJAX Compatibility

Drupal's AJAX system calls `Drupal.attachBehaviors(context)` after inserting new content. Because your Behavior uses `once()`, it will initialize new elements without re-initializing old ones. This is the primary reason for the `once()` requirement — no special AJAX-specific code is needed in most cases.

### Verifying AJAX Compatibility

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxPatientList = {
    attach(context, settings) {
      // `context` is the newly inserted DOM subtree on AJAX responses
      // `once()` ensures we only process elements we haven't seen before
      once('helixui:patient-list-item', 'hx-card[data-bundle="patient"]', context).forEach((card) => {
        // This runs for initial page load AND for AJAX-loaded cards
        const patientId = card.getAttribute('data-patient-id');
        card.addEventListener('hx-click', () => {
          window.location.href = `/patient/${patientId}`;
        });
      });
    },
  };

})(Drupal, once);
```

### Handling Views AJAX Pager

Views AJAX pager replaces the content region entirely. The new page of results arrives as `context`. Because old elements are removed from the DOM and replaced, `once()` marks are cleared, and initialization runs fresh on the new elements.

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxViewsCardEnhance = {
    attach(context, settings) {
      // Runs on initial load and after every Views AJAX page change
      once('helixui:views-card', '.views-row hx-card', context).forEach((card) => {
        // Enhance each card in the Views results
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            const link = card.querySelector('[slot="actions"] hx-button');
            if (link) link.click();
          }
        });
      });
    },
  };

})(Drupal, once);
```

---

## Pattern 5: Initializing Multiple Component Types

When a single page context contains several HELiX component types that all need initialization, use separate `once()` calls for each — do not combine them into one.

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxPageEnhancements = {
    attach(context, settings) {

      // Each component type gets its own once() key
      once('helixui:card-click', 'hx-card[href]', context).forEach((card) => {
        card.addEventListener('hx-click', () => {
          window.location.href = card.getAttribute('href');
        });
      });

      once('helixui:badge-tooltip', 'hx-badge[data-tooltip]', context).forEach((badge) => {
        badge.title = badge.getAttribute('data-tooltip');
      });

      once('helixui:alert-session', 'hx-alert[data-alert-id]', context).forEach((alert) => {
        const alertId = alert.getAttribute('data-alert-id');
        if (sessionStorage.getItem(`dismissed-${alertId}`)) {
          alert.hidden = true;
        }
        alert.addEventListener('hx-dismiss', () => {
          sessionStorage.setItem(`dismissed-${alertId}`, '1');
        });
      });

    },
  };

})(Drupal, once);
```

Separate once keys mean:

- A card that has already been initialized will not be re-processed when a new alert is added
- Debugging is clearer — you can identify which initialization ran for a given element
- The behaviors are independently releasable and testable

---

## Pattern 6: Progressive Enhancement

Always write Behaviors that enhance content that is already functional, rather than Behaviors that make content functional for the first time.

```twig
{# templates/components/patient-action.html.twig #}
{# The form works without JavaScript — it submits normally #}
<form
  method="post"
  action="{{ url('patient.update', {patient: patient.id}) }}"
  data-hx-enhanced
>
  <input type="hidden" name="patient_id" value="{{ patient.id }}" />
  <input type="hidden" name="action" value="{{ action_type }}" />

  {# hx-button is a styled submit button — no JS needed for basic function #}
  <hx-button type="submit" variant="primary">
    {{ action_label }}
  </hx-button>
</form>
```

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxPatientActionEnhance = {
    attach(context, settings) {
      once('helixui:patient-action', 'form[data-hx-enhanced]', context).forEach((form) => {
        // Enhance form submit to use AJAX instead of full page reload
        form.addEventListener('submit', (event) => {
          event.preventDefault();

          const patientId = form.querySelector('[name="patient_id"]').value;
          const action = form.querySelector('[name="action"]').value;
          const submitButton = form.querySelector('hx-button[type="submit"]');

          // Show loading state
          submitButton.loading = true;
          submitButton.disabled = true;

          fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
          })
            .then((response) => response.json())
            .then((data) => {
              // Handle success
              if (data.status === 'success') {
                Drupal.announce(data.message);
              }
            })
            .catch((error) => {
              console.error('[HELiX] Patient action failed:', error);
            })
            .finally(() => {
              submitButton.loading = false;
              submitButton.disabled = false;
            });
        });
      });
    },
  };

})(Drupal, once);
```

---

## Pattern 7: Cleanup in `detach()`

When a Behavior establishes resources that persist beyond the element's DOM lifetime, clean them up in `detach()`.

```javascript
(function (Drupal, once) {
  'use strict';

  // Module-scoped map of interval IDs, keyed by a unique element identifier
  const activeIntervals = new Map();

  Drupal.behaviors.hxLiveStatus = {
    attach(context, settings) {
      const pollUrl = settings.helixui?.statusPollUrl;
      if (!pollUrl) return;

      once('helixui:live-status', 'hx-card[data-live-status]', context).forEach((card) => {
        const cardId = card.getAttribute('data-entity-id');

        const intervalId = setInterval(() => {
          fetch(`${pollUrl}?id=${cardId}`)
            .then((r) => r.json())
            .then((data) => {
              const badge = card.querySelector('hx-badge[data-status]');
              if (badge) badge.variant = data.status === 'active' ? 'success' : 'neutral';
            });
        }, 10000);

        activeIntervals.set(cardId, intervalId);
      });
    },

    detach(context, settings, trigger) {
      context.querySelectorAll('hx-card[data-live-status]').forEach((card) => {
        const cardId = card.getAttribute('data-entity-id');
        if (activeIntervals.has(cardId)) {
          clearInterval(activeIntervals.get(cardId));
          activeIntervals.delete(cardId);
        }
      });
    },
  };

})(Drupal, once);
```

---

## Pattern 8: Reading `drupalSettings`

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxApiConfig = {
    attach(context, settings) {
      // Read configuration from drupalSettings
      const apiConfig = settings.helixui || {};
      const baseUrl = apiConfig.apiBaseUrl || '/api';
      const csrfToken = apiConfig.csrfToken || '';

      once('helixui:api-config', 'hx-data-table[data-api-endpoint]', context).forEach((table) => {
        customElements.whenDefined('hx-data-table').then(() => {
          const endpoint = table.getAttribute('data-api-endpoint');
          table.fetchConfig = {
            url: `${baseUrl}${endpoint}`,
            headers: {
              'X-CSRF-Token': csrfToken,
              'Content-Type': 'application/json',
            },
          };
        });
      });
    },
  };

})(Drupal, once);
```

From PHP:

```php
function mytheme_preprocess_page(&$variables) {
  $variables['#attached']['drupalSettings']['helixui'] = [
    'apiBaseUrl' => \Drupal::request()->getSchemeAndHttpHost() . '/api/v2',
    'csrfToken' => \Drupal::csrfToken()->get('helix-api'),
  ];
}
```

---

## Pattern 9: Coordinating Multiple Components

Sometimes one Behavior needs to coordinate between multiple HELiX component instances on the page.

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxFilteredList = {
    attach(context, settings) {
      once('helixui:filtered-list', '[data-filtered-list]', context).forEach((container) => {
        const filterInput = container.querySelector('hx-text-input[data-filter-input]');
        const cards = container.querySelectorAll('hx-card[data-searchable]');

        if (!filterInput || cards.length === 0) return;

        filterInput.addEventListener('hx-input', (event) => {
          const query = (event.detail?.value || '').toLowerCase().trim();

          cards.forEach((card) => {
            const text = card.getAttribute('data-searchable').toLowerCase();
            card.hidden = query.length > 0 && !text.includes(query);
          });

          // Update a status count badge
          const visibleCount = Array.from(cards).filter((c) => !c.hidden).length;
          const countBadge = container.querySelector('hx-badge[data-result-count]');
          if (countBadge) {
            countBadge.textContent = `${visibleCount} results`;
            countBadge.variant = visibleCount === 0 ? 'warning' : 'info';
          }
        });
      });
    },
  };

})(Drupal, once);
```

---

## Common Mistakes

### Not Scoping Queries to `context`

```javascript
// WRONG: re-processes all elements on every AJAX response
attach(context, settings) {
  document.querySelectorAll('hx-card').forEach((card) => {
    card.addEventListener('click', handler);
  });
},

// CORRECT: scoped to context, protected by once()
attach(context, settings) {
  once('helixui:card-click', 'hx-card', context).forEach((card) => {
    card.addEventListener('click', handler);
  });
},
```

### Not Using `once()`

```javascript
// WRONG: click handler added again on every attach() call
attach(context, settings) {
  context.querySelectorAll('hx-card').forEach((card) => {
    card.addEventListener('click', handler);
  });
},
```

After three AJAX responses, each card has four click handlers.

### Setting Properties Without `whenDefined()`

```javascript
// RISKY: if the component is not yet defined, .columns is set on an HTMLElement
// and the property is silently discarded when the component upgrades
attach(context, settings) {
  document.querySelector('hx-data-table').columns = JSON.parse(columnsJson);
},

// SAFE: property is set after upgrade guarantees the component accepts it
attach(context, settings) {
  once('helixui:table-init', 'hx-data-table', context).forEach((table) => {
    customElements.whenDefined('hx-data-table').then(() => {
      table.columns = JSON.parse(columnsJson);
    });
  });
},
```

---

## Additional Resources

- [Drupal Behaviors Fundamentals](/drupal/behaviors/fundamentals/)
- [Once API](/drupal/behaviors/once-api/)
- [Behaviors with Web Components](/drupal/behaviors/web-components/)
