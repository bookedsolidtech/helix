---
title: 'ADR: Component Loading'
description: Delivery strategy for HELiX components — single bundle, per-component files, or smart groups.
sidebar:
  order: 2
  label: Component Loading
  badge:
    text: ADR
    variant: tip
---

How do web components get delivered to each page? A single monolithic bundle, individual per-component files, or intelligent context-based groups? The right strategy means **fast first paint** and **zero wasted bytes**.

## Status

Accepted. **Hybrid groups** is the recommended default for Drupal consumers, with **per-component libraries** available for fine-grained pages.

## Context

The architecture decision does not stop at props vs. slots. How you physically load web component JavaScript into Drupal pages has direct impact on performance, cacheability, and maintainability.

HELiX ships as ES modules with per-component entry points. Drupal consumers declare libraries in `helix.libraries.yml` and attach them in Twig with `attach_library()`. Three strategies are possible.

## Strategies considered

### Single Bundle — "Load Everything"

One file containing every component. Simplest setup, worst per-page footprint.

- **Size per page:** ~220KB
- **First Contentful Paint impact:** Poor — every page downloads every component
- **Cache efficiency:** OK — bundle hash invalidates on any component change
- **Setup complexity:** Easy

```yaml
# Single bundle — every component in one file
helix:
  js:
    dist/helix.bundle.js: { minified: true }
  dependencies:
    - core/drupal
    - core/once
```

### Per-Component Libraries — "Surgical Loading"

Every component is its own library. Minimal per-page weight, more HTTP requests.

- **Size per page:** ~5-15KB
- **First Contentful Paint impact:** Excellent
- **Cache efficiency:** Good — only changed components invalidate
- **Setup complexity:** Medium — every component needs a library declaration

```yaml
# Per-component — surgical loading
helix/card:
  js:
    dist/components/hx-card.js: { minified: true }
  dependencies:
    - helix/lit-runtime

helix/button:
  js:
    dist/components/hx-button.js: { minified: true }
  dependencies:
    - helix/lit-runtime
```

### Hybrid Groups — "Smart Bundles" (recommended)

Components grouped by usage context: core, navigation, content, forms.

- **Size per group:** ~30-60KB
- **First Contentful Paint impact:** Great
- **Cache efficiency:** Excellent — ~90% cache hit rate after second page
- **Setup complexity:** Moderate — group boundaries must be maintained

```yaml
# Smart bundles — grouped by usage context
helix/core:
  js:
    dist/groups/core.js: { minified: true }
  # button, badge, spinner, avatar (~32KB)
  dependencies:
    - helix/lit-runtime

helix/navigation:
  js:
    dist/groups/navigation.js: { minified: true }
  # nav, breadcrumb, tabs, sidebar (~28KB)
  dependencies:
    - helix/core

helix/content:
  js:
    dist/groups/content.js: { minified: true }
  # card, hero, accordion, modal (~45KB)
  dependencies:
    - helix/core

helix/forms:
  js:
    dist/groups/forms.js: { minified: true }
  # text-input, select, checkbox, radio (~38KB)
  dependencies:
    - helix/core
```

## Performance comparison

| Metric | Single Bundle | Per-Component | Hybrid Groups |
| --- | --- | --- | --- |
| Initial page load | 220KB | 25KB | 60KB |
| HTTP requests | 1 | 3-8 | 2-3 |
| Cache hit rate (page 2) | 100% | ~60% | ~90% |
| FCP impact | Poor | Excellent | Great |

## Shared Lit runtime

All loading strategies share a single `helix/lit-runtime` library. Lit 3's runtime (~15KB gzipped) is loaded once and cached forever across every page that uses any HELiX component.

```yaml
# Shared Lit runtime — loaded once, cached forever
helix/lit-runtime:
  js:
    dist/vendor/lit-core.js: { minified: true }
  dependencies:
    - core/drupal
    - core/once
  # ~15KB gzipped — Lit 3 runtime
  # Cached across ALL pages after first load
```

## How per-component loading works in Drupal

1. **Content Editor** — creates a node with paragraph types (Card, Hero, etc.)
2. **Twig Template** — renders the component and attaches the library: `attach_library('helix/card')`
3. **Drupal Aggregation** — combines only the needed assets into optimised bundles
4. **Minimal JS Load** — browser downloads only `card.js` + `lit-runtime.js` (~18KB total, not 220KB)
5. **Custom Element Upgrade** — `customElements.define()` registers and upgrades elements in the DOM

### Twig integration

```twig
{# In paragraph--card.html.twig #}
{{ attach_library('helix/card') }}

<hx-card variant="elevated">
  <img slot="media" src="{{ image_url }}" />
  <h3 slot="heading">{{ title }}</h3>
  <div slot="body">{{ body }}</div>
</hx-card>

{# Drupal only loads hx-card.js + lit-runtime.js #}
{# Total: ~18KB for this page (not 220KB!) #}
```

## Decision

**Use hybrid groups as the default. Allow per-component overrides for fine-grained pages.**

Hybrid groups give 90%+ of the cache benefit of a single bundle while keeping initial page weight under 60KB. Per-component libraries remain available for pages where every byte counts (landing pages, AMP-style content).

## Consequences

### Positive

- **Predictable performance.** Hybrid groups produce stable bundle sizes that page-builders can reason about.
- **Cache locality.** Core components (button, badge) load on every page and stay hot in the browser cache.
- **Drupal-native.** `attach_library()` is the canonical Drupal pattern. No special tooling required.

### Negative

- **Group boundaries must be maintained.** As new components are added, the team must decide which group owns them. A bad placement can move a heavy component into a hot path.
- **Per-component overrides require library discipline.** Pages that need fine-grained loading must declare every component library explicitly.

## Real-world patterns

Three components, three composition strategies, one delivery model:

### Card (slot-driven)

```twig
<hx-card variant="elevated" interactive>
  <img slot="media"
    src="{{ file_url(image.uri) }}"
    alt="{{ image.alt }}"
    loading="lazy" />

  <h3 slot="heading">{{ title }}</h3>

  <p slot="body">{{ body|striptags|truncate(120) }}</p>

  <a slot="actions" href="{{ url }}">Read More &rarr;</a>
</hx-card>
```

### Button (property-driven)

```twig
<hx-button
  variant="primary"
  size="large"
  icon="arrow-right"
  icon-position="end"
  {% if is_disabled %}disabled{% endif %}
>
  {{ button_label }}
</hx-button>

{# Loading state example #}
<hx-button variant="primary" loading aria-busy="true">
  Submitting...
</hx-button>
```

### Text Input (hybrid)

```twig
<hx-text-input
  name="{{ field_name }}"
  type="{{ field_type }}"
  required
  pattern="{{ validation_pattern }}"
  maxlength="{{ max_length }}"
>
  <span slot="label">
    {{ field_label }}
    {% if required %}<abbr title="required">*</abbr>{% endif %}
  </span>
  <span slot="help">{{ field_description }}</span>
  <span slot="error">{{ error_message }}</span>
</hx-text-input>
```

## Related ADRs

- [Slots vs Props](/architecture/adrs/slots-vs-props/) — composition pattern shown in the Twig examples above.
- [Light DOM](/architecture/adrs/light-dom/) — light-DOM components share the same delivery model.

## References

- [Drupal: Adding stylesheets (CSS) and JavaScript (JS) to a Drupal theme](https://www.drupal.org/docs/develop/theming-drupal/adding-stylesheets-css-and-javascript-js-to-a-drupal-theme)
- [Drupal: Libraries API](https://www.drupal.org/docs/drupal-apis/javascript-api/libraries)
- [web.dev: Reduce JavaScript payloads with code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting)
