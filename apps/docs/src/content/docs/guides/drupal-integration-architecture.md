---
title: Drupal Integration Architecture
description: 'Architecture decision record: Component control vs Drupal control strategy for the HELIX library'
---

> **ADR Status**: Accepted
> **Decision Date**: 2026-02-13
> **Decision Makers**: Principal Engineer, Senior Frontend Engineer, Drupal Technical Lead
> **Supersedes**: None
> **Last Reviewed**: 2026-02-13

This document records the single most consequential architectural decision for the HELIX project: **where control lives between the Web Component library and the Drupal CMS that consumes it**. Every component API, every TWIG template pattern, every testing strategy, and every future portability story flows from this decision. Getting it wrong means rewriting the library. Getting it right means the Drupal team integrates in hours instead of weeks.

---

## The Fundamental Question

When a Drupal site renders a page that contains HELIX components, two systems collaborate to produce the final HTML. The question is: **which system is authoritative over content and layout?**

```
                    THE CONTROL SPECTRUM

  Component Controls                          Drupal Controls
  (Property-Driven)                           (Slot-Driven)
  <---------------------------------------------------->
       |                    |                      |
   Strategy A          Strategy C             Strategy B
   "Smart Component"   "Right Tool for      "Smart CMS"
                        the Job"
```

The answer is not binary. It is a spectrum, and different components belong at different points along it. But we must establish clear principles, not leave it to each developer's intuition.

---

## Strategy A: "Component Controls" (Property-Driven)

In this approach, the Web Component accepts data exclusively through HTML attributes and properties. The component owns all rendering logic: layout, formatting, conditional display, and visual presentation.

### How It Works

```twig
{# Drupal passes flat data. Component does everything else. #}
<wc-content-card
  heading="{{ node.label }}"
  summary="{{ node.field_summary.value }}"
  category="{{ node.field_category.entity.label }}"
  href="{{ path('entity.node.canonical', {'node': node.id}) }}"
  publish-date="{{ node.getCreatedTime()|date('c') }}"
  read-time="{{ node.field_read_time.value }}"
  hero-image-src="{{ file_url(node.field_hero_image.entity.fileuri) }}"
  hero-image-alt="{{ node.field_hero_image.alt }}"
  author-name="{{ node.field_author.entity.field_display_name.value }}"
  variant="{{ node.isPromoted() ? 'featured' : 'default' }}"
></wc-content-card>
```

The component receives scalar values and renders its own internal structure. Drupal's TWIG template is a thin data-mapping layer.

### Strengths

| Strength                     | Explanation                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rendering consistency**    | The component always renders identically regardless of which CMS passes the data. No risk of Drupal themer accidentally breaking the card layout. |
| **Portability**              | The same `<wc-content-card>` works in Drupal, React, Vue, static HTML, or any other system that can set HTML attributes.                          |
| **Encapsulated logic**       | Date formatting, truncation, conditional rendering, responsive behavior -- all live inside the component. One source of truth.                    |
| **Simpler TWIG templates**   | The Drupal template is a flat attribute mapping. No complex nesting, no slot management, no wrapper divs.                                         |
| **Easier automated testing** | Pass properties, assert rendered output. No need to simulate slotted content from an external template engine.                                    |
| **Storybook parity**         | Storybook stories match production exactly because both pass the same properties.                                                                 |

### Weaknesses

| Weakness                             | Explanation                                                                                                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Drupal module incompatibility**    | Drupal's Paragraphs, Layout Builder, Media, and Views all output rendered HTML fragments. A property-driven component cannot accept those fragments -- it needs raw data extracted from them. This breaks Drupal's rendering pipeline.      |
| **Content editor blindness**         | In Drupal's admin UI, editors work with fields that produce rendered HTML. If the component ignores that HTML and re-renders from scalar data, editors cannot preview what the component will look like without visiting the front end.     |
| **Attribute explosion**              | Complex content (author with name, avatar, bio, and link) requires many attributes: `author-name`, `author-avatar`, `author-bio`, `author-url`. This becomes unwieldy at 15+ attributes.                                                    |
| **Drupal field formatter bypass**    | Drupal field formatters (image styles, text formats, link renderers) produce HTML. A property-driven component that takes `hero-image-src` bypasses the image style system entirely -- the TWIG template must manually extract the raw URL. |
| **Drupal render cache invalidation** | Drupal's render cache works at the field level. Bypassing field rendering to extract raw values can break cache invalidation and lead to stale content.                                                                                     |
| **JSON serialization burden**        | For structured data (navigation trees, author objects, tag lists), the Drupal theme must serialize data to JSON attributes, requiring preprocess hooks or custom TWIG extensions -- work that Drupal's rendering pipeline already handles.  |

### When Strategy A Breaks Down: A Real Example

Consider a Drupal site using the Media module with responsive image styles. Drupal's `content.field_hero_image` renders as:

```html
<picture>
  <source
    srcset="/files/styles/hero_wide/anxiety.webp"
    media="(min-width: 1200px)"
    type="image/webp"
  />
  <source
    srcset="/files/styles/hero_medium/anxiety.webp"
    media="(min-width: 768px)"
    type="image/webp"
  />
  <img
    src="/files/styles/hero_small/anxiety.jpg"
    alt="Therapist with patient"
    loading="lazy"
    width="800"
    height="450"
  />
</picture>
```

A property-driven component with `hero-image-src` would need the TWIG template to extract a single URL, losing all the responsive image magic that Drupal's Media module provides. The slot-driven approach simply passes `{{ content.field_hero_image }}` into a `media` slot and gets all of it for free.

---

## Strategy B: "Drupal Controls" (Slot-Driven)

In this approach, the Web Component provides structural scaffolding and styling through named slots. Drupal owns the content -- it renders fields, media, paragraphs, and views normally, then projects that rendered HTML into component slots.

### How It Works

```twig
{# Drupal renders content normally. Component provides structure and style. #}
<wc-content-card
  variant="{{ node.isPromoted() ? 'featured' : 'default' }}"
  href="{{ path('entity.node.canonical', {'node': node.id}) }}"
>
  {# Drupal's media system handles responsive images, WebP, lazy loading #}
  <div slot="media">
    {{ content.field_hero_image }}
  </div>

  {# Drupal renders the heading with any configured text format #}
  <h3 slot="heading">{{ label }}</h3>

  {# Drupal renders the summary through its configured field formatter #}
  <div slot="body">
    {{ content.field_summary }}
  </div>

  {# Drupal's tag field formatter handles entity references #}
  <div slot="meta">
    {{ content.field_tags }}
    {{ content.field_publish_date }}
  </div>

  {# Drupal handles author entity rendering #}
  {% if content.field_author|render|trim is not empty %}
    <div slot="author">
      {{ content.field_author }}
    </div>
  {% endif %}

  <div slot="actions">
    <wc-button variant="text" href="{{ path('entity.node.canonical', {'node': node.id}) }}">
      {{ 'Read More'|t }}
    </wc-button>
  </div>
</wc-content-card>
```

### Strengths

| Strength                                  | Explanation                                                                                                                                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Full Drupal module compatibility**      | Layout Builder, Paragraphs, Media, Views, Webform -- all output HTML. Slots accept HTML. There is no impedance mismatch.                                                                           |
| **Preserves Drupal's rendering pipeline** | Field formatters, image styles, text formats, entity rendering, render caching -- all work as Drupal intends. Nothing is bypassed.                                                                 |
| **Content editor experience**             | Editors see the actual rendered content in Drupal's admin because the content goes through normal field rendering. Layout Builder preview works because the slotted content is real Drupal output. |
| **Drupal cache compatibility**            | Drupal's render cache and cache tags work correctly because fields render through the standard pipeline. Cache invalidation works as expected.                                                     |
| **Reduced attribute count**               | Complex content areas (author bios, media, tag lists) are handled by slots instead of 10+ attributes. The component's attribute API stays lean.                                                    |
| **Progressive enhancement**               | Before JavaScript loads, slotted content is visible in the light DOM as plain HTML. Users see real content immediately.                                                                            |

### Weaknesses

| Weakness                        | Explanation                                                                                                                                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Less portable**               | The component's rendering depends on what Drupal puts in the slots. In Storybook, you must simulate Drupal's output. In React, you must compose JSX children. The component is not self-contained.         |
| **Inconsistency risk**          | Different Drupal sites (or different templates on the same site) can put different HTML structures into the same slot. The component cannot guarantee visual consistency without CSS defensive strategies. |
| **Thinner components**          | Components do less work. They are primarily CSS containers with slot projection. This can feel like the component library adds less value.                                                                 |
| **More complex TWIG templates** | Slot management requires wrapper elements (`<div slot="media">`), conditional checks for empty fields, and knowledge of which slots the component exposes.                                                 |
| **Harder to test in isolation** | Testing requires providing realistic slotted content that mimics Drupal's output. Unit tests must compose light DOM children.                                                                              |
| **Slot naming contract**        | The component and every Drupal template must agree on slot names. Renaming a slot is a breaking change across all consuming templates.                                                                     |

---

## Strategy C: Hybrid Approach (The Recommendation)

Neither extreme is correct. The right answer depends on the **nature of each component** -- specifically, where it sits in the atomic design hierarchy and what kind of content it manages.

### The Governing Principle

> **Use properties for data. Use slots for content.**
>
> If it is a scalar value (string, number, boolean, enum) that maps to a single Drupal field value, pass it as an attribute. If it is rendered HTML that Drupal's field system produces, project it through a slot.

This principle naturally maps to the atomic design hierarchy:

```
ATOMS (Property-Dominant)
  Properties carry the full API.
  Slots are minimal (default slot for text children).
  Self-contained. Portable. Predictable.

MOLECULES (Balanced Mix)
  Properties for configuration and scalar data.
  Slots for the content areas that Drupal renders.
  Some internal logic, some content projection.

ORGANISMS (Slot-Dominant)
  Properties for configuration only (variant, layout mode).
  Slots carry all content. Drupal owns the content pipeline.
  Structural containers. CSS scaffolding.

TEMPLATES (Slot-Only)
  Properties for layout configuration.
  Slots define page regions. Drupal fills them.
  Pure layout. Zero content knowledge.
```

### Why This Works for Healthcare Drupal

Healthcare organizations use Drupal precisely because of its content model. Content types, fields, view modes, Paragraphs, Layout Builder, Media, Views -- these are not optional add-ons. They are the core of how healthcare content teams operate. The hybrid approach respects this reality:

1. **Atoms** (buttons, badges, icons) have no Drupal content pipeline dependency. They are self-contained UI primitives. Properties are the natural API.

2. **Organisms** (cards, heroes, article layouts) wrap Drupal-rendered content. The content passes through Drupal's field formatters, image styles, text formats, and render cache. Slots preserve this pipeline.

3. **Form elements** sit at a unique intersection: they must participate in Drupal's Form API via `ElementInternals` (properties for `name`, `required`, `type`) while also accepting Drupal-rendered labels and help text (slots for `label`, `help`, `error`).

---

## Decision Matrix

The following matrix evaluates each strategy across the eight dimensions that matter most for this project.

### Scoring Key

- **5** = Excellent fit, no compromises
- **4** = Good fit, minor trade-offs
- **3** = Acceptable, notable trade-offs
- **2** = Problematic, significant workarounds needed
- **1** = Dealbreaker, fundamentally incompatible

### Matrix

| Dimension                          | Strategy A (Property) | Strategy B (Slot) | Strategy C (Hybrid) |  Weight  |
| ---------------------------------- | :-------------------: | :---------------: | :-----------------: | :------: |
| **1. Drupal Module Compatibility** |           2           |         5         |          5          | Critical |
| **2. Content Editor Experience**   |           2           |         5         |          4          |   High   |
| **3. Developer Experience (TWIG)** |           4           |         3         |          4          |   High   |
| **4. Portability**                 |           5           |         2         |          4          |  Medium  |
| **5. Long-term Viability**         |           4           |         3         |          5          |  Medium  |
| **6. Accessibility**               |           4           |         3         |          5          | Critical |
| **7. Performance**                 |           3           |         4         |          4          |   High   |
| **8. Testing**                     |           5           |         3         |          4          |  Medium  |
| **Weighted Score**                 |        **2.9**        |      **3.6**      |       **4.4**       |          |

### Dimension Analysis

#### 1. Drupal Module Compatibility (Critical)

**Strategy A: 2/5** -- Layout Builder renders blocks as HTML fragments. Paragraphs render paragraph entities as HTML. Media renders responsive images as `<picture>` elements. Views renders entity lists as HTML. A property-driven API requires extracting raw data from these systems, often through preprocess hooks or custom TWIG extensions. This creates a parallel rendering pipeline that duplicates Drupal's work and introduces cache invalidation bugs.

**Strategy B: 5/5** -- Drupal's output goes directly into slots. No extraction, no parallel pipeline, no cache issues. Layout Builder sections map to component slots. Paragraph output goes into the default slot. Media fields render normally into media slots. Views output can be slotted into grid components.

**Strategy C: 5/5** -- Organisms use slots for Drupal content, preserving full module compatibility. Atoms use properties for their simple scalar APIs, which have no Drupal module dependency.

#### 2. Content Editor Experience (High)

**Strategy A: 2/5** -- Editors configure fields in Drupal's admin UI. If the component re-renders from raw data (not Drupal's rendered output), the editor cannot preview the final result in Drupal's admin. Layout Builder's inline preview mode shows the raw field values, not the component's rendered output. This is disorienting for non-technical content editors.

**Strategy B: 5/5** -- Drupal renders the fields. Layout Builder preview shows actual content because it is Drupal's own output. Editors see what they configured. WYSIWYG content appears as formatted HTML.

**Strategy C: 4/5** -- Most visible content (cards, heroes, articles) uses slots, so editor preview works. Atoms (buttons, badges) are property-driven but are typically configured by developers in templates, not by editors. Minor gap for property-driven elements in Layout Builder custom blocks.

#### 3. Developer Experience -- TWIG Authoring (High)

**Strategy A: 4/5** -- Clean, flat templates. Each attribute maps to one Drupal field value. Easy to read. But complex components require 15+ attributes, and extracting raw values from entity references requires Drupal preprocess knowledge.

**Strategy B: 3/5** -- Slot management adds verbosity. Wrapper `<div slot="name">` elements are visual noise. Conditional slot rendering (`{% if content.field|render|trim is not empty %}`) is a common TWIG pattern but adds template complexity. However, the Drupal developer does not need preprocess hooks -- standard TWIG works.

**Strategy C: 4/5** -- Atoms are clean attribute mappings. Organisms use slots but follow documented patterns. Developers know: simple component = attributes, complex component = slots. Predictable mental model.

#### 4. Portability (Medium)

**Strategy A: 5/5** -- Component works anywhere. Pass properties, get output. No dependency on external HTML structure.

**Strategy B: 2/5** -- Component depends on external content for slots. In React, you compose JSX children. In Vue, you use template slots. In static HTML, you write the slotted content by hand. Each consumer must understand the slot contract and provide appropriate content.

**Strategy C: 4/5** -- Atoms are fully portable. Organisms require slot content but follow Web Component slot standards that every framework supports. Storybook stories compose slot content in `render()` functions. The contract is documented in the Custom Elements Manifest.

#### 5. Long-term Viability (Medium)

**Strategy A: 4/5** -- If the project expands to non-Drupal consumers, property-driven components are easier to adopt. But the Drupal integration friction may limit initial adoption, reducing the chance of long-term survival.

**Strategy B: 3/5** -- Heavily optimized for Drupal. If the library expands to React or Vue consumers, the slot-heavy design requires those consumers to compose children in their own idiom. Not a dealbreaker (Web Component slots are standard), but adds friction.

**Strategy C: 5/5** -- Atoms are portable to any system. Organisms are optimized for Drupal but work in any system that supports Web Component slots (all modern frameworks do). The hybrid allows the library to evolve: add more property-driven atoms for portability, keep slot-driven organisms for CMS integration. No rewrite needed.

#### 6. Accessibility (Critical)

**Strategy A: 4/5** -- The component controls all ARIA attributes, focus management, and keyboard navigation internally. This is reliable but means the component must handle every a11y concern for slotted content types it cannot anticipate.

**Strategy B: 3/5** -- Drupal renders the content, so field-level a11y (alt text, link text, form labels) comes from Drupal's field configuration. But the component cannot guarantee the slotted content has proper semantics. A poorly structured `<div slot="heading">` may lack the correct heading level.

**Strategy C: 5/5** -- Atoms handle their own a11y completely (buttons manage `aria-disabled`, inputs manage `aria-invalid`). Organisms provide structural a11y (landmark roles, focus trapping, keyboard navigation) while Drupal provides content-level a11y (alt text, heading levels, link text). Each system handles what it knows best.

#### 7. Performance (High)

**Strategy A: 3/5** -- All data passes through HTML attribute serialization (string encoding) and Lit's property reflection. For simple types this is fast. For JSON attributes (navigation trees, tag arrays), parsing adds CPU cost on every render. Large attribute values also increase HTML payload size.

**Strategy B: 4/5** -- Slotted content is native DOM. No serialization, no parsing. Shadow DOM slot projection is a browser-native operation (zero JavaScript cost). Drupal's server-rendered HTML streams directly into the component. However, more DOM nodes in the light DOM may increase layout computation.

**Strategy C: 4/5** -- Atoms use lightweight attribute binding. Organisms use native slot projection. JSON attributes are limited to cases where they are truly necessary (e.g., navigation items). Best of both performance profiles.

#### 8. Testing (Medium)

**Strategy A: 5/5** -- Pass properties, assert rendered Shadow DOM. Clean, deterministic, no external dependencies. Storybook stories are the test fixtures.

**Strategy B: 3/5** -- Must compose light DOM children (slot content) in each test. Tests need realistic HTML that mimics Drupal's output. Fragile if Drupal's output changes.

**Strategy C: 4/5** -- Atoms test with properties (fast, clean). Organisms test with both properties and composed slot content. Storybook stories serve as integration tests for the slot contract. Not as clean as pure property testing, but realistic.

---

## Per-Component Recommendations

The following table assigns each of the 40+ planned components to a strategy based on its atomic design tier, content complexity, and Drupal integration surface.

### Classification Legend

| Strategy        | Shorthand | Meaning                                                                       |
| --------------- | --------- | ----------------------------------------------------------------------------- |
| Property-Driven | **P**     | Component accepts data via attributes/properties. Owns all rendering.         |
| Slot-Driven     | **S**     | Component provides structure via slots. Drupal owns content rendering.        |
| Hybrid          | **H**     | Properties for configuration + scalar data. Slots for rendered content areas. |

### Atoms

| Component       | Strategy | Rationale                                                                                                                                                                                                           |
| --------------- | :------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wc-button`     |  **P**   | Self-contained. Properties: `variant`, `size`, `href`, `disabled`, `type`, `loading`. Default slot for button label text. No Drupal field rendering needed.                                                         |
| `wc-icon`       |  **P**   | Pure data-driven. Properties: `name`, `size`, `label`. No content to slot. SVG rendered internally from icon name.                                                                                                  |
| `wc-badge`      |  **P**   | Tiny, self-contained. Properties: `variant`, `size`. Default slot for badge text (a single string).                                                                                                                 |
| `wc-tag`        |  **P**   | Minimal. Properties: `variant`, `removable`, `href`. Default slot for tag label.                                                                                                                                    |
| `wc-avatar`     |  **P**   | Image display. Properties: `src`, `alt`, `size`, `initials`. No Drupal field rendering complexity.                                                                                                                  |
| `wc-spinner`    |  **P**   | No content. Properties: `size`, `label` (for screen readers). Pure visual indicator.                                                                                                                                |
| `wc-tooltip`    |  **P**   | Properties: `content`, `position`, `trigger`. Default slot for the trigger element. Tooltip content is a simple string.                                                                                             |
| `wc-sr-only`    |  **P**   | Screen-reader-only text. Default slot for text content. No visual rendering.                                                                                                                                        |
| `wc-toggle`     |  **H**   | Form-associated via ElementInternals. Properties: `name`, `checked`, `disabled`, `value`. Slot for label text so Drupal's Form API can render labels with translation and token replacement.                        |
| `wc-checkbox`   |  **H**   | Form-associated. Properties: `name`, `checked`, `disabled`, `value`, `required`. Slots: `label`, `help`. Drupal's Form API renders label HTML with required indicators and help text.                               |
| `wc-radio`      |  **H**   | Form-associated. Properties: `name`, `value`, `checked`, `disabled`. Slot for label. Same reasoning as checkbox.                                                                                                    |
| `wc-text-input` |  **H**   | Form-associated. Properties: `name`, `type`, `value`, `required`, `pattern`, `min`, `max`, `error-message`. Slots: `label`, `help`, `prefix`, `suffix`. Labels and help text come from Drupal's Form API.           |
| `wc-textarea`   |  **H**   | Form-associated. Properties: `name`, `value`, `required`, `rows`, `maxlength`. Slots: `label`, `help`. Same pattern as text-input.                                                                                  |
| `wc-select`     |  **H**   | Form-associated. Properties: `name`, `value`, `required`, `multiple`. Slots: `label`, `help`. Options passed as JSON property or `<option>` slot children (Drupal's Form API renders `<option>` elements natively). |

### Molecules

| Component           | Strategy | Rationale                                                                                                                                                                                                                                                                              |
| ------------------- | :------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wc-search-bar`     |  **H**   | Properties: `placeholder`, `action`, `method`, `value`. Slot: `submit-button` (so Drupal can render a translated submit button). Drupal Search API forms need form-associated behavior.                                                                                                |
| `wc-form-field`     |  **H**   | Wrapper molecule. Properties: `error`, `required-indicator`. Slots: `label`, `input`, `help`, `error-message`. Drupal's Form API renders each of these as separate render elements.                                                                                                    |
| `wc-breadcrumb`     |  **H**   | Properties: `separator`, `aria-label`. Slot: default slot accepts `<a>` elements. Drupal's breadcrumb block renders a list of links. The component provides structure and styling; Drupal provides the link list. Could also accept `items` as JSON property for non-Drupal consumers. |
| `wc-pagination`     |  **H**   | Properties: `current-page`, `total-pages`, `base-url`. Drupal's Views pager already renders pagination HTML, but the component can also render from properties for standalone use. Hybrid gives flexibility.                                                                           |
| `wc-media-object`   |  **S**   | Content-rich. Slots: `media`, `body`. Drupal renders the image (with image styles) and the text content. Component provides the side-by-side layout.                                                                                                                                   |
| `wc-alert`          |  **H**   | Properties: `variant` (info, warning, danger, success), `dismissible`, `role` (alert, status). Slot: default slot for alert message content. Drupal renders the message HTML (which may contain links, formatted text).                                                                |
| `wc-accordion-item` |  **H**   | Properties: `expanded`, `disabled`, `heading-level`. Slots: `heading` (Drupal renders the heading text with configured text format), default slot for panel content. The component handles expand/collapse behavior and ARIA.                                                          |
| `wc-tab-item`       |  **H**   | Properties: `label`, `selected`, `disabled`. Slot: default for tab panel content. The label is a simple string (property), the content is Drupal-rendered HTML (slot).                                                                                                                 |
| `wc-dropdown-menu`  |  **H**   | Properties: `align`, `trigger-label`. Slots: `trigger` (button or link), default (menu items). Drupal renders menu items. Component handles positioning and keyboard navigation.                                                                                                       |

### Organisms

| Component           | Strategy | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | :------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wc-content-card`   |  **H**   | Properties: `heading`, `href`, `variant`, `publish-date`, `read-time`, `category`. Slots: `media` (Drupal responsive image), `actions` (Drupal CTA links), `meta` (Drupal tags/dates), default (body content). Scalar metadata as properties for Storybook testability. Rich content areas as slots for Drupal compatibility. **This is the canonical hybrid example.**                                                                                                         |
| `wc-article-layout` |  **S**   | Pure structural organism. Properties: `has-sidebar` (auto-detected via slotchange). Slots: `hero`, `breadcrumb`, `author`, `sidebar`, `footer`, default. All content comes from Drupal's node full view mode.                                                                                                                                                                                                                                                                   |
| `wc-header`         |  **S**   | Site header. Properties: `sticky`, `transparent`. Slots: `logo`, `navigation`, `search`, `utility`, `mobile-trigger`. Every slot receives Drupal block output.                                                                                                                                                                                                                                                                                                                  |
| `wc-footer`         |  **S**   | Site footer. Properties: none needed. Slots: `branding`, `navigation`, `social`, `legal`. All content from Drupal footer blocks.                                                                                                                                                                                                                                                                                                                                                |
| `wc-nav-primary`    |  **H**   | Properties: `items` (JSON menu tree from Drupal preprocess). **This is a justified JSON attribute** -- Drupal's menu system produces a tree structure that cannot be expressed as flat attributes. Component handles mega-menu rendering, keyboard navigation, ARIA. Alternative: Slot-driven with `<ul>` list structure from Drupal's menu block rendering. Both approaches are valid; JSON property gives the component more rendering control for complex mega-menu layouts. |
| `wc-nav-mobile`     |  **H**   | Same approach as `wc-nav-primary`. Properties: `items` (JSON), `open`. Component handles drawer animation, focus trapping, touch gestures.                                                                                                                                                                                                                                                                                                                                      |
| `wc-hero-banner`    |  **H**   | Properties: `heading`, `subheading`, `variant`, `overlay-opacity`. Slots: `media` (Drupal responsive image or video), `cta` (Drupal CTA buttons). Heading text as property for SEO (component controls `<h1>` rendering). Media as slot for Drupal's image styles.                                                                                                                                                                                                              |
| `wc-card-grid`      |  **H**   | Properties: `columns`, `gap`, `variant`. Slot: default (receives multiple `<wc-content-card>` elements). Component provides CSS Grid layout. Drupal Views renders the card instances.                                                                                                                                                                                                                                                                                           |
| `wc-form`           |  **H**   | Properties: `action`, `method`, `novalidate`. Slot: default (form fields). Drupal's Form API renders form elements. Component provides form-level validation orchestration, submit handling, and error summary. Form-associated child components (`wc-text-input`, etc.) participate via `ElementInternals`.                                                                                                                                                                    |
| `wc-accordion`      |  **S**   | Group container. Properties: `allow-multiple`, `heading-level`. Slot: default (receives `<wc-accordion-item>` children). Component manages group behavior (single-open vs multi-open). Drupal renders accordion items via Paragraphs.                                                                                                                                                                                                                                           |
| `wc-tabs`           |  **S**   | Group container. Properties: `selected-index`, `variant`. Slot: default (receives `<wc-tab-item>` children). Component manages tab selection, ARIA tablist, keyboard navigation. Drupal renders tab content via Paragraphs.                                                                                                                                                                                                                                                     |
| `wc-modal`          |  **S**   | Overlay container. Properties: `open`, `heading`, `size`. Slots: `trigger`, default (modal body), `footer` (action buttons). Drupal renders modal content. Component handles overlay, focus trap, escape key, scroll lock, ARIA.                                                                                                                                                                                                                                                |
| `wc-media-gallery`  |  **H**   | Properties: `columns`, `lightbox`. Slot: default (receives `<figure>` or `<img>` elements). Drupal Media module renders images with appropriate styles. Component provides grid layout and optional lightbox behavior.                                                                                                                                                                                                                                                          |
| `wc-table`          |  **H**   | Properties: `sortable`, `striped`, `caption`. Slot: default (receives a `<table>` element). Drupal renders the table HTML. Component enhances with sorting, sticky headers, responsive scrolling. **Important**: The component wraps Drupal's table output rather than re-rendering from JSON data. This preserves Drupal's Table field formatter output.                                                                                                                       |
| `wc-sidebar`        |  **S**   | Pure container. Properties: `sticky`. Slot: default (receives Drupal block output). Component provides sticky positioning and spacing.                                                                                                                                                                                                                                                                                                                                          |

### Templates (Page-Level Layouts)

| Component                | Strategy | Rationale                                                                                                                                                                  |
| ------------------------ | :------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wc-page-layout`         |  **S**   | Properties: `variant` (default, full-width, narrow). Slots: `header`, `main`, `sidebar`, `footer`. Pure CSS Grid layout container. Drupal fills regions with block output. |
| `wc-article-page`        |  **S**   | Properties: `has-sidebar`. Slots: `hero`, `breadcrumb`, `title`, `meta`, `content`, `sidebar`, `related`. Drupal's node full view mode renders all content.                |
| `wc-landing-page`        |  **S**   | Properties: `variant`. Slots: `hero`, `sections`, `cta`. Drupal Paragraphs or Layout Builder renders sections.                                                             |
| `wc-search-results-page` |  **S**   | Properties: `total-results`, `query`. Slots: `search-form`, `facets`, `results`, `pager`. Drupal Search API renders all content. Component provides layout structure.      |

### Infrastructure Components

| Component           | Strategy | Rationale                                                                                                                                                         |
| ------------------- | :------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wc-theme-provider` |  **P**   | Properties: `mode`, `scale`, `locale`. Slot: default (all themed content). Uses Lit Context Protocol to share theme state. No Drupal content rendering.           |
| `wc-prose`          |  **S**   | Light DOM component (no Shadow DOM). Slot: default. Wraps Drupal CKEditor content with typography styles. Must use light DOM so Drupal's text format CSS applies. |

---

## Strategy Summary by Atomic Tier

```
                    PROPERTY <<<---->>> SLOT

  ATOMS       [========|----]          14 components
              8 Property, 6 Hybrid     Mostly self-contained UI primitives.
                                       Form elements are hybrid (ElementInternals
                                       + label/help slots).

  MOLECULES   [------|======]          9 components
              0 Property, 7 Hybrid,    Configuration via properties.
              2 Slot                   Content areas via slots.

  ORGANISMS   [---|==========]         15 components
              0 Property, 9 Hybrid,    Properties for configuration/metadata.
              6 Slot                   Slots carry all Drupal-rendered content.

  TEMPLATES   [-|============]         4 components
              0 Property, 0 Hybrid,    Pure slot-based layout containers.
              4 Slot                   Drupal fills all regions.

  INFRA       [==|========]            2 components
              1 Property, 0 Hybrid,    Theme provider is property-driven.
              1 Slot                   Prose is slot-driven (light DOM).
```

**Totals**: 9 Property-driven, 22 Hybrid, 13 Slot-driven (44 components)

---

## Implementation Guidelines

### Rule 1: Properties for Scalar Configuration

If the data is a single value (string, number, boolean, enum) that the component uses for configuration or display logic, it should be a property.

```typescript
// CORRECT: scalar values as properties
@property({ type: String, reflect: true })
variant: 'default' | 'featured' | 'compact' = 'default';

@property({ type: String })
heading = '';

@property({ type: Number, attribute: 'read-time' })
readTime = 0;

@property({ type: Boolean, reflect: true })
featured = false;
```

### Rule 2: Slots for Drupal-Rendered Content

If the data is HTML that Drupal's field system, Media module, or Paragraphs module produces, it should go in a slot.

```typescript
// CORRECT: slots for rendered content areas
render() {
  return html`
    <div part="media" class="card__media">
      <slot name="media">
        <div class="card__media-placeholder" aria-hidden="true"></div>
      </slot>
    </div>
    <div part="body" class="card__body">
      <h3 class="card__heading">${this.heading}</h3>
      <slot></slot>
    </div>
    <div part="actions" class="card__actions">
      <slot name="actions"></slot>
    </div>
  `;
}
```

### Rule 3: Every Slot Has Fallback Content

Slots must render meaningfully when empty. This supports both progressive enhancement (before JS loads) and standalone use (Storybook without Drupal).

```typescript
<slot name="media">
  <!-- Fallback: placeholder when no image is provided -->
  <div class="card__media-placeholder" aria-hidden="true">
    <wc-icon name="image" size="48"></wc-icon>
  </div>
</slot>
```

### Rule 4: JSON Properties Are the Exception, Not the Rule

JSON attributes (arrays, objects) are acceptable only when:

1. The data is inherently structured (navigation tree, options list)
2. The structure cannot be expressed as flat attributes
3. A Drupal preprocess hook or TWIG extension can generate the JSON

```typescript
// ACCEPTABLE: navigation tree requires structured data
@property({ type: Array })
items: NavItem[] = [];

// UNACCEPTABLE: this should be separate flat attributes
@property({ type: Object })
author = { name: '', avatar: '', bio: '' };
// Use author-name, author-avatar, author-bio instead
```

### Rule 5: Slotchange Detection for Adaptive Layout

Organisms should detect whether optional slots are populated and adapt their layout accordingly. This eliminates the need for Drupal templates to set explicit flags like `has-sidebar="true"`.

```typescript
private _hasSidebar = false;

connectedCallback(): void {
  super.connectedCallback();
  this.shadowRoot?.addEventListener('slotchange', this._handleSlotChange);
}

private _handleSlotChange = (e: Event): void => {
  const slot = e.target as HTMLSlotElement;
  if (slot.name === 'sidebar') {
    this._hasSidebar = slot.assignedNodes({ flatten: true }).length > 0;
    this.requestUpdate();
  }
};
```

### Rule 6: Form Components Use ElementInternals + Slots

Form components are the canonical hybrid pattern. They use `ElementInternals` for form participation (properties: `name`, `value`, `required`) and slots for Drupal Form API rendering (slots: `label`, `help`, `error`).

```typescript
@customElement('wc-text-input')
export class WcTextInput extends LitElement {
  static formAssociated = true;

  // Properties for form participation
  @property({ type: String }) name = '';
  @property({ type: String }) value = '';
  @property({ type: String }) type: 'text' | 'email' | 'tel' | 'url' = 'text';
  @property({ type: Boolean }) required = false;

  // Slots for Drupal Form API content
  // <slot name="label"> - Drupal renders label with required indicator
  // <slot name="help"> - Drupal renders help text with translation
  // <slot name="error"> - Drupal renders server-side validation error

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  render() {
    return html`
      <div class="form-field">
        <slot name="label">
          <label for="input">${this.name}</label>
        </slot>
        <input
          id="input"
          type=${this.type}
          .value=${this.value}
          ?required=${this.required}
          @input=${this._onInput}
        />
        <slot name="help"></slot>
        <slot name="error"></slot>
      </div>
    `;
  }
}
```

### Rule 7: Document the Contract in JSDoc and CEM

Every slot, property, event, and CSS custom property must be documented in JSDoc. The Custom Elements Manifest generator extracts this documentation and makes it available to Storybook, IDE intellisense, and Drupal tooling.

```typescript
/**
 * A content card for healthcare article previews.
 *
 * INTEGRATION STRATEGY: Hybrid (Property + Slot)
 * - Properties: scalar metadata (heading, href, variant, publish-date)
 * - Slots: rendered content (media, actions, meta, body)
 *
 * @element wc-content-card
 *
 * @slot - Default slot for card body content (maps to content.body)
 * @slot media - Hero image or video (maps to content.field_hero_image)
 * @slot actions - CTA buttons/links (maps to custom TWIG)
 * @slot meta - Metadata: tags, dates (maps to content.field_tags)
 *
 * @fires wc-card-click - Card activated (detail: { href, heading, method })
 *
 * @cssprop [--wc-card-radius=8px] - Border radius
 * @cssprop [--wc-card-padding=1.5rem] - Internal padding
 */
```

---

## Drupal Module Compatibility Reference

This section maps each major Drupal module to its integration surface with each strategy.

### Layout Builder

| Concern                |                        Property-Driven                        |                        Slot-Driven                        |                        Hybrid                         |
| ---------------------- | :-----------------------------------------------------------: | :-------------------------------------------------------: | :---------------------------------------------------: |
| Section templates      |           Requires custom blocks that extract data            |   Section slots accept `{{ content.region }}` directly    | Sections are slot-driven; blocks inside can be either |
| Block preview in admin | No preview (data extracted server-side, rendered client-side) | Full preview (Drupal renders content, component wraps it) |    Content blocks preview correctly (slot-driven)     |
| Custom blocks          |    Must serialize all data as attributes via render arrays    |       Render array output goes into slots naturally       | Configuration as properties, content output as slots  |
| Inline editing         |      Not possible (component re-renders from properties)      |   Limited (depends on Drupal's inline editing support)    |         Same as slot-driven for content areas         |

### Paragraphs

| Concern                |                                     Property-Driven                                     |                             Slot-Driven                              |                                  Hybrid                                  |
| ---------------------- | :-------------------------------------------------------------------------------------: | :------------------------------------------------------------------: | :----------------------------------------------------------------------: |
| Paragraph type mapping | Each paragraph type requires a TWIG template that extracts field values into attributes | Paragraph renders normally; output goes into parent component's slot | Paragraph configuration as parent properties; paragraph content as slots |
| Nested paragraphs      |              Each nesting level requires data extraction and serialization              |             Nested HTML renders naturally through slots              |                     Same as slot-driven for nesting                      |
| Paragraph preview      |                       Not visible in admin (rendered client-side)                       |           Visible in admin (Drupal renders the paragraph)            |                     Visible for slot-driven content                      |

### Media Module

| Concern           |                    Property-Driven                     |                       Slot-Driven                       |                       Hybrid                        |
| ----------------- | :----------------------------------------------------: | :-----------------------------------------------------: | :-------------------------------------------------: |
| Responsive images | Must extract single URL; loses responsive image styles | `<picture>` element from Drupal goes directly into slot | Slot for media preserves all responsive image magic |
| Video embeds      |    Must extract embed URL; loses oEmbed formatting     |       Drupal's Media oEmbed output goes into slot       |           Slot approach preserves oEmbed            |
| Image styles      |     Must know the image style URL pattern; fragile     |   Drupal's image style system renders the correct URL   |      Slot approach preserves image style chain      |
| Focal point       |    Not available (raw URL has no focal point data)     |  Drupal's focal point module renders the cropped image  |         Slot approach preserves focal point         |

### Views

| Concern         |                             Property-Driven                             |                              Slot-Driven                              |                         Hybrid                         |
| --------------- | :---------------------------------------------------------------------: | :-------------------------------------------------------------------: | :----------------------------------------------------: |
| Row rendering   | Each row's template must extract entity data into component attributes  |               View row output goes into component slots               |        Rows as composed components in grid slot        |
| Exposed filters |           Must serialize filter state as component properties           | Filter form renders normally above the view; no component involvement |                Not a component concern                 |
| Pager           | Must extract pager data (current page, total) into component properties |           Drupal's pager output goes into a pagination slot           | Hybrid: properties for page data, slot for pager links |
| AJAX paging     |                 Requires component to manage AJAX state                 |           Drupal AJAX replaces content; behaviors re-attach           |                  Same as slot-driven                   |

### Webform

| Concern           |                   Property-Driven                    |                           Slot-Driven                            |                                Hybrid                                 |
| ----------------- | :--------------------------------------------------: | :--------------------------------------------------------------: | :-------------------------------------------------------------------: |
| Form rendering    | Impractical -- Webform has hundreds of element types |        Webform output goes into `<wc-form>` default slot         | Form wrapper is slot-driven; individual elements use ElementInternals |
| Conditional logic |   Must duplicate Webform's conditional logic in JS   | Webform handles conditionals server-side; component wraps output |                          Same as slot-driven                          |
| Multi-step forms  |         Must manage step state in component          |  Webform manages steps; each step's output goes into form slot   |                          Same as slot-driven                          |
| File uploads      |          Must build upload UI in component           |          Webform's file upload element renders normally          |                          Same as slot-driven                          |

---

## Performance Considerations

### Attribute Serialization Cost

Property-driven components require all data to pass through HTML attribute serialization. For JSON properties (navigation items, options lists), this means:

1. **Server**: Drupal preprocess hook serializes PHP array to JSON string
2. **HTML**: JSON string is embedded in the HTML attribute (increases payload)
3. **Client**: Lit calls `JSON.parse()` on the attribute value

For a navigation menu with 50 items and 3 levels of nesting, the JSON attribute can be 5-10KB of raw text in the HTML. This is parsed synchronously on the main thread.

Slot-driven components avoid this entirely. Drupal's server-rendered HTML is already in the DOM. Slot projection is a browser-native operation with zero JavaScript cost.

### Shadow DOM Slot Projection

Slot projection is handled by the browser's rendering engine, not by JavaScript. When Drupal's HTML is projected into a shadow DOM slot:

1. No DOM manipulation occurs (the nodes stay in the light DOM)
2. The browser's layout engine renders them in the shadow DOM's slot position
3. CSS from both the shadow DOM (component styles) and light DOM (Drupal theme) can apply

This is essentially free. The only cost is the additional shadow DOM tree, which browsers optimize for.

### Render Cache Implications

**Property-driven**: Drupal's render cache tags on field objects may not invalidate correctly when field values are extracted as raw data instead of rendered through Drupal's rendering pipeline. This can cause stale content.

**Slot-driven**: Drupal's full render cache pipeline works correctly because fields render through standard Drupal rendering. Cache tags, contexts, and max-age all apply normally.

---

## Testing Strategy by Component Type

### Property-Driven Components (Atoms)

```typescript
// Clean property-based testing
it('renders with heading property', async () => {
  const el = await fixture<WcButton>(html`
    <wc-button variant="primary" size="lg">Click Me</wc-button>
  `);
  const button = el.shadowRoot?.querySelector('button');
  expect(button?.classList.contains('btn--primary')).toBe(true);
  expect(button?.classList.contains('btn--lg')).toBe(true);
});
```

### Hybrid Components (Molecules, Organisms)

```typescript
// Properties + composed slot content
it('renders card with slotted media', async () => {
  const el = await fixture<WcContentCard>(html`
    <wc-content-card heading="Test Article" variant="featured" href="/test">
      <img slot="media" src="/test.jpg" alt="Test image" />
      <p>Article body content</p>
      <div slot="actions">
        <wc-button variant="text" href="/test">Read More</wc-button>
      </div>
    </wc-content-card>
  `);

  // Test properties
  expect(el.heading).toBe('Test Article');
  expect(el.variant).toBe('featured');

  // Test slot projection
  const mediaSlot = el.shadowRoot?.querySelector('slot[name="media"]') as HTMLSlotElement;
  const assigned = mediaSlot?.assignedElements();
  expect(assigned?.length).toBe(1);
  expect(assigned?.[0].tagName).toBe('IMG');
});
```

### Slot-Driven Components (Templates)

```typescript
// Compose realistic Drupal-like content
it('renders article layout with all slots', async () => {
  const el = await fixture<WcArticleLayout>(html`
    <wc-article-layout>
      <nav slot="breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li><a href="/">Home</a></li>
          <li>Article</li>
        </ol>
      </nav>
      <div slot="hero">
        <picture>
          <source srcset="/hero.webp" type="image/webp" />
          <img src="/hero.jpg" alt="Hero" />
        </picture>
      </div>
      <article>
        <h1>Article Title</h1>
        <p>Article body content from Drupal CKEditor.</p>
      </article>
      <aside slot="sidebar">
        <h2>Related Articles</h2>
      </aside>
    </wc-article-layout>
  `);

  // Verify layout adapts to populated sidebar slot
  await el.updateComplete;
  const layout = el.shadowRoot?.querySelector('.layout');
  expect(layout?.classList.contains('layout--with-sidebar')).toBe(true);
});
```

---

## Migration Path: If We Need to Change

### From Hybrid to More Property-Driven

If the library expands to non-Drupal consumers who find slots cumbersome, organisms can add property-based alternatives while keeping slots as the primary API:

```typescript
// Backward-compatible: both approaches work
@property({ type: String, attribute: 'hero-image-src' })
heroImageSrc = '';

render() {
  return html`
    <div class="hero__media">
      <slot name="media">
        ${this.heroImageSrc
          ? html`<img src=${this.heroImageSrc} alt=${this.heroImageAlt} />`
          : html`<div class="hero__placeholder"></div>`}
      </slot>
    </div>
  `;
}
```

If a `media` slot is provided, it takes precedence (slot content overrides fallback). If no slot content is provided, the component falls back to the `hero-image-src` property. This allows Drupal to use slots and non-Drupal consumers to use properties.

### From Hybrid to More Slot-Driven

If property-driven atoms need to accept more complex Drupal content, add named slots alongside existing properties:

```typescript
// Button gains an icon slot
render() {
  return html`
    <button class="btn btn--${this.variant}">
      <slot name="icon">
        ${this.icon ? html`<wc-icon name=${this.icon}></wc-icon>` : nothing}
      </slot>
      <slot>${this.label}</slot>
    </button>
  `;
}
```

Neither migration path requires rewriting existing templates. The hybrid foundation supports evolution in both directions.

---

## The Recommendation

**Adopt Strategy C: Hybrid Approach** with the following classification rules:

1. **Atoms** (buttons, badges, icons, spinners) are property-driven. They are self-contained UI primitives with no Drupal rendering dependency. Properties are their complete API. Default slots accept text children.

2. **Form elements** (inputs, selects, checkboxes, radios) are hybrid. They use `ElementInternals` properties for form participation and slots for Drupal Form API labels, help text, and error messages.

3. **Molecules** (search bars, alerts, accordion items, form fields) are hybrid. Properties carry configuration; slots carry content that Drupal renders.

4. **Organisms** (cards, heroes, navigation, galleries, tables) are hybrid or slot-dominant. Properties carry scalar metadata and configuration; slots carry all Drupal-rendered content (media, body text, actions, tags).

5. **Templates** (page layouts) are slot-only. They are pure CSS Grid/Flexbox containers. Drupal fills every region.

**The rationale is clear**: Drupal is the primary consumer. Healthcare organizations depend on Drupal's Paragraphs, Layout Builder, Media, Views, and Webform. A strategy that breaks these modules is a non-starter. The hybrid approach preserves full Drupal module compatibility for content-rich components while maintaining clean, portable, testable APIs for simple UI primitives.

The library ships as a framework-agnostic Web Component package. It works in Storybook, static HTML, React, Vue, or any system that supports Web Component slots and attributes. The hybrid does not sacrifice portability -- it simply acknowledges that different components have different content complexity, and each deserves the API strategy that best fits its nature.

---

## ADR: Architecture Decision Record

### ADR-001: Hybrid Property/Slot Integration Strategy

**Status**: Accepted

**Context**: HELIX is a Web Component library that must integrate with Drupal CMS as its primary consumer while remaining framework-agnostic. The fundamental architectural question is whether components should accept data via properties (component controls rendering) or via slots (Drupal controls rendering). The library targets enterprise healthcare organizations that rely on Drupal's content management modules (Paragraphs, Layout Builder, Media, Views, Webform).

**Decision**: Adopt a hybrid strategy where each component's API is determined by its position in the atomic design hierarchy and its content complexity. Atoms use properties. Form elements use properties + slots (ElementInternals). Molecules use a balanced mix. Organisms use slots for content and properties for configuration. Templates are slot-only.

**Consequences**:

_Positive:_

- Full compatibility with all Drupal modules (Paragraphs, Layout Builder, Media, Views, Webform)
- Content editors see real previews in Drupal admin
- Drupal's render cache, field formatters, and image styles work correctly
- Atoms remain fully portable to non-Drupal consumers
- Form elements integrate with Drupal's Form API via ElementInternals
- Clear, teachable classification rules (atoms = properties, organisms = slots)
- Migration path exists in both directions (more properties or more slots) without breaking changes

_Negative:_

- Organisms are harder to test in isolation (must compose slot content)
- Storybook stories for organisms require simulated Drupal output
- Slot naming becomes a stable contract that cannot change without breaking Drupal templates
- Developers must learn both property and slot patterns (training investment)
- Inconsistency risk in slotted content (different templates may structure slots differently)

_Mitigations:_

- Storybook stories serve as slot content documentation and contract tests
- Custom Elements Manifest documents all slots, properties, and events
- Slot fallback content ensures components work without any slotted content
- Slotchange detection allows components to adapt to populated/empty slots
- SDC (Single Directory Component) wrappers in Drupal formalize the slot contract for each component

**Alternatives Considered**:

1. **Strategy A: All Property-Driven** -- Rejected because it breaks Drupal's Paragraphs, Layout Builder, Media, and Views integration. Healthcare organizations depend on these modules. Forcing data extraction from Drupal's rendering pipeline creates a parallel rendering system that duplicates work and breaks cache invalidation.

2. **Strategy B: All Slot-Driven** -- Rejected because it makes atoms unnecessarily complex (wrapping simple button text in slot elements), reduces portability for simple components, and makes Storybook testing verbose. Atoms have no Drupal rendering dependency and gain nothing from slots.

**Review Schedule**: Revisit after first 10 components are implemented and tested with a real Drupal site. Adjust component classifications if integration friction emerges.

---

## Appendix: Quick Reference Card

For developers implementing components, this is the decision flowchart:

```
START: What kind of data does this component receive?
  |
  +-- Is it a scalar value (string, number, boolean, enum)?
  |     |
  |     +-- YES --> Use a PROPERTY (@property decorator)
  |     |           TWIG: attribute="{{ value }}"
  |     |
  |     +-- NO --> Is it rendered HTML from a Drupal field/module?
  |                 |
  |                 +-- YES --> Use a SLOT (<slot name="...">)
  |                 |           TWIG: <div slot="name">{{ content.field }}</div>
  |                 |
  |                 +-- NO --> Is it structured data (array/tree)?
  |                             |
  |                             +-- YES --> Use a JSON PROPERTY
  |                             |           (only if flat attributes cannot work)
  |                             |           TWIG: items='{{ json_data }}'
  |                             |
  |                             +-- NO --> Reconsider the data model.
  |
  +-- Does this component participate in a <form>?
        |
        +-- YES --> Use ELEMENTINTERNALS for form data
        |           (name, value, required as properties)
        |           + SLOTS for label, help, error
        |
        +-- NO --> Follow the rules above.
```

---

## Appendix: TWIG Template Cheat Sheet

### Property-Driven Atom

```twig
{# Simple: flat attributes, no slots needed #}
<wc-button variant="primary" size="lg" href="{{ url }}">
  {{ 'Schedule Appointment'|t }}
</wc-button>
```

### Hybrid Organism

```twig
{# Properties for config/metadata + Slots for Drupal-rendered content #}
<wc-content-card
  heading="{{ node.label }}"
  href="{{ path('entity.node.canonical', {'node': node.id}) }}"
  variant="{{ node.isPromoted() ? 'featured' : 'default' }}"
  publish-date="{{ node.getCreatedTime()|date('c') }}"
  read-time="{{ node.field_read_time.value }}"
>
  {% if content.field_hero_image|render|trim is not empty %}
    <div slot="media">
      {{ content.field_hero_image }}
    </div>
  {% endif %}

  {{ content.body }}

  {% if content.field_tags|render|trim is not empty %}
    <div slot="meta">
      {{ content.field_tags }}
    </div>
  {% endif %}

  <div slot="actions">
    <wc-button variant="text" href="{{ path('entity.node.canonical', {'node': node.id}) }}">
      {{ 'Read More'|t }}
    </wc-button>
  </div>
</wc-content-card>
```

### Slot-Driven Template

```twig
{# Pure structural container: all content from Drupal #}
<wc-page-layout variant="default">
  <header slot="header">
    {{ page.header }}
  </header>
  <main slot="main">
    {{ page.content }}
  </main>
  {% if page.sidebar_first %}
    <aside slot="sidebar">
      {{ page.sidebar_first }}
    </aside>
  {% endif %}
  <footer slot="footer">
    {{ page.footer }}
  </footer>
</wc-page-layout>
```

### Hybrid Form Element

```twig
{# ElementInternals properties + Drupal Form API slots #}
<wc-text-input
  name="patient_name"
  type="text"
  required
  value="{{ form.patient_name['#default_value'] }}"
>
  <label slot="label">
    {{ form.patient_name['#title'] }}
    {% if form.patient_name['#required'] %}
      <span class="form-required" aria-hidden="true">*</span>
    {% endif %}
  </label>
  {% if form.patient_name['#description'] %}
    <div slot="help">{{ form.patient_name['#description'] }}</div>
  {% endif %}
  {% if errors.patient_name %}
    <div slot="error" role="alert">{{ errors.patient_name }}</div>
  {% endif %}
</wc-text-input>
```
