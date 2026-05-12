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
      once('mysite:card-enhance', 'hx-card', context).forEach((card) => {
        // Wait for definition before invoking any component method or
        // reading Lit lifecycle state. (hx-card has no consumer-facing JS
        // properties beyond the CEM-exposed attributes — set values via
        // attributes/slots; whenDefined() is most useful when calling
        // updateComplete or component-specific methods.)
        customElements.whenDefined('hx-card').then(async () => {
          await card.updateComplete;
          // Now safe to read post-upgrade computed state.
        });
      });
    },
  };

})(Drupal, once);
```

### When `whenDefined()` Is Required

You need `whenDefined()` when:

1. **Setting non-reflected JavaScript properties** — properties that accept objects or arrays (e.g. `hx-data-table.columns`, `hx-data-table.rows`)
2. **Calling component methods** — methods defined on the component class (e.g. `hx-dialog.showModal()` / `close()`, `hx-toast.show()`); always check the component's CEM `members` list for what's actually public
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
      once('mysite:summary-card', 'hx-card[data-summary]', context).forEach((card) => {
        customElements.whenDefined('hx-card').then(() => {
          // hx-card has no `summaryData` property — drive content via slotted
          // markup or by mutating slotted child elements. The pattern below
          // assumes the summary HTML lives in a script[type=application/json]
          // sibling that we render into the card's default slot.
          const summaryEl = card.querySelector('[data-summary-target]');
          const summaryJson = card.getAttribute('data-summary');
          if (summaryEl && summaryJson) {
            const data = JSON.parse(summaryJson);
            summaryEl.textContent = data.label;
          }
        });
      });

      // hx-data-table is the canonical data-bound surface; there's no
      // shipped hx-chart component, so persist data via hx-data-table.rows.
      once('mysite:data-summary-table', 'hx-data-table[data-rows]', context).forEach((table) => {
        customElements.whenDefined('hx-data-table').then(() => {
          const rowsJson = table.getAttribute('data-rows');
          if (rowsJson) {
            table.rows = JSON.parse(rowsJson);
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
{# Encode the data as JSON in a data- attribute. hx-data-table is a complex
   widget — pair it with an aria-label or labelledby for the data table
   landmark so screen-reader users know what the table represents. #}
<hx-data-table
  id="patient-table"
  aria-label="{{ 'Patient roster — %d records'|format(rows|length) }}"
  data-columns="{{ columns|json_encode|escape }}"
  data-rows="{{ rows|json_encode|escape }}"
>
  {# Progressive-enhancement fallback for no-JS. Column keys in the CEM
     are `key` (not `field`). #}
  <table>
    <thead>
      <tr>{% for col in columns %}<th>{{ col.label }}</th>{% endfor %}</tr>
    </thead>
    <tbody>
      {% for row in rows %}
        <tr>{% for col in columns %}<td>{{ row[col.key] }}</td>{% endfor %}</tr>
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
      once('mysite:data-table-init', 'hx-data-table[data-columns]', context).forEach((table) => {
        customElements.whenDefined('hx-data-table').then(() => {
          try {
            const columnsJson = table.getAttribute('data-columns');
            const rowsJson = table.getAttribute('data-rows');

            if (columnsJson) table.columns = JSON.parse(columnsJson);
            // The public row-data property is `rows`, not `data`.
            if (rowsJson) table.rows = JSON.parse(rowsJson);

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

  // hx-multi-select does not exist as a shipped component. For multi-selection,
  // use hx-combobox (which supports a multiple attribute + chip rendering) and
  // populate options via slotted <option> children — the standard pattern.
  Drupal.behaviors.hxComboboxOptions = {
    attach(context, settings) {
      once('mysite:combobox-options', 'hx-combobox[data-options]', context).forEach((combo) => {
        customElements.whenDefined('hx-combobox').then(() => {
          const optionsJson = combo.getAttribute('data-options');
          if (!optionsJson) return;
          try {
            const options = JSON.parse(optionsJson);
            // Render <option> children — hx-combobox reads them via slot
            // assignment. Replace any existing options first.
            combo.replaceChildren(
              ...options.map((opt) => {
                const el = document.createElement('option');
                el.value = opt.value;
                el.textContent = opt.label;
                if (opt.selected) el.selected = true;
                return el;
              }),
            );
          } catch (e) {
            console.error('[HELiX] hx-combobox: invalid options JSON', e);
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
      // hx-submit is dispatched by hx-form (not by inner hx-button) and only
      // when the form runs in action-less Drupal-wrapped mode — see the
      // hx-form CEM entry for the full event-detail shape (valid, values,
      // formData). Listen at the hx-form host, not at the surrounding <form>.
      once('mysite:form-submit', 'hx-form[data-helix-form]', context).forEach((hxForm) => {
        hxForm.addEventListener('hx-submit', (event) => {
          // event.target is the hx-form element
          // event.detail = { valid, values, formData }
          if (!event.detail.valid) return;

          // Prevent default browser form submission and handle via AJAX
          event.preventDefault();
          submitFormAjax(hxForm, event.detail.formData);
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
      // Track when users dismiss alerts. hx-alert emits hx-close on dismiss
      // and hx-after-close after the close transition. Use hx-close for
      // tracking; use hx-after-close if you need to defer DOM cleanup.
      once('mysite:alert-dismiss-track', 'hx-alert[data-alert-id][dismissible]', context).forEach((alert) => {
        alert.addEventListener('hx-close', () => {
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
once('mysite:bad-pattern', 'hx-card', context).forEach((card) => {
  const internalButton = card.shadowRoot?.querySelector('.card__action-button');
  if (internalButton) {
    internalButton.style.display = 'none'; // Breaks component assumptions
  }
});

// GOOD: use the component's public surface — slots or CSS parts.
// (hx-card does not expose a hideActions property; if you need to omit the
// actions row, render the card without children in the actions slot, or
// hide the part via ::part(actions) in your CSS.)
once('mysite:good-pattern', 'hx-card', context).forEach((card) => {
  const actionsSlot = card.querySelector('[slot="actions"]');
  if (actionsSlot) actionsSlot.remove();
});

/* Or via CSS:
hx-card.no-actions::part(actions) { display: none; }
*/
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
      // hx-card has no lazyLoadConfig property. Hydrate the card's slotted
      // content yourself (image src, heading text, action buttons) once
      // the data-lazy descriptor resolves.
      const lazyData = card.getAttribute('data-lazy');
      if (!lazyData) return;
      const config = JSON.parse(lazyData);
      // Set src/alt on the slotted image, fill in the heading, etc.
      const img = card.querySelector('[slot="image"] img');
      if (img && config.imageUrl) {
        img.src = config.imageUrl;
        img.alt = config.imageAlt ?? '';
      }
    });
  }

})(Drupal, once);
```

Note: For most Drupal use cases, a MutationObserver is not needed — Drupal's `attachBehaviors` handles AJAX content. Only use it for content inserted by non-Drupal JavaScript.

---

## Full Integration Example: Patient Card with Dynamic Data

```twig
{# templates/node/node--patient--card.html.twig

   IMPORTANT ARIA anti-pattern guard: hx-card with hx-href becomes an
   interactive card (role="link") — the entire surface activates. Do NOT
   combine hx-href with slot="actions" that contains additional buttons,
   because nested interactive elements inside an interactive ancestor breaks
   screen-reader navigation and form a focusable-inside-focusable trap.
   Pick one model:
     (a) interactive card (hx-href set, no actions slot — the whole card is
         the activation surface), or
     (b) non-interactive card (no hx-href, render action buttons in
         slot="actions" for individual targets).
#}
{% set card_is_interactive = view_mode != 'full' %}

<hx-card
  variant="{{ view_mode == 'full' ? 'featured' : 'default' }}"
  elevation="{{ view_mode == 'full' ? 'floating' : 'raised' }}"
  data-entity-id="{{ node.id }}"
  data-entity-bundle="patient"
  data-view-mode="{{ view_mode }}"
  {% if card_is_interactive %}
    hx-href="{{ url('entity.node.canonical', {'node': node.id}) }}"
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

  {# Only render the actions slot in the non-interactive variant.
     In the interactive (hx-href) variant, the whole card activates;
     nested buttons here would break the ARIA contract. #}
  {% if not card_is_interactive %}
    <div slot="actions">
      <hx-button variant="primary" hx-size="sm">View Record</hx-button>
      {% if node.field_allow_scheduling.value %}
        <hx-button variant="ghost" hx-size="sm">Schedule</hx-button>
      {% endif %}
    </div>
  {% endif %}
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
      once('mysite:patient-card', 'hx-card[data-entity-bundle="patient"]', context).forEach((card) => {
        const entityId = card.getAttribute('data-entity-id');
        const viewMode = card.getAttribute('data-view-mode');

        // hx-card with hx-href supplies role="link", tabindex="0", and Enter-only activation
        // per WCAG 2.1.3 / ARIA APG — no custom keyboard handling is needed.

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

        // hx-card has no `vitalsConfig` property — vitals data should be
        // rendered into a child element (e.g. an hx-stat in the default
        // slot, or an hx-data-table) rather than mutated through the host.
        const vitalsJson = card.getAttribute('data-vitals-config');
        if (vitalsJson) {
          const vitalsTarget = card.querySelector('[data-vitals-target]');
          if (vitalsTarget) {
            try {
              const config = JSON.parse(vitalsJson);
              vitalsTarget.textContent = `${config.systolic}/${config.diastolic}`;
            } catch (e) {
              console.error('[HELiX] Invalid vitals config JSON:', e);
            }
          }
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
