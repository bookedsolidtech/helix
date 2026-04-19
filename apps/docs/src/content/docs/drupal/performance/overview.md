---
title: Performance Overview
description: Performance strategies for HELiX components in Drupal — per-component vs full bundle loading, Drupal library dependencies for shared Lit runtime, cache strategies, HTTP/2, bundle sizes, and Core Web Vitals.
sidebar:
  order: 1
---

HELiX components are ES modules built on Lit. Loading them efficiently in Drupal requires understanding where the weight sits, how Drupal's library system interacts with ES modules, and which strategies match your site's deployment constraints.

---

## Bundle Size Reference — @helixui/library@3.0.0

These sizes are gzipped. Raw sizes are approximately 2.5–3× larger.

| Load strategy | Approximate gzipped size | When to use |
|---|---|---|
| Full bundle (`dist/index.js`) | ~38 KB | Prototypes, sites using 8+ components |
| Per-component (e.g., `hx-button`) | 3–6 KB per component | Production sites, page-specific loading |
| Lit runtime alone | ~12 KB | Shared dependency baseline |
| Tokens CSS (`@helixui/tokens@0.3.4`) | ~4 KB | Always load separately |

The full bundle CDN URL is:

```
https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js
```

Per-component CDN pattern:

```text
https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-button/index.js
https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-card/index.js
https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-text-input/index.js
```

---

## Per-Component vs Full Bundle Loading

### Full bundle — simplest, highest initial cost

Load all components at once from a single URL. Drupal attaches one library globally.

```yaml
# mytheme.libraries.yml
helix:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js:
      type: external
      preprocess: false
      attributes:
        type: module
        crossorigin: anonymous
```

```yaml
# mytheme.info.yml
libraries:
  - mytheme/helix
```

**Tradeoff:** Every page loads ~38 KB regardless of which components appear. Acceptable for component-dense applications. Unacceptable when most pages use only 1–2 components.

### Per-component loading — minimal, page-specific

Define a library per component and attach only what each template needs.

```yaml
# mytheme.libraries.yml
helix-button:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-button/index.js:
      type: external
      preprocess: false
      attributes:
        type: module
        crossorigin: anonymous

helix-card:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-card/index.js:
      type: external
      preprocess: false
      attributes:
        type: module
        crossorigin: anonymous

helix-text-input:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-text-input/index.js:
      type: external
      preprocess: false
      attributes:
        type: module
        crossorigin: anonymous
```

Attach in templates or preprocess:

```twig
{# node--article--teaser.html.twig #}
{{ attach_library('mytheme/helix-card') }}
{{ attach_library('mytheme/helix-button') }}
```

**Tradeoff:** More library definitions to maintain. HTTP/2 makes many small parallel requests cheap. Ideal for sites where different sections use different component sets.

---

## Shared Lit Runtime

Every HELiX component depends on Lit. When per-component files are loaded separately, each would normally include its own copy of Lit — duplicating ~12 KB across components.

### Approach 1: Use the shared runtime entry point

jsDelivr serves Lit as a shared module import. Because browsers cache ES modules by URL, the same Lit bundle is reused across all component imports when they reference the same URL:

```
https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/lit-runtime.js
```

Define it as a dependency:

```yaml
# mytheme.libraries.yml
helix-runtime:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/lit-runtime.js:
      type: external
      preprocess: false
      attributes:
        type: module
        crossorigin: anonymous

helix-button:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-button/index.js:
      type: external
      preprocess: false
      attributes:
        type: module
        crossorigin: anonymous
  dependencies:
    - mytheme/helix-runtime

helix-card:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-card/index.js:
      type: external
      preprocess: false
      attributes:
        type: module
        crossorigin: anonymous
  dependencies:
    - mytheme/helix-runtime
```

Drupal's library dependency system ensures `helix-runtime` loads only once even if multiple component libraries depend on it.

### Approach 2: npm build with shared chunk

If you build from npm (`@helixui/library`), your bundler can extract Lit as a shared chunk:

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('lit') || id.includes('@lit')) {
            return 'lit-runtime';
          }
        },
      },
    },
  },
};
```

This produces `dist/lit-runtime.js` and individual component files that import from it, achieving the same deduplication locally.

---

## Drupal Aggregation and ES Modules

Drupal's built-in JS aggregation concatenates files — a technique incompatible with ES modules. You must disable preprocessing for any HELiX library:

```yaml
helix-button:
  js:
    dist/hx-button.js:
      preprocess: false  # REQUIRED — aggregation breaks ES module imports
      minified: true
      attributes:
        type: module
```

Without `preprocess: false`, Drupal concatenates the module file with other scripts, breaking the `import`/`export` syntax at runtime.

---

## HTTP/2 and Multiple Small Files

HTTP/2 multiplexing allows many files to download in parallel over a single connection. This eliminates the HTTP/1.1 penalty for multiple requests and makes per-component loading viable without concatenation.

On HTTP/2 infrastructure, 10 component files of 4 KB each typically load faster than one file of 40 KB because:
- Downloads start simultaneously
- Each file is individually cacheable
- Browser caches individual components when only one changes

**Verify your Drupal server uses HTTP/2:**

```bash
curl -I --http2 https://your-site.com | grep -i "HTTP/"
```

### Module preload hints

Reduce waterfall latency by declaring component files in the `<head>` before the browser parses templates:

```php
/**
 * Implements hook_page_attachments().
 */
function mytheme_page_attachments(array &$attachments): void {
  // Preload components used on every page.
  $attachments['#attached']['html_head_link'][][] = [
    'rel' => 'modulepreload',
    'href' => 'https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/lit-runtime.js',
    'crossorigin' => 'anonymous',
  ];
}
```

---

## Cache Strategies

### Drupal render cache

Drupal's render cache stores rendered HTML for component-heavy regions. Tag caches with entity cache tags so they invalidate correctly:

```php
function build_article_card(NodeInterface $node): array {
  return [
    '#theme' => 'node',
    '#node' => $node,
    '#view_mode' => 'teaser',
    '#attached' => ['library' => ['mytheme/helix-card']],
    '#cache' => [
      'keys' => ['article-card', $node->id()],
      'contexts' => ['user.roles'],
      'tags' => $node->getCacheTags(),
      'max-age' => Cache::PERMANENT,
    ],
  ];
}
```

### Browser cache via versioned CDN URLs

jsDelivr URLs include the exact version number (`@1.1.2`). Browsers cache these with long-lived headers. A component update requires a new library version in Drupal's YAML — the URL changes, bypassing browser cache.

```yaml
# Old version — cached in browsers
helix-button:
  version: 1.1.1
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-button/index.js: ...

# New version — new URL, fresh download
helix-button:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-button/index.js: ...
```

### Drupal library version key

If serving local files, increment the `version` key to bust Drupal's cache-busting query string (`?v=1.1.2`):

```yaml
helix-button:
  version: 1.1.2  # Drupal appends ?v=1.1.2 to the script URL
  js:
    dist/hx-button.js:
      preprocess: false
      attributes:
        type: module
```

---

## Core Web Vitals Impact

| Metric | HELiX Consideration | Mitigation |
|---|---|---|
| **LCP** (Largest Contentful Paint) | Components upgrade asynchronously — LCP element may be unstyled briefly | Use `:not(:defined)` skeleton styles; prioritize loading components used above fold |
| **INP** (Interaction to Next Paint) | Component event handlers are attached after upgrade | Lit component upgrades are fast; avoid blocking main thread in `connectedCallback` |
| **CLS** (Cumulative Layout Shift) | Components with unknown dimensions before upgrade shift layout | Set explicit dimensions with CSS on the host element or use `contain: layout` |

### Preventing layout shift

```css
/* Set stable dimensions before the component upgrades */
hx-card {
  display: block;
  min-height: 200px;
}

hx-button {
  display: inline-block;
  min-width: 80px;
  min-height: 40px;
}
```

### Flash of unstyled content (FOUC)

HELiX components include `fouc.css` distributed with `@helixui/tokens`. Load it before component scripts:

```yaml
# mytheme.libraries.yml
helix-fouc:
  css:
    theme:
      https://cdn.jsdelivr.net/npm/@helixui/tokens@0.3.4/dist/fouc.css:
        type: external
  js: {}
```

Or use the `:not(:defined)` pattern:

```css
hx-button:not(:defined),
hx-card:not(:defined),
hx-text-input:not(:defined) {
  visibility: hidden;
}
```

---

## Route-Based Loading

Load component bundles only on routes that need them:

```php
/**
 * Implements hook_preprocess_page().
 */
function mytheme_preprocess_page(array &$variables): void {
  $route_name = \Drupal::routeMatch()->getRouteName();

  $route_library_map = [
    'entity.node.canonical' => 'mytheme/helix-content',
    'my_module.contact_form' => 'mytheme/helix-forms',
    'view.articles.page_1' => 'mytheme/helix-card',
  ];

  foreach ($route_library_map as $route => $library) {
    if (str_starts_with($route_name, $route)) {
      $variables['#attached']['library'][] = $library;
      $variables['#cache']['contexts'][] = 'route.name';
    }
  }
}
```

---

## Performance Checklist

Before deploying a Drupal site with HELiX components, verify:

- [ ] `preprocess: false` on all ES module library entries
- [ ] `type: module` attribute on all script entries
- [ ] Full bundle not loaded on pages that use only 1–2 components
- [ ] Shared Lit runtime loaded as a library dependency (not duplicated per component)
- [ ] HTTP/2 enabled on the production server
- [ ] `drush cr` run after any `.libraries.yml` change
- [ ] FOUC mitigation CSS loaded before component scripts
- [ ] Render cache tags set correctly on component-heavy regions
- [ ] CDN preconnect added for jsDelivr if using CDN delivery

---

## Related

- [Lazy Loading](/drupal/performance/lazy-loading/) — Intersection Observer and deferred loading patterns
- [Installation: CDN](/drupal/installation/cdn/) — CDN library setup in detail
- [Installation: npm](/drupal/installation/npm/) — Build pipeline setup
- [Theming](/drupal/theming/) — CSS custom property loading and FOUC prevention
