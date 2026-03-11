---
title: Library System Deep Dive
description: Comprehensive guide to Drupal's asset library system for HELIX web components
sidebar:
  order: 6
---

Drupal's asset library system is the foundation for loading and managing HELIX web components in your Drupal site. This deep dive covers the complete architecture, from basic library definitions to advanced optimization strategies and tree-shaking patterns.

## Overview: The Drupal Library System

Drupal's library system provides a declarative way to define, version, and load CSS and JavaScript assets. Libraries are defined in YAML files and attached to pages through themes, modules, or render arrays. This system enables:

- **Dependency management** - Automatic loading of required libraries
- **Version control** - Cache-busting and compatibility tracking
- **Aggregation** - Combining files for production performance
- **Conditional loading** - Load assets only when needed
- **Weight ordering** - Control execution order of scripts

For HELIX web components, the library system handles:

1. Loading ES modules with proper MIME types
2. Managing dependencies between components
3. Enabling tree-shaking for optimal bundle sizes
4. Providing version control for component updates
5. Supporting both CDN and npm distribution strategies

## The `.libraries.yml` File

Every Drupal theme and module can define libraries in a `THEMENAME.libraries.yml` or `MODULENAME.libraries.yml` file in the theme/module root directory.

### Basic Structure

```yaml
library-name:
  version: 1.0.0
  js:
    path/to/file.js: {}
  css:
    theme:
      path/to/file.css: {}
  dependencies:
    - core/drupal
```

**Key components:**

- **Library name** - Unique identifier within the theme/module namespace
- **Version** - Used for cache-busting and dependency tracking
- **js** - JavaScript file definitions
- **css** - CSS file definitions (categorized by type: base, layout, theme, component, state)
- **dependencies** - Other libraries that must load first

### File Path Resolution

File paths in `.libraries.yml` are relative to the theme/module root:

```yaml
helix-button:
  js:
    # Relative to theme root: themes/custom/mytheme/dist/js/hx-button.js
    dist/js/hx-button.js: {}
```

For external URLs (CDN):

```yaml
helix-cdn:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@latest/dist/helix.bundled.js:
      type: external
```

## Library Definition Syntax

### JavaScript Assets

Basic JavaScript file:

```yaml
library-name:
  js:
    js/script.js: {}
```

With options:

```yaml
library-name:
  js:
    js/script.js:
      minified: true
      preprocess: false
      attributes:
        defer: true
```

ES Module (required for HELIX components):

```yaml
helix-component:
  js:
    dist/js/hx-button.js:
      attributes:
        type: module
```

**Critical:** Web components built with Lit require `type: module` to load as ES modules. Without this attribute, the browser will fail to parse `import` statements.

### CSS Assets

CSS files are categorized by purpose:

```yaml
library-name:
  css:
    base:
      css/reset.css: {}
    layout:
      css/grid.css: {}
    component:
      css/button.css: {}
    theme:
      css/colors.css: {}
    state:
      css/print.css: { media: print }
```

**Categories determine load order:**

1. `base` - Resets, normalizers
2. `layout` - Grid systems, structural CSS
3. `component` - Component-specific styles
4. `theme` - Visual styling, colors, typography
5. `state` - Print styles, accessibility overrides

### External Assets

For CDN-hosted files:

```yaml
helix-cdn:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
        crossorigin: anonymous
```

**External asset options:**

- `type: external` - Required for all external URLs
- `minified: true` - Marks file as already minified (skip aggregation)
- `attributes` - HTML attributes for the `<script>` or `<link>` tag

## Dependencies Between Libraries

Dependencies ensure libraries load in the correct order.

### Basic Dependency

```yaml
helix-button:
  js:
    dist/js/hx-button.js:
      attributes:
        type: module
  dependencies:
    - core/once
    - mytheme/helix-core
```

**Syntax:** `namespace/library-name`

- `core/*` - Drupal core libraries
- `themename/*` - Theme libraries
- `modulename/*` - Module libraries

### Dependency Resolution

Drupal resolves dependencies recursively:

```yaml
# mytheme.libraries.yml

helix-core:
  js:
    dist/js/helix-core.js:
      attributes:
        type: module

helix-button:
  js:
    dist/js/hx-button.js:
      attributes:
        type: module
  dependencies:
    - mytheme/helix-core

helix-form:
  js:
    dist/js/hx-form.js:
      attributes:
        type: module
  dependencies:
    - mytheme/helix-button # Transitively loads helix-core
```

**Load order when `helix-form` is attached:**

1. `helix-core.js`
2. `hx-button.js`
3. `hx-form.js`

### Common Core Dependencies

Useful Drupal core libraries for HELIX integration:

```yaml
helix-behaviors:
  js:
    js/helix-behaviors.js: {}
  dependencies:
    - core/drupal # Drupal global object
    - core/drupalSettings # Settings from PHP
    - core/once # Run-once utility
    - core/jquery # jQuery (if needed)
```

**Best practice:** Minimize dependencies on `core/jquery`. Modern web components don't require jQuery.

## Version and Cache Control

### Version Property

```yaml
helix-button:
  version: 0.0.1
  js:
    dist/js/hx-button.js:
      attributes:
        type: module
```

**Version affects:**

- Cache-busting query strings (`hx-button.js?v=0.0.1`)
- Dependency resolution (Drupal checks version compatibility)
- Library replacement (modules can replace libraries with specific versions)

### Dynamic Versioning

Use `VERSION` placeholder for theme/module version:

```yaml
helix-button:
  version: VERSION # Replaced with theme version from .info.yml
  js:
    dist/js/hx-button.js:
      attributes:
        type: module
```

### Disabling Version Query Strings

For CDN assets with their own versioning:

```yaml
helix-cdn:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      version: -1 # Disable query string
      attributes:
        type: module
```

## Weight and Load Order

Control execution order with `weight`:

```yaml
helix-init:
  js:
    js/helix-init.js:
      weight: -10 # Load early
      attributes:
        type: module

helix-behaviors:
  js:
    js/helix-behaviors.js:
      weight: 0 # Default weight
  dependencies:
    - mytheme/helix-init
```

**Weight ranges:**

- `-100 to -1` - Early loading (polyfills, core utilities)
- `0` - Default (most libraries)
- `1 to 100` - Late loading (initialization, analytics)

**Best practice:** Prefer `dependencies` over `weight` for ordering. Dependencies are explicit and easier to reason about.

## Attributes and Extra Options

### Script Attributes

```yaml
helix-component:
  js:
    dist/js/hx-button.js:
      attributes:
        type: module
        async: true
        crossorigin: anonymous
        integrity: sha384-...
```

**Common attributes:**

- `type: module` - ES module (required for HELIX)
- `defer: true` - Defer execution until DOM ready
- `async: true` - Load asynchronously (use with caution for modules)
- `crossorigin: anonymous` - CORS mode for CDN assets
- `integrity: ...` - Subresource Integrity (SRI) hash

### Preprocess Flag

```yaml
helix-component:
  js:
    dist/js/hx-button.js:
      preprocess: false # Do not aggregate
      attributes:
        type: module
```

**When to set `preprocess: false`:**

- ES modules (Drupal aggregation doesn't support ES modules)
- Already-minified files
- CDN assets
- Files that break when concatenated

**HELIX rule:** Always set `preprocess: false` for web component files. ES modules cannot be safely aggregated.

### Minified Flag

```yaml
helix-component:
  js:
    dist/js/hx-button.min.js:
      minified: true
      preprocess: false
      attributes:
        type: module
```

`minified: true` tells Drupal the file is already minified, so it skips minification during aggregation.

## Tree-Shaking Pattern (Per-Component Libraries)

For optimal performance, define one library per component. This enables tree-shaking: only load components actually used on a page.

### Full-Bundle Approach (Simple, Larger)

```yaml
# mytheme.libraries.yml
helix-all:
  version: 0.0.1
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
      type: external
      minified: true
      preprocess: false
      attributes:
        type: module
```

**Pros:**

- Simple single-library setup
- One HTTP request
- All components available globally

**Cons:**

- Loads all components even if unused
- Larger initial bundle size
- No tree-shaking benefits

### Per-Component Approach (Optimized, Recommended)

```yaml
# mytheme.libraries.yml

helix-button:
  version: 0.0.1
  js:
    dist/js/hx-button.js:
      preprocess: false
      attributes:
        type: module

helix-card:
  version: 0.0.1
  js:
    dist/js/hx-card.js:
      preprocess: false
      attributes:
        type: module

helix-text-input:
  version: 0.0.1
  js:
    dist/js/hx-text-input.js:
      preprocess: false
      attributes:
        type: module
  dependencies:
    - mytheme/helix-form-base # Shared form utilities
```

**Pros:**

- Load only components used on the page
- Smaller initial bundles
- Better caching (component updates don't bust all caches)
- Explicit dependencies between components

**Cons:**

- More HTTP requests (mitigated by HTTP/2)
- More complex library definitions
- Requires build pipeline for per-component bundles

### Hybrid Approach (Practical)

```yaml
# mytheme.libraries.yml

# Core utilities and shared dependencies
helix-core:
  version: 0.0.1
  js:
    dist/js/helix-core.js:
      preprocess: false
      attributes:
        type: module

# Common component bundle (buttons, badges, alerts)
helix-common:
  version: 0.0.1
  js:
    dist/js/helix-common.js:
      preprocess: false
      attributes:
        type: module
  dependencies:
    - mytheme/helix-core

# Heavy components loaded on-demand
helix-data-table:
  version: 0.0.1
  js:
    dist/js/hx-data-table.js:
      preprocess: false
      attributes:
        type: module
  dependencies:
    - mytheme/helix-core

helix-chart:
  version: 0.0.1
  js:
    dist/js/hx-chart.js:
      preprocess: false
      attributes:
        type: module
  dependencies:
    - mytheme/helix-core
```

**Strategy:**

- `helix-core` - Shared base (design tokens, utilities)
- `helix-common` - Frequently-used components (bundle together)
- Individual libraries for heavy/specialized components

## Library Loading Strategies

### Strategy 1: Global Theme Library

Load HELIX on every page via theme attachment:

```yaml
# mytheme.info.yml
name: My Theme
type: theme
core_version_requirement: ^10 || ^11
libraries:
  - mytheme/helix-common # Loaded on every page
```

**Use when:**

- Components are used site-wide (headers, footers, navigation)
- Consistent page-to-page experience
- Small bundle size (<50KB)

### Strategy 2: Conditional Attachment

Load HELIX only on specific pages/content types:

```php
// mytheme.theme

/**
 * Implements hook_preprocess_node().
 */
function mytheme_preprocess_node(&$variables) {
  // Attach HELIX card library only for article nodes
  if ($variables['node']->getType() === 'article') {
    $variables['#attached']['library'][] = 'mytheme/helix-card';
  }
}
```

**Use when:**

- Components are page-specific (dashboards, forms)
- Heavy components not needed globally
- Optimizing for page speed

### Strategy 3: Component-Driven Attachment

Attach libraries via Twig templates:

```twig
{# templates/components/card.html.twig #}
{{ attach_library('mytheme/helix-card') }}

<hx-card variant="{{ variant }}" elevation="{{ elevation }}">
  <span slot="heading">{{ title }}</span>
  {{ body }}
</hx-card>
```

**Use when:**

- Using Single Directory Components (SDC)
- Component-level encapsulation
- Template-driven architecture

### Strategy 4: Render Array Attachment

Attach libraries programmatically in render arrays:

```php
// In a controller or custom block plugin

$build = [
  '#type' => 'container',
  '#attached' => [
    'library' => [
      'mytheme/helix-button',
      'mytheme/helix-card',
    ],
  ],
  '#markup' => '<hx-button variant="primary">Click Me</hx-button>',
];

return $build;
```

**Use when:**

- Building render arrays in PHP
- Custom blocks or controllers
- Dynamic library attachment based on conditions

## Performance Optimization

### HTTP/2 Considerations

With HTTP/2 multiplexing, multiple small files are often faster than one large bundle:

```yaml
# Optimized for HTTP/2 - many small libraries
helix-button:
  js:
    dist/js/hx-button.js: { preprocess: false, attributes: { type: module } }

helix-card:
  js:
    dist/js/hx-card.js: { preprocess: false, attributes: { type: module } }

helix-badge:
  js:
    dist/js/hx-badge.js: { preprocess: false, attributes: { type: module } }
```

**Benefits:**

- Parallel downloads
- Better caching granularity
- True tree-shaking

**Requirements:**

- HTTP/2 enabled on server
- CDN with HTTP/2 support
- Modern browser (all evergreens support HTTP/2)

### Preload Critical Components

Use resource hints for critical components:

```yaml
helix-button:
  js:
    dist/js/hx-button.js:
      preprocess: false
      attributes:
        type: module
  header: true # Add to <head> instead of before </body>
```

Or via `html.html.twig`:

```twig
<link rel="modulepreload" href="/themes/custom/mytheme/dist/js/hx-button.js">
```

### Cache Strategy

Drupal's library system integrates with its cache system:

1. **Development** - Disable caching (`sites/default/services.yml`)

   ```yaml
   parameters:
     twig.config:
       debug: true
       auto_reload: true
       cache: false
   ```

2. **Production** - Enable aggregation and caching
   - Admin → Performance → "Aggregate JavaScript files"
   - Set `version` in `.libraries.yml` to bust caches on updates

3. **CDN** - Use versioned URLs for immutable caching
   ```yaml
   helix-cdn:
     js:
       https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/helix.bundled.js:
         type: external
         minified: true
   ```

### Bundle Size Monitoring

Monitor per-component bundle sizes:

```bash
# In your theme build process
ls -lh dist/js/hx-*.js | awk '{print $5, $9}'
```

**HELIX targets:**

- <5KB per component (minified + gzipped)
- <50KB total bundle (all components)

## Complete Examples

### Example 1: hx-button Library (CDN)

```yaml
# mytheme.libraries.yml

helix-button-cdn:
  version: 0.0.1
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@0.0.1/dist/components/hx-button.js:
      type: external
      minified: true
      preprocess: false
      attributes:
        type: module
        crossorigin: anonymous
```

**Usage in Twig:**

```twig
{{ attach_library('mytheme/helix-button-cdn') }}

<hx-button variant="primary" hx-size="lg">
  Submit Form
</hx-button>
```

### Example 2: hx-button Library (npm Build)

```yaml
# mytheme.libraries.yml

helix-button:
  version: VERSION # Uses theme version from .info.yml
  js:
    dist/js/hx-button.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - core/once
```

**Theme build process (package.json):**

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch"
  },
  "dependencies": {
    "@helixui/library": "^0.0.1"
  }
}
```

**Vite config (vite.config.js):**

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist/js',
    lib: {
      entry: {
        'hx-button': 'node_modules/@helixui/library/src/components/hx-button/index.js',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['lit'],
    },
  },
});
```

### Example 3: hx-card Library (Full-Featured)

```yaml
# mytheme.libraries.yml

helix-card:
  version: 0.0.1
  js:
    dist/js/hx-card.js:
      minified: true
      preprocess: false
      weight: 0
      attributes:
        type: module
  dependencies:
    - mytheme/helix-core
    - core/once
```

**With Drupal Behaviors:**

```yaml
# mytheme.libraries.yml

helix-card:
  version: 0.0.1
  js:
    dist/js/hx-card.js:
      minified: true
      preprocess: false
      attributes:
        type: module
    js/helix-card-behavior.js: {} # Drupal behavior
  dependencies:
    - mytheme/helix-core
    - core/drupal
    - core/once
```

**Behavior file (js/helix-card-behavior.js):**

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixCard = {
    attach(context) {
      once('helix-card-init', 'hx-card[hx-href]', context).forEach((card) => {
        card.addEventListener('hx-card-click', (e) => {
          const { url } = e.detail;

          // Optional: Integrate with Drupal's AJAX system
          if (card.hasAttribute('data-use-ajax')) {
            e.preventDefault();
            // Trigger AJAX request
            Drupal.ajax({ url }).execute();
          } else {
            // Normal navigation
            window.location.href = url;
          }
        });
      });
    },
  };
})(Drupal, once);
```

**Twig template usage:**

```twig
{# templates/content/node--article--teaser.html.twig #}
{{ attach_library('mytheme/helix-card') }}

<hx-card
  variant="featured"
  elevation="raised"
  hx-href="{{ url }}"
>
  <img slot="image" src="{{ content.field_image }}" alt="{{ content.field_image.alt }}">
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
  <div slot="footer">
    <time datetime="{{ node.createdtime }}">{{ node.createdtime|date('M j, Y') }}</time>
  </div>
</hx-card>
```

### Example 4: Complete Theme Library Set

```yaml
# mytheme.libraries.yml

# Core design tokens and utilities
helix-core:
  version: 0.0.1
  js:
    dist/js/helix-core.js:
      minified: true
      preprocess: false
      attributes:
        type: module

# Common UI components (bundled for performance)
helix-common:
  version: 0.0.1
  js:
    dist/js/helix-common.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - mytheme/helix-core
    - core/once

# Individual form components
helix-text-input:
  version: 0.0.1
  js:
    dist/js/hx-text-input.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - mytheme/helix-core

helix-select:
  version: 0.0.1
  js:
    dist/js/hx-select.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - mytheme/helix-core

helix-checkbox:
  version: 0.0.1
  js:
    dist/js/hx-checkbox.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - mytheme/helix-core

# Form bundle (all form components)
helix-forms:
  dependencies:
    - mytheme/helix-text-input
    - mytheme/helix-select
    - mytheme/helix-checkbox
    - mytheme/helix-radio-group
    - mytheme/helix-textarea
    - mytheme/helix-switch

# Heavy components (load on-demand)
helix-data-table:
  version: 0.0.1
  js:
    dist/js/hx-data-table.js:
      minified: true
      preprocess: false
      attributes:
        type: module
  dependencies:
    - mytheme/helix-core
```

**Conditional attachment in theme:**

```php
// mytheme.theme

function mytheme_preprocess_page(&$variables) {
  // Always load common components
  $variables['#attached']['library'][] = 'mytheme/helix-common';

  // Load form components on specific paths
  $route_match = \Drupal::routeMatch();
  if ($route_match->getRouteName() === 'node.add' ||
      $route_match->getRouteName() === 'node.edit') {
    $variables['#attached']['library'][] = 'mytheme/helix-forms';
  }

  // Load data table on views pages
  if ($route_match->getRouteName() === 'view.patients.page_1') {
    $variables['#attached']['library'][] = 'mytheme/helix-data-table';
  }
}
```

## Troubleshooting

### Components Not Loading

**Symptom:** `<hx-button>` renders as plain text, no styling

**Check:**

1. Library attached? `{{ attach_library('mytheme/helix-button') }}`
2. `type: module` attribute present in `.libraries.yml`?
3. File path correct? Check browser DevTools Network tab
4. Drupal cache cleared? `drush cr`

### Module Loading Errors

**Symptom:** Console error: `Uncaught SyntaxError: Cannot use import statement outside a module`

**Fix:** Add `type: module` attribute:

```yaml
helix-button:
  js:
    dist/js/hx-button.js:
      attributes:
        type: module # Required!
```

### Dependency Load Order Issues

**Symptom:** `ReferenceError: Drupal is not defined`

**Fix:** Add `core/drupal` dependency:

```yaml
helix-behavior:
  js:
    js/helix-behavior.js: {}
  dependencies:
    - core/drupal # Ensures Drupal object is available
```

### Cache Issues

**Symptom:** Changes to `.libraries.yml` not reflected on site

**Fix:** Clear Drupal caches:

```bash
drush cr
# Or via UI: Admin → Configuration → Performance → "Clear all caches"
```

### Aggregation Breaking Modules

**Symptom:** Works in development, breaks in production with aggregation enabled

**Fix:** Set `preprocess: false` for ES modules:

```yaml
helix-button:
  js:
    dist/js/hx-button.js:
      preprocess: false # Do not aggregate
      attributes:
        type: module
```

## Best Practices Summary

1. **Always use `type: module`** for HELIX component libraries
2. **Set `preprocess: false`** for all ES modules (Drupal can't aggregate them safely)
3. **Use semantic versioning** - Increment `version` on updates to bust caches
4. **Prefer dependencies over weight** - Explicit dependencies are clearer
5. **Tree-shake with per-component libraries** - Load only what's needed
6. **Use HTTP/2** - Multiple small files outperform large bundles
7. **Monitor bundle sizes** - Keep components <5KB, total bundle <50KB
8. **Cache aggressively** - Version your assets for long-term caching
9. **Test with aggregation enabled** - Catch production issues early
10. **Document custom libraries** - Comment complex dependency chains

## Additional Resources

- [Drupal.org: Adding Stylesheets (CSS) and JavaScript (JS) to a Drupal Module](https://www.drupal.org/docs/theming-drupal/adding-assets-css-js-to-a-drupal-theme-via-librariesyml)
- [Drupal.org: Attaching Libraries](https://www.drupal.org/docs/8/creating-custom-modules/adding-stylesheets-css-and-javascript-js-to-a-drupal-8-module#attach-library-specific)
- [HELIX Installation Guide](/drupal-integration/installation/)
- [HELIX Twig Integration](/drupal-integration/twig/)
- [HELIX Behaviors](/drupal-integration/behaviors/)

---

**Related Documentation:**

- [Drupal Integration Overview](/drupal-integration/overview/)
- [Installation Methods](/drupal-integration/installation/)
- [Twig Template Patterns](/drupal-integration/twig/)
- [Drupal Behaviors Integration](/drupal-integration/behaviors/)
- [Troubleshooting](/drupal-integration/troubleshooting/)
