---
title: Once API
description: Complete guide to Drupal's once() API for idempotent JavaScript behaviors, including once.remove(), data attributes, multiple behaviors, and testing patterns with HELIX components
order: 15
---

The Once API is Drupal's core mechanism for ensuring JavaScript code executes exactly one time per element, regardless of how many times `Drupal.behaviors.attach()` is invoked. Understanding the Once API is critical for building robust, bug-free integrations with HELIX web components in Drupal themes and modules.

This comprehensive guide covers the complete Once API surface: the `once()` function, `once.remove()` cleanup, `once.filter()` for checking state, data attribute tracking, idempotency guarantees, multiple behaviors on the same element, custom once IDs, testing patterns, and best practices.

## Why the Once API Exists

In Drupal, `Drupal.behaviors.attach()` is called multiple times throughout a page's lifecycle:

- **Initial page load**: Once when the DOM is ready
- **AJAX responses**: After every AJAX request that adds/updates content
- **BigPipe streaming**: After each streamed content chunk arrives
- **Manual calls**: When custom code or modules call `Drupal.attachBehaviors()`

Without the Once API, every `attach()` invocation would re-process the same elements, leading to:

### The Problem

```javascript
// WITHOUT once() — BROKEN PATTERN
Drupal.behaviors.hxButtons = {
  attach(context, settings) {
    context.querySelectorAll('hx-button').forEach((button) => {
      // This runs EVERY time attach() is called
      button.addEventListener('click', handleClick);
    });
  },
};
```

**Result after 3 `attach()` calls**:

- Each button has 3 duplicate click listeners
- Clicking a button triggers `handleClick()` 3 times
- Memory leaks from un-removed listeners
- Unpredictable behavior and bugs
- Performance degradation

### The Solution

```javascript
// WITH once() — CORRECT PATTERN
import { once } from 'core/once';

Drupal.behaviors.hxButtons = {
  attach(context, settings) {
    once('hx-button-init', 'hx-button', context).forEach((button) => {
      // This runs EXACTLY ONCE per button, guaranteed
      button.addEventListener('click', handleClick);
    });
  },
};
```

**Result after 3 `attach()` calls**:

- Each button has exactly 1 click listener
- Clicking a button triggers `handleClick()` exactly once
- No memory leaks, no duplicate handlers
- Predictable, correct behavior
- Optimal performance

## The once() Function

The `once()` function is the core of the Once API. It filters elements to ensure each element is processed at most one time per unique ID.

### Function Signature

```javascript
once(id, selector, context);
```

### Parameters

#### id (string, required)

A unique identifier for this once operation. The ID should:

- Be descriptive of what operation it tracks
- Use kebab-case naming convention
- Be namespaced to avoid conflicts with other modules/themes
- Not contain spaces or special characters

**Examples**:

```javascript
once('hx-button-init', ...)           // Good
once('hx-card-click-handler', ...)    // Good
once('mytheme-hx-form-validation', ...)  // Good (namespaced)
once('init', ...)                      // Bad (too generic)
once('button click', ...)              // Bad (contains space)
```

#### selector (string, required)

A CSS selector to match elements. Can be any valid CSS selector:

```javascript
once('id', 'hx-button', context); // Element selector
once('id', 'hx-card[variant="featured"]', context); // Attribute selector
once('id', '.patient-card hx-button', context); // Descendant selector
once('id', 'hx-form, hx-text-input', context); // Multiple selectors
```

#### context (Element | Document, required)

The DOM element or document to search within. In Drupal Behaviors, this is always the `context` parameter passed to `attach()`.

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    // context is passed from Drupal.behaviors
    once('example-init', 'hx-button', context).forEach((button) => {
      // Process button
    });
  },
};
```

### Return Value

The `once()` function returns a **native JavaScript Array** containing all elements that:

1. Match the CSS selector
2. Exist within the context
3. Have NOT been previously processed with this ID

**Important**: The return value is a native Array, not a NodeList or HTMLCollection.

```javascript
const buttons = once('hx-button-init', 'hx-button', context);
console.log(Array.isArray(buttons)); // true

// Can use all array methods
buttons.forEach((button) => {
  /* ... */
});
buttons.map((button) => button.id);
buttons.filter((button) => button.variant === 'primary');
```

### Basic Usage Example

```javascript
import { once } from 'core/once';

Drupal.behaviors.hxCards = {
  attach(context, settings) {
    // Process each hx-card exactly once
    const cards = once('hx-card-init', 'hx-card', context);

    cards.forEach((card) => {
      // This code runs ONCE per card, ever
      console.log('Initializing card:', card.id);

      card.addEventListener('hx-card-click', (event) => {
        console.log('Card clicked:', event.detail);
      });
    });
  },
};
```

## How once() Works Internally

Understanding the internal mechanism helps you use the Once API effectively.

### Step-by-Step Process

1. **Query**: Finds all elements matching the selector within context

   ```javascript
   const elements = context.querySelectorAll(selector);
   ```

2. **Filter**: Removes elements that have already been processed with this ID

   ```javascript
   const unprocessed = elements.filter((el) => {
     const onceIds = el.getAttribute('data-once')?.split(' ') || [];
     return !onceIds.includes(id);
   });
   ```

3. **Mark**: Adds the ID to the `data-once` attribute on unprocessed elements

   ```javascript
   unprocessed.forEach((el) => {
     const existing = el.getAttribute('data-once') || '';
     const updated = existing ? `${existing} ${id}` : id;
     el.setAttribute('data-once', updated);
   });
   ```

4. **Return**: Returns the array of newly processed elements
   ```javascript
   return unprocessed;
   ```

### The data-once Attribute

After `once()` processes an element, it adds a `data-once` attribute with the ID:

```html
<!-- Before once() -->
<hx-button variant="primary">Save Patient</hx-button>

<!-- After once('hx-button-init', 'hx-button', context) -->
<hx-button variant="primary" data-once="hx-button-init">Save Patient</hx-button>
```

Multiple once operations on the same element append IDs to the attribute:

```html
<!-- After multiple once() calls with different IDs -->
<hx-button variant="primary" data-once="hx-button-init hx-button-analytics hx-button-tracking">
  Save Patient
</hx-button>
```

### Persistence Across DOM Operations

The `data-once` attribute persists even if the element is moved in the DOM:

```javascript
const button = document.querySelector('hx-button');
once('hx-button-init', 'hx-button', document); // Marks button

// Move button to different parent
const newParent = document.querySelector('.new-container');
newParent.appendChild(button); // Element retains data-once attribute

// Second call returns empty array (already processed)
const result = once('hx-button-init', 'hx-button', document);
console.log(result.length); // 0 — button still has data-once="hx-button-init"
```

## once.remove(): Cleanup and Reset

The `once.remove()` function removes the `data-once` attribute from elements, allowing them to be re-processed by subsequent `once()` calls.

### Function Signature

```javascript
once.remove(id, selector, context);
```

### Parameters

Same as `once()`: `id`, `selector`, and `context`.

### Return Value

Returns an array of elements that had the ID removed. Elements that didn't have the ID in their `data-once` attribute are excluded from the result.

### Basic Usage

```javascript
import { once } from 'core/once';

Drupal.behaviors.hxButtons = {
  attach(context, settings) {
    once('hx-button-init', 'hx-button', context).forEach((button) => {
      const handler = () => console.log('Button clicked');
      button._clickHandler = handler; // Store reference for cleanup
      button.addEventListener('click', handler);
    });
  },

  detach(context, settings, trigger) {
    if (trigger === 'unload') {
      // Remove event listeners
      context.querySelectorAll('hx-button').forEach((button) => {
        if (button._clickHandler) {
          button.removeEventListener('click', button._clickHandler);
          delete button._clickHandler;
        }
      });

      // Remove once marker so elements can be re-initialized if re-added
      once.remove('hx-button-init', 'hx-button', context);
    }
  },
};
```

### When to Use once.remove()

Use `once.remove()` in these scenarios:

1. **In `detach()` method**: Clean up before content is removed from DOM
2. **Before re-initialization**: When you need to re-process elements
3. **Dynamic content updates**: When element state changes significantly
4. **Testing**: Reset state between test cases

### Removing Multiple IDs

If an element has multiple once IDs, you must remove each one individually:

```javascript
// Element has multiple IDs
// <hx-card data-once="hx-card-init hx-card-analytics hx-card-tracking">

// Remove all three IDs
once.remove('hx-card-init', 'hx-card', context);
once.remove('hx-card-analytics', 'hx-card', context);
once.remove('hx-card-tracking', 'hx-card', context);

// Now element can be re-processed with all three operations
```

### Partial Removal Example

```javascript
const card = document.querySelector('hx-card');

// Add multiple once IDs
once('card-init', 'hx-card', document);
once('card-analytics', 'hx-card', document);
once('card-tracking', 'hx-card', document);

// data-once="card-init card-analytics card-tracking"

// Remove only analytics tracking
once.remove('card-analytics', 'hx-card', document);

// data-once="card-init card-tracking" (analytics removed)

// Can re-run analytics once() now
once('card-analytics', 'hx-card', document).forEach((card) => {
  // This will execute because we removed the ID
});
```

## once.filter(): Check Without Marking

The `once.filter()` function checks which elements have NOT been processed with a given ID, **without** marking them as processed. This allows you to inspect state without side effects.

### Function Signature

```javascript
once.filter(id, elements);
```

### Parameters

- **id** (string): The once ID to check for
- **elements** (Array | NodeList | HTMLCollection): Elements to filter

**Note**: Unlike `once()`, this takes an array of elements, not a selector and context.

### Return Value

Returns an array of elements that do NOT have the specified ID in their `data-once` attribute.

### Basic Usage

```javascript
import { once } from 'core/once';

Drupal.behaviors.hxCardInspector = {
  attach(context, settings) {
    const allCards = context.querySelectorAll('hx-card');

    // Check which cards have NOT been initialized (without marking them)
    const uninitializedCards = once.filter('hx-card-init', allCards);

    console.log(`Found ${uninitializedCards.length} uninitialized cards`);
    console.log(`Found ${allCards.length - uninitializedCards.length} already initialized cards`);

    // Now actually initialize them
    once('hx-card-init', 'hx-card', context).forEach((card) => {
      // Initialize card
    });
  },
};
```

### Use Cases for once.filter()

1. **Conditional logic**: Branch behavior based on processing state
2. **Debugging**: Log or inspect unprocessed elements
3. **Metrics**: Count how many elements need processing
4. **Pre-validation**: Check state before performing expensive operations

### Example: Conditional Processing

```javascript
Drupal.behaviors.hxConditional = {
  attach(context, settings) {
    const buttons = context.querySelectorAll('hx-button');
    const unprocessed = once.filter('hx-button-init', buttons);

    if (unprocessed.length === 0) {
      console.log('All buttons already initialized, skipping...');
      return; // Early return, skip processing
    }

    console.log(`Initializing ${unprocessed.length} new buttons`);

    // Now mark and process them
    once('hx-button-init', 'hx-button', context).forEach((button) => {
      button.addEventListener('click', handleClick);
    });
  },
};
```

### Difference: once() vs once.filter()

| Feature            | `once()`                             | `once.filter()`            |
| ------------------ | ------------------------------------ | -------------------------- |
| **Marks elements** | Yes (adds to `data-once`)            | No (read-only check)       |
| **Parameters**     | `(id, selector, context)`            | `(id, elements)`           |
| **Input**          | CSS selector string                  | Array/NodeList of elements |
| **Side effects**   | Modifies DOM (`data-once` attribute) | No side effects            |
| **Use case**       | Process elements once                | Check processing state     |

## Multiple Behaviors on the Same Element

The Once API supports running multiple different operations on the same element by using different once IDs.

### Pattern: Multiple once() Calls

```javascript
import { once } from 'core/once';

Drupal.behaviors.hxButtonMulti = {
  attach(context, settings) {
    // Operation 1: Initialize state
    once('hx-button-state', 'hx-button', context).forEach((button) => {
      button.setAttribute('data-state', 'ready');
      button.setAttribute('aria-live', 'polite');
    });

    // Operation 2: Attach click handler
    once('hx-button-click', 'hx-button', context).forEach((button) => {
      button.addEventListener('click', (event) => {
        console.log('Button clicked:', button.id);
      });
    });

    // Operation 3: Track analytics
    once('hx-button-analytics', 'hx-button', context).forEach((button) => {
      if (settings.analytics?.enabled) {
        trackButtonImpression(button);
      }
    });

    // Operation 4: Apply theme overrides
    once('hx-button-theme', 'hx-button', context).forEach((button) => {
      const themeColor = settings.theme?.primaryColor;
      if (themeColor) {
        button.style.setProperty('--hx-button-bg', themeColor);
      }
    });
  },

  detach(context, settings, trigger) {
    if (trigger === 'unload') {
      // Clean up all operations
      once.remove('hx-button-state', 'hx-button', context);
      once.remove('hx-button-click', 'hx-button', context);
      once.remove('hx-button-analytics', 'hx-button', context);
      once.remove('hx-button-theme', 'hx-button', context);
    }
  },
};
```

### Result in DOM

After all operations run, the element has all IDs in its `data-once` attribute:

```html
<hx-button
  variant="primary"
  data-once="hx-button-state hx-button-click hx-button-analytics hx-button-theme"
  data-state="ready"
  aria-live="polite"
>
  Save Patient
</hx-button>
```

### Coordination Across Multiple Behaviors

Different Drupal Behaviors can use different once IDs on the same elements:

```javascript
// Behavior 1: Core initialization
Drupal.behaviors.hxCore = {
  attach(context, settings) {
    once('hx-core-init', 'hx-card', context).forEach((card) => {
      card.setAttribute('tabindex', '0');
    });
  },
};

// Behavior 2: Module-specific functionality
Drupal.behaviors.patientModule = {
  attach(context, settings) {
    once('patient-card-init', 'hx-card[data-patient-id]', context).forEach((card) => {
      loadPatientData(card);
    });
  },
};

// Behavior 3: Theme customization
Drupal.behaviors.healthcareTheme = {
  attach(context, settings) {
    once('theme-card-style', 'hx-card', context).forEach((card) => {
      applyThemeStyles(card);
    });
  },
};
```

Result:

```html
<hx-card
  data-patient-id="12345"
  data-once="hx-core-init patient-card-init theme-card-style"
  tabindex="0"
>
  <!-- Card content -->
</hx-card>
```

### When to Use Multiple IDs

Use multiple once IDs when:

1. **Separation of concerns**: Different operations have different responsibilities
2. **Conditional execution**: Some operations may be skipped based on settings
3. **Module/theme boundaries**: Different modules/themes operate on the same elements
4. **Granular cleanup**: You may need to remove some operations but not others

### Anti-Pattern: Single ID for Everything

**DON'T**:

```javascript
// BAD: Single ID for unrelated operations
once('hx-button-all', 'hx-button', context).forEach((button) => {
  // State initialization
  button.setAttribute('data-state', 'ready');

  // Event handling
  button.addEventListener('click', handleClick);

  // Analytics
  trackButtonImpression(button);

  // Theme
  applyThemeStyles(button);

  // Can't selectively remove or re-run any of these operations
});
```

**DO**:

```javascript
// GOOD: Separate IDs for separate concerns
once('hx-button-state', 'hx-button', context).forEach(initState);
once('hx-button-events', 'hx-button', context).forEach(attachEvents);
once('hx-button-analytics', 'hx-button', context).forEach(trackImpression);
once('hx-button-theme', 'hx-button', context).forEach(applyTheme);

// Can selectively remove and re-run individual operations
```

## Custom Once IDs: Naming and Namespacing

Choosing effective once IDs is critical for maintainability and avoiding conflicts.

### Naming Conventions

Follow these patterns for once IDs:

```javascript
// Pattern: <namespace>-<component>-<operation>
once('mytheme-hx-button-init', ...)
once('mymodule-hx-card-click', ...)
once('healthcare-hx-form-validation', ...)

// Pattern: <component>-<operation> (if no conflict risk)
once('hx-button-init', ...)
once('hx-card-analytics', ...)
once('hx-form-submit', ...)

// Pattern: <operation>-<target> (for general operations)
once('ajax-load-patients', ...)
once('theme-apply-styles', ...)
once('analytics-track-view', ...)
```

### Namespace by Module/Theme

Prefix IDs with your module or theme name to prevent conflicts:

```javascript
// mymodule.behaviors.js
Drupal.behaviors.mymodulePatientCards = {
  attach(context, settings) {
    // Namespaced IDs prevent conflicts with other modules
    once('mymodule-patient-card-init', 'hx-card', context).forEach((card) => {
      // Initialize
    });

    once('mymodule-patient-card-click', 'hx-card', context).forEach((card) => {
      // Attach handler
    });
  },
};
```

### Descriptive Operation Names

Make the operation clear from the ID:

```javascript
// GOOD: Clear what the operation does
once('hx-button-click-handler', ...)
once('hx-form-validation-rules', ...)
once('hx-card-lazy-load-images', ...)
once('hx-accordion-keyboard-nav', ...)

// BAD: Vague or unclear
once('hx-button-setup', ...)  // What kind of setup?
once('hx-form-init', ...)     // Initialize what aspect?
once('hx-card-process', ...)  // Process how?
```

### Component-Specific vs. Global IDs

**Component-specific IDs** (recommended for most cases):

```javascript
once('hx-button-init', 'hx-button', context).forEach(...);
once('hx-card-init', 'hx-card', context).forEach(...);
once('hx-form-init', 'hx-form', context).forEach(...);
```

**Global/operation-specific IDs** (for cross-cutting concerns):

```javascript
once('analytics-tracking', '[data-track]', context).forEach(...);
once('lazy-load-images', 'img[data-src]', context).forEach(...);
once('theme-customization', '.themed-element', context).forEach(...);
```

### ID Collision Prevention

```javascript
// Multiple modules might want to initialize hx-button components
// Use namespacing to avoid collisions:

// Module A
once('moduleA-hx-button-init', 'hx-button', context).forEach(...);

// Module B
once('moduleB-hx-button-init', 'hx-button', context).forEach(...);

// Theme
once('mytheme-hx-button-init', 'hx-button', context).forEach(...);

// All three can coexist without interfering
```

## Idempotency Guarantee

The Once API provides a **mathematical idempotency guarantee**: calling `once()` multiple times with the same ID produces the same result as calling it once.

### Definition of Idempotency

An operation is idempotent if:

```
f(f(x)) = f(x)
```

For the Once API:

```javascript
const result1 = once('id', 'selector', context);
const result2 = once('id', 'selector', context);
const result3 = once('id', 'selector', context);

// result2 and result3 will be empty arrays
// Only result1 contains elements
```

### Practical Guarantee

The Once API guarantees:

1. **First call**: Returns all matching elements, marks them with `data-once`
2. **Subsequent calls**: Return empty array (elements already marked)
3. **State persistence**: Marking survives DOM operations (move, clone with attributes)
4. **No side effects**: Repeated calls don't re-process elements

### Example: Idempotent Behavior

```javascript
import { once } from 'core/once';

Drupal.behaviors.hxButtonInit = {
  attach(context, settings) {
    // This is called 5 times (initial load + 4 AJAX requests)
    console.log('attach() called');

    const buttons = once('hx-button-init', 'hx-button', context);

    // Only runs on first call or for newly added buttons
    buttons.forEach((button) => {
      console.log('Initializing button:', button.id);
      button.addEventListener('click', handleClick);
    });
  },
};

// Logs:
// attach() called (1st call - initial load)
// Initializing button: btn-1
// Initializing button: btn-2
// attach() called (2nd call - AJAX)
// Initializing button: btn-3 (newly added)
// attach() called (3rd call - AJAX)
// (no initialization - no new buttons)
// attach() called (4th call - AJAX)
// Initializing button: btn-4 (newly added)
// attach() called (5th call - AJAX)
// (no initialization - no new buttons)
```

### Testing Idempotency

```javascript
// Test that once() is idempotent
describe('once() idempotency', () => {
  it('should only process elements once', () => {
    const container = document.createElement('div');
    container.innerHTML = '<hx-button id="btn1"></hx-button>';

    let processCount = 0;

    // Call once() three times
    once('test-id', 'hx-button', container).forEach(() => processCount++);
    once('test-id', 'hx-button', container).forEach(() => processCount++);
    once('test-id', 'hx-button', container).forEach(() => processCount++);

    // Should only process once
    expect(processCount).toBe(1);

    // Check data-once attribute
    const button = container.querySelector('hx-button');
    expect(button.getAttribute('data-once')).toBe('test-id');
  });
});
```

## Examples with HELIX Components

### Example 1: hx-button Click Tracking

```javascript
/**
 * Track hx-button clicks with analytics
 */
import { once } from 'core/once';

(function (Drupal, drupalSettings, once) {
  'use strict';

  Drupal.behaviors.hxButtonTracking = {
    attach(context, settings) {
      const analyticsConfig = settings.analytics || {};

      if (!analyticsConfig.enabled) {
        return; // Analytics disabled
      }

      once('hx-button-analytics', 'hx-button', context).forEach((button) => {
        // Track impression
        if (typeof gtag !== 'undefined') {
          gtag('event', 'button_impression', {
            button_id: button.id,
            button_variant: button.variant,
            button_size: button.size,
            button_text: button.textContent.trim(),
          });
        }

        // Track clicks
        button.addEventListener('click', (event) => {
          if (typeof gtag !== 'undefined') {
            gtag('event', 'button_click', {
              button_id: button.id,
              button_variant: button.variant,
              button_size: button.size,
              button_text: button.textContent.trim(),
            });
          }
        });
      });
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-button-analytics', 'hx-button', context);
      }
    },
  };
})(Drupal, drupalSettings, once);
```

### Example 2: hx-card with AJAX Data Loading

```javascript
/**
 * Load data into hx-card components via AJAX
 */
import { once } from 'core/once';

(function (Drupal, drupalSettings, once) {
  'use strict';

  Drupal.behaviors.hxCardDataLoader = {
    attach(context, settings) {
      // Initialize cards with data-load-url attribute
      once('hx-card-data-load', 'hx-card[data-load-url]', context).forEach((card) => {
        const url = card.getAttribute('data-load-url');

        if (!url) return;

        // Show loading state
        card.setAttribute('loading', '');

        // Fetch data
        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            // Populate card with data
            this.populateCard(card, data);
            card.removeAttribute('loading');
          })
          .catch((error) => {
            console.error('Failed to load card data:', error);
            card.setAttribute('error', 'Failed to load data');
            card.removeAttribute('loading');
          });
      });

      // Attach click handlers after data loads
      once('hx-card-click', 'hx-card:not([loading])', context).forEach((card) => {
        card.addEventListener('hx-card-click', (event) => {
          const cardId = card.getAttribute('data-id');

          if (cardId) {
            this.navigateToDetail(cardId);
          }
        });
      });
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-card-data-load', 'hx-card[data-load-url]', context);
        once.remove('hx-card-click', 'hx-card', context);
      }
    },

    populateCard(card, data) {
      const heading = card.querySelector('[slot="heading"]');
      const body = card.querySelector('[slot="body"]');

      if (heading) heading.textContent = data.title;
      if (body) body.innerHTML = data.body;

      card.setAttribute('data-id', data.id);
    },

    navigateToDetail(cardId) {
      window.location.href = `/cards/${cardId}`;
    },
  };
})(Drupal, drupalSettings, once);
```

### Example 3: hx-form Validation Rules

```javascript
/**
 * Apply validation rules from drupalSettings to hx-form components
 */
import { once } from 'core/once';

(function (Drupal, drupalSettings, once) {
  'use strict';

  Drupal.behaviors.hxFormValidation = {
    attach(context, settings) {
      const validationRules = settings.hxForms?.validation || {};

      // Apply rules to text inputs
      once('hx-input-validation', 'hx-text-input', context).forEach((input) => {
        const fieldName = input.getAttribute('name');
        const rules = validationRules[fieldName];

        if (rules) {
          this.applyRules(input, rules);
          this.attachValidationListeners(input, rules);
        }
      });

      // Apply rules to textareas
      once('hx-textarea-validation', 'hx-textarea', context).forEach((textarea) => {
        const fieldName = textarea.getAttribute('name');
        const rules = validationRules[fieldName];

        if (rules) {
          this.applyRules(textarea, rules);
          this.attachValidationListeners(textarea, rules);
        }
      });

      // Apply rules to selects
      once('hx-select-validation', 'hx-select', context).forEach((select) => {
        const fieldName = select.getAttribute('name');
        const rules = validationRules[fieldName];

        if (rules) {
          this.applyRules(select, rules);
          this.attachValidationListeners(select, rules);
        }
      });

      // Handle form submission
      once('hx-form-submit', 'hx-form', context).forEach((form) => {
        form.addEventListener('hx-submit', (event) => {
          if (!this.validateForm(form, validationRules)) {
            event.preventDefault();
            this.showValidationErrors(form);
          }
        });
      });
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-input-validation', 'hx-text-input', context);
        once.remove('hx-textarea-validation', 'hx-textarea', context);
        once.remove('hx-select-validation', 'hx-select', context);
        once.remove('hx-form-submit', 'hx-form', context);
      }
    },

    applyRules(element, rules) {
      if (rules.required) element.setAttribute('required', '');
      if (rules.pattern) element.setAttribute('pattern', rules.pattern);
      if (rules.minLength) element.setAttribute('minlength', rules.minLength);
      if (rules.maxLength) element.setAttribute('maxlength', rules.maxLength);
      if (rules.min) element.setAttribute('min', rules.min);
      if (rules.max) element.setAttribute('max', rules.max);
    },

    attachValidationListeners(element, rules) {
      // Validate on blur
      element.addEventListener('blur', () => {
        this.validateField(element, rules);
      });

      // Clear errors on input
      element.addEventListener('input', () => {
        if (element.hasAttribute('error')) {
          element.removeAttribute('error');
          element.removeAttribute('error-message');
        }
      });
    },

    validateField(element, rules) {
      const value = element.value.trim();

      if (rules.required && !value) {
        element.setAttribute('error', '');
        element.setAttribute('error-message', rules.requiredMessage || 'This field is required.');
        return false;
      }

      if (rules.pattern && value && !new RegExp(rules.pattern).test(value)) {
        element.setAttribute('error', '');
        element.setAttribute('error-message', rules.patternMessage || 'Invalid format.');
        return false;
      }

      if (rules.minLength && value.length < rules.minLength) {
        element.setAttribute('error', '');
        element.setAttribute('error-message', `Minimum ${rules.minLength} characters required.`);
        return false;
      }

      element.removeAttribute('error');
      element.removeAttribute('error-message');
      return true;
    },

    validateForm(form, validationRules) {
      let isValid = true;

      form.querySelectorAll('hx-text-input, hx-textarea, hx-select').forEach((field) => {
        const fieldName = field.getAttribute('name');
        const rules = validationRules[fieldName];

        if (rules && !this.validateField(field, rules)) {
          isValid = false;
        }
      });

      return isValid;
    },

    showValidationErrors(form) {
      const firstError = form.querySelector('[error]');
      if (firstError) {
        firstError.focus();
      }
    },
  };
})(Drupal, drupalSettings, once);
```

### Example 4: Multiple Behaviors on hx-card

```javascript
/**
 * Demonstrates multiple separate behaviors operating on hx-card components
 * with different once IDs for separation of concerns
 */
import { once } from 'core/once';

// Behavior 1: Core functionality (theme/module)
Drupal.behaviors.hxCardCore = {
  attach(context, settings) {
    once('hx-card-core-init', 'hx-card', context).forEach((card) => {
      // Add keyboard navigation
      card.setAttribute('tabindex', '0');

      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          card.click();
        }
      });
    });
  },
};

// Behavior 2: Analytics tracking (analytics module)
Drupal.behaviors.hxCardAnalytics = {
  attach(context, settings) {
    if (!settings.analytics?.enabled) return;

    once('hx-card-analytics', 'hx-card', context).forEach((card) => {
      // Track impression
      trackCardImpression(card);

      // Track clicks
      card.addEventListener('hx-card-click', (event) => {
        trackCardClick(card, event.detail);
      });
    });
  },
};

// Behavior 3: Patient data integration (patient module)
Drupal.behaviors.hxCardPatientData = {
  attach(context, settings) {
    once('hx-card-patient-data', 'hx-card[data-patient-id]', context).forEach((card) => {
      const patientId = card.getAttribute('data-patient-id');

      // Load patient data
      loadPatientData(patientId).then((data) => {
        populateCardWithPatientData(card, data);
      });
    });
  },
};

// Behavior 4: Theme customization (custom theme)
Drupal.behaviors.hxCardTheme = {
  attach(context, settings) {
    const themeSettings = settings.theme || {};

    once('hx-card-theme', 'hx-card', context).forEach((card) => {
      // Apply theme-specific styling
      if (themeSettings.primaryColor) {
        card.style.setProperty('--hx-card-border-color', themeSettings.primaryColor);
      }

      if (themeSettings.cardShadow) {
        card.setAttribute('elevation', themeSettings.cardShadow);
      }
    });
  },
};

// Result: Each hx-card has all four once IDs:
// <hx-card data-once="hx-card-core-init hx-card-analytics hx-card-patient-data hx-card-theme">
```

## Testing Once Behavior

Testing code that uses the Once API requires understanding how to reset state between tests and verify idempotency.

### Test Setup

```javascript
import { once } from 'core/once';

describe('Once API with hx-button', () => {
  let container;

  beforeEach(() => {
    // Create clean container for each test
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up container
    document.body.removeChild(container);
  });
});
```

### Test: Basic Idempotency

```javascript
it('should only process elements once', () => {
  container.innerHTML = `
    <hx-button id="btn1">Button 1</hx-button>
    <hx-button id="btn2">Button 2</hx-button>
  `;

  let processCount = 0;

  // First call - should process both buttons
  const result1 = once('test-init', 'hx-button', container);
  result1.forEach(() => processCount++);

  expect(result1.length).toBe(2);
  expect(processCount).toBe(2);

  // Second call - should process nothing (already marked)
  const result2 = once('test-init', 'hx-button', container);
  result2.forEach(() => processCount++);

  expect(result2.length).toBe(0);
  expect(processCount).toBe(2); // Still 2 (no new processing)
});
```

### Test: Multiple IDs

```javascript
it('should support multiple once IDs on same element', () => {
  container.innerHTML = '<hx-button id="btn1">Button</hx-button>';

  // Apply three different once operations
  const result1 = once('init', 'hx-button', container);
  const result2 = once('analytics', 'hx-button', container);
  const result3 = once('theme', 'hx-button', container);

  expect(result1.length).toBe(1);
  expect(result2.length).toBe(1);
  expect(result3.length).toBe(1);

  const button = container.querySelector('hx-button');
  const onceIds = button.getAttribute('data-once').split(' ');

  expect(onceIds).toContain('init');
  expect(onceIds).toContain('analytics');
  expect(onceIds).toContain('theme');
});
```

### Test: once.remove()

```javascript
it('should allow re-processing after once.remove()', () => {
  container.innerHTML = '<hx-button id="btn1">Button</hx-button>';

  let processCount = 0;

  // First processing
  once('test-init', 'hx-button', container).forEach(() => processCount++);
  expect(processCount).toBe(1);

  // Second call - nothing to process
  once('test-init', 'hx-button', container).forEach(() => processCount++);
  expect(processCount).toBe(1);

  // Remove once marker
  once.remove('test-init', 'hx-button', container);

  // Third call - should process again
  once('test-init', 'hx-button', container).forEach(() => processCount++);
  expect(processCount).toBe(2);
});
```

### Test: once.filter()

```javascript
it('should filter elements without marking them', () => {
  container.innerHTML = `
    <hx-button id="btn1">Button 1</hx-button>
    <hx-button id="btn2">Button 2</hx-button>
  `;

  const buttons = container.querySelectorAll('hx-button');

  // Check unprocessed (should find both)
  const unprocessed1 = once.filter('test-init', buttons);
  expect(unprocessed1.length).toBe(2);

  // Verify no data-once attribute was added
  buttons.forEach((button) => {
    expect(button.hasAttribute('data-once')).toBe(false);
  });

  // Now actually process them
  const result = once('test-init', 'hx-button', container);
  expect(result.length).toBe(2);

  // Check unprocessed again (should find none)
  const unprocessed2 = once.filter('test-init', buttons);
  expect(unprocessed2.length).toBe(0);
});
```

### Test: Context Scoping

```javascript
it('should respect context boundaries', () => {
  container.innerHTML = `
    <div id="context1">
      <hx-button id="btn1">Button 1</hx-button>
    </div>
    <div id="context2">
      <hx-button id="btn2">Button 2</hx-button>
    </div>
  `;

  const context1 = container.querySelector('#context1');
  const context2 = container.querySelector('#context2');

  // Process only context1
  const result1 = once('test-init', 'hx-button', context1);
  expect(result1.length).toBe(1);
  expect(result1[0].id).toBe('btn1');

  // Process only context2
  const result2 = once('test-init', 'hx-button', context2);
  expect(result2.length).toBe(1);
  expect(result2[0].id).toBe('btn2');

  // Process entire container (nothing left to process)
  const result3 = once('test-init', 'hx-button', container);
  expect(result3.length).toBe(0);
});
```

### Test: Drupal Behavior Integration

```javascript
it('should work correctly in Drupal.behaviors pattern', () => {
  container.innerHTML = `
    <hx-button id="btn1">Button 1</hx-button>
    <hx-button id="btn2">Button 2</hx-button>
  `;

  let initCount = 0;

  const behavior = {
    attach(context, settings) {
      once('test-behavior', 'hx-button', context).forEach((button) => {
        initCount++;
        button.classList.add('initialized');
      });
    },
  };

  // Simulate multiple attach() calls (as Drupal does)
  behavior.attach(container, {});
  behavior.attach(container, {}); // AJAX call
  behavior.attach(container, {}); // Another AJAX call

  // Should only initialize once despite 3 attach() calls
  expect(initCount).toBe(2); // 2 buttons
  expect(container.querySelectorAll('.initialized').length).toBe(2);
});
```

## Best Practices

### 1. Always Import once from core/once

**DO**:

```javascript
import { once } from 'core/once';

Drupal.behaviors.example = {
  attach(context, settings) {
    once('example-init', 'hx-button', context).forEach((button) => {
      // Process button
    });
  },
};
```

**DON'T**:

```javascript
// Assuming once is globally available (it might not be)
Drupal.behaviors.example = {
  attach(context, settings) {
    once('example-init', 'hx-button', context).forEach((button) => {
      // This might fail if once isn't loaded
    });
  },
};
```

### 2. Declare core/once Dependency

```yaml
# mytheme.libraries.yml
my-behavior:
  js:
    js/my-behavior.js: {}
  dependencies:
    - core/drupal
    - core/once # Required dependency
```

### 3. Use Descriptive, Namespaced IDs

**DO**:

```javascript
once('mytheme-hx-button-click-handler', 'hx-button', context);
once('mymodule-patient-card-init', 'hx-card', context);
```

**DON'T**:

```javascript
once('init', 'hx-button', context); // Too generic
once('button', 'hx-button', context); // No operation specified
```

### 4. Always Pass Context

**DO**:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    once('example-init', 'hx-button', context).forEach((button) => {
      // Correct: uses context from attach()
    });
  },
};
```

**DON'T**:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    once('example-init', 'hx-button', document).forEach((button) => {
      // Wrong: hardcoded document instead of context
    });
  },
};
```

### 5. Pair once() with once.remove() in detach()

**DO**:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    once('example-init', 'hx-button', context).forEach((button) => {
      const handler = () => console.log('clicked');
      button._handler = handler;
      button.addEventListener('click', handler);
    });
  },

  detach(context, settings, trigger) {
    if (trigger === 'unload') {
      context.querySelectorAll('hx-button').forEach((button) => {
        if (button._handler) {
          button.removeEventListener('click', button._handler);
          delete button._handler;
        }
      });
      once.remove('example-init', 'hx-button', context);
    }
  },
};
```

### 6. Use Separate IDs for Separate Concerns

**DO**:

```javascript
once('hx-button-state', 'hx-button', context).forEach(initState);
once('hx-button-events', 'hx-button', context).forEach(attachEvents);
once('hx-button-analytics', 'hx-button', context).forEach(trackAnalytics);
```

**DON'T**:

```javascript
once('hx-button-all', 'hx-button', context).forEach((button) => {
  initState(button);
  attachEvents(button);
  trackAnalytics(button);
  // Can't selectively remove or re-run individual operations
});
```

### 7. Check for Dependencies Before Using

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    if (typeof once === 'undefined') {
      console.error('once is not defined. Add core/once to library dependencies.');
      return;
    }

    once('example-init', 'hx-button', context).forEach((button) => {
      // Safe to use once
    });
  },
};
```

### 8. Test with Multiple attach() Calls

Always test that your code works correctly when `attach()` is called multiple times:

```javascript
// Simulate Drupal's behavior lifecycle
const behavior = Drupal.behaviors.myBehavior;

behavior.attach(document, drupalSettings); // Initial load
behavior.attach(newContent, drupalSettings); // AJAX 1
behavior.attach(newContent, drupalSettings); // AJAX 2
behavior.attach(newContent, drupalSettings); // BigPipe chunk

// Verify no duplicate listeners or processing
```

### 9. Document Your Once IDs

```javascript
/**
 * Patient Card Behavior
 *
 * Once IDs used:
 * - patient-card-init: Core initialization (keyboard nav, tabindex)
 * - patient-card-data: Loads patient data via AJAX
 * - patient-card-analytics: Tracks card impressions and clicks
 * - patient-card-theme: Applies theme-specific styling
 */
Drupal.behaviors.patientCard = {
  attach(context, settings) {
    // Implementation
  },
};
```

### 10. Use once.filter() for Conditional Logic

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    const buttons = context.querySelectorAll('hx-button');
    const unprocessed = once.filter('example-init', buttons);

    if (unprocessed.length === 0) {
      console.log('No new buttons to initialize');
      return; // Early return
    }

    console.log(`Initializing ${unprocessed.length} new buttons`);

    once('example-init', 'hx-button', context).forEach((button) => {
      // Initialize
    });
  },
};
```

## Troubleshooting

### Issue: once is not defined

**Symptoms**:

```
ReferenceError: once is not defined
```

**Cause**: Missing dependency on `core/once` in library definition.

**Fix**:

```yaml
# mytheme.libraries.yml
my-behavior:
  js:
    js/my-behavior.js: {}
  dependencies:
    - core/drupal
    - core/once # Add this
```

### Issue: Elements Processed Multiple Times

**Symptoms**: Event handlers fire multiple times, duplicate processing.

**Cause**: Not using `once()` in behavior.

**Fix**:

```javascript
// Before (broken)
Drupal.behaviors.example = {
  attach(context, settings) {
    context.querySelectorAll('hx-button').forEach((button) => {
      button.addEventListener('click', handler); // Duplicate listeners!
    });
  },
};

// After (fixed)
Drupal.behaviors.example = {
  attach(context, settings) {
    once('example-init', 'hx-button', context).forEach((button) => {
      button.addEventListener('click', handler); // Only once!
    });
  },
};
```

### Issue: once() Returns Empty Array Unexpectedly

**Symptoms**: Elements exist but `once()` returns no results.

**Cause**: Elements were already processed with this ID.

**Debug**:

```javascript
const buttons = context.querySelectorAll('hx-button');
console.log('Total buttons:', buttons.length);

buttons.forEach((button) => {
  const onceIds = button.getAttribute('data-once');
  console.log('Button', button.id, 'has once IDs:', onceIds);
});

const result = once('my-id', 'hx-button', context);
console.log('Unprocessed buttons:', result.length);
```

**Fix**: Either use a different ID or call `once.remove()` first if re-processing is intended.

### Issue: once.remove() Doesn't Work

**Symptoms**: Elements still have `data-once` attribute after `once.remove()`.

**Cause**: Wrong ID, selector, or context passed to `once.remove()`.

**Fix**: Ensure exact same parameters as original `once()` call:

```javascript
// Must match exactly
once('my-id', 'hx-button', context);
once.remove('my-id', 'hx-button', context); // Same ID, selector, context
```

### Issue: Memory Leaks

**Symptoms**: Browser memory usage grows over time, performance degrades.

**Cause**: Event listeners not removed in `detach()`.

**Fix**: Implement proper cleanup:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    once('example-init', 'hx-button', context).forEach((button) => {
      const handler = () => console.log('click');
      button._handler = handler; // Store reference
      button.addEventListener('click', handler);
    });
  },

  detach(context, settings, trigger) {
    if (trigger === 'unload') {
      context.querySelectorAll('hx-button').forEach((button) => {
        if (button._handler) {
          button.removeEventListener('click', button._handler);
          delete button._handler;
        }
      });
      once.remove('example-init', 'hx-button', context);
    }
  },
};
```

## Summary

The Once API is the foundation of idempotent JavaScript in Drupal. Master these concepts:

1. **`once(id, selector, context)`**: Process elements exactly once per ID
2. **`once.remove(id, selector, context)`**: Reset processing state for cleanup
3. **`once.filter(id, elements)`**: Check state without side effects
4. **`data-once` attribute**: Tracks which operations have run on each element
5. **Idempotency guarantee**: `once()` can be called repeatedly without re-processing
6. **Multiple IDs**: Different operations can coexist on the same element
7. **Namespacing**: Prefix IDs with module/theme name to prevent conflicts
8. **Testing**: Verify idempotency and proper cleanup in tests
9. **Best practices**: Always use context, declare dependencies, implement `detach()`

The Once API ensures HELIX component integrations are robust, performant, and maintainable across all Drupal rendering contexts: initial page load, AJAX responses, and BigPipe streaming.

---

**Sources:**

- [once.js | Drupal.org](https://www.drupal.org/project/once)
- [@drupal/once npm package](https://www.npmjs.com/package/@drupal/once)
- [Replace jQuery.once() with javascript once() in Drupal 10 | Drupal Book](https://drupalbook.org/blog/replace-jqueryonce-javascript-once-drupal-10)
- [How to use @drupal/once in the right way :: DjentCoder](https://kovtunos.pro/code/how-to-use-drupal-once)
- [How to use once() in Drupal | Mark Conroy](https://mark.ie/blog/how-to-use-once-in-drupal)
- [Taming JavaScript in Drupal | Specbee](https://www.specbee.com/blogs/taming-javascript-in-drupal)
- [Drupal Behaviors, Ajax and doing it once | Blue-Bag](https://www.blue-bag.com/blog/drupal-behaviors-ajax-and-doing-it-once)
