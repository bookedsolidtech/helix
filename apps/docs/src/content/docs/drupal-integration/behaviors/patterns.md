---
title: Drupal Behavior Patterns
description: Advanced patterns for implementing Drupal.behaviors with HELIX components - progressive enhancement, initialization strategies, cleanup, event delegation, AJAX compatibility, and idempotency
order: 14
---

Drupal Behaviors provide a powerful lifecycle system for JavaScript integration. This guide explores advanced patterns for implementing behaviors with HELIX web components, covering progressive enhancement, initialization strategies, cleanup patterns, event delegation, and AJAX compatibility.

Building on the fundamentals covered in [Drupal Behaviors Fundamentals](/drupal-integration/behaviors/fundamentals/), this guide presents battle-tested patterns for real-world healthcare enterprise applications.

## Progressive Enhancement Pattern

Progressive enhancement ensures your application remains functional even when JavaScript fails to load or is disabled. For healthcare applications where reliability is critical, this pattern is non-negotiable.

### Core Principles

1. **Content is accessible without JavaScript** - All essential information is present in the HTML
2. **Web components enhance, not replace** - HELIX components add interactivity to existing HTML
3. **Graceful degradation** - Functionality degrades gracefully when components fail to load
4. **Server-side fallbacks** - Critical actions have non-JavaScript alternatives

### Pattern: Progressively Enhanced Button

```twig
{# templates/components/patient-action.html.twig #}
<form method="post" action="{{ url('patient.action') }}">
  <input type="hidden" name="patient_id" value="{{ patient.id }}" />
  <input type="hidden" name="action_type" value="{{ action_type }}" />

  {# Native button works without JavaScript #}
  <button type="submit" name="submit" class="fallback-button">
    {{ button_text }}
  </button>

  {# HELIX component enhances the experience #}
  <hx-button
    type="submit"
    variant="primary"
    size="md"
    data-patient-id="{{ patient.id }}"
    data-action="{{ action_type }}"
    hidden
  >
    {{ button_text }}
  </hx-button>
</form>
```

```javascript
/**
 * Progressive Enhancement: Replace Fallback with HELIX Component
 *
 * Shows the enhanced HELIX button and hides the fallback only after
 * the component is fully loaded and initialized.
 */
import { once } from 'core/once';

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxProgressiveButtons = {
    attach(context, settings) {
      once('hx-progressive-button', 'hx-button[hidden]', context).forEach((button) => {
        // Wait for component to be fully defined
        if (customElements.get('hx-button')) {
          // Component is ready, show enhanced version
          button.removeAttribute('hidden');

          // Hide fallback button
          const fallback = button.parentElement?.querySelector('.fallback-button');
          if (fallback) {
            fallback.setAttribute('hidden', '');
          }
        } else {
          // Component not loaded yet, wait for it
          customElements.whenDefined('hx-button').then(() => {
            button.removeAttribute('hidden');
            const fallback = button.parentElement?.querySelector('.fallback-button');
            if (fallback) {
              fallback.setAttribute('hidden', '');
            }
          });
        }
      });
    },
  };
})(Drupal, once);
```

### Pattern: Content-First Card Layout

```twig
{# templates/patient-card.html.twig #}
<article class="patient-card-fallback" data-patient-id="{{ patient.id }}">
  {# All content is visible without JavaScript #}
  <div class="patient-card__header">
    <h3>{{ patient.name }}</h3>
    <span class="patient-card__mrn">MRN: {{ patient.mrn }}</span>
  </div>

  <div class="patient-card__body">
    {{ patient.summary }}
  </div>

  <div class="patient-card__footer">
    <a href="{{ patient.detail_url }}" class="patient-card__link">
      View Patient Details
    </a>
  </div>

  {# HELIX component enhances presentation and interaction #}
  <hx-card
    variant="default"
    elevation="raised"
    hx-href="{{ patient.detail_url }}"
    data-patient-id="{{ patient.id }}"
    hidden
  >
    <span slot="heading">{{ patient.name }}</span>
    <p>MRN: {{ patient.mrn }}</p>
    {{ patient.summary }}
    <div slot="footer">
      <hx-badge variant="info">Active Patient</hx-badge>
    </div>
  </hx-card>
</article>
```

```javascript
import { once } from 'core/once';

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxProgressiveCards = {
    attach(context, settings) {
      once('hx-progressive-card', 'article.patient-card-fallback', context).forEach((article) => {
        const card = article.querySelector('hx-card');

        if (!card) return;

        // Wait for both hx-card and hx-badge to be ready
        Promise.all([
          customElements.whenDefined('hx-card'),
          customElements.whenDefined('hx-badge'),
        ]).then(() => {
          // Components ready, show enhanced version
          card.removeAttribute('hidden');

          // Hide fallback content (but keep for screen readers)
          const fallbackElements = article.querySelectorAll(
            '.patient-card__header, .patient-card__body, .patient-card__footer',
          );
          fallbackElements.forEach((el) => {
            el.classList.add('visually-hidden');
          });
        });
      });
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-progressive-card', 'article.patient-card-fallback', context);
      }
    },
  };
})(Drupal, once);
```

### Pattern: Critical Content, Enhanced Interaction

```javascript
/**
 * Progressive Enhancement: Form Validation
 *
 * Native HTML5 validation works without JavaScript.
 * HELIX components add real-time validation and better UX.
 */
import { once } from 'core/once';

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxProgressiveFormValidation = {
    attach(context, settings) {
      once('hx-progressive-form', 'form[data-hx-enhanced]', context).forEach((form) => {
        // Check if HELIX form components are available
        const hasHxComponents = form.querySelector('hx-text-input, hx-select, hx-textarea');

        if (!hasHxComponents) {
          // No HELIX components, use native validation
          return;
        }

        // Wait for all HELIX components to be defined
        const componentTags = new Set();
        form
          .querySelectorAll('[is], hx-text-input, hx-select, hx-textarea, hx-checkbox')
          .forEach((el) => {
            componentTags.add(el.tagName.toLowerCase());
          });

        Promise.all(Array.from(componentTags).map((tag) => customElements.whenDefined(tag))).then(
          () => {
            // All components loaded, enhance validation
            this._enhanceFormValidation(form, settings);
          },
        );
      });
    },

    _enhanceFormValidation(form, settings) {
      // Real-time validation on HELIX components
      form.querySelectorAll('hx-text-input, hx-textarea').forEach((input) => {
        input.addEventListener('hx-input', (event) => {
          // Validate as user types (debounced)
          clearTimeout(input._validationTimeout);
          input._validationTimeout = setTimeout(() => {
            this._validateField(input);
          }, 300);
        });

        input.addEventListener('hx-blur', () => {
          // Immediate validation on blur
          this._validateField(input);
        });
      });

      // Enhanced submit with custom event
      form.addEventListener('submit', (event) => {
        if (!this._validateAllFields(form)) {
          event.preventDefault();

          // Dispatch custom event for enhanced error handling
          form.dispatchEvent(
            new CustomEvent('hx-form-invalid', {
              bubbles: true,
              composed: true,
              detail: { errors: this._collectErrors(form) },
            }),
          );
        }
      });
    },

    _validateField(field) {
      if (!field.checkValidity || typeof field.checkValidity !== 'function') {
        return true;
      }

      const isValid = field.checkValidity();

      if (!isValid) {
        field.setAttribute('error', '');
        field.setAttribute('error-message', field.validationMessage || 'Invalid input');
      } else {
        field.removeAttribute('error');
        field.removeAttribute('error-message');
      }

      return isValid;
    },

    _validateAllFields(form) {
      let allValid = true;
      const fields = form.querySelectorAll('hx-text-input, hx-select, hx-textarea, hx-checkbox');

      fields.forEach((field) => {
        if (!this._validateField(field)) {
          allValid = false;
        }
      });

      return allValid;
    },

    _collectErrors(form) {
      const errors = [];
      form.querySelectorAll('[error]').forEach((field) => {
        errors.push({
          name: field.getAttribute('name') || field.id,
          message: field.getAttribute('error-message') || 'Validation failed',
        });
      });
      return errors;
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-progressive-form', 'form[data-hx-enhanced]', context);
      }
    },
  };
})(Drupal, once);
```

## Initialization Patterns

Different components require different initialization strategies. These patterns address common initialization challenges.

### Pattern: Lazy Initialization

Initialize components only when they become visible or are about to be interacted with.

```javascript
/**
 * Lazy Initialization Pattern
 *
 * Defers component initialization until visible in viewport.
 * Improves initial page load performance.
 */
import { once } from 'core/once';

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxLazyInit = {
    attach(context, settings) {
      // Early exit if IntersectionObserver not supported
      if (!('IntersectionObserver' in window)) {
        // Fall back to immediate initialization
        this._initializeAllCards(context, settings);
        return;
      }

      once('hx-lazy-card', 'hx-card[data-lazy-init]', context).forEach((card) => {
        // Mark as pending initialization
        card.setAttribute('data-lazy-pending', '');

        // Create observer for this card
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                // Card is visible, initialize
                this._initializeCard(entry.target, settings);
                observer.unobserve(entry.target);
              }
            });
          },
          {
            rootMargin: '50px', // Initialize 50px before entering viewport
            threshold: 0.01,
          },
        );

        observer.observe(card);

        // Store observer for cleanup
        card._lazyObserver = observer;
      });
    },

    _initializeCard(card, settings) {
      // Remove pending marker
      card.removeAttribute('data-lazy-pending');
      card.setAttribute('data-lazy-initialized', '');

      // Load data if needed
      const dataUrl = card.getAttribute('data-load-url');
      if (dataUrl) {
        this._loadCardData(card, dataUrl);
      }

      // Attach event listeners
      card.addEventListener('hx-card-click', (event) => {
        this._handleCardClick(event, settings);
      });

      // Trigger custom initialization event
      card.dispatchEvent(
        new CustomEvent('hx-card-initialized', {
          bubbles: true,
          composed: true,
        }),
      );
    },

    _initializeAllCards(context, settings) {
      // Fallback: initialize all cards immediately
      once('hx-lazy-card', 'hx-card[data-lazy-init]', context).forEach((card) => {
        this._initializeCard(card, settings);
      });
    },

    _loadCardData(card, url) {
      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          // Update card content with loaded data
          const heading = card.querySelector('[slot="heading"]');
          if (heading && data.title) {
            heading.textContent = data.title;
          }

          // Update other slots as needed
          if (data.content) {
            const body = document.createElement('div');
            body.innerHTML = data.content;
            card.appendChild(body);
          }

          card.dispatchEvent(
            new CustomEvent('hx-card-data-loaded', {
              bubbles: true,
              composed: true,
              detail: { data },
            }),
          );
        })
        .catch((error) => {
          console.error('Failed to load card data:', error);
          card.setAttribute('data-load-error', error.message);
        });
    },

    _handleCardClick(event, settings) {
      console.log('Lazy-initialized card clicked:', event.detail);
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        // Clean up observers
        const cards = context.querySelectorAll('hx-card[data-lazy-init]');
        cards.forEach((card) => {
          if (card._lazyObserver) {
            card._lazyObserver.disconnect();
            delete card._lazyObserver;
          }
        });

        once.remove('hx-lazy-card', 'hx-card[data-lazy-init]', context);
      }
    },
  };
})(Drupal, once);
```

### Pattern: Conditional Initialization

Initialize components based on runtime conditions, user roles, or feature flags.

```javascript
/**
 * Conditional Initialization Pattern
 *
 * Initializes components only when specific conditions are met.
 */
import { once } from 'core/once';

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxConditionalInit = {
    attach(context, settings) {
      const config = settings.hxComponents || {};

      // Condition 1: User role check
      const userRole = settings.user?.roles || [];
      const requiresRole = config.requiredRole;

      if (requiresRole && !userRole.includes(requiresRole)) {
        console.log(`Skipping initialization: user lacks required role ${requiresRole}`);
        return;
      }

      // Condition 2: Feature flag check
      if (config.featureFlags?.advancedCards === false) {
        console.log('Skipping initialization: advanced cards feature disabled');
        return;
      }

      // Condition 3: Browser capability check
      if (!this._checkBrowserCapabilities()) {
        console.log('Skipping initialization: browser lacks required capabilities');
        this._showFallbackUI(context);
        return;
      }

      // All conditions met, proceed with initialization
      once('hx-conditional-card', 'hx-card[data-conditional]', context).forEach((card) => {
        // Check component-level conditions
        const requiresPermission = card.getAttribute('data-requires-permission');
        const userPermissions = settings.user?.permissions || [];

        if (requiresPermission && !userPermissions.includes(requiresPermission)) {
          // Hide card if user lacks permission
          card.setAttribute('hidden', '');
          return;
        }

        // Initialize card
        this._initializeCard(card, settings);
      });
    },

    _checkBrowserCapabilities() {
      // Check for required browser features
      return 'customElements' in window && 'IntersectionObserver' in window && 'fetch' in window;
    },

    _showFallbackUI(context) {
      // Show fallback content for unsupported browsers
      const fallbacks = context.querySelectorAll('[data-fallback-for]');
      fallbacks.forEach((fallback) => {
        fallback.removeAttribute('hidden');
      });
    },

    _initializeCard(card, settings) {
      // Standard initialization logic
      card.addEventListener('hx-card-click', (event) => {
        this._handleCardClick(event, settings);
      });

      card.setAttribute('data-initialized', '');
    },

    _handleCardClick(event, settings) {
      // Handle card click based on settings
      const analyticsEnabled = settings.hxComponents?.analytics !== false;

      if (analyticsEnabled) {
        this._trackCardClick(event.detail);
      }
    },

    _trackCardClick(detail) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'card_click', {
          card_variant: detail.variant,
          card_url: detail.url,
        });
      }
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-conditional-card', 'hx-card[data-conditional]', context);
      }
    },
  };
})(Drupal, once);
```

### Pattern: Staged Initialization

Initialize components in stages to prevent blocking the main thread.

```javascript
/**
 * Staged Initialization Pattern
 *
 * Initializes components in priority-based stages using requestIdleCallback.
 */
import { once } from 'core/once';

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxStagedInit = {
    attach(context, settings) {
      // Stage 1 (immediate): Critical, above-the-fold components
      this._initStage1(context, settings);

      // Stage 2 (next idle): Important but not critical
      this._scheduleStage2(context, settings);

      // Stage 3 (low priority): Non-essential enhancements
      this._scheduleStage3(context, settings);
    },

    _initStage1(context, settings) {
      // Critical: Initialize visible forms immediately
      once('hx-stage1-form', 'hx-form:not([data-lazy])', context).forEach((form) => {
        this._initializeForm(form, settings);
      });

      // Critical: Initialize visible buttons
      once('hx-stage1-button', 'hx-button[data-priority="high"]', context).forEach((button) => {
        this._initializeButton(button, settings);
      });
    },

    _scheduleStage2(context, settings) {
      const callback = () => {
        // Important: Initialize visible cards
        once('hx-stage2-card', 'hx-card:not([data-lazy])', context).forEach((card) => {
          this._initializeCard(card, settings);
        });

        // Important: Initialize alerts and notifications
        once('hx-stage2-alert', 'hx-alert', context).forEach((alert) => {
          this._initializeAlert(alert, settings);
        });
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 1000 });
      } else {
        setTimeout(callback, 100);
      }
    },

    _scheduleStage3(context, settings) {
      const callback = () => {
        // Non-essential: Initialize analytics tracking
        once('hx-stage3-analytics', '[data-track]', context).forEach((element) => {
          this._initializeTracking(element, settings);
        });

        // Non-essential: Initialize tooltips and hints
        once('hx-stage3-tooltip', '[data-tooltip]', context).forEach((element) => {
          this._initializeTooltip(element, settings);
        });
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 2000 });
      } else {
        setTimeout(callback, 500);
      }
    },

    _initializeForm(form, settings) {
      form.addEventListener('hx-submit', (event) => {
        console.log('Form submitted:', event.detail);
      });
      form.setAttribute('data-stage', '1');
    },

    _initializeButton(button, settings) {
      button.addEventListener('hx-click', (event) => {
        console.log('Critical button clicked:', event.detail);
      });
      button.setAttribute('data-stage', '1');
    },

    _initializeCard(card, settings) {
      card.addEventListener('hx-card-click', (event) => {
        console.log('Card clicked:', event.detail);
      });
      card.setAttribute('data-stage', '2');
    },

    _initializeAlert(alert, settings) {
      alert.setAttribute('data-stage', '2');
    },

    _initializeTracking(element, settings) {
      const trackingEvent = element.getAttribute('data-track');
      element.addEventListener('click', () => {
        if (typeof gtag !== 'undefined') {
          gtag('event', trackingEvent);
        }
      });
      element.setAttribute('data-stage', '3');
    },

    _initializeTooltip(element, settings) {
      element.setAttribute('data-stage', '3');
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-stage1-form', 'hx-form:not([data-lazy])', context);
        once.remove('hx-stage1-button', 'hx-button[data-priority="high"]', context);
        once.remove('hx-stage2-card', 'hx-card:not([data-lazy])', context);
        once.remove('hx-stage2-alert', 'hx-alert', context);
        once.remove('hx-stage3-analytics', '[data-track]', context);
        once.remove('hx-stage3-tooltip', '[data-tooltip]', context);
      }
    },
  };
})(Drupal, once);
```

## Cleanup Patterns (detach)

Proper cleanup prevents memory leaks and ensures components can be safely removed from the DOM.

### Pattern: Comprehensive Event Listener Cleanup

```javascript
/**
 * Comprehensive Cleanup Pattern
 *
 * Stores event listener references for proper removal during detach.
 */
import { once } from 'core/once';

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxComprehensiveCleanup = {
    // Store handlers in WeakMap to avoid memory leaks
    _handlers: new WeakMap(),

    attach(context, settings) {
      once('hx-cleanup-demo', 'hx-card[data-interactive]', context).forEach((card) => {
        // Create handler object for this card
        const handlers = {
          click: this._createClickHandler(card, settings),
          mouseenter: this._createMouseEnterHandler(card),
          mouseleave: this._createMouseLeaveHandler(card),
        };

        // Store handlers for later removal
        this._handlers.set(card, handlers);

        // Attach all listeners
        card.addEventListener('hx-card-click', handlers.click);
        card.addEventListener('mouseenter', handlers.mouseenter);
        card.addEventListener('mouseleave', handlers.mouseleave);

        // Mark as initialized
        card.setAttribute('data-handlers-attached', '');
      });
    },

    _createClickHandler(card, settings) {
      return (event) => {
        console.log('Card clicked:', event.detail);

        // Perform some action
        if (settings.hxCards?.loadDetails) {
          this._loadCardDetails(card, event.detail.url);
        }
      };
    },

    _createMouseEnterHandler(card) {
      return () => {
        card.setAttribute('data-hover', 'true');
      };
    },

    _createMouseLeaveHandler(card) {
      return () => {
        card.removeAttribute('data-hover');
      };
    },

    _loadCardDetails(card, url) {
      // Simulate loading details
      console.log('Loading details from:', url);
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        const cards = context.querySelectorAll('hx-card[data-interactive][data-handlers-attached]');

        cards.forEach((card) => {
          // Retrieve stored handlers
          const handlers = this._handlers.get(card);

          if (handlers) {
            // Remove all listeners
            card.removeEventListener('hx-card-click', handlers.click);
            card.removeEventListener('mouseenter', handlers.mouseenter);
            card.removeEventListener('mouseleave', handlers.mouseleave);

            // Clean up WeakMap entry
            this._handlers.delete(card);
          }

          // Remove data attributes
          card.removeAttribute('data-handlers-attached');
          card.removeAttribute('data-hover');
        });

        // Remove once markers
        once.remove('hx-cleanup-demo', 'hx-card[data-interactive]', context);
      }
    },
  };
})(Drupal, once);
```

### Pattern: Resource Cleanup (Timers, Observers, Subscriptions)

```javascript
/**
 * Resource Cleanup Pattern
 *
 * Cleans up timers, observers, and other resources.
 */
import { once } from 'core/once';

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxResourceCleanup = {
    attach(context, settings) {
      once('hx-resource-card', 'hx-card[data-auto-refresh]', context).forEach((card) => {
        const refreshInterval = parseInt(card.getAttribute('data-auto-refresh'), 10) || 30000;

        // Set up auto-refresh timer
        const timerId = setInterval(() => {
          this._refreshCard(card);
        }, refreshInterval);

        // Store timer ID for cleanup
        card._refreshTimer = timerId;

        // Set up intersection observer for visibility tracking
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              card.setAttribute('data-visible', 'true');
            } else {
              card.removeAttribute('data-visible');
            }
          });
        });

        observer.observe(card);
        card._visibilityObserver = observer;

        // Set up mutation observer for content changes
        const mutationObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              console.log('Card content changed');
            }
          });
        });

        mutationObserver.observe(card, {
          childList: true,
          subtree: true,
        });

        card._mutationObserver = mutationObserver;
      });
    },

    _refreshCard(card) {
      const url = card.getAttribute('data-refresh-url');
      if (!url) return;

      // Only refresh if visible
      if (!card.hasAttribute('data-visible')) {
        console.log('Card not visible, skipping refresh');
        return;
      }

      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          console.log('Card refreshed:', data);
          // Update card content
        })
        .catch((error) => {
          console.error('Refresh failed:', error);
        });
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        const cards = context.querySelectorAll('hx-card[data-auto-refresh]');

        cards.forEach((card) => {
          // Clear timer
          if (card._refreshTimer) {
            clearInterval(card._refreshTimer);
            delete card._refreshTimer;
          }

          // Disconnect intersection observer
          if (card._visibilityObserver) {
            card._visibilityObserver.disconnect();
            delete card._visibilityObserver;
          }

          // Disconnect mutation observer
          if (card._mutationObserver) {
            card._mutationObserver.disconnect();
            delete card._mutationObserver;
          }

          // Clean up data attributes
          card.removeAttribute('data-visible');
        });

        once.remove('hx-resource-card', 'hx-card[data-auto-refresh]', context);
      }
    },
  };
})(Drupal, once);
```

## Event Delegation Pattern

Event delegation attaches listeners to parent elements rather than individual children, improving performance for large lists.

### Pattern: Delegated Card List Events

```javascript
/**
 * Event Delegation Pattern
 *
 * Handles events for many cards efficiently using delegation.
 */
import { once } from 'core/once';

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxEventDelegation = {
    attach(context, settings) {
      once('hx-card-list', '[data-card-list]', context).forEach((container) => {
        // Single listener on container handles all card clicks
        const clickHandler = this._createDelegatedClickHandler(settings);
        container.addEventListener('hx-card-click', clickHandler);

        // Store handler for cleanup
        container._delegatedClickHandler = clickHandler;

        // Handle dynamically added cards
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1 && node.matches('hx-card')) {
                // New card added, no listener needed (handled by delegation)
                console.log('New card detected:', node);
                this._onCardAdded(node, settings);
              }
            });
          });
        });

        observer.observe(container, {
          childList: true,
        });

        container._mutationObserver = observer;
      });
    },

    _createDelegatedClickHandler(settings) {
      return (event) => {
        // Event bubbles up from hx-card child to container
        const card = event.target;

        if (!card || card.tagName !== 'HX-CARD') {
          return;
        }

        // Handle click based on card type
        const cardType = card.getAttribute('data-type');
        const cardId = card.getAttribute('data-id');

        switch (cardType) {
          case 'patient':
            this._handlePatientCardClick(cardId, event.detail, settings);
            break;
          case 'appointment':
            this._handleAppointmentCardClick(cardId, event.detail, settings);
            break;
          case 'medication':
            this._handleMedicationCardClick(cardId, event.detail, settings);
            break;
          default:
            console.log('Generic card click:', cardId, event.detail);
        }

        // Track click if analytics enabled
        if (settings.hxCards?.analytics) {
          this._trackCardClick(cardType, cardId);
        }
      };
    },

    _handlePatientCardClick(patientId, detail, settings) {
      console.log('Patient card clicked:', patientId);

      if (settings.hxCards?.loadPatientDetails) {
        // Load patient details via AJAX
        const ajax = Drupal.ajax({
          url: `/ajax/patients/${patientId}`,
          wrapper: 'patient-details-modal',
        });
        ajax.execute();
      }
    },

    _handleAppointmentCardClick(appointmentId, detail, settings) {
      console.log('Appointment card clicked:', appointmentId);
      // Handle appointment click
    },

    _handleMedicationCardClick(medicationId, detail, settings) {
      console.log('Medication card clicked:', medicationId);
      // Handle medication click
    },

    _trackCardClick(cardType, cardId) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'card_click', {
          card_type: cardType,
          card_id: cardId,
        });
      }
    },

    _onCardAdded(card, settings) {
      // Perform any necessary setup for new cards
      card.setAttribute('data-dynamically-added', 'true');

      // Trigger custom event
      card.dispatchEvent(
        new CustomEvent('hx-card-added-to-list', {
          bubbles: true,
          composed: true,
        }),
      );
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        const containers = context.querySelectorAll('[data-card-list]');

        containers.forEach((container) => {
          // Remove delegated listener
          if (container._delegatedClickHandler) {
            container.removeEventListener('hx-card-click', container._delegatedClickHandler);
            delete container._delegatedClickHandler;
          }

          // Disconnect mutation observer
          if (container._mutationObserver) {
            container._mutationObserver.disconnect();
            delete container._mutationObserver;
          }
        });

        once.remove('hx-card-list', '[data-card-list]', context);
      }
    },
  };
})(Drupal, once);
```

### Pattern: Form Event Delegation

```javascript
/**
 * Form Event Delegation Pattern
 *
 * Handles form events for multiple forms using delegation.
 */
import { once } from 'core/once';

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxFormDelegation = {
    attach(context, settings) {
      once('hx-form-container', '[data-forms-container]', context).forEach((container) => {
        // Delegate form submission
        const submitHandler = (event) => {
          if (event.target.tagName === 'HX-FORM') {
            this._handleFormSubmit(event);
          }
        };

        // Delegate input events
        const inputHandler = (event) => {
          const input = event.target;
          if (input.tagName === 'HX-TEXT-INPUT' || input.tagName === 'HX-TEXTAREA') {
            this._handleFormInput(input, event);
          }
        };

        // Attach delegated listeners
        container.addEventListener('hx-submit', submitHandler);
        container.addEventListener('hx-input', inputHandler, true); // Use capture for input

        // Store handlers
        container._formSubmitHandler = submitHandler;
        container._formInputHandler = inputHandler;
      });
    },

    _handleFormSubmit(event) {
      const form = event.target;
      const formId = form.getAttribute('id') || 'unknown';

      console.log('Form submitted:', formId, event.detail);

      // Perform validation
      if (!this._validateForm(form)) {
        event.preventDefault();
        this._showFormErrors(form);
      }
    },

    _handleFormInput(input, event) {
      // Real-time validation as user types
      const debounceDelay = 300;

      clearTimeout(input._inputDebounce);
      input._inputDebounce = setTimeout(() => {
        this._validateInput(input);
      }, debounceDelay);
    },

    _validateForm(form) {
      // Validate all form inputs
      const inputs = form.querySelectorAll('hx-text-input, hx-textarea, hx-select');
      let isValid = true;

      inputs.forEach((input) => {
        if (!this._validateInput(input)) {
          isValid = false;
        }
      });

      return isValid;
    },

    _validateInput(input) {
      if (!input.checkValidity || typeof input.checkValidity !== 'function') {
        return true;
      }

      const isValid = input.checkValidity();

      if (!isValid) {
        input.setAttribute('error', '');
        input.setAttribute('error-message', input.validationMessage || 'Invalid');
      } else {
        input.removeAttribute('error');
        input.removeAttribute('error-message');
      }

      return isValid;
    },

    _showFormErrors(form) {
      const firstError = form.querySelector('[error]');
      if (firstError) {
        firstError.focus();
      }
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        const containers = context.querySelectorAll('[data-forms-container]');

        containers.forEach((container) => {
          if (container._formSubmitHandler) {
            container.removeEventListener('hx-submit', container._formSubmitHandler);
            delete container._formSubmitHandler;
          }

          if (container._formInputHandler) {
            container.removeEventListener('hx-input', container._formInputHandler, true);
            delete container._formInputHandler;
          }
        });

        once.remove('hx-form-container', '[data-forms-container]', context);
      }
    },
  };
})(Drupal, once);
```

## Multiple Behavior Triggers

Components may need different initialization logic for different trigger scenarios (page load vs AJAX vs BigPipe).

### Pattern: Context-Aware Initialization

```javascript
/**
 * Context-Aware Initialization Pattern
 *
 * Adjusts behavior based on how the content was added to the DOM.
 */
import { once } from 'core/once';

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxContextAware = {
    _isInitialPageLoad: true,

    attach(context, settings) {
      // Detect context type
      const isDocument = context === document;
      const isAjaxContext =
        context.nodeType === 1 && context.hasAttribute('data-drupal-ajax-container');
      const isBigPipeContext =
        context.nodeType === 1 &&
        context.hasAttribute('data-big-pipe-replacement-for-placeholder-with-id');

      // Log for debugging
      if (settings.hxComponents?.debug) {
        console.log('Behavior attach triggered:', {
          isDocument,
          isAjaxContext,
          isBigPipeContext,
          isInitialPageLoad: this._isInitialPageLoad,
        });
      }

      once('hx-context-card', 'hx-card[data-context-aware]', context).forEach((card) => {
        // Initialize based on context
        if (this._isInitialPageLoad && isDocument) {
          this._initializeForPageLoad(card, settings);
        } else if (isAjaxContext) {
          this._initializeForAjax(card, settings);
        } else if (isBigPipeContext) {
          this._initializeForBigPipe(card, settings);
        } else {
          this._initializeDefault(card, settings);
        }
      });

      // Mark initial page load as complete
      if (isDocument) {
        this._isInitialPageLoad = false;
      }
    },

    _initializeForPageLoad(card, settings) {
      console.log('Initializing for page load:', card);

      // Full initialization for initial page load
      card.setAttribute('data-context', 'page-load');

      // Attach all event listeners
      this._attachAllListeners(card, settings);

      // Load initial data
      const dataUrl = card.getAttribute('data-load-url');
      if (dataUrl) {
        this._loadCardData(card, dataUrl);
      }

      // Initialize animations
      this._initializeAnimations(card);
    },

    _initializeForAjax(card, settings) {
      console.log('Initializing for AJAX:', card);

      // Lightweight initialization for AJAX-loaded content
      card.setAttribute('data-context', 'ajax');

      // Attach only essential listeners
      this._attachEssentialListeners(card, settings);

      // Skip heavy operations (animations, data loading)
      // Assume AJAX provides complete content
    },

    _initializeForBigPipe(card, settings) {
      console.log('Initializing for BigPipe:', card);

      // Progressive initialization for BigPipe-streamed content
      card.setAttribute('data-context', 'bigpipe');

      // Attach essential listeners immediately
      this._attachEssentialListeners(card, settings);

      // Defer non-critical initialization
      requestIdleCallback(() => {
        this._attachAllListeners(card, settings);
        this._initializeAnimations(card);
      });
    },

    _initializeDefault(card, settings) {
      console.log('Initializing with default strategy:', card);

      card.setAttribute('data-context', 'default');
      this._attachAllListeners(card, settings);
    },

    _attachAllListeners(card, settings) {
      card.addEventListener('hx-card-click', (event) => {
        console.log('Card clicked:', event.detail);
      });

      card.addEventListener('mouseenter', () => {
        card.setAttribute('data-hover', 'true');
      });

      card.addEventListener('mouseleave', () => {
        card.removeAttribute('data-hover');
      });
    },

    _attachEssentialListeners(card, settings) {
      // Only click handler for minimal interactivity
      card.addEventListener('hx-card-click', (event) => {
        console.log('Card clicked (essential):', event.detail);
      });
    },

    _loadCardData(card, url) {
      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          console.log('Card data loaded:', data);
        })
        .catch((error) => {
          console.error('Failed to load card data:', error);
        });
    },

    _initializeAnimations(card) {
      // Add entrance animation class
      card.classList.add('animate-fade-in');
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-context-card', 'hx-card[data-context-aware]', context);
      }
    },
  };
})(Drupal, once);
```

## AJAX Compatibility

HELIX components work seamlessly with Drupal's AJAX system because they're built on web standards.

### Pattern: AJAX Command Integration

```javascript
/**
 * AJAX Command Integration Pattern
 *
 * Integrates HELIX components with custom Drupal AJAX commands.
 */
(function (Drupal, once) {
  'use strict';

  /**
   * Custom AJAX command: Update HELIX card content.
   */
  Drupal.AjaxCommands.prototype.hxUpdateCard = function (ajax, response, status) {
    const cardId = response.cardId;
    const card = document.getElementById(cardId);

    if (!card || card.tagName !== 'HX-CARD') {
      console.error('Card not found:', cardId);
      return;
    }

    // Update card properties
    if (response.variant) {
      card.setAttribute('variant', response.variant);
    }

    if (response.elevation) {
      card.setAttribute('elevation', response.elevation);
    }

    // Update slots
    if (response.heading) {
      let heading = card.querySelector('[slot="heading"]');
      if (!heading) {
        heading = document.createElement('span');
        heading.setAttribute('slot', 'heading');
        card.appendChild(heading);
      }
      heading.textContent = response.heading;
    }

    if (response.body) {
      // Remove existing body content (not in slots)
      const bodyNodes = Array.from(card.childNodes).filter((node) => {
        return node.nodeType === 1 && !node.hasAttribute('slot');
      });
      bodyNodes.forEach((node) => node.remove());

      // Add new body content
      const bodyDiv = document.createElement('div');
      bodyDiv.innerHTML = response.body;
      card.appendChild(bodyDiv);
    }

    // Trigger update event
    card.dispatchEvent(
      new CustomEvent('hx-card-updated', {
        bubbles: true,
        composed: true,
        detail: { response },
      }),
    );

    // Re-attach behaviors to updated content
    Drupal.attachBehaviors(card);
  };

  /**
   * Custom AJAX command: Show HELIX alert.
   */
  Drupal.AjaxCommands.prototype.hxShowAlert = function (ajax, response, status) {
    const container = document.querySelector(response.selector || '#alerts-container');

    if (!container) {
      console.error('Alert container not found');
      return;
    }

    // Create alert element
    const alert = document.createElement('hx-alert');
    alert.setAttribute('variant', response.variant || 'info');
    alert.setAttribute('dismissible', response.dismissible !== false ? '' : null);

    if (response.icon) {
      alert.setAttribute('icon', response.icon);
    }

    // Set alert content
    const content = document.createElement('div');
    content.innerHTML = response.message || '';
    alert.appendChild(content);

    // Add to container
    container.appendChild(alert);

    // Auto-dismiss after delay
    if (response.autoDismiss && response.duration) {
      setTimeout(() => {
        alert.setAttribute('dismissed', '');
        setTimeout(() => alert.remove(), 300); // Wait for animation
      }, response.duration);
    }

    // Attach behaviors
    Drupal.attachBehaviors(alert);
  };

  /**
   * Behavior: Handle AJAX updates to HELIX components.
   */
  Drupal.behaviors.hxAjaxIntegration = {
    attach(context, settings) {
      // Listen for AJAX success events
      once('hx-ajax-listener', 'body', context).forEach((body) => {
        document.addEventListener('ajaxSuccess', (event) => {
          const ajax = event.detail.ajax;
          const response = event.detail.response;

          // Log AJAX success for debugging
          if (settings.hxComponents?.debug) {
            console.log('AJAX success:', response);
          }

          // Handle specific response types
          if (response.hxComponents) {
            this._handleComponentUpdates(response.hxComponents);
          }
        });

        document.addEventListener('ajaxError', (event) => {
          const ajax = event.detail.ajax;
          const error = event.detail.error;

          console.error('AJAX error:', error);

          // Show error alert using HELIX component
          this._showErrorAlert(error);
        });
      });

      // Initialize AJAX-loaded HELIX components
      once('hx-ajax-card', 'hx-card[data-ajax-loaded]', context).forEach((card) => {
        // Mark as initialized
        card.setAttribute('data-ajax-initialized', '');

        // Attach event listeners
        card.addEventListener('hx-card-click', (event) => {
          console.log('AJAX-loaded card clicked:', event.detail);
        });

        // Trigger loaded event
        card.dispatchEvent(
          new CustomEvent('hx-card-ajax-ready', {
            bubbles: true,
            composed: true,
          }),
        );
      });
    },

    _handleComponentUpdates(updates) {
      updates.forEach((update) => {
        const element = document.getElementById(update.id);
        if (element) {
          // Apply updates
          Object.keys(update.attributes || {}).forEach((attr) => {
            element.setAttribute(attr, update.attributes[attr]);
          });

          Object.keys(update.properties || {}).forEach((prop) => {
            element[prop] = update.properties[prop];
          });
        }
      });
    },

    _showErrorAlert(error) {
      const container = document.querySelector('#alerts-container');
      if (!container) return;

      const alert = document.createElement('hx-alert');
      alert.setAttribute('variant', 'danger');
      alert.setAttribute('dismissible', '');
      alert.textContent = error.message || 'An error occurred';

      container.appendChild(alert);
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        once.remove('hx-ajax-listener', 'body', context);
        once.remove('hx-ajax-card', 'hx-card[data-ajax-loaded]', context);
      }
    },
  };
})(Drupal, once);
```

## Idempotency with once()

The `once()` API guarantees idempotent behavior execution - each element is processed exactly once.

### Pattern: Complex once() Scenarios

```javascript
/**
 * Complex once() Scenarios Pattern
 *
 * Demonstrates advanced once() usage patterns.
 */
import { once } from 'core/once';

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxComplexOnce = {
    attach(context, settings) {
      // Scenario 1: Multiple operations on same elements
      once('hx-card-click', 'hx-card', context).forEach((card) => {
        card.addEventListener('hx-card-click', this._handleCardClick.bind(this));
      });

      once('hx-card-hover', 'hx-card', context).forEach((card) => {
        card.addEventListener('mouseenter', this._handleMouseEnter.bind(this));
        card.addEventListener('mouseleave', this._handleMouseLeave.bind(this));
      });

      once('hx-card-analytics', 'hx-card', context).forEach((card) => {
        this._trackCardView(card);
      });

      // Scenario 2: Conditional re-processing
      // Use once.filter() to check without marking
      const unprocessedForms = once.filter('hx-form-init', context.querySelectorAll('hx-form'));

      if (unprocessedForms.length > 0) {
        console.log(`Found ${unprocessedForms.length} unprocessed forms`);

        // Process and mark
        once('hx-form-init', 'hx-form', context).forEach((form) => {
          this._initializeForm(form, settings);
        });
      }

      // Scenario 3: Grouped initialization
      // Use custom data attributes with once()
      once('hx-group-a', '[data-component-group="a"]', context).forEach((el) => {
        this._initializeGroupA(el);
      });

      once('hx-group-b', '[data-component-group="b"]', context).forEach((el) => {
        this._initializeGroupB(el);
      });

      // Scenario 4: Reset and re-initialize
      const resetButtons = context.querySelectorAll('[data-reset-components]');
      resetButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const target = document.querySelector(button.getAttribute('data-reset-components'));
          if (target) {
            // Remove once markers
            once.remove('hx-card-click', 'hx-card', target);
            once.remove('hx-card-hover', 'hx-card', target);
            once.remove('hx-card-analytics', 'hx-card', target);

            // Re-attach behaviors
            Drupal.attachBehaviors(target);
          }
        });
      });
    },

    _handleCardClick(event) {
      console.log('Card click handler:', event.detail);
    },

    _handleMouseEnter(event) {
      event.target.setAttribute('data-hover', 'true');
    },

    _handleMouseLeave(event) {
      event.target.removeAttribute('data-hover');
    },

    _trackCardView(card) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'card_view', {
          card_id: card.id,
          card_variant: card.getAttribute('variant'),
        });
      }
    },

    _initializeForm(form, settings) {
      console.log('Initializing form:', form.id);
      form.addEventListener('hx-submit', (event) => {
        console.log('Form submitted:', event.detail);
      });
    },

    _initializeGroupA(element) {
      console.log('Initializing group A:', element);
      element.classList.add('group-a-initialized');
    },

    _initializeGroupB(element) {
      console.log('Initializing group B:', element);
      element.classList.add('group-b-initialized');
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        // Remove all once markers
        once.remove('hx-card-click', 'hx-card', context);
        once.remove('hx-card-hover', 'hx-card', context);
        once.remove('hx-card-analytics', 'hx-card', context);
        once.remove('hx-form-init', 'hx-form', context);
        once.remove('hx-group-a', '[data-component-group="a"]', context);
        once.remove('hx-group-b', '[data-component-group="b"]', context);
      }
    },
  };
})(Drupal, once);
```

## Best Practices Summary

### 1. Always Use once()

```javascript
// DO: Use once() to prevent duplicate initialization
once('hx-init', 'hx-button', context).forEach((button) => {
  button.addEventListener('click', handler);
});

// DON'T: Query without once() - causes duplicate listeners
context.querySelectorAll('hx-button').forEach((button) => {
  button.addEventListener('click', handler); // WRONG!
});
```

### 2. Query Within Context

```javascript
// DO: Query within context for performance and correctness
Drupal.behaviors.example = {
  attach(context, settings) {
    context.querySelectorAll('hx-card').forEach((card) => {
      // Only processes new cards
    });
  },
};

// DON'T: Query document - re-processes all elements
Drupal.behaviors.example = {
  attach(context, settings) {
    document.querySelectorAll('hx-card').forEach((card) => {
      // Re-processes ALL cards every time! WRONG!
    });
  },
};
```

### 3. Implement Proper Cleanup

```javascript
// DO: Clean up in detach()
Drupal.behaviors.example = {
  attach(context, settings) {
    once('example', 'hx-button', context).forEach((button) => {
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
      once.remove('example', 'hx-button', context);
    }
  },
};
```

### 4. Use Progressive Enhancement

```javascript
// DO: Provide fallback content
// HTML includes native button for no-JS scenario
// Behavior enhances with HELIX component when available
customElements.whenDefined('hx-button').then(() => {
  // Show enhanced version
  hxButton.removeAttribute('hidden');
  fallbackButton.setAttribute('hidden', '');
});
```

### 5. Handle AJAX Gracefully

```javascript
// DO: Initialize components regardless of how they enter the DOM
Drupal.behaviors.example = {
  attach(context, settings) {
    // Works for page load, AJAX, BigPipe
    once('example', 'hx-card', context).forEach((card) => {
      // Initialize card
    });
  },
};
```

### 6. Use Event Delegation for Large Lists

```javascript
// DO: Use delegation for many child elements
container.addEventListener('hx-card-click', (event) => {
  const card = event.target;
  // Handle click from any card
});

// DON'T: Attach individual listeners to each card
cards.forEach((card) => {
  card.addEventListener('hx-card-click', handler); // Wasteful for large lists
});
```

### 7. Defensive Programming

```javascript
// DO: Check for dependencies and capabilities
Drupal.behaviors.example = {
  attach(context, settings) {
    if (typeof once === 'undefined') {
      console.error('once is not defined');
      return;
    }

    const config = settings.hxComponents?.config;
    if (!config) {
      console.warn('Configuration not found');
      return;
    }

    // Safe to proceed
  },
};
```

### 8. Document Your Behaviors

```javascript
// DO: Add comprehensive documentation
/**
 * Patient Card Interaction Behavior
 *
 * Handles patient card clicks, loads details via AJAX, tracks analytics.
 *
 * Dependencies:
 * - core/once
 * - core/drupal.ajax
 *
 * Settings:
 * - drupalSettings.hxPatients.ajaxEnabled (boolean)
 * - drupalSettings.hxPatients.analytics.enabled (boolean)
 */
Drupal.behaviors.hxPatientCards = {
  // Implementation
};
```

## Troubleshooting

### Problem: Behavior Runs Multiple Times

**Cause:** Not using `once()`

**Solution:**

```javascript
// Wrap selector with once()
once('unique-id', 'hx-card', context).forEach((card) => {
  // Initialize card
});
```

### Problem: Memory Leaks

**Cause:** Event listeners not removed in `detach()`

**Solution:**

```javascript
detach(context, settings, trigger) {
  if (trigger === 'unload') {
    // Remove all event listeners
    // Disconnect observers
    // Clear timers
    // Remove once markers
  }
}
```

### Problem: Elements Not Found

**Cause:** Querying `document` instead of `context`

**Solution:**

```javascript
// Change from:
document.querySelectorAll('hx-card');

// To:
context.querySelectorAll('hx-card');
```

### Problem: AJAX Content Not Initialized

**Cause:** Library not properly attached to AJAX response

**Solution:**

```php
// In AJAX controller
$response = new AjaxResponse();
$response->addCommand(new HtmlCommand('#content', $html));

// Ensure library is attached
$response->setAttachments([
  'library' => ['mytheme/hx-components'],
]);
```

## Further Reading

### Official Drupal Documentation

- [JavaScript API Overview](https://www.drupal.org/docs/drupal-apis/javascript-api/javascript-api-overview)
- [AJAX API](https://www.drupal.org/docs/develop/drupal-apis/ajax-api)
- [Managing JavaScript in Drupal](https://www.drupal.org/docs/drupal-apis/javascript-api/managing-javascript)

### HELIX Integration Guides

- [Drupal Behaviors Fundamentals](/drupal-integration/behaviors/fundamentals/)
- [Twig Integration](/drupal-integration/twig/)
- [AJAX Integration](/drupal-integration/ajax/)

### Related Resources

- [Progressive Enhancement (MDN)](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)
- [Event Delegation (JavaScript.info)](https://javascript.info/event-delegation)
- [Intersection Observer API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

---

## Summary

Mastering Drupal Behavior patterns ensures robust, maintainable, and performant integration of HELIX components:

1. **Progressive Enhancement** - Content accessible without JavaScript, enhanced when available
2. **Initialization Strategies** - Lazy, conditional, and staged initialization for optimal performance
3. **Cleanup Patterns** - Proper resource management prevents memory leaks
4. **Event Delegation** - Efficient event handling for large component lists
5. **Multiple Triggers** - Context-aware initialization for page load, AJAX, and BigPipe
6. **AJAX Compatibility** - Seamless integration with Drupal's AJAX system
7. **Idempotency** - `once()` API guarantees single-execution per element

These patterns form the foundation of enterprise-grade Drupal + HELIX integration, ensuring your healthcare application remains fast, reliable, and maintainable at scale.

---

**Sources:**

- [JavaScript API Overview | Drupal.org](https://www.drupal.org/docs/drupal-apis/javascript-api/javascript-api-overview)
- [Understanding JavaScript Behaviors in Drupal | Lullabot](https://www.lullabot.com/articles/understanding-javascript-behaviors-in-drupal)
- [Taming JavaScript in Drupal | Specbee](https://www.specbee.com/blogs/taming-javascript-in-drupal)
- [Progressive Enhancement | MDN](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)
- [Event Delegation | JavaScript.info](https://javascript.info/event-delegation)
