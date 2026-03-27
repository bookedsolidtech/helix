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

```
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
   * image formatter. Projecting it into slot="media" inside hx-card.
   * The |raw filter is safe here because this is Drupal-rendered content,
   * not user-submitted text. Never use |raw on user-generated content.
   #}
  {% if image %}
    <div slot="media">
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
    <div slot="meta" class="article-teaser__byline">
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

```
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

  <div slot="media" class="staff-profile__photo">
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

  <div slot="meta">
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
{# In the SDC template — project rendered image into the media slot #}
{% if image %}
  <div slot="media">
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

## Related

- [SDC Architecture](/drupal/sdc/overview/) — Two-layer model, file structure, library registration
- [SDC Variants](/drupal/sdc/variants/) — Variant props, CSS, theme and responsive variants
- [Twig Templates: Slots](/drupal/twig-templates/slots/) — Slot projection mechanics
