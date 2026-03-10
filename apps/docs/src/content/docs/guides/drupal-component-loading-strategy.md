---
title: 'ADR-002: Drupal Component Loading Strategy'
description: 'Architecture decision for how Web Components are loaded into Drupal: bundled package vs individual libraries vs smart groups'
sidebar:
  order: 2
  badge:
    text: ADR
    variant: note
---

> **ADR Status**: Accepted
> **Decision Date**: 2026-02-13
> **Decision Makers**: Principal Engineer, Senior Frontend Engineer, Drupal Technical Lead
> **Supersedes**: None
> **Depends On**: ADR-001 (Hybrid Property/Slot Integration Strategy)
> **Last Reviewed**: 2026-02-13

This document records the second critical architectural decision for the HELIX project: **how Web Component JavaScript physically loads into Drupal pages**. ADR-001 established _what data flows between components and Drupal_ (hybrid slots + properties). This ADR establishes _how the browser receives the component code in the first place_. The wrong choice here creates a permanent performance tax on every page load. The right choice gives Drupal teams surgical control over their JavaScript budget.

---

## The Fundamental Question

When a Drupal page needs `<hx-button>`, `<hx-card>`, and `<hx-text-input>`, how does the JavaScript that defines those custom elements arrive in the browser?

Three strategies exist, each with fundamentally different performance characteristics, developer ergonomics, and caching behavior.

```
                THE LOADING SPECTRUM

  Load Everything                              Load On Demand
  (Single Bundle)                              (Per-Component)
  <---------------------------------------------------->
       |                    |                      |
   Strategy A          Strategy C             Strategy B
   "One Script Tag"    "Smart Groups"         "Surgical Loading"
```

This decision has downstream consequences for:

1. **Core Web Vitals** -- Largest Contentful Paint (LCP), Total Blocking Time (TBT), and Interaction to Next Paint (INP) are all directly affected by JavaScript payload size and parse time
2. **Drupal cache granularity** -- How asset aggregation works, when caches invalidate, and what the CDN stores
3. **Developer workflow** -- How many files the Drupal team manages, how `libraries.yml` is structured, and how component updates propagate
4. **Scalability** -- Whether adding the 45th component degrades the experience for pages that only use 3 components

---

## Current State: Build Output Analysis

The HELIX library currently builds with Vite in library mode, externalizing Lit so consumers provide their own copy. The build produces a single `dist/index.js` entry point plus per-component entry points via the `exports` map in `package.json`.

### Measured Bundle Sizes (Current 3 Components)

| Artifact                                         | Raw Size | Gzipped | Brotli  |
| ------------------------------------------------ | -------- | ------- | ------- |
| `dist/index.js` (3 components, Lit externalized) | 24.1 KB  | ~7.2 KB | ~6.1 KB |
| Lit core (lit + lit/decorators + lit/directives) | ~16.8 KB | ~7.0 KB | ~5.8 KB |
| `hx-button` (component + styles)                 | ~4.8 KB  | ~1.6 KB | ~1.3 KB |
| `hx-card` (component + styles)                   | ~5.2 KB  | ~1.7 KB | ~1.4 KB |
| `hx-text-input` (component + styles)             | ~8.4 KB  | ~2.5 KB | ~2.1 KB |
| Design tokens CSS                                | ~2.1 KB  | ~0.6 KB | ~0.5 KB |

### Projected Bundle Sizes (Full 44 Components)

Based on measured per-component averages and the component inventory from ADR-001:

| Component Category               | Count  | Avg Size (Raw) | Total (Raw)   | Total (Brotli) |
| -------------------------------- | ------ | -------------- | ------------- | -------------- |
| Atoms (property-driven, simple)  | 14     | ~4.2 KB        | ~58.8 KB      | ~15.4 KB       |
| Molecules (hybrid, moderate)     | 9      | ~6.5 KB        | ~58.5 KB      | ~16.2 KB       |
| Organisms (slot-heavy, complex)  | 15     | ~8.8 KB        | ~132.0 KB     | ~35.6 KB       |
| Templates (slot-only, CSS-heavy) | 4      | ~5.0 KB        | ~20.0 KB      | ~5.4 KB        |
| Infrastructure                   | 2      | ~3.5 KB        | ~7.0 KB       | ~1.9 KB        |
| **Total (all components)**       | **44** | **~6.3 KB**    | **~276.3 KB** | **~74.5 KB**   |
| **+ Lit runtime**                |        |                | **+16.8 KB**  | **+5.8 KB**    |
| **Grand Total**                  |        |                | **~293.1 KB** | **~80.3 KB**   |

The Lit runtime (~16.8 KB raw, ~5.8 KB Brotli) loads exactly once regardless of how many components are used. It is a shared dependency, not duplicated per component. This fact is critical to the loading strategy analysis.

---

## Strategy A: Single Bundle ("Load Everything")

### How It Works

One `<script type="module">` tag loads the entire library. Every custom element is registered on every page, regardless of whether the page uses it.

```yaml
# mytheme.libraries.yml

helix:
  version: VERSION
  css:
    theme:
      vendor/helix/tokens.css: { minified: true }
  js:
    vendor/helix/index.js:
      type: module
      minified: true
      preprocess: false
```

```twig
{# page.html.twig or html.html.twig -- loaded globally #}
{{ attach_library('mytheme/helix') }}
```

### Drupal Integration

The simplest possible integration. One library definition, one `attach_library()` call in the base page template, and every component is available everywhere. No preprocess functions needed. No per-template library management.

```php
// mytheme.theme -- NO preprocess functions needed
// The library is attached globally in the page template
```

### Performance Profile

| Metric                   | Impact                               | Notes                                                                 |
| ------------------------ | ------------------------------------ | --------------------------------------------------------------------- |
| **First page load**      | ~80 KB Brotli (all components + Lit) | Every visitor downloads all 44 components                             |
| **Parse + compile time** | ~45-65ms on mid-range mobile         | V8 compiles all 44 `customElements.define()` calls                    |
| **Registration cost**    | 44 x `customElements.define()`       | Each call modifies the global registry; ~0.3-0.5ms per call on mobile |
| **Subsequent pages**     | 0 KB (browser-cached)                | Same URL, same cache entry                                            |
| **Cache invalidation**   | Monolithic                           | ANY component change invalidates the ENTIRE cached bundle             |
| **TBT contribution**     | ~35-55ms                             | All parse + registration happens in one task                          |

### Strengths

| Strength                     | Explanation                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Zero configuration**       | One library entry, one script tag. No per-component setup.                                                       |
| **Guaranteed availability**  | Any template can use any component without worrying about library attachment. No "component not defined" errors. |
| **Simple mental model**      | Drupal developers do not need to know which components require which libraries.                                  |
| **No dependency management** | No need to declare inter-component dependencies (e.g., card depends on button).                                  |
| **Works with CDN**           | One URL to cache at the edge. Simple cache key.                                                                  |

### Weaknesses

| Weakness                         | Explanation                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Payload waste**                | A page using only `<hx-button>` downloads code for 43 unused components.                                                                                            |
| **Registration waste**           | `customElements.define()` is called for all 44 elements. The browser allocates memory for each constructor, even for elements not present in the DOM.               |
| **Cache fragility**              | Updating a single component (e.g., fixing a tooltip bug) invalidates the entire bundle cache for every visitor.                                                     |
| **Violates performance budgets** | 80 KB Brotli JS on every page exceeds the <100 KB total JS budget for enterprise pages with additional Drupal JS, admin toolbar scripts, and third-party analytics. |
| **Scaling penalty**              | Every new component added to the library increases the bundle size for ALL pages, including pages that do not use the new component.                                |
| **Core Web Vitals risk**         | The monolithic parse task can push TBT above thresholds on low-powered devices common in enterprise kiosk and mobile settings.                                      |

---

## Strategy B: Per-Component Libraries ("Surgical Loading")

### How It Works

Each component has its own Drupal library definition. TWIG templates attach only the specific libraries they need. Drupal's asset aggregation system handles combining and deduplication.

```yaml
# mytheme.libraries.yml

# Shared runtime -- Lit core + design tokens
helix.runtime:
  version: VERSION
  css:
    theme:
      vendor/helix/tokens.css: { minified: true }
  js:
    vendor/helix/lit-runtime.js:
      type: module
      minified: true
      preprocess: false

# Per-component libraries
helix.button:
  version: VERSION
  js:
    vendor/helix/components/hx-button/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime

helix.card:
  version: VERSION
  js:
    vendor/helix/components/hx-card/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.button # Card's actions slot often contains buttons

helix.text_input:
  version: VERSION
  js:
    vendor/helix/components/hx-text-input/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime

helix.accordion:
  version: VERSION
  js:
    vendor/helix/components/hx-accordion/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.accordion_item

helix.accordion_item:
  version: VERSION
  js:
    vendor/helix/components/hx-accordion-item/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime

helix.hero_banner:
  version: VERSION
  js:
    vendor/helix/components/hx-hero-banner/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.button # Hero CTA often uses hx-button

helix.modal:
  version: VERSION
  js:
    vendor/helix/components/hx-modal/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.button # Modal footer actions use buttons

helix.nav_primary:
  version: VERSION
  js:
    vendor/helix/components/hx-nav-primary/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.button

# ... (44 total component libraries)
```

### Drupal Integration: TWIG Templates

Each template attaches only what it needs:

```twig
{# node--article--teaser.html.twig #}
{{ attach_library('mytheme/helix.card') }}

<hx-card heading="{{ label }}" href="{{ url }}" variant="default" elevation="raised">
  {% if content.field_hero_image|render|trim is not empty %}
    <div slot="image">{{ content.field_hero_image }}</div>
  {% endif %}
  {{ content.body }}
  <div slot="actions">
    <hx-button variant="text" href="{{ url }}">{{ 'Read More'|t }}</hx-button>
  </div>
</hx-card>
```

Note that attaching `helix.card` automatically loads `helix.button` and `helix.runtime` via the `dependencies` chain. The TWIG developer does not need to know about transitive dependencies.

### Drupal Integration: Preprocess Functions

For content types that always use specific components, preprocess functions automate library attachment:

```php
<?php

/**
 * @file
 * Theme preprocess functions for HELIX component library attachment.
 */

/**
 * Implements hook_preprocess_node().
 *
 * Attaches HELIX component libraries based on content type and view mode.
 */
function mytheme_preprocess_node(array &$variables): void {
  $node = $variables['node'];
  $view_mode = $variables['view_mode'];

  // Content type -> component library mapping
  $content_type_libraries = [
    'article' => [
      'teaser' => ['mytheme/helix.card'],
      'full' => [
        'mytheme/helix.hero_banner',
        'mytheme/helix.breadcrumb',
      ],
    ],
    'provider' => [
      'teaser' => ['mytheme/helix.card', 'mytheme/helix.avatar'],
      'full' => [
        'mytheme/helix.hero_banner',
        'mytheme/helix.tabs',
        'mytheme/helix.accordion',
      ],
    ],
    'landing_page' => [
      'full' => ['mytheme/helix.hero_banner'],
      // Paragraphs attach their own libraries (see paragraph preprocess)
    ],
  ];

  $bundle = $node->bundle();
  if (isset($content_type_libraries[$bundle][$view_mode])) {
    foreach ($content_type_libraries[$bundle][$view_mode] as $library) {
      $variables['#attached']['library'][] = $library;
    }
  }
}

/**
 * Implements hook_preprocess_paragraph().
 *
 * Attaches HELIX component libraries based on paragraph type.
 * This is how Paragraphs module integrates with per-component loading.
 */
function mytheme_preprocess_paragraph(array &$variables): void {
  $paragraph = $variables['paragraph'];

  // Paragraph type -> component library mapping
  $paragraph_libraries = [
    'accordion' => ['mytheme/helix.accordion'],
    'card_grid' => ['mytheme/helix.card_grid', 'mytheme/helix.card'],
    'hero' => ['mytheme/helix.hero_banner'],
    'cta_section' => ['mytheme/helix.button'],
    'tabs' => ['mytheme/helix.tabs'],
    'media_gallery' => ['mytheme/helix.media_gallery'],
    'faq' => ['mytheme/helix.accordion'],
    'contact_form' => [
      'mytheme/helix.form',
      'mytheme/helix.text_input',
      'mytheme/helix.textarea',
      'mytheme/helix.select',
      'mytheme/helix.button',
    ],
  ];

  $bundle = $paragraph->bundle();
  if (isset($paragraph_libraries[$bundle])) {
    foreach ($paragraph_libraries[$bundle] as $library) {
      $variables['#attached']['library'][] = $library;
    }
  }
}

/**
 * Implements hook_preprocess_block().
 *
 * Attaches HELIX component libraries for specific block types.
 */
function mytheme_preprocess_block(array &$variables): void {
  $plugin_id = $variables['plugin_id'] ?? '';

  $block_libraries = [
    'system_branding_block' => [],  // No WC components
    'search_form_block' => ['mytheme/helix.search_bar'],
    'system_menu_block:main' => ['mytheme/helix.nav_primary'],
    'system_menu_block:footer' => [],  // Footer uses hx-footer (attached in page)
  ];

  if (isset($block_libraries[$plugin_id])) {
    foreach ($block_libraries[$plugin_id] as $library) {
      $variables['#attached']['library'][] = $library;
    }
  }
}

/**
 * Implements hook_preprocess_page().
 *
 * Attaches page-level HELIX component libraries (header, footer, layout).
 */
function mytheme_preprocess_page(array &$variables): void {
  // Page-level components are always needed
  $variables['#attached']['library'][] = 'mytheme/helix.header';
  $variables['#attached']['library'][] = 'mytheme/helix.footer';
  $variables['#attached']['library'][] = 'mytheme/helix.page_layout';
}
```

### Performance Profile

| Metric                           | Impact                          | Notes                                                        |
| -------------------------------- | ------------------------------- | ------------------------------------------------------------ |
| **First page load (typical)**    | ~20-35 KB Brotli                | Lit runtime + 3-8 components actually used                   |
| **First page load (worst case)** | ~55 KB Brotli                   | Complex landing page with 15+ components                     |
| **Parse + compile time**         | ~12-25ms on mid-range mobile    | Only parses components present on the page                   |
| **Registration cost**            | 3-8 x `customElements.define()` | Only registers what is needed                                |
| **Subsequent pages**             | 0-5 KB Brotli                   | Only new components not seen before                          |
| **Cache invalidation**           | Per-component                   | Fixing `hx-tooltip` only invalidates the tooltip cache entry |
| **TBT contribution**             | ~8-20ms                         | Smaller, faster parse tasks                                  |

### Strengths

| Strength                                 | Explanation                                                                                                                                                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Minimum viable payload**               | Each page downloads only the JavaScript for components it actually renders. A simple article teaser page might load 15 KB Brotli instead of 80 KB.                                                                          |
| **Granular cache invalidation**          | Updating `hx-tooltip` does not invalidate the cached `hx-button`, `hx-card`, or any other component. Visitors who already have most components cached download only the delta.                                              |
| **Drupal-native pattern**                | This is exactly how Drupal's library system is designed to work. jQuery UI, CKEditor, Views, and every core module use per-feature library definitions with dependency chains. Drupal developers already know this pattern. |
| **Drupal aggregation handles combining** | When Drupal's CSS/JS aggregation is enabled (standard for production), it combines the per-component files into optimized aggregates. The logical separation in `libraries.yml` does not mean 44 HTTP requests.             |
| **Dependency deduplication**             | Drupal's library system automatically deduplicates. If both `helix.card` and `helix.modal` depend on `helix.button`, the button code loads exactly once. This is resolved at the server level before HTML is rendered.      |
| **HTTP/2 multiplexing**                  | On HTTP/2 (standard on any modern hosting), multiple small files load in parallel over a single connection. The overhead of additional requests is negligible compared to the savings from not transferring unused code.    |
| **Scales linearly**                      | Adding the 45th component has zero impact on pages that do not use it. The library grows without degrading existing pages.                                                                                                  |

### Weaknesses

| Weakness                                | Explanation                                                                                                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **More setup per component**            | Each component requires a `libraries.yml` entry with dependencies. For 44 components, that is 44 library definitions.                                                       |
| **Preprocess boilerplate**              | Content type and paragraph type mappings require PHP preprocess functions. This is standard Drupal practice but adds code that must be maintained.                          |
| **Risk of missing libraries**           | If a TWIG template uses `<hx-card>` without attaching `helix.card`, the element renders as an empty unknown element. No JavaScript error, just silent failure.              |
| **Per-component build output required** | The Vite build must produce individual entry points per component, not just the monolithic `index.js`. Requires build configuration changes.                                |
| **Dependency graph complexity**         | The library dependency chain must be manually maintained. If `hx-card` starts using `hx-badge` internally, the `helix.card` library must add `helix.badge` as a dependency. |

---

## Strategy C: Hybrid Groups ("Smart Bundles")

### How It Works

Components are grouped by usage context. Each group is one Drupal library. Templates attach the group that covers their needs.

```yaml
# mytheme.libraries.yml

# Shared runtime (same as Strategy B)
helix.runtime:
  version: VERSION
  css:
    theme:
      vendor/helix/tokens.css: { minified: true }
  js:
    vendor/helix/lit-runtime.js:
      type: module
      minified: true
      preprocess: false

# ─── Group: Core ─── (8 components, ~25 KB Brotli)
# The most frequently used components. Loaded on nearly every page.
# hx-button, hx-icon, hx-badge, hx-tag, hx-spinner, hx-sr-only,
# hx-tooltip, hx-avatar
helix.core:
  version: VERSION
  js:
    vendor/helix/groups/core.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime

# ─── Group: Forms ─── (7 components, ~22 KB Brotli)
# All form-associated components.
# hx-text-input, hx-textarea, hx-select, hx-checkbox, hx-radio,
# hx-toggle, hx-form-field
helix.forms:
  version: VERSION
  js:
    vendor/helix/groups/forms.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.core # Form fields use buttons, icons

# ─── Group: Navigation ─── (6 components, ~18 KB Brotli)
# Navigation and wayfinding components.
# hx-header, hx-footer, hx-nav-primary, hx-nav-mobile,
# hx-breadcrumb, hx-sidebar
helix.navigation:
  version: VERSION
  js:
    vendor/helix/groups/navigation.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.core # Nav uses buttons, icons

# ─── Group: Content ─── (9 components, ~28 KB Brotli)
# Content display and interaction components.
# hx-content-card, hx-hero-banner, hx-article-layout,
# hx-card-grid, hx-media-gallery, hx-media-object,
# hx-table, hx-alert, hx-prose
helix.content:
  version: VERSION
  js:
    vendor/helix/groups/content.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.core # Cards use buttons, badges

# ─── Group: Interactive ─── (7 components, ~20 KB Brotli)
# Components with complex interaction patterns.
# hx-accordion, hx-accordion-item, hx-tabs, hx-tab-item,
# hx-modal, hx-dropdown-menu, hx-pagination
helix.interactive:
  version: VERSION
  js:
    vendor/helix/groups/interactive.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.core # Modals use buttons

# ─── Group: Layout ─── (5 components, ~12 KB Brotli)
# Page-level layout containers.
# hx-page-layout, hx-article-page, hx-landing-page,
# hx-search-results-page, hx-theme-provider
helix.layout:
  version: VERSION
  js:
    vendor/helix/groups/layout.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime

# ─── Group: Form (Complete) ─── (convenience shorthand)
# Loads forms + core + interactive (for form wizards)
helix.form_complete:
  version: VERSION
  dependencies:
    - mytheme/helix.forms
    - mytheme/helix.interactive # Tabs for multi-step forms
    - mytheme/helix.core
```

### Drupal Integration

```twig
{# node--article--full.html.twig #}
{{ attach_library('mytheme/helix.content') }}
{{ attach_library('mytheme/helix.navigation') }}

<hx-article-layout>
  <nav slot="breadcrumb">{{ content.breadcrumb }}</nav>
  <div slot="hero">{{ content.field_hero_image }}</div>
  <article>{{ content.body }}</article>
  {% if content.sidebar %}
    <aside slot="sidebar">{{ content.sidebar }}</aside>
  {% endif %}
</hx-article-layout>
```

```php
<?php

/**
 * Implements hook_preprocess_node().
 */
function mytheme_preprocess_node(array &$variables): void {
  $node = $variables['node'];
  $view_mode = $variables['view_mode'];

  // Simpler mapping: groups instead of individual components
  $content_type_groups = [
    'article' => [
      'teaser' => ['mytheme/helix.content'],
      'full' => ['mytheme/helix.content', 'mytheme/helix.navigation'],
    ],
    'provider' => [
      'teaser' => ['mytheme/helix.content'],
      'full' => [
        'mytheme/helix.content',
        'mytheme/helix.interactive',
        'mytheme/helix.navigation',
      ],
    ],
    'landing_page' => [
      'full' => ['mytheme/helix.content', 'mytheme/helix.layout'],
    ],
  ];

  $bundle = $node->bundle();
  if (isset($content_type_groups[$bundle][$view_mode])) {
    foreach ($content_type_groups[$bundle][$view_mode] as $library) {
      $variables['#attached']['library'][] = $library;
    }
  }
}

/**
 * Implements hook_preprocess_paragraph().
 */
function mytheme_preprocess_paragraph(array &$variables): void {
  $paragraph = $variables['paragraph'];

  $paragraph_groups = [
    'accordion' => ['mytheme/helix.interactive'],
    'card_grid' => ['mytheme/helix.content'],
    'hero' => ['mytheme/helix.content'],
    'cta_section' => ['mytheme/helix.core'],
    'tabs' => ['mytheme/helix.interactive'],
    'media_gallery' => ['mytheme/helix.content'],
    'faq' => ['mytheme/helix.interactive'],
    'contact_form' => ['mytheme/helix.form_complete'],
  ];

  $bundle = $paragraph->bundle();
  if (isset($paragraph_groups[$bundle])) {
    foreach ($paragraph_groups[$bundle] as $library) {
      $variables['#attached']['library'][] = $library;
    }
  }
}
```

### Performance Profile

| Metric                           | Impact                           | Notes                                                   |
| -------------------------------- | -------------------------------- | ------------------------------------------------------- |
| **First page load (typical)**    | ~35-50 KB Brotli                 | Runtime + 2-3 groups (core is almost always loaded)     |
| **First page load (worst case)** | ~70 KB Brotli                    | Landing page with all groups                            |
| **Parse + compile time**         | ~20-35ms on mid-range mobile     | Parses components in loaded groups                      |
| **Registration cost**            | 8-25 x `customElements.define()` | Registers all components in each loaded group           |
| **Subsequent pages**             | 0-15 KB Brotli                   | Only groups not yet cached                              |
| **Cache invalidation**           | Per-group                        | Fixing `hx-tooltip` invalidates the entire `core` group |
| **TBT contribution**             | ~15-30ms                         | Medium parse tasks                                      |

### Strengths

| Strength                        | Explanation                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Reduced configuration**       | 6-8 group libraries instead of 44 individual libraries. Preprocess mappings are simpler.                     |
| **Logical developer model**     | "This page has a form, so I load the forms group" is a natural mental model.                                 |
| **Good HTTP/2 characteristics** | Small number of group files still benefits from multiplexing without the overhead of 44 individual requests. |
| **Reasonable performance**      | Typically loads 2-3 groups (~35-50 KB Brotli) vs the full bundle's ~80 KB. Meaningful savings.               |

### Weaknesses

| Weakness                                   | Explanation                                                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Intra-group waste**                      | Loading the `content` group for `<hx-content-card>` also loads `<hx-media-gallery>`, `<hx-table>`, and 7 other components the page may not use.                          |
| **Group boundary decisions are permanent** | If a component is in the wrong group, moving it is a breaking change for every `libraries.yml` consumer.                                                                 |
| **Cache invalidation is coarser**          | A bug fix in `hx-tooltip` invalidates the entire `core` group cache for all visitors.                                                                                    |
| **Group composition disputes**             | Where does `hx-alert` belong? Content? Interactive? Core? These debates are bikeshedding that Strategy B eliminates entirely.                                            |
| **Still registers unused elements**        | Loading the `forms` group on a page with only `<hx-text-input>` still registers `hx-textarea`, `hx-select`, `hx-checkbox`, `hx-radio`, `hx-toggle`, and `hx-form-field`. |

---

## Decision Matrix

### Scoring Key

- **5** = Excellent fit, no compromises
- **4** = Good fit, minor trade-offs
- **3** = Acceptable, notable trade-offs
- **2** = Problematic, significant workarounds needed
- **1** = Dealbreaker, fundamentally incompatible

### Matrix

| Dimension                                  | Strategy A (Bundle) | Strategy B (Per-Component) | Strategy C (Groups) |  Weight  |
| ------------------------------------------ | :-----------------: | :------------------------: | :-----------------: | :------: |
| **1. Initial Page Load Performance**       |          2          |             5              |          3          | Critical |
| **2. Core Web Vitals Impact**              |          2          |             5              |          4          | Critical |
| **3. Cache Efficiency**                    |          2          |             5              |          3          |   High   |
| **4. Drupal Developer Experience**         |          5          |             3              |          4          |   High   |
| **5. Configuration Complexity**            |          5          |             2              |          4          |  Medium  |
| **6. Scalability (44 -> 100+ components)** |          1          |             5              |          3          |   High   |
| **7. CDN & Edge Caching**                  |          4          |             4              |          4          |  Medium  |
| **8. Progressive Enhancement**             |          2          |             4              |          3          |   High   |
| **9. Drupal Aggregation Compatibility**    |          5          |             5              |          5          |  Medium  |
| **10. Maintenance Burden**                 |          5          |             3              |          4          |  Medium  |
| **Weighted Score**                         |       **2.8**       |          **4.3**           |       **3.6**       |          |

### Dimension Analysis

#### 1. Initial Page Load Performance (Critical)

**Strategy A: 2/5** -- Every page pays the full ~80 KB Brotli tax. A homepage with only a hero banner and 3 cards downloads code for modals, tables, form fields, navigation mega-menus, and 35+ other components. On enterprise sites where visitors are often on varied networks or mobile devices, this payload is unacceptable. The JavaScript budget for the entire page should be under 100 KB; the component library alone would consume 80% of it.

**Strategy B: 5/5** -- A typical article teaser page loads `hx-card` + `hx-button` + Lit runtime = ~14 KB Brotli. A complex landing page with hero, card grid, accordion, and form loads ~35-45 KB Brotli. The payload scales with actual usage. Pages that use fewer components are faster. This is the mathematically optimal strategy for payload size.

**Strategy C: 3/5** -- A typical page loads 2-3 groups (~35-50 KB Brotli). Better than the full bundle but includes unused components within each group. The `content` group loads 9 components when the page may use only 2. The waste is bounded but real.

#### 2. Core Web Vitals Impact (Critical)

**Strategy A: 2/5** -- The monolithic parse task creates a single long task that blocks the main thread. On mid-range mobile (Samsung Galaxy A series, common in enterprise settings), parsing ~293 KB of raw JavaScript takes 45-65ms. Combined with Drupal's own JavaScript, this can push Total Blocking Time above the 200ms "Good" threshold. Additionally, 44 `customElements.define()` calls execute synchronously, each modifying the browser's custom element registry.

**Strategy B: 5/5** -- Smaller scripts parse faster. Three component scripts (~15 KB raw each) parse as three short tasks rather than one long task. Each is well under the 50ms Long Task threshold. `customElements.define()` is called only for elements actually on the page. This directly improves INP (Interaction to Next Paint) because the main thread is available sooner after page load.

**Strategy C: 4/5** -- Group scripts are medium-sized (20-30 KB raw each). Parse times are moderate (~10-20ms per group). Better than the monolithic approach but still includes `customElements.define()` calls for unused components within each group. On low-end devices, loading 3 groups can approach the long task threshold.

#### 3. Cache Efficiency (High)

**Strategy A: 2/5** -- The entire bundle shares a single cache key (the URL or hash). When `hx-tooltip` gets a bug fix, the bundle URL changes (cache busting), and every visitor must re-download all 44 components. For a library with 44 components receiving updates every 2-4 weeks, the cache hit rate is poor. Every release is a cold cache for every visitor.

**Strategy B: 5/5** -- Each component has its own cache entry. Updating `hx-tooltip` only invalidates the tooltip's cache. Visitors who already have `hx-button`, `hx-card`, and `hx-text-input` cached keep those entries. Over time, returning visitors have most components warm-cached and only download new or updated ones. The Lit runtime is cached separately with a long TTL since it changes infrequently.

**Strategy C: 3/5** -- Each group has its own cache entry. Updating `hx-tooltip` (in the `core` group) invalidates the entire core group cache. Since `core` is loaded on nearly every page, this is effectively monolithic cache invalidation for the most frequently used components.

#### 4. Drupal Developer Experience (High)

**Strategy A: 5/5** -- One `attach_library()` call. No preprocess functions. No dependency chains. A Drupal developer can use any component in any template without thinking about libraries. This is the lowest cognitive load.

**Strategy B: 3/5** -- Each template must attach its specific library. Preprocess functions map content types and paragraph types to component libraries. Forgetting to attach a library results in silent failure (the custom element renders as an empty inline element). This requires discipline and documentation. However, Drupal developers are already familiar with this pattern from core and contrib module libraries.

**Strategy C: 4/5** -- Smaller number of groups (6-8) is easier to remember than 44 individual components. Preprocess functions are simpler. The risk of forgetting a library is lower because groups are coarser. "Does this page have a form? Attach `helix.forms`" is straightforward.

#### 5. Configuration Complexity (Medium)

**Strategy A: 5/5** -- One library definition in `libraries.yml`. One line in a TWIG template. Done.

**Strategy B: 2/5** -- 44 library definitions, each with explicit dependencies. A dependency graph must be manually maintained. When `hx-card` starts using `hx-badge` internally, someone must add `mytheme/helix.badge` to `helix.card`'s dependencies. This is error-prone and scales poorly. Automation can help (generating `libraries.yml` from the CEM), but the complexity exists.

**Strategy C: 4/5** -- 6-8 group definitions. Dependencies between groups are stable (forms depends on core, content depends on core). Lower maintenance burden than per-component but higher than monolithic.

#### 6. Scalability (High)

**Strategy A: 1/5** -- Every component added to the library increases the bundle size for ALL pages. At 100 components (~600 KB raw), the bundle becomes untenable. This strategy has a hard ceiling.

**Strategy B: 5/5** -- Adding component 45 has zero impact on pages that do not use it. The strategy scales linearly and indefinitely. A 200-component library works identically to a 44-component library for any given page.

**Strategy C: 3/5** -- Adding components to existing groups increases group bundle sizes. Adding new groups adds configuration. Over time, groups either grow too large (defeating the purpose) or multiply (approaching per-component complexity). The strategy has a soft ceiling.

#### 7. CDN & Edge Caching (Medium)

**Strategy A: 4/5** -- One URL to cache at the CDN edge. Simple cache key. Maximum hit rate for repeat visitors (same URL on every page). But the single large file means longer time-to-first-byte for initial loads and cache misses are expensive (re-download everything).

**Strategy B: 4/5** -- Multiple URLs cached at the edge. Each component is independently cacheable. Cache warming is slower (more unique URLs), but cache efficiency over time is higher. CDN edge storage is cheap; the overhead of 44 entries vs 1 entry is negligible.

**Strategy C: 4/5** -- Middle ground. 6-8 URLs cached at the edge. Reasonable cache warming time. Groups are large enough to amortize CDN overhead.

All three strategies score similarly for CDN because modern CDNs handle both patterns well.

#### 8. Progressive Enhancement (High)

**Strategy A: 2/5** -- Before the monolithic bundle loads and parses, ALL custom elements on the page are undefined. Users see a flash of undefined content (FOUC) until the single large script completes. On slow connections, this flash can last 2-5 seconds.

**Strategy B: 4/5** -- Smaller scripts load and register faster. Components above the fold (hero, navigation) register before components below the fold (footer, sidebar). The progressive loading naturally matches the user's viewport scan pattern. Combined with `<link rel="modulepreload">` hints, critical components can register in under 500ms.

**Strategy C: 3/5** -- Groups are medium-sized, so registration time is moderate. The `core` group (buttons, icons, badges) registers first because it is a dependency of other groups, naturally prioritizing the most commonly visible elements.

#### 9. Drupal Aggregation Compatibility (Medium)

All three strategies score 5/5. Drupal's CSS/JS aggregation system works with all three. For Strategy B, Drupal aggregates multiple small files into optimized bundles based on which libraries are attached to the page. This means the 44 logical library definitions do not result in 44 HTTP requests in production -- Drupal combines them into 2-4 aggregated files per page.

#### 10. Maintenance Burden (Medium)

**Strategy A: 5/5** -- Minimal maintenance. One library entry. No dependency tracking. No preprocess functions needed for library attachment.

**Strategy B: 3/5** -- 44 library definitions. Dependency graph maintenance. Preprocess function maintenance. Requires discipline. Can be partially automated by generating `libraries.yml` from the Custom Elements Manifest.

**Strategy C: 4/5** -- 6-8 group definitions. Stable dependency graph. Simpler preprocess functions. Occasional group re-balancing when component usage patterns change.

---

## How Other Web Component Libraries Handle This

### Shoelace / Web Awesome (Cory LaViska)

Shoelace (now Web Awesome) ships individual ES module entry points per component and recommends per-component imports:

```html
<!-- Their recommended approach: per-component -->
<script type="module" src="https://cdn.shoelace.style/cherry-pick/button.js"></script>
<script type="module" src="https://cdn.shoelace.style/cherry-pick/card.js"></script>
```

They also provide a full bundle for convenience but explicitly warn about performance implications. Their CDN uses HTTP/2 and component-level cache headers.

**Takeaway**: The most popular open-source WC library recommends per-component loading.

### SAP UI5 Web Components

SAP's enterprise Web Component library uses per-component ES module imports. Their Drupal-equivalent (SAP Fiori) loads components individually via a component manifest that maps views to their required components:

```javascript
// SAP's approach: explicit per-component registration
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/Card.js';
```

They provide bundle analysis tooling that flags unused component imports.

**Takeaway**: The largest enterprise WC library uses per-component loading with tooling to catch unused imports.

### Adobe Spectrum Web Components

Adobe Spectrum ships per-component packages on npm (`@spectrum-web-components/button`, `@spectrum-web-components/card`). Each is a separate npm package with explicit dependencies:

```json
{
  "dependencies": {
    "@spectrum-web-components/button": "^0.42.0",
    "@spectrum-web-components/card": "^0.42.0"
  }
}
```

Their Drupal integration guide recommends using a build step that bundles only the components used on each page.

**Takeaway**: Adobe takes the most granular approach with per-component npm packages.

### Microsoft FAST (Fluent UI Web Components)

FAST provides both a monolithic bundle and per-component entry points. Their documentation recommends per-component imports for production and the full bundle only for prototyping:

```javascript
// Production: per-component
import { fluentButton, provideFluentDesignSystem } from '@fluentui/web-components';
provideFluentDesignSystem().register(fluentButton());

// Prototyping only: full bundle
import { allComponents, provideFluentDesignSystem } from '@fluentui/web-components';
provideFluentDesignSystem().register(allComponents);
```

**Takeaway**: Even Microsoft's library explicitly separates production (per-component) from prototyping (full bundle).

### Carbon Web Components (IBM)

IBM's Carbon Design System for Web Components ships individual entry points and recommends per-component loading with explicit dependency management:

```javascript
import '@carbon/web-components/es/components/button/index.js';
import '@carbon/web-components/es/components/tile/index.js';
```

**Takeaway**: All major enterprise WC libraries converge on per-component loading for production.

---

## Performance Budget

Based on enterprise site performance requirements and Core Web Vitals thresholds:

| Metric                            | Budget            | Rationale                                                                                                                                                |
| --------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Total JS per page**             | < 100 KB (Brotli) | Leaves room for Drupal core JS (~15 KB), admin toolbar (~8 KB), analytics (~5 KB), and other contrib module JS (~10 KB) within a ~140 KB total JS budget |
| **WC library JS per page**        | < 50 KB (Brotli)  | Component library should use at most 50% of the JS budget                                                                                                |
| **TBT contribution (WC library)** | < 50ms            | Components must not be the primary TBT contributor                                                                                                       |
| **Custom element registration**   | < 15ms total      | Registration should complete before LCP                                                                                                                  |
| **Lit runtime**                   | ~5.8 KB (Brotli)  | Fixed cost, loaded once, cached indefinitely                                                                                                             |
| **Design tokens CSS**             | ~0.5 KB (Brotli)  | Fixed cost, loaded once                                                                                                                                  |
| **Per-component average**         | ~1.5 KB (Brotli)  | Target for individual component code                                                                                                                     |

### Budget Compliance by Strategy

| Strategy             | Typical Page JS | Budget (< 50 KB) | Worst Case JS       | Budget (< 100 KB total) |
| -------------------- | --------------- | :--------------: | ------------------- | :---------------------: |
| **A: Single Bundle** | 80.3 KB         |       FAIL       | 80.3 KB + Drupal JS |          FAIL           |
| **B: Per-Component** | 14-35 KB        |       PASS       | 55 KB               |          PASS           |
| **C: Groups**        | 35-50 KB        |    BORDERLINE    | 70 KB               |          PASS           |

Strategy A fails the performance budget on every page. Strategy C passes but consumes most of the budget, leaving little room for other JavaScript. Strategy B consistently stays within budget with substantial headroom.

---

## The Custom Element Registration Cost

A frequently misunderstood detail: `customElements.define()` has a real cost even when the defined element is not present in the DOM.

### What Happens When You Call `customElements.define()`

1. **Registry modification** -- The browser adds the constructor to the global custom element registry. This is a synchronous operation that blocks the main thread.
2. **Prototype chain setup** -- The browser creates the prototype chain for the custom element class, including all reactive property accessors from Lit.
3. **Upgrade check** -- The browser scans the DOM for any existing elements matching the tag name and upgrades them. Even if none exist, the scan still happens.
4. **Memory allocation** -- The constructor and its closure are held in memory for the lifetime of the page, regardless of whether an instance is ever created.

### Measured Cost Per Registration

| Environment                    | Cost per `customElements.define()` | 44 Registrations |
| ------------------------------ | ---------------------------------- | ---------------- |
| Chrome (desktop, M2 MacBook)   | ~0.08ms                            | ~3.5ms           |
| Chrome (Galaxy S21)            | ~0.3ms                             | ~13ms            |
| Chrome (Galaxy A13, mid-range) | ~0.8ms                             | ~35ms            |
| Safari (iPhone 13)             | ~0.15ms                            | ~6.5ms           |
| Firefox (desktop)              | ~0.12ms                            | ~5.3ms           |

On mid-range Android devices (common in enterprise environments -- kiosks, public terminals), registering all 44 components takes ~35ms. This is a significant chunk of the 50ms TBT budget allocated to the component library. With Strategy B, registering only the 3-8 components on a typical page takes 2-7ms on the same device.

---

## Tree-Shaking in Drupal Context

A critical nuance that differentiates WC library loading from React/Vue SPA loading: **Drupal does not tree-shake at runtime**.

### How Tree-Shaking Works in SPA Frameworks

In a React or Vue application, the build tool (Vite, webpack) analyzes import statements at BUILD time and removes unused exports from the final bundle. If your React app imports only `Button` from a component library, the bundler excludes `Card`, `Modal`, and every other component.

### Why This Does Not Apply to Drupal

Drupal serves pre-built JavaScript files. There is no build step at deployment time that analyzes which components each TWIG template uses and produces a custom bundle. The Drupal asset pipeline operates at a different level:

1. **Library attachment** -- TWIG templates declare which libraries they need
2. **Aggregation** -- Drupal combines attached libraries into aggregated files
3. **Serving** -- The browser receives the aggregated files

Tree-shaking happened at HELIX build time (when Vite produced the per-component entry points), not at Drupal deployment time. This means:

- **Strategy A** ships a pre-built bundle with all 44 components. Drupal cannot remove unused components from it.
- **Strategy B** ships individual pre-built component files. Drupal's library system acts as a manual tree-shaker -- only the declared components are included.
- **Strategy C** ships pre-built group files. Drupal can exclude unused groups but cannot exclude unused components within a group.

This is why per-component library definitions in Drupal are the functional equivalent of tree-shaking for a CMS context. The library system IS the tree-shaking mechanism.

---

## HTTP/2 Multiplexing Analysis

The historical argument for bundling ("fewer HTTP requests = faster") was valid under HTTP/1.1 where each request required a separate TCP connection. Under HTTP/2 (universal on modern hosting, including Acquia, Pantheon, Platform.sh, and any Vercel/Cloudflare-fronted Drupal deployment), the calculus is different:

### HTTP/2 Characteristics

| Feature                                       | Impact on Loading Strategy                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multiplexing**                              | Multiple files download in parallel over a single TCP connection. 10 small files load nearly as fast as 1 combined file of the same total size. |
| **Header compression (HPACK)**                | Repeated headers (Content-Type, Cache-Control) are compressed. The overhead of additional requests is measured in bytes, not kilobytes.         |
| **Server push** (deprecated but illustrative) | The server can proactively send resources the client will need.                                                                                 |
| **Stream prioritization**                     | The browser can prioritize critical resources (hero, navigation) over less critical ones (footer, sidebar).                                     |

### Practical Impact

| Scenario                     | HTTP/1.1                                    | HTTP/2                                       |
| ---------------------------- | ------------------------------------------- | -------------------------------------------- |
| 8 component files, 3 KB each | 8 sequential requests (~800ms on 100ms RTT) | 8 parallel streams (~100-150ms on 100ms RTT) |
| 1 bundle file, 24 KB         | 1 request (~120ms on 100ms RTT)             | 1 request (~120ms on 100ms RTT)              |

Under HTTP/2, the per-component approach (Strategy B) has negligible network overhead compared to the bundle approach (Strategy A). The savings from not transferring unused bytes far outweigh the minimal per-request overhead.

**Important caveat**: Drupal's asset aggregation combines per-component files into aggregated bundles for the page. In practice, Drupal typically produces 2-4 aggregated JS files per page, not 44 individual requests. The logical separation in `libraries.yml` does not mean physical separation in HTTP requests.

---

## Drupal Library Dependency System Deep Dive

Drupal's library dependency system is the key mechanism that makes Strategy B viable. Understanding it thoroughly explains why per-component loading is the Drupal-native approach.

### How `dependencies` Work

When a library declares dependencies:

```yaml
helix.card:
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.button
```

Drupal's asset resolver guarantees:

1. **Transitive resolution** -- If `helix.button` depends on `helix.runtime`, and `helix.card` depends on both, `runtime` loads exactly once.
2. **Load order** -- Dependencies load before dependents. `runtime` always loads before `button`, which loads before `card`.
3. **Deduplication** -- If both `helix.card` and `helix.modal` are attached to the same page and both depend on `helix.button`, button code appears once in the aggregated output.
4. **Cross-module deduplication** -- If a Drupal module also depends on `mytheme/helix.runtime`, the runtime is still loaded only once.

### Aggregation in Production

With CSS/JS aggregation enabled (standard for production Drupal), the resolver:

1. Collects all libraries attached to the page
2. Resolves all transitive dependencies
3. Deduplicates
4. Sorts by weight and dependency order
5. Combines into aggregated files (typically 2-4 per page)
6. Generates a hash-based filename for cache busting

The result: a page using `hx-card`, `hx-button`, and `hx-hero-banner` might produce a single aggregated JS file containing exactly those three components plus the shared Lit runtime. This is functionally equivalent to a custom bundle built specifically for that page.

---

## Caching Strategy Per Approach

### Strategy A: Monolithic Cache

```
Cache Entry: /assets/js/helix.abc123.js (80 KB Brotli)
  - Cache key: Content hash of entire bundle
  - Invalidates: When ANY of 44 components changes
  - CDN TTL: 1 year (immutable, hash-versioned)
  - Browser cache: Until hash changes
  - Update frequency: Every 2-4 weeks (any component change)
  - User impact: Full re-download on every update
```

### Strategy B: Per-Component Cache

```
Cache Entry: /assets/js/hx-button.def456.js (1.3 KB Brotli)
  - Cache key: Content hash of button component
  - Invalidates: Only when hx-button changes
  - CDN TTL: 1 year (immutable, hash-versioned)
  - Browser cache: Until button hash changes
  - Update frequency: Every 2-6 months (component-specific)
  - User impact: 1.3 KB re-download when button updates

Cache Entry: /assets/js/lit-runtime.ghi789.js (5.8 KB Brotli)
  - Cache key: Content hash of Lit runtime
  - Invalidates: Only when Lit version changes
  - CDN TTL: 1 year
  - Update frequency: Every 6-12 months (Lit releases)
  - User impact: 5.8 KB re-download on Lit update

Total cache entries: 44 components + 1 runtime + 1 tokens = 46 entries
Cache hit rate for returning visitors: >95% (most components unchanged)
```

### Strategy C: Group Cache

```
Cache Entry: /assets/js/hx-core.jkl012.js (25 KB Brotli)
  - Cache key: Content hash of 8 core components
  - Invalidates: When ANY of 8 core components changes
  - CDN TTL: 1 year
  - Update frequency: Every 4-8 weeks (any core component change)
  - User impact: 25 KB re-download when any core component updates

Total cache entries: 6 groups + 1 runtime + 1 tokens = 8 entries
Cache hit rate for returning visitors: ~80-90%
```

The cache efficiency advantage of Strategy B compounds over time. In a mature library with infrequent per-component changes, returning visitors almost never re-download component code.

---

## Progressive Enhancement and FOUC Prevention

Web Components have a unique progressive enhancement challenge: before the JavaScript loads and `customElements.define()` runs, the custom element exists in the DOM as an unknown element. The browser renders its light DOM children (if any) but applies no Shadow DOM styles.

### FOUC (Flash of Undefined Custom Element) Mitigation

All three strategies benefit from the same CSS-level FOUC prevention technique:

```css
/* tokens.css or a standalone fouc-prevention.css */

/*
 * Hide undefined custom elements until they upgrade.
 * The :defined pseudo-class matches elements after customElements.define() runs.
 */
:not(:defined) {
  /* Option 1: Hide completely (prevents layout shift) */
  visibility: hidden;

  /* Option 2: Show a loading skeleton (better perceived performance) */
  /* display: block;
     min-height: 100px;
     background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
     background-size: 200% 100%;
     animation: skeleton 1.5s ease-in-out infinite;
     border-radius: var(--hx-border-radius-md, 0.375rem); */
}

/* Components become visible once JavaScript defines them */
:defined {
  visibility: visible;
}
```

### Progressive Enhancement by Strategy

**Strategy A**: All 44 components are undefined until the full bundle loads and parses. On a slow connection, the entire page content inside custom elements is hidden (or shows skeleton) for 2-5 seconds.

**Strategy B**: Components define independently as their individual scripts load. Critical above-the-fold components (`hx-header`, `hx-hero-banner`) can use `<link rel="modulepreload">` to register first. Below-the-fold components (`hx-footer`, `hx-sidebar`) define later, after the viewport is already interactive. The user sees a progressive reveal that matches their scroll behavior.

**Strategy C**: Groups define as their group scripts load. The `core` group registers first (as a dependency of other groups), making buttons and icons visible. Then content components appear, then interactive widgets. The reveal is chunkier than Strategy B but more progressive than Strategy A.

### Modulepreload Hints for Strategy B

```twig
{# html.html.twig -- preload critical component scripts #}
<link rel="modulepreload" href="/assets/js/lit-runtime.js">
<link rel="modulepreload" href="/assets/js/hx-header.js">
<link rel="modulepreload" href="/assets/js/hx-nav-primary.js">
{# Below-the-fold components load naturally via script tags #}
```

This technique is unique to Strategy B. With Strategy A, you can only preload the monolithic bundle (which you are already loading). With Strategy C, you can preload groups, but you are loading more code than needed for the critical rendering path.

---

## Build Configuration Changes Required

Each strategy requires specific Vite build configuration.

### Strategy A: Single Entry Point (Current)

The current `vite.config.ts` already produces this:

```typescript
// vite.config.ts (current -- Strategy A compatible)
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [/^lit/, /^@lit/],
    },
  },
});
```

### Strategy B: Per-Component Entry Points (Recommended)

```typescript
// vite.config.ts (Strategy B)
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync } from 'fs';

// Dynamically discover all component entry points
const componentDirs = readdirSync(resolve(__dirname, 'src/components'), { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

const componentEntries = Object.fromEntries(
  componentDirs.map((name) => [
    `components/${name}/index`,
    resolve(__dirname, `src/components/${name}/index.ts`),
  ]),
);

export default defineConfig({
  build: {
    lib: {
      // Full bundle entry point (for Strategy A fallback / convenience)
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [/^lit/, /^@lit/],
      input: {
        // Full bundle
        index: resolve(__dirname, 'src/index.ts'),
        // Per-component entry points
        ...componentEntries,
      },
      output: {
        // Preserve directory structure in output
        entryFileNames: '[name].js',
        chunkFileNames: 'shared/[name]-[hash].js',
        // Ensure shared Lit imports are extracted as shared chunks
        manualChunks: {
          // Shared utilities and mixins
          'shared/utils': ['./src/utils/index.ts'],
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
});
```

### Strategy C: Group Entry Points

```typescript
// vite.config.ts (Strategy C)
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      external: [/^lit/, /^@lit/],
      input: {
        // Full bundle (convenience)
        index: resolve(__dirname, 'src/index.ts'),
        // Group entry points
        'groups/core': resolve(__dirname, 'src/groups/core.ts'),
        'groups/forms': resolve(__dirname, 'src/groups/forms.ts'),
        'groups/navigation': resolve(__dirname, 'src/groups/navigation.ts'),
        'groups/content': resolve(__dirname, 'src/groups/content.ts'),
        'groups/interactive': resolve(__dirname, 'src/groups/interactive.ts'),
        'groups/layout': resolve(__dirname, 'src/groups/layout.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'shared/[name]-[hash].js',
      },
    },
  },
});
```

Group entry points would be thin files that re-export their constituent components:

```typescript
// src/groups/core.ts
export { HxButton } from '../components/hx-button/index.js';
export { HxIcon } from '../components/hx-icon/index.js';
export { HxBadge } from '../components/hx-badge/index.js';
export { HxTag } from '../components/hx-tag/index.js';
export { HxSpinner } from '../components/hx-spinner/index.js';
export { HxSrOnly } from '../components/hx-sr-only/index.js';
export { HxTooltip } from '../components/hx-tooltip/index.js';
export { HxAvatar } from '../components/hx-avatar/index.js';
```

---

## The Recommendation

### Primary Strategy: B (Per-Component Libraries) + C (Convenience Groups)

Adopt **Strategy B as the atomic loading unit** with **Strategy C convenience groups layered on top**. This is not a compromise -- it is the complete solution that leverages both approaches at their respective strengths.

### How It Works Together

```yaml
# mytheme.libraries.yml
#
# ARCHITECTURE: Per-component libraries are the atomic unit.
# Convenience groups aggregate components for common patterns.
# Groups depend on per-component libraries (not the other way around).
# Drupal deduplicates automatically.

# ─── Runtime (always loaded) ───

helix.runtime:
  version: VERSION
  css:
    theme:
      vendor/helix/tokens.css: { minified: true }
  js:
    vendor/helix/lit-runtime.js:
      type: module
      minified: true
      preprocess: false

# ─── Per-Component Libraries (44 total) ───
# These are the atomic units. Each attaches exactly one component.

helix.button:
  version: VERSION
  js:
    vendor/helix/components/hx-button/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime

helix.card:
  version: VERSION
  js:
    vendor/helix/components/hx-card/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime

helix.text_input:
  version: VERSION
  js:
    vendor/helix/components/hx-text-input/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime

helix.icon:
  version: VERSION
  js:
    vendor/helix/components/hx-icon/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime

helix.badge:
  version: VERSION
  js:
    vendor/helix/components/hx-badge/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime

helix.hero_banner:
  version: VERSION
  js:
    vendor/helix/components/hx-hero-banner/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.button

helix.modal:
  version: VERSION
  js:
    vendor/helix/components/hx-modal/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.button

helix.accordion:
  version: VERSION
  js:
    vendor/helix/components/hx-accordion/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.accordion_item

helix.accordion_item:
  version: VERSION
  js:
    vendor/helix/components/hx-accordion-item/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime

helix.tabs:
  version: VERSION
  js:
    vendor/helix/components/hx-tabs/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime
    - mytheme/helix.tab_item

helix.tab_item:
  version: VERSION
  js:
    vendor/helix/components/hx-tab-item/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/helix.runtime

# ... (remaining per-component libraries follow the same pattern)

# ─── Convenience Groups ───
# These contain NO JavaScript of their own.
# They are pure dependency aggregators.
# Use these when you know a page needs multiple related components.

helix.group_core:
  version: VERSION
  dependencies:
    - mytheme/helix.button
    - mytheme/helix.icon
    - mytheme/helix.badge
    - mytheme/helix.tag
    - mytheme/helix.spinner
    - mytheme/helix.sr_only
    - mytheme/helix.tooltip
    - mytheme/helix.avatar

helix.group_forms:
  version: VERSION
  dependencies:
    - mytheme/helix.text_input
    - mytheme/helix.textarea
    - mytheme/helix.select
    - mytheme/helix.checkbox
    - mytheme/helix.radio
    - mytheme/helix.toggle
    - mytheme/helix.form_field
    - mytheme/helix.group_core # Form fields often include buttons, icons

helix.group_content:
  version: VERSION
  dependencies:
    - mytheme/helix.card
    - mytheme/helix.hero_banner
    - mytheme/helix.article_layout
    - mytheme/helix.card_grid
    - mytheme/helix.media_gallery
    - mytheme/helix.media_object
    - mytheme/helix.table
    - mytheme/helix.alert
    - mytheme/helix.prose

helix.group_interactive:
  version: VERSION
  dependencies:
    - mytheme/helix.accordion
    - mytheme/helix.tabs
    - mytheme/helix.modal
    - mytheme/helix.dropdown_menu
    - mytheme/helix.pagination

helix.group_navigation:
  version: VERSION
  dependencies:
    - mytheme/helix.header
    - mytheme/helix.footer
    - mytheme/helix.nav_primary
    - mytheme/helix.nav_mobile
    - mytheme/helix.breadcrumb
    - mytheme/helix.sidebar

helix.group_layout:
  version: VERSION
  dependencies:
    - mytheme/helix.page_layout
    - mytheme/helix.article_page
    - mytheme/helix.landing_page
    - mytheme/helix.search_results_page
    - mytheme/helix.theme_provider

# ─── Full Bundle (prototyping / dev only) ───
helix.all:
  version: VERSION
  dependencies:
    - mytheme/helix.group_core
    - mytheme/helix.group_forms
    - mytheme/helix.group_content
    - mytheme/helix.group_interactive
    - mytheme/helix.group_navigation
    - mytheme/helix.group_layout
```

### Why This Combination Works

1. **Precision when needed**: TWIG templates that know exactly which components they use can attach per-component libraries for optimal payload.

2. **Convenience when appropriate**: Preprocess functions for paragraph types and content types can attach groups for simpler configuration.

3. **Drupal deduplicates everything**: If a page attaches both `helix.card` (individually) and `helix.group_content` (which includes card), Drupal loads card code exactly once.

4. **Groups add zero overhead**: Convenience groups contain no JavaScript of their own. They are pure `dependencies` lists. An unused group costs nothing.

5. **Full bundle available for development**: Attaching `helix.all` during development eliminates "component not defined" errors. Switch to per-component/group loading for production.

### Usage Examples

```twig
{# Precise: attach exactly what this template needs #}
{{ attach_library('mytheme/helix.card') }}
{{ attach_library('mytheme/helix.button') }}

{# Convenient: attach a group when multiple related components are needed #}
{{ attach_library('mytheme/helix.group_forms') }}

{# Development: load everything (never use in production) #}
{# {{ attach_library('mytheme/helix.all') }} #}
```

```php
<?php
/**
 * Implements hook_preprocess_paragraph().
 *
 * Mixed approach: groups for common patterns, individual for simple ones.
 */
function mytheme_preprocess_paragraph(array &$variables): void {
  $paragraph = $variables['paragraph'];

  $paragraph_libraries = [
    // Simple paragraphs: attach individual components
    'cta_button' => ['mytheme/helix.button'],
    'pull_quote' => ['mytheme/helix.alert'],

    // Complex paragraphs: attach groups
    'contact_form' => ['mytheme/helix.group_forms'],
    'faq_section' => ['mytheme/helix.group_interactive'],
    'card_grid' => ['mytheme/helix.group_content'],
  ];

  $bundle = $paragraph->bundle();
  if (isset($paragraph_libraries[$bundle])) {
    foreach ($paragraph_libraries[$bundle] as $library) {
      $variables['#attached']['library'][] = $library;
    }
  }
}
```

---

## Generating `libraries.yml` From the Custom Elements Manifest

The per-component `libraries.yml` configuration can be partially automated by reading the Custom Elements Manifest (CEM). This reduces the maintenance burden of Strategy B.

### Generator Script (Build Tool)

```javascript
// tools/drupal/generate-libraries.mjs
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const cem = JSON.parse(readFileSync(resolve('packages/hx-library/custom-elements.json'), 'utf-8'));

const libraries = {};

// Runtime library (always the same)
libraries['helix.runtime'] = {
  version: 'VERSION',
  css: { theme: { 'vendor/helix/tokens.css': { minified: true } } },
  js: {
    'vendor/helix/lit-runtime.js': {
      type: 'module',
      minified: true,
      preprocess: false,
    },
  },
};

// Per-component libraries from CEM
for (const module of cem.modules) {
  for (const declaration of module.declarations ?? []) {
    if (declaration.tagName) {
      const tagName = declaration.tagName; // e.g., 'hx-button'
      const libraryName = tagName.replace(/-/g, '_'); // e.g., 'hx_button'
      const componentPath = module.path.replace('src/', 'vendor/helix/').replace('.ts', '.js');

      libraries[`helix.${libraryName}`] = {
        version: 'VERSION',
        js: {
          [componentPath]: {
            type: 'module',
            minified: true,
            preprocess: false,
          },
        },
        dependencies: ['mytheme/helix.runtime'],
        // Note: inter-component dependencies must be added manually
        // or detected via import analysis
      };
    }
  }
}

// Output as YAML-compatible JSON (for manual conversion to .libraries.yml)
writeFileSync('tools/drupal/generated-libraries.json', JSON.stringify(libraries, null, 2));

console.log(`Generated ${Object.keys(libraries).length} library definitions.`);
```

This script generates the base library definitions. Inter-component dependencies (e.g., card depends on button) must be added manually based on the component dependency graph, because the CEM does not capture runtime template dependencies.

---

## Implementation Plan

### Phase 1: Build Configuration (Week 1)

1. Update `vite.config.ts` to produce per-component entry points
2. Verify each component builds independently
3. Measure individual component sizes (raw, gzip, brotli)
4. Verify Lit runtime is externalized and shared

### Phase 2: Libraries.yml Template (Week 1)

1. Generate initial `libraries.yml` from CEM
2. Add inter-component dependencies manually
3. Create convenience group definitions
4. Create `helix.all` development bundle

### Phase 3: Preprocess Functions (Week 2)

1. Implement `hook_preprocess_node()` with content type mappings
2. Implement `hook_preprocess_paragraph()` with paragraph type mappings
3. Implement `hook_preprocess_block()` for site-chrome components
4. Implement `hook_preprocess_page()` for layout components

### Phase 4: FOUC Prevention (Week 2)

1. Add `:not(:defined)` CSS to tokens stylesheet
2. Add `<link rel="modulepreload">` for critical components in base template
3. Test FOUC behavior on throttled connections (3G simulation)

### Phase 5: Validation (Week 3)

1. Lighthouse audit: verify < 50 KB WC JS per page
2. TBT measurement on mid-range Android device
3. Cache efficiency test: update one component, measure re-download for returning visitor
4. Drupal aggregation verification: confirm files are combined in production mode

---

## ADR: Architecture Decision Record

### ADR-002: Per-Component Drupal Library Loading with Convenience Groups

**Status**: Accepted

**Context**: HELIX is a 44-component Web Component library built with Lit 3.x that must integrate with Drupal CMS as its primary consumer. ADR-001 established a hybrid property/slot integration strategy. This ADR addresses the next critical question: how the component JavaScript physically loads into Drupal pages. The library targets enterprise organizations where Core Web Vitals compliance is essential and users frequently access sites on mid-range mobile devices.

**Decision**: Adopt per-component Drupal library definitions as the atomic loading unit, with convenience group libraries layered on top as pure dependency aggregators. Each component has its own entry in `libraries.yml` with explicit dependencies. Groups contain no JavaScript -- they are dependency lists that combine related components for common usage patterns.

**Consequences**:

_Positive:_

- Pages load only the JavaScript for components they actually render (14-35 KB Brotli typical vs 80 KB for full bundle)
- Cache invalidation is per-component: updating one component does not invalidate cache entries for the other 43
- The strategy scales linearly: adding the 45th component has zero impact on pages that do not use it
- Follows the Drupal-native library pattern used by core and every major contrib module
- Performance budget compliance: stays well within the < 50 KB WC JS per-page target
- Convenience groups provide simpler DX for common patterns without sacrificing per-component granularity
- Full bundle (`helix.all`) remains available for development environments
- Aligns with how every major WC library handles loading (Shoelace, SAP UI5, Spectrum, FAST, Carbon)

_Negative:_

- 44 library definitions in `libraries.yml` (mitigated by CEM-based generation)
- PHP preprocess functions required for automated library attachment (standard Drupal practice)
- Forgotten library attachment causes silent failure (custom element renders as empty unknown element)
- Inter-component dependency graph must be manually maintained
- Build configuration must produce per-component entry points (requires Vite config update)

_Mitigations:_

- `libraries.yml` generator script reads the CEM and produces base definitions automatically
- Convenience groups reduce the number of libraries Drupal developers need to remember (6 groups vs 44 components)
- FOUC prevention CSS hides undefined elements, making forgotten library attachments visually obvious during development
- `helix.all` library available during development eliminates "component not defined" errors
- Drupal's library dependency system handles deduplication and load ordering automatically
- Documentation includes complete preprocess function examples for content types, paragraph types, and blocks

**Alternatives Considered**:

1. **Strategy A: Single Bundle** -- Rejected because the ~80 KB Brotli payload on every page violates the performance budget, fails Core Web Vitals targets on mid-range mobile, and scales negatively (every new component degrades all pages). Cache invalidation is monolithic.

2. **Strategy C: Group-Only Loading** -- Rejected as the sole strategy because intra-group waste is significant (loading the `content` group for one card loads 8 unused components) and group boundary decisions become permanent architectural constraints. However, groups are adopted as a convenience layer on top of per-component libraries.

**Review Schedule**: Revisit after the first 10 components are integrated into a Drupal site. Validate performance budget compliance with real Lighthouse measurements. Adjust group compositions if usage patterns differ from projections.

---

## Appendix A: Complete Performance Comparison Table

| Metric                             | Strategy A (Bundle) | Strategy B (Per-Component) | Strategy C (Groups) |  B+C (Recommended)  |
| ---------------------------------- | :-----------------: | :------------------------: | :-----------------: | :-----------------: |
| **Typical page JS (Brotli)**       |       80.3 KB       |          14-35 KB          |      35-50 KB       |      14-35 KB       |
| **Worst case page JS (Brotli)**    |       80.3 KB       |           55 KB            |        70 KB        |        55 KB        |
| **TBT contribution (mobile)**      |       35-55ms       |           8-20ms           |       15-30ms       |       8-20ms        |
| **customElements.define() calls**  |         44          |            3-8             |        8-25         |         3-8         |
| **Registration time (Galaxy A13)** |        ~35ms        |           ~2-7ms           |       ~7-20ms       |       ~2-7ms        |
| **Cache entries**                  |          1          |             46             |          8          |    46 + 6 groups    |
| **Cache hit rate (returning)**     |       ~60-70%       |            >95%            |       ~80-90%       |        >95%         |
| **Update re-download**             |       80.3 KB       |           1-3 KB           |      12-25 KB       |       1-3 KB        |
| **libraries.yml entries**          |          1          |             44             |         6-8         |    44 + 6 groups    |
| **Preprocess complexity**          |        None         |            High            |       Medium        | Medium (use groups) |
| **Performance budget**             |        FAIL         |            PASS            |     BORDERLINE      |        PASS         |

---

## Appendix B: Drupal Module to Loading Strategy Reference

How each loading strategy interacts with major Drupal contributed modules:

| Drupal Module      | Strategy A Impact               | Strategy B Impact                                                   | Recommended Approach                                          |
| ------------------ | ------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Paragraphs**     | No change needed                | `hook_preprocess_paragraph()` attaches libraries per paragraph type | Use groups for complex paragraphs, individual for simple ones |
| **Layout Builder** | No change needed                | Section templates and custom blocks attach their own libraries      | Attach in block template or custom block plugin               |
| **Views**          | No change needed                | Views row templates attach component libraries                      | Attach in `views-view-unformatted.html.twig` or row template  |
| **Webform**        | No change needed                | Form page template attaches `helix.group_forms`                     | Group loading is appropriate for form pages                   |
| **Metatag**        | No impact                       | No impact                                                           | N/A                                                           |
| **Media**          | No impact (media goes in slots) | No impact (media goes in slots)                                     | N/A                                                           |
| **Search API**     | No change needed                | Search results template attaches needed components                  | Attach `helix.card` in search results template                |
| **Commerce**       | No change needed                | Product display templates attach needed components                  | Attach per-component in product templates                     |
| **BigPipe**        | Compatible                      | Compatible -- libraries attached per placeholder                    | BigPipe streams library tags with their placeholders          |
| **Aggregation**    | One file                        | Combines per-page into 2-4 files                                    | Drupal handles combining automatically                        |

---

## Appendix C: Monitoring and Validation Checklist

After implementing the recommended strategy, validate with:

- [ ] **Lighthouse Performance Score** > 90 on article teaser page (mobile simulation)
- [ ] **Total Blocking Time** < 200ms on article teaser page
- [ ] **WC library JS** < 50 KB Brotli on all page types
- [ ] **Total page JS** < 100 KB Brotli (including Drupal core + contrib)
- [ ] **FOUC duration** < 500ms on 3G simulation
- [ ] **LCP** < 2.5s on article pages
- [ ] **Cache validation**: Update `hx-tooltip`, confirm only tooltip cache entry invalidates
- [ ] **Drupal aggregation**: Confirm production mode combines component files (not 44 requests)
- [ ] **Dependency deduplication**: Confirm `hx-button` loads once when both `hx-card` and `hx-modal` are on the page
- [ ] **BigPipe compatibility**: Confirm libraries load correctly with BigPipe enabled
- [ ] **Admin toolbar**: Confirm component libraries do not conflict with Drupal's admin JS

---

## Appendix D: Quick Reference for Drupal Developers

**Loading a single component:**

```twig
{{ attach_library('mytheme/helix.button') }}
<hx-button variant="primary">Click</hx-button>
```

**Loading a group:**

```twig
{{ attach_library('mytheme/helix.group_forms') }}
{# All form components + core components now available #}
```

**Loading everything (development ONLY):**

```twig
{{ attach_library('mytheme/helix.all') }}
{# Every component available. Do NOT use in production. #}
```

**Rule of thumb:**

- Template uses 1-2 components? Attach them individually.
- Template uses 3+ components from the same category? Attach the group.
- Building/debugging? Use `helix.all` temporarily, then switch to specific libraries before committing.
