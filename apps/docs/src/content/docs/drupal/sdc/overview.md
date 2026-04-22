---
title: SDC Architecture
description: The two-layer model — HELiX components as UI primitives, Drupal Single Directory Components as content patterns. SDC file structure, registration, and using hx-* components inside SDC templates.
sidebar:
  order: 1
---

Drupal's Single Directory Components (SDC) specification (Drupal 10.1+) and HELiX web components serve different architectural layers. Understanding the boundary between them is the prerequisite for building a maintainable Drupal theme with HELiX.

---

## The Two-Layer Model

**HELiX components are UI primitives.** `hx-card`, `hx-badge`, `hx-button`, `hx-avatar` — these are low-level building blocks with no awareness of Drupal content types, field names, or editorial intent.

**SDCs are content patterns.** An `article-teaser` SDC knows that a Drupal article node has a title, a body summary, a category taxonomy term, and an author. It maps those content fields onto HELiX component primitives to produce a presentation layer.

| Layer | Responsibility | Examples |
|---|---|---|
| HELiX Library | UI primitives, interaction, accessibility, design tokens | `hx-card`, `hx-badge`, `hx-button`, `hx-avatar`, `hx-text-input` |
| Drupal SDC | Content pattern composition, field mapping, editorial intent | `article-teaser`, `hero-banner`, `staff-profile`, `event-card` |
| Drupal Template | Entity rendering, Drupal region integration | `node--article--teaser.html.twig`, `paragraph--hero.html.twig` |

The SDC layer is where you write code. You should not create a wrapper SDC for each HELiX component — that adds indirection without value. Instead, you write SDCs that use multiple HELiX components together to express a content concept.

---

## Why This Separation Matters

Without the two-layer model, teams typically fall into one of two anti-patterns:

**Anti-pattern 1: One SDC per component.** An `hx-button` SDC wrapping `<hx-button>`. No value added — just more files and an extra layer of props.

**Anti-pattern 2: Inline component markup in every template.** `node--article--teaser.html.twig` directly assembles `hx-card`, `hx-badge`, `hx-avatar`. Works but cannot be reused across contexts (search results, related content, newsletter blocks).

The correct approach: write a single `article-teaser` SDC that expresses the editorial pattern, then include it anywhere the pattern is needed — node templates, Views row templates, paragraph templates.

---

## SDC File Structure

Each SDC lives in a self-contained directory:

```text
web/themes/custom/mytheme/components/
└── article-teaser/
    ├── article-teaser.component.yml   # Schema, props, slots, metadata
    ├── article-teaser.twig            # Composition template
    ├── article-teaser.css             # Layout CSS for this pattern
    └── article-teaser.js              # Drupal behavior (optional)
```

### component.yml — Schema and metadata

```yaml
# components/article-teaser/article-teaser.component.yml
name: Article Teaser
description: Renders a news article as a card with category badge, author avatar, and read-more CTA.
status: stable

props:
  type: object
  required:
    - title
    - url
  properties:
    title:
      type: string
      title: Article Title
    url:
      type: string
      title: Article URL
    summary:
      type: string
      title: Body Summary
    category:
      type: string
      title: Category Label
    category_variant:
      type: string
      title: Category Badge Variant
      enum: [default, primary, success, warning, danger]
      default: primary
    author_name:
      type: string
      title: Author Name
    author_image_url:
      type: string
      title: Author Image URL
    published_label:
      type: string
      title: Published Date (formatted)

slots:
  image:
    title: Card Image
    description: Rendered image field (Drupal image formatter output).

libraryOverrides:
  dependencies:
    - mytheme/helix-card
    - mytheme/helix-badge
    - mytheme/helix-button
    - mytheme/helix-avatar
```

### component.twig — Composition template

```twig
{# components/article-teaser/article-teaser.twig #}
<hx-card variant="default">

  {# Drupal image formatter output projected into the image slot #}
  {% if image %}
    <div slot="image">
      {{- image -}}
    </div>
  {% endif %}

  {# Badge and heading group #}
  <div slot="heading">
    {% if category %}
      <hx-badge variant="{{ category_variant|default('primary') }}">
        {{- category|escape -}}
      </hx-badge>
    {% endif %}
    <span>{{ title|escape }}</span>
  </div>

  {# Author meta #}
  {% if author_name %}
    <div slot="footer" class="article-teaser__author">
      {% if author_image_url %}
        <hx-avatar
          src="{{ author_image_url|escape }}"
          alt="{{ author_name|escape }}"
          hx-size="sm"
        ></hx-avatar>
      {% endif %}
      <span>{{ author_name|escape }}</span>
      {% if published_label %}
        <span aria-hidden="true">·</span>
        <time>{{ published_label|escape }}</time>
      {% endif %}
    </div>
  {% endif %}

  {# Body summary #}
  {% if summary %}
    <p>{{ summary|escape }}</p>
  {% endif %}

  {# CTA #}
  <div slot="actions">
    <hx-button href="{{ url|escape }}" variant="ghost">Read more</hx-button>
  </div>

</hx-card>
```

### component.css — Pattern layout only

The CSS in an SDC should only contain layout concerns for the composition, not component styles. Component styles are managed by HELiX's `adoptedStylesheetRegistry` internally.

```css
/* components/article-teaser/article-teaser.css */
.article-teaser__author {
  display: flex;
  align-items: center;
  gap: var(--hx-space-2);
  font-size: var(--hx-font-size-sm);
  color: var(--hx-color-neutral-600);
}
```

---

## Registering SDCs in a Theme

Drupal discovers SDCs automatically in `components/` directories when the SDC module is enabled. Enable the module:

```bash
drush en sdc
```

SDCs are found in:

- `web/themes/custom/mytheme/components/` (theme SDCs)
- `web/modules/custom/my_module/components/` (module SDCs)

No additional registration is required. Drupal scans on cache rebuild.

```bash
drush cr
```

Confirm discovery:

```bash
drush eval "print_r(\Drupal::service('plugin.manager.sdc')->getDefinitions());"
```

---

## Registering Component Libraries

The `libraryOverrides.dependencies` key in `component.yml` attaches Drupal libraries when the SDC is rendered. Define the HELiX component libraries in your theme:

```yaml
# mytheme.libraries.yml
helix-runtime:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/lit-runtime.js:
      type: external
      preprocess: false
      attributes: { type: module, crossorigin: anonymous }

helix-card:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-card/index.js:
      type: external
      preprocess: false
      attributes: { type: module, crossorigin: anonymous }
  dependencies:
    - mytheme/helix-runtime

helix-badge:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-badge/index.js:
      type: external
      preprocess: false
      attributes: { type: module, crossorigin: anonymous }
  dependencies:
    - mytheme/helix-runtime

helix-button:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-button/index.js:
      type: external
      preprocess: false
      attributes: { type: module, crossorigin: anonymous }
  dependencies:
    - mytheme/helix-runtime

helix-avatar:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-avatar/index.js:
      type: external
      preprocess: false
      attributes: { type: module, crossorigin: anonymous }
  dependencies:
    - mytheme/helix-runtime
```

---

## Using an SDC in a Drupal Template

Once registered, include the SDC using the `include` tag with the `component` keyword:

```twig
{# node--article--teaser.html.twig #}
{% include 'mytheme:article-teaser' with {
  title: node.label,
  url: url,
  summary: content.body|render|striptags|trim,
  category: node.field_category.entity.label,
  category_variant: 'primary',
  author_name: node.uid.entity.displayname,
  author_image_url: node.uid.entity.field_avatar.entity.uri.value|file_url,
  published_label: node.created.value|format_date('medium'),
  image: content.field_image,
} only %}
```

Or from a Views row template:

```twig
{# views/views-view-unformatted--articles--page-1.html.twig #}
<div class="article-grid">
  {% for row in rows %}
    {% include 'mytheme:article-teaser' with {
      title: row.content['#node'].label,
      url: row.content['#node'].toUrl().toString(),
      summary: row['#row'].field_body,
      category: row['#row'].field_category,
    } only %}
  {% endfor %}
</div>
```

---

## SDC vs Direct Template Markup

**Use an SDC when:**
- The same content pattern appears in more than one context (node template, Views row, paragraph template)
- The pattern has a defined props schema that needs validation
- Content editors need to configure variants via a structured form (Layout Builder, Paragraph type)

**Use direct template markup when:**
- The pattern appears in exactly one place and is unlikely to be reused
- You need full control over the render array (contextual links, edit buttons)
- The component markup is extremely simple (1–2 HELiX elements)

---

## SDCs and hx-size

HELiX components use `hx-size` (not `size`) for the component size attribute. This avoids conflicts with native HTML attributes on form elements. In SDC templates:

```twig
{# Correct: hx-size attribute #}
<hx-avatar src="{{ author_image_url }}" hx-size="sm"></hx-avatar>
<hx-button hx-size="lg">Submit</hx-button>

{# Wrong: size attribute has no effect on HELiX components #}
<hx-avatar size="sm"></hx-avatar>
```

---

## Related

- [SDC Composition Patterns](/drupal/sdc/composition/) — Full article-teaser and staff-profile examples
- [SDC Variants](/drupal/sdc/variants/) — CSS variant classes, theme variants, responsive variants
- [Twig Templates: Slots](/drupal/twig-templates/slots/) — How slot projection works with Drupal content
