---
title: Drupal Behaviors Fundamentals
description: Deep dive into Drupal.behaviors API, attach/detach lifecycle, context, settings, and the once API for idempotent JavaScript integration with HELIX components
order: 13
---

Drupal Behaviors are the foundation of JavaScript integration in Drupal 10 and 11. Understanding the Behaviors API is essential for integrating HELIX web components into Drupal themes and modules in a way that works seamlessly with AJAX, BigPipe, and Drupal's dynamic content rendering pipeline.

This guide provides a comprehensive deep dive into the Drupal.behaviors API, lifecycle methods, idempotency patterns, and best practices for using Behaviors with HELIX web components.

## What Are Drupal Behaviors?

Drupal Behaviors are JavaScript functions that execute both on initial page load and whenever new content is added to the page dynamically (via AJAX, BigPipe, or other mechanisms). They provide a standardized lifecycle hook system that ensures your JavaScript runs at the right time, on the right elements, without double-initialization.

### Why Behaviors Matter

In a traditional JavaScript application, you might use `DOMContentLoaded` or `$(document).ready()` to initialize code. This works for the initial page load, but fails when:

- Content is loaded via AJAX (Views infinite scroll, modal dialogs, autocomplete)
- Content streams in via BigPipe (Drupal's progressive rendering system)
- Content is added dynamically by other modules or themes
- Content is replaced or updated without a full page reload

Drupal Behaviors solve this by providing a consistent API that automatically runs your initialization code whenever new content enters the DOM, regardless of how it got there.

### The Problem Behaviors Solve

Without Behaviors, you would need to:

1. Initialize code on page load
2. Re-initialize after every AJAX request
3. Re-initialize after BigPipe renders chunks
4. Prevent double-initialization manually
5. Clean up event listeners when content is removed
6. Coordinate with other modules that add/remove content

Drupal Behaviors handle all of this automatically.

## Drupal.behaviors API Structure

A Behavior is registered by adding a property to the `Drupal.behaviors` object. Each Behavior is an object with `attach` and optionally `detach` methods.

### Basic Structure

```javascript
(function (Drupal) {
  'use strict';

  Drupal.behaviors.myBehaviorName = {
    attach(context, settings) {
      // Initialization code runs here
      // - On initial page load (context = document)
      // - After AJAX requests (context = new content)
      // - After BigPipe streams content (context = new chunk)
    },

    detach(context, settings, trigger) {
      // Cleanup code runs here
      // - Before content is removed from the DOM
      // - Before AJAX replaces content
      // - When page is being unloaded
    },
  };
})(Drupal);
```

### Naming Conventions

- Behavior names should be unique across your entire Drupal site
- Use a consistent prefix (module name, theme name, or project namespace)
- Use camelCase for behavior names
- Examples: `myThemeHxComponents`, `patientPortalForms`, `healthcareHxCards`

### Why the IIFE Wrapper?

The Immediately Invoked Function Expression (IIFE) wrapper `(function (Drupal) { ... })(Drupal);` serves two purposes:

1. **Dependency injection**: Ensures `Drupal` is defined before the code runs
2. **Scope isolation**: Prevents variable leakage into the global scope
3. **Consistent pattern**: Matches Drupal core and contributed module conventions

## The attach() Method: Deep Dive

The `attach` method is the heart of a Behavior. It receives two parameters: `context` and `settings`.

### Method Signature

```javascript
attach(context, settings);
```

### Parameters

#### context

The `context` parameter is a DOM element that represents the portion of the page being processed:

- **On initial page load**: `context` is the `document` object (entire page)
- **After AJAX request**: `context` is the newly added or updated DOM fragment
- **After BigPipe chunk**: `context` is the streamed content chunk

**Why context matters**: Querying within `context` instead of `document` improves performance and prevents processing elements that have already been initialized.

```javascript
// BAD: Searches entire document every time
Drupal.behaviors.example = {
  attach(context, settings) {
    document.querySelectorAll('hx-button').forEach((button) => {
      // This re-processes ALL buttons on every attach() call
    });
  },
};

// GOOD: Searches only new content
Drupal.behaviors.example = {
  attach(context, settings) {
    context.querySelectorAll('hx-button').forEach((button) => {
      // This only processes NEW buttons
    });
  },
};
```

#### settings

The `settings` parameter is a reference to the global `drupalSettings` object, which contains configuration data passed from PHP to JavaScript.

```php
// In PHP (module or theme)
$attachments['drupalSettings']['myModule']['config'] = [
  'apiEndpoint' => 'https://api.example.com',
  'timeout' => 5000,
  'debug' => TRUE,
];
```

```javascript
// In JavaScript Behavior
Drupal.behaviors.myModule = {
  attach(context, settings) {
    const config = settings.myModule.config;
    console.log(config.apiEndpoint); // 'https://api.example.com'
    console.log(config.timeout); // 5000
    console.log(config.debug); // true
  },
};
```

### When attach() Is Called

The `attach` method is invoked:

1. **On initial page load**: After DOM is ready, before images/external resources load
2. **After AJAX request completes**: When new content is inserted into the DOM
3. **After BigPipe renders a chunk**: When each streamed content chunk arrives
4. **When `Drupal.attachBehaviors()` is called manually**: By custom code or other modules

### attach() Execution Order

Behaviors are attached in the order they are defined in the `Drupal.behaviors` object. However, you should never rely on execution order. Instead:

- Make each Behavior independent
- Use events to communicate between Behaviors
- Declare dependencies explicitly via library dependencies

## The detach() Method: Cleanup and Memory Management

The `detach` method is optional but critical for preventing memory leaks and cleaning up event listeners when content is removed from the DOM.

### Method Signature

```javascript
detach(context, settings, trigger);
```

### Parameters

#### trigger

The `trigger` parameter indicates why `detach` was called:

- `'unload'`: Page is being unloaded (user navigating away)
- `'move'`: Element is being moved in the DOM (rare)
- `'serialize'`: Content is being serialized for AJAX submission

### When detach() Is Called

The `detach` method is invoked:

1. **Before AJAX replaces content**: When old content is about to be removed
2. **When page is unloaded**: Before user navigates to a new page
3. **When `Drupal.detachBehaviors()` is called manually**: By custom code

### Why detach() Matters

Without proper cleanup, you risk:

- **Memory leaks**: Event listeners that reference removed DOM elements
- **Duplicate handlers**: Multiple listeners attached to the same element
- **Stale references**: Code operating on removed DOM elements
- **Performance degradation**: Event handlers firing on non-existent elements

### detach() Best Practices

```javascript
Drupal.behaviors.hxEventHandlers = {
  attach(context, settings) {
    // Store handler reference for later removal
    const handleClick = (event) => {
      console.log('Card clicked:', event.detail);
    };

    context.querySelectorAll('hx-card').forEach((card) => {
      // Store reference on the element for cleanup
      card._clickHandler = handleClick;
      card.addEventListener('hx-card-click', handleClick);
    });
  },

  detach(context, settings, trigger) {
    if (trigger === 'unload') {
      context.querySelectorAll('hx-card').forEach((card) => {
        // Remove stored listener reference
        if (card._clickHandler) {
          card.removeEventListener('hx-card-click', card._clickHandler);
          delete card._clickHandler;
        }
      });
    }
  },
};
```

## Context Parameter Usage Patterns

Understanding the `context` parameter is crucial for writing efficient, correct Behaviors.

### Pattern 1: Query Within Context

Always query within `context`, not `document`:

```javascript
Drupal.behaviors.hxCards = {
  attach(context, settings) {
    // CORRECT: Queries within context
    const cards = context.querySelectorAll('hx-card');

    // INCORRECT: Queries entire document
    const allCards = document.querySelectorAll('hx-card');
  },
};
```

### Pattern 2: Context as Element

The `context` itself might be the element you're targeting:

```javascript
Drupal.behaviors.hxContextCheck = {
  attach(context, settings) {
    // Check if context itself is an hx-card
    if (context.nodeType === 1 && context.matches('hx-card')) {
      console.log('Context is an hx-card');
    }

    // Also query within context for nested cards
    context.querySelectorAll('hx-card').forEach((card) => {
      console.log('Found nested card:', card);
    });
  },
};
```

### Pattern 3: Checking Context Type

```javascript
Drupal.behaviors.hxContextAware = {
  attach(context, settings) {
    // Initial page load
    if (context === document) {
      console.log('Processing entire page');
    }
    // AJAX or BigPipe content
    else if (context.nodeType === 1) {
      console.log('Processing new content:', context);
    }
  },
};
```

## drupalSettings Integration

The `drupalSettings` object (passed as `settings` parameter) is how PHP passes configuration data to JavaScript.

### Passing Settings from PHP

#### In a Module

```php
// mymodule.module
function mymodule_page_attachments(array &$attachments) {
  $attachments['drupalSettings']['hxComponents'] = [
    'apiUrl' => 'https://api.healthcaresystem.com',
    'patientId' => \Drupal::currentUser()->id(),
    'environment' => getenv('APP_ENV'),
  ];
}
```

#### In a Theme

```php
// mytheme.theme
function mytheme_preprocess_page(&$variables) {
  $variables['#attached']['drupalSettings']['hxTheme'] = [
    'primaryColor' => theme_get_setting('primary_color'),
    'animations' => theme_get_setting('enable_animations'),
  ];
}
```

#### In a Render Array

```php
$build['#attached']['drupalSettings']['hxForm'] = [
  'validationRules' => [
    'patientName' => ['required' => TRUE, 'minLength' => 2],
    'medicalRecordNumber' => ['pattern' => '^MRN-\d{6}$'],
  ],
];
```

### Accessing Settings in JavaScript

```javascript
Drupal.behaviors.hxConfiguration = {
  attach(context, settings) {
    // Access settings passed from PHP
    const apiUrl = settings.hxComponents?.apiUrl;
    const patientId = settings.hxComponents?.patientId;

    // Use optional chaining to safely access nested properties
    const primaryColor = settings.hxTheme?.primaryColor ?? '#0066cc';

    // Apply settings to components
    context.querySelectorAll('hx-patient-card').forEach((card) => {
      if (patientId) {
        card.setAttribute('patient-id', patientId);
      }
      card.setAttribute('api-url', apiUrl);
    });
  },
};
```

### Settings Scope and Persistence

- **Global scope**: `drupalSettings` is a global object available throughout the page
- **Merge behavior**: Settings from multiple attachments are merged together
- **AJAX updates**: AJAX responses can include updated settings via `ajax_render()` attachments
- **No persistence**: Settings don't persist across page loads (use localStorage if needed)

### Security Considerations

Never pass sensitive data through `drupalSettings`:

```php
// BAD: Exposes sensitive data in HTML
$variables['#attached']['drupalSettings']['sensitive'] = [
  'apiKey' => 'sk_live_abcd1234',           // NEVER do this
  'privateToken' => $user->getToken(),      // NEVER do this
  'internalApiUrl' => 'http://10.0.0.5',    // NEVER do this
];

// GOOD: Pass only non-sensitive configuration
$variables['#attached']['drupalSettings']['hxComponents'] = [
  'publicApiUrl' => 'https://api.example.com',  // OK
  'environment' => 'production',                 // OK
  'userId' => $user->id(),                       // OK (public ID)
];
```

## The once() API: Idempotency Guaranteed

The `once()` API is Drupal's solution to preventing double-initialization. It guarantees that a callback function processes each element at most one time, regardless of how many times the behavior is called.

### Why once() Is Critical

Without `once()`, your Behavior would process the same elements repeatedly:

```javascript
// BAD: Without once() — adds duplicate event listeners
Drupal.behaviors.hxButtons = {
  attach(context, settings) {
    context.querySelectorAll('hx-button').forEach((button) => {
      // This runs EVERY time attach() is called
      // If attach() runs 3 times, you have 3 duplicate listeners
      button.addEventListener('click', handleClick);
    });
  },
};
```

Every AJAX request, every BigPipe chunk, every manual `attachBehaviors()` call would add duplicate listeners, causing:

- Multiple handler executions per event
- Memory leaks from un-removed listeners
- Unexpected behavior and bugs
- Performance degradation

### once() Syntax

```javascript
once(id, selector, context);
```

- **id**: Unique identifier for this once operation (string)
- **selector**: CSS selector to match elements (string)
- **context**: DOM element to search within (Element or Document)

Returns an array of elements that match the selector and have NOT been processed with this ID.

### Basic once() Usage

```javascript
import { once } from 'core/once';

Drupal.behaviors.hxButtons = {
  attach(context, settings) {
    // Process each button exactly once
    once('hx-button-init', 'hx-button', context).forEach((button) => {
      // This code runs only ONCE per button, ever
      button.addEventListener('click', handleClick);
    });
  },
};
```

### How once() Works

The `once()` function:

1. Queries for elements matching the selector within context
2. Filters out elements that have a `data-once` attribute with the specified ID
3. Adds `data-once="id"` to elements that pass the filter
4. Returns the filtered array of elements

After processing, the element looks like:

```html
<hx-button data-once="hx-button-init">Click Me</hx-button>
```

If the same element enters a new context (e.g., moved in DOM), `once()` will NOT process it again because it already has the `data-once` attribute.

### once() with Multiple IDs

You can use different IDs for different operations on the same element:

```javascript
Drupal.behaviors.hxButtonMulti = {
  attach(context, settings) {
    // Initialize button state
    once('hx-button-state', 'hx-button', context).forEach((button) => {
      button.setAttribute('state', 'ready');
    });

    // Attach click handler
    once('hx-button-click', 'hx-button', context).forEach((button) => {
      button.addEventListener('click', handleClick);
    });

    // Track analytics
    once('hx-button-analytics', 'hx-button', context).forEach((button) => {
      trackButtonView(button);
    });
  },
};
```

Result:

```html
<hx-button data-once="hx-button-state hx-button-click hx-button-analytics" state="ready">
  Click Me
</hx-button>
```

### once.filter(): Checking Without Marking

Sometimes you need to check if an element has been processed without marking it as processed:

```javascript
import { once } from 'core/once';

Drupal.behaviors.hxCheck = {
  attach(context, settings) {
    const buttons = context.querySelectorAll('hx-button');

    // Filter to only unprocessed buttons, without marking them
    const unprocessed = once.filter('hx-button-init', buttons);

    console.log(`Found ${unprocessed.length} unprocessed buttons`);

    // Later, process and mark them
    once('hx-button-init', 'hx-button', context).forEach((button) => {
      // Process button
    });
  },
};
```

### once.remove(): Resetting Processing State

The `once.remove()` function removes the `data-once` attribute, allowing elements to be re-processed:

```javascript
import { once } from 'core/once';

Drupal.behaviors.hxReset = {
  attach(context, settings) {
    // Initial processing
    once('hx-button-init', 'hx-button', context).forEach((button) => {
      button.addEventListener('click', handleClick);
    });
  },

  detach(context, settings, trigger) {
    if (trigger === 'unload') {
      const buttons = context.querySelectorAll('hx-button');

      // Remove event listeners
      buttons.forEach((button) => {
        button.removeEventListener('click', handleClick);
      });

      // Remove once marker so elements can be re-initialized if re-added
      once.remove('hx-button-init', 'hx-button', context);
    }
  },
};
```

### once() Best Practices

1. **Use descriptive IDs**: `'hx-card-init'` is better than `'init'`
2. **Namespace IDs**: Prefix with module/theme name (`'mytheme-hx-button'`)
3. **Consistent IDs**: Use the same ID for the same operation across behaviors
4. **Always use with context**: Pass `context` as third parameter
5. **Pair with detach**: Use `once.remove()` in `detach()` for cleanup

## AJAX Compatibility

HELIX web components work seamlessly with Drupal AJAX because they're built on web standards.

### How AJAX + Behaviors Work Together

1. User triggers AJAX request (form submit, link click, autocomplete)
2. Drupal AJAX framework sends request to server
3. Server returns JSON response with HTML content and commands
4. AJAX framework inserts new HTML into the DOM
5. `Drupal.attachBehaviors(context, settings)` is called with new content as context
6. All behaviors' `attach()` methods run on the new content
7. HELIX components auto-upgrade via Custom Elements registry

### AJAX Example: Loading Patient Cards

#### PHP Controller

```php
// PatientController.php
public function loadPatients() {
  $response = new AjaxResponse();

  $patients = $this->patientRepository->findAll();
  $html = '';

  foreach ($patients as $patient) {
    $html .= '<hx-card variant="patient" elevation="raised">';
    $html .= '  <span slot="heading">' . $patient->getName() . '</span>';
    $html .= '  <p>MRN: ' . $patient->getMedicalRecordNumber() . '</p>';
    $html .= '</hx-card>';
  }

  $response->addCommand(new HtmlCommand('#patient-list', $html));

  return $response;
}
```

#### JavaScript Behavior

```javascript
Drupal.behaviors.hxPatientCards = {
  attach(context, settings) {
    // This runs on initial page load AND after AJAX loads new cards
    once('hx-patient-card', 'hx-card[variant="patient"]', context).forEach((card) => {
      // Track card view
      if (settings.analytics?.enabled) {
        trackPatientCardView(card);
      }

      // Add click handler
      card.addEventListener('hx-card-click', (event) => {
        const mrn = event.detail.mrn;
        navigateToPatientDetail(mrn);
      });
    });
  },
};
```

### AJAX + drupalSettings Updates

AJAX responses can include updated settings:

```php
$response = new AjaxResponse();

// Update settings for newly loaded content
$response->addCommand(new SettingsCommand([
  'hxPatients' => [
    'lastLoaded' => time(),
    'totalCount' => count($patients),
  ],
], TRUE)); // TRUE = merge with existing settings

$response->addCommand(new HtmlCommand('#patient-list', $html));

return $response;
```

```javascript
Drupal.behaviors.hxPatientStats = {
  attach(context, settings) {
    // Access updated settings after AJAX
    const lastLoaded = settings.hxPatients?.lastLoaded;
    const totalCount = settings.hxPatients?.totalCount;

    console.log(`Loaded ${totalCount} patients at ${new Date(lastLoaded * 1000)}`);
  },
};
```

### AJAX Performance Tips

1. **Narrow context scope**: Query within `context`, not `document`
2. **Use once()**: Prevent re-processing existing elements
3. **Defer heavy work**: Use `requestAnimationFrame()` or `setTimeout()` for expensive operations
4. **Batch operations**: Process multiple elements together when possible

## Behaviors with HELIX Components

HELIX web components are Custom Elements, which means they automatically upgrade when added to the DOM. However, Behaviors are still useful for:

- Attaching event listeners
- Passing configuration from drupalSettings
- Integrating with Drupal-specific APIs
- Coordinating multiple components
- Analytics and tracking

### Pattern 1: Event Listener Attachment

```javascript
import { once } from 'core/once';

Drupal.behaviors.hxCardEvents = {
  attach(context, settings) {
    once('hx-card-events', 'hx-card', context).forEach((card) => {
      // Listen for custom events
      card.addEventListener('hx-card-click', (event) => {
        console.log('Card clicked:', event.detail);

        // Trigger Drupal AJAX if configured
        if (settings.hxCards?.ajaxEnabled) {
          loadCardDetails(event.detail.cardId);
        }
      });
    });
  },

  detach(context, settings, trigger) {
    if (trigger === 'unload') {
      const cards = context.querySelectorAll('hx-card');
      cards.forEach((card) => {
        // Clean up listeners
        card.removeEventListener('hx-card-click', this.handleCardClick);
      });
      once.remove('hx-card-events', 'hx-card', context);
    }
  },
};
```

### Pattern 2: Configuration from drupalSettings

```javascript
Drupal.behaviors.hxFormConfig = {
  attach(context, settings) {
    once('hx-form-config', 'hx-text-input', context).forEach((input) => {
      // Apply validation rules from drupalSettings
      const rules = settings.hxForms?.validation?.[input.name];

      if (rules) {
        if (rules.required) {
          input.setAttribute('required', '');
        }
        if (rules.pattern) {
          input.setAttribute('pattern', rules.pattern);
        }
        if (rules.maxLength) {
          input.setAttribute('maxlength', rules.maxLength);
        }
      }
    });
  },
};
```

### Pattern 3: Component Coordination

```javascript
Drupal.behaviors.hxAccordionSync = {
  attach(context, settings) {
    once('hx-accordion-sync', 'hx-accordion[data-sync-group]', context).forEach((accordion) => {
      const syncGroup = accordion.getAttribute('data-sync-group');

      accordion.addEventListener('hx-toggle', (event) => {
        if (event.detail.open) {
          // Close all other accordions in the same sync group
          const siblings = document.querySelectorAll(
            `hx-accordion[data-sync-group="${syncGroup}"]`,
          );

          siblings.forEach((sibling) => {
            if (sibling !== accordion && sibling.open) {
              sibling.open = false;
            }
          });
        }
      });
    });
  },
};
```

### Pattern 4: Analytics and Tracking

```javascript
Drupal.behaviors.hxAnalytics = {
  attach(context, settings) {
    if (!settings.analytics?.enabled) {
      return;
    }

    // Track button clicks
    once('hx-button-analytics', 'hx-button', context).forEach((button) => {
      button.addEventListener('click', (event) => {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'button_click', {
            button_variant: button.variant,
            button_size: button.size,
            button_text: button.textContent.trim(),
          });
        }
      });
    });

    // Track form submissions
    once('hx-form-analytics', 'hx-form', context).forEach((form) => {
      form.addEventListener('hx-submit', (event) => {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'form_submit', {
            form_id: form.id,
            form_fields: Object.keys(event.detail.data).length,
          });
        }
      });
    });
  },
};
```

## Complete Working Examples

### Example 1: Patient Dashboard with AJAX Loading

```javascript
/**
 * Patient Dashboard Behavior
 *
 * Handles patient card interactions, AJAX loading, and real-time updates.
 */
import { once } from 'core/once';

(function (Drupal, drupalSettings, once) {
  'use strict';

  Drupal.behaviors.hxPatientDashboard = {
    attach(context, settings) {
      const config = settings.hxPatientDashboard || {};

      // Initialize patient cards
      once('hx-patient-card', 'hx-card[data-patient-id]', context).forEach((card) => {
        const patientId = card.getAttribute('data-patient-id');

        // Add click handler to navigate to patient detail
        card.addEventListener('hx-card-click', (event) => {
          if (config.useAjax) {
            // Load patient details via AJAX
            this.loadPatientDetails(patientId);
          } else {
            // Navigate to patient detail page
            window.location.href = `/patients/${patientId}`;
          }
        });

        // Track card view for analytics
        if (config.analytics?.enabled) {
          this.trackPatientView(patientId, card.getAttribute('variant'));
        }
      });

      // Initialize "Load More" button
      once('hx-load-more', 'hx-button[data-load-more]', context).forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          this.loadMorePatients(button);
        });
      });
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        // Clean up event listeners
        const cards = context.querySelectorAll('hx-card[data-patient-id]');
        cards.forEach((card) => {
          // Remove all event listeners by cloning and replacing
          const clone = card.cloneNode(true);
          card.parentNode.replaceChild(clone, card);
        });

        // Remove once markers
        once.remove('hx-patient-card', 'hx-card[data-patient-id]', context);
        once.remove('hx-load-more', 'hx-button[data-load-more]', context);
      }
    },

    loadPatientDetails(patientId) {
      const ajax = Drupal.ajax({
        url: `/ajax/patients/${patientId}`,
        wrapper: 'patient-detail-modal',
      });
      ajax.execute();
    },

    loadMorePatients(button) {
      const offset = button.getAttribute('data-offset') || 0;
      const limit = button.getAttribute('data-limit') || 10;

      // Show loading state
      button.setAttribute('loading', '');
      button.textContent = 'Loading...';

      const ajax = Drupal.ajax({
        url: `/ajax/patients/load-more?offset=${offset}&limit=${limit}`,
        wrapper: 'patient-list',
        method: 'append',
      });

      ajax.execute().then(() => {
        // Update offset for next load
        button.setAttribute('data-offset', parseInt(offset) + parseInt(limit));
        button.removeAttribute('loading');
        button.textContent = 'Load More Patients';
      });
    },

    trackPatientView(patientId, variant) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'patient_card_view', {
          patient_id: patientId,
          card_variant: variant,
        });
      }
    },
  };
})(Drupal, drupalSettings, once);
```

### Example 2: Form Validation with HELIX Components

```javascript
/**
 * HELIX Form Validation Behavior
 *
 * Applies validation rules from drupalSettings to HELIX form components.
 */
import { once } from 'core/once';

(function (Drupal, drupalSettings, once) {
  'use strict';

  Drupal.behaviors.hxFormValidation = {
    attach(context, settings) {
      const validationRules = settings.hxForms?.validation || {};

      // Apply validation rules to text inputs
      once('hx-input-validation', 'hx-text-input', context).forEach((input) => {
        const fieldName = input.getAttribute('name');
        const rules = validationRules[fieldName];

        if (rules) {
          this.applyValidationRules(input, rules);
          this.attachValidationListeners(input, rules);
        }
      });

      // Apply validation rules to textareas
      once('hx-textarea-validation', 'hx-textarea', context).forEach((textarea) => {
        const fieldName = textarea.getAttribute('name');
        const rules = validationRules[fieldName];

        if (rules) {
          this.applyValidationRules(textarea, rules);
          this.attachValidationListeners(textarea, rules);
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
        once.remove('hx-form-submit', 'hx-form', context);
      }
    },

    applyValidationRules(element, rules) {
      if (rules.required) {
        element.setAttribute('required', '');
      }
      if (rules.pattern) {
        element.setAttribute('pattern', rules.pattern);
      }
      if (rules.minLength) {
        element.setAttribute('minlength', rules.minLength);
      }
      if (rules.maxLength) {
        element.setAttribute('maxlength', rules.maxLength);
      }
    },

    attachValidationListeners(element, rules) {
      // Real-time validation on blur
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
        element.setAttribute('error-message', 'This field is required.');
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

      form.querySelectorAll('hx-text-input, hx-textarea').forEach((field) => {
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

### Example 3: Accordion State Persistence

```javascript
/**
 * HELIX Accordion State Persistence Behavior
 *
 * Saves accordion open/closed state to localStorage and restores on page load.
 */
import { once } from 'core/once';

(function (Drupal, drupalSettings, once) {
  'use strict';

  Drupal.behaviors.hxAccordionPersistence = {
    attach(context, settings) {
      const config = settings.hxAccordion || {};

      if (!config.persistState) {
        return; // State persistence disabled
      }

      once('hx-accordion-persist', 'hx-accordion[id]', context).forEach((accordion) => {
        const accordionId = accordion.id;
        const storageKey = `hx-accordion-state-${accordionId}`;

        // Restore state from localStorage
        const savedState = this.loadState(storageKey);
        if (savedState !== null) {
          accordion.open = savedState;
        }

        // Save state on toggle
        accordion.addEventListener('hx-toggle', (event) => {
          this.saveState(storageKey, event.detail.open);
        });
      });
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-accordion-persist', 'hx-accordion[id]', context);
      }
    },

    saveState(key, isOpen) {
      try {
        localStorage.setItem(key, JSON.stringify(isOpen));
      } catch (error) {
        console.warn('Failed to save accordion state:', error);
      }
    },

    loadState(key) {
      try {
        const saved = localStorage.getItem(key);
        return saved !== null ? JSON.parse(saved) : null;
      } catch (error) {
        console.warn('Failed to load accordion state:', error);
        return null;
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
  button.addEventListener('click', handleClick);
});
```

**DON'T**:

```javascript
context.querySelectorAll('hx-button').forEach((button) => {
  button.addEventListener('click', handleClick); // Duplicate listeners!
});
```

### 2. Query Within Context

**DO**:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    context.querySelectorAll('hx-card').forEach((card) => {
      // Only processes cards in the current context
    });
  },
};
```

**DON'T**:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    document.querySelectorAll('hx-card').forEach((card) => {
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
    once('example-init', 'hx-button', context).forEach((button) => {
      const handler = () => console.log('clicked');
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

### 4. Use Defensive Programming

**DO**:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    const config = settings.hxComponents?.config;

    if (!config) {
      console.warn('hxComponents config not found in drupalSettings');
      return;
    }

    const apiUrl = config.apiUrl ?? 'https://default-api.com';
  },
};
```

### 5. Namespace Your Behaviors

**DO**:

```javascript
Drupal.behaviors.myThemeHxCards = {
  // Clear namespace prevents conflicts
};
```

**DON'T**:

```javascript
Drupal.behaviors.cards = {
  // Generic name, high conflict risk
};
```

### 6. Document Your Behaviors

**DO**:

```javascript
/**
 * Patient Card Interaction Behavior
 *
 * Handles click events on patient cards, loads patient details via AJAX,
 * and tracks analytics.
 *
 * Depends on:
 * - core/once
 * - core/drupal.ajax
 *
 * Settings:
 * - drupalSettings.hxPatients.ajaxEnabled (boolean)
 * - drupalSettings.hxPatients.analytics (object)
 */
Drupal.behaviors.hxPatientCards = {
  attach(context, settings) {
    // Implementation
  },
};
```

### 7. Handle Missing Dependencies Gracefully

**DO**:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    if (typeof once === 'undefined') {
      console.error('once is not defined. Is core/once declared as a dependency?');
      return;
    }

    once('example-init', 'hx-button', context).forEach((button) => {
      // Safe to use once()
    });
  },
};
```

### 8. Avoid Heavy Computation in attach()

**DO**:

```javascript
Drupal.behaviors.example = {
  attach(context, settings) {
    once('example-init', 'hx-card', context).forEach((card) => {
      // Defer heavy work
      requestAnimationFrame(() => {
        this.expensiveOperation(card);
      });
    });
  },
};
```

### 9. Test with AJAX and BigPipe

Always test your Behaviors with:

- Initial page load
- AJAX form submissions
- AJAX Views infinite scroll
- BigPipe enabled
- Multiple rapid AJAX requests

### 10. Follow Drupal Coding Standards

- Use strict mode: `'use strict';`
- Use semicolons consistently
- Use descriptive variable names
- Follow [Drupal JavaScript coding standards](https://www.drupal.org/docs/develop/standards/javascript)

## Troubleshooting

### Behavior Not Running

**Check**:

1. Is the library properly attached? (`#attached['library']`)
2. Is the behavior name unique?
3. Is `Drupal` defined before your code runs?
4. Are there JavaScript errors preventing execution?

### Duplicate Event Handlers

**Cause**: Not using `once()`

**Fix**:

```javascript
// Add once() wrapper
once('my-event', 'hx-button', context).forEach((button) => {
  button.addEventListener('click', handleClick);
});
```

### Elements Not Found in Context

**Cause**: Querying `document` instead of `context`

**Fix**:

```javascript
// Change from:
document.querySelectorAll('hx-card');

// To:
context.querySelectorAll('hx-card');
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
    - core/drupalSettings # Add this dependency
    - core/once
```

### Memory Leaks

**Cause**: Not removing event listeners in `detach()`

**Fix**: Implement proper cleanup in `detach()` method

## Further Reading

### Official Drupal Documentation

- [JavaScript API Overview](https://www.drupal.org/docs/drupal-apis/javascript-api/javascript-api-overview)
- [Managing JavaScript in Drupal](https://www.drupal.org/docs/drupal-apis/javascript-api/managing-javascript)
- [AJAX API](https://www.drupal.org/docs/develop/drupal-apis/ajax-api)

### HELIX Integration Guides

- [Drupal Integration Overview](/drupal-integration/overview/)
- [Twig Templates](/drupal-integration/twig/)
- [Asset Loading Strategies](/drupal-integration/installation/)

### Community Resources

- [Understanding JavaScript Behaviors in Drupal (Lullabot)](https://www.lullabot.com/articles/understanding-javascript-behaviors-in-drupal)
- [Taming JavaScript in Drupal (Specbee)](https://www.specbee.com/blogs/taming-javascript-in-drupal)
- [Drupal Behaviors, AJAX and Doing it Once (Blue-Bag)](https://www.blue-bag.com/blog/drupal-behaviors-ajax-and-doing-it-once)

---

## Summary

Drupal Behaviors are the foundation of JavaScript integration in Drupal. Key takeaways:

1. **Use `attach()` for initialization** — runs on page load, AJAX, and BigPipe
2. **Use `detach()` for cleanup** — prevents memory leaks and duplicate handlers
3. **Always use `once()`** — guarantees idempotent execution
4. **Query within `context`** — improves performance and correctness
5. **Access `drupalSettings` via `settings` parameter** — configuration from PHP
6. **HELIX components work seamlessly** — Custom Elements auto-upgrade
7. **Test with AJAX and BigPipe** — ensure behaviors work in all scenarios
8. **Implement proper cleanup** — remove listeners and reset state in `detach()`

Mastering Drupal Behaviors ensures your HELIX component integrations are robust, performant, and maintainable.

---

**Sources:**

- [JavaScript API Overview | Drupal.org](https://www.drupal.org/docs/drupal-apis/javascript-api/javascript-api-overview)
- [Taming JavaScript in Drupal | Specbee](https://www.specbee.com/blogs/taming-javascript-in-drupal)
- [Understanding JavaScript Behaviors in Drupal | Lullabot](https://www.lullabot.com/articles/understanding-javascript-behaviors-in-drupal)
- [Drupal Behaviors, AJAX and Doing it Once | Blue-Bag](https://www.blue-bag.com/blog/drupal-behaviors-ajax-and-doing-it-once)
- [Guide: How to Integrate JavaScript in Drupal 8-9 | The Russian Lullaby](https://www.therussianlullaby.com/blog/guide-how-to-integrate-javascript-in-drupal-8-9/)
