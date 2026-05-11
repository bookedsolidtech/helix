---
title: SDC Composition Patterns
description: Full composition examples — article teaser SDC using hx-card + hx-badge + hx-avatar, staff profile SDC, field mapping from Drupal content to component slots, media images in slot="image".
sidebar:
  order: 2
---

Composition SDCs map Drupal content fields to HELiX component slots and properties. This guide provides two complete examples — an article teaser and a healthcare staff profile — then documents the field mapping patterns and slot projection techniques used in each.

---

## Content Type to SDC Mapping

Before building, map each content type's fields to component primitives:

| Content Type Field | SDC Prop / Slot | HELiX Component |
|---|---|---|
| `node.label` | `title` prop | `hx-card` heading slot |
| `field_body` (summary) | `summary` prop | `hx-card` default slot |
| `field_category` (taxonomy ref) | `category` + `category_variant` props | `hx-badge` inside heading slot |
| `field_image` (media ref) | `image` slot | `hx-card` media slot |
| `node.uid.entity.displayname` | `author_name` prop | `hx-avatar` in meta slot |
| `field_avatar` (image) | `author_image_url` prop | `hx-avatar` src attribute |
| `node.created` (timestamp) | `published_label` prop | `<time>` in meta slot |
| `node.toUrl()` | `url` prop | `hx-button` href attribute |

---

## Example 1: Article Teaser SDC

### File structure

```text
components/article-teaser/
├── article-teaser.component.yml
├── article-teaser.twig
├── article-teaser.css
```

### article-teaser.component.yml

```yaml
name: Article Teaser
description: News or editorial article rendered as a card with category badge, author avatar, body summary, and read-more CTA.
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
      description: The node label. Rendered as the card heading.
    url:
      type: string
      title: Article URL
      description: Canonical URL used for the read-more link.
    summary:
      type: string
      title: Body Summary
      description: Trimmed body text, plain text only.
    category:
      type: string
      title: Category
      description: Primary taxonomy term label.
    category_variant:
      type: string
      title: Category Badge Variant
      enum: [default, primary, success, warning, danger]
      default: primary
    author_name:
      type: string
      title: Author Display Name
    author_image_url:
      type: string
      title: Author Avatar URL
    published_label:
      type: string
      title: Formatted Published Date
      description: Human-readable date string (e.g., March 24, 2026).
    card_variant:
      type: string
      title: Card Visual Variant
      enum: [default, elevated, outlined, filled]
      default: default

slots:
  image:
    title: Card Image
    description: Drupal-rendered image field output. Projected into hx-card's media slot.

libraryOverrides:
  dependencies:
    - mytheme/helix-card
    - mytheme/helix-badge
    - mytheme/helix-button
    - mytheme/helix-avatar
```

### article-teaser.twig

```twig
{# components/article-teaser/article-teaser.twig #}
<hx-card variant="{{ card_variant|default('default') }}">

  {#
   * Drupal media image output — this is already rendered HTML from the
   * image formatter. Projecting it into slot="image" inside hx-card.
   * The |raw filter is safe here because this is Drupal-rendered content,
   * not user-submitted text. Never use |raw on user-generated content.
   #}
  {% if image %}
    <div slot="image">
      {{- image|raw -}}
    </div>
  {% endif %}

  {# Heading slot: badge + title #}
  <div slot="heading">
    {% if category %}
      <hx-badge variant="{{ category_variant|default('primary') }}">
        {{- category|escape -}}
      </hx-badge>
    {% endif %}
    <span class="article-teaser__title">{{ title|escape }}</span>
  </div>

  {# Author/date metadata #}
  {% if author_name %}
    <div slot="footer" class="article-teaser__byline">
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
    <p class="article-teaser__summary">{{ summary|escape }}</p>
  {% endif %}

  {# CTA #}
  <div slot="actions">
    <hx-button href="{{ url|escape }}" variant="ghost">
      Read more
      <span class="visually-hidden"> about {{ title|escape }}</span>
    </hx-button>
  </div>

</hx-card>
```

### article-teaser.css

```css
/* Layout for elements within the SDC — not component internals */
.article-teaser__byline {
  display: flex;
  align-items: center;
  gap: var(--hx-space-2);
  font-size: var(--hx-font-size-sm);
  color: var(--hx-color-neutral-600);
}

.article-teaser__title {
  display: block;
  font-size: var(--hx-font-size-lg);
  font-weight: var(--hx-font-weight-semibold);
}

.article-teaser__summary {
  color: var(--hx-color-neutral-700);
  line-height: var(--hx-line-height-relaxed);
}
```

### Usage in a node template

```twig
{# node--article--teaser.html.twig #}
{% include 'mytheme:article-teaser' with {
  title: node.label,
  url: url,
  summary: content.body[0]['#text']|striptags|trim|slice(0, 200),
  category: node.field_category.entity.label,
  category_variant: 'primary',
  author_name: node.uid.entity.displayname,
  author_image_url: node.uid.entity.field_avatar.0.entity.fileuri|file_url,
  published_label: node.created.value|format_date('medium'),
  image: content.field_hero_image,
} only %}
```

---

## Example 2: Staff Profile SDC (Healthcare)

A staff profile for a clinical directory page using `hx-card`, `hx-badge`, and `hx-avatar`.

### File structure

```text
components/staff-profile/
├── staff-profile.component.yml
├── staff-profile.twig
├── staff-profile.css
```

### staff-profile.component.yml

```yaml
name: Staff Profile
description: Clinical staff member card for directory listings.
status: stable

props:
  type: object
  required:
    - name
    - role
  properties:
    name:
      type: string
      title: Full Name
    role:
      type: string
      title: Clinical Role
      description: e.g., "Attending Physician", "Nurse Practitioner"
    department:
      type: string
      title: Department Name
    specialty:
      type: string
      title: Primary Specialty
    photo_url:
      type: string
      title: Staff Photo URL
    phone:
      type: string
      title: Direct Phone
    email:
      type: string
      title: Contact Email
    profile_url:
      type: string
      title: Full Profile URL
    accepting_patients:
      type: boolean
      title: Accepting New Patients
      default: false

libraryOverrides:
  dependencies:
    - mytheme/helix-card
    - mytheme/helix-badge
    - mytheme/helix-button
    - mytheme/helix-avatar
```

### staff-profile.twig

```twig
{# components/staff-profile/staff-profile.twig #}
<hx-card variant="outlined" class="staff-profile">

  <div slot="image" class="staff-profile__photo">
    {% if photo_url %}
      <hx-avatar
        src="{{ photo_url|escape }}"
        alt="{{ name|escape }}"
        hx-size="xl"
      ></hx-avatar>
    {% else %}
      <hx-avatar
        initials="{{ name|split(' ')|map(w => w[0])|join('')|upper }}"
        hx-size="xl"
      ></hx-avatar>
    {% endif %}
  </div>

  <div slot="heading">
    <span class="staff-profile__name">{{ name|escape }}</span>
    <span class="staff-profile__role">{{ role|escape }}</span>
  </div>

  <div slot="footer">
    {% if department %}
      <hx-badge variant="default">{{ department|escape }}</hx-badge>
    {% endif %}
    {% if accepting_patients %}
      <hx-badge variant="success">Accepting New Patients</hx-badge>
    {% else %}
      <hx-badge variant="warning">Not Accepting New Patients</hx-badge>
    {% endif %}
  </div>

  {% if specialty %}
    <p class="staff-profile__specialty">
      <strong>Specialty:</strong> {{ specialty|escape }}
    </p>
  {% endif %}

  <div slot="actions">
    {% if profile_url %}
      <hx-button href="{{ profile_url|escape }}" variant="primary" hx-size="sm">
        View Profile
      </hx-button>
    {% endif %}
    {% if phone %}
      <hx-button href="tel:{{ phone|replace({' ': '', '-': '', '(': '', ')': ''})|escape }}" variant="ghost" hx-size="sm">
        {{ phone|escape }}
      </hx-button>
    {% endif %}
  </div>

</hx-card>
```

### staff-profile.css

```css
.staff-profile__photo {
  display: flex;
  justify-content: center;
  padding: var(--hx-space-4) var(--hx-space-4) 0;
}

.staff-profile__name {
  display: block;
  font-size: var(--hx-font-size-lg);
  font-weight: var(--hx-font-weight-semibold);
}

.staff-profile__role {
  display: block;
  font-size: var(--hx-font-size-sm);
  color: var(--hx-color-neutral-600);
}

.staff-profile__specialty {
  font-size: var(--hx-font-size-sm);
  margin: 0;
}
```

### Usage in a node template

```twig
{# node--staff--teaser.html.twig #}
{% include 'mytheme:staff-profile' with {
  name: node.label,
  role: node.field_clinical_role.value,
  department: node.field_department.entity.label,
  specialty: node.field_primary_specialty.value,
  photo_url: node.field_photo.0.entity.fileuri|file_url,
  phone: node.field_direct_phone.value,
  email: node.field_email.value,
  profile_url: url,
  accepting_patients: node.field_accepting_patients.value,
} only %}
```

---

## Field Mapping Patterns

### Rendering Drupal media images in slot="image"

Drupal renders image fields through formatters. The rendered output — including `<picture>`, `srcset`, and image styles — should be passed as a slot, not converted to a URL string.

Pass the rendered content array, not a URL:

```twig
{# Correct: pass content.field_image (rendered render array) #}
{% include 'mytheme:article-teaser' with {
  image: content.field_image,
} only %}
```

```twig
{# In the SDC template — project rendered image into the image slot #}
{% if image %}
  <div slot="image">
    {{- image|raw -}}
  </div>
{% endif %}
```

Using `|raw` here is safe because `content.field_image` is output from Drupal's rendering pipeline, not user-submitted text. Drupal applies `twig_escape_filter` to untrusted strings before they reach the render system.

### Truncating body text safely

```twig
{# striptags removes HTML from the body field, trim removes whitespace #}
{{ content.body[0]['#text']|striptags|trim|slice(0, 200) }}
```

### Generating initials from a name

```twig
{# For avatars without photos — generates "JD" from "Jane Doe" #}
{{ name|split(' ')|map(w => w[0])|join('')|upper }}
```

### Taxonomy term variants

Map taxonomy term labels to badge variants using a Twig hash:

```twig
{% set variant_map = {
  'News': 'primary',
  'Events': 'success',
  'Research': 'warning',
  'Policy': 'danger',
} %}
<hx-badge variant="{{ variant_map[category]|default('default') }}">
  {{ category|escape }}
</hx-badge>
```

---

## Nesting SDCs

SDCs can include other SDCs. An `article-grid` SDC can include multiple `article-teaser` SDCs:

```twig
{# components/article-grid/article-grid.twig #}
<div class="article-grid">
  {% for item in items %}
    {% include 'mytheme:article-teaser' with {
      title: item.title,
      url: item.url,
      summary: item.summary,
      category: item.category,
      image: item.image,
    } only %}
  {% endfor %}
</div>
```

---

## Nesting SDCs

SDCs can include other SDCs. An `article-grid` SDC can include multiple `article-teaser` SDCs:

```twig
{# components/article-grid/article-grid.twig #}
<div class="article-grid">
  {% for item in items %}
    {% include 'mytheme:article-teaser' with {
      title: item.title,
      url: item.url,
      summary: item.summary,
      category: item.category,
      image: item.image,
    } only %}
  {% endfor %}
</div>
```

---

## Prop Mapping from Drupal Preprocess

For complex prop derivation, use a `hook_preprocess_HOOK()` function rather than embedding Twig logic in the template.

```php
<?php
// mytheme.theme

/**
 * Implements hook_preprocess_node() for article teaser display.
 */
function mytheme_preprocess_node__article__teaser(array &$variables): void {
  $node = $variables['node'];

  // Derive category variant from taxonomy field value.
  $category_term = $node->get('field_category')->entity;
  $category_label = $category_term ? $category_term->label() : '';
  $category_variant = match ($category_label) {
    'Clinical Research' => 'primary',
    'Patient Safety' => 'danger',
    'Wellness' => 'success',
    default => 'default',
  };

  // Pass derived values to the SDC via the variables array.
  $variables['category_label'] = $category_label;
  $variables['category_variant'] = $category_variant;

  // Pass the author entity for the avatar.
  $author = $node->get('field_author')->entity;
  $variables['author_name'] = $author?->label() ?? '';
  $variables['author_image_url'] = '';

  if ($author && !$author->get('field_profile_image')->isEmpty()) {
    $image_entity = $author->get('field_profile_image')->entity;
    if ($image_entity) {
      $variables['author_image_url'] = \Drupal::service('file_url_generator')
        ->generateAbsoluteString($image_entity->getFileUri());
    }
  }
}
```

---

## SDC Catalog

The following table lists composition SDCs commonly authored alongside HELiX, grouped by content category. Each SDC composes multiple HELiX primitives into a complete editorial pattern. These patterns can be authored from scratch or generated with the `@helixui/drupal-starter` scaffolding.

### Content Patterns

| SDC Name           | HELiX Components                                             | Description                              |
| ------------------ | ------------------------------------------------------------ | ---------------------------------------- |
| `article-teaser`   | `hx-card`, `hx-badge`, `hx-avatar`, `hx-text`, `hx-button`   | News/blog teaser with author attribution |
| `article-full`     | `hx-prose`, `hx-avatar`, `hx-badge`, `hx-divider`, `hx-text` | Full article layout with author bio      |
| `featured-article` | `hx-card`, `hx-badge`, `hx-text`, `hx-button`                | Large-format featured story card         |
| `related-articles` | `hx-card`, `hx-badge`, `hx-text`, `hx-grid`                  | 2-3 column related content grid          |
| `content-listing`  | `hx-card`, `hx-badge`, `hx-pagination`, `hx-stack`           | Paginated content archive listing        |

### Healthcare Patterns

| SDC Name            | HELiX Components                                                | Description                       |
| ------------------- | --------------------------------------------------------------- | --------------------------------- |
| `staff-profile`     | `hx-card`, `hx-avatar`, `hx-badge`, `hx-text`, `hx-button`      | Provider/staff profile card       |
| `staff-directory`   | `hx-card`, `hx-avatar`, `hx-grid`, `hx-text-input`, `hx-select` | Searchable provider directory     |
| `department-card`   | `hx-card`, `hx-icon`, `hx-text`, `hx-button`                    | Clinical department overview card |
| `service-line-hero` | `hx-banner`, `hx-text`, `hx-button-group`                       | Service line hero banner          |
| `appointment-cta`   | `hx-card`, `hx-button`, `hx-icon`, `hx-text`                    | Appointment scheduling CTA block  |
| `clinical-alert`    | `hx-alert`, `hx-icon`, `hx-text`, `hx-button`                   | Clinical advisory/safety alert    |
| `patient-resource`  | `hx-card`, `hx-icon`, `hx-text`, `hx-badge`, `hx-button`        | Patient education resource card   |
| `location-card`     | `hx-card`, `hx-icon`, `hx-text`, `hx-badge`, `hx-button`        | Facility/clinic location card     |
| `insurance-list`    | `hx-structured-list`, `hx-text`, `hx-badge`                     | Accepted insurance plan list      |
| `condition-teaser`  | `hx-card`, `hx-icon`, `hx-text`, `hx-badge`                     | Medical condition/treatment card  |

### Navigation and Structure

| SDC Name         | HELiX Components                                           | Description                         |
| ---------------- | ---------------------------------------------------------- | ----------------------------------- |
| `site-header`    | `hx-top-nav`, `hx-button`, `hx-icon-button`, `hx-dropdown` | Global site header with primary nav |
| `site-footer`    | `hx-text`, `hx-link`, `hx-divider`, `hx-stack`             | Global site footer                  |
| `breadcrumb-nav` | `hx-breadcrumb`, `hx-breadcrumb-item`                      | Drupal path breadcrumb              |
| `section-nav`    | `hx-side-nav`, `hx-text`                                   | In-page section navigation          |
| `pagination-nav` | `hx-pagination`, `hx-text`                                 | Views/listing pagination            |

### Hero and Marketing

| SDC Name           | HELiX Components                                              | Description                    |
| ------------------ | ------------------------------------------------------------- | ------------------------------ |
| `hero-banner`      | `hx-banner`, `hx-text`, `hx-button-group`                     | Full-width page hero           |
| `stat-block`       | `hx-stat`, `hx-text`, `hx-grid`                               | Key metrics/statistics display |
| `cta-block`        | `hx-card`, `hx-text`, `hx-button`, `hx-icon`                  | Single call-to-action block    |
| `cta-band`         | `hx-banner`, `hx-text`, `hx-button-group`                     | Full-width CTA banner          |
| `feature-grid`     | `hx-grid`, `hx-card`, `hx-icon`, `hx-text`                    | Feature highlights grid        |
| `testimonial-card` | `hx-card`, `hx-avatar`, `hx-text`, `hx-rating`                | Patient/client testimonial     |
| `event-card`       | `hx-card`, `hx-badge`, `hx-icon`, `hx-text`, `hx-button`      | Event listing card             |
| `event-listing`    | `hx-card`, `hx-badge`, `hx-icon`, `hx-stack`, `hx-pagination` | Event archive listing          |

### Forms and Interaction

| SDC Name            | HELiX Components                                                       | Description                   |
| ------------------- | ---------------------------------------------------------------------- | ----------------------------- |
| `search-bar`        | `hx-text-input`, `hx-button`, `hx-icon`                                | Global/section search form    |
| `contact-form`      | `hx-form`, `hx-text-input`, `hx-textarea`, `hx-select`, `hx-button`    | Basic contact form layout     |
| `appointment-form`  | `hx-form`, `hx-text-input`, `hx-date-picker`, `hx-select`, `hx-button` | Appointment request form      |
| `newsletter-signup` | `hx-text-input`, `hx-button`, `hx-text`                                | Email list signup inline form |
| `filter-bar`        | `hx-select`, `hx-checkbox-group`, `hx-button`, `hx-tag`                | Views exposed filter bar      |

### Feedback and Status

| SDC Name           | HELiX Components                  | Description                         |
| ------------------ | --------------------------------- | ----------------------------------- |
| `status-message`   | `hx-alert`, `hx-icon`, `hx-text`  | Drupal status/error/warning message |
| `empty-state`      | `hx-icon`, `hx-text`, `hx-button` | Empty Views/listing state           |
| `loading-skeleton` | `hx-skeleton`, `hx-stack`         | AJAX loading placeholder            |

---

## Layout Builder and Experience Builder Integration

### Layout Builder

SDCs work as Layout Builder custom blocks. Create a block type that maps to your SDC, then expose it in Layout Builder sections.

```twig
{# block--helix-article-teaser.html.twig #}
{% if content.field_article_reference[0] is defined %}
  {% set node = content.field_article_reference[0]['#node'] %}
  {% include 'mytheme:article-teaser' with {
    title: node.label,
    url: url('entity.node.canonical', {node: node.id()}),
    summary: node.body.summary ?: node.body.value|striptags|slice(0, 200),
    image: content.field_article_reference[0].field_hero_image,
  } only %}
{% endif %}
```

### Experience Builder (XB)

Drupal's Experience Builder (experimental, Drupal 10.3+) exposes SDCs as drag-and-drop XB components when they include a complete props schema with `$ui` metadata for the editing interface.

Add `$ui` hints to your schema to control how XB presents each prop in the visual editor:

```yaml
# components/article-teaser/article-teaser.component.yml
name: Article Teaser
props:
  type: object
  properties:
    title:
      type: string
      title: Article Title
      '$ui':
        widget: text
    category_variant:
      type: string
      enum: [default, primary, success, warning, danger]
      title: Category Color
      '$ui':
        widget: select
        label: Category badge color
    url:
      type: string
      title: Link URL
      '$ui':
        widget: url
```

Experience Builder SDC integration is available from Drupal 10.3. The `$ui` metadata schema is finalized in the XB initiative but may evolve before stable release. Review the [Drupal Experience Builder documentation](https://www.drupal.org/project/experience_builder) for the current specification.

---

## Progressive Enhancement

HELiX components render their slotted content in the light DOM before JavaScript loads. This means the SDC output is accessible and indexable even when component JavaScript has not yet executed.

Structure your SDC templates so the slot content is semantically complete without component enhancement:

```twig
{# article-teaser.twig — semantic fallback is the slot content itself #}
<hx-card href="{{ url }}">
  {# Before JS: renders as <div> with its content visible in light DOM #}
  {# After JS: card Shadow DOM applies design, layout, and interaction #}
  <span slot="heading">{{ title }}</span>
  <hx-text>{{ summary }}</hx-text>
  <div slot="footer">
    <a href="{{ url }}">{{ 'Read More'|t }}</a>
  </div>
</hx-card>
```

The `<a href>` in the footer slot ensures keyboard navigation and screen reader access to the link before `hx-button` JavaScript loads. Once the component upgrades, `hx-button` takes over with its full interaction model.

---

## htmx Prefix Collision

If your Drupal site uses [htmx](https://htmx.org/), you will encounter a namespace collision: htmx attributes use the `hx-` prefix (e.g., `hx-boost`, `hx-get`, `hx-target`), the same prefix HELiX uses for its custom element tag names (`hx-card`, `hx-button`).

This is not a functional conflict — `hx-` attribute names on HTML elements (htmx's model) are different from `hx-` custom element tag names (HELiX's model) — but it creates readability confusion and may cause issues with htmx's attribute scanner if it attempts to process `hx-card` tags as htmx-enhanced elements.

### Mitigation 1: Scope htmx to specific elements

Do not apply htmx globally. Instead of adding `hx-boost` to `<body>`, scope it to specific regions:

```twig
{# Scope htmx to a specific container, not the whole page #}
<div class="ajax-region" hx-boost="true">
  {# htmx-enhanced links and forms go here #}
</div>

{# HELiX components outside the scoped container are unaffected #}
<hx-card href="/article/1">...</hx-card>
```

### Mitigation 2: Configure htmx attribute prefix

htmx 1.9+ allows configuring the attribute prefix away from `hx-`:

```javascript
// In your theme's JS, before htmx initializes
htmx.config.attributeName = 'data-hx';
htmx.config.boosted = 'data-hx-boost';
```

With this configuration, htmx reads `data-hx-boost`, `data-hx-get`, etc., and will not attempt to process `hx-card` or `hx-button` as htmx-enhanced elements.

### Mitigation 3: Use htmx `hx-ignore` exclusions

If you cannot change the prefix, use `hx-ignore` on HELiX component wrappers to prevent htmx from scanning their descendants:

```twig
<div hx-ignore>
  <hx-card>...</hx-card>
  <hx-button>...</hx-button>
</div>
```

Mitigation 2 (changing htmx's attribute prefix to `data-hx-*`) is the cleanest long-term solution for sites that use both htmx and HELiX. Document this configuration choice in your theme's README so future maintainers understand why the prefix is non-standard.

---

## Troubleshooting

### SDC is not discovered after adding component files

Run `drush cr` after adding any new SDC directory. Drupal discovers components only on cache rebuild, not on page load.

### Component renders as unknown HTML element (no styles)

The component library JavaScript has not loaded. Check:

1. The `attach_library()` call is present in the SDC Twig template, or the SDC's `libraryOverrides.dependencies` lists the component library.
2. The library definition exists in `mytheme.libraries.yml`.
3. The CDN URL or local file path is correct.
4. Browser DevTools Network tab shows the script loaded without 404.

### Drupal Behaviors do not fire on AJAX-loaded content

Drupal Behaviors with `once()` fire automatically on AJAX responses. If your behavior is not running, verify:

1. The behavior key in `Drupal.behaviors` is unique across your theme.
2. The CSS selector in the `once()` call matches the actual rendered element.
3. The `[data-helix-*]` attribute is present on the rendered element in the page source.

### htmx processes `hx-card` as a directive

Apply one of the three mitigations documented in the htmx section above. The fastest fix is adding `hx-ignore` to the wrapper `<div>` around HELiX component regions.

### Props schema validation error in Drupal logs

The value passed to a prop does not match the declared JSON Schema type or enum. Common causes:

- Passing an integer where a string is declared (use `title|string` in Twig)
- Passing a value not in the `enum` list (validate in `hook_preprocess_HOOK()` before passing)
- Passing `null` for a required prop (guard with `{% if value %}` before the `include`)

---

## Related

- [SDC Architecture](/drupal/sdc/overview/) — Two-layer model, file structure, library registration
- [SDC Variants](/drupal/sdc/variants/) — Variant props, CSS, theme and responsive variants
- [Twig Templates: Slots](/drupal/twig-templates/slots/) — Slot projection mechanics
- [Per-Component Loading](/drupal/per-component-loading/) — How libraries attach when SDCs render
- [Library System Deep Dive](/drupal/library-system/) — `libraries.yml` complete reference
