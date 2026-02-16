---
title: Behaviors with Web Components
description: Deep dive into using Drupal Behaviors with hx- web components — property setting, event handling, initialization timing, custom element registration, and hydration patterns
order: 16
---

Drupal Behaviors are the bridge between Drupal's dynamic content rendering system and hx- web components. While web components auto-upgrade when added to the DOM, Behaviors provide the coordination layer for event handling, configuration injection, and integration with Drupal-specific APIs.

This comprehensive guide covers the full lifecycle of integrating hx- components with Drupal Behaviors, from basic property setting to advanced AJAX re-attachment and hydration patterns.

## The Relationship Between Behaviors and Web Components

### How Custom Elements Work

Web components based on the Custom Elements API (like hx- components) automatically "upgrade" when the browser encounters them in the DOM:

1. Component tags (`<hx-button>`, `<hx-card>`) are initially parsed as `HTMLUnknownElement`
2. When `customElements.define('hx-button', HelixButton)` executes, the browser upgrades all existing instances
3. New instances added to the DOM automatically upgrade on insertion
4. Upgrading triggers the component's lifecycle callbacks (`connectedCallback`, etc.)

This happens **automatically**, without any JavaScript intervention required.

### Why Behaviors Are Still Essential

Even though hx- components auto-upgrade, Behaviors provide critical integration:

**What Components Do Automatically:**

- Register with the browser's Custom Elements registry
- Render their Shadow DOM
- Set up internal event listeners
- Respond to attribute/property changes
- Participate in forms (via ElementInternals)

**What Behaviors Enable:**

- **Event handling**: Listen for custom events (`hx-click`, `hx-change`, etc.)
- **Configuration injection**: Pass drupalSettings data to components
- **Coordination**: Synchronize multiple components
- **Integration**: Connect to Drupal AJAX, routing, analytics
- **Initialization**: Run code after components have fully upgraded
- **Cleanup**: Remove listeners when content is removed

### The Two-Phase Initialization

When content loads (via page load, AJAX, or BigPipe), two things happen in sequence:

```javascript
// Phase 1: Custom Elements auto-upgrade (browser built-in)
// <hx-button> → Browser upgrades to HelixButton instance

// Phase 2: Drupal.attachBehaviors() runs (your code)
Drupal.behaviors.hxButtons = {
  attach(context, settings) {
    // Components are already upgraded and rendered
    // Now attach event listeners, configure properties, etc.
  },
};
```

**Key Insight**: When `attach()` runs, the components have already upgraded. You're working with fully initialized custom elements, not raw HTML.

## When to Use Behaviors with hx- Components

### Use Behaviors When You Need To:

#### 1. Listen for Custom Events

Components emit events like `hx-click`, `hx-change`, `hx-input`, etc. Behaviors attach listeners:

```javascript
import { once } from 'core/once';

Drupal.behaviors.hxButtonEvents = {
  attach(context, settings) {
    once('hx-button-events', 'hx-button[data-track]', context).forEach((button) => {
      button.addEventListener('hx-click', (event) => {
        // Handle click event
        console.log('Button clicked:', event.detail);
      });
    });
  },
};
```

#### 2. Configure Components from drupalSettings

Pass PHP configuration to components:

```php
// In PHP
$build['#attached']['drupalSettings']['hxConfig'] = [
  'apiUrl' => 'https://api.example.com',
  'patientId' => $patient->id(),
];
```

```javascript
// In Behavior
Drupal.behaviors.hxConfig = {
  attach(context, settings) {
    const config = settings.hxConfig;
    once('hx-patient-card-config', 'hx-card[data-patient]', context).forEach((card) => {
      card.setAttribute('api-url', config.apiUrl);
      card.setAttribute('patient-id', config.patientId);
    });
  },
};
```

#### 3. Coordinate Multiple Components

Synchronize component state:

```javascript
Drupal.behaviors.hxAccordionSync = {
  attach(context, settings) {
    once('hx-accordion-sync', '.accordion-group', context).forEach((group) => {
      const accordions = group.querySelectorAll('hx-accordion');

      accordions.forEach((accordion) => {
        accordion.addEventListener('hx-toggle', (event) => {
          if (event.detail.open) {
            // Close all other accordions in this group
            accordions.forEach((other) => {
              if (other !== accordion && other.open) {
                other.open = false;
              }
            });
          }
        });
      });
    });
  },
};
```

#### 4. Integrate with Drupal AJAX

Trigger AJAX requests from component events:

```javascript
Drupal.behaviors.hxAjaxIntegration = {
  attach(context, settings) {
    once('hx-ajax-card', 'hx-card[data-ajax-url]', context).forEach((card) => {
      card.addEventListener('hx-card-click', (event) => {
        const ajaxUrl = card.getAttribute('data-ajax-url');
        const ajax = Drupal.ajax({ url: ajaxUrl });
        ajax.execute();
      });
    });
  },
};
```

#### 5. Track Analytics

Send events to analytics platforms:

```javascript
Drupal.behaviors.hxAnalytics = {
  attach(context, settings) {
    if (!settings.analytics?.enabled) return;

    once('hx-form-analytics', 'hx-form', context).forEach((form) => {
      form.addEventListener('hx-submit', (event) => {
        gtag('event', 'form_submit', {
          form_id: form.id,
          form_fields: Object.keys(event.detail.values).length,
        });
      });
    });
  },
};
```

### Don't Use Behaviors When:

#### 1. Component Properties Are Set in HTML

Twig templates can set properties directly:

```twig
{# No Behavior needed — properties set in template #}
<hx-button variant="primary" hx-size="lg" disabled>
  Submit
</hx-button>
```

#### 2. Components Don't Emit Events You Need

If you're not listening for events, no Behavior is needed:

```twig
{# Static card — no interaction, no Behavior #}
<hx-card variant="default" elevation="raised">
  <span slot="heading">Patient Information</span>
  <p>Medical record number: 12345</p>
</hx-card>
```

#### 3. Native HTML Forms Are Sufficient

hx- form components participate in native forms automatically:

```html
<!-- No Behavior needed — native form submission works -->
<form method="post" action="/patients/create">
  <hx-text-input name="patient_name" label="Patient Name" required></hx-text-input>
  <hx-button type="submit">Create Patient</hx-button>
</form>
```

## Setting Component Properties in Behaviors

### Attributes vs. Properties

Web components expose both **attributes** (HTML strings) and **properties** (JavaScript values).

#### Attributes (setAttribute)

Use for strings, booleans, and enum values:

```javascript
// String attributes
button.setAttribute('variant', 'secondary');
button.setAttribute('hx-size', 'lg');

// Boolean attributes
button.setAttribute('disabled', ''); // Present = true
button.removeAttribute('disabled'); // Absent = false

// Check boolean attributes
if (button.hasAttribute('disabled')) {
  console.log('Button is disabled');
}
```

**Rules:**

- Boolean attributes: presence = true, absence = false (value doesn't matter)
- String attributes: always strings, no type conversion
- Reflected attributes: component updates when attribute changes
- Case-insensitive in HTML, but use lowercase for consistency

#### Properties (Direct Assignment)

Use for complex data, objects, arrays, functions:

```javascript
// String properties
input.value = 'John Doe';

// Boolean properties
button.disabled = true;

// Complex data (objects/arrays)
card.dataset.patientData = JSON.stringify({ id: 123, name: 'Jane' });

// Properties that don't reflect to attributes
select.value = 'option-2'; // May not show in attributes
```

**Rules:**

- Type-safe: TypeScript types enforced
- No serialization required for complex data
- May or may not reflect to attributes (component-specific)
- Case-sensitive (use exact property name)

### Timing: Wait for Component Upgrade

Components may not be fully upgraded when `attach()` first runs. For property setting that depends on component APIs, ensure upgrade is complete:

```javascript
Drupal.behaviors.hxWaitForUpgrade = {
  attach(context, settings) {
    once('hx-card-upgrade', 'hx-card', context).forEach((card) => {
      // Check if component is defined (upgraded)
      if (!customElements.get('hx-card')) {
        // Not yet registered; wait for definition
        customElements.whenDefined('hx-card').then(() => {
          this.configureCard(card, settings);
        });
      } else {
        // Already registered; configure immediately
        this.configureCard(card, settings);
      }
    });
  },

  configureCard(card, settings) {
    // Component is fully upgraded and ready
    card.setAttribute('variant', settings.cardVariant || 'default');
  },
};
```

**Best Practice:** For simple attribute setting, `customElements.whenDefined()` is usually unnecessary. For accessing component methods or complex properties, use it.

### Common Property-Setting Patterns

#### Pattern 1: Simple Attribute Setting

```javascript
Drupal.behaviors.hxSimpleConfig = {
  attach(context, settings) {
    once('hx-button-variant', 'hx-button[data-dynamic-variant]', context).forEach((button) => {
      const variant = button.getAttribute('data-dynamic-variant');
      button.setAttribute('variant', variant);
    });
  },
};
```

#### Pattern 2: Configuration from drupalSettings

```javascript
Drupal.behaviors.hxDrupalConfig = {
  attach(context, settings) {
    const config = settings.hxComponents?.buttonDefaults;
    if (!config) return;

    once('hx-button-defaults', 'hx-button:not([variant])', context).forEach((button) => {
      button.setAttribute('variant', config.variant || 'primary');
      button.setAttribute('hx-size', config.size || 'md');
    });
  },
};
```

#### Pattern 3: Conditional Property Setting

```javascript
Drupal.behaviors.hxConditionalProps = {
  attach(context, settings) {
    once('hx-form-readonly', 'hx-text-input', context).forEach((input) => {
      const isViewMode = settings.viewMode === 'readonly';

      if (isViewMode) {
        input.setAttribute('disabled', '');
        input.setAttribute('readonly', '');
      } else {
        input.removeAttribute('disabled');
        input.removeAttribute('readonly');
      }
    });
  },
};
```

#### Pattern 4: Data Binding via Attributes

```javascript
Drupal.behaviors.hxDataBinding = {
  attach(context, settings) {
    once('hx-card-data', 'hx-card[data-entity-id]', context).forEach((card) => {
      const entityId = card.getAttribute('data-entity-id');
      const entityData = settings.entities?.[entityId];

      if (entityData) {
        // Store complex data on element (not as attribute)
        card.__entityData = entityData;

        // Set simple attributes
        card.setAttribute('hx-href', entityData.url);
        card.setAttribute('variant', entityData.featured ? 'featured' : 'default');
      }
    });
  },
};
```

## Event Handling Patterns

### Understanding hx- Component Events

All hx- components emit custom events prefixed with `hx-`:

| Component        | Events                                | Detail                                       |
| ---------------- | ------------------------------------- | -------------------------------------------- |
| `hx-button`      | `hx-click`                            | `{ originalEvent: MouseEvent }`              |
| `hx-card`        | `hx-card-click`                       | `{ url: string, originalEvent: MouseEvent }` |
| `hx-text-input`  | `hx-input`, `hx-change`               | `{ value: string }`                          |
| `hx-select`      | `hx-change`                           | `{ value: string }`                          |
| `hx-checkbox`    | `hx-change`                           | `{ checked: boolean, value: string }`        |
| `hx-switch`      | `hx-change`                           | `{ checked: boolean }`                       |
| `hx-radio-group` | `hx-change`                           | `{ value: string }`                          |
| `hx-form`        | `hx-submit`, `hx-invalid`, `hx-reset` | `{ valid: boolean, values: {...} }`          |
| `hx-textarea`    | `hx-input`, `hx-change`               | `{ value: string }`                          |

All custom events:

- **Bubble**: Propagate up the DOM tree
- **Composed**: Cross shadow DOM boundaries
- **Cancelable**: Can be prevented with `event.preventDefault()`

### Pattern 1: Basic Event Listener

```javascript
import { once } from 'core/once';

Drupal.behaviors.hxBasicEvent = {
  attach(context, settings) {
    once('hx-button-click', 'hx-button', context).forEach((button) => {
      button.addEventListener('hx-click', (event) => {
        console.log('Button clicked:', event.detail);
      });
    });
  },

  detach(context, settings, trigger) {
    if (trigger === 'unload') {
      // Remove event listeners to prevent memory leaks
      const buttons = context.querySelectorAll('hx-button[data-once~="hx-button-click"]');
      buttons.forEach((button) => {
        // Clone and replace to remove all listeners
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
      });
      once.remove('hx-button-click', 'hx-button', context);
    }
  },
};
```

### Pattern 2: Event Delegation

For better performance with many elements, use event delegation:

```javascript
Drupal.behaviors.hxEventDelegation = {
  attach(context, settings) {
    // Only process document once (delegation works at document level)
    if (context !== document) return;

    once('hx-card-delegation', 'body', context).forEach((body) => {
      body.addEventListener('hx-card-click', (event) => {
        const card = event.target;
        if (!card.matches('hx-card[data-patient-id]')) return;

        const patientId = card.getAttribute('data-patient-id');
        console.log('Navigate to patient:', patientId);
        window.location.href = `/patients/${patientId}`;
      });
    });
  },
};
```

### Pattern 3: Event Handler with Cleanup

Store handler references for proper cleanup:

```javascript
Drupal.behaviors.hxEventCleanup = {
  handlers: new WeakMap(),

  attach(context, settings) {
    once('hx-input-handler', 'hx-text-input[data-track]', context).forEach((input) => {
      const handler = (event) => {
        console.log('Input value:', event.detail.value);
        this.trackInputChange(input.name, event.detail.value);
      };

      // Store handler for later removal
      this.handlers.set(input, handler);
      input.addEventListener('hx-input', handler);
    });
  },

  detach(context, settings, trigger) {
    if (trigger === 'unload') {
      const inputs = context.querySelectorAll('hx-text-input[data-track]');
      inputs.forEach((input) => {
        const handler = this.handlers.get(input);
        if (handler) {
          input.removeEventListener('hx-input', handler);
          this.handlers.delete(input);
        }
      });
      once.remove('hx-input-handler', 'hx-text-input[data-track]', context);
    }
  },

  trackInputChange(fieldName, value) {
    // Analytics tracking logic
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_field_interaction', {
        field_name: fieldName,
        field_value_length: value.length,
      });
    }
  },
};
```

### Pattern 4: Conditional Event Handling

```javascript
Drupal.behaviors.hxConditionalEvent = {
  attach(context, settings) {
    const ajaxEnabled = settings.hxForms?.ajaxSubmit ?? false;

    once('hx-form-submit', 'hx-form', context).forEach((form) => {
      form.addEventListener('hx-submit', (event) => {
        if (ajaxEnabled) {
          event.preventDefault();
          this.submitViaAjax(form, event.detail.values);
        } else {
          // Let native form submission happen
          console.log('Submitting form natively:', event.detail.values);
        }
      });
    });
  },

  submitViaAjax(form, values) {
    const ajaxUrl = form.getAttribute('data-ajax-url');
    if (!ajaxUrl) return;

    fetch(ajaxUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Form submitted successfully:', data);
      })
      .catch((error) => {
        console.error('Form submission error:', error);
      });
  },
};
```

### Pattern 5: Event Chaining

Handle multiple related events:

```javascript
Drupal.behaviors.hxEventChaining = {
  attach(context, settings) {
    once('hx-form-events', 'hx-form[data-track-lifecycle]', context).forEach((form) => {
      // Track form validation errors
      form.addEventListener('hx-invalid', (event) => {
        console.log('Form validation failed:', event.detail.errors);
        this.trackFormError(form.id, event.detail.errors);
      });

      // Track successful submission
      form.addEventListener('hx-submit', (event) => {
        console.log('Form submitted:', event.detail.values);
        this.trackFormSuccess(form.id, event.detail.values);
      });

      // Track form reset
      form.addEventListener('hx-reset', () => {
        console.log('Form reset');
        this.trackFormReset(form.id);
      });
    });
  },

  trackFormError(formId, errors) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_error', {
        form_id: formId,
        error_count: errors.length,
        error_fields: errors.map((e) => e.name).join(','),
      });
    }
  },

  trackFormSuccess(formId, values) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_submit', {
        form_id: formId,
        field_count: Object.keys(values).length,
      });
    }
  },

  trackFormReset(formId) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_reset', { form_id: formId });
    }
  },
};
```

## Initialization Timing and DOM Ready

### Understanding the Initialization Sequence

When a Drupal page loads, events happen in this order:

1. **HTML parsing begins** — Browser starts parsing HTML
2. **hx-library.js loads** — Custom Elements definitions execute
3. **Components register** — `customElements.define()` calls complete
4. **DOM ready** — `DOMContentLoaded` event fires
5. **Drupal.attachBehaviors()** — All behaviors' `attach()` methods run
6. **Component upgrade** — Browser upgrades existing components (may happen before or after step 5)
7. **Images/resources load** — `window.onload` fires

**Critical timing issue**: Steps 5 and 6 can happen in **either order**, depending on when the component JavaScript loads.

### Ensuring Components Are Ready

#### Strategy 1: Use `customElements.whenDefined()`

Wait for component definition before accessing component APIs:

```javascript
Drupal.behaviors.hxSafeInit = {
  attach(context, settings) {
    once('hx-card-init', 'hx-card', context).forEach((card) => {
      customElements.whenDefined('hx-card').then(() => {
        // Component is now fully upgraded and ready
        console.log('Card variant:', card.variant);
        this.configureCard(card);
      });
    });
  },

  configureCard(card) {
    // Access component properties and methods safely
    card.setAttribute('elevation', 'raised');
  },
};
```

#### Strategy 2: Check Element Constructor

Verify element has been upgraded:

```javascript
Drupal.behaviors.hxCheckUpgrade = {
  attach(context, settings) {
    once('hx-button-check', 'hx-button', context).forEach((button) => {
      if (button.constructor === HTMLElement || button.constructor === HTMLUnknownElement) {
        // Not yet upgraded; wait for definition
        customElements.whenDefined('hx-button').then(() => {
          this.configureButton(button);
        });
      } else {
        // Already upgraded
        this.configureButton(button);
      }
    });
  },

  configureButton(button) {
    console.log('Button is upgraded:', button.constructor.name);
  },
};
```

#### Strategy 3: Attribute-Only Initialization

If you only set attributes (not properties or methods), no waiting is needed:

```javascript
Drupal.behaviors.hxAttributeInit = {
  attach(context, settings) {
    once('hx-button-attrs', 'hx-button[data-configured="false"]', context).forEach((button) => {
      // Attributes work even before upgrade completes
      button.setAttribute('variant', 'secondary');
      button.setAttribute('hx-size', 'lg');
      button.setAttribute('data-configured', 'true');
    });
  },
};
```

**Recommendation**: Use Strategy 3 (attribute-only) for most cases. Use Strategy 1 (`customElements.whenDefined()`) only when accessing component methods or TypeScript properties.

### Handling AJAX-Loaded Content

When content loads via AJAX, `attach()` runs on the new fragment:

```javascript
Drupal.behaviors.hxAjaxContent = {
  attach(context, settings) {
    // context is the AJAX-loaded fragment, not document
    console.log('Context:', context);

    once('hx-ajax-card', 'hx-card', context).forEach((card) => {
      // Components in AJAX response auto-upgrade before attach() runs
      // (because browser upgrades synchronously on insertion)
      card.addEventListener('hx-card-click', (event) => {
        console.log('AJAX-loaded card clicked:', event.detail);
      });
    });
  },
};
```

**Key Insight**: Components in AJAX responses are **already upgraded** when `attach()` runs, because the browser upgrades them synchronously when they're inserted into the DOM.

### Handling BigPipe Streamed Content

BigPipe streams page chunks as they become available. Behaviors run on each chunk:

```javascript
Drupal.behaviors.hxBigPipe = {
  attach(context, settings) {
    // context is each streamed chunk
    once('hx-bigpipe-card', 'hx-card', context).forEach((card) => {
      // Components in streamed chunks are already upgraded
      console.log('BigPipe card:', card);
    });
  },
};
```

**No special handling needed**: BigPipe chunks behave the same as AJAX content. Components auto-upgrade before behaviors run.

## Custom Element Registration Timing

### Component Registration Order

hx- components register in this order:

1. **Script loads**: `hx-library.js` or per-component bundles load
2. **Class definitions execute**: `@customElement('hx-button')` decorators run
3. **Registry calls**: `customElements.define('hx-button', HelixButton)` executes
4. **Upgrade existing elements**: Browser finds and upgrades existing `<hx-button>` tags
5. **Ready for new elements**: Future `<hx-button>` tags auto-upgrade on insertion

### Detecting Registration Status

```javascript
Drupal.behaviors.hxRegistrationCheck = {
  attach(context, settings) {
    // Check if hx-button is registered
    const ButtonClass = customElements.get('hx-button');

    if (ButtonClass) {
      console.log('hx-button is registered:', ButtonClass.name);
    } else {
      console.log('hx-button not yet registered, waiting...');
      customElements.whenDefined('hx-button').then(() => {
        console.log('hx-button is now registered');
      });
    }
  },
};
```

### Handling Pre-Registered Components

If components are loaded early (e.g., in `<head>`), they're registered before behaviors run:

```html
<!-- Components load in <head> -->
<script type="module" src="/libraries/hx-library/dist/index.js"></script>

<!-- Behaviors load later (after DOM) -->
<script src="/themes/mytheme/js/behaviors.js"></script>
```

In this case, components are always ready when behaviors run:

```javascript
Drupal.behaviors.hxEarlyLoad = {
  attach(context, settings) {
    once('hx-button-early', 'hx-button', context).forEach((button) => {
      // Component is always upgraded (loaded in <head>)
      console.log('Button variant:', button.variant);
    });
  },
};
```

### Handling Lazy-Loaded Components

If components load on-demand (lazy loading), wait for registration:

```javascript
Drupal.behaviors.hxLazyLoad = {
  attach(context, settings) {
    once('hx-lazy-card', 'hx-card', context).forEach((card) => {
      // May not be registered yet if lazy-loaded
      customElements.whenDefined('hx-card').then(() => {
        console.log('hx-card loaded and registered');
        this.configureCard(card);
      });
    });
  },

  configureCard(card) {
    card.setAttribute('elevation', 'raised');
  },
};
```

## Hydration Patterns

Hydration refers to attaching interactivity to server-rendered HTML. hx- components hydrate automatically, but Behaviors can enhance this process.

### Pattern 1: Progressive Enhancement

Start with semantic HTML, enhance with components:

```html
<!-- Server-rendered HTML (works without JS) -->
<div class="card" data-enhance="hx-card" data-variant="featured">
  <h2 class="card__heading">Patient Record</h2>
  <p class="card__body">Medical record number: 12345</p>
</div>
```

```javascript
Drupal.behaviors.hxHydrate = {
  attach(context, settings) {
    once('hx-hydrate', '[data-enhance]', context).forEach((element) => {
      const tagName = element.getAttribute('data-enhance');

      // Create web component
      const component = document.createElement(tagName);

      // Transfer attributes
      Array.from(element.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-') && attr.name !== 'data-enhance') {
          const propName = attr.name.replace('data-', '');
          component.setAttribute(propName, attr.value);
        }
      });

      // Transfer content
      component.innerHTML = element.innerHTML;

      // Replace element with component
      element.replaceWith(component);
    });
  },
};
```

### Pattern 2: State Restoration

Restore component state from localStorage or sessionStorage:

```javascript
Drupal.behaviors.hxStateRestore = {
  attach(context, settings) {
    once('hx-accordion-restore', 'hx-accordion[data-persist]', context).forEach((accordion) => {
      const storageKey = `accordion-state-${accordion.id}`;
      const savedState = localStorage.getItem(storageKey);

      if (savedState) {
        accordion.open = JSON.parse(savedState);
      }

      // Save state on change
      accordion.addEventListener('hx-toggle', (event) => {
        localStorage.setItem(storageKey, JSON.stringify(event.detail.open));
      });
    });
  },
};
```

### Pattern 3: Data Hydration

Hydrate components with data from drupalSettings:

```php
// In PHP: Pass entity data to JavaScript
$build['#attached']['drupalSettings']['patients'] = [
  '123' => [
    'id' => 123,
    'name' => 'Jane Doe',
    'mrn' => 'MRN-123456',
    'status' => 'active',
  ],
];
```

```javascript
Drupal.behaviors.hxDataHydration = {
  attach(context, settings) {
    const patients = settings.patients || {};

    once('hx-patient-card-hydrate', 'hx-card[data-patient-id]', context).forEach((card) => {
      const patientId = card.getAttribute('data-patient-id');
      const patientData = patients[patientId];

      if (patientData) {
        // Hydrate card with patient data
        const heading = card.querySelector('[slot="heading"]');
        if (heading) heading.textContent = patientData.name;

        const body = card.querySelector('.patient-mrn');
        if (body) body.textContent = `MRN: ${patientData.mrn}`;

        // Set status as CSS class
        card.classList.add(`patient-status--${patientData.status}`);
      }
    });
  },
};
```

### Pattern 4: Deferred Hydration

Delay hydration until components are visible (Intersection Observer):

```javascript
Drupal.behaviors.hxDeferredHydration = {
  attach(context, settings) {
    once('hx-defer-hydrate', '[data-defer-hydrate]', context).forEach((element) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.hydrateComponent(element);
              observer.unobserve(element);
            }
          });
        },
        { rootMargin: '50px' },
      );

      observer.observe(element);
    });
  },

  hydrateComponent(element) {
    const tagName = element.getAttribute('data-defer-hydrate');
    const component = document.createElement(tagName);

    // Transfer content and attributes
    component.innerHTML = element.innerHTML;
    Array.from(element.attributes).forEach((attr) => {
      if (!attr.name.startsWith('data-defer')) {
        component.setAttribute(attr.name, attr.value);
      }
    });

    element.replaceWith(component);
    console.log('Hydrated component:', tagName);
  },
};
```

## AJAX Re-Attachment Patterns

When Drupal AJAX replaces or updates content, `attach()` and `detach()` run on the affected elements.

### Pattern 1: AJAX Replace Command

Content is completely replaced:

```php
// PHP: Replace content with AJAX
$response = new AjaxResponse();
$response->addCommand(new HtmlCommand('#patient-list', $newHtml));
return $response;
```

```javascript
Drupal.behaviors.hxAjaxReplace = {
  attach(context, settings) {
    // Runs on NEW content after replacement
    once('hx-ajax-card', 'hx-card', context).forEach((card) => {
      card.addEventListener('hx-card-click', this.handleCardClick.bind(this));
    });
  },

  detach(context, settings, trigger) {
    // Runs on OLD content before replacement
    if (trigger === 'unload') {
      const cards = context.querySelectorAll('hx-card');
      cards.forEach((card) => {
        card.removeEventListener('hx-card-click', this.handleCardClick);
      });
      once.remove('hx-ajax-card', 'hx-card', context);
    }
  },

  handleCardClick(event) {
    console.log('Card clicked:', event.detail);
  },
};
```

### Pattern 2: AJAX Append Command

New content is appended to existing content:

```php
// PHP: Append new content
$response = new AjaxResponse();
$response->addCommand(new AppendCommand('#patient-list', $newPatients));
return $response;
```

```javascript
Drupal.behaviors.hxAjaxAppend = {
  attach(context, settings) {
    // Runs ONLY on new content, not existing content
    once('hx-patient-card', 'hx-card[data-patient-id]', context).forEach((card) => {
      card.addEventListener('hx-card-click', (event) => {
        const patientId = card.getAttribute('data-patient-id');
        console.log('New patient card clicked:', patientId);
      });
    });
  },
};
```

**Key Insight**: `once()` ensures existing cards aren't re-processed when new ones are appended.

### Pattern 3: AJAX with Settings Update

AJAX response includes updated drupalSettings:

```php
// PHP: Update settings and content
$response = new AjaxResponse();
$response->addCommand(new SettingsCommand([
  'patients' => ['lastUpdated' => time(), 'count' => $count],
], TRUE));
$response->addCommand(new HtmlCommand('#patient-list', $newHtml));
return $response;
```

```javascript
Drupal.behaviors.hxAjaxSettings = {
  attach(context, settings) {
    const patientSettings = settings.patients;
    console.log('Patient count:', patientSettings?.count);
    console.log('Last updated:', patientSettings?.lastUpdated);

    once('hx-patient-card-ajax', 'hx-card', context).forEach((card) => {
      // Use updated settings to configure card
      if (patientSettings?.count > 100) {
        card.setAttribute('variant', 'compact');
      }
    });
  },
};
```

### Pattern 4: Infinite Scroll with AJAX

Load more content on scroll:

```javascript
Drupal.behaviors.hxInfiniteScroll = {
  attach(context, settings) {
    once('hx-infinite-scroll', '[data-infinite-scroll]', context).forEach((container) => {
      const loadMore = container.querySelector('[data-load-more]');
      if (!loadMore) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.loadMoreContent(container, loadMore);
            }
          });
        },
        { rootMargin: '200px' },
      );

      observer.observe(loadMore);
    });
  },

  loadMoreContent(container, loadMore) {
    const url = loadMore.getAttribute('data-ajax-url');
    const offset = parseInt(loadMore.getAttribute('data-offset') || '0', 10);

    fetch(`${url}?offset=${offset}`)
      .then((response) => response.text())
      .then((html) => {
        // Insert new content before load-more button
        loadMore.insertAdjacentHTML('beforebegin', html);

        // Update offset
        loadMore.setAttribute('data-offset', offset + 10);

        // Re-attach behaviors to new content
        const newContent = loadMore.previousElementSibling;
        Drupal.attachBehaviors(newContent, drupalSettings);
      });
  },
};
```

## Complete Working Examples

### Example 1: Patient Dashboard with Live Search

```javascript
/**
 * Patient Dashboard Behavior
 *
 * Handles patient card interactions, live search filtering, and AJAX loading.
 */
import { once } from 'core/once';

(function (Drupal, drupalSettings, once) {
  'use strict';

  Drupal.behaviors.hxPatientDashboard = {
    attach(context, settings) {
      // Initialize search input
      once('hx-patient-search', 'hx-text-input[data-search-target]', context).forEach((input) => {
        const target = document.querySelector(input.getAttribute('data-search-target'));
        if (!target) return;

        let debounceTimer;
        input.addEventListener('hx-input', (event) => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            this.filterPatients(target, event.detail.value);
          }, 300);
        });
      });

      // Initialize patient cards
      once('hx-patient-card', 'hx-card[data-patient-id]', context).forEach((card) => {
        const patientId = card.getAttribute('data-patient-id');

        // Navigate to patient detail on card click
        card.addEventListener('hx-card-click', (event) => {
          if (settings.hxPatients?.useAjax) {
            event.preventDefault();
            this.loadPatientDetail(patientId);
          } else {
            // Let default navigation happen
            window.location.href = event.detail.url;
          }
        });

        // Track card view
        if (settings.analytics?.enabled) {
          this.trackPatientView(patientId);
        }
      });

      // Initialize "Load More" button
      once('hx-load-more', 'hx-button[data-load-more]', context).forEach((button) => {
        button.addEventListener('hx-click', (event) => {
          event.preventDefault();
          this.loadMorePatients(button);
        });
      });
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        // Clean up search debounce timers
        const searchInputs = context.querySelectorAll('hx-text-input[data-search-target]');
        searchInputs.forEach((input) => {
          // Clear any pending timers
          if (input._debounceTimer) {
            clearTimeout(input._debounceTimer);
          }
        });

        // Remove once markers
        once.remove('hx-patient-search', 'hx-text-input[data-search-target]', context);
        once.remove('hx-patient-card', 'hx-card[data-patient-id]', context);
        once.remove('hx-load-more', 'hx-button[data-load-more]', context);
      }
    },

    filterPatients(container, query) {
      const cards = container.querySelectorAll('hx-card[data-patient-id]');
      const lowerQuery = query.toLowerCase();

      cards.forEach((card) => {
        const name = card.querySelector('[slot="heading"]')?.textContent.toLowerCase() || '';
        const content = card.textContent.toLowerCase();

        if (name.includes(lowerQuery) || content.includes(lowerQuery)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    },

    loadPatientDetail(patientId) {
      const ajax = Drupal.ajax({
        url: `/ajax/patients/${patientId}`,
        wrapper: 'patient-detail-modal',
      });
      ajax.execute();
    },

    loadMorePatients(button) {
      const offset = parseInt(button.getAttribute('data-offset') || '0', 10);
      const limit = parseInt(button.getAttribute('data-limit') || '10', 10);

      // Show loading state
      button.setAttribute('disabled', '');
      button.textContent = 'Loading...';

      fetch(`/ajax/patients/load-more?offset=${offset}&limit=${limit}`)
        .then((response) => response.text())
        .then((html) => {
          // Insert new cards before button
          button.insertAdjacentHTML('beforebegin', html);

          // Update offset
          button.setAttribute('data-offset', offset + limit);

          // Reset button state
          button.removeAttribute('disabled');
          button.textContent = 'Load More Patients';

          // Attach behaviors to new content
          const container = button.parentElement;
          Drupal.attachBehaviors(container, drupalSettings);
        })
        .catch((error) => {
          console.error('Failed to load patients:', error);
          button.removeAttribute('disabled');
          button.textContent = 'Load More Patients';
        });
    },

    trackPatientView(patientId) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'patient_card_view', {
          patient_id: patientId,
          timestamp: Date.now(),
        });
      }
    },
  };
})(Drupal, drupalSettings, once);
```

### Example 2: Multi-Step Form with hx-form

```javascript
/**
 * Multi-Step Form Behavior
 *
 * Handles multi-step form navigation, validation, and submission.
 */
import { once } from 'core/once';

(function (Drupal, drupalSettings, once) {
  'use strict';

  Drupal.behaviors.hxMultiStepForm = {
    currentStep: 1,
    totalSteps: 3,
    formData: {},

    attach(context, settings) {
      once('hx-multistep-form', 'hx-form[data-multistep]', context).forEach((form) => {
        this.initializeForm(form, settings);
      });

      // Initialize step navigation buttons
      once('hx-step-nav', 'hx-button[data-step-action]', context).forEach((button) => {
        button.addEventListener('hx-click', (event) => {
          const action = button.getAttribute('data-step-action');
          this.handleStepNavigation(button.closest('hx-form'), action);
        });
      });
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-multistep-form', 'hx-form[data-multistep]', context);
        once.remove('hx-step-nav', 'hx-button[data-step-action]', context);
      }
    },

    initializeForm(form, settings) {
      this.totalSteps = parseInt(form.getAttribute('data-total-steps') || '3', 10);
      this.currentStep = 1;
      this.showStep(form, this.currentStep);

      // Handle form submission
      form.addEventListener('hx-submit', (event) => {
        this.handleFormSubmit(form, event.detail.values);
      });

      // Handle validation errors
      form.addEventListener('hx-invalid', (event) => {
        this.handleValidationErrors(form, event.detail.errors);
      });
    },

    showStep(form, step) {
      const steps = form.querySelectorAll('[data-step]');
      const progressIndicator = form.querySelector('[data-progress-indicator]');

      steps.forEach((stepElement, index) => {
        const stepNumber = parseInt(stepElement.getAttribute('data-step'), 10);
        stepElement.style.display = stepNumber === step ? 'block' : 'none';
      });

      // Update progress indicator
      if (progressIndicator) {
        const percentage = ((step - 1) / (this.totalSteps - 1)) * 100;
        progressIndicator.style.width = `${percentage}%`;
      }

      // Update navigation buttons
      this.updateNavigationButtons(form, step);
    },

    updateNavigationButtons(form, step) {
      const prevButton = form.querySelector('[data-step-action="prev"]');
      const nextButton = form.querySelector('[data-step-action="next"]');
      const submitButton = form.querySelector('[data-step-action="submit"]');

      if (prevButton) {
        prevButton.style.display = step > 1 ? 'inline-block' : 'none';
      }

      if (nextButton) {
        nextButton.style.display = step < this.totalSteps ? 'inline-block' : 'none';
      }

      if (submitButton) {
        submitButton.style.display = step === this.totalSteps ? 'inline-block' : 'none';
      }
    },

    handleStepNavigation(form, action) {
      if (action === 'next') {
        // Validate current step before proceeding
        if (this.validateStep(form, this.currentStep)) {
          this.saveStepData(form, this.currentStep);
          this.currentStep++;
          this.showStep(form, this.currentStep);
        }
      } else if (action === 'prev') {
        this.currentStep--;
        this.showStep(form, this.currentStep);
      } else if (action === 'submit') {
        // Final validation and submission
        if (this.validateStep(form, this.currentStep)) {
          this.saveStepData(form, this.currentStep);
          form.dispatchEvent(new Event('submit'));
        }
      }
    },

    validateStep(form, step) {
      const stepElement = form.querySelector(`[data-step="${step}"]`);
      if (!stepElement) return true;

      const inputs = stepElement.querySelectorAll('hx-text-input, hx-select, hx-textarea');
      let allValid = true;

      inputs.forEach((input) => {
        if (!input.checkValidity()) {
          input.reportValidity();
          allValid = false;
        }
      });

      return allValid;
    },

    saveStepData(form, step) {
      const stepElement = form.querySelector(`[data-step="${step}"]`);
      if (!stepElement) return;

      const inputs = stepElement.querySelectorAll(
        'hx-text-input, hx-select, hx-textarea, hx-checkbox',
      );
      inputs.forEach((input) => {
        if (input.name) {
          this.formData[input.name] = input.value;
        }
      });
    },

    handleFormSubmit(form, values) {
      // Merge all step data
      const allData = { ...this.formData, ...values };

      console.log('Submitting multi-step form:', allData);

      // Submit via AJAX
      const ajaxUrl = form.getAttribute('data-ajax-url');
      if (ajaxUrl) {
        fetch(ajaxUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(allData),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Form submitted successfully:', data);
            this.showSuccessMessage(form);
          })
          .catch((error) => {
            console.error('Form submission error:', error);
            this.showErrorMessage(form, error.message);
          });
      }
    },

    handleValidationErrors(form, errors) {
      console.error('Form validation errors:', errors);

      // Focus first error field
      if (errors.length > 0) {
        const firstErrorField = form.querySelector(`[name="${errors[0].name}"]`);
        if (firstErrorField && 'focus' in firstErrorField) {
          firstErrorField.focus();
        }
      }
    },

    showSuccessMessage(form) {
      const successMessage = document.createElement('hx-alert');
      successMessage.setAttribute('variant', 'success');
      successMessage.textContent = 'Form submitted successfully!';
      form.prepend(successMessage);
    },

    showErrorMessage(form, message) {
      const errorAlert = document.createElement('hx-alert');
      errorAlert.setAttribute('variant', 'error');
      errorAlert.textContent = `Submission failed: ${message}`;
      form.prepend(errorAlert);
    },
  };
})(Drupal, drupalSettings, once);
```

### Example 3: Real-Time Form Validation

```javascript
/**
 * Real-Time Form Validation Behavior
 *
 * Provides real-time validation feedback for hx- form components.
 */
import { once } from 'core/once';

(function (Drupal, drupalSettings, once) {
  'use strict';

  Drupal.behaviors.hxRealtimeValidation = {
    attach(context, settings) {
      const validationRules = settings.hxValidation?.rules || {};

      // Attach validation to text inputs
      once('hx-validation-input', 'hx-text-input[data-validate]', context).forEach((input) => {
        const fieldName = input.name || input.id;
        const rules = validationRules[fieldName];

        if (rules) {
          this.attachValidation(input, rules);
        }
      });

      // Attach validation to text areas
      once('hx-validation-textarea', 'hx-textarea[data-validate]', context).forEach((textarea) => {
        const fieldName = textarea.name || textarea.id;
        const rules = validationRules[fieldName];

        if (rules) {
          this.attachValidation(textarea, rules);
        }
      });
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-validation-input', 'hx-text-input[data-validate]', context);
        once.remove('hx-validation-textarea', 'hx-textarea[data-validate]', context);
      }
    },

    attachValidation(element, rules) {
      // Apply validation rules as attributes
      if (rules.required) {
        element.setAttribute('required', '');
      }
      if (rules.pattern) {
        element.setAttribute('pattern', rules.pattern);
      }
      if (rules.minlength) {
        element.setAttribute('minlength', rules.minlength);
      }
      if (rules.maxlength) {
        element.setAttribute('maxlength', rules.maxlength);
      }

      // Real-time validation on input
      element.addEventListener('hx-input', (event) => {
        this.validateField(element, rules, event.detail.value);
      });

      // Final validation on blur
      element.addEventListener('blur', () => {
        const value = element.value;
        const isValid = this.validateField(element, rules, value);

        if (!isValid) {
          element.reportValidity();
        }
      });
    },

    validateField(element, rules, value) {
      let errorMessage = '';

      // Required validation
      if (rules.required && !value.trim()) {
        errorMessage = rules.requiredMessage || 'This field is required.';
      }

      // Pattern validation
      else if (rules.pattern && value && !new RegExp(rules.pattern).test(value)) {
        errorMessage = rules.patternMessage || 'Invalid format.';
      }

      // Min length validation
      else if (rules.minlength && value.length < rules.minlength) {
        errorMessage = rules.minlengthMessage || `Minimum ${rules.minlength} characters required.`;
      }

      // Max length validation
      else if (rules.maxlength && value.length > rules.maxlength) {
        errorMessage = rules.maxlengthMessage || `Maximum ${rules.maxlength} characters allowed.`;
      }

      // Custom validation function
      else if (rules.custom && typeof rules.custom === 'function') {
        const customError = rules.custom(value);
        if (customError) {
          errorMessage = customError;
        }
      }

      // Set error state
      if (errorMessage) {
        element.setAttribute('error', errorMessage);
        return false;
      } else {
        element.removeAttribute('error');
        return true;
      }
    },
  };
})(Drupal, drupalSettings, once);
```

## Best Practices

### 1. Always Use once()

**DO**:

```javascript
once('hx-button-init', 'hx-button', context).forEach((button) => {
  button.addEventListener('hx-click', handleClick);
});
```

**DON'T**:

```javascript
context.querySelectorAll('hx-button').forEach((button) => {
  button.addEventListener('hx-click', handleClick); // Duplicate listeners!
});
```

### 2. Query Within Context

**DO**:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    once('hx-card', 'hx-card', context).forEach((card) => {
      // Only processes cards in current context
    });
  },
};
```

**DON'T**:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    once('hx-card', 'hx-card', document).forEach((card) => {
      // Re-processes ALL cards every time!
    });
  },
};
```

### 3. Implement detach() for Cleanup

**DO**:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    once('hx-button', 'hx-button', context).forEach((button) => {
      button.addEventListener('hx-click', this.handleClick);
    });
  },

  detach(context, settings, trigger) {
    if (trigger === 'unload') {
      const buttons = context.querySelectorAll('hx-button');
      buttons.forEach((button) => {
        button.removeEventListener('hx-click', this.handleClick);
      });
      once.remove('hx-button', 'hx-button', context);
    }
  },

  handleClick(event) {
    console.log('Button clicked');
  },
};
```

### 4. Use customElements.whenDefined() for Component APIs

**DO**:

```javascript
once('hx-card', 'hx-card', context).forEach((card) => {
  customElements.whenDefined('hx-card').then(() => {
    // Safe to access component methods and properties
    console.log('Card variant:', card.variant);
  });
});
```

**OR** (if only setting attributes):

```javascript
once('hx-card', 'hx-card', context).forEach((card) => {
  // Attributes work immediately, no need to wait
  card.setAttribute('variant', 'featured');
});
```

### 5. Handle Missing Dependencies Gracefully

**DO**:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    if (typeof once === 'undefined') {
      console.error('once is not defined. Add core/once to library dependencies.');
      return;
    }

    const config = settings.hxComponents?.config;
    if (!config) {
      console.warn('hxComponents config not found in drupalSettings');
      return;
    }

    // Safe to proceed
  },
};
```

### 6. Use Event Delegation for Performance

**DO** (for many elements):

```javascript
Drupal.behaviors.hxDelegation = {
  attach(context, settings) {
    if (context !== document) return;

    once('hx-delegation', 'body', context).forEach((body) => {
      body.addEventListener('hx-card-click', (event) => {
        if (event.target.matches('hx-card[data-interactive]')) {
          console.log('Card clicked:', event.target);
        }
      });
    });
  },
};
```

### 7. Namespace Your Behaviors

**DO**:

```javascript
Drupal.behaviors.myThemeHxComponents = {
  // Clear namespace prevents conflicts
};
```

**DON'T**:

```javascript
Drupal.behaviors.components = {
  // Generic name, high conflict risk
};
```

### 8. Document Dependencies and Configuration

**DO**:

```javascript
/**
 * Patient Card Interaction Behavior
 *
 * Handles click events on patient cards, loads details via AJAX.
 *
 * Dependencies:
 * - core/once
 * - core/drupal.ajax
 * - hx-library (hx-card component)
 *
 * Settings:
 * - drupalSettings.hxPatients.ajaxEnabled (boolean) — Enable AJAX loading
 * - drupalSettings.hxPatients.detailUrl (string) — AJAX detail URL pattern
 */
Drupal.behaviors.hxPatientCards = {
  attach(context, settings) {
    // Implementation
  },
};
```

### 9. Avoid Heavy Computation in attach()

**DO**:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    once('hx-card', 'hx-card', context).forEach((card) => {
      // Defer heavy work to next frame
      requestAnimationFrame(() => {
        this.expensiveOperation(card);
      });
    });
  },
};
```

### 10. Test with AJAX and BigPipe

Always test your Behaviors with:

- Initial page load (full context)
- AJAX form submissions
- AJAX Views infinite scroll
- BigPipe enabled (streaming)
- Multiple rapid AJAX requests
- Content removal (detach)

## Troubleshooting

### Behavior Not Running

**Check**:

1. Is the library properly attached? (`#attached['library']`)
2. Is the behavior name unique?
3. Is `Drupal` defined before your code runs?
4. Are there JavaScript errors in the console?
5. Is the script loaded before `Drupal.attachBehaviors()` runs?

### Event Handlers Not Working

**Cause**: Listening before component has upgraded

**Fix**:

```javascript
customElements.whenDefined('hx-button').then(() => {
  button.addEventListener('hx-click', handleClick);
});
```

### Duplicate Event Handlers

**Cause**: Not using `once()`

**Fix**:

```javascript
once('hx-event', 'hx-button', context).forEach((button) => {
  button.addEventListener('hx-click', handleClick);
});
```

### Properties Not Found

**Cause**: Component not fully upgraded

**Fix**:

```javascript
customElements.whenDefined('hx-card').then(() => {
  console.log('Card variant:', card.variant); // Now available
});
```

### Settings Undefined

**Cause**: Library dependency not declared

**Fix**:

```yaml
# mytheme.libraries.yml
my-behavior:
  js:
    js/my-behavior.js: {}
  dependencies:
    - core/drupal
    - core/drupalSettings # Add this
    - core/once
```

### Memory Leaks

**Cause**: Not removing event listeners in `detach()`

**Fix**: Implement proper cleanup:

```javascript
detach(context, settings, trigger) {
  if (trigger === 'unload') {
    // Remove all listeners
    // Clear stored references
    // Remove once markers
  }
}
```

## Summary

Drupal Behaviors provide the essential integration layer between Drupal's dynamic content system and hx- web components. Key takeaways:

1. **Components auto-upgrade** — No manual initialization needed
2. **Use Behaviors for integration** — Event handling, configuration, coordination
3. **Always use once()** — Prevents duplicate processing
4. **Query within context** — Performance and correctness
5. **Wait for upgrade when needed** — Use `customElements.whenDefined()` for component APIs
6. **Implement detach()** — Clean up listeners and state
7. **Test with AJAX and BigPipe** — Ensure behaviors work in all scenarios
8. **Use event delegation** — Better performance for many elements
9. **Handle missing dependencies** — Defensive programming
10. **Document everything** — Dependencies, settings, behavior

Mastering Drupal Behaviors with hx- components ensures robust, performant, and maintainable integrations that work seamlessly with Drupal's full rendering pipeline.

---

**Next Steps:**

- [AJAX Integration](/drupal-integration/ajax/)
- [Form API Integration](/drupal-integration/forms/form-api/)
- [Views Integration](/drupal-integration/views/overview/)
- [Performance Optimization](/drupal-integration/performance/overview/)
