---
title: Lazy Loading HELiX Components
description: Lazy loading strategies for HELiX web components in Drupal — Intersection Observer, behavior-triggered imports, BigPipe integration, route-based loading, and modulepreload hints.
sidebar:
  order: 2
---

Lazy loading defers component JavaScript until it is actually needed. For pages where some components are below the fold or only appear after user interaction, this reduces initial payload and speeds up Time to Interactive.

---

## Intersection Observer: Viewport-Based Loading

The Intersection Observer API fires a callback when an element enters the viewport. This is the standard mechanism for below-the-fold lazy loading.

### Basic pattern using a Drupal Behavior

```javascript
// js/helix-lazy-load.js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixLazyLoad = {
    attach(context) {
      // These elements are present in the DOM but their component JS
      // has not been loaded yet. They will render as plain HTML until loaded.
      const targets = once('hx-lazy-load', '[data-hx-lazy]', context);

      if (!targets.length) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const el = entry.target;
            const tag = el.tagName.toLowerCase();

            // Only load if the custom element is not already registered.
            if (!customElements.get(tag)) {
              const componentUrl = el.dataset.hxLazy;
              import(componentUrl).catch((err) => {
                console.error('[HELiX] Failed to load component:', tag, err);
              });
            }

            observer.unobserve(el);
          });
        },
        {
          rootMargin: '100px 0px', // Start loading 100px before entering viewport
        }
      );

      targets.forEach((el) => observer.observe(el));
    },
  };
})(Drupal, once);
```

Register the behavior library:

```yaml
# mytheme.libraries.yml
helix-lazy-load:
  js:
    js/helix-lazy-load.js:
      preprocess: false
  dependencies:
    - core/drupal
    - core/once
```

Attach the library globally (it has minimal weight — no component JS included):

```yaml
# mytheme.info.yml
libraries:
  - mytheme/helix-lazy-load
```

### Twig template usage

Add `data-hx-lazy` with the component CDN URL to any element that should load lazily:

```twig
{# node--article--teaser.html.twig #}
<hx-card
  data-hx-lazy="https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/components/hx-card/index.js"
  variant="default"
>
  <span slot="heading">{{ node.label }}</span>
  {{ content.body }}
</hx-card>
```

The element renders as plain HTML on initial load. When it enters the viewport, the behavior imports the component module, and the browser upgrades the element automatically via the Custom Elements registry.

---

## Behavior-Triggered Imports

Some components should only load after a user interaction — opening a modal, switching tabs, or clicking "load more." This avoids loading interaction-heavy JavaScript until it is needed.

### Click-triggered load

```javascript
// js/helix-on-demand.js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixOnDemand = {
    attach(context) {
      once('hx-on-demand', '[data-hx-on-demand]', context).forEach((trigger) => {
        const componentUrl = trigger.dataset.hxOnDemand;
        const targetSelector = trigger.dataset.hxTarget;

        trigger.addEventListener('click', async () => {
          if (!componentUrl) return;

          // Disable trigger during load to prevent double-clicks.
          trigger.setAttribute('aria-busy', 'true');
          trigger.setAttribute('disabled', '');

          try {
            await import(componentUrl);
            if (targetSelector) {
              const target = document.querySelector(targetSelector);
              // Re-run behaviors on the newly upgraded region.
              if (target) {
                Drupal.attachBehaviors(target, drupalSettings);
              }
            }
          } catch (err) {
            console.error('[HELiX] On-demand load failed:', err);
          } finally {
            trigger.removeAttribute('aria-busy');
            trigger.removeAttribute('disabled');
          }
        }, { once: true });
      });
    },
  };
})(Drupal, once);
```

Template:

```twig
{# Load hx-data-table only when the user clicks "Show Data" #}
<button
  data-hx-on-demand="https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/components/hx-data-table/index.js"
  data-hx-target="#results-region"
>
  Show Data Table
</button>

<div id="results-region">
  <hx-data-table id="patient-data">
    {# Slots populated server-side — table is visible structure only until JS loads #}
  </hx-data-table>
</div>
```

---

## Drupal BigPipe Integration

BigPipe streams placeholder content immediately and replaces it with real content asynchronously. Components inside BigPipe placeholders require their library to be attached to the placeholder's render array.

### Placeholder with attached library

```php
// In a lazy builder service method.
public function buildPatientCard(string $patient_id): array {
  $patient = $this->patientStorage->load($patient_id);

  return [
    '#type' => 'html_tag',
    '#tag' => 'hx-card',
    '#attributes' => [
      'variant' => 'elevated',
    ],
    '#value' => $patient->label(),
    '#attached' => [
      // Library must be declared here so it loads with the streamed content.
      'library' => ['mytheme/helix-card'],
    ],
    '#cache' => [
      'keys' => ['patient-card', $patient_id],
      'contexts' => ['user.roles'],
      'tags' => $patient->getCacheTags(),
    ],
  ];
}
```

Register the lazy builder:

```php
// Block or controller invoking the placeholder.
$build['patient_card'] = [
  '#create_placeholder' => TRUE,
  '#lazy_builder' => [
    'my_module.patient_builder:buildPatientCard',
    [$patient_id],
  ],
];
```

BigPipe streams a placeholder `<span>` on first response, then pushes the real `<hx-card>` markup (with library attachment) as a second chunk. Drupal's behavior attachment fires again on the replaced DOM, upgrading the Custom Element.

### Behavior attachment after BigPipe replacement

BigPipe automatically calls `Drupal.attachBehaviors()` on replaced regions. No special handling is needed as long as your behaviors use `once()`:

```javascript
Drupal.behaviors.helixCard = {
  attach(context) {
    // once() prevents double-initialization if attach runs more than once.
    once('hx-card-init', 'hx-card', context).forEach((card) => {
      card.addEventListener('hx-card-click', (e) => {
        console.log('Card clicked:', e.detail);
      });
    });
  },
};
```

---

## Route-Based Loading

Load different component sets per route section. This is the highest-leverage optimization for complex Drupal sites.

```php
/**
 * Implements hook_preprocess_page().
 */
function mytheme_preprocess_page(array &$variables): void {
  $route_name = \Drupal::routeMatch()->getRouteName();

  // Include route context in cache so each route gets its own cached version.
  $variables['#cache']['contexts'][] = 'route.name';

  $map = [
    // Forms section: load text inputs, selects, checkboxes.
    'my_module.patient_intake' => ['mytheme/helix-forms'],
    // Listing pages: load cards, badges.
    'view.patients.page_list' => ['mytheme/helix-card', 'mytheme/helix-badge'],
    // Detail pages: load cards, avatars, tabs, accordion.
    'entity.node.canonical' => ['mytheme/helix-content'],
    // Dashboard: load charts, data tables.
    'my_module.dashboard' => ['mytheme/helix-dashboard'],
  ];

  foreach ($map as $route_prefix => $libraries) {
    if (str_starts_with($route_name, $route_prefix)) {
      foreach ($libraries as $library) {
        $variables['#attached']['library'][] = $library;
      }
    }
  }
}
```

---

## Preloading Critical Components

For components used immediately on page load (headers, primary navigation, hero content), use `modulepreload` to begin downloading before the browser parses the `<body>`:

```php
/**
 * Implements hook_page_attachments().
 */
function mytheme_page_attachments(array &$attachments): void {
  $route = \Drupal::routeMatch()->getRouteName();

  // Always preload the runtime — it's shared by every component.
  $attachments['#attached']['html_head_link'][][] = [
    'rel' => 'modulepreload',
    'href' => 'https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/lit-runtime.js',
    'crossorigin' => 'anonymous',
  ];

  // Preload the button component on every page (used in navigation).
  $attachments['#attached']['html_head_link'][][] = [
    'rel' => 'modulepreload',
    'href' => 'https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/components/hx-button/index.js',
    'crossorigin' => 'anonymous',
  ];

  // Preload card only on listing pages.
  if (str_starts_with($route, 'view.')) {
    $attachments['#attached']['html_head_link'][][] = [
      'rel' => 'modulepreload',
      'href' => 'https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/components/hx-card/index.js',
      'crossorigin' => 'anonymous',
    ];
  }
}
```

`modulepreload` differs from `preload` — the browser parses and compiles the module as well as downloading it, eliminating the parse cost from the critical path when the script tag is later encountered.

---

## Combining Strategies

A typical production approach combines these patterns:

| Component location | Strategy |
|---|---|
| Navigation, hero, above-fold content | `modulepreload` + immediate library attachment |
| Mid-page content cards | Per-component library attached via template |
| Below-fold heavy components | Intersection Observer lazy load |
| Modal, drawer, off-canvas content | Behavior-triggered import on first open |
| Dashboard widgets, data tables | BigPipe placeholder + attached library |

```yaml
# mytheme.info.yml — load only the lazy-load behavior globally
libraries:
  - mytheme/helix-lazy-load
  - mytheme/helix-tokens   # CSS custom properties — always load
```

All other component libraries are attached per-template or per-route.

---

## Avoiding Double Registration

When the same component file might be imported multiple times (lazy loading + Drupal library), the browser prevents duplicate registration automatically via the ES module cache. However, if you use `customElements.define()` manually elsewhere, you will get a `DOMException`:

```
Failed to execute 'define' on 'CustomElementRegistry': the name "hx-button" has already been used
```

To prevent this, HELiX components guard their registration:

```javascript
// Inside each component's entry point
if (!customElements.get('hx-button')) {
  customElements.define('hx-button', HxButton);
}
```

This guard is built into the distributed files. As long as you import HELiX files (not manually call `customElements.define`), double-registration will not occur.

---

## Lazy Loading with npm Builds

When using a local npm build rather than CDN, use Vite's dynamic import with chunking:

```javascript
// js/helix-lazy-load.js — npm/Vite version
(function (Drupal, once) {
  Drupal.behaviors.helixLazyLoad = {
    attach(context) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(async (entry) => {
          if (!entry.isIntersecting) return;
          const tag = entry.target.tagName.toLowerCase();

          if (!customElements.get(tag)) {
            switch (tag) {
              case 'hx-card':
                await import(/* webpackChunkName: "hx-card" */ '@helixui/library/components/hx-card');
                break;
              case 'hx-accordion':
                await import(/* webpackChunkName: "hx-accordion" */ '@helixui/library/components/hx-accordion');
                break;
              // Add cases as needed
            }
          }

          observer.unobserve(entry.target);
        });
      });

      once('hx-lazy', '[data-hx-lazy]', context).forEach((el) => observer.observe(el));
    },
  };
})(Drupal, once);
```

Vite splits each dynamic import into a separate chunk during build, producing the same per-component file granularity as the CDN approach.

---

## Related

- [Performance Overview](/drupal/performance/overview/) — Bundle sizes, HTTP/2, cache strategy
- [Behaviors](/drupal/behaviors/fundamentals/) — `once()` API and AJAX re-initialization
- [AJAX Integration](/drupal/ajax/) — Behaviors after DOM replacement
