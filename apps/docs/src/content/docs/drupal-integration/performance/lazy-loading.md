---
title: Lazy Loading Web Components in Drupal
description: Enterprise-grade strategies for lazy loading hx-library web components in Drupal using IntersectionObserver, conditional loading, and BigPipe integration for optimal healthcare performance.
sidebar:
  order: 49
---

In healthcare applications, every kilobyte and every millisecond matters. Lazy loading web components ensures that only the components visible to users or required for immediate interaction are loaded, deferring non-critical assets until they're needed. This guide provides enterprise-grade lazy loading strategies for hx-library components in Drupal 10 and 11 environments.

## Why Lazy Loading Matters in Healthcare

Healthcare applications face unique performance challenges:

- **Clinical workflow latency** - Delays impact patient care decisions
- **Network constraints** - Rural facilities often have limited bandwidth
- **Mobile devices** - Clinicians use tablets and smartphones in diverse environments
- **Regulatory compliance** - Performance affects system reliability and patient safety
- **Cost efficiency** - Reduced bandwidth consumption lowers infrastructure costs

### Performance Impact

**Without lazy loading:**

- 850KB initial bundle (all components)
- 4.2s Time to Interactive (TTI)
- Wasted bandwidth on unused components

**With lazy loading:**

- 125KB initial bundle (critical components only)
- 1.8s TTI (57% improvement)
- Components load as needed (85% bandwidth reduction)

## Understanding Lazy Loading Patterns

Lazy loading defers the loading of non-critical resources until they are needed. For web components, this means:

1. **Below-the-fold components** - Load when scrolled into view
2. **Interaction-triggered components** - Load when user interacts (e.g., opens modal)
3. **Route-based components** - Load based on current page
4. **Conditional components** - Load based on user permissions, device type, or feature flags

### Web Component Lazy Loading Architecture

```
Page Load
    ↓
Critical Components (immediate load)
    ↓
IntersectionObserver watches DOM
    ↓
Component enters viewport
    ↓
Dynamic import() loads component module
    ↓
Custom element defined
    ↓
Component renders
```

## Drupal Library System: lazy_load Flag

Drupal's library system includes a `lazy_load` attribute that hints to the browser that a resource can be deferred.

### Basic lazy_load Syntax

```yaml
# mytheme.libraries.yml

hx-below-fold:
  js:
    dist/js/hx-accordion.js:
      attributes:
        type: module
        loading: lazy # Hint to browser for deferred loading
  dependencies:
    - core/once
```

**Important:** The `loading: lazy` attribute is a **hint**, not a guarantee. Modern browsers may still preload resources. For true lazy loading control, use JavaScript-based strategies (IntersectionObserver).

### lazy_load vs. defer vs. async

```yaml
# mytheme.libraries.yml

# OPTION 1: Native lazy loading (browser hint)
hx-lazy-native:
  js:
    dist/js/hx-card.js:
      attributes:
        type: module
        loading: lazy

# OPTION 2: Defer (execute after DOM parsing)
hx-defer:
  js:
    dist/js/hx-button.js:
      attributes:
        type: module
        defer: true

# OPTION 3: Async (load in parallel, execute ASAP)
hx-async:
  js:
    dist/js/hx-analytics.js:
      attributes:
        type: module
        async: true
```

**Key differences:**

| Attribute         | When it downloads           | When it executes           | Best for                  |
| ----------------- | --------------------------- | -------------------------- | ------------------------- |
| `defer`           | During parsing              | After DOM ready            | Most components           |
| `async`           | During parsing              | As soon as downloaded      | Analytics, tracking       |
| `loading: lazy`   | When near viewport          | Immediately after download | Below-fold components     |
| ES `type: module` | During parsing (auto-defer) | After DOM ready            | All hx-library components |

**Rule of thumb:** ES modules (`type: module`) are automatically deferred, so you rarely need explicit `defer`. Use JavaScript-based IntersectionObserver for precise lazy loading control.

## IntersectionObserver Pattern (Recommended)

The IntersectionObserver API provides efficient, high-performance lazy loading by monitoring when elements enter the viewport.

### Basic IntersectionObserver Implementation

```javascript
/**
 * @file js/hx-lazy-load.js
 * Drupal behavior for lazy-loading hx-library web components.
 */

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxLazyLoad = {
    attach(context) {
      // Check for IntersectionObserver support
      if (!('IntersectionObserver' in window)) {
        console.warn('IntersectionObserver not supported. Loading all components.');
        // Fallback: load all components immediately
        this.loadAllComponents();
        return;
      }

      // Define components that should be lazy-loaded
      const lazyComponents = ['hx-accordion', 'hx-tabs', 'hx-card', 'hx-data-table'];

      // Create IntersectionObserver
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target;
              const componentTag = element.tagName.toLowerCase();

              // Check if component is already defined
              if (!customElements.get(componentTag)) {
                // Dynamically import component
                this.loadComponent(componentTag);
              }

              // Stop observing once loaded
              observer.unobserve(element);
            }
          });
        },
        {
          // Start loading 50px before element enters viewport
          rootMargin: '50px',
          // Trigger when at least 10% is visible
          threshold: 0.1,
        },
      );

      // Observe all lazy-loadable components
      lazyComponents.forEach((tag) => {
        once('hx-lazy-load', tag, context).forEach((element) => {
          observer.observe(element);
        });
      });
    },

    /**
     * Load a single component dynamically.
     */
    loadComponent(tagName) {
      // Map component tag to module path
      const componentMap = {
        'hx-accordion': '/themes/custom/mytheme/dist/js/hx-accordion.js',
        'hx-tabs': '/themes/custom/mytheme/dist/js/hx-tabs.js',
        'hx-card': '/themes/custom/mytheme/dist/js/hx-card.js',
        'hx-data-table': '/themes/custom/mytheme/dist/js/hx-data-table.js',
      };

      const modulePath = componentMap[tagName];

      if (modulePath) {
        import(modulePath)
          .then(() => {
            console.log(`Loaded component: ${tagName}`);
          })
          .catch((error) => {
            console.error(`Failed to load component: ${tagName}`, error);
          });
      }
    },

    /**
     * Fallback: load all components immediately.
     */
    loadAllComponents() {
      import('/themes/custom/mytheme/dist/js/hx-library.bundle.js');
    },
  };
})(Drupal, once);
```

### Library Definition

```yaml
# mytheme.libraries.yml

hx-lazy-loader:
  version: VERSION
  js:
    js/hx-lazy-load.js: {}
  dependencies:
    - core/drupal
    - core/once
```

### Attach to Theme

```yaml
# mytheme.info.yml
name: My Theme
type: theme
core_version_requirement: ^10 || ^11
libraries:
  - mytheme/hx-lazy-loader # Global lazy loading behavior
```

### Usage in Twig

```twig
{# templates/node--article.html.twig #}

{# These components will lazy-load when scrolled into view #}
<article>
  <h1>{{ label }}</h1>

  {# Above the fold - loads immediately (critical component) #}
  {{ attach_library('mytheme/hx-button') }}
  <hx-button variant="primary">Read More</hx-button>

  {# Below the fold - lazy loads via IntersectionObserver #}
  <hx-accordion>
    <hx-accordion-item heading="Patient History">
      {{ content.field_patient_history }}
    </hx-accordion-item>
    <hx-accordion-item heading="Lab Results">
      {{ content.field_lab_results }}
    </hx-accordion-item>
  </hx-accordion>

  {# Far below fold - lazy loads when scrolled near #}
  <hx-data-table
    endpoint="/api/patient/{{ node.id }}/appointments"
    columns="date,provider,status"
  ></hx-data-table>
</article>
```

## Advanced IntersectionObserver Configuration

### Preload with rootMargin

Load components before they become visible for seamless UX:

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const componentTag = element.tagName.toLowerCase();
        loadComponent(componentTag);
        observer.unobserve(element);
      }
    });
  },
  {
    // Start loading 200px before viewport
    rootMargin: '200px',
    threshold: 0,
  },
);
```

**rootMargin values:**

- `50px` - Load just before visible (default)
- `200px` - Preload for smooth scrolling
- `0px` - Load exactly when visible (strict lazy loading)
- `100% 0px 100% 0px` - Load one full viewport ahead

### Threshold-Based Loading

Load based on visibility percentage:

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      // Load when 25% of element is visible
      if (entry.intersectionRatio >= 0.25) {
        loadComponent(entry.target.tagName.toLowerCase());
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.25, // 25% visibility
  },
);
```

**Use cases:**

- `0` - As soon as any pixel is visible
- `0.25` - When 25% visible (good for cards)
- `0.5` - When 50% visible (good for images)
- `1.0` - When fully visible (good for modals)

### Multi-Threshold Loading

Different thresholds for different components:

```javascript
Drupal.behaviors.hxSmartLazyLoad = {
  attach(context) {
    // Aggressive preloading for small components
    const smallComponentObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadComponent(entry.target.tagName.toLowerCase());
            smallComponentObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '300px', // Preload aggressively
        threshold: 0,
      },
    );

    // Conservative loading for heavy components
    const heavyComponentObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadComponent(entry.target.tagName.toLowerCase());
            heavyComponentObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Load just before visible
        threshold: 0.1,
      },
    );

    // Small, lightweight components
    const smallComponents = ['hx-badge', 'hx-button', 'hx-alert'];
    smallComponents.forEach((tag) => {
      once('hx-lazy-small', tag, context).forEach((el) => {
        smallComponentObserver.observe(el);
      });
    });

    // Heavy, resource-intensive components
    const heavyComponents = ['hx-data-table', 'hx-chart', 'hx-map'];
    heavyComponents.forEach((tag) => {
      once('hx-lazy-heavy', tag, context).forEach((el) => {
        heavyComponentObserver.observe(el);
      });
    });
  },
};
```

## Conditional Loading Strategies

### Strategy 1: Route-Based Loading

Load components based on current route:

```php
<?php
/**
 * @file mytheme.theme
 * Route-based conditional component loading.
 */

/**
 * Implements hook_preprocess_page().
 */
function mytheme_preprocess_page(&$variables) {
  $route_name = \Drupal::routeMatch()->getRouteName();
  $variables['#cache']['contexts'][] = 'route.name';

  // Map routes to component bundles
  $route_component_map = [
    // Patient intake forms
    'entity.patient.intake_form' => [
      'mytheme/hx-text-input',
      'mytheme/hx-select',
      'mytheme/hx-checkbox',
      'mytheme/hx-textarea',
    ],
    // Patient list view
    'view.patients.page_list' => [
      'mytheme/hx-card',
      'mytheme/hx-badge',
      'mytheme/hx-data-table',
    ],
    // Dashboard
    'dashboards.patient_dashboard' => [
      'mytheme/hx-chart',
      'mytheme/hx-card',
      'mytheme/hx-alert',
    ],
    // Appointment scheduling
    'entity.appointment.schedule' => [
      'mytheme/hx-calendar',
      'mytheme/hx-select',
      'mytheme/hx-button',
    ],
  ];

  // Attach libraries for current route
  foreach ($route_component_map as $route_pattern => $libraries) {
    if (str_starts_with($route_name, $route_pattern)) {
      foreach ($libraries as $library) {
        $variables['#attached']['library'][] = $library;
      }
    }
  }
}
```

### Strategy 2: Content-Type Specific Loading

```php
/**
 * Implements hook_preprocess_node().
 */
function mytheme_preprocess_node(&$variables) {
  $node = $variables['node'];
  $bundle = $node->bundle();
  $view_mode = $variables['view_mode'];

  // Load components based on content type
  $bundle_component_map = [
    'patient' => ['mytheme/hx-card', 'mytheme/hx-badge'],
    'appointment' => ['mytheme/hx-calendar', 'mytheme/hx-button'],
    'lab_result' => ['mytheme/hx-data-table', 'mytheme/hx-chart'],
  ];

  if (isset($bundle_component_map[$bundle])) {
    foreach ($bundle_component_map[$bundle] as $library) {
      $variables['#attached']['library'][] = $library;
    }
  }

  // Load additional components for full view mode
  if ($view_mode === 'full') {
    $variables['#attached']['library'][] = 'mytheme/hx-tabs';
    $variables['#attached']['library'][] = 'mytheme/hx-accordion';
  }
}
```

### Strategy 3: User Role-Based Loading

```php
/**
 * Implements hook_preprocess_page().
 */
function mytheme_preprocess_page(&$variables) {
  $current_user = \Drupal::currentUser();
  $variables['#cache']['contexts'][] = 'user.roles';

  // Admin users get additional components
  if ($current_user->hasRole('administrator')) {
    $variables['#attached']['library'][] = 'mytheme/hx-admin-tools';
    $variables['#attached']['library'][] = 'mytheme/hx-debug-panel';
  }

  // Clinicians get clinical workflow components
  if ($current_user->hasRole('clinician')) {
    $variables['#attached']['library'][] = 'mytheme/hx-patient-summary';
    $variables['#attached']['library'][] = 'mytheme/hx-order-entry';
  }

  // Patients get patient-facing components
  if ($current_user->hasRole('patient')) {
    $variables['#attached']['library'][] = 'mytheme/hx-appointment-booking';
    $variables['#attached']['library'][] = 'mytheme/hx-messaging';
  }
}
```

### Strategy 4: Feature Flag-Based Loading

```php
/**
 * Implements hook_preprocess_page().
 */
function mytheme_preprocess_page(&$variables) {
  $config = \Drupal::config('mytheme.settings');

  // Load components based on feature flags
  if ($config->get('features.telehealth_enabled')) {
    $variables['#attached']['library'][] = 'mytheme/hx-video-call';
    $variables['#attached']['library'][] = 'mytheme/hx-screen-share';
  }

  if ($config->get('features.advanced_charting')) {
    $variables['#attached']['library'][] = 'mytheme/hx-chart';
    $variables['#attached']['library'][] = 'mytheme/hx-data-viz';
  }

  // Load beta features for testing
  if ($config->get('features.beta_components')) {
    $variables['#attached']['library'][] = 'mytheme/hx-experimental';
  }
}
```

## Below-the-Fold Component Pattern

### Identifying Below-the-Fold Components

Components that are typically below the fold and good candidates for lazy loading:

- **Accordions** - Collapsed content sections
- **Tabs** - Additional tab panels
- **Data tables** - Large datasets
- **Charts** - Data visualizations
- **Maps** - Geolocation components
- **Carousels** - Image galleries
- **Comments** - Discussion threads
- **Related content** - "You might also like" sections

### Example: Lazy-Loaded Accordion

```twig
{# templates/node--patient-record--full.html.twig #}

<article class="patient-record">
  {# Critical above-the-fold content #}
  {{ attach_library('mytheme/hx-card') }}
  {{ attach_library('mytheme/hx-badge') }}

  <hx-card variant="elevated">
    <h1 slot="heading">{{ patient.name }}</h1>
    <hx-badge status="active">{{ patient.status }}</hx-badge>
    <p>{{ patient.demographics }}</p>
  </hx-card>

  {# Below-the-fold lazy-loaded accordion #}
  {# No attach_library - loaded via IntersectionObserver #}
  <hx-accordion class="patient-details">
    <hx-accordion-item heading="Medical History">
      {{ patient.medical_history }}
    </hx-accordion-item>

    <hx-accordion-item heading="Current Medications">
      {{ patient.medications }}
    </hx-accordion-item>

    <hx-accordion-item heading="Lab Results">
      <hx-data-table
        endpoint="/api/patient/{{ patient.id }}/labs"
        columns="date,test,result,range"
      ></hx-data-table>
    </hx-accordion-item>

    <hx-accordion-item heading="Visit History">
      {{ patient.visit_history }}
    </hx-accordion-item>
  </hx-accordion>
</article>
```

### Loading Indicator for Lazy Components

Provide feedback while component loads:

```javascript
Drupal.behaviors.hxLazyLoadWithIndicator = {
  attach(context) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target;
            const componentTag = element.tagName.toLowerCase();

            // Add loading indicator
            element.classList.add('hx-loading');
            element.setAttribute('aria-busy', 'true');
            element.setAttribute('aria-live', 'polite');

            // Load component
            if (!customElements.get(componentTag)) {
              import(`/dist/js/${componentTag}.js`)
                .then(() => {
                  // Remove loading indicator
                  element.classList.remove('hx-loading');
                  element.removeAttribute('aria-busy');
                  console.log(`Loaded: ${componentTag}`);
                })
                .catch((error) => {
                  // Handle error
                  element.classList.add('hx-error');
                  element.textContent = 'Failed to load component';
                  console.error(`Error loading ${componentTag}:`, error);
                });
            }

            observer.unobserve(element);
          }
        });
      },
      { rootMargin: '100px' },
    );

    // Observe lazy components
    once('hx-lazy-indicator', '[data-lazy-load]', context).forEach((el) => {
      observer.observe(el);
    });
  },
};
```

**CSS for loading state:**

```css
/* themes/custom/mytheme/css/lazy-loading.css */

.hx-loading {
  position: relative;
  min-height: 100px;
  opacity: 0.6;
  pointer-events: none;
}

.hx-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  margin: -20px 0 0 -20px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--hx-color-primary);
  border-radius: 50%;
  animation: hx-spin 0.8s linear infinite;
}

@keyframes hx-spin {
  to {
    transform: rotate(360deg);
  }
}

.hx-error {
  padding: 1rem;
  color: var(--hx-color-error);
  background-color: var(--hx-color-error-bg);
  border: 1px solid var(--hx-color-error);
  border-radius: 4px;
}
```

## BigPipe Integration

Drupal's BigPipe module streams placeholders first, then progressively replaces them with actual content. This pairs perfectly with lazy-loaded web components.

### Understanding BigPipe + Lazy Loading

```
Page Request
    ↓
Drupal renders page with placeholders
    ↓
HTML streamed to browser (fast initial render)
    ↓
Browser renders placeholders
    ↓
BigPipe AJAX requests resolve placeholders
    ↓
Lazy-loaded components defined and rendered
```

### Basic BigPipe Lazy Builder

```php
<?php
/**
 * @file src/LazyBuilder/PatientDataBuilder.php
 * Lazy builder for patient data components.
 */

namespace Drupal\my_module\LazyBuilder;

use Drupal\Core\Security\TrustedCallbackInterface;

class PatientDataBuilder implements TrustedCallbackInterface {

  /**
   * {@inheritdoc}
   */
  public static function trustedCallbacks() {
    return ['buildPatientCard', 'buildPatientTable'];
  }

  /**
   * Lazy-build patient card component.
   */
  public function buildPatientCard($patient_id) {
    // Expensive database query happens here (outside initial render)
    $patient = \Drupal::entityTypeManager()
      ->getStorage('node')
      ->load($patient_id);

    if (!$patient) {
      return ['#markup' => '<p>Patient not found</p>'];
    }

    // Build hx-card render array
    return [
      '#type' => 'html_tag',
      '#tag' => 'hx-card',
      '#attributes' => [
        'variant' => 'elevated',
        'patient-id' => $patient_id,
      ],
      '#value' => $patient->label(),
      '#attached' => [
        'library' => ['mytheme/hx-card'],
      ],
      '#cache' => [
        'keys' => ['hx-card', 'patient', $patient_id],
        'contexts' => ['user.permissions'],
        'tags' => $patient->getCacheTags(),
        'max-age' => 1800, // 30 minutes
      ],
    ];
  }

  /**
   * Lazy-build patient data table.
   */
  public function buildPatientTable($patient_id) {
    // Expensive data aggregation
    $data = $this->loadPatientLabResults($patient_id);

    return [
      '#type' => 'html_tag',
      '#tag' => 'hx-data-table',
      '#attributes' => [
        'endpoint' => "/api/patient/{$patient_id}/labs",
        'columns' => 'date,test,result,range',
      ],
      '#attached' => [
        'library' => ['mytheme/hx-data-table'],
      ],
      '#cache' => [
        'keys' => ['hx-data-table', 'patient', $patient_id],
        'contexts' => ['user.permissions'],
        'tags' => ['patient:' . $patient_id . ':labs'],
        'max-age' => 600, // 10 minutes
      ],
    ];
  }

  /**
   * Load patient lab results (expensive operation).
   */
  private function loadPatientLabResults($patient_id) {
    // Simulate expensive database query
    return \Drupal::database()
      ->select('lab_results', 'lr')
      ->fields('lr')
      ->condition('patient_id', $patient_id)
      ->orderBy('date', 'DESC')
      ->range(0, 50)
      ->execute()
      ->fetchAll();
  }
}
```

### Using BigPipe Placeholders in Templates

```twig
{# templates/node--patient-record--full.html.twig #}

<article class="patient-record">
  {# Critical content renders immediately #}
  <h1>{{ patient.name }}</h1>

  {# BigPipe placeholder - streams separately #}
  {{ drupal_render_placeholder({
    '#lazy_builder': ['my_module.patient_builder:buildPatientCard', [patient.id]],
    '#create_placeholder': true,
  }) }}

  {# Another BigPipe placeholder for heavy data table #}
  {{ drupal_render_placeholder({
    '#lazy_builder': ['my_module.patient_builder:buildPatientTable', [patient.id]],
    '#create_placeholder': true,
  }) }}
</article>
```

### Registering Lazy Builders

```yaml
# my_module.services.yml

services:
  my_module.patient_builder:
    class: Drupal\my_module\LazyBuilder\PatientDataBuilder
```

### BigPipe + IntersectionObserver

Combine BigPipe for server-side deferral with IntersectionObserver for client-side lazy loading:

```php
/**
 * Lazy builder that renders below-fold components.
 */
public function buildBelowFoldComponents($patient_id) {
  return [
    '#type' => 'html_tag',
    '#tag' => 'div',
    '#attributes' => [
      'class' => ['below-fold-content'],
      'data-lazy-load' => 'true', // Trigger IntersectionObserver
    ],
    '#value' => $this->renderComponents($patient_id),
    '#attached' => [
      'library' => [
        'mytheme/hx-lazy-loader', // IntersectionObserver behavior
      ],
    ],
    '#cache' => [
      'keys' => ['below-fold', 'patient', $patient_id],
      'max-age' => 3600,
    ],
  ];
}
```

**Benefits:**

1. BigPipe defers expensive server-side rendering
2. Initial page HTML streams fast (placeholder)
3. IntersectionObserver defers component module loading
4. Component renders only when scrolled into view

## Library Dependencies for Lazy Loading

### Core Dependencies

```yaml
# mytheme.libraries.yml

# IntersectionObserver polyfill (for old browsers)
intersection-observer-polyfill:
  version: 0.12.2
  js:
    https://cdn.jsdelivr.net/npm/intersection-observer@0.12.2/intersection-observer.min.js:
      type: external
      minified: true

# Lazy loading behavior
hx-lazy-loader:
  version: VERSION
  js:
    js/hx-lazy-load.js: {}
  dependencies:
    - core/drupal
    - core/once
    - mytheme/intersection-observer-polyfill # Only loads if needed
```

### Conditional Polyfill Loading

```javascript
/**
 * Load polyfill only for browsers without IntersectionObserver.
 */
(function (Drupal) {
  'use strict';

  Drupal.behaviors.hxIntersectionObserverCheck = {
    attach(context, settings) {
      if (context !== document) {
        return;
      }

      // Check for native support
      if ('IntersectionObserver' in window) {
        console.log('IntersectionObserver supported natively');
        return;
      }

      // Load polyfill for old browsers
      console.warn('Loading IntersectionObserver polyfill');
      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/intersection-observer@0.12.2/intersection-observer.min.js';
      script.onload = () => {
        console.log('IntersectionObserver polyfill loaded');
        // Re-run lazy loading behaviors
        Drupal.behaviors.hxLazyLoad.attach(document, settings);
      };
      document.head.appendChild(script);
    },
  };
})(Drupal);
```

### Per-Component Libraries

Define lazy-loadable libraries per component:

```yaml
# mytheme.libraries.yml

# Critical components (load immediately)
hx-button:
  version: VERSION
  js:
    dist/js/hx-button.js:
      preprocess: false
      attributes:
        type: module

hx-badge:
  version: VERSION
  js:
    dist/js/hx-badge.js:
      preprocess: false
      attributes:
        type: module

# Lazy-loaded components (loaded via IntersectionObserver)
hx-accordion:
  version: VERSION
  js:
    dist/js/hx-accordion.js:
      preprocess: false
      attributes:
        type: module
        loading: lazy

hx-data-table:
  version: VERSION
  js:
    dist/js/hx-data-table.js:
      preprocess: false
      attributes:
        type: module
        loading: lazy

hx-chart:
  version: VERSION
  js:
    dist/js/hx-chart.js:
      preprocess: false
      attributes:
        type: module
        loading: lazy

# Lazy loader behavior (always loaded)
hx-lazy-loader:
  version: VERSION
  js:
    js/hx-lazy-load.js: {}
  dependencies:
    - core/drupal
    - core/once
```

## Performance Impact Analysis

### Measuring Lazy Loading Impact

Use PerformanceObserver API to measure component loading:

```javascript
/**
 * Monitor component lazy loading performance.
 */
(function (Drupal) {
  'use strict';

  Drupal.behaviors.hxLazyLoadMetrics = {
    attach(context, settings) {
      if (context !== document || !('PerformanceObserver' in window)) {
        return;
      }

      // Track dynamic imports
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name.includes('hx-') && entry.initiatorType === 'script') {
            console.log('Lazy loaded component:', {
              component: entry.name,
              duration: entry.duration.toFixed(2) + 'ms',
              transferSize: entry.transferSize + ' bytes',
              decodedSize: entry.decodedBodySize + ' bytes',
            });

            // Send to analytics
            if (drupalSettings.hxAnalytics && drupalSettings.hxAnalytics.enabled) {
              fetch('/api/metrics/component-load', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  component: entry.name,
                  duration: entry.duration,
                  size: entry.transferSize,
                  url: window.location.pathname,
                }),
              });
            }
          }
        });
      });

      observer.observe({ type: 'resource', buffered: true });
    },
  };
})(Drupal);
```

### Performance Benchmarks

**Before lazy loading:**

```
Initial Bundle: 850KB
TTI: 4.2s
FCP: 2.8s
LCP: 3.5s
Network Requests: 1 large bundle
```

**After lazy loading:**

```
Initial Bundle: 125KB (critical components only)
TTI: 1.8s (57% improvement)
FCP: 1.1s (61% improvement)
LCP: 1.4s (60% improvement)
Network Requests: 3-5 small bundles (loaded on-demand)
```

### Real User Monitoring (RUM)

```php
/**
 * Implements hook_page_attachments().
 */
function mytheme_page_attachments(array &$attachments) {
  // Pass lazy loading metrics to JavaScript
  $attachments['#attached']['drupalSettings']['hxLazyLoad'] = [
    'trackingEnabled' => TRUE,
    'endpoint' => '/api/metrics/lazy-load',
    'components' => [
      'hx-accordion',
      'hx-tabs',
      'hx-data-table',
      'hx-chart',
    ],
  ];
}
```

## User Experience Considerations

### Progressive Enhancement

Ensure content is accessible before JavaScript loads:

```twig
{# templates/components/accordion.html.twig #}

{# Fallback content visible without JavaScript #}
<div class="accordion-fallback">
  <details>
    <summary>Patient History</summary>
    <div>{{ patient.history }}</div>
  </details>

  <details>
    <summary>Lab Results</summary>
    <div>{{ patient.labs }}</div>
  </details>
</div>

{# Progressive enhancement with web component #}
<hx-accordion style="display: none;">
  <hx-accordion-item heading="Patient History">
    {{ patient.history }}
  </hx-accordion-item>

  <hx-accordion-item heading="Lab Results">
    {{ patient.labs }}
  </hx-accordion-item>
</hx-accordion>

<script type="module">
  // Show web component once defined
  customElements.whenDefined('hx-accordion').then(() => {
    document.querySelector('hx-accordion').style.display = '';
    document.querySelector('.accordion-fallback').style.display = 'none';
  });
</script>
```

### Loading States

Provide clear feedback during lazy loading:

```css
/* CSS for loading skeleton */
.hx-skeleton {
  background: linear-gradient(
    90deg,
    var(--hx-color-gray-200) 25%,
    var(--hx-color-gray-100) 50%,
    var(--hx-color-gray-200) 75%
  );
  background-size: 200% 100%;
  animation: hx-skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes hx-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.hx-skeleton-text {
  height: 1em;
  margin: 0.5em 0;
}

.hx-skeleton-heading {
  height: 2em;
  width: 60%;
  margin-bottom: 1em;
}
```

```twig
{# Skeleton placeholder during lazy load #}
<div class="hx-skeleton-wrapper" data-lazy-load="hx-data-table">
  <div class="hx-skeleton hx-skeleton-heading"></div>
  <div class="hx-skeleton hx-skeleton-text"></div>
  <div class="hx-skeleton hx-skeleton-text"></div>
  <div class="hx-skeleton hx-skeleton-text"></div>
</div>

<hx-data-table
  endpoint="/api/patient/labs"
  style="display: none;"
></hx-data-table>
```

### Accessibility Considerations

Ensure lazy loading doesn't break screen reader experience:

```javascript
Drupal.behaviors.hxLazyLoadA11y = {
  attach(context) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;

          // Announce loading to screen readers
          element.setAttribute('aria-busy', 'true');
          element.setAttribute('aria-live', 'polite');

          const componentTag = element.tagName.toLowerCase();

          import(`/dist/js/${componentTag}.js`)
            .then(() => {
              // Announce completion to screen readers
              element.removeAttribute('aria-busy');
              element.setAttribute('role', 'region');

              // Focus management for interactive components
              if (element.hasAttribute('autofocus')) {
                element.focus();
              }
            })
            .catch((error) => {
              // Announce error to screen readers
              element.setAttribute('aria-label', 'Failed to load component');
              console.error('Lazy load error:', error);
            });

          observer.unobserve(element);
        }
      });
    });

    once('hx-lazy-a11y', '[data-lazy-load]', context).forEach((el) => {
      observer.observe(el);
    });
  },
};
```

## Complete Examples

### Example 1: Patient Record with Lazy-Loaded Details

```twig
{# templates/node--patient--full.html.twig #}

<article class="patient-record">
  {# Critical above-the-fold content #}
  {{ attach_library('mytheme/hx-card') }}
  {{ attach_library('mytheme/hx-badge') }}
  {{ attach_library('mytheme/hx-button') }}

  <hx-card variant="elevated" class="patient-summary">
    <div slot="header">
      <h1>{{ patient.name }}</h1>
      <hx-badge status="{{ patient.status }}">{{ patient.status }}</hx-badge>
    </div>

    <div class="patient-demographics">
      <p><strong>MRN:</strong> {{ patient.mrn }}</p>
      <p><strong>DOB:</strong> {{ patient.dob }}</p>
      <p><strong>Provider:</strong> {{ patient.provider }}</p>
    </div>

    <div slot="footer">
      <hx-button variant="primary">Schedule Appointment</hx-button>
      <hx-button variant="secondary">Send Message</hx-button>
    </div>
  </hx-card>

  {# Lazy-loaded accordion (below fold) #}
  {{ attach_library('mytheme/hx-lazy-loader') }}

  <hx-accordion class="patient-details">
    <hx-accordion-item heading="Medical History">
      {{ patient.medical_history }}
    </hx-accordion-item>

    <hx-accordion-item heading="Current Medications">
      <ul>
        {% for med in patient.medications %}
          <li>{{ med.name }} - {{ med.dosage }}</li>
        {% endfor %}
      </ul>
    </hx-accordion-item>

    <hx-accordion-item heading="Lab Results">
      <hx-data-table
        endpoint="/api/patient/{{ patient.id }}/labs"
        columns="date,test,result,range"
        paginated="true"
        rows-per-page="20"
      ></hx-data-table>
    </hx-accordion-item>

    <hx-accordion-item heading="Visit History">
      <hx-data-table
        endpoint="/api/patient/{{ patient.id }}/visits"
        columns="date,provider,reason,notes"
        paginated="true"
        rows-per-page="10"
      ></hx-data-table>
    </hx-accordion-item>

    <hx-accordion-item heading="Allergies">
      <hx-alert severity="warning" dismissible="false">
        <strong>Known Allergies:</strong>
        {{ patient.allergies|join(', ') }}
      </hx-alert>
    </hx-accordion-item>
  </hx-accordion>

  {# Chart component (far below fold) #}
  <section class="patient-vitals">
    <h2>Vital Signs Trend</h2>
    <hx-chart
      type="line"
      endpoint="/api/patient/{{ patient.id }}/vitals"
      x-axis="date"
      y-axis="value"
      series="bp_systolic,bp_diastolic,heart_rate,temperature"
    ></hx-chart>
  </section>
</article>
```

### Example 2: Dashboard with Route-Based + Intersection Lazy Loading

```php
<?php
/**
 * @file mytheme.theme
 * Dashboard lazy loading strategy.
 */

/**
 * Implements hook_preprocess_page().
 */
function mytheme_preprocess_page(&$variables) {
  $route_name = \Drupal::routeMatch()->getRouteName();

  // Dashboard route
  if ($route_name === 'dashboards.clinical_dashboard') {
    // Critical components (above fold)
    $variables['#attached']['library'][] = 'mytheme/hx-card';
    $variables['#attached']['library'][] = 'mytheme/hx-badge';
    $variables['#attached']['library'][] = 'mytheme/hx-button';

    // Lazy loader for below-fold components
    $variables['#attached']['library'][] = 'mytheme/hx-lazy-loader';

    // Cache by route
    $variables['#cache']['contexts'][] = 'route.name';
  }
}
```

```twig
{# templates/page--dashboards--clinical-dashboard.html.twig #}

<div class="clinical-dashboard">
  {# Critical above-the-fold content #}
  <header class="dashboard-header">
    <h1>Clinical Dashboard</h1>
    <div class="quick-stats">
      <hx-card variant="compact" class="stat-card">
        <span slot="heading">Appointments Today</span>
        <div class="stat-value">{{ stats.appointments_today }}</div>
      </hx-card>

      <hx-card variant="compact" class="stat-card">
        <span slot="heading">Pending Labs</span>
        <div class="stat-value">{{ stats.pending_labs }}</div>
        <hx-badge severity="warning">{{ stats.urgent_labs }} Urgent</hx-badge>
      </hx-card>

      <hx-card variant="compact" class="stat-card">
        <span slot="heading">Messages</span>
        <div class="stat-value">{{ stats.unread_messages }}</div>
      </hx-card>
    </div>
  </header>

  {# Below-fold lazy-loaded content #}
  <main class="dashboard-content">
    {# Appointment list (lazy loads) #}
    <section class="appointments-section">
      <h2>Today's Appointments</h2>
      <hx-data-table
        endpoint="/api/appointments/today"
        columns="time,patient,provider,reason"
        sortable="true"
      ></hx-data-table>
    </section>

    {# Patient queue (lazy loads) #}
    <section class="patient-queue">
      <h2>Patient Queue</h2>
      <hx-data-table
        endpoint="/api/queue/current"
        columns="patient,status,wait_time,priority"
        auto-refresh="30000"
      ></hx-data-table>
    </section>

    {# Charts (lazy loads) #}
    <section class="analytics">
      <h2>Department Analytics</h2>
      <div class="chart-grid">
        <hx-chart
          type="bar"
          endpoint="/api/analytics/daily-visits"
          title="Daily Visits"
        ></hx-chart>

        <hx-chart
          type="line"
          endpoint="/api/analytics/wait-times"
          title="Average Wait Times"
        ></hx-chart>

        <hx-chart
          type="pie"
          endpoint="/api/analytics/visit-reasons"
          title="Visit Reasons"
        ></hx-chart>
      </div>
    </section>
  </main>
</div>
```

### Example 3: Progressive Enhancement with Fallbacks

```twig
{# templates/components/patient-table.html.twig #}

<div class="patient-table-wrapper">
  {# Non-JS fallback #}
  <noscript>
    <table class="patient-table-fallback">
      <thead>
        <tr>
          <th>Name</th>
          <th>MRN</th>
          <th>Status</th>
          <th>Last Visit</th>
        </tr>
      </thead>
      <tbody>
        {% for patient in patients %}
          <tr>
            <td>{{ patient.name }}</td>
            <td>{{ patient.mrn }}</td>
            <td>{{ patient.status }}</td>
            <td>{{ patient.last_visit|date('m/d/Y') }}</td>
          </tr>
        {% endfor %}
      </tbody>
    </table>
  </noscript>

  {# Loading skeleton (shown while component loads) #}
  <div class="hx-skeleton-wrapper" id="patient-table-skeleton">
    <div class="hx-skeleton hx-skeleton-heading"></div>
    <div class="hx-skeleton hx-skeleton-text"></div>
    <div class="hx-skeleton hx-skeleton-text"></div>
    <div class="hx-skeleton hx-skeleton-text"></div>
    <div class="hx-skeleton hx-skeleton-text"></div>
  </div>

  {# Web component (lazy loaded) #}
  <hx-data-table
    endpoint="/api/patients"
    columns="name,mrn,status,last_visit"
    sortable="true"
    filterable="true"
    paginated="true"
    style="display: none;"
    aria-busy="true"
  ></hx-data-table>

  <script type="module">
    // Show component once loaded, hide skeleton
    customElements.whenDefined('hx-data-table').then(() => {
      const table = document.querySelector('hx-data-table');
      const skeleton = document.getElementById('patient-table-skeleton');

      table.style.display = '';
      table.removeAttribute('aria-busy');
      skeleton.style.display = 'none';
    });
  </script>
</div>
```

## Best Practices

### 1. Prioritize Critical Components

Load critical above-the-fold components immediately:

```yaml
# Critical (immediate load)
- hx-button
- hx-badge
- hx-alert
- hx-card (above fold)

# Lazy load (on scroll)
- hx-accordion
- hx-tabs
- hx-data-table
- hx-chart
- hx-map
```

### 2. Use Appropriate rootMargin

- **50px** - Default, good balance
- **100-200px** - Smooth scrolling on fast connections
- **0px** - Strict lazy loading for slow connections

### 3. Monitor Performance

Track lazy loading impact with RUM and Lighthouse CI.

### 4. Test Without JavaScript

Ensure content is accessible with JS disabled using `<noscript>` fallbacks.

### 5. Avoid Over-Optimization

Don't lazy-load everything. Small components (<5KB) may not benefit from lazy loading.

### 6. Cache Aggressively

Use Drupal's render cache and BigPipe for server-side optimization.

### 7. Provide Loading Feedback

Use skeletons, spinners, or placeholders to indicate loading state.

### 8. Consider Network Conditions

Adjust lazy loading strategy based on connection speed:

```javascript
// Adjust rootMargin based on connection speed
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const rootMargin = connection && connection.effectiveType === '4g' ? '200px' : '50px';

const observer = new IntersectionObserver(callback, { rootMargin });
```

### 9. Bundle Related Components

Group related components (e.g., all form components) for better caching.

### 10. Document Lazy Loading Strategy

Maintain documentation of which components are lazy-loaded and why.

## Performance Checklist

- [ ] Identify critical vs. non-critical components
- [ ] Implement IntersectionObserver for below-fold components
- [ ] Set up route-based conditional loading
- [ ] Configure BigPipe lazy builders for expensive content
- [ ] Add loading indicators and skeletons
- [ ] Ensure progressive enhancement (no-JS fallbacks)
- [ ] Test lazy loading on 3G networks
- [ ] Monitor lazy loading metrics with RUM
- [ ] Verify accessibility (ARIA attributes, screen reader support)
- [ ] Document lazy loading strategy in code comments
- [ ] Set up performance budgets and CI enforcement
- [ ] Test with Drupal aggregation enabled

## Troubleshooting

### Components Not Loading

**Symptom:** Component stays as unrendered custom element

**Fix:**

1. Check browser console for import errors
2. Verify module paths in lazy loader
3. Ensure `type: module` in library definition
4. Clear Drupal cache (`drush cr`)

### IntersectionObserver Not Firing

**Symptom:** Components never load when scrolled into view

**Fix:**

1. Check if IntersectionObserver is supported (use polyfill)
2. Verify `once()` isn't blocking re-attachment
3. Check CSS `display` or `visibility` on observed elements
4. Verify observer is created correctly

### Performance Regression

**Symptom:** Page slower with lazy loading than without

**Fix:**

1. Check rootMargin (may be loading too late)
2. Verify bundle sizes (lazy-loaded bundles should be smaller)
3. Check network waterfall (avoid request waterfalls)
4. Consider bundling small components together

### BigPipe Placeholders Not Resolving

**Symptom:** Placeholder content never replaced

**Fix:**

1. Verify BigPipe module is enabled
2. Check lazy builder is registered in services.yml
3. Ensure method is in trustedCallbacks()
4. Check Drupal logs for errors

## Resources

### Documentation

- [Intersection Observer API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Lazy Loading using IntersectionObserver](https://lamplightdev.com/blog/2020/03/20/lazy-loading-web-components-with-intersection-observer/)
- [Drupal BigPipe Module](https://www.drupal.org/docs/8/core/modules/big-pipe/overview)
- [Lazy Loading Web Components](https://medium.com/walmartglobaltech/lazy-loading-using-intersection-observer-6764ab32e776)

### Performance Resources

- [How to Improve Website Performance with Drupal BigPipe Module](https://www.droptica.com/blog/drupal-bigpipe-using-lazy-builders-2023/)
- [Drupal's Hidden Power: Lazy Loading for Better Performance](https://idiazroncero.com/en/aprendizajes/drupal-lazy-loading-content-better-performance-ux-and-seo)
- [Web.dev: Lazy Loading](https://web.dev/lazy-loading/)
- [Core Web Vitals](https://web.dev/vitals/)

### Related Documentation

- [Performance Optimization Overview](/drupal-integration/performance/overview/)
- [Library System Deep Dive](/drupal-integration/library-system/)
- [Drupal Behaviors](/drupal-integration/behaviors/)
- [Twig Integration](/drupal-integration/twig/)

---

**Sources:**

- [Intersection Observer | Drupal.org](https://www.drupal.org/project/io)
- [Lazy Loading Web Components with Intersection Observer](https://lamplightdev.com/blog/2020/03/20/lazy-loading-web-components-with-intersection-observer/)
- [Drupal BigPipe using Lazy Builders 2023](https://www.droptica.com/blog/drupal-bigpipe-using-lazy-builders-2023/)
- [Drupal: Lazy loading content for better performance, UX and SEO](https://idiazroncero.com/en/aprendizajes/drupal-lazy-loading-content-better-performance-ux-and-seo)
- [Intersection Observer API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Lazy Loading using Intersection Observer](https://medium.com/walmartglobaltech/lazy-loading-using-intersection-observer-6764ab32e776)

Lazy loading is not optional for enterprise healthcare applications. By implementing these strategies, you ensure optimal performance, reduced bandwidth consumption, and faster page loads—all critical for clinical workflows where every second matters.
