---
title: Component Building Guide
description: Step-by-step guide for building enterprise web components with Lit 3.x
---

> **Section Owner**: Senior Frontend Engineer
> **Last Updated**: 2026-02-13
> **Audience**: Front-end developers and designers building Web Components for Drupal integration
> **Prerequisite Reading**: [03 - Component Architecture & Storybook Integration](../docs/03-component-architecture-storybook-integration.md)

---

## Table of Contents

1. [Introduction](#51-introduction)
2. [Drupal-Friendly Component Patterns](#52-drupal-friendly-component-patterns)
3. [Data Structure Patterns](#53-data-structure-patterns)
4. [Common Component Patterns](#54-common-component-patterns)
5. [Testing Checklist for Component Builders](#55-testing-checklist-for-component-builders)
6. [Anti-Patterns to Avoid](#56-anti-patterns-to-avoid)
7. [Component Lifecycle & Drupal](#57-component-lifecycle--drupal)
8. [Theming Guidelines for Component Builders](#58-theming-guidelines-for-component-builders)

---

## 5.1 Introduction

This guide is a practical handbook. The Component Architecture document (section 03) describes the technical patterns and the "why." This document describes the "how" -- the specific decisions a component builder must make so that every component integrates with Drupal with minimal friction.

**The core principle**: Drupal renders HTML on the server. Your component receives that HTML as attributes and slot content. Design your component's public API around this reality, and the Drupal team's integration effort drops from days to hours.

**Who should read this**:

- Front-end developers building Lit Web Components for the WC (Web Components) library
- Designers defining component specifications that developers will implement
- Drupal theme developers who need to understand the component contract

**Conventions used in this document**:

- `hx-` prefix on all custom element tag names (Web Components)
- `--hx-` prefix on all CSS custom properties
- TWIG examples assume Drupal 10.3+ with standard field configurations
- All components use Lit 3.x with TypeScript strict mode

---

## 5.2 Drupal-Friendly Component Patterns

### 5.2.1 Attribute Naming Conventions

Drupal TWIG templates pass data to Web Components through HTML attributes. Every attribute name must be:

1. **kebab-case** (HTML standard)
2. **Descriptive enough to be self-documenting** in a TWIG template
3. **Mapped to a specific Drupal field** in the component's JSDoc

**DO -- Descriptive attribute names that map to Drupal fields:**

```html
<hx-content-card
  heading="Getting Started with Web Components"
  summary="Learn about fundamentals and best practices."
  publish-date="2026-02-10T00:00:00Z"
  author-name="Sarah Chen"
  content-type="article"
  read-time="8"
  category-label="Technology"
  category-url="/categories/technology"
  hero-image-src="/sites/default/files/web-components.jpg"
  hero-image-alt="Author working at a desk"
></hx-content-card>
```

**DO NOT -- Generic names that are ambiguous in a TWIG template:**

```html
<!-- BAD: What does "type" mean? Drupal content type? Visual variant? -->
<hx-content-card
  title="Getting Started with Web Components"
  type="article"
  author="Sarah Chen"
  date="2026-02-10"
  src="/sites/default/files/web-components.jpg"
></hx-content-card>
```

**Naming rules for attributes:**

| Rule                                 | Good             | Bad             | Reason                               |
| ------------------------------------ | ---------------- | --------------- | ------------------------------------ |
| Use kebab-case                       | `publish-date`   | `publishDate`   | HTML attributes are case-insensitive |
| Prefix ambiguous names               | `content-type`   | `type`          | `type` conflicts with native HTML    |
| Include the data shape               | `hero-image-src` | `image`         | Clarifies it expects a URL string    |
| Match Drupal field semantics         | `author-name`    | `author`        | Could be a name, ID, or object       |
| Use `-url` suffix for links          | `category-url`   | `category-link` | Explicit about the value type        |
| Use `-label` suffix for display text | `category-label` | `category`      | Distinguishes from machine name      |

**TypeScript property mapping:**

```typescript
/**
 * Author's display name.
 * Maps to Drupal field: `node.field_author.entity.field_display_name.value`
 */
@property({ type: String, attribute: 'author-name' })
authorName = '';

/**
 * Publication date in ISO 8601 format.
 * Maps to Drupal: `node.createdtime|date('c')`
 */
@property({ type: String, attribute: 'publish-date' })
publishDate = '';
```

### 5.2.2 Slot Patterns That Align with Drupal

Drupal's field rendering model outputs HTML fragments. Slots are the mechanism for injecting those fragments into your component. The key insight: **Drupal fields render as HTML, not as data. Slots accept HTML. Use slots for rendered content; use attributes for scalar values.**

**When to use an attribute vs. a slot:**

| Data Type                      | Use                        | Example                                               |
| ------------------------------ | -------------------------- | ----------------------------------------------------- |
| Plain string (title, label)    | Attribute                  | `heading="My Title"`                                  |
| Number (count, duration)       | Attribute                  | `read-time="8"`                                       |
| URL                            | Attribute                  | `href="/articles/my-article"`                         |
| ISO date string                | Attribute                  | `publish-date="2026-02-10T00:00:00Z"`                 |
| Boolean flag                   | Attribute (present/absent) | `featured`                                            |
| Enum (restricted values)       | Attribute                  | `variant="compact"`                                   |
| Rendered HTML (body text)      | Default slot               | `<p>Article body...</p>`                              |
| Rendered HTML (specific area)  | Named slot                 | `<img slot="media" ...>`                              |
| Drupal field with formatter    | Named slot                 | `<div slot="author">{{ content.field_author }}</div>` |
| Complex markup (tags, buttons) | Named slot                 | `<div slot="actions">{{ content.field_tags }}</div>`  |

**Named slot naming conventions:**

| Slot Name    | Purpose                | Drupal Mapping                                  |
| ------------ | ---------------------- | ----------------------------------------------- |
| (default)    | Primary content area   | `{{ content.body }}` or `{{ content }}`         |
| `media`      | Image, video, or audio | `{{ content.field_media }}`                     |
| `actions`    | CTA buttons, links     | Custom TWIG markup                              |
| `meta`       | Metadata (dates, tags) | `{{ content.field_tags }}`                      |
| `header`     | Header area content    | Custom TWIG markup                              |
| `footer`     | Footer area content    | Custom TWIG markup                              |
| `sidebar`    | Sidebar content        | Block/view content                              |
| `breadcrumb` | Breadcrumb navigation  | `{{ drupal_block('system_breadcrumb_block') }}` |
| `icon`       | Icon or small graphic  | `<hx-icon>` or `<svg>`                          |

**Slot fallback content** -- every slot should have meaningful fallback content that renders when the slot is empty:

```typescript
render() {
  return html`
    <div class="card__media">
      <slot name="media">
        <!-- Fallback: a placeholder that shows the component works without an image -->
        <div class="card__media-placeholder" aria-hidden="true"></div>
      </slot>
    </div>
    <div class="card__body">
      <h3 class="card__heading">${this.heading}</h3>
      <slot>
        <!-- Default slot fallback: renders summary text if no slotted content -->
        ${this.summary ? html`<p class="card__summary">${this.summary}</p>` : nothing}
      </slot>
    </div>
  `;
}
```

### 5.2.3 Event Naming for Drupal Behaviors

Drupal behaviors attach event listeners to DOM elements. Your component's custom events are the interface between the Web Component and Drupal's JavaScript layer.

**Event naming rules:**

1. Prefix all events with `hx-` to avoid collision with native DOM events
2. Use kebab-case: `hx-card-click`, `hx-form-submit`, `hx-nav-toggle`
3. Always set `bubbles: true` -- Drupal behaviors often listen at the document level
4. Always set `composed: true` -- events must cross Shadow DOM boundaries
5. Always include a typed `detail` payload with all relevant data

**Event detail contract -- always include:**

```typescript
// Every event must carry enough information for the Drupal behavior
// to act without querying the component for additional state.

interface CardClickDetail {
  /** The URL the card links to */
  href: string;
  /** The card heading (useful for analytics) */
  heading: string;
  /** How the user activated the card */
  activationMethod: 'click' | 'keyboard';
  /** Drupal node ID if available */
  nodeId?: string;
}
```

**Dispatching events correctly:**

```typescript
private _handleActivate(e: Event): void {
  // Do NOT preventDefault on the native event unless you are
  // replacing its behavior entirely.
  this.dispatchEvent(new CustomEvent<CardClickDetail>('hx-card-click', {
    bubbles: true,
    composed: true,
    detail: {
      href: this.href,
      heading: this.heading,
      activationMethod: 'click',
      nodeId: this.getAttribute('data-node-id') ?? undefined,
    },
  }));
}
```

**How Drupal behaviors consume these events:**

```javascript
// In the Drupal theme's JavaScript
(function (Drupal) {
  Drupal.behaviors.hxCardTracking = {
    attach(context) {
      const cards = once('hx-card-tracking', 'hx-content-card', context);
      cards.forEach((card) => {
        card.addEventListener('hx-card-click', (event) => {
          // event.detail is fully typed and documented
          console.log('Card clicked:', event.detail.heading);
        });
      });
    },
  };
})(Drupal);
```

### 5.2.4 Progressive Enhancement

Every component must render useful content before JavaScript loads. This is not optional -- it is a requirement for SEO, accessibility, and enterprise compliance.

**Strategy: meaningful slot content is the fallback.**

In Drupal, the server renders the TWIG template first. The Web Component's JavaScript then upgrades the markup with interactivity, encapsulated styles, and enhanced behavior. If JavaScript fails to load, the slot content is still visible as plain HTML.

**Before JavaScript loads:**

```html
<!-- Server-rendered HTML from Drupal TWIG -->
<hx-content-card heading="Getting Started with Lit" href="/articles/getting-started-with-lit">
  <img slot="media" src="/files/web-components.jpg" alt="Author working at a desk" loading="lazy" />
  <p>Learn about the fundamentals, best practices, and practical patterns.</p>
  <div slot="actions">
    <a href="/articles/getting-started-with-lit">Read More</a>
  </div>
</hx-content-card>
```

Before the component's JavaScript loads, the browser renders `<hx-content-card>` as an unknown element -- a block-level box with its children visible in the light DOM. The image, paragraph, and link are all visible and functional.

**After JavaScript loads:**

The Lit component upgrades the element, attaches Shadow DOM, and projects the slot content into the designed layout with scoped styles.

**CSS to handle the unregistered state:**

```css
/* In the document's global CSS (not inside Shadow DOM) */
/* Provide basic layout before component JS loads */
hx-content-card:not(:defined) {
  display: block;
  border: 1px solid var(--hx-color-border, #e2e8f0);
  border-radius: 8px;
  padding: 1rem;
  overflow: hidden;
}

hx-content-card:not(:defined) [slot='media'] img {
  width: 100%;
  height: auto;
  display: block;
}

/* Hide elements that only make sense after upgrade */
hx-content-card:not(:defined) .js-only {
  display: none;
}
```

**The `:defined` pseudo-class** targets elements whose custom element constructor has been registered. Use `:not(:defined)` for pre-upgrade styles and `:defined` for post-upgrade adjustments.

---

## 5.3 Data Structure Patterns

### 5.3.1 Flat Attribute Structure

Drupal fields are flat. A node has `field_title`, `field_summary`, `field_author` -- not a nested JSON object. Design your component's attribute API to mirror this flatness.

**DO -- flat attributes that map 1:1 to Drupal fields:**

```typescript
@property({ type: String }) heading = '';
@property({ type: String }) summary = '';
@property({ type: String, attribute: 'author-name' }) authorName = '';
@property({ type: String, attribute: 'author-avatar' }) authorAvatar = '';
@property({ type: String, attribute: 'publish-date' }) publishDate = '';
@property({ type: Number, attribute: 'read-time' }) readTime = 0;
```

**DO NOT -- nested JSON that forces Drupal to serialize data:**

```typescript
// BAD: Forces the TWIG template to JSON-encode an object
@property({ type: Object })
author = { name: '', avatar: '', bio: '' };
```

### 5.3.2 String-Based Attributes

HTML attributes are always strings. Lit converts them via the `type` option in `@property()`, but the TWIG template always outputs a string.

**Type conversion rules:**

| Lit Property Type | HTML Attribute Value           | TWIG Output                              |
| ----------------- | ------------------------------ | ---------------------------------------- |
| `String`          | `"value"`                      | `{{ field_value }}`                      |
| `Number`          | `"42"`                         | `{{ field_number }}`                     |
| `Boolean`         | Present = true, absent = false | `{% if condition %}attribute{% endif %}` |

```typescript
// String: rendered as-is
@property({ type: String }) heading = '';

// Number: Lit parses the string to a number
@property({ type: Number, attribute: 'read-time' }) readTime = 0;

// Boolean: presence of attribute = true, absence = false
@property({ type: Boolean, reflect: true }) featured = false;
```

**TWIG output for each type:**

```twig
<hx-content-card
  heading="{{ node.label }}"
  read-time="{{ content.field_read_time|render|striptags|trim }}"
  {{ node.isPromoted ? 'featured' : '' }}
>
```

### 5.3.3 JSON Attributes -- When and How

Occasionally, a component needs structured data that cannot be expressed as flat attributes. Use JSON attributes sparingly and only when:

1. The data is a collection (array of items)
2. The items have internal structure that attributes cannot express
3. The alternative would be 10+ attributes with numeric suffixes

**Acceptable: navigation items**

```typescript
/**
 * Navigation items as JSON array.
 * Each item: { label: string, href: string, active?: boolean, children?: NavItem[] }
 *
 * Maps to Drupal: Menu link tree serialized via custom TWIG extension or preprocess hook.
 */
@property({ type: Array, attribute: 'items' })
items: NavItem[] = [];
```

```twig
{# The Drupal theme preprocessor serializes the menu tree #}
<hx-nav items='{{ menu_items_json }}'></hx-nav>
```

**Rules for JSON attributes:**

1. Use `type: Array` or `type: Object` -- Lit will `JSON.parse()` the attribute value
2. Document the expected JSON schema in JSDoc
3. Always validate the parsed data defensively (it could be malformed)
4. Provide a meaningful empty state when the JSON is missing or invalid
5. Prefer a Drupal preprocess hook or TWIG extension to generate the JSON -- do not force the TWIG template to hand-build JSON strings

### 5.3.4 Boolean Attributes

HTML boolean attributes follow the spec: **the attribute is present = true, the attribute is absent = false**. The attribute's value does not matter (`disabled`, `disabled=""`, and `disabled="disabled"` are all true).

```typescript
// Correct: Lit handles boolean attribute presence/absence
@property({ type: Boolean, reflect: true }) featured = false;
@property({ type: Boolean, reflect: true }) disabled = false;
@property({ type: Boolean, reflect: true }) loading = false;
```

**TWIG usage:**

```twig
{# Correct: conditionally add the attribute #}
<hx-content-card
  heading="{{ node.label }}"
  {{ node.isPromoted ? 'featured' : '' }}
  {{ is_loading ? 'loading' : '' }}
>
```

**Never do this:**

```twig
{# WRONG: featured="false" means featured IS present, so Lit reads it as true #}
<hx-content-card featured="false">
```

### 5.3.5 Enum Attributes

When an attribute accepts a restricted set of values, document the valid options and provide a default.

```typescript
/**
 * Visual variant of the card.
 * - `default`: Standard card with border
 * - `featured`: Larger card with accent border
 * - `compact`: Minimal card for sidebar use
 */
@property({ type: String, reflect: true })
variant: 'default' | 'featured' | 'compact' = 'default';
```

**Why `reflect: true` for enums**: Reflecting the attribute allows CSS selectors like `:host([variant="featured"])` to work. This enables variant-specific styling without JavaScript.

**TWIG usage:**

```twig
<hx-content-card variant="{{ view_mode == 'teaser_featured' ? 'featured' : 'default' }}">
```

### 5.3.6 Required vs. Optional Attributes

Every component should work with only its required attributes. Optional attributes enhance the component but never break it.

**Document required vs. optional clearly in JSDoc:**

```typescript
/**
 * Card heading text. REQUIRED.
 * The component renders an empty heading area if this is not provided.
 */
@property({ type: String }) heading = '';

/**
 * Summary or teaser text. Optional.
 * When empty, the summary area is not rendered.
 */
@property({ type: String }) summary = '';
```

**Defensive rendering:**

```typescript
render() {
  return html`
    <h3 class="card__heading">${this.heading || 'Untitled'}</h3>
    ${this.summary
      ? html`<p class="card__summary">${this.summary}</p>`
      : nothing}
    ${this.readTime > 0
      ? html`<span class="card__meta">${this.readTime} min read</span>`
      : nothing}
  `;
}
```

---

## 5.4 Common Component Patterns

This section provides complete implementation guides for 12 components that cover the primary content hub use cases. Each component includes its full attribute API, slot structure, events, CSS custom properties, accessibility requirements, and a Drupal TWIG template example.

---

### 5.4.1 Content Card (`hx-content-card`)

**Purpose**: The primary content discovery element. Renders article, blog post, or resource previews in listing pages, search results, and sidebar widgets.

**Drupal view mode**: `node--article--teaser`

#### Attribute API

| Attribute        | Type   | Required | Default     | Drupal Source                                         |
| ---------------- | ------ | -------- | ----------- | ----------------------------------------------------- |
| `heading`        | String | Yes      | `''`        | `node.label`                                          |
| `summary`        | String | No       | `''`        | `field_summary` (Plain text)                          |
| `href`           | String | No       | `''`        | `{{ url }}` (Node canonical URL)                      |
| `publish-date`   | String | No       | `''`        | `node.createdtime\|date('c')`                         |
| `author-name`    | String | No       | `''`        | `field_author.entity.field_display_name`              |
| `category`       | String | No       | `''`        | `field_category.entity.label`                         |
| `read-time`      | Number | No       | `0`         | `field_read_time` (Integer)                           |
| `variant`        | String | No       | `'default'` | Derived from view mode or `is_promoted`               |
| `hero-image-src` | String | No       | `''`        | `field_media.entity.field_media_image.entity.uri.url` |
| `hero-image-alt` | String | No       | `''`        | `field_media.entity.field_media_image.alt`            |

#### Slot Structure

| Slot      | Purpose                 | Typical Drupal Content      |
| --------- | ----------------------- | --------------------------- |
| (default) | Additional body content | `{{ content.body }}`        |
| `media`   | Hero image or video     | `{{ content.field_media }}` |
| `actions` | CTA buttons, tag links  | `{{ content.field_tags }}`  |
| `meta`    | Additional metadata     | Custom date/author markup   |

#### Events

| Event           | Detail Type                                                                  | When Fired                             |
| --------------- | ---------------------------------------------------------------------------- | -------------------------------------- |
| `hx-card-click` | `{ href: string, heading: string, activationMethod: 'click' \| 'keyboard' }` | Card activated by click or Enter/Space |

#### CSS Custom Properties

| Property                 | Default                   | Purpose          |
| ------------------------ | ------------------------- | ---------------- |
| `--hx-card-radius`       | `var(--hx-radius-md)`     | Border radius    |
| `--hx-card-padding`      | `var(--hx-spacing-lg)`    | Internal padding |
| `--hx-card-bg`           | `var(--hx-color-surface)` | Background color |
| `--hx-card-shadow`       | `var(--hx-shadow-sm)`     | Box shadow       |
| `--hx-card-hover-shadow` | `var(--hx-shadow-md)`     | Hover box shadow |
| `--hx-card-border-color` | `var(--hx-color-border)`  | Border color     |

#### Accessibility

- Card heading uses `<h3>` (configurable via `heading-level` attribute for list context)
- When `href` is set, the card wrapper is an `<a>` element (native link semantics)
- When `href` is absent, the card wrapper is a `<div>` with `role="button"` and `tabindex="0"`
- Focus ring visible on `:focus-visible` with minimum 3:1 contrast ratio
- Color is never the sole indicator of category -- text label always present

#### Drupal TWIG Template

```twig
{# templates/node--article--teaser.html.twig #}
{#
  WC Content Card Integration
  =============================
  Maps Drupal article node fields to the hx-content-card web component.

  Required Drupal fields:
    - title (core)
    - field_summary (Plain text, required)
    - field_category (Term reference, single value)

  Optional Drupal fields:
    - field_media (Media reference: Image or Video)
    - field_read_time (Integer, computed or manual)
    - field_author (Entity reference: User or Author CT)
    - field_tags (Term reference, multi-value)

  Component docs: [Storybook URL]/organisms-content-card--docs
#}

{#-- Extract field values into TWIG variables for clarity --#}
{%- set card_heading = label[0]['#title'] | default(node.label) -%}
{%- set card_summary = content.field_summary|render|striptags|trim -%}
{%- set card_category = node.field_category.entity.label -%}
{%- set card_href = url -%}
{%- set card_date = node.createdtime|date('c') -%}
{%- set card_read_time = content.field_read_time|render|striptags|trim -%}
{%- set card_variant = is_promoted ? 'featured' : 'default' -%}
{%- set card_author = node.field_author.entity.field_display_name.value | default('') -%}

<hx-content-card
  heading="{{ card_heading }}"
  summary="{{ card_summary }}"
  category="{{ card_category }}"
  href="{{ card_href }}"
  publish-date="{{ card_date }}"
  read-time="{{ card_read_time }}"
  variant="{{ card_variant }}"
  author-name="{{ card_author }}"
  data-node-id="{{ node.id }}"
  {{ attributes }}
>
  {#-- Media slot: Drupal's media field renders responsive images automatically --#}
  {% if content.field_media|render|trim is not empty %}
    <div slot="media">
      {{ content.field_media }}
    </div>
  {% endif %}

  {#-- Actions slot: tag links rendered by Drupal's field formatter --#}
  {% if content.field_tags|render|trim is not empty %}
    <div slot="actions">
      {{ content.field_tags }}
    </div>
  {% endif %}
</hx-content-card>
```

---

### 5.4.2 Article Header (`hx-article-header`)

**Purpose**: Renders the metadata banner at the top of a full article page. Displays author, publication date, reading time, categories, and social share options.

**Drupal view mode**: `node--article--full` (header region)

#### Attribute API

| Attribute       | Type   | Required | Default | Drupal Source                                     |
| --------------- | ------ | -------- | ------- | ------------------------------------------------- |
| `heading`       | String | Yes      | `''`    | `node.label`                                      |
| `author-name`   | String | No       | `''`    | `field_author.entity.field_display_name`          |
| `author-avatar` | String | No       | `''`    | `field_author.entity.user_picture.entity.uri.url` |
| `publish-date`  | String | No       | `''`    | `node.createdtime\|date('c')`                     |
| `updated-date`  | String | No       | `''`    | `node.changedtime\|date('c')`                     |
| `read-time`     | Number | No       | `0`     | `field_read_time` (Integer)                       |
| `category`      | String | No       | `''`    | `field_category.entity.label`                     |
| `category-url`  | String | No       | `''`    | `field_category.entity.url`                       |

#### Slot Structure

| Slot         | Purpose                     | Typical Drupal Content     |
| ------------ | --------------------------- | -------------------------- |
| `byline`     | Custom author/byline markup | Author bio block           |
| `share`      | Social share buttons        | Share module output        |
| `breadcrumb` | Breadcrumb navigation       | System breadcrumb block    |
| `tags`       | Taxonomy term links         | `{{ content.field_tags }}` |

#### Events

| Event            | Detail Type                         | When Fired                  |
| ---------------- | ----------------------------------- | --------------------------- |
| `hx-share-click` | `{ platform: string, url: string }` | Social share button clicked |

#### CSS Custom Properties

| Property                        | Default                  | Purpose             |
| ------------------------------- | ------------------------ | ------------------- |
| `--hx-article-header-bg`        | `transparent`            | Header background   |
| `--hx-article-header-border`    | `var(--hx-color-border)` | Bottom border color |
| `--hx-article-header-padding`   | `var(--hx-spacing-xl)`   | Internal padding    |
| `--hx-article-header-max-width` | `720px`                  | Content max width   |

#### Accessibility

- Heading element uses appropriate level (default `<h1>` for article pages)
- Author name is linked to author profile when URL is available
- `<time>` element with `datetime` attribute for publish and updated dates
- Reading time announced as "estimated reading time" for screen readers

#### Drupal TWIG Template

```twig
{# templates/node--article--full.html.twig (header region) #}
{#
  WC Article Header Integration
  ===============================
  Renders the article metadata header above the body content.

  This template shows only the header portion. The article body
  and sidebar content are handled by the hx-article-layout component.
#}

{%- set article_heading = label[0]['#title'] | default(node.label) -%}
{%- set article_author = node.field_author.entity.field_display_name.value | default('') -%}
{%- set article_avatar = '' -%}
{% if node.field_author.entity.user_picture.entity %}
  {%- set article_avatar = file_url(node.field_author.entity.user_picture.entity.fileuri) -%}
{% endif %}
{%- set article_date = node.createdtime|date('c') -%}
{%- set article_updated = node.changedtime|date('c') -%}
{%- set article_read_time = content.field_read_time|render|striptags|trim -%}
{%- set article_category = node.field_category.entity.label -%}
{%- set article_category_url = path('entity.taxonomy_term.canonical', {'taxonomy_term': node.field_category.entity.id}) -%}

<hx-article-header
  heading="{{ article_heading }}"
  author-name="{{ article_author }}"
  author-avatar="{{ article_avatar }}"
  publish-date="{{ article_date }}"
  updated-date="{{ article_updated }}"
  read-time="{{ article_read_time }}"
  category="{{ article_category }}"
  category-url="{{ article_category_url }}"
  {{ attributes }}
>
  {#-- Breadcrumb slot --#}
  <nav slot="breadcrumb" aria-label="Breadcrumb">
    {{ drupal_block('system_breadcrumb_block') }}
  </nav>

  {#-- Tags slot --#}
  {% if content.field_tags|render|trim is not empty %}
    <div slot="tags">
      {{ content.field_tags }}
    </div>
  {% endif %}

  {#-- Share slot: provided by a contrib module like Better Social Sharing Buttons --#}
  {% if content.field_share_buttons|render|trim is not empty %}
    <div slot="share">
      {{ content.field_share_buttons }}
    </div>
  {% endif %}
</hx-article-header>
```

---

### 5.4.3 Media Component (`hx-media`)

**Purpose**: Unified media display component supporting images, videos, and audio. Handles responsive images from Drupal image styles, lazy loading, and aspect ratio enforcement.

**Drupal mapping**: `field--field-media-image.html.twig`, `field--field-media-video.html.twig`

#### Attribute API

| Attribute        | Type   | Required | Default   | Drupal Source                                 |
| ---------------- | ------ | -------- | --------- | --------------------------------------------- |
| `type`           | String | Yes      | `'image'` | Media entity bundle                           |
| `src`            | String | Yes      | `''`      | Image style URL or video embed URL            |
| `alt`            | String | Cond.    | `''`      | `field_media_image.alt` (required for images) |
| `width`          | Number | No       | `0`       | Image intrinsic width                         |
| `height`         | Number | No       | `0`       | Image intrinsic height                        |
| `srcset`         | String | No       | `''`      | Drupal responsive image srcset                |
| `sizes`          | String | No       | `''`      | Drupal responsive image sizes                 |
| `aspect-ratio`   | String | No       | `''`      | Aspect ratio (e.g., `16/9`, `4/3`)            |
| `loading`        | String | No       | `'lazy'`  | `'lazy'` or `'eager'`                         |
| `caption`        | String | No       | `''`      | `field_media_image.title` or custom field     |
| `video-provider` | String | No       | `''`      | `'youtube'`, `'vimeo'`, or `'self'`           |
| `poster`         | String | No       | `''`      | Video poster image URL                        |

#### Slot Structure

| Slot       | Purpose                                 | Typical Drupal Content        |
| ---------- | --------------------------------------- | ----------------------------- |
| (default)  | Caption or overlay content              | `{{ content.field_caption }}` |
| `fallback` | Content shown while loading or on error | Placeholder markup            |

#### Events

| Event            | Detail Type                      | When Fired                  |
| ---------------- | -------------------------------- | --------------------------- |
| `hx-media-load`  | `{ src: string, type: string }`  | Media has loaded            |
| `hx-media-error` | `{ src: string, error: string }` | Media failed to load        |
| `hx-media-play`  | `{ src: string }`                | Video/audio started playing |

#### CSS Custom Properties

| Property                  | Default                          | Purpose                          |
| ------------------------- | -------------------------------- | -------------------------------- |
| `--hx-media-radius`       | `var(--hx-radius-md)`            | Border radius                    |
| `--hx-media-bg`           | `var(--hx-color-surface-raised)` | Background (visible during load) |
| `--hx-media-aspect-ratio` | `auto`                           | Aspect ratio override            |
| `--hx-media-object-fit`   | `cover`                          | Image object-fit                 |

#### Accessibility

- Images require `alt` text -- the component renders a console warning if `type="image"` and `alt` is empty
- Videos include `<track>` element support via slot for closed captions
- `loading="lazy"` by default; set `loading="eager"` for above-the-fold images
- Respects `prefers-reduced-motion` for video autoplay

#### Drupal TWIG Template

```twig
{# templates/field--field-media-image.html.twig #}
{#
  WC Media Component Integration
  ================================
  Wraps Drupal's media image field output in the hx-media component.

  This template is used when the field_media_image field is displayed
  using Drupal's responsive image formatter.

  IMPORTANT: Drupal's responsive image formatter already generates
  <picture> and <source> elements. For simple images, use the
  attribute-based approach. For Drupal's responsive image output,
  use the slot approach to pass through the rendered field.
#}

{% for item in items %}
  {%- set media_entity = item.content['#media'] | default(null) -%}
  {%- set image_alt = item.content['#item'].alt | default('') -%}

  {#-- Option A: Simple image with attributes --#}
  {% if item.content['#image_style'] is defined %}
    <hx-media
      type="image"
      src="{{ item.content['#uri'] | image_style(item.content['#image_style']) }}"
      alt="{{ image_alt }}"
      width="{{ item.content['#width'] | default(0) }}"
      height="{{ item.content['#height'] | default(0) }}"
      loading="{{ loop.first ? 'eager' : 'lazy' }}"
      {{ attributes }}
    ></hx-media>

  {#-- Option B: Drupal responsive image (pass through rendered output) --#}
  {% else %}
    <hx-media
      type="image"
      alt="{{ image_alt }}"
      loading="{{ loop.first ? 'eager' : 'lazy' }}"
      {{ attributes }}
    >
      {#-- Drupal's rendered responsive image goes into the default slot --#}
      {{ item.content }}
    </hx-media>
  {% endif %}
{% endfor %}
```

---

### 5.4.4 Text Input (`hx-text-input`)

**Purpose**: Accessible text input for enterprise forms. Fully participates in native `<form>` elements via the `ElementInternals` API (form-associated custom element).

**Drupal mapping**: Form API textfield element

#### Attribute API

| Attribute       | Type    | Required | Default  | Drupal Source                                                   |
| --------------- | ------- | -------- | -------- | --------------------------------------------------------------- |
| `label`         | String  | Yes      | `''`     | Form element `#title`                                           |
| `name`          | String  | Yes      | `''`     | Form element `#name`                                            |
| `value`         | String  | No       | `''`     | Form element `#default_value`                                   |
| `type`          | String  | No       | `'text'` | `'text'`, `'email'`, `'tel'`, `'url'`, `'password'`, `'search'` |
| `placeholder`   | String  | No       | `''`     | Form element `#placeholder`                                     |
| `required`      | Boolean | No       | `false`  | Form element `#required`                                        |
| `disabled`      | Boolean | No       | `false`  | Form element `#disabled`                                        |
| `readonly`      | Boolean | No       | `false`  | Form element `#attributes.readonly`                             |
| `error-message` | String  | No       | `''`     | Server-side validation error                                    |
| `help-text`     | String  | No       | `''`     | Form element `#description`                                     |
| `maxlength`     | Number  | No       | `0`      | Form element `#maxlength`                                       |
| `pattern`       | String  | No       | `''`     | Form element `#pattern`                                         |
| `autocomplete`  | String  | No       | `''`     | HTML autocomplete attribute value                               |

#### Slot Structure

| Slot     | Purpose                   | Typical Drupal Content        |
| -------- | ------------------------- | ----------------------------- |
| `prefix` | Icon or text before input | Icon markup                   |
| `suffix` | Icon or text after input  | Character count, clear button |

#### Events

| Event        | Detail Type                                                | When Fired                     |
| ------------ | ---------------------------------------------------------- | ------------------------------ |
| `hx-input`   | `{ value: string, name: string }`                          | On each keystroke              |
| `hx-change`  | `{ value: string, name: string }`                          | On blur when value has changed |
| `hx-invalid` | `{ value: string, name: string, validity: ValidityState }` | On validation failure          |

#### CSS Custom Properties

| Property                        | Default                                     | Purpose          |
| ------------------------------- | ------------------------------------------- | ---------------- |
| `--hx-input-border-color`       | `var(--hx-color-border)`                    | Input border     |
| `--hx-input-border-color-focus` | `var(--hx-color-primary)`                   | Focus border     |
| `--hx-input-border-color-error` | `var(--hx-color-error)`                     | Error border     |
| `--hx-input-bg`                 | `var(--hx-color-surface)`                   | Input background |
| `--hx-input-radius`             | `var(--hx-radius-sm)`                       | Border radius    |
| `--hx-input-padding`            | `var(--hx-spacing-sm) var(--hx-spacing-md)` | Internal padding |
| `--hx-input-font-size`          | `var(--hx-font-size-base)`                  | Font size        |

#### Accessibility (WCAG for Forms)

- Every input has a visible, programmatically associated `<label>` (WCAG 1.3.1)
- Error messages use `role="alert"` for immediate screen reader announcement (WCAG 3.3.1)
- Error messages describe how to fix the issue, not just what is wrong (WCAG 3.3.3)
- Required fields indicated both visually (asterisk) and programmatically (`aria-required`) (WCAG 3.3.2)
- Help text connected via `aria-describedby`
- Color alone never indicates state -- errors use icon + text + border change (WCAG 1.4.1)
- Minimum 44x44px touch target (WCAG 2.5.8)

#### Drupal TWIG Template

```twig
{# templates/form-element--textfield.html.twig #}
{#
  WC Text Input Integration
  ===========================
  Replaces Drupal's default form element rendering for textfield types.

  This override maps Drupal Form API properties to hx-text-input attributes.
  The component handles all visual rendering, validation display, and
  accessibility attributes internally.

  IMPORTANT: The hx-text-input component is form-associated via
  ElementInternals. It participates in native <form> submission
  and FormData collection without hidden inputs.
#}

{%- set input_label = element['#title'] | default('') -%}
{%- set input_name = element['#name'] | default('') -%}
{%- set input_value = element['#value'] | default('') -%}
{%- set input_type = element['#type'] | default('text') -%}
{%- set input_required = element['#required'] | default(false) -%}
{%- set input_disabled = element['#disabled'] | default(false) -%}
{%- set input_description = element['#description'] | render | striptags | trim -%}
{%- set input_error = element['#errors'] | render | striptags | trim -%}
{%- set input_maxlength = element['#maxlength'] | default(0) -%}
{%- set input_placeholder = element['#placeholder'] | default('') -%}
{%- set input_pattern = element['#pattern'] | default('') -%}

<hx-text-input
  label="{{ input_label }}"
  name="{{ input_name }}"
  value="{{ input_value }}"
  type="{{ input_type }}"
  placeholder="{{ input_placeholder }}"
  {{ input_required ? 'required' : '' }}
  {{ input_disabled ? 'disabled' : '' }}
  {% if input_description %}help-text="{{ input_description }}"{% endif %}
  {% if input_error %}error-message="{{ input_error }}"{% endif %}
  {% if input_maxlength > 0 %}maxlength="{{ input_maxlength }}"{% endif %}
  {% if input_pattern %}pattern="{{ input_pattern }}"{% endif %}
  {{ attributes }}
></hx-text-input>
```

---

### 5.4.5 Textarea (`hx-textarea`)

**Purpose**: Multi-line text input for enterprise forms. Supports character counting, auto-resize, and the same validation patterns as `hx-text-input`.

**Drupal mapping**: Form API textarea element

#### Attribute API

| Attribute       | Type    | Required | Default | Drupal Source                 |
| --------------- | ------- | -------- | ------- | ----------------------------- |
| `label`         | String  | Yes      | `''`    | Form element `#title`         |
| `name`          | String  | Yes      | `''`    | Form element `#name`          |
| `value`         | String  | No       | `''`    | Form element `#default_value` |
| `rows`          | Number  | No       | `4`     | Form element `#rows`          |
| `required`      | Boolean | No       | `false` | Form element `#required`      |
| `disabled`      | Boolean | No       | `false` | Form element `#disabled`      |
| `maxlength`     | Number  | No       | `0`     | Form element `#maxlength`     |
| `error-message` | String  | No       | `''`    | Server-side validation error  |
| `help-text`     | String  | No       | `''`    | Form element `#description`   |
| `auto-resize`   | Boolean | No       | `false` | Auto-grow with content        |
| `show-count`    | Boolean | No       | `false` | Show character count          |

#### Events

| Event       | Detail Type                                       | When Fired                 |
| ----------- | ------------------------------------------------- | -------------------------- |
| `hx-input`  | `{ value: string, name: string, length: number }` | On each input event        |
| `hx-change` | `{ value: string, name: string }`                 | On blur when value changed |

#### Drupal TWIG Template

```twig
{# templates/form-element--textarea.html.twig #}

{%- set ta_label = element['#title'] | default('') -%}
{%- set ta_name = element['#name'] | default('') -%}
{%- set ta_value = element['#value'] | default('') -%}
{%- set ta_rows = element['#rows'] | default(4) -%}
{%- set ta_required = element['#required'] | default(false) -%}
{%- set ta_description = element['#description'] | render | striptags | trim -%}
{%- set ta_error = element['#errors'] | render | striptags | trim -%}
{%- set ta_maxlength = element['#maxlength'] | default(0) -%}

<hx-textarea
  label="{{ ta_label }}"
  name="{{ ta_name }}"
  value="{{ ta_value }}"
  rows="{{ ta_rows }}"
  {{ ta_required ? 'required' : '' }}
  {% if ta_description %}help-text="{{ ta_description }}"{% endif %}
  {% if ta_error %}error-message="{{ ta_error }}"{% endif %}
  {% if ta_maxlength > 0 %}maxlength="{{ ta_maxlength }}" show-count{% endif %}
  {{ attributes }}
></hx-textarea>
```

---

### 5.4.6 Select (`hx-select`)

**Purpose**: Dropdown selection for enterprise forms. Supports single and multiple selection, option groups, and search/filter for long lists.

**Drupal mapping**: Form API select element

#### Attribute API

| Attribute       | Type         | Required | Default       | Drupal Source                        |
| --------------- | ------------ | -------- | ------------- | ------------------------------------ |
| `label`         | String       | Yes      | `''`          | Form element `#title`                |
| `name`          | String       | Yes      | `''`          | Form element `#name`                 |
| `value`         | String       | No       | `''`          | Form element `#default_value`        |
| `options`       | Array (JSON) | Yes      | `[]`          | Form element `#options` (serialized) |
| `required`      | Boolean      | No       | `false`       | Form element `#required`             |
| `disabled`      | Boolean      | No       | `false`       | Form element `#disabled`             |
| `multiple`      | Boolean      | No       | `false`       | Form element `#multiple`             |
| `placeholder`   | String       | No       | `'Select...'` | Empty option text                    |
| `searchable`    | Boolean      | No       | `false`       | Enable filter for long lists         |
| `error-message` | String       | No       | `''`          | Server-side validation error         |
| `help-text`     | String       | No       | `''`          | Form element `#description`          |

**Options JSON format:**

```json
[
  { "value": "technology", "label": "Technology" },
  { "value": "design", "label": "Design" },
  {
    "label": "Development",
    "options": [
      { "value": "frontend", "label": "Frontend" },
      { "value": "backend", "label": "Backend" }
    ]
  }
]
```

#### Events

| Event       | Detail Type                                   | When Fired        |
| ----------- | --------------------------------------------- | ----------------- |
| `hx-change` | `{ value: string \| string[], name: string }` | Selection changed |

#### Accessibility

- Uses `role="listbox"` pattern for custom rendering with full keyboard navigation
- Arrow keys navigate options, Enter selects, Escape closes
- Active descendant pattern for screen reader announcements
- Searchable mode announces result count as options are filtered

#### Drupal TWIG Template

```twig
{# templates/form-element--select.html.twig #}
{#
  WC Select Integration
  =======================
  Drupal's Form API #options are an associative array.
  We serialize to JSON for the component's options attribute.

  For simple selects (<20 options), the flat attribute works well.
  For complex selects with optgroups, preprocess in a theme hook.
#}

{#-- Serialize Drupal options to JSON --#}
{%- set options_json = [] -%}
{% for key, label in element['#options'] %}
  {% if label is iterable %}
    {#-- Optgroup --#}
    {%- set group_options = [] -%}
    {% for sub_key, sub_label in label %}
      {%- set group_options = group_options|merge([{ 'value': sub_key, 'label': sub_label }]) -%}
    {% endfor %}
    {%- set options_json = options_json|merge([{ 'label': key, 'options': group_options }]) -%}
  {% else %}
    {%- set options_json = options_json|merge([{ 'value': key, 'label': label }]) -%}
  {% endif %}
{% endfor %}

<hx-select
  label="{{ element['#title'] | default('') }}"
  name="{{ element['#name'] | default('') }}"
  value="{{ element['#value'] | default('') }}"
  options='{{ options_json | json_encode }}'
  {{ element['#required'] | default(false) ? 'required' : '' }}
  {{ element['#multiple'] | default(false) ? 'multiple' : '' }}
  {% if element['#description'] %}help-text="{{ element['#description'] | render | striptags | trim }}"{% endif %}
  {% if element['#errors'] %}error-message="{{ element['#errors'] | render | striptags | trim }}"{% endif %}
  {{ attributes }}
></hx-select>
```

---

### 5.4.7 Checkbox (`hx-checkbox`)

**Purpose**: Single checkbox for boolean options in enterprise forms.

**Drupal mapping**: Form API checkbox element

#### Attribute API

| Attribute       | Type    | Required | Default | Drupal Source                 |
| --------------- | ------- | -------- | ------- | ----------------------------- |
| `label`         | String  | Yes      | `''`    | Form element `#title`         |
| `name`          | String  | Yes      | `''`    | Form element `#name`          |
| `value`         | String  | No       | `'on'`  | Form element `#return_value`  |
| `checked`       | Boolean | No       | `false` | Form element `#default_value` |
| `required`      | Boolean | No       | `false` | Form element `#required`      |
| `disabled`      | Boolean | No       | `false` | Form element `#disabled`      |
| `error-message` | String  | No       | `''`    | Server-side validation error  |

#### Events

| Event       | Detail Type                                         | When Fired       |
| ----------- | --------------------------------------------------- | ---------------- |
| `hx-change` | `{ checked: boolean, value: string, name: string }` | Checkbox toggled |

#### Accessibility

- Label is always visible and clickable (WCAG 1.3.1)
- Uses native `<input type="checkbox">` inside Shadow DOM for form participation
- Indeterminate state supported via `indeterminate` property
- Minimum 44x44px touch target including label area

#### Drupal TWIG Template

```twig
{# templates/form-element--checkbox.html.twig #}

<hx-checkbox
  label="{{ element['#title'] | default('') }}"
  name="{{ element['#name'] | default('') }}"
  value="{{ element['#return_value'] | default('on') }}"
  {{ element['#default_value'] ? 'checked' : '' }}
  {{ element['#required'] | default(false) ? 'required' : '' }}
  {{ element['#disabled'] | default(false) ? 'disabled' : '' }}
  {% if element['#errors'] %}error-message="{{ element['#errors'] | render | striptags | trim }}"{% endif %}
  {{ attributes }}
></hx-checkbox>
```

---

### 5.4.8 Radio Group (`hx-radio-group`)

**Purpose**: Radio button group for mutually exclusive options. The group component manages the collection; individual radio buttons are rendered internally.

**Drupal mapping**: Form API radios element

#### Attribute API

| Attribute       | Type         | Required | Default      | Drupal Source                        |
| --------------- | ------------ | -------- | ------------ | ------------------------------------ |
| `legend`        | String       | Yes      | `''`         | Form element `#title`                |
| `name`          | String       | Yes      | `''`         | Form element `#name`                 |
| `value`         | String       | No       | `''`         | Form element `#default_value`        |
| `options`       | Array (JSON) | Yes      | `[]`         | Form element `#options` (serialized) |
| `required`      | Boolean      | No       | `false`      | Form element `#required`             |
| `disabled`      | Boolean      | No       | `false`      | Form element `#disabled`             |
| `orientation`   | String       | No       | `'vertical'` | `'vertical'` or `'horizontal'`       |
| `error-message` | String       | No       | `''`         | Server-side validation error         |
| `help-text`     | String       | No       | `''`         | Form element `#description`          |

**Options JSON format:**

```json
[
  { "value": "yes", "label": "Yes" },
  { "value": "no", "label": "No" },
  { "value": "unsure", "label": "Not sure", "disabled": true }
]
```

#### Events

| Event       | Detail Type                       | When Fired        |
| ----------- | --------------------------------- | ----------------- |
| `hx-change` | `{ value: string, name: string }` | Selection changed |

#### Accessibility

- Wraps radio buttons in `<fieldset>` with `<legend>` (WCAG 1.3.1)
- Arrow key navigation within the group (WCAG standard radio pattern)
- `aria-required` on the fieldset when required

#### Drupal TWIG Template

```twig
{# templates/form-element--radios.html.twig #}

{%- set radio_options = [] -%}
{% for key, label in element['#options'] %}
  {%- set radio_options = radio_options|merge([{ 'value': key, 'label': label }]) -%}
{% endfor %}

<hx-radio-group
  legend="{{ element['#title'] | default('') }}"
  name="{{ element['#name'] | default('') }}"
  value="{{ element['#default_value'] | default('') }}"
  options='{{ radio_options | json_encode }}'
  {{ element['#required'] | default(false) ? 'required' : '' }}
  {{ element['#disabled'] | default(false) ? 'disabled' : '' }}
  {% if element['#description'] %}help-text="{{ element['#description'] | render | striptags | trim }}"{% endif %}
  {% if element['#errors'] %}error-message="{{ element['#errors'] | render | striptags | trim }}"{% endif %}
  {{ attributes }}
></hx-radio-group>
```

---

### 5.4.9 Navigation (`hx-nav`)

**Purpose**: Primary site navigation component. Consumes the Drupal menu tree and renders a responsive navigation with mobile drawer support.

**Drupal mapping**: `block--system-main-menu.html.twig` or `menu--main.html.twig`

#### Attribute API

| Attribute           | Type         | Required | Default             | Drupal Source                  |
| ------------------- | ------------ | -------- | ------------------- | ------------------------------ |
| `items`             | Array (JSON) | Yes      | `[]`                | Menu link tree (serialized)    |
| `label`             | String       | No       | `'Main navigation'` | `aria-label` value             |
| `orientation`       | String       | No       | `'horizontal'`      | `'horizontal'` or `'vertical'` |
| `mobile-breakpoint` | String       | No       | `'768px'`           | Breakpoint for mobile drawer   |
| `active-path`       | String       | No       | `''`                | Current path for active trail  |

**Menu items JSON format:**

```json
[
  {
    "label": "Home",
    "href": "/",
    "active": true
  },
  {
    "label": "Services",
    "href": "/services",
    "children": [
      { "label": "Primary Care", "href": "/services/primary-care" },
      { "label": "Tutorials", "href": "/resources/tutorials" },
      { "label": "Case Studies", "href": "/resources/case-studies" }
    ]
  },
  {
    "label": "User Portal",
    "href": "https://portal.example.com",
    "external": true
  }
]
```

#### Slot Structure

| Slot            | Purpose                               | Typical Drupal Content |
| --------------- | ------------------------------------- | ---------------------- |
| `logo`          | Site logo/branding                    | Theme logo markup      |
| `actions`       | Header action buttons (login, search) | Custom TWIG markup     |
| `mobile-header` | Custom mobile drawer header           | Brand/close button     |

#### Events

| Event           | Detail Type                                      | When Fired                   |
| --------------- | ------------------------------------------------ | ---------------------------- |
| `hx-nav-toggle` | `{ open: boolean }`                              | Mobile menu opened or closed |
| `hx-nav-click`  | `{ href: string, label: string, level: number }` | Nav item clicked             |

#### CSS Custom Properties

| Property                | Default                      | Purpose               |
| ----------------------- | ---------------------------- | --------------------- |
| `--hx-nav-bg`           | `var(--hx-color-surface)`    | Navigation background |
| `--hx-nav-text`         | `var(--hx-color-on-surface)` | Navigation text color |
| `--hx-nav-active-color` | `var(--hx-color-primary)`    | Active item indicator |
| `--hx-nav-height`       | `64px`                       | Header height         |
| `--hx-nav-mobile-width` | `300px`                      | Mobile drawer width   |

#### Accessibility

- `<nav>` landmark with `aria-label`
- Submenu toggle buttons with `aria-expanded` and `aria-haspopup`
- Arrow key navigation for submenus (WAI-ARIA menu pattern)
- Focus trap in mobile drawer when open
- Escape key closes mobile drawer and submenus
- Active page indicated with `aria-current="page"`

#### Drupal TWIG Template

```twig
{# templates/block--system-main-menu.html.twig #}
{#
  WC Navigation Integration
  ===========================
  Serializes Drupal's menu tree into the JSON format expected by hx-nav.

  The menu tree is preprocessed in the theme's .theme file to generate
  the JSON structure. See mytheme_preprocess_block__system_main_menu().

  IMPORTANT: Active trail detection is handled by the component using
  the active-path attribute. The Drupal theme passes the current path.
#}

{#-- menu_items_json is set in the theme preprocess hook --#}
<hx-nav
  items='{{ menu_items_json }}'
  label="{{ 'Main navigation'|t }}"
  active-path="{{ path('<current>') }}"
>
  {#-- Logo slot --#}
  <a slot="logo" href="{{ path('<front>') }}" aria-label="{{ 'Home'|t }}">
    <img src="{{ base_path ~ directory }}/logo.svg" alt="{{ site_name }}" height="40" />
  </a>

  {#-- Actions slot: search and login --#}
  <div slot="actions">
    <hx-button variant="ghost" aria-label="{{ 'Search'|t }}">
      <hx-icon name="search"></hx-icon>
    </hx-button>
    {% if logged_in %}
      <hx-button variant="secondary" href="{{ path('user.page') }}">
        {{ 'My Account'|t }}
      </hx-button>
    {% else %}
      <hx-button variant="primary" href="{{ path('user.login') }}">
        {{ 'Sign In'|t }}
      </hx-button>
    {% endif %}
  </div>
</hx-nav>
```

**Theme preprocess hook (PHP):**

```php
/**
 * Implements hook_preprocess_block__system_main_menu().
 *
 * Serializes the menu tree into JSON for the hx-nav component.
 */
function mytheme_preprocess_block__system_main_menu(&$variables) {
  $menu_tree = \Drupal::menuTree()->load('main', new \Drupal\Core\Menu\MenuTreeParameters());
  $manipulators = [
    ['callable' => 'menu.default_tree_manipulators:checkAccess'],
    ['callable' => 'menu.default_tree_manipulators:generateIndexAndSort'],
  ];
  $tree = \Drupal::menuTree()->transform($menu_tree, $manipulators);
  $variables['menu_items_json'] = json_encode(_mytheme_build_menu_json($tree));
}

function _mytheme_build_menu_json(array $tree): array {
  $items = [];
  foreach ($tree as $element) {
    $link = $element->link;
    $item = [
      'label' => $link->getTitle(),
      'href' => $link->getUrlObject()->toString(),
    ];
    if ($link->getUrlObject()->isExternal()) {
      $item['external'] = true;
    }
    if ($element->subtree) {
      $item['children'] = _mytheme_build_menu_json($element->subtree);
    }
    $items[] = $item;
  }
  return $items;
}
```

---

### 5.4.10 Hero Banner (`hx-hero-banner`)

**Purpose**: Full-width hero section for landing pages. Supports background image/video, heading, subheading, and call-to-action buttons.

**Drupal mapping**: Paragraph type "Hero" or Layout Builder custom block

#### Attribute API

| Attribute         | Type   | Required | Default     | Drupal Source                       |
| ----------------- | ------ | -------- | ----------- | ----------------------------------- |
| `heading`         | String | Yes      | `''`        | `field_hero_heading`                |
| `subheading`      | String | No       | `''`        | `field_hero_subheading`             |
| `bg-image`        | String | No       | `''`        | `field_hero_image.entity.uri.url`   |
| `bg-color`        | String | No       | `''`        | `field_hero_bg_color` (Color field) |
| `overlay-opacity` | String | No       | `'0.5'`     | `field_hero_overlay_opacity`        |
| `text-align`      | String | No       | `'center'`  | `'left'`, `'center'`, `'right'`     |
| `min-height`      | String | No       | `'400px'`   | CSS min-height value                |
| `variant`         | String | No       | `'default'` | `'default'`, `'split'`, `'video'`   |

#### Slot Structure

| Slot      | Purpose                   | Typical Drupal Content                      |
| --------- | ------------------------- | ------------------------------------------- |
| (default) | Body text / description   | `{{ content.field_hero_body }}`             |
| `actions` | CTA buttons               | `{{ content.field_hero_cta }}` (Link field) |
| `media`   | Background video or image | `{{ content.field_hero_video }}`            |
| `badge`   | Corner badge or label     | Custom markup                               |

#### CSS Custom Properties

| Property                      | Default                                      | Purpose                |
| ----------------------------- | -------------------------------------------- | ---------------------- |
| `--hx-hero-min-height`        | `400px`                                      | Minimum height         |
| `--hx-hero-padding`           | `var(--hx-spacing-3xl) var(--hx-spacing-xl)` | Internal padding       |
| `--hx-hero-text-color`        | `#ffffff`                                    | Text color over image  |
| `--hx-hero-overlay-color`     | `rgba(0,0,0,0.5)`                            | Image overlay color    |
| `--hx-hero-max-content-width` | `800px`                                      | Content area max width |

#### Drupal TWIG Template

```twig
{# templates/paragraph--hero.html.twig #}
{#
  WC Hero Banner Integration
  ============================
  Maps a Drupal "Hero" paragraph type to the hx-hero-banner component.

  Drupal fields:
    - field_hero_heading (Text, required)
    - field_hero_subheading (Text, optional)
    - field_hero_body (Text formatted, optional)
    - field_hero_image (Media reference: Image, optional)
    - field_hero_cta (Link, multi-value, optional)
    - field_hero_text_align (List: left, center, right)
#}

{%- set hero_heading = content.field_hero_heading|render|striptags|trim -%}
{%- set hero_subheading = content.field_hero_subheading|render|striptags|trim -%}
{%- set hero_bg = '' -%}
{% if paragraph.field_hero_image.entity %}
  {%- set hero_bg = file_url(paragraph.field_hero_image.entity.field_media_image.entity.fileuri) -%}
{% endif %}
{%- set hero_text_align = paragraph.field_hero_text_align.value | default('center') -%}

<hx-hero-banner
  heading="{{ hero_heading }}"
  subheading="{{ hero_subheading }}"
  bg-image="{{ hero_bg }}"
  text-align="{{ hero_text_align }}"
  {{ attributes }}
>
  {#-- Body content --#}
  {% if content.field_hero_body|render|trim is not empty %}
    {{ content.field_hero_body }}
  {% endif %}

  {#-- CTA buttons --#}
  {% if content.field_hero_cta|render|trim is not empty %}
    <div slot="actions">
      {% for item in paragraph.field_hero_cta %}
        <hx-button
          variant="{{ loop.first ? 'primary' : 'secondary' }}"
          href="{{ item.url }}"
        >
          {{ item.title }}
        </hx-button>
      {% endfor %}
    </div>
  {% endif %}
</hx-hero-banner>
```

---

### 5.4.11 Accordion (`hx-accordion`)

**Purpose**: Expandable/collapsible content sections. Used for FAQs, service details, and progressive disclosure of content.

**Drupal mapping**: Paragraph type "FAQ" or "Accordion"

#### Attribute API (Group)

| Attribute       | Type    | Required | Default | Description                                |
| --------------- | ------- | -------- | ------- | ------------------------------------------ |
| `multiple`      | Boolean | No       | `false` | Allow multiple panels open simultaneously  |
| `heading-level` | Number  | No       | `3`     | Heading level for accordion triggers (2-6) |

#### Attribute API (Item -- `hx-accordion-item`)

| Attribute  | Type    | Required | Default | Drupal Source        |
| ---------- | ------- | -------- | ------- | -------------------- |
| `heading`  | String  | Yes      | `''`    | `field_faq_question` |
| `expanded` | Boolean | No       | `false` | Pre-expanded state   |
| `disabled` | Boolean | No       | `false` | Prevent interaction  |

#### Slot Structure (Item)

| Slot      | Purpose                     | Typical Drupal Content           |
| --------- | --------------------------- | -------------------------------- |
| (default) | Panel content               | `{{ content.field_faq_answer }}` |
| `icon`    | Custom expand/collapse icon | Custom SVG                       |

#### Events

| Event                 | Detail Type                                             | When Fired    |
| --------------------- | ------------------------------------------------------- | ------------- |
| `hx-accordion-toggle` | `{ index: number, expanded: boolean, heading: string }` | Panel toggled |

#### Accessibility

- Uses `<details>`/`<summary>` pattern internally for native disclosure behavior
- `aria-expanded` on trigger buttons
- `aria-controls` linking trigger to panel
- Panel region has `role="region"` with `aria-labelledby` pointing to the trigger
- Enter and Space activate triggers; no arrow key navigation between items (intentional -- this is disclosure, not tabs)

#### Drupal TWIG Template

```twig
{# templates/paragraph--faq.html.twig #}
{#
  WC Accordion Integration
  ==========================
  Maps a Drupal "FAQ" paragraph type to the hx-accordion component.

  Drupal fields:
    - field_faq_items (Paragraph reference, multi-value)
      - field_faq_question (Text, required)
      - field_faq_answer (Text formatted, required)
#}

<hx-accordion heading-level="3" {{ attributes }}>
  {% for item in paragraph.field_faq_items %}
    {%- set faq_question = item.entity.field_faq_question.value -%}
    <hx-accordion-item
      heading="{{ faq_question }}"
      {{ loop.first ? 'expanded' : '' }}
    >
      {{ item.entity.field_faq_answer.value|raw }}
    </hx-accordion-item>
  {% endfor %}
</hx-accordion>
```

---

### 5.4.12 Alert / Notification (`hx-alert`)

**Purpose**: System messages and notifications. Used for status messages, warnings, errors, and informational notices. These often communicate critical information about forms, portal status, or action confirmations.

**Drupal mapping**: `status-messages.html.twig`

#### Attribute API

| Attribute       | Type    | Required | Default  | Drupal Source                                    |
| --------------- | ------- | -------- | -------- | ------------------------------------------------ |
| `type`          | String  | Yes      | `'info'` | `'info'`, `'success'`, `'warning'`, `'error'`    |
| `heading`       | String  | No       | `''`     | Optional alert heading                           |
| `dismissible`   | Boolean | No       | `false`  | Show dismiss button                              |
| `role-override` | String  | No       | `''`     | Override ARIA role (e.g., `'alert'`, `'status'`) |
| `icon`          | String  | No       | `''`     | Custom icon name (defaults by type)              |

#### Slot Structure

| Slot      | Purpose               | Typical Drupal Content          |
| --------- | --------------------- | ------------------------------- |
| (default) | Alert message content | Drupal status message text      |
| `actions` | Action links/buttons  | "Dismiss" or "Learn more" links |

#### Events

| Event              | Detail Type        | When Fired             |
| ------------------ | ------------------ | ---------------------- |
| `hx-alert-dismiss` | `{ type: string }` | Dismiss button clicked |

#### Accessibility

- Error alerts use `role="alert"` for immediate announcement (WCAG 4.1.3)
- Success/info use `role="status"` for polite announcement
- Dismissible alerts: dismiss button has `aria-label="Dismiss alert"`
- Icon + text + color ensure no single modality is the only indicator (WCAG 1.4.1)

#### Drupal TWIG Template

```twig
{# templates/status-messages.html.twig #}
{#
  WC Alert Integration
  ======================
  Replaces Drupal's default status message rendering.

  Drupal passes messages grouped by type:
    - status (maps to 'success')
    - warning (maps to 'warning')
    - error (maps to 'error')
#}

{%- set type_map = { 'status': 'success', 'warning': 'warning', 'error': 'error' } -%}

{% for type, messages in message_list %}
  {%- set alert_type = type_map[type] | default('info') -%}
  {% for message in messages %}
    <hx-alert
      type="{{ alert_type }}"
      dismissible
      {{ attributes }}
    >
      {{ message }}
    </hx-alert>
  {% endfor %}
{% endfor %}
```

---

## 5.5 Testing Checklist for Component Builders

Before marking any component as "Drupal-ready," verify every item on this checklist.

### Attribute Contract

- [ ] All attributes use **kebab-case** naming
- [ ] All attributes are **documented in JSDoc** with Drupal field mapping
- [ ] Boolean attributes follow the **HTML spec** (present = true, absent = false)
- [ ] Enum attributes have a **documented list of valid values** with a sensible default
- [ ] `reflect: true` is set only on attributes used in CSS selectors (variants, states)
- [ ] Every attribute has a **default value** that results in a non-broken render

### Slot Design

- [ ] Default slot accepts **arbitrary HTML** and renders it correctly
- [ ] Named slots have **meaningful fallback content** when empty
- [ ] Slot names are **documented in JSDoc** using `@slot` tags
- [ ] Component renders correctly **with all optional slots empty**
- [ ] Component renders correctly **with all slots populated**
- [ ] **Slotchange events** are handled if layout depends on slot content presence

### Events

- [ ] All custom events use the `hx-` prefix
- [ ] All events have `bubbles: true` and `composed: true`
- [ ] Event detail types are **defined as TypeScript interfaces**
- [ ] Events are **documented in JSDoc** using `@fires` tags
- [ ] Event detail contains **enough information** for Drupal behaviors to act without querying the component

### CSS Custom Properties

- [ ] All customizable properties use the `--hx-` prefix
- [ ] Properties are **documented in JSDoc** using `@cssprop` tags
- [ ] Every CSS custom property usage includes a **hardcoded fallback value**
- [ ] Component **renders correctly** without any token stylesheet loaded
- [ ] Component responds to **dark mode** via token changes (no JS required)

### Accessibility

- [ ] Passes **axe-core automated audit** with zero violations
- [ ] All interactive elements are **keyboard accessible** (Tab, Enter, Space, Escape as appropriate)
- [ ] **Focus indicator** is visible and meets 3:1 contrast ratio
- [ ] `prefers-reduced-motion: reduce` **disables all transitions/animations**
- [ ] `forced-colors: active` support for **Windows High Contrast Mode**
- [ ] All form elements have **visible, programmatic labels** (WCAG 1.3.1)
- [ ] Error messages use **`role="alert"`** or `aria-live` (WCAG 3.3.1)
- [ ] Color is **never the sole indicator** of state (WCAG 1.4.1)
- [ ] Touch targets meet **44x44px minimum** (WCAG 2.5.8)
- [ ] Component tolerates **200% browser zoom** without content loss (WCAG 1.4.4)
- [ ] Component tolerates **text spacing overrides** without content loss (WCAG 1.4.12)

### Progressive Enhancement

- [ ] Component renders **meaningful content before JavaScript loads** (`:not(:defined)` styles)
- [ ] Slot content is **visible** when the component is not upgraded
- [ ] Links and form elements **work** before the component JavaScript loads

### Documentation

- [ ] **JSDoc is 100% complete** on the component class, all public properties, events, slots, parts, and CSS properties
- [ ] **Storybook story** exists with all variants and states
- [ ] **Storybook MDX documentation** includes Drupal integration section
- [ ] **TWIG template example** is provided with detailed comments
- [ ] **Prop mapping table** maps every attribute to its Drupal field source

### Integration Readiness

- [ ] Component registered in `custom-elements.json` via CEM analyzer
- [ ] Component exported from the library's barrel `index.ts`
- [ ] Component **does not import** any Drupal, React, Angular, or Vue dependencies
- [ ] Component **does not fetch data** -- it receives data through attributes and slots
- [ ] Component **does not manage routing** -- navigation is handled by the browser or Drupal

---

## 5.6 Anti-Patterns to Avoid

These patterns create friction for the Drupal integration team. Avoid them.

### Anti-Pattern 1: Requiring Complex JSON in Attributes

```html
<!-- BAD: Forces the TWIG template to serialize nested JSON -->
<hx-content-card
  data='{"title":"My Article","author":{"name":"Dr. Chen","avatar":"/img/chen.jpg"},"tags":["health","wellness"]}'
></hx-content-card>
```

**Why it is bad**: TWIG is a templating language, not a serialization layer. Building JSON strings in TWIG is error-prone (escaping, quotes, nested objects). TWIG developers should be writing HTML, not hand-coding JSON.

**Fix**: Use flat attributes for scalar values, named slots for complex content.

```html
<!-- GOOD: Flat attributes + slots -->
<hx-content-card heading="My Article" author-name="Dr. Chen">
  <img slot="media" src="/img/chen.jpg" alt="Dr. Chen" />
  <div slot="actions">
    <a href="/tags/health">Health</a>
    <a href="/tags/wellness">Wellness</a>
  </div>
</hx-content-card>
```

### Anti-Pattern 2: Framework-Specific Props

```typescript
// BAD: React-style prop patterns
@property({ type: Object })
onClick: (e: Event) => void = () => {};

@property({ type: Object })
renderItem: (item: unknown) => TemplateResult = () => html``;
```

**Why it is bad**: TWIG cannot pass JavaScript functions as attribute values. These patterns couple the component to a JavaScript framework.

**Fix**: Use custom events for callbacks, slots for custom rendering.

### Anti-Pattern 3: Tight Coupling to Data Structures

```typescript
// BAD: Component knows about Drupal's internal data structure
@property({ type: Object })
node: DrupalNode = {};

render() {
  return html`<h3>${this.node.field_title[0].value}</h3>`;
}
```

**Why it is bad**: The component now depends on Drupal's internal field structure. If the Drupal field name changes, the component breaks. The component should have zero knowledge of Drupal.

**Fix**: Accept primitive values as attributes. Let the TWIG template extract values from Drupal's data model.

```typescript
// GOOD: Accepts primitive values
@property({ type: String }) heading = '';
```

### Anti-Pattern 4: Missing Fallback Content for Slots

```typescript
// BAD: Empty slot with no fallback
render() {
  return html`
    <div class="card__media">
      <slot name="media"></slot>
    </div>
  `;
}
```

**Why it is bad**: If the Drupal field is empty, the component renders a blank area with no visual indication of what belongs there (in development) and potentially broken layout (in production).

**Fix**: Always provide fallback content.

```typescript
render() {
  return html`
    <div class="card__media">
      <slot name="media">
        <div class="card__media-placeholder" aria-hidden="true">
          <hx-icon name="image" size="48"></hx-icon>
        </div>
      </slot>
    </div>
  `;
}
```

### Anti-Pattern 5: Undocumented CSS Custom Properties

```typescript
// BAD: Uses custom properties but does not document them
static styles = css`
  :host {
    background: var(--card-bg);
    padding: var(--card-pad);
  }
`;
```

**Why it is bad**: The Drupal theme developer has no way to discover which properties can be customized. They will either override with brute-force CSS (fighting Shadow DOM) or request code changes.

**Fix**: Document every CSS custom property in JSDoc with default values.

```typescript
/**
 * @cssprop [--hx-card-bg=var(--hx-color-surface)] - Card background color
 * @cssprop [--hx-card-padding=var(--hx-spacing-lg)] - Card internal padding
 */
```

### Anti-Pattern 6: Events Without Detail Payloads

```typescript
// BAD: Event with no useful detail
this.dispatchEvent(new Event('click'));
```

**Why it is bad**: The Drupal behavior has to query the component for its state after receiving the event. This is fragile and creates timing issues, especially with Drupal AJAX.

**Fix**: Always include a typed detail payload with enough context to act.

```typescript
this.dispatchEvent(
  new CustomEvent('hx-card-click', {
    bubbles: true,
    composed: true,
    detail: { href: this.href, heading: this.heading, activationMethod: 'click' },
  }),
);
```

### Anti-Pattern 7: Components That Break Without JavaScript

```html
<!-- BAD: Nothing visible until JS loads and component upgrades -->
<hx-content-card heading="Article Title"></hx-content-card>
```

**Why it is bad**: Before JavaScript loads, the browser renders an empty unknown element. If JS fails, the user sees nothing. Content must always be accessible regardless of JavaScript availability.

**Fix**: Use slots to provide visible server-rendered content.

```html
<!-- GOOD: Slot content is visible before JS loads -->
<hx-content-card heading="Article Title" href="/articles/my-article">
  <img slot="media" src="/img/article.jpg" alt="Article illustration" />
  <p>Article summary text is visible even without JavaScript.</p>
  <a slot="actions" href="/articles/my-article">Read More</a>
</hx-content-card>
```

### Anti-Pattern 8: Fetching Data Inside Components

```typescript
// BAD: Component fetches its own data
async connectedCallback() {
  super.connectedCallback();
  const response = await fetch(`/api/articles/${this.articleId}`);
  this.data = await response.json();
}
```

**Why it is bad**: Drupal already has the data on the server. Fetching it again on the client creates unnecessary network requests, complicates caching, and creates a loading state that did not need to exist. Components should be presentation-only.

**Fix**: Drupal passes all data via attributes and slots. The component never fetches.

---

## 5.7 Component Lifecycle & Drupal

### 5.7.1 Initialization Relative to Drupal Behaviors

Understanding when your component initializes relative to Drupal's lifecycle is critical.

**Load order:**

```
1. Drupal renders HTML (server-side)
2. Browser parses HTML, renders FOUC-safe content (:not(:defined) styles)
3. Drupal's JS aggregated file loads
4. hx-components.js loads (ES module, type="module")
5. Custom elements are registered (customElements.define)
6. Components upgrade: connectedCallback fires, Shadow DOM attaches
7. Drupal.behaviors.attach(document, drupalSettings) fires
8. Components are fully interactive
```

**Key insight**: Drupal behaviors fire after the DOM is loaded but the `attach` method receives a `context` parameter that can be any DOM subtree. When Drupal replaces content via AJAX, it calls `attach` on the new content only. Your component must handle being initialized (step 5-6) independently of Drupal behaviors (step 7).

### 5.7.2 Handling Drupal AJAX Content Replacement

Drupal's AJAX system dynamically replaces regions of the page. When a region is replaced:

1. Drupal calls `Drupal.behaviors.detach(oldContent)` on the old content
2. Drupal replaces the DOM subtree with new HTML
3. Drupal calls `Drupal.behaviors.attach(newContent)` on the new content

**Impact on Web Components**: When old DOM is removed, the custom element's `disconnectedCallback` fires. When new DOM is inserted, the browser auto-upgrades any custom elements (because the definitions are already registered). The new components call `connectedCallback` automatically.

**What you must handle**: If your component creates external references (event listeners on `window` or `document`, IntersectionObservers, ResizeObservers, timers), clean them up in `disconnectedCallback`:

```typescript
connectedCallback(): void {
  super.connectedCallback();
  this._resizeObserver = new ResizeObserver(this._onResize);
  this._resizeObserver.observe(this);
}

disconnectedCallback(): void {
  super.disconnectedCallback();
  this._resizeObserver?.disconnect();
  this._resizeObserver = null;
}
```

### 5.7.3 Handling BigPipe Progressive Rendering

Drupal's BigPipe module streams page content in chunks. Placeholders are sent initially and then replaced with final content via inline `<script>` tags.

**Impact on Web Components**: A Web Component may be sent in the initial HTML with placeholder slot content, then BigPipe replaces a child element inside the component's light DOM with the final content.

**What you must handle**: The component must react to light DOM changes. Use `slotchange` events to detect when slot content is updated:

```typescript
firstUpdated(): void {
  this.shadowRoot?.addEventListener('slotchange', this._onSlotChange);
}

private _onSlotChange = (e: Event): void => {
  const slot = e.target as HTMLSlotElement;
  const assignedNodes = slot.assignedNodes({ flatten: true });

  if (slot.name === 'media') {
    this._hasMedia = assignedNodes.length > 0;
    this.requestUpdate();
  }
};
```

### 5.7.4 MutationObserver for Dynamic Content Insertion

For edge cases where content is inserted into the component's light DOM without triggering `slotchange` (e.g., Drupal's `ajax_view` command that updates children of an existing element), use a MutationObserver:

```typescript
connectedCallback(): void {
  super.connectedCallback();

  this._mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        this._handleChildrenChanged();
      }
    }
  });

  this._mutationObserver.observe(this, {
    childList: true,
    subtree: false, // Only direct children
  });
}

disconnectedCallback(): void {
  super.disconnectedCallback();
  this._mutationObserver?.disconnect();
}
```

### 5.7.5 The `once()` Pattern for Drupal Behaviors

When Drupal behaviors need to interact with your Web Components, they should use Drupal's `once()` utility to prevent double-initialization:

```javascript
Drupal.behaviors.hxCardAnalytics = {
  attach(context) {
    // once() ensures each element is processed exactly once,
    // even if attach() is called multiple times on the same context.
    const cards = once('hx-card-analytics', 'hx-content-card', context);
    cards.forEach((card) => {
      card.addEventListener('hx-card-click', handleCardClick);
    });
  },
  detach(context, settings, trigger) {
    if (trigger === 'unload') {
      const cards = once.remove('hx-card-analytics', 'hx-content-card', context);
      cards.forEach((card) => {
        card.removeEventListener('hx-card-click', handleCardClick);
      });
    }
  },
};
```

---

## 5.8 Theming Guidelines for Component Builders

### 5.8.1 CSS Custom Properties to Expose

Every component must expose a documented set of CSS custom properties that allow theming without modifying the component source. Follow this hierarchy:

**Tier 1 -- Global tokens** (defined in the token stylesheet, consumed by all components):

```css
/* These come from the design token system. Components reference them. */
--hx-color-primary
--hx-color-surface
--hx-color-on-surface
--hx-color-border
--hx-spacing-sm, --hx-spacing-md, --hx-spacing-lg
--hx-radius-sm, --hx-radius-md, --hx-radius-lg
--hx-shadow-sm, --hx-shadow-md
--hx-font-size-base, --hx-font-size-lg
```

**Tier 2 -- Component-specific tokens** (defined per component, fallback to global tokens):

```css
/* Card-specific overrides */
--hx-card-bg: var(--hx-color-surface);
--hx-card-padding: var(--hx-spacing-lg);
--hx-card-radius: var(--hx-radius-md);
--hx-card-shadow: var(--hx-shadow-sm);
--hx-card-border-color: var(--hx-color-border);
```

**The fallback chain** -- every CSS custom property reference in the component includes three levels:

```css
:host {
  /*
   * Resolution order:
   * 1. Component token: --hx-card-bg (most specific, set by consumer)
   * 2. Global token: --hx-color-surface (theme-level)
   * 3. Hardcoded fallback: #ffffff (last resort, no tokens loaded)
   */
  background: var(--hx-card-bg, var(--hx-color-surface, #ffffff));
}
```

### 5.8.2 Documenting Theme Options in Storybook

Every component must include a "Theming" section in its Storybook MDX documentation page:

````mdx
## Theming

### CSS Custom Properties

| Property            | Default                   | Description           |
| ------------------- | ------------------------- | --------------------- |
| `--hx-card-bg`      | `var(--hx-color-surface)` | Card background color |
| `--hx-card-padding` | `var(--hx-spacing-lg)`    | Card internal padding |
| `--hx-card-radius`  | `var(--hx-radius-md)`     | Card border radius    |
| `--hx-card-shadow`  | `var(--hx-shadow-sm)`     | Card elevation shadow |

### Drupal Theme Override Example

```css
/* In your Drupal theme's CSS */
:root {
  /* Override card appearance site-wide */
  --hx-card-radius: 0; /* Sharp corners */
  --hx-card-shadow: none; /* Flat design */
  --hx-card-padding: 2rem; /* More padding */
}

/* Override for a specific context */
.sidebar hx-content-card {
  --hx-card-padding: 1rem;
}
```
````

### 5.8.3 CSS Shadow Parts for Escape-Hatch Styling

CSS Shadow Parts (`::part()`) provide targeted styling access to internal component elements. Use parts when CSS custom properties alone cannot achieve the needed customization.

**When to use `::part()`:**

| Use Case                        | Use Part? | Reason                                           |
| ------------------------------- | --------- | ------------------------------------------------ |
| Change background color         | No        | CSS custom property is sufficient                |
| Change font size                | No        | CSS custom property is sufficient                |
| Add a pseudo-element (::before) | Yes       | Cannot add pseudo-elements via custom properties |
| Change text-transform           | Yes       | No custom property covers this                   |
| Override display or position    | Yes       | Structural changes need part access              |

**Exposing parts:**

```typescript
render() {
  return html`
    <div part="card" class="card card--${this.variant}">
      <div part="header" class="card__header">
        <slot name="media"></slot>
      </div>
      <div part="body" class="card__body">
        <h3 part="heading" class="card__heading">${this.heading}</h3>
        <slot></slot>
      </div>
      <div part="footer" class="card__footer">
        <slot name="actions"></slot>
      </div>
    </div>
  `;
}
```

**Consumer usage:**

```css
/* Drupal theme CSS */
hx-content-card::part(heading) {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

hx-content-card[variant='featured']::part(header) {
  min-height: 200px;
}
```

**Rules for parts:**

1. Only expose parts on stable internal elements that are unlikely to be refactored
2. Document every part in JSDoc using `@csspart` tags
3. Part names should be semantic (`header`, `body`, `footer`) not structural (`div-1`, `wrapper`)
4. Never expose more than 5-7 parts per component -- too many parts defeats encapsulation

### 5.8.4 Shadow DOM vs. Light DOM Decision Guide

Most components should use Shadow DOM (Lit's default). Use Light DOM only when you need Drupal's global CSS to style the component's internal content.

**Use Shadow DOM (default) when:**

- The component has its own internal structure (cards, buttons, inputs, navigation)
- The component needs style encapsulation to prevent Drupal theme CSS bleed
- The component has CSS custom properties for theming
- The component is a design system primitive

**Use Light DOM when:**

- The component wraps prose content from Drupal's WYSIWYG editor (CKEditor)
- The component is a layout wrapper that passes through child content
- The component needs Drupal's admin CSS to apply (e.g., contextual links, inline editing)

**Light DOM component pattern:**

```typescript
@customElement('hx-prose')
export class HxProse extends LitElement {
  /**
   * Renders to light DOM so Drupal CKEditor content inherits
   * the theme's typography styles.
   */
  protected createRenderRoot(): HTMLElement {
    return this;
  }

  static styles = css`
    /* These styles apply in the light DOM */
    :host {
      display: block;
      max-width: var(--hx-prose-max-width, 720px);
      margin: 0 auto;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}
```

**Light DOM tradeoff**: The component's internal styles are not encapsulated. Drupal theme CSS can affect the component's children, which may be desired (for prose content) or undesired (for structural elements). Choose deliberately.

### 5.8.5 Dark Mode Compatibility

Every component must support dark mode through the token system. No component should have hardcoded colors.

**Rules:**

1. Never use raw color values in component CSS. Always reference tokens.
2. Test every component in light, dark, and high-contrast modes in Storybook.
3. Dark mode works automatically when the token stylesheet is loaded and `data-theme="dark"` is set on an ancestor element.
4. The component never needs to know which mode is active.

**Storybook verification:**

Every story should include a dark mode variant:

```typescript
export const DarkMode: Story = {
  args: { heading: 'Dark Mode Card', summary: 'This card in dark mode.' },
  decorators: [
    (story) =>
      html`<div data-theme="dark" style="padding: 2rem; background: var(--hx-color-surface);">
        ${story()}
      </div>`,
  ],
};
```

---

## Quick Reference: Component API Design Checklist

Use this as a one-page reference when designing a new component's public API.

```
ATTRIBUTES
  - kebab-case names                     heading, author-name, publish-date
  - Map to Drupal field names            Document in JSDoc: "Maps to field_summary"
  - String/Number for simple data        heading="Title", read-time="5"
  - Boolean as presence/absence          featured (not featured="true")
  - Enum with default                    variant="default" | "featured" | "compact"
  - JSON only for collections            items='[...]' (menu items, options)
  - Every attribute has a default value  Renders without any attributes set

SLOTS
  - Default slot for primary content     <p>Body text</p>
  - Named slots for specific areas       <img slot="media" ...>
  - Fallback content in every slot       <slot name="media"><div class="placeholder"></div></slot>
  - Drupal fields map to slots           {{ content.field_media }} -> slot="media"

EVENTS
  - hx- prefix                          hx-card-click, hx-form-submit
  - bubbles: true, composed: true        Required for Drupal behaviors
  - Typed detail payload                 { href, heading, activationMethod }
  - Enough data to act                   Do not force the listener to query the component

CSS CUSTOM PROPERTIES
  - --hx-[component]-[property]         --hx-card-bg, --hx-card-radius
  - Three-level fallback chain           var(--hx-card-bg, var(--hx-color-surface, #fff))
  - Documented in JSDoc @cssprop         With default value
  - Works without token stylesheet       Hardcoded fallback renders correctly

ACCESSIBILITY
  - Semantic HTML inside Shadow DOM      <h3>, <nav>, <button>, <a>
  - ARIA attributes on interactive       aria-expanded, aria-controls, aria-label
  - Keyboard navigation                  Tab, Enter, Space, Escape, Arrow keys
  - Focus visible (3:1 contrast)         :focus-visible outline
  - 44x44px touch targets               min-height: 44px; min-width: 44px
  - prefers-reduced-motion               transition: none
  - forced-colors: active                System color keywords
  - Error states announced               role="alert"

PROGRESSIVE ENHANCEMENT
  - :not(:defined) styles                Visible content before JS loads
  - Slot content as fallback             Links work, images show, text visible
  - No JavaScript-only rendering         Server content always accessible
```

---

## Sources

- [Lit Official Documentation](https://lit.dev/docs/)
- [Lit Component Styles](https://lit.dev/docs/components/styles/)
- [Lit Reactive Properties](https://lit.dev/docs/components/properties/)
- [Lit Decorators](https://lit.dev/docs/components/decorators/)
- [Lit Context Protocol](https://lit.dev/docs/data/context/)
- [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
- [Form-Associated Custom Elements (Benny Powers)](https://bennypowers.dev/posts/form-associated-custom-elements/)
- [ElementInternals API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [ARIA Authoring Practices Guide (W3C)](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Quick Reference (W3C)](https://www.w3.org/WAI/WCAG21/quickref/)
- [Drupal Twig Templates Documentation](https://www.drupal.org/docs/theming-drupal/twig-in-drupal)
- [Drupal Form API Reference](https://api.drupal.org/api/drupal/elements)
- [Drupal Single Directory Components](https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components/quickstart)
- [Drupal JavaScript API: Behaviors](https://www.drupal.org/docs/drupal-apis/javascript-api/javascript-api-overview)
- [Web Components: Working With Shadow DOM (Smashing Magazine)](https://www.smashingmagazine.com/2025/07/web-components-working-with-shadow-dom/)
- [Declarative Shadow DOM and the Future of Drupal Theming (John Albin)](https://john.albin.net/presentations/2025-11-18/declarative-shadow-dom-and-future-drupal-theming)
- [Server Rendering Lit Web Components with Drupal (Benny Powers)](https://bennypowers.dev/posts/drupal-lit-ssr/)
