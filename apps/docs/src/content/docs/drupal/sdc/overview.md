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
  version: 3.11.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/lit-runtime.js:
      type: external
      preprocess: false
      attributes: { type: module, crossorigin: anonymous }

helix-card:
  version: 3.11.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/components/hx-card/index.js:
      type: external
      preprocess: false
      attributes: { type: module, crossorigin: anonymous }
  dependencies:
    - mytheme/helix-runtime

helix-badge:
  version: 3.11.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/components/hx-badge/index.js:
      type: external
      preprocess: false
      attributes: { type: module, crossorigin: anonymous }
  dependencies:
    - mytheme/helix-runtime

helix-button:
  version: 3.11.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/components/hx-button/index.js:
      type: external
      preprocess: false
      attributes: { type: module, crossorigin: anonymous }
  dependencies:
    - mytheme/helix-runtime

helix-avatar:
  version: 3.11.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/components/hx-avatar/index.js:
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

## Getting Started

The fastest way to bootstrap a HELiX-based Drupal theme is through the scaffolding CLI, which generates a complete `libraries.yml` fragment and a preset of starter SDC directories for common content patterns.

1. **Install `@helixui/drupal-starter`**

   The starter package provides a pre-built `libraries.yml` fragment and a set of starter SDC directories for the most common content patterns.

   ```bash
   # In your Drupal theme directory
   npm install @helixui/drupal-starter
   ```

   Or use the scaffolding CLI:

   ```bash
   npx create-helix --drupal --preset healthcare
   ```

   The `--preset healthcare` flag scaffolds the subset of SDCs appropriate for healthcare content patterns: patient profiles, clinical article teasers, department cards, appointment CTAs, and alert banners.

2. **Copy the library definitions**

   ```bash
   cp node_modules/@helixui/drupal-starter/libraries.yml.fragment mytheme.libraries.yml
   ```

   Edit the fragment to match your CDN version pin or local npm paths.

3. **Copy the starter SDC components**

   ```bash
   cp -r node_modules/@helixui/drupal-starter/components/* components/
   ```

4. **Enable SDC in your theme info**

   ```yaml
   # mytheme.info.yml
   name: My Healthcare Theme
   type: theme
   core_version_requirement: ^10 || ^11
   base theme: false
   libraries:
     - mytheme/helix-runtime
   components:
     # Drupal discovers components in this directory automatically
   ```

5. **Clear Drupal caches**

   ```bash
   drush cr
   ```

   Drupal 10.1+ discovers SDC components automatically on cache rebuild. No additional module configuration is required.

---

## Site-Type Presets

The `create-helix` scaffolding CLI generates a starter theme with the SDC subset appropriate for your site type.

```bash
# Healthcare system portal
npx create-helix --drupal --preset healthcare

# News/media organization
npx create-helix --drupal --preset editorial

# Corporate marketing site
npx create-helix --drupal --preset marketing

# Government/public sector
npx create-helix --drupal --preset government
```

### Preset Contents

**`healthcare`** — All Healthcare Patterns SDCs (patient, clinical, department, location); `article-teaser`, `article-full`, `featured-article` for health content; `appointment-form`, `contact-form` for patient acquisition; `clinical-alert`, `status-message` for compliance messaging; `staff-profile`, `staff-directory` for provider listings; `site-header`, `site-footer`, `breadcrumb-nav`. Total: 22 SDCs, 18 HELiX components.

**`editorial`** — `article-teaser`, `article-full`, `featured-article`, `related-articles`, `content-listing`; `testimonial-card`, `event-card`, `event-listing`; `hero-banner`, `stat-block`, `cta-block`; `search-bar`, `filter-bar`, `pagination-nav`; `site-header`, `site-footer`, `breadcrumb-nav`, `section-nav`. Total: 19 SDCs, 16 HELiX components.

**`marketing`** — `hero-banner`, `cta-band`, `feature-grid`, `stat-block`; `testimonial-card`, `department-card`, `cta-block`; `article-teaser`, `featured-article`; `contact-form`, `newsletter-signup`; `site-header`, `site-footer`. Total: 14 SDCs, 14 HELiX components.

**`government`** — `article-teaser`, `article-full`, `content-listing`; `service-line-hero`, `feature-grid`, `cta-block`; `clinical-alert` (repurposed as general advisory alert); `search-bar`, `filter-bar`, `contact-form`; `site-header`, `site-footer`, `breadcrumb-nav`, `pagination-nav`; `status-message`, `empty-state`. Total: 16 SDCs, 15 HELiX components.

### What the scaffold generates

Running `create-helix --drupal --preset healthcare` produces:

```
web/themes/custom/mytheme/
├── mytheme.info.yml
├── mytheme.libraries.yml          # Pre-configured with all preset component libraries
├── mytheme.theme                  # Preprocess functions for SDC prop mapping
├── components/
│   ├── article-teaser/            # All 22 preset SDCs
│   ├── staff-profile/
│   ├── appointment-form/
│   └── ...
└── templates/
    ├── node--article--teaser.html.twig   # Pre-wired to article-teaser SDC
    ├── node--staff--teaser.html.twig     # Pre-wired to staff-profile SDC
    └── ...
```

---

## Authoring Custom Composition SDCs

When your content model has patterns that do not match the starter catalog, author your own SDC. The process is the same regardless of complexity.

1. **Define the content pattern**

   Name the SDC after the editorial concept, not the visual component it uses.

   Good: `patient-testimonial`, `clinical-trial-listing`, `department-hero`
   Avoid: `hx-card-wrapper`, `card-with-badge`, `big-card`

2. **Identify which HELiX components compose the pattern**

   Sketch the pattern on paper or in Figma. List every HELiX primitive you need. Each one requires a library entry in `libraries.yml` and an `attach_library()` call in the template (or a `libraryOverrides.dependencies` entry in `component.yml`).

3. **Write the schema**

   Define only the props the SDC actually needs. Do not expose every HELiX component prop — expose only what varies by content. Props that are always the same (e.g., `elevation="raised"` on every card) are hardcoded in the template.

   ```yaml
   # components/custom-pattern/custom-pattern.component.yml
   name: Custom Pattern
   status: stable
   props:
     type: object
     required:
       - title
     properties:
       title:
         type: string
       variant:
         type: string
         enum: [default, featured]
         default: default
   slots:
     media:
       title: Media
     actions:
       title: Actions
   ```

4. **Write the template**

   Attach libraries first. Map props to HELiX attributes. Map slots to HELiX named slots using `<div slot="name">{{ slot_name }}</div>`.

5. **Add layout CSS only**

   Write only CSS that governs how this SDC positions itself in the page. Use `--hx-*` custom properties to theme component internals through Shadow DOM. Do not attempt to select inside `hx-*` elements — Shadow DOM encapsulation prevents it.

6. **Test with realistic Drupal output**

   Use `drush devel:generate` or fixture content to verify the SDC renders correctly with actual Drupal field output including image styles, text format filters, and taxonomy term links.

---

## Related

- [SDC Composition Patterns](/drupal/sdc/composition/) — Full article-teaser and staff-profile examples, SDC catalog, htmx collision, Layout Builder/XB integration
- [SDC Variants](/drupal/sdc/variants/) — CSS variant classes, theme variants, responsive variants
- [Twig Templates: Slots](/drupal/twig-templates/slots/) — How slot projection works with Drupal content
- [Per-Component Loading](/drupal/per-component-loading/) — Loading HELiX components in Drupal
- [Library System Deep Dive](/drupal/library-system/) — `libraries.yml` complete reference
