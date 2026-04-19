---
title: Behaviors with Web Components
description: Web component specific behavior patterns — customElements.whenDefined() for async readiness, setting complex properties (arrays, objects), event listeners with composed events, Lit lifecycle integration, and Shadow DOM querying.
sidebar:
  order: 4
---

HELiX components are custom elements built with Lit. They upgrade automatically when their definition is registered, but there are important timing and API details to understand when writing Drupal Behaviors that interact with them. This document covers everything specific to the custom element lifecycle.

---

## The Custom Element Upgrade Lifecycle

### What "Upgrade" Means

When Drupal renders `<hx-card variant="featured">` in a Twig template, the browser initially parses it as an `HTMLElement` (because `hx-card` is unknown). The element exists in the DOM immediately — Drupal's server-side rendering works. No JavaScript has run yet.

When the HELiX script executes `customElements.define('hx-card', HelixCard)`, the browser "upgrades" every existing `<hx-card>` instance: it calls the class constructor and `connectedCallback`. After upgrade, the Shadow DOM attaches, styles apply, and JavaScript properties become available.

### Implication for Behaviors

```
Page loads:
1. Drupal renders HTML (hx-card elements exist in DOM as plain HTMLElement)
2. Drupal Libraries API loads scripts in dependency order
3. HELiX library executes → defines all hx-* custom elements → all instances upgrade
4. Drupal calls Drupal.attachBehaviors(document, drupalSettings)
5. Your Behavior's attach() runs
```

In the typical loading order, step 3 happens before step 4. When your `attach()` runs, most components are already defined and upgraded. However, you should not assume this order — module weight, conditional loading, or lazy imports can change it.

---

## `customElements.whenDefined()`

`customElements.whenDefined(tagName)` returns a Promise that resolves to the component constructor when the element is defined (or immediately if it already is).

### Basic Usage

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxCardEnhance = {
    attach(context, settings) {
      once('helixui:card-enhance', 'hx-card', context).forEach((card) => {
        // Wait for definition before setting JavaScript properties
        customElements.whenDefined('hx-card').then(() => {
          // Safe to access component-specific properties and methods
          card.someComplexProperty = { key: 'value' };
        });
      });
    },
  };

})(Drupal, once);
```

### When `whenDefined()` Is Required

You need `whenDefined()` when:

1. **Setting non-reflected JavaScript properties** — properties like `columns`, `data`, `options`, `config` that accept objects or arrays
2. **Calling component methods** — methods defined on the component class (e.g., `card.refresh()`, `table.sort()`)
3. **Accessing Lit-specific internals** — `updateComplete`, `renderRoot`, or anything from Lit's API

You do NOT need `whenDefined()` for:

- Reading or writing HTML attributes (`getAttribute`, `setAttribute`)
- Adding DOM event listeners (`addEventListener`)
- Reading standard element properties (`id`, `className`, `dataset`)

### Awaiting Multiple Components

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxDashboardInit = {
    attach(context, settings) {
      // Initialize different component types concurrently
      once('helixui:summary-card', 'hx-card[data-summary]', context).forEach((card) => {
        customElements.whenDefined('hx-card').then(() => {
          const summaryJson = card.getAttribute('data-summary');
          if (summaryJson) {
            card.summaryData = JSON.parse(summaryJson);
          }
        });
      });

      once('helixui:data-chart', 'hx-chart[data-series]', context).forEach((chart) => {
        customElements.whenDefined('hx-chart').then(() => {
          const seriesJson = chart.getAttribute('data-series');
          if (seriesJson) {
            chart.series = JSON.parse(seriesJson);
          }
        });
      });
    },
  };

})(Drupal, once);
```

---

## Setting Complex Properties

### Pattern: JSON Data Attribute → JavaScript Property

This is the canonical pattern for passing objects and arrays from Twig to a HELiX component.

**Twig template:**

```twig
{# Encode the data as JSON in a data- attribute #}
<hx-data-table
  id="patient-table"
  data-columns="{{ columns|json_encode|escape }}"
  data-rows="{{ rows|json_encode|escape }}"
>
  {# Progressive-enhancement fallback for no-JS #}
  <table>
    <thead>
      <tr>{% for col in columns %}<th>{{ col.label }}</th>{% endfor %}</tr>
    </thead>
    <tbody>
      {% for row in rows %}
        <tr>{% for col in columns %}<td>{{ row[col.field] }}</td>{% endfor %}</tr>
      {% endfor %}
    </tbody>
  </table>
</hx-data-table>
```

**Drupal Behavior:**

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxDataTableInit = {
    attach(context, settings) {
      once('helixui:data-table-init', 'hx-data-table[data-columns]', context).forEach((table) => {
        customElements.whenDefined('hx-data-table').then(() => {
          try {
            const columnsJson = table.getAttribute('data-columns');
            const rowsJson = table.getAttribute('data-rows');

            if (columnsJson) table.columns = JSON.parse(columnsJson);
            if (rowsJson) table.data = JSON.parse(rowsJson);

            // Optional: remove the fallback table after hydration
            const fallback = table.querySelector('table');
            if (fallback) fallback.remove();
          } catch (error) {
            console.error('[HELiX] hx-data-table initialization failed:', error);
          }
        });
      });
    },
  };

})(Drupal, once);
```

### Setting Options Arrays

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxMultiSelectInit = {
    attach(context, settings) {
      once('helixui:multi-select-init', 'hx-multi-select[data-options]', context).forEach((select) => {
        customElements.whenDefined('hx-multi-select').then(() => {
          const optionsJson = select.getAttribute('data-options');
          const selectedJson = select.getAttribute('data-selected');

          if (optionsJson) {
            try {
              select.options = JSON.parse(optionsJson);
            } catch (e) {
              console.error('[HELiX] hx-multi-select: invalid options JSON', e);
            }
          }

          if (selectedJson) {
            try {
              select.selectedValues = JSON.parse(selectedJson);
            } catch (e) {
              console.error('[HELiX] hx-multi-select: invalid selected JSON', e);
            }
          }
        });
      });
    },
  };

})(Drupal, once);
```

---

## Event Listeners with Composed Events

### The `composed` Flag

HELiX components emit events with `composed: true`. This causes them to cross the Shadow DOM boundary and bubble up through the document tree. You can listen for these events at any ancestor level.

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxFormSubmitHandler = {
    attach(context, settings) {
      // Listen on the form — catches hx-submit from any hx-* inside it
      once('helixui:form-submit', 'form[data-helix-form]', context).forEach((form) => {
        form.addEventListener('hx-submit', (event) => {
          // event.target is the hx-button that was activated
          // event.detail contains component-specific data
          console.log('Form submit from:', event.target.tagName);
          console.log('Submitter:', event.detail?.submitter);

          // Prevent default browser form submission and handle via AJAX
          event.preventDefault();
          submitFormAjax(form);
        });
      });
    },
  };

})(Drupal, once);
```

### Finding the Event Source

Because events from inside a Shadow DOM appear to come from the host element (not the internal Shadow DOM element), `event.target` points to the HELiX component element in the Light DOM.

```javascript
document.addEventListener('hx-change', (event) => {
  // event.target is the hx-text-input, hx-select, etc. in your Twig markup
  const componentName = event.target.tagName.toLowerCase(); // 'hx-text-input'
  const fieldName = event.target.getAttribute('name');      // 'patient_name'
  const newValue = event.detail?.value;                     // new field value

  console.log(`${fieldName} changed to: ${newValue}`);
});
```

### Listening for HELiX Component Events

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxAlertTracking = {
    attach(context, settings) {
      // Track when users dismiss alerts
      once('helixui:alert-dismiss-track', 'hx-alert[data-alert-id]', context).forEach((alert) => {
        alert.addEventListener('hx-dismiss', (event) => {
          const alertId = alert.getAttribute('data-alert-id');
          // Store dismissal in session so it doesn't re-appear
          sessionStorage.setItem(`alert-dismissed-${alertId}`, Date.now().toString());

          // Optionally notify the server
          const trackUrl = alert.getAttribute('data-track-url');
          if (trackUrl) {
            navigator.sendBeacon(trackUrl, JSON.stringify({ alertId, dismissed: true }));
          }
        });
      });
    },
  };

})(Drupal, once);
```

---

## Lit Lifecycle Integration

### `updateComplete` — After the Next Render

Lit components render asynchronously. After setting a property, the DOM update is scheduled as a microtask. If you need to read the rendered DOM after a property change (e.g., to measure a slot's height), wait for `updateComplete`.

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxCardHeightSync = {
    attach(context, settings) {
      once('helixui:card-height', '.card-grid hx-card', context).forEach((card) => {
        customElements.whenDefined('hx-card').then(() => {
          // Set a property that triggers a re-render
          card.variant = 'featured';

          // Wait for the render to complete before reading layout
          card.updateComplete.then(() => {
            const height = card.getBoundingClientRect().height;
            card.setAttribute('data-rendered-height', height);
          });
        });
      });
    },
  };

})(Drupal, once);
```

### `connectedCallback` Timing

Lit's `connectedCallback` runs synchronously when the element is inserted into the DOM. By the time your `attach()` runs, all `connectedCallback` calls have already completed for elements present on page load. For AJAX-injected elements, `connectedCallback` runs when Drupal inserts them into the DOM, before `attachBehaviors` is called.

You do not need to wait for `connectedCallback` in a Behavior — it has already run.

---

## Querying the Shadow DOM

### Why You Generally Should Not

Shadow DOM encapsulation is intentional. The component's internal elements should not be styled, repositioned, or manipulated from outside. The component's public API (attributes, properties, events, CSS custom properties) is the correct interface.

**If you find yourself needing to query inside a Shadow DOM, consider whether:**

- The component is missing an event or property that would serve your use case
- You should file a feature request on the HELiX component
- Your behavior can accomplish the goal through the public API

### When It Is Acceptable

Querying into the Shadow DOM from a Behavior is acceptable for:

- **Debugging** — verifying Shadow DOM structure during development
- **Accessibility testing** — asserting ARIA roles and labels on internal elements
- **Integration tests** — verifying component render output in automated tests

```javascript
// Reading Shadow DOM content — acceptable for debugging/testing
const card = document.querySelector('hx-card');
const shadowRoot = card.shadowRoot;

if (shadowRoot) {
  // Access internal elements
  const heading = shadowRoot.querySelector('.card__heading');
  const slots = shadowRoot.querySelectorAll('slot');

  slots.forEach((slot) => {
    console.log(`Slot "${slot.name || '(default)'}":`,
      slot.assignedElements().map(el => el.tagName));
  });
}
```

### Avoiding Shadow DOM Queries in Production Behaviors

```javascript
// BAD: reaches into shadow DOM to manipulate internals
once('helixui:bad-pattern', 'hx-card', context).forEach((card) => {
  const internalButton = card.shadowRoot?.querySelector('.card__action-button');
  if (internalButton) {
    internalButton.style.display = 'none'; // Breaks component assumptions
  }
});

// GOOD: use the component's public API
once('helixui:good-pattern', 'hx-card', context).forEach((card) => {
  // If you need to hide the actions, the component should expose a property for that
  card.hideActions = true; // Or use a CSS custom property or part
});
```

---

## Handling Components Not Yet in the DOM

When your Behavior needs to interact with a component that may not exist yet in `context`, use an observer pattern:

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxLazyInit = {
    attach(context, settings) {
      // Handle elements already in context
      once('helixui:lazy-card', 'hx-card[data-lazy]', context).forEach(initLazyCard);

      // Also watch for new elements added later (e.g., by JavaScript-driven insertion)
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check the added node itself
              if (node.matches('hx-card[data-lazy]')) {
                once('helixui:lazy-card', [node]).forEach(initLazyCard);
              }
              // Check descendants
              node.querySelectorAll?.('hx-card[data-lazy]').forEach((card) => {
                once('helixui:lazy-card', [card]).forEach(initLazyCard);
              });
            }
          });
        });
      });

      // Observe the context for added nodes
      const root = context === document ? document.body : context;
      observer.observe(root, { childList: true, subtree: true });
    },
  };

  function initLazyCard(card) {
    customElements.whenDefined('hx-card').then(() => {
      const lazyData = card.getAttribute('data-lazy');
      if (lazyData) card.lazyLoadConfig = JSON.parse(lazyData);
    });
  }

})(Drupal, once);
```

Note: For most Drupal use cases, a MutationObserver is not needed — Drupal's `attachBehaviors` handles AJAX content. Only use it for content inserted by non-Drupal JavaScript.

---

## Full Integration Example: Patient Card with Dynamic Data

```twig
{# templates/node/node--patient--card.html.twig #}
<hx-card
  variant="{{ view_mode == 'full' ? 'featured' : 'default' }}"
  elevation="{{ view_mode == 'full' ? 'floating' : 'raised' }}"
  data-entity-id="{{ node.id }}"
  data-entity-bundle="patient"
  data-view-mode="{{ view_mode }}"
  {% if view_mode != 'full' %}
    href="{{ url('entity.node.canonical', {'node': node.id}) }}"
  {% endif %}
>
  {% if content.field_photo|render|trim %}
    <div slot="image">{{ content.field_photo }}</div>
  {% endif %}

  <div slot="heading">
    <span>{{ label }}</span>
    {% if node.field_patient_id.value %}
      <small>MRN: {{ node.field_patient_id.value }}</small>
    {% endif %}
  </div>

  <div class="patient-card__body">
    {% if node.field_department.entity %}
      <hx-badge variant="secondary">
        {{ node.field_department.entity.name.value }}
      </hx-badge>
    {% endif %}
    {{ content.field_summary }}
  </div>

  {% if node.field_last_visit.value %}
    <time slot="footer" datetime="{{ node.field_last_visit.value|date('c') }}">
      Last visit: {{ node.field_last_visit.value|date('M j, Y') }}
    </time>
  {% endif %}

  <div slot="actions">
    <hx-button variant="primary" hx-size="sm">View Record</hx-button>
    {% if node.field_allow_scheduling.value %}
      <hx-button variant="ghost" hx-size="sm">Schedule</hx-button>
    {% endif %}
  </div>
</hx-card>
```

```javascript
// mytheme/js/behaviors/hx-patient-card.js
(function (Drupal, once) {
  'use strict';

  /**
   * Enhance patient cards with keyboard navigation and analytics.
   */
  Drupal.behaviors.mythemeHxPatientCard = {
    attach(context, settings) {
      once('helixui:patient-card', 'hx-card[data-entity-bundle="patient"]', context).forEach((card) => {
        const entityId = card.getAttribute('data-entity-id');
        const viewMode = card.getAttribute('data-view-mode');

        // Keyboard navigation for teaser/compact cards
        if (viewMode !== 'full') {
          card.setAttribute('tabindex', '0');
          card.setAttribute('role', 'button');

          card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              const href = card.getAttribute('href');
              if (href) window.location.href = href;
            }
          });
        }

        // Analytics: track card clicks if configured
        if (settings.helixui?.trackCardClicks) {
          card.addEventListener('hx-click', () => {
            if (navigator.sendBeacon && settings.helixui.analyticsUrl) {
              navigator.sendBeacon(settings.helixui.analyticsUrl, JSON.stringify({
                event: 'patient_card_click',
                entityId,
                viewMode,
              }));
            }
          });
        }

        // Set complex properties if present
        const vitalsJson = card.getAttribute('data-vitals-config');
        if (vitalsJson) {
          customElements.whenDefined('hx-card').then(() => {
            try {
              card.vitalsConfig = JSON.parse(vitalsJson);
            } catch (e) {
              console.error('[HELiX] Invalid vitals config JSON:', e);
            }
          });
        }
      });
    },
  };

})(Drupal, once);
```

---

## Summary

| Concern | Approach |
|---|---|
| Setting string/boolean attributes | Do it in Twig — no Behavior needed |
| Setting object/array properties | `once()` + `whenDefined()` + `JSON.parse()` |
| Adding event listeners | `once()` + `addEventListener()` |
| Listening for composed events | Attach listener to ancestor element |
| Waiting for re-render after property change | `await card.updateComplete` |
| Querying Shadow DOM | Avoid in production; acceptable for debugging |
| AJAX compatibility | Always use `once()` with `context` |
| Cleanup | Implement `detach()` for intervals, WebSockets, and global listeners |

---

## Additional Resources

- [Drupal Behaviors Fundamentals](/drupal/behaviors/fundamentals/)
- [Behavior Patterns](/drupal/behaviors/patterns/)
- [Once API](/drupal/behaviors/once-api/)
- [Lit — Reactive Properties](https://lit.dev/docs/components/properties/)
- [Lit — Lifecycle](https://lit.dev/docs/components/lifecycle/)
- [MDN — Custom Elements API](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
