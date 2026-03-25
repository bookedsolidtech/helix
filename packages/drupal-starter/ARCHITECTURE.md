# Architecture — @helixui/drupal-starter

## Composition SDC Pattern

This package implements **Layer 2** of the HELiX-Drupal integration architecture:

```
Layer 1: @helixui/library          Web components (Shadow DOM, encapsulated)
Layer 2: @helixui/drupal-starter   Composition SDCs (light DOM, plain CSS)
Layer 3: Client themes             Client-specific compositions (private repos)
```

### Why Composition SDCs?

HELiX web components are atomic, framework-agnostic building blocks. Drupal needs higher-level patterns that:

1. Map to content types and field structures
2. Work with Drupal's rendering pipeline (Twig, render arrays)
3. Integrate with Layout Builder and Experience Builder (XB)
4. Use Drupal's library system for asset loading

Composition SDCs bridge this gap by composing multiple HELiX components into Drupal-native patterns.

### Light DOM vs Shadow DOM

HELiX components use Shadow DOM internally for style encapsulation. SDC templates render in the **light DOM** — they are regular Twig templates that output HELiX custom element tags.

This means:
- SDC CSS handles **layout only** (grid, flexbox, spacing between components)
- Component visual styling is handled by Shadow DOM inside each `hx-*` element
- No `:host` selectors, no `adoptedStyleSheets`, no shadow DOM APIs in SDC code

### Field Mapping

SDC props are designed to match Drupal field data, not HELiX component APIs:

```yaml
# SDC prop (Drupal field data)     -> HELiX component attribute
title: string                       -> <hx-text>{{ title }}</hx-text>
image_url: string (file URI)        -> <hx-image src="{{ image_url }}">
date: string (formatted date)       -> <hx-text>{{ date }}</hx-text>
categories: array of strings        -> {% for cat in categories %}<hx-badge>{{ cat }}</hx-badge>{% endfor %}
```

### Asset Loading

Each SDC declares its HELiX dependencies via `attach_library()`:

```twig
{{ attach_library('helixui/hx-card') }}
{{ attach_library('helixui/hx-text') }}
```

This maps to `helixui.libraries.yml` which points to `@helixui/library` dist files. Drupal's asset system handles deduplication — if multiple SDCs on a page both need `hx-card`, the JS is loaded only once.

### Drupal Behaviors

Interactive SDCs use Drupal behaviors with the `once()` pattern:

```javascript
Drupal.behaviors.helixuiCarousel = {
  attach: function (context) {
    once('helixui-carousel', '.views-carousel', context).forEach(function (el) {
      // Initialize component interaction
    });
  },
  detach: function (context, settings, trigger) {
    if (trigger === 'unload') {
      once.remove('helixui-carousel', '.views-carousel', context);
    }
  }
};
```

The `once()` pattern ensures behaviors run exactly once per element, even when Layout Builder re-renders previews or AJAX replaces page regions.

## SDC Directory Structure

```
components/{sdc-name}/
  {sdc-name}.component.yml    # Metadata, props, slots (JSON Schema)
  {sdc-name}.twig             # Twig template composing HELiX components
  {sdc-name}.css              # Layout-only plain CSS
```

### component.yml Schema

Uses the Drupal SDC metadata schema:

```yaml
$schema: 'https://git.drupalcode.org/project/drupal/-/raw/HEAD/core/assets/schemas/v1/metadata.schema.json'
name: Article Teaser
status: experimental
group: Node Display
props:
  type: object
  properties:
    title:
      type: string
      title: Title
slots:
  content:
    title: Content
```

### Layout Builder / XB Integration

SDCs are XB-compatible when:
- Props are typed in `component.yml` (string, integer, boolean, enum)
- Slots are declared for content regions
- The root element uses `{{ attributes.addClass() }}` for Drupal attribute injection

## Roadmap

### 0.2.0 (planned)

Additional SDC categories:
- Media (gallery, video-embed, audio-player)
- Data Display (stats-row, metric-card, comparison-table)
- Interactive (accordion-group, tab-panel, modal-trigger)
- Authentication (login-form, user-profile)

### Future

- CEM-to-Drupal generator for automatic `helixui.libraries.yml` generation
- Per-component CSS extraction from `@helixui/library` builds
- Visual regression testing against Drupal rendering
- Drupal recipe for one-click setup
