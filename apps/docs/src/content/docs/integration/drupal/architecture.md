---
title: Drupal Integration Architecture
description: The 3-layer pattern that connects HELiX web components to Drupal themes — Library, SDC wrapper, and Theme layer explained for Drupal developers.
sidebar:
  order: 2
---

HELiX integrates with Drupal through three distinct layers. Each layer has a clear responsibility. Understanding the boundary between them prevents the most common integration mistakes.

---

## The 3-Layer Pattern

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Drupal Theme                                  │
│  mytheme/templates/**/*.html.twig                       │
│  mytheme.libraries.yml                                  │
│  mytheme.theme (preprocess functions)                   │
│                                                         │
│  Responsibility: Content routing + asset attachment     │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Single Directory Components (SDC)             │
│  mytheme/components/hx-card/card.component.yml          │
│  mytheme/components/hx-card/card.html.twig              │
│                                                         │
│  Responsibility: Drupal-native API over the component   │
├─────────────────────────────────────────────────────────┤
│  Layer 1: HELiX Library (@helixui/library)              │
│  hx-button, hx-card, hx-text-input, ...                 │
│                                                         │
│  Responsibility: Component logic, styling, behavior     │
└─────────────────────────────────────────────────────────┘
```

---

## Layer 1: HELiX Library

The `@helixui/library` package ships 77 components built with Lit 3.x. Each component:

- Registers a custom element tag (`hx-button`, `hx-card`, etc.)
- Uses Shadow DOM for style encapsulation
- Exposes a public API of properties, slots, CSS custom properties, and custom events
- Implements WCAG 2.1 AA accessibility patterns
- Participates in native HTML forms where applicable (via `ElementInternals`)

**What this layer owns:** Everything inside the `#shadow-root`. The component's internal DOM, all styles, all JavaScript behavior.

**What this layer does not own:** Your content, your data, your Drupal rendering pipeline.

### How Web Components work in Drupal

Drupal's Twig engine is a server-side HTML renderer. When it encounters `<hx-button>`, it outputs that tag verbatim — the same way it would output `<div>` or `<section>`. The browser receives the HTML, parses it, and when the JavaScript loads, the custom element upgrades: it gains its Shadow DOM, styles, and behavior.

This means:

1. Content in slots is in the **light DOM** — visible to Drupal's rendering pipeline, screen readers, and search engines before JavaScript loads.
2. Component styling and behavior is in the **Shadow DOM** — encapsulated, not affected by theme CSS.
3. Progressive enhancement is built in — content is accessible before the JavaScript runs.

---

## Layer 2: Single Directory Components (SDC)

Drupal 10.1+ introduced [Single Directory Components](https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components). SDC provides a Drupal-native API wrapper around a web component.

The SDC layer is **optional** but recommended for teams that want:

- Type-safe prop validation via JSON Schema
- Component discovery in Storybook for Drupal
- Reusable Twig includes across multiple templates
- Separation between the component API and the Drupal theme layer

### SDC structure for an hx-card wrapper

```
mytheme/
└── components/
    └── card/
        ├── card.component.yml   # Schema + metadata
        ├── card.html.twig       # Twig template
        └── card.css             # (optional) light-DOM styles
```

**`card.component.yml`:**

```yaml
name: HELiX Card
status: stable
props:
  type: object
  properties:
    variant:
      type: string
      enum: [default, featured, compact]
      title: Card Variant
      default: default
    heading:
      type: string
      title: Heading Text
    href:
      type: string
      title: Link URL
slots:
  media:
    title: Media content (image, video)
  body:
    title: Body content
  actions:
    title: Action buttons or links
```

**`card.html.twig`:**

```twig
{{ attach_library('mytheme/helix_card') }}
<hx-card
  variant="{{ variant|default('default') }}"
  {% if heading %}heading="{{ heading }}"{% endif %}
  {% if href %}href="{{ href }}"{% endif %}
>
  {% if media %}
    <div slot="media">{{ media }}</div>
  {% endif %}
  {{ body }}
  {% if actions %}
    <div slot="actions">{{ actions }}</div>
  {% endif %}
</hx-card>
```

With this SDC defined, other templates can call it with `include`:

```twig
{% include 'mytheme:card' with {
  variant: 'featured',
  heading: node.label,
  href: url,
  media: content.field_image,
  body: content.body,
} only %}
```

---

## Layer 3: Drupal Theme Templates

Theme templates are where Drupal's rendering pipeline meets the component API. This layer:

- Receives variables from preprocess functions
- Attaches component libraries
- Maps Drupal field output into component properties and slots

### The cardinal rule: Drupal renders, components display

Drupal owns the content rendering pipeline. Never bypass it. Field formatters, image styles, text formats, and Media module output all pass through Drupal and land in component slots as rendered HTML.

```twig
{# node--article--teaser.html.twig #}
{{ attach_library('mytheme/helix_card') }}

<hx-card
  variant="default"
  heading="{{ label }}"
  href="{{ url }}"
>
  {{# Drupal's media formatter renders the <picture> element #}}
  <div slot="media">
    {{ content.field_hero_image }}
  </div>

  {{# Drupal's text formatter applies configured text format #}}
  {{ content.body }}

  {{# Drupal renders taxonomy term links #}}
  <div slot="meta">
    {{ content.field_tags }}
  </div>
</hx-card>
```

The `content.field_hero_image` variable contains the fully rendered output from Drupal's image formatter — a `<picture>` element with all responsive sources. It goes into the slot unchanged. Image styles, focal point settings, and lazy loading all work exactly as configured in Drupal.

---

## Shadow DOM Basics for Drupal Developers

Shadow DOM is the key concept that makes web components self-contained. Here is what it means in practice:

### What Shadow DOM controls

- **Internal structure** — The HTML inside the component (buttons, inputs, icons)
- **Styles** — All CSS written inside the component; does not leak out
- **Behavior** — Event listeners, focus management, ARIA patterns

### What Shadow DOM does not control

- **Slot content** — HTML you place inside `<hx-card>...</hx-card>` lives in the light DOM
- **CSS custom properties** — These pierce the Shadow DOM boundary (how theming works)
- **`::part()` selectors** — Exposed parts can be styled from outside

### What this means for your theme CSS

Your theme's CSS cannot accidentally override component internals. This is intentional. The component controls its own visual language. To customize component appearance, use CSS custom properties (design tokens):

```css
/* mytheme/css/tokens.css */
:root {
  --hx-color-primary: #0066cc;
  --hx-color-primary-hover: #0052a3;
  --hx-radius-md: 4px;
  --hx-font-family-base: 'Inter', sans-serif;
}
```

See [Theming](/integration/drupal/theming/) for complete token override patterns.

---

## Data Flow Diagram

The complete data flow from Drupal entity to rendered component:

```
Drupal Entity (Node, Term, Media)
       │
       ▼
Preprocess Function (hook_preprocess_node)
  - Sets variables
  - Resolves URLs
  - Formats dates
       │
       ▼
Twig Template (node--article--teaser.html.twig)
  - attach_library('mytheme/helix_card')
  - Maps variables to component attributes
  - Maps field output to slots
       │
       ▼ (server-rendered HTML)
<hx-card heading="Article Title" href="/article/1">
  <div slot="media"><picture>...</picture></div>
  <p>Article summary text</p>
</hx-card>
       │
       ▼ (browser: JS loads, component upgrades)
hx-card creates Shadow DOM
  - Applies component styles
  - Connects slots to shadow template
  - Attaches event listeners
       │
       ▼ (final render)
Fully styled, interactive card component
```

The critical insight: the content (`Article Title`, the `<picture>`, the `<p>`) is in the light DOM at every stage. It is accessible, searchable, and cacheable by Drupal before the component JavaScript ever loads.

---

## Key Architecture Principles

**1. Zero coupling**
Components work without any custom Drupal module. They are plain Web Components loaded via the standard Drupal library system.

**2. Properties for configuration, slots for content**
Pass scalar values (variant, size, href) as HTML attributes. Pass Drupal-rendered content (field output, media, body) as slot content.

**3. Progressive enhancement**
Content in slots is visible before JavaScript loads. Components enhance the experience; they do not gate it.

**4. Drupal cache compatibility**
Because content is in the light DOM and rendered server-side, Drupal's render cache and cache tags work without modification. No special cache handling required.

**5. CSS custom property theming**
The only mechanism for visual customization is CSS custom properties. This enforces a clean boundary: component logic in JavaScript, brand expression in tokens.

---

## Next Steps

- [Getting Started](/integration/drupal/getting-started/) — Install and render your first component
- [SDC Reference](/integration/drupal/sdc-reference/) — Complete SDC API and patterns
- [Theming](/integration/drupal/theming/) — CSS custom property overrides
- [Behaviors](/integration/drupal/behaviors/) — JavaScript lifecycle integration
