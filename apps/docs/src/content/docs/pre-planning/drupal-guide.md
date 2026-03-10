---
title: Drupal Integration Guide
description: Complete guide for integrating HELIX web components with Drupal CMS
---

> **Audience**: Drupal developers, site builders, and front-end themers
> **Last Updated**: 2026-02-13
> **Status**: Complete
> **Prerequisites**: Drupal 10.3+ or Drupal 11, familiarity with TWIG templating, basic understanding of Web Components

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started -- Library Installation](#2-getting-started----library-installation)
3. [TWIG Integration Patterns](#3-twig-integration-patterns)
4. [Node Template Examples](#4-node-template-examples)
5. [Field Template Integration](#5-field-template-integration)
6. [Views Integration](#6-views-integration)
7. [Form Integration](#7-form-integration)
8. [JavaScript Behaviors](#8-javascript-behaviors)
9. [Theming & Customization](#9-theming--customization)
10. [Performance Optimization](#10-performance-optimization)
11. [Accessibility Checklist](#11-accessibility-checklist)
12. [Troubleshooting & Debugging](#12-troubleshooting--debugging)
13. [Upgrade & Maintenance](#13-upgrade--maintenance)
14. [Real-World Example Project](#14-real-world-example-project)

---

## 1. Introduction

### What This Guide Covers

This guide is the definitive reference for Drupal teams consuming the `@helix/library` Web Component library. It covers every aspect of integration: installation, TWIG templating, field and views integration, form participation, JavaScript behaviors, theming, performance, accessibility, and maintenance.

### Architecture Boundary

The Web Component library has **zero knowledge of Drupal**. It is a standalone package of Lit-based Web Components distributed as ES modules with CSS custom property tokens. Drupal consumes it as a static asset -- the same way it consumes any JavaScript library.

```
+------------------------------------------+     +----------------------------------+
|          @helix/library                 |     |         Drupal CMS               |
|                                          |     |                                  |
|  - Lit Web Components (ES modules)       |     |  - libraries.yml (asset loading) |
|  - CSS custom properties (tokens)        |     |  - TWIG templates (markup)       |
|  - Custom Elements Manifest (API docs)   |     |  - Behaviors (event handling)    |
|  - Zero framework dependencies           |     |  - Theme CSS (token overrides)   |
|  - Zero Drupal knowledge                 |     |  - SDC wrappers (optional)       |
+------------------------------------------+     +----------------------------------+
           |                                                   |
           +--- npm install / CDN / dist copy -----------------+
```

### Component Prefix

All components use the `hx-` prefix (HELIX). Every HTML tag starts with `hx-`:

```html
<hx-content-card>
  <hx-button>
    <hx-hero-banner> <hx-text-input></hx-text-input></hx-hero-banner></hx-button
></hx-content-card>
```

### Token Prefix

All CSS custom properties use the `--hds-` prefix (HELIX Design System) for semantic and component tokens:

```css
--hds-color-surface-primary
--hds-color-interactive-primary
--hds-card-border-radius
--hds-button-primary-bg
```

---

## 2. Getting Started -- Library Installation

### Method 1: npm Package (Recommended)

This is the recommended approach for production deployments. It provides version pinning, integrity checking, and integration with your existing build toolchain.

#### Step 1: Install the Package

```bash
# From your Drupal theme directory
cd web/themes/custom/mytheme

# Install via npm
npm install @helix/library

# Or install a specific version
npm install @helix/library@1.0.0
```

#### Step 2: Configure `libraries.yml`

Declare the Web Component library as a Drupal asset library in your theme:

```yaml
# mytheme.libraries.yml

# Design tokens (CSS custom properties)
hds-tokens:
  version: VERSION
  css:
    theme:
      node_modules/@helix/library/dist/styles/tokens.css:
        minified: true
        preprocess: false

# Web Components (ES modules)
hds-components:
  version: VERSION
  js:
    node_modules/@helix/library/dist/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - mytheme/hds-tokens
```

**Critical settings explained:**

| Setting             | Value        | Why                                                                                                                        |
| ------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `type: module`      | Required     | Web Components are distributed as ES modules. Without this, Drupal will try to load them as classic scripts and fail.      |
| `preprocess: false` | Required     | Prevents Drupal's asset aggregation from bundling the ES module with other scripts, which would break `import` statements. |
| `minified: true`    | Optimization | Tells Drupal the file is already minified so it does not attempt minification.                                             |

#### Step 3: Attach the Library

Attach the library globally in your theme's `.info.yml`:

```yaml
# mytheme.info.yml
name: My Enterprise Theme
type: theme
base theme: false
core_version_requirement: ^10.3 || ^11
libraries:
  - mytheme/hds-tokens
  - mytheme/hds-components
```

Or attach it selectively in specific templates:

```twig
{# Only load components where they are used #}
{{ attach_library('mytheme/hds-components') }}
```

#### Step 4: Verify Installation

Clear Drupal's cache and inspect the page source to confirm both files are loaded:

```bash
drush cr
```

In the browser, open DevTools and verify:

- `tokens.css` is loaded and `:root` contains `--hds-*` custom properties
- `index.js` is loaded with `type="module"`
- Custom elements are registered: `document.querySelector('hx-content-card')` returns an element (if one exists on the page)

#### Alternative: Composer + Asset Packagist

If your project uses Composer exclusively for dependency management, use [Asset Packagist](https://asset-packagist.org/) to pull npm packages through Composer:

```json
{
  "repositories": [
    {
      "type": "composer",
      "url": "https://asset-packagist.org"
    }
  ],
  "require": {
    "npm-asset/org--wc-library": "^1.0"
  },
  "extra": {
    "installer-paths": {
      "web/libraries/{$name}": ["type:npm-asset"]
    }
  }
}
```

Then update your `libraries.yml` paths:

```yaml
hds-components:
  version: VERSION
  js:
    /libraries/org--wc-library/dist/index.js:
      type: module
      minified: true
      preprocess: false
```

### Method 2: CDN Delivery (Rapid Prototyping)

For prototyping, proof-of-concept work, or environments without a Node.js build step, use a CDN.

#### Self-Hosted CDN (Recommended for Production)

For enterprise deployments, self-host the assets on your own CDN (e.g., CloudFront, Akamai) for security and availability guarantees:

```yaml
# mytheme.libraries.yml

hds-tokens-cdn:
  version: VERSION
  css:
    theme:
      https://cdn.yourorganization.com/wc-library/1.0.0/styles/tokens.css:
        type: external
        minified: true

hds-components-cdn:
  version: VERSION
  js:
    https://cdn.yourorganization.com/wc-library/1.0.0/index.js:
      type: external
      attributes:
        type: module
        crossorigin: anonymous
      minified: true
      preprocess: false
  dependencies:
    - mytheme/hds-tokens-cdn
```

#### Public CDN (Prototyping Only)

jsDelivr auto-syncs from npm. Pin to a specific version -- never use `@latest` in production:

```yaml
hds-components-jsdelivr:
  version: 1.0.0
  css:
    theme:
      https://cdn.jsdelivr.net/npm/@helix/library@1.0.0/dist/styles/tokens.css:
        type: external
        minified: true
  js:
    https://cdn.jsdelivr.net/npm/@helix/library@1.0.0/dist/index.js:
      type: external
      attributes:
        type: module
        crossorigin: anonymous
      minified: true
      preprocess: false
```

#### CDN Fallback Pattern

For resilience, implement a fallback that loads from a local copy if the CDN is unreachable:

```html
{# In html.html.twig or a preprocess function #}
<script type="module">
  import('@helix/library').catch(() => {
    // CDN failed, load local fallback
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/themes/custom/mytheme/dist/wc-library/index.js';
    document.head.appendChild(script);
  });
</script>
```

### Method 3: Drupal Module Wrapper

For organizations that prefer Drupal-native package management, wrap the library in a custom module.

#### Module Structure

```
modules/custom/helix_components/
  helix_components.info.yml
  helix_components.libraries.yml
  helix_components.module
  dist/
    index.js                    # Copied from @helix/library/dist
    styles/
      tokens.css                # Copied from @helix/library/dist/styles
  config/
    install/
      helix_components.settings.yml
```

#### Module Definition

```yaml
# helix_components.info.yml
name: 'WC Web Components'
type: module
description: 'Provides the WC Web Component library'
package: 'WC'
core_version_requirement: ^10.3 || ^11
```

#### Module Libraries

```yaml
# helix_components.libraries.yml
helix-tokens:
  version: VERSION
  css:
    theme:
      dist/styles/tokens.css:
        minified: true
        preprocess: false

helix-components:
  version: VERSION
  js:
    dist/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - helix_components/helix-tokens
```

#### Module Hook Implementation

```php
<?php
// helix_components.module

/**
 * Implements hook_page_attachments().
 *
 * Attach the Web Component library globally.
 */
function helix_components_page_attachments(array &$attachments): void {
  $config = \Drupal::config('helix_components.settings');

  if ($config->get('load_globally')) {
    $attachments['#attached']['library'][] = 'helix_components/helix-components';
  }
}

/**
 * Implements hook_library_info_alter().
 *
 * Allow CDN override via module settings.
 */
function helix_components_library_info_alter(array &$libraries, string $extension): void {
  if ($extension !== 'helix_components') {
    return;
  }

  $config = \Drupal::config('helix_components.settings');
  $cdn_url = $config->get('cdn_url');

  if ($cdn_url && isset($libraries['helix-components'])) {
    // Replace local paths with CDN URLs
    $version = $config->get('version') ?? '1.0.0';
    $libraries['helix-components']['js'] = [
      "{$cdn_url}/{$version}/index.js" => [
        'type' => 'external',
        'attributes' => ['type' => 'module', 'crossorigin' => 'anonymous'],
        'minified' => TRUE,
        'preprocess' => FALSE,
      ],
    ];
  }
}
```

---

## 3. TWIG Integration Patterns

### 3.1 Basic Usage -- Simple Component with Attributes

Web Components are standard HTML elements. Use them in TWIG exactly as you would any HTML tag:

```twig
{# Basic button #}
<hx-button variant="primary">
  Schedule Appointment
</hx-button>

{# Badge with dynamic content #}
<hx-badge variant="success">
  {{ 'Published'|t }}
</hx-badge>

{# Icon with attribute #}
<hx-icon name="calendar" size="24"></hx-icon>
```

### 3.2 Attribute Binding with TWIG Variables

Map Drupal variables to component attributes:

```twig
{# Map node data to component attributes #}
<hx-content-card
  heading="{{ node.label }}"
  summary="{{ node.field_summary.value }}"
  category="{{ node.field_category.entity.label }}"
  href="{{ path('entity.node.canonical', {'node': node.id}) }}"
  publish-date="{{ node.getCreatedTime()|date('c') }}"
  read-time="{{ node.field_read_time.value }}"
  variant="{{ node.isPromoted() ? 'featured' : 'default' }}"
>
  {{ content.body }}
</hx-content-card>
```

**Important TWIG escaping note**: TWIG auto-escapes variables by default, which is correct for HTML attribute values. Do not use `|raw` in attribute values -- it introduces XSS vulnerabilities.

### 3.3 Slot Population -- Passing Drupal Field Values into Slots

Slots are the primary mechanism for injecting Drupal-rendered content into Web Components. Named slots use the `slot` attribute on child elements:

```twig
<hx-article-layout has-sidebar>
  {# Named slot: breadcrumb #}
  <nav slot="breadcrumb" aria-label="Breadcrumb">
    {{ drupal_block('system_breadcrumb_block') }}
  </nav>

  {# Named slot: hero image #}
  {% if content.field_hero_image|render|trim is not empty %}
    <div slot="hero">
      {{ content.field_hero_image }}
    </div>
  {% endif %}

  {# Named slot: author bio #}
  {% if content.field_author|render|trim is not empty %}
    <div slot="author">
      {{ content.field_author }}
    </div>
  {% endif %}

  {# Default slot: article body content (no slot attribute needed) #}
  <div class="article-body">
    {{ content.body }}
  </div>

  {# Named slot: sidebar #}
  {% if content.field_related_articles|render|trim is not empty %}
    <aside slot="sidebar">
      {{ content.field_related_articles }}
    </aside>
  {% endif %}

  {# Named slot: footer #}
  <div slot="footer">
    {{ content.field_tags }}
  </div>
</hx-article-layout>
```

### 3.4 Conditional Rendering

Show or hide components based on Drupal data:

```twig
{# Only render the hero banner if a hero image exists #}
{% if node.field_hero_image.entity %}
  <hx-hero-banner
    heading="{{ node.label }}"
    subheading="{{ node.field_subtitle.value }}"
    image-src="{{ file_url(node.field_hero_image.entity.fileuri) }}"
    image-alt="{{ node.field_hero_image.alt }}"
  >
    {% if node.field_cta_text.value %}
      <hx-button slot="cta" variant="primary" href="{{ node.field_cta_url.0.url }}">
        {{ node.field_cta_text.value }}
      </hx-button>
    {% endif %}
  </hx-hero-banner>
{% endif %}

{# Conditionally apply variants #}
<hx-alert
  variant="{{ node.field_urgency.value == 'high' ? 'danger' : 'info' }}"
  {% if node.field_dismissible.value %}dismissible{% endif %}
>
  {{ content.field_alert_message }}
</hx-alert>
```

### 3.5 Loops -- Rendering Multiple Instances from Entities

Render collections of components from Drupal entity references or Views results:

```twig
{# Render a card grid from a multi-value entity reference field #}
{% if node.field_related_articles|length > 0 %}
  <hx-card-grid columns="3" gap="lg">
    {% for item in node.field_related_articles %}
      {% set related = item.entity %}
      <hx-content-card
        heading="{{ related.label }}"
        summary="{{ related.field_summary.value|length > 150 ? related.field_summary.value|slice(0, 150) ~ '...' : related.field_summary.value }}"
        category="{{ related.field_category.entity.label }}"
        href="{{ path('entity.node.canonical', {'node': related.id}) }}"
        publish-date="{{ related.getCreatedTime()|date('c') }}"
        variant="compact"
      ></hx-content-card>
    {% endfor %}
  </hx-card-grid>
{% endif %}
```

### 3.6 Variable Extraction -- Preprocess Functions

For complex data mapping, prepare variables in a preprocess function rather than cluttering TWIG templates:

```php
<?php
// mytheme.theme

/**
 * Implements hook_preprocess_node__article__teaser().
 */
function mytheme_preprocess_node__article__teaser(array &$variables): void {
  /** @var \Drupal\node\NodeInterface $node */
  $node = $variables['node'];

  // Extract and format data for the web component
  $variables['wc_card'] = [
    'heading'      => $node->label(),
    'summary'      => $node->get('field_summary')->value ?? '',
    'category'     => $node->get('field_category')->entity?->label() ?? '',
    'href'         => $node->toUrl()->toString(),
    'publish_date' => date('c', $node->getCreatedTime()),
    'read_time'    => (int) ($node->get('field_read_time')->value ?? 0),
    'variant'      => $node->isPromoted() ? 'featured' : 'default',
    'has_image'    => !$node->get('field_media')->isEmpty(),
  ];

  // Build responsive image data if available
  if (!$node->get('field_media')->isEmpty()) {
    $media = $node->get('field_media')->entity;
    if ($media && $media->hasField('field_media_image')) {
      $image = $media->get('field_media_image')->entity;
      if ($image) {
        $variables['wc_card']['image_url'] = \Drupal::service('file_url_generator')
          ->generateAbsoluteString($image->getFileUri());
        $variables['wc_card']['image_alt'] = $media->get('field_media_image')->alt ?? '';
      }
    }
  }
}
```

Then the TWIG template becomes clean:

```twig
{# node--article--teaser.html.twig #}
{{ attach_library('mytheme/hds-components') }}

<hx-content-card
  heading="{{ wc_card.heading }}"
  summary="{{ wc_card.summary }}"
  category="{{ wc_card.category }}"
  href="{{ wc_card.href }}"
  publish-date="{{ wc_card.publish_date }}"
  read-time="{{ wc_card.read_time }}"
  variant="{{ wc_card.variant }}"
>
  {% if wc_card.has_image %}
    <img
      slot="media"
      src="{{ wc_card.image_url }}"
      alt="{{ wc_card.image_alt }}"
      loading="lazy"
      decoding="async"
    />
  {% endif %}
</hx-content-card>
```

### 3.7 Render Arrays -- Using `#type = 'html_tag'`

For programmatic component rendering in PHP (e.g., custom blocks, form elements), use Drupal's render array system:

```php
<?php

// Build a content card as a render array
$build['card'] = [
  '#type' => 'html_tag',
  '#tag' => 'hx-content-card',
  '#attributes' => [
    'heading' => $node->label(),
    'summary' => $node->get('field_summary')->value,
    'category' => $category_label,
    'href' => $node->toUrl()->toString(),
    'publish-date' => date('c', $node->getCreatedTime()),
    'read-time' => $node->get('field_read_time')->value,
    'variant' => 'default',
  ],
  // Child elements go into #children or nested render arrays
  'image' => [
    '#type' => 'html_tag',
    '#tag' => 'img',
    '#attributes' => [
      'slot' => 'media',
      'src' => $image_url,
      'alt' => $image_alt,
      'loading' => 'lazy',
    ],
  ],
  'body' => [
    '#markup' => $body_html,
  ],
];
```

---

## 4. Node Template Examples

### 4.1 Article Teaser (`node--article--teaser.html.twig`)

This is the most common integration point. The article teaser maps Drupal's article content type to the `hx-content-card` component.

```twig
{#
/**
 * @file
 * Theme override for article nodes in teaser view mode.
 *
 * Maps Drupal article fields to the hx-content-card Web Component.
 *
 * Required fields:
 *   - title (core)
 *   - field_summary (Plain text, required)
 *   - field_category (Term reference, required)
 *
 * Optional fields:
 *   - field_media (Media reference -- hero image)
 *   - field_read_time (Integer -- estimated reading time)
 *   - field_tags (Term reference, multi-value)
 *
 * Component docs: [Storybook URL]/?path=/docs/organisms-content-card--docs
 */
#}

{{ attach_library('mytheme/hds-components') }}

{# ---- Variable extraction ---- #}
{%- set card_heading = label[0]['#title']|default(node.label) -%}
{%- set card_summary = content.field_summary|render|striptags|trim -%}
{%- set card_category = node.field_category.entity.label -%}
{%- set card_href = url -%}
{%- set card_date = node.getCreatedTime()|date('c') -%}
{%- set card_read_time = content.field_read_time|render|striptags|trim -%}
{%- set card_variant = is_promoted ? 'featured' : 'default' -%}

{# ---- Component output ---- #}
<hx-content-card
  heading="{{ card_heading }}"
  summary="{{ card_summary }}"
  category="{{ card_category }}"
  href="{{ card_href }}"
  publish-date="{{ card_date }}"
  read-time="{{ card_read_time }}"
  variant="{{ card_variant }}"
  {{ attributes }}
>
  {# Media slot: hero image #}
  {% if content.field_media|render|trim is not empty %}
    <div slot="media">
      {{ content.field_media }}
    </div>
  {% endif %}

  {# Actions slot: tags #}
  {% if content.field_tags|render|trim is not empty %}
    <div slot="actions">
      {{ content.field_tags }}
    </div>
  {% endif %}
</hx-content-card>
```

**Responsive image handling**: If `field_media` is configured with a responsive image style in Drupal, the rendered output will include `<picture>` with `<source>` elements and proper `srcset` attributes. This works correctly inside the `slot="media"` -- the browser handles responsive image selection regardless of Shadow DOM boundaries.

### 4.2 Article Full (`node--article--full.html.twig`)

The full article view uses multiple Web Components for the page layout:

```twig
{#
/**
 * @file
 * Theme override for article nodes in full view mode.
 *
 * Uses hx-article-layout for page structure, with named slots
 * for hero, breadcrumb, author, sidebar, and footer content.
 */
#}

{{ attach_library('mytheme/hds-components') }}

{# ---- Hero Section ---- #}
{% if content.field_hero_image|render|trim is not empty %}
  <hx-hero-banner
    heading="{{ label[0]['#title']|default(node.label) }}"
    subheading="{{ content.field_subtitle|render|striptags|trim }}"
  >
    <div slot="media">
      {{ content.field_hero_image }}
    </div>
  </hx-hero-banner>
{% endif %}

{# ---- Article Layout ---- #}
<hx-article-layout
  has-sidebar="{{ content.field_related_articles|render|trim is not empty ? 'true' : '' }}"
>
  {# Breadcrumb slot #}
  <nav slot="breadcrumb" aria-label="{{ 'Breadcrumb'|t }}">
    {{ drupal_block('system_breadcrumb_block') }}
  </nav>

  {# Author slot #}
  {% if content.field_author|render|trim is not empty %}
    <div slot="author">
      {% set author = node.field_author.entity %}
      <hx-media-object>
        {% if author.field_avatar.entity %}
          <hx-avatar
            slot="media"
            src="{{ file_url(author.field_avatar.entity.fileuri) }}"
            alt="{{ author.label }}"
            size="md"
          ></hx-avatar>
        {% endif %}
        <div>
          <strong>{{ author.label }}</strong>
          <time datetime="{{ node.getCreatedTime()|date('c') }}">
            {{ node.getCreatedTime()|date('F j, Y') }}
          </time>
          {% if node.field_read_time.value %}
            <span>&middot; {{ node.field_read_time.value }} {{ 'min read'|t }}</span>
          {% endif %}
        </div>
      </hx-media-object>
    </div>
  {% endif %}

  {# Default slot: article body #}
  <div class="article-content">
    {{ content.body }}

    {# Inline components for rich content sections #}
    {% if content.field_faq|render|trim is not empty %}
      <hx-accordion>
        {% for item in node.field_faq %}
          <hx-accordion-item heading="{{ item.field_question.value }}">
            {{ item.field_answer.value|raw }}
          </hx-accordion-item>
        {% endfor %}
      </hx-accordion>
    {% endif %}
  </div>

  {# Sidebar slot: related content #}
  {% if content.field_related_articles|render|trim is not empty %}
    <div slot="sidebar">
      <h3>{{ 'Related Articles'|t }}</h3>
      {% for item in node.field_related_articles %}
        {% set related = item.entity %}
        <hx-content-card
          heading="{{ related.label }}"
          href="{{ path('entity.node.canonical', {'node': related.id}) }}"
          variant="compact"
        ></hx-content-card>
      {% endfor %}
    </div>
  {% endif %}

  {# Footer slot: tags and share #}
  <div slot="footer">
    {% if content.field_tags|render|trim is not empty %}
      <div class="article-tags">
        {{ content.field_tags }}
      </div>
    {% endif %}
  </div>
</hx-article-layout>
```

### 4.3 Landing Page with Paragraphs (`node--landing-page--full.html.twig`)

Landing pages use Drupal Paragraphs with dynamic component selection based on paragraph type:

```twig
{#
/**
 * @file
 * Theme override for landing page nodes.
 *
 * Iterates over Paragraphs and maps each paragraph type
 * to the appropriate Web Component.
 */
#}

{{ attach_library('mytheme/hds-components') }}

<hx-page-layout>
  {# Hero section from landing page fields #}
  {% if content.field_hero|render|trim is not empty %}
    <div slot="hero">
      {{ content.field_hero }}
    </div>
  {% endif %}

  {# Main content: iterate over paragraph items #}
  {{ content.field_sections }}
</hx-page-layout>
```

Then create paragraph-specific templates that map to Web Components:

```twig
{# paragraph--hero-banner.html.twig #}
<hx-hero-banner
  heading="{{ content.field_heading|render|striptags|trim }}"
  subheading="{{ content.field_subheading|render|striptags|trim }}"
  alignment="{{ content.field_alignment|render|striptags|trim|default('center') }}"
>
  {% if content.field_background_image|render|trim is not empty %}
    <div slot="media">
      {{ content.field_background_image }}
    </div>
  {% endif %}

  {% if content.field_cta|render|trim is not empty %}
    <div slot="cta">
      {{ content.field_cta }}
    </div>
  {% endif %}
</hx-hero-banner>
```

```twig
{# paragraph--card-grid.html.twig #}
{% set columns = content.field_columns|render|striptags|trim|default('3') %}

<hx-card-grid columns="{{ columns }}" gap="lg">
  {% for item in paragraph.field_cards %}
    {% set card = item.entity %}
    <hx-content-card
      heading="{{ card.field_heading.value }}"
      summary="{{ card.field_summary.value }}"
      href="{{ card.field_link.0.url }}"
      variant="{{ card.field_featured.value ? 'featured' : 'default' }}"
    >
      {% if card.field_image.entity %}
        <img
          slot="media"
          src="{{ file_url(card.field_image.entity.fileuri) }}"
          alt="{{ card.field_image.alt }}"
          loading="lazy"
        />
      {% endif %}
    </hx-content-card>
  {% endfor %}
</hx-card-grid>
```

```twig
{# paragraph--faq-accordion.html.twig #}
<hx-accordion>
  {% for item in paragraph.field_faq_items %}
    {% set faq = item.entity %}
    <hx-accordion-item heading="{{ faq.field_question.value }}">
      {{ faq.field_answer.value|raw }}
    </hx-accordion-item>
  {% endfor %}
</hx-accordion>
```

```twig
{# paragraph--tabbed-content.html.twig #}
<hx-tabs>
  {% for item in paragraph.field_tabs %}
    {% set tab = item.entity %}
    <hx-tab-item label="{{ tab.field_tab_label.value }}">
      {{ tab.field_tab_content.value|raw }}
    </hx-tab-item>
  {% endfor %}
</hx-tabs>
```

### 4.4 Layout Builder Integration

If your site uses Drupal's Layout Builder, Web Components can be used within layout sections and blocks:

```twig
{# layout--twocol-section.html.twig -- Layout Builder section override #}
<hx-page-layout>
  <div slot="main">
    {{ content.first }}
  </div>
  <div slot="sidebar">
    {{ content.second }}
  </div>
</hx-page-layout>
```

For custom Layout Builder blocks:

```php
<?php
// src/Plugin/Block/FeaturedContentBlock.php

namespace Drupal\mytheme_blocks\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * @Block(
 *   id = "wc_featured_content",
 *   admin_label = @Translation("WC Featured Content"),
 *   category = @Translation("WC Components")
 * )
 */
class FeaturedContentBlock extends BlockBase {

  public function build(): array {
    return [
      '#type' => 'html_tag',
      '#tag' => 'hx-card-grid',
      '#attributes' => [
        'columns' => '3',
        'gap' => 'lg',
      ],
      '#attached' => [
        'library' => ['mytheme/hds-components'],
      ],
      'cards' => $this->buildCards(),
    ];
  }

  private function buildCards(): array {
    // Query and build card render arrays
    // ...
  }

}
```

---

## 5. Field Template Integration

### 5.1 Field Template Override

Override field templates to wrap field values in Web Components:

```twig
{# field--node--field-category--article.html.twig #}
{#
/**
 * Renders the article category field as a WC badge.
 */
#}
{% for item in items %}
  <hx-badge variant="default" size="sm">
    {{ item.content }}
  </hx-badge>
{% endfor %}
```

```twig
{# field--node--field-tags--article.html.twig #}
{#
/**
 * Renders the article tags field as a row of WC tags.
 */
#}
<div class="tag-list" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
  {% for item in items %}
    <hx-tag>
      {{ item.content }}
    </hx-tag>
  {% endfor %}
</div>
```

### 5.2 Multiple Value Fields

For multi-value fields, loop over items and render each as a component:

```twig
{# field--node--field-testimonials--landing-page.html.twig #}
{#
/**
 * Renders testimonials as a grid of WC cards.
 */
#}
{% if items|length > 0 %}
  <hx-card-grid columns="{{ items|length >= 3 ? '3' : items|length }}" gap="md">
    {% for item in items %}
      {% set testimonial = item.content['#paragraph'] %}
      <hx-content-card variant="default">
        <blockquote>
          {{ testimonial.field_quote.value }}
        </blockquote>
        <div slot="actions">
          <cite>{{ testimonial.field_author_name.value }}</cite>
        </div>
      </hx-content-card>
    {% endfor %}
  </hx-card-grid>
{% endif %}
```

### 5.3 Custom Field Formatters (PHP)

For reusable, configurable mappings, create a field formatter plugin:

```php
<?php
// src/Plugin/Field/FieldFormatter/WcContentCardFormatter.php

namespace Drupal\mytheme_formatters\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Plugin implementation for rendering entity references as WC content cards.
 *
 * @FieldFormatter(
 *   id = "wc_content_card",
 *   label = @Translation("WC Content Card"),
 *   field_types = {"entity_reference"}
 * )
 */
class WcContentCardFormatter extends FormatterBase {

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings(): array {
    return [
      'variant' => 'default',
      'show_image' => TRUE,
      'show_category' => TRUE,
      'show_read_time' => TRUE,
      'summary_length' => 150,
    ] + parent::defaultSettings();
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state): array {
    $elements = parent::settingsForm($form, $form_state);

    $elements['variant'] = [
      '#type' => 'select',
      '#title' => $this->t('Card variant'),
      '#options' => [
        'default' => $this->t('Default'),
        'featured' => $this->t('Featured'),
        'compact' => $this->t('Compact'),
      ],
      '#default_value' => $this->getSetting('variant'),
    ];

    $elements['show_image'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show hero image'),
      '#default_value' => $this->getSetting('show_image'),
    ];

    $elements['summary_length'] = [
      '#type' => 'number',
      '#title' => $this->t('Summary max length'),
      '#default_value' => $this->getSetting('summary_length'),
      '#min' => 50,
      '#max' => 500,
    ];

    return $elements;
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode): array {
    $elements = [];

    foreach ($items as $delta => $item) {
      $entity = $item->entity;
      if (!$entity) {
        continue;
      }

      $summary = '';
      if ($entity->hasField('field_summary')) {
        $summary = $entity->get('field_summary')->value ?? '';
        $max = (int) $this->getSetting('summary_length');
        if (mb_strlen($summary) > $max) {
          $summary = mb_substr($summary, 0, $max) . '...';
        }
      }

      $attributes = [
        'heading' => $entity->label(),
        'summary' => $summary,
        'href' => $entity->toUrl()->toString(),
        'variant' => $this->getSetting('variant'),
        'publish-date' => date('c', $entity->getCreatedTime()),
      ];

      if ($this->getSetting('show_category') && $entity->hasField('field_category')) {
        $attributes['category'] = $entity->get('field_category')->entity?->label() ?? '';
      }

      if ($this->getSetting('show_read_time') && $entity->hasField('field_read_time')) {
        $attributes['read-time'] = (string) ($entity->get('field_read_time')->value ?? '0');
      }

      $elements[$delta] = [
        '#type' => 'html_tag',
        '#tag' => 'hx-content-card',
        '#attributes' => $attributes,
        '#attached' => [
          'library' => ['mytheme/hds-components'],
        ],
      ];

      // Add image to media slot if configured
      if ($this->getSetting('show_image') && $entity->hasField('field_media')) {
        $media = $entity->get('field_media')->entity;
        if ($media && $media->hasField('field_media_image')) {
          $image = $media->get('field_media_image')->entity;
          if ($image) {
            $elements[$delta]['image'] = [
              '#type' => 'html_tag',
              '#tag' => 'img',
              '#attributes' => [
                'slot' => 'media',
                'src' => \Drupal::service('file_url_generator')
                  ->generateAbsoluteString($image->getFileUri()),
                'alt' => $media->get('field_media_image')->alt ?? '',
                'loading' => 'lazy',
                'decoding' => 'async',
              ],
            ];
          }
        }
      }
    }

    return $elements;
  }

}
```

**When to use field formatters vs. template overrides:**

| Approach          | Use When                                                                              |
| ----------------- | ------------------------------------------------------------------------------------- |
| Template override | One-off field rendering, simple mapping, team prefers TWIG                            |
| Field formatter   | Reusable across content types, needs admin configuration, complex data transformation |

---

## 6. Views Integration

### 6.1 Custom Views Templates -- Card Grid

Override the Views unformatted output to render results as a `hx-card-grid`:

```twig
{# views-view-unformatted--latest-articles.html.twig #}
{#
/**
 * Renders the "Latest Articles" view as a WC card grid.
 * Each row is rendered by its own row template (see below).
 */
#}
{{ attach_library('mytheme/hds-components') }}

{% if rows|length > 0 %}
  <hx-card-grid columns="3" gap="lg">
    {% for row in rows %}
      {{ row.content }}
    {% endfor %}
  </hx-card-grid>
{% else %}
  <hx-alert variant="info">
    {{ 'No articles found.'|t }}
  </hx-alert>
{% endif %}
```

Then override the row template to render each result as a content card:

```twig
{# views-view-fields--latest-articles.html.twig #}
{#
/**
 * Renders a single view row as a hx-content-card.
 *
 * Available fields (configured in the Views UI):
 *   - fields.title
 *   - fields.field_summary
 *   - fields.field_category
 *   - fields.view_node (URL)
 *   - fields.created
 *   - fields.field_read_time
 *   - fields.field_media
 */
#}

<hx-content-card
  heading="{{ fields.title.content|striptags|trim }}"
  summary="{{ fields.field_summary.content|striptags|trim }}"
  category="{{ fields.field_category.content|striptags|trim }}"
  href="{{ fields.view_node.content|striptags|trim }}"
  publish-date="{{ fields.created.content|striptags|trim }}"
  read-time="{{ fields.field_read_time.content|striptags|trim }}"
>
  {% if fields.field_media.content|trim is not empty %}
    <div slot="media">
      {{ fields.field_media.content }}
    </div>
  {% endif %}
</hx-content-card>
```

### 6.2 Views Field Rewrite

For simpler integrations, use Views' "Rewrite results" feature to populate component attributes using replacement patterns.

In the Views UI:

1. Add all needed fields (title, summary, category, URL, etc.)
2. Exclude all fields from display except one
3. On the last field, use "Rewrite results" with this custom text:

```html
<hx-content-card
  heading="{{ title }}"
  summary="{{ field_summary }}"
  category="{{ field_category }}"
  href="{{ view_node }}"
  publish-date="{{ created }}"
>
</hx-content-card>
```

**Limitation**: Views field rewrite cannot handle conditional slot content (e.g., only showing an image if one exists). For conditional logic, use a custom Views row template instead.

### 6.3 Views Pager Integration

Override the Views pager to use the `hx-pagination` component:

```twig
{# views-mini-pager.html.twig #}
{% if items.previous or items.next %}
  <hx-pagination
    current-page="{{ items.current }}"
    {% if items.previous %}previous-url="{{ items.previous.url }}"{% endif %}
    {% if items.next %}next-url="{{ items.next.url }}"{% endif %}
  ></hx-pagination>
{% endif %}
```

### 6.4 Custom Views Style Plugin

For maximum control, create a Views style plugin that outputs Web Component markup:

```php
<?php
// src/Plugin/views/style/WcCardGrid.php

namespace Drupal\mytheme_views\Plugin\views\style;

use Drupal\views\Plugin\views\style\StylePluginBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Views style plugin that renders results in a hx-card-grid.
 *
 * @ViewsStyle(
 *   id = "wc_card_grid",
 *   title = @Translation("WC Card Grid"),
 *   help = @Translation("Renders view results as a WC card grid Web Component."),
 *   theme = "views_view_wc_card_grid",
 *   display_types = {"normal"}
 * )
 */
class WcCardGrid extends StylePluginBase {

  protected $usesRowPlugin = TRUE;
  protected $usesGrouping = FALSE;

  /**
   * {@inheritdoc}
   */
  protected function defineOptions(): array {
    $options = parent::defineOptions();
    $options['columns'] = ['default' => '3'];
    $options['gap'] = ['default' => 'lg'];
    $options['card_variant'] = ['default' => 'default'];
    return $options;
  }

  /**
   * {@inheritdoc}
   */
  public function buildOptionsForm(&$form, FormStateInterface $form_state): void {
    parent::buildOptionsForm($form, $form_state);

    $form['columns'] = [
      '#type' => 'select',
      '#title' => $this->t('Columns'),
      '#options' => ['1' => '1', '2' => '2', '3' => '3', '4' => '4'],
      '#default_value' => $this->options['columns'],
    ];

    $form['gap'] = [
      '#type' => 'select',
      '#title' => $this->t('Gap size'),
      '#options' => [
        'sm' => $this->t('Small'),
        'md' => $this->t('Medium'),
        'lg' => $this->t('Large'),
      ],
      '#default_value' => $this->options['gap'],
    ];

    $form['card_variant'] = [
      '#type' => 'select',
      '#title' => $this->t('Card variant'),
      '#options' => [
        'default' => $this->t('Default'),
        'featured' => $this->t('Featured'),
        'compact' => $this->t('Compact'),
      ],
      '#default_value' => $this->options['card_variant'],
    ];
  }

}
```

With the corresponding TWIG template:

```twig
{# views-view-hx-card-grid.html.twig #}
{{ attach_library('mytheme/hds-components') }}

<hx-card-grid
  columns="{{ options.columns }}"
  gap="{{ options.gap }}"
>
  {% for row in rows %}
    {{ row.content }}
  {% endfor %}
</hx-card-grid>
```

---

## 7. Form Integration

### 7.1 Form API Render Arrays

Use Drupal's render array system to output Web Component form elements:

```php
<?php

/**
 * Builds a contact form using WC Web Components.
 */
function mytheme_contact_form(array &$form, FormStateInterface $form_state): array {
  $form['#attached']['library'][] = 'mytheme/hds-components';

  $form['name'] = [
    '#type' => 'html_tag',
    '#tag' => 'hx-text-input',
    '#attributes' => [
      'name' => 'name',
      'label' => t('Full Name'),
      'required' => 'true',
      'help-text' => t('Enter your first and last name'),
      'error-message' => t('Please enter your full name'),
    ],
  ];

  $form['email'] = [
    '#type' => 'html_tag',
    '#tag' => 'hx-text-input',
    '#attributes' => [
      'name' => 'email',
      'label' => t('Email Address'),
      'type' => 'email',
      'required' => 'true',
      'help-text' => t('We will use this to respond to your inquiry'),
    ],
  ];

  $form['phone'] = [
    '#type' => 'html_tag',
    '#tag' => 'hx-text-input',
    '#attributes' => [
      'name' => 'phone',
      'label' => t('Phone Number'),
      'type' => 'tel',
      'help-text' => t('Optional -- for callback requests'),
    ],
  ];

  $form['message'] = [
    '#type' => 'html_tag',
    '#tag' => 'hx-textarea',
    '#attributes' => [
      'name' => 'message',
      'label' => t('Your Message'),
      'required' => 'true',
      'rows' => '5',
      'help-text' => t('Describe how we can help you'),
    ],
  ];

  $form['submit'] = [
    '#type' => 'html_tag',
    '#tag' => 'hx-button',
    '#attributes' => [
      'type' => 'submit',
      'variant' => 'primary',
    ],
    '#value' => t('Send Message'),
  ];

  return $form;
}
```

### 7.2 Form Alter Hooks

Replace standard Drupal form elements with Web Components via `hook_form_alter()`:

```php
<?php

/**
 * Implements hook_form_alter().
 *
 * Replace standard Drupal form elements with WC Web Components
 * on the user login form.
 */
function mytheme_form_user_login_form_alter(array &$form, FormStateInterface $form_state): void {
  $form['#attached']['library'][] = 'mytheme/hds-components';

  // Replace username field
  $form['name']['#theme_wrappers'] = [];
  $form['name']['#type'] = 'html_tag';
  $form['name']['#tag'] = 'hx-text-input';
  $form['name']['#attributes'] = [
    'name' => 'name',
    'label' => t('Username'),
    'required' => 'true',
    'autocomplete' => 'username',
  ];

  // Replace password field
  $form['pass']['#theme_wrappers'] = [];
  $form['pass']['#type'] = 'html_tag';
  $form['pass']['#tag'] = 'hx-text-input';
  $form['pass']['#attributes'] = [
    'name' => 'pass',
    'label' => t('Password'),
    'type' => 'password',
    'required' => 'true',
    'autocomplete' => 'current-password',
  ];

  // Replace submit button
  $form['actions']['submit']['#type'] = 'html_tag';
  $form['actions']['submit']['#tag'] = 'hx-button';
  $form['actions']['submit']['#attributes'] = [
    'type' => 'submit',
    'variant' => 'primary',
  ];
  $form['actions']['submit']['#value'] = t('Log in');
}
```

### 7.3 Form-Associated Custom Elements

The `hx-text-input`, `hx-textarea`, `hx-select`, `hx-checkbox`, and `hx-radio` components are **form-associated custom elements**. They use the `ElementInternals` API to participate natively in HTML forms.

This means:

- They are included in `FormData` automatically (no hidden input tricks)
- They support native validation via the Constraint Validation API
- They report validity state to the parent `<form>`
- They respond to `form.reset()` calls
- They are accessible to assistive technology as form controls

**How it works with Drupal forms:**

```html
<form method="post" action="/contact">
  <!-- This Web Component participates in the form natively -->
  <hx-text-input name="full_name" label="Full Name" required></hx-text-input>

  <hx-text-input name="email" label="Email" type="email" required></hx-text-input>

  <!-- On form submit, FormData contains: full_name=..., email=... -->
  <hx-button type="submit" variant="primary"> Submit </hx-button>
</form>
```

**Browser support**: `ElementInternals` is supported in all evergreen browsers (Chrome 77+, Firefox 93+, Safari 16.4+). For Drupal sites that must support older Safari versions, the `element-internals-polyfill` package provides a drop-in polyfill.

### 7.4 Server-Side Validation Integration

Since Web Components submit values through standard `FormData`, Drupal's server-side validation works without modification. The `name` attribute on the component maps directly to `$form_state->getValue('name')`.

For displaying server-side validation errors in the Web Components:

```php
<?php

/**
 * Implements hook_form_alter() for adding server-side error display.
 */
function mytheme_form_alter(array &$form, FormStateInterface $form_state): void {
  if ($form_state->hasAnyErrors()) {
    $errors = $form_state->getErrors();
    foreach ($errors as $field_name => $message) {
      // Set error attributes on the corresponding Web Component
      if (isset($form[$field_name]) && $form[$field_name]['#tag'] ?? '' === 'hx-text-input') {
        $form[$field_name]['#attributes']['error-message'] = (string) $message;
      }
    }
  }
}
```

---

## 8. JavaScript Behaviors

### 8.1 Basic Behavior Structure

Drupal behaviors are the standard mechanism for initializing JavaScript in Drupal. They work correctly with Web Components:

```javascript
/**
 * @file
 * Drupal behaviors for WC Web Component event handling.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Track content card clicks for analytics.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.hxCardAnalytics = {
    attach(context) {
      const cards = once('hx-card-analytics', 'hx-content-card', context);

      cards.forEach((card) => {
        card.addEventListener('hx-card-click', (event) => {
          const { href, heading, keyboard } = event.detail;

          // Google Analytics 4
          if (typeof gtag === 'function') {
            gtag('event', 'content_card_click', {
              content_title: heading,
              content_url: href,
              interaction_method: keyboard ? 'keyboard' : 'mouse',
            });
          }

          // Matomo / Piwik
          if (typeof _paq !== 'undefined') {
            _paq.push(['trackEvent', 'Content', 'Card Click', heading]);
          }
        });
      });
    },
  };
})(Drupal, once);
```

Register this behavior as a Drupal library:

```yaml
# mytheme.libraries.yml
helix-behaviors:
  version: VERSION
  js:
    js/helix-behaviors.js: {}
  dependencies:
    - core/drupal
    - core/once
    - mytheme/hds-components
```

### 8.2 Event Delegation Patterns

For components that may be added dynamically (AJAX, BigPipe), use event delegation on a parent container:

```javascript
(function (Drupal) {
  'use strict';

  /**
   * Handle accordion toggle events via delegation.
   *
   * Uses event delegation so dynamically added accordions
   * are handled without re-attachment.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.hxAccordionTracking = {
    attach(context) {
      // Attach once to the document body, not individual components
      const containers = once('hx-accordion-delegate', 'body', context);

      containers.forEach((body) => {
        body.addEventListener('hx-accordion-toggle', (event) => {
          // event.composed is true, so it crosses shadow DOM boundaries
          const detail = event.detail;
          const accordion = event.target.closest('hx-accordion');

          if (typeof gtag === 'function') {
            gtag('event', 'accordion_toggle', {
              section_title: detail.heading,
              is_open: detail.open,
              accordion_id: accordion?.id ?? 'unknown',
            });
          }
        });
      });
    },
  };
})(Drupal);
```

### 8.3 Integrating with Drupal AJAX Framework

Handle Web Component events that trigger Drupal AJAX operations:

```javascript
(function (Drupal, once) {
  'use strict';

  /**
   * Load more content when the pagination component fires a page change event.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.hxPaginationAjax = {
    attach(context) {
      const pagers = once('hx-pagination-ajax', 'hx-pagination', context);

      pagers.forEach((pager) => {
        pager.addEventListener('hx-page-change', async (event) => {
          const { page } = event.detail;
          const targetSelector = pager.dataset.ajaxTarget;
          const viewName = pager.dataset.viewName;
          const viewDisplay = pager.dataset.viewDisplay;

          if (!targetSelector || !viewName) return;

          // Set loading state on the pagination component
          pager.setAttribute('loading', '');

          try {
            // Use Drupal's AJAX framework to load the next page
            const response = await fetch(
              `/views/ajax?view_name=${viewName}&view_display_id=${viewDisplay}&page=${page}`,
              {
                headers: {
                  'X-Requested-With': 'XMLHttpRequest',
                },
              },
            );

            const data = await response.json();

            // Find and update the target container
            const target = document.querySelector(targetSelector);
            if (target) {
              // Process AJAX commands from Drupal
              data.forEach((command) => {
                if (command.command === 'insert' && command.data) {
                  target.innerHTML = command.data;
                  // Re-attach Drupal behaviors to new content
                  Drupal.attachBehaviors(target);
                }
              });
            }
          } finally {
            pager.removeAttribute('loading');
          }
        });
      });
    },
  };
})(Drupal, once);
```

### 8.4 Search Bar Integration

Connect the `hx-search-bar` component to Drupal's Search API:

```javascript
(function (Drupal, once) {
  'use strict';

  /**
   * Handle search bar submissions and autocomplete.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.hxSearch = {
    attach(context) {
      const searchBars = once('hx-search', 'hx-search-bar', context);

      searchBars.forEach((searchBar) => {
        // Handle search submission
        searchBar.addEventListener('hx-search-submit', (event) => {
          const { query } = event.detail;
          if (query.trim()) {
            window.location.href = `/search?keys=${encodeURIComponent(query)}`;
          }
        });

        // Handle autocomplete requests (if the component supports it)
        searchBar.addEventListener('hx-search-input', async (event) => {
          const { query } = event.detail;
          if (query.length < 3) return;

          try {
            const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`);
            const suggestions = await response.json();

            // Pass suggestions back to the component
            searchBar.suggestions = suggestions;
          } catch (error) {
            console.error('Search autocomplete failed:', error);
          }
        });
      });
    },
  };
})(Drupal, once);
```

### 8.5 Dynamic Content Handling -- BigPipe and AJAX

When Drupal inserts content dynamically (via BigPipe, AJAX, or Turbo-like patterns), Web Components self-initialize as soon as they are inserted into the DOM. The Custom Elements API handles this natively -- there is no need to manually "initialize" Web Components.

However, Drupal behaviors attached to Web Components need re-attachment:

```javascript
(function (Drupal) {
  'use strict';

  /**
   * Ensure behaviors are attached after BigPipe content delivery.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.hxBigPipeHandler = {
    attach(context) {
      // This behavior automatically runs when BigPipe delivers content
      // because Drupal calls attachBehaviors() on each BigPipe placeholder
      // after replacement.
      //
      // Web Components in the new content will:
      // 1. Self-register (customElements.define is global)
      // 2. Self-render (connectedCallback fires on DOM insertion)
      // 3. Have behaviors attached (this function)
      //
      // No additional initialization needed.
    },
  };
})(Drupal);
```

### 8.6 Modal Dialog Integration

Connect Web Component modals with Drupal's dialog system:

```javascript
(function (Drupal, once) {
  'use strict';

  /**
   * Handle modal open/close events and manage focus.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.hxModals = {
    attach(context) {
      const triggers = once('hx-modal-trigger', '[data-hx-modal-target]', context);

      triggers.forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
          event.preventDefault();
          const modalId = trigger.dataset.wcModalTarget;
          const modal = document.getElementById(modalId);

          if (modal && modal.tagName === 'HX-MODAL') {
            modal.setAttribute('open', '');
          }
        });
      });

      // Listen for modal close events
      const modals = once('hx-modal-events', 'hx-modal', context);
      modals.forEach((modal) => {
        modal.addEventListener('hx-modal-close', () => {
          // Return focus to the trigger element
          const triggerId = modal.dataset.triggeredBy;
          if (triggerId) {
            document.getElementById(triggerId)?.focus();
          }

          // Track modal close in analytics
          if (typeof gtag === 'function') {
            gtag('event', 'modal_close', {
              modal_id: modal.id,
            });
          }
        });
      });
    },
  };
})(Drupal, once);
```

---

## 9. Theming & Customization

### 9.1 CSS Custom Property Overrides

The primary customization mechanism is overriding CSS custom properties at the `:root` level in your Drupal theme. This requires zero changes to the component library.

Create a token overrides file in your theme:

```css
/* mytheme/css/token-overrides.css */

:root {
  /* ============================================
   * Brand Color Overrides
   * Override the semantic tokens to match your
   * organization's brand colors.
   * ============================================ */

  /* Primary interactive color (links, primary buttons) */
  --hds-color-interactive-primary: #0e7c61; /* Brand teal */
  --hds-color-interactive-primary-hover: #0a5e49;
  --hds-color-interactive-primary-active: #084a3a;

  /* Feedback colors (adjust for your brand) */
  --hds-color-feedback-success: #16a34a;
  --hds-color-feedback-danger: #b91c1c;
  --hds-color-feedback-warning: #d97706;

  /* ============================================
   * Typography Overrides
   * ============================================ */
  --hds-font-family-body: 'Source Sans 3', system-ui, sans-serif;
  --hds-font-family-heading: 'Merriweather', Georgia, serif;

  /* ============================================
   * Spacing Overrides
   * ============================================ */
  --hds-space-inset-md: 1.25rem; /* Slightly more generous padding */

  /* ============================================
   * Component-Level Overrides
   * ============================================ */

  /* Cards: sharper corners for this brand */
  --hds-card-border-radius: 4px;
  --hds-card-padding: 2rem;

  /* Buttons: rounder for this brand */
  --hds-button-primary-border-radius: 999px; /* Pill shape */
}
```

Register this as a Drupal library that loads after the token stylesheet:

```yaml
# mytheme.libraries.yml
hds-token-overrides:
  version: VERSION
  css:
    theme:
      css/token-overrides.css: {}
  dependencies:
    - mytheme/hds-tokens
```

### 9.2 Dark Mode Overrides

Override dark mode token values for your brand:

```css
/* mytheme/css/dark-mode-overrides.css */

[data-theme='dark'] {
  /* Brand-specific dark mode adjustments */
  --hds-color-interactive-primary: #34d399; /* Lighter teal for dark bg */
  --hds-color-interactive-primary-hover: #6ee7b7;
  --hds-color-surface-primary: #0f172a; /* Deep navy instead of neutral */
  --hds-color-surface-secondary: #1e293b;
}
```

Control the `data-theme` attribute in your theme's `html.html.twig`:

```twig
{# html.html.twig #}
<!DOCTYPE html>
<html{{ html_attributes }}>
  <head>
    {# Prevent flash of incorrect theme #}
    <script>
      (function() {
        var stored = localStorage.getItem('hds-theme-preference');
        if (stored === 'dark' || stored === 'light') {
          document.documentElement.setAttribute('data-theme', stored);
        }
      })();
    </script>
    <head-placeholder token="{{ placeholder_token }}">
    <title>{{ head_title|safe_join(' | ') }}</title>
    <css-placeholder token="{{ placeholder_token }}">
    <js-placeholder token="{{ placeholder_token }}">
  </head>
  <body{{ attributes }}>
    {{ page_top }}
    {{ page }}
    {{ page_bottom }}
    <js-bottom-placeholder token="{{ placeholder_token }}">
  </body>
</html>
```

### 9.3 CSS Parts Styling

For cases where CSS custom properties do not provide sufficient control, use the `::part()` pseudo-element to style specific internal elements:

```css
/* mytheme/css/component-overrides.css */

/* Style the card header area for featured cards */
hx-content-card[variant='featured']::part(header) {
  min-height: 200px;
  background: linear-gradient(
    135deg,
    var(--hds-color-interactive-primary),
    var(--hds-color-feedback-success)
  );
}

/* Style the card body in sidebar contexts */
.sidebar hx-content-card::part(body) {
  padding: var(--hds-space-inset-sm);
}

/* Override button label styling for a specific page */
.hero-section hx-button::part(label) {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

**When to use Parts vs. custom properties:**

| Approach              | Use When                                                                       |
| --------------------- | ------------------------------------------------------------------------------ |
| CSS custom properties | Changing values (colors, spacing, sizes, fonts)                                |
| `::part()`            | Changing structural CSS (display, grid, flex, text-transform, pseudo-elements) |

**Important**: Only use `::part()` on parts that are explicitly documented in the component's API. The available parts are listed in the Custom Elements Manifest and Storybook documentation.

### 9.4 Per-Component Overrides with Selectors

Override tokens for specific component instances using CSS selectors:

```css
/* Override card tokens only in the sidebar */
.sidebar {
  --hds-card-padding: var(--hds-space-inset-sm);
  --hds-card-border-radius: var(--hds-radius-sm);
  --hds-card-shadow: none;
}

/* Override button tokens in the hero section */
.hero-section {
  --hds-button-primary-bg: #ffffff;
  --hds-button-primary-text: var(--hds-color-interactive-primary);
  --hds-button-font-size: var(--hds-font-size-lg);
}

/* Override specific component instance by ID */
#emergency-alert {
  --hds-color-feedback-danger: #ff0000;
}
```

This works because CSS custom properties inherit through the DOM tree. Setting a property on a parent element cascades it to all descendant Web Components within that subtree.

### 9.5 Theme Settings Integration

Map Drupal theme settings to CSS custom properties dynamically:

```php
<?php
// mytheme.theme

/**
 * Implements hook_preprocess_html().
 *
 * Injects theme settings as CSS custom properties.
 */
function mytheme_preprocess_html(array &$variables): void {
  $config = theme_get_setting('mytheme');

  $overrides = [];

  // Map theme settings to CSS custom properties
  if ($primary_color = $config['primary_color'] ?? NULL) {
    $overrides[] = "--hds-color-interactive-primary: {$primary_color}";
  }

  if ($heading_font = $config['heading_font'] ?? NULL) {
    $overrides[] = "--hds-font-family-heading: '{$heading_font}', serif";
  }

  if ($card_radius = $config['card_border_radius'] ?? NULL) {
    $overrides[] = "--hds-card-border-radius: {$card_radius}";
  }

  if (!empty($overrides)) {
    $css = ':root { ' . implode('; ', $overrides) . '; }';
    $variables['#attached']['html_head'][] = [
      [
        '#type' => 'html_tag',
        '#tag' => 'style',
        '#value' => $css,
      ],
      'mytheme_token_overrides',
    ];
  }
}
```

### 9.6 Single Directory Component (SDC) Wrappers

For teams using Drupal's SDC system (Drupal 10.3+ / 11), wrap Web Components as SDCs for Drupal-native component discovery:

```
themes/custom/mytheme/components/
  content-card/
    content-card.component.yml
    content-card.twig
```

```yaml
# content-card.component.yml
name: Content Card
description: 'Enterprise content card backed by the hx-content-card Web Component'
status: stable
props:
  type: object
  required:
    - heading
  properties:
    heading:
      type: string
      title: Heading
    summary:
      type: string
      title: Summary text
    category:
      type: string
      title: Category label
    href:
      type: string
      title: Link URL
      format: uri
    publish_date:
      type: string
      title: Publish date (ISO 8601)
    read_time:
      type: integer
      title: Read time in minutes
    variant:
      type: string
      title: Visual variant
      enum: [default, featured, compact]
      default: default
    image_url:
      type: string
      title: Hero image URL
    image_alt:
      type: string
      title: Hero image alt text
slots:
  default:
    title: Card body content
libraryOverrides:
  dependencies:
    - mytheme/hds-components
```

```twig
{# content-card.twig #}
<hx-content-card
  heading="{{ heading }}"
  {% if summary %}summary="{{ summary }}"{% endif %}
  {% if category %}category="{{ category }}"{% endif %}
  {% if href %}href="{{ href }}"{% endif %}
  {% if publish_date %}publish-date="{{ publish_date }}"{% endif %}
  {% if read_time %}read-time="{{ read_time }}"{% endif %}
  variant="{{ variant|default('default') }}"
>
  {% if image_url %}
    <img slot="media" src="{{ image_url }}" alt="{{ image_alt|default('') }}" loading="lazy" />
  {% endif %}

  {{ children }}
</hx-content-card>
```

Then use the SDC in other TWIG templates:

```twig
{# Using the SDC from another template #}
{% include 'mytheme:content-card' with {
  heading: node.label,
  summary: node.field_summary.value,
  category: node.field_category.entity.label,
  href: path('entity.node.canonical', {'node': node.id}),
  variant: 'featured',
} %}
```

---

## 10. Performance Optimization

### 10.1 Asset Loading Strategy

#### Preload Critical Components

For components that appear above the fold on every page, preload the module:

```html
{# In html.html.twig
<head>
  section #}
  <link
    rel="modulepreload"
    href="/themes/custom/mytheme/node_modules/@helix/library/dist/index.js"
  />
  <link
    rel="preload"
    href="/themes/custom/mytheme/node_modules/@helix/library/dist/styles/tokens.css"
    as="style"
  />
</head>
```

#### Per-Component Imports (Tree Shaking)

If your site only uses a subset of components, import individual components instead of the full bundle:

```yaml
# mytheme.libraries.yml

# Load only the card and button components
hds-cards:
  version: VERSION
  js:
    node_modules/@helix/library/dist/components/card/index.js:
      type: module
      minified: true
      preprocess: false
    node_modules/@helix/library/dist/components/button/index.js:
      type: module
      minified: true
      preprocess: false
  css:
    theme:
      node_modules/@helix/library/dist/styles/tokens.css:
        minified: true
        preprocess: false
```

### 10.2 Drupal Asset Aggregation

**Critical**: Do not let Drupal aggregate ES module files with classic scripts. The `preprocess: false` setting in `libraries.yml` prevents this.

In your Drupal performance settings:

```
/admin/config/development/performance
```

- **Aggregate CSS files**: Yes (token CSS can be aggregated safely)
- **Aggregate JavaScript files**: Yes, but the `preprocess: false` flag on WC library files excludes them from aggregation

### 10.3 Lazy Loading Below-the-Fold Components

For components that appear below the fold, use dynamic imports triggered by Intersection Observer:

```javascript
(function (Drupal, once) {
  'use strict';

  /**
   * Lazy-load heavy Web Components when they enter the viewport.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.hxLazyLoad = {
    attach(context) {
      const lazyComponents = once('hx-lazy-load', '[data-hx-lazy]', context);

      if (!lazyComponents.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target;
              const componentModule = el.dataset.wcLazy;

              // Dynamically import the component module
              import(componentModule).then(() => {
                // Component is now registered and will render
                observer.unobserve(el);
              });
            }
          });
        },
        {
          rootMargin: '200px', // Start loading 200px before viewport
        },
      );

      lazyComponents.forEach((el) => observer.observe(el));
    },
  };
})(Drupal, once);
```

Usage in TWIG:

```twig
{# Lazy-load the media gallery component #}
<hx-media-gallery
  data-hx-lazy="/themes/custom/mytheme/node_modules/@helix/library/dist/components/media-gallery/index.js"
>
  {# Fallback content shown before component loads #}
  <div class="gallery-fallback">
    {% for image in images %}
      <img src="{{ image.url }}" alt="{{ image.alt }}" loading="lazy" />
    {% endfor %}
  </div>
</hx-media-gallery>
```

### 10.4 Caching Strategies

#### Browser Cache Headers

Configure your web server to set appropriate cache headers for WC library assets:

```apache
# Apache .htaccess
<FilesMatch "\.(js|css)$">
  <IfModule mod_headers.c>
    # Cache for 1 year (assets are versioned via package version)
    Header set Cache-Control "public, max-age=31536000, immutable"
  </IfModule>
</FilesMatch>
```

```nginx
# Nginx
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Drupal Cache Tags and Contexts

Web Components render client-side, so they do not affect Drupal's render cache for the component markup itself. However, the data passed as attributes is subject to Drupal's caching:

```php
<?php

// When building component attributes from entity data,
// add appropriate cache metadata:
$build['card'] = [
  '#type' => 'html_tag',
  '#tag' => 'hx-content-card',
  '#attributes' => [
    'heading' => $node->label(),
    // ... other attributes
  ],
  '#cache' => [
    'tags' => $node->getCacheTags(),
    'contexts' => ['url.path', 'user.roles'],
    'max-age' => 3600,
  ],
];
```

#### Service Worker Considerations

If your site uses a service worker (e.g., via the Drupal PWA module), precache the Web Component library files:

```javascript
// service-worker.js
const WC_ASSETS = [
  '/themes/custom/mytheme/node_modules/@helix/library/dist/index.js',
  '/themes/custom/mytheme/node_modules/@helix/library/dist/styles/tokens.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('wc-library-v1').then((cache) => cache.addAll(WC_ASSETS)));
});
```

### 10.5 Performance Checklist

- [ ] Token CSS is loaded in `<head>` (render-blocking is acceptable for tokens)
- [ ] Component JS uses `type: module` and `preprocess: false`
- [ ] Above-the-fold components are preloaded with `<link rel="modulepreload">`
- [ ] Below-the-fold components use lazy loading via Intersection Observer
- [ ] Images in component slots use `loading="lazy"` and `decoding="async"`
- [ ] Browser cache headers set to 1 year with immutable for versioned assets
- [ ] Drupal's CSS aggregation is enabled (token CSS can be aggregated)
- [ ] No duplicate component registrations (check console for warnings)
- [ ] Font preloading configured for custom web fonts
- [ ] Service worker precaches WC library assets (if using PWA)

---

## 11. Accessibility Checklist

This checklist covers Drupal-specific accessibility considerations when integrating the Web Component library. The components themselves are built to WCAG 2.1 AA (targeting AAA for color contrast), but correct integration is the Drupal team's responsibility.

### Screen Reader Testing

- [ ] Test all pages with NVDA (Windows) and VoiceOver (macOS/iOS)
- [ ] Verify component headings are announced with correct level (h1-h6)
- [ ] Verify form labels are announced when inputs receive focus
- [ ] Verify error messages are announced via `role="alert"` (live region)
- [ ] Verify card click events announce the card heading
- [ ] Verify modal dialogs announce their title when opened
- [ ] Verify accordion state changes are announced (expanded/collapsed)

### Keyboard Navigation

- [ ] Tab order follows logical reading order through all components
- [ ] All interactive components are reachable via Tab key
- [ ] Cards with `href` attribute are focusable and activatable with Enter
- [ ] Accordion items toggle with Enter and Space keys
- [ ] Tab panels switch with Arrow keys
- [ ] Modals trap focus within the dialog when open
- [ ] Escape key closes modals and returns focus to trigger
- [ ] Focus indicator is visible (3:1 contrast against adjacent colors)

### Drupal-Specific Concerns

- [ ] `{{ attributes }}` is passed through to Web Components where appropriate
- [ ] Drupal's system status messages are accessible alongside Web Components
- [ ] Drupal's admin toolbar does not interfere with component focus management
- [ ] Layout Builder preview mode renders components correctly
- [ ] Contextual links (pencil icon) remain accessible on component wrappers

### Form Accessibility

- [ ] Every `hx-text-input` has a visible, non-empty `label` attribute
- [ ] Required fields have `required` attribute (not just visual indicator)
- [ ] Error messages use `error-message` attribute (renders `role="alert"`)
- [ ] Help text uses `help-text` attribute (connected via `aria-describedby`)
- [ ] Form submission errors focus the first invalid field
- [ ] Server-side validation errors display in the Web Component UI

### ARIA and Semantics

- [ ] ARIA attributes from Drupal templates are not duplicated by components
- [ ] Landmark regions (`nav`, `main`, `aside`) are not duplicated
- [ ] Heading hierarchy is maintained (h1 > h2 > h3, no skipping)
- [ ] Decorative images use `alt=""` in slots (not omitted entirely)
- [ ] Tables have proper `<caption>` or `aria-label`

### Focus Management After Dynamic Updates

- [ ] After AJAX content replacement, focus moves to the new content region
- [ ] BigPipe progressive rendering does not steal focus from user interaction
- [ ] After Views AJAX pager loads, focus moves to the first new result
- [ ] After form AJAX validation, focus moves to the error summary or first error

### Visual and Display Modes

- [ ] Components render correctly at 200% browser zoom
- [ ] Components tolerate text spacing overrides (WCAG 1.4.12 bookmarklet test)
- [ ] High contrast mode (`data-theme="high-contrast-light"` / `high-contrast-dark"`) works
- [ ] Windows High Contrast Mode / Forced Colors renders all controls visibly
- [ ] `prefers-reduced-motion` disables all transitions and animations

---

## 12. Troubleshooting & Debugging

### 12.1 Components Not Rendering

**Symptom**: The page shows the raw HTML tags (e.g., `<hx-content-card>`) instead of rendered components.

**Possible causes and solutions:**

| Cause                      | Diagnosis                                          | Solution                                                           |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| Library not loaded         | Check Network tab for 404 on `index.js`            | Verify path in `libraries.yml`, run `drush cr`                     |
| Missing `type: module`     | Console error: "Unexpected token 'export'"         | Add `type: module` to the js entry in `libraries.yml`              |
| Wrong `preprocess` setting | ES module bundled with other scripts, syntax error | Set `preprocess: false` on the js entry                            |
| Library not attached       | No `index.js` request in Network tab               | Add `attach_library()` in TWIG or global attachment in `.info.yml` |
| CORS issue (CDN)           | Console error: "CORS policy"                       | Add CORS headers to CDN, or use self-hosted assets                 |
| Module not supported       | Older browser (IE11)                               | Web Components require modern browsers; add polyfills if needed    |

**Quick diagnostic script:**

```javascript
// Paste in DevTools console to check component registration
const tags = ['hx-content-card', 'hx-button', 'hx-hero-banner'];
tags.forEach((tag) => {
  const registered = customElements.get(tag);
  console.log(`${tag}: ${registered ? 'registered' : 'NOT REGISTERED'}`);
});
```

### 12.2 Attributes Not Updating

**Symptom**: Component attributes show stale data or do not reflect Drupal field values.

| Cause                  | Diagnosis                                             | Solution                                                                                      |
| ---------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------ | ----- | ---------------------------------- | ------ | --------- | -------- |
| Drupal render cache    | Change not reflected after field edit                 | Clear cache: `drush cr` or configure cache tags correctly                                     |
| TWIG auto-escaping     | HTML entities in attribute values                     | This is correct behavior; do not use `                                                        | raw` in attributes |
| Attribute vs. property | Setting a JS property but checking the HTML attribute | Use `reflect: true` on the component property (library concern), or set via attribute in TWIG |
| Whitespace in value    | Leading/trailing spaces from `                        | render                                                                                        | striptags`         | Add ` | trim`filter:`{{ content.field_name | render | striptags | trim }}` |
| Boolean attributes     | `attribute="false"` still truthy in HTML              | For boolean attributes, conditionally include/exclude: `{% if value %}attribute{% endif %}`   |

**Boolean attribute pattern:**

```twig
{# WRONG: <hx-button disabled="false"> -- "false" is truthy in HTML #}
<hx-button {{ is_disabled ? 'disabled' : '' }}>

{# RIGHT: attribute present = true, absent = false #}
<hx-button {% if is_disabled %}disabled{% endif %}>
```

### 12.3 Events Not Firing

**Symptom**: Event listeners attached in Drupal behaviors never trigger.

| Cause                                      | Diagnosis                                  | Solution                                                                |
| ------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------- |
| Listener attached before component defined | Race condition on page load                | Use `customElements.whenDefined()` or listen on a parent                |
| Behavior context not applied               | `once()` filtered out the element          | Check that the CSS selector matches, use DevTools to verify             |
| Shadow DOM event not composed              | Event does not bubble past shadow boundary | Library bug: event should use `composed: true`. Report to library team. |
| Event name mismatch                        | Typo in event name                         | Check CEM or Storybook docs for exact event name                        |
| AJAX content not re-attached               | New elements after AJAX lack behaviors     | Ensure `Drupal.attachBehaviors()` is called after content insertion     |

**Event debugging:**

```javascript
// Temporarily log all custom events from Web Components
document.addEventListener('hx-card-click', (e) => console.log('card-click', e.detail));
document.addEventListener('hx-form-submit', (e) => console.log('form-submit', e.detail));

// Or listen for ALL events on a specific component
const card = document.querySelector('hx-content-card');
const events = ['hx-card-click'];
events.forEach((name) => {
  card.addEventListener(name, (e) => console.log(name, e.detail));
});
```

### 12.4 Styling Not Applied

**Symptom**: Components appear unstyled or CSS overrides have no effect.

| Cause                               | Diagnosis                          | Solution                                                                                                                 |
| ----------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Token CSS not loaded                | No `--hds-*` properties on `:root` | Verify `hds-tokens` library is attached, check Network tab                                                               |
| CSS load order wrong                | Overrides load before tokens       | Ensure override library depends on token library in `libraries.yml`                                                      |
| CSS custom properties not inherited | Property defined on wrong element  | Set on `:root` or on a parent element of the component                                                                   |
| `::part()` on non-existent part     | No effect, no error                | Check CEM/Storybook for available part names                                                                             |
| Drupal CSS aggregation conflict     | Aggregated CSS changes load order  | Set `preprocess: false` on override stylesheets if order matters                                                         |
| Specificity issue                   | Token override not taking effect   | Check that the selector specificity of your override is sufficient; `:root` should be sufficient for top-level overrides |

**Token inspection tool:**

```javascript
// Check all HDS tokens currently resolved on an element
function inspectTokens(element) {
  const computed = getComputedStyle(element);
  const tokens = {};
  for (const prop of computed) {
    if (prop.startsWith('--hds-')) {
      tokens[prop] = computed.getPropertyValue(prop).trim();
    }
  }
  console.table(tokens);
}

// Usage
inspectTokens(document.documentElement); // Check :root tokens
inspectTokens(document.querySelector('hx-content-card')); // Check component tokens
```

### 12.5 Flash of Unstyled Content (FOUC)

**Symptom**: Components briefly appear unstyled or with raw content before rendering.

**Solutions:**

1. **Load token CSS in `<head>`** (synchronous, render-blocking):

   ```yaml
   hds-tokens:
     css:
       theme:
         tokens.css: {} # Loaded in <head> by default
   ```

2. **Use `:not(:defined)` CSS to hide unregistered elements**:

   ```css
   /* mytheme.css */
   hx-content-card:not(:defined),
   hx-hero-banner:not(:defined),
   hx-button:not(:defined) {
     /* Hide component until registered and rendered */
     opacity: 0;
     visibility: hidden;
   }
   ```

3. **Or use `:not(:defined)` with a placeholder skeleton**:

   ```css
   hx-content-card:not(:defined) {
     display: block;
     min-height: 200px;
     background: var(--hds-color-surface-secondary);
     border-radius: var(--hds-card-border-radius, 8px);
     animation: pulse 1.5s ease-in-out infinite;
   }

   @keyframes pulse {
     0%,
     100% {
       opacity: 0.6;
     }
     50% {
       opacity: 1;
     }
   }

   @media (prefers-reduced-motion: reduce) {
     hx-content-card:not(:defined) {
       animation: none;
       opacity: 0.8;
     }
   }
   ```

---

## 13. Upgrade & Maintenance

### 13.1 Semantic Versioning Strategy

The `@helix/library` package follows strict semantic versioning:

| Version Type      | Change Examples                                                                                       | Action Required                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Patch** (1.0.x) | Bug fixes, typo corrections in docs, internal refactoring                                             | Update directly. No template changes needed.                              |
| **Minor** (1.x.0) | New components added, new optional attributes on existing components, new token values                | Update directly. Review changelog for new features you may want to adopt. |
| **Major** (x.0.0) | Removed components, renamed attributes, changed event names, removed tokens, changed default behavior | Read migration guide. Plan template updates. Test in staging.             |

### 13.2 Upgrade Workflow

#### Step 1: Read the Changelog

Before any upgrade, read the changelog:

```bash
# View changelog
cat node_modules/@helix/library/CHANGELOG.md

# Or check the Storybook for the new version
```

#### Step 2: Update the Package

```bash
# Update to latest within semver range
npm update @helix/library

# Or update to a specific version
npm install @helix/library@1.2.0

# For major version upgrades
npm install @helix/library@2.0.0
```

#### Step 3: Clear Caches

```bash
drush cr
```

#### Step 4: Test in Staging

Run your full test suite against the staging environment:

```bash
# Visual regression test (if you have one)
npx backstop test

# Accessibility audit
npx pa11y-ci --config .pa11yci.json

# Manual smoke test: check all major page templates
```

#### Step 5: Update Templates (Major Versions Only)

For major version upgrades, the migration guide will list all breaking changes. Common patterns:

```twig
{# Before (v1) #}
<hx-content-card title="{{ node.label }}">

{# After (v2) -- attribute renamed #}
<hx-content-card heading="{{ node.label }}">
```

### 13.3 Version Pinning Strategy

**Recommended**: Pin to a specific minor version range in `package.json`:

```json
{
  "dependencies": {
    "@helix/library": "~1.2.0"
  }
}
```

This allows patch updates (1.2.1, 1.2.2) but requires explicit action for minor updates (1.3.0). For critical enterprise environments, exact pinning may be preferred:

```json
{
  "dependencies": {
    "@helix/library": "1.2.0"
  }
}
```

### 13.4 Rollback Strategy

If an upgrade causes issues in production:

1. **Revert the package version**:

   ```bash
   npm install @helix/library@1.1.0  # Previous version
   ```

2. **Clear all caches**:

   ```bash
   drush cr
   ```

3. **Purge CDN cache** (if using CDN delivery):

   ```bash
   # Invalidate CDN cache for the WC library path
   aws cloudfront create-invalidation --distribution-id XXXXX \
     --paths "/wc-library/*"
   ```

4. **Report the issue** to the library team with:
   - Browser and version
   - Drupal version
   - Component name and attributes used
   - Console errors (if any)
   - Screenshot or screen recording

### 13.5 Monitoring Component Health

Set up monitoring for Web Component-related issues in production:

```javascript
// mytheme/js/helix-error-monitoring.js

(function () {
  'use strict';

  // Monitor for Web Component registration failures
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('customElements')) {
      // Report to your error tracking service
      if (typeof Sentry !== 'undefined') {
        Sentry.captureException(new Error('Web Component registration failure'), {
          extra: {
            message: event.message,
            filename: event.filename,
          },
        });
      }
    }
  });

  // Monitor for unresolved custom elements after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const unresolved = document.querySelectorAll(':not(:defined)');
      if (unresolved.length > 0) {
        const tags = [...new Set([...unresolved].map((el) => el.tagName.toLowerCase()))];
        console.warn('Unresolved custom elements:', tags);

        // Report to monitoring
        if (typeof gtag === 'function') {
          gtag('event', 'wc_unresolved', {
            component_tags: tags.join(','),
            page_path: window.location.pathname,
          });
        }
      }
    }, 5000); // Check after 5 seconds
  });
})();
```

---

## 14. Real-World Example Project

### "Regional Content Partners" -- A Complete Integration

This section provides a complete, working example of an enterprise blog site integrating the `@helix/library` Web Component library with Drupal.

### 14.1 Site Overview

- **Content types**: Article, Author, Category (taxonomy)
- **Views**: Latest Articles (listing page), Related Articles (sidebar block)
- **Theme**: Custom theme `rhp_theme` (Regional Content Partners)
- **Components used**: `hx-content-card`, `hx-card-grid`, `hx-hero-banner`, `hx-article-layout`, `hx-breadcrumb`, `hx-pagination`, `hx-button`, `hx-badge`, `hx-avatar`, `hx-accordion`, `hx-search-bar`

### 14.2 Theme File Structure

```
themes/custom/rhp_theme/
  rhp_theme.info.yml
  rhp_theme.libraries.yml
  rhp_theme.theme                          # Preprocess functions
  package.json
  node_modules/
    @helix/library/                       # Installed via npm
  css/
    base.css                               # Base theme styles
    token-overrides.css                    # Brand token overrides
    dark-mode.css                          # Dark mode token overrides
    component-overrides.css               # Per-component overrides
    utilities.css                           # Utility classes for layout
  js/
    helix-behaviors.js                       # Event handling behaviors
    helix-theme-toggle.js                    # Theme toggle behavior
  templates/
    html.html.twig                         # HTML wrapper with theme flash prevention
    page.html.twig                         # Page layout
    node--article--teaser.html.twig        # Article teaser -> hx-content-card
    node--article--full.html.twig          # Article full -> wc-article-layout
    field--node--field-category.html.twig  # Category field -> wc-badge
    field--node--field-tags.html.twig      # Tags field -> wc-tag
    views-view-unformatted--latest-articles.html.twig
    views-view-fields--latest-articles.html.twig
    block--system-branding-block.html.twig
  components/                              # SDC wrappers (optional)
    content-card/
      content-card.component.yml
      content-card.twig
```

### 14.3 Core Configuration Files

#### `rhp_theme.info.yml`

```yaml
name: 'Regional Content Partners'
type: theme
description: 'Enterprise content platform theme using WC Web Components'
core_version_requirement: ^10.3 || ^11
base theme: false

libraries:
  - rhp_theme/global
  - rhp_theme/hds-tokens
  - rhp_theme/hds-components
  - rhp_theme/token-overrides
  - rhp_theme/behaviors

regions:
  header: Header
  content: Content
  sidebar: Sidebar
  footer: Footer
```

#### `rhp_theme.libraries.yml`

```yaml
global:
  version: VERSION
  css:
    base:
      css/base.css: {}
    theme:
      css/utilities.css: {}

hds-tokens:
  version: VERSION
  css:
    theme:
      node_modules/@helix/library/dist/styles/tokens.css:
        minified: true
        preprocess: false

hds-components:
  version: VERSION
  js:
    node_modules/@helix/library/dist/index.js:
      type: module
      minified: true
      preprocess: false
  dependencies:
    - rhp_theme/hds-tokens

token-overrides:
  version: VERSION
  css:
    theme:
      css/token-overrides.css: {}
      css/dark-mode.css: {}
      css/component-overrides.css: {}
  dependencies:
    - rhp_theme/hds-tokens

behaviors:
  version: VERSION
  js:
    js/helix-behaviors.js: {}
    js/helix-theme-toggle.js: {}
  dependencies:
    - core/drupal
    - core/once
    - rhp_theme/hds-components
```

### 14.4 Token Override File

```css
/* css/token-overrides.css */

:root {
  /* Regional Content Partners brand colors */
  --hds-color-interactive-primary: #0e7c61; /* Brand teal */
  --hds-color-interactive-primary-hover: #0a6650;
  --hds-color-interactive-primary-active: #085340;
  --hds-color-feedback-success: #16a34a;
  --hds-color-feedback-danger: #dc2626;

  /* Typography: Merriweather for headings, Source Sans for body */
  --hds-font-family-heading: 'Merriweather', Georgia, serif;
  --hds-font-family-body: 'Source Sans 3', system-ui, sans-serif;

  /* Slightly more rounded cards */
  --hds-card-border-radius: 12px;

  /* Pill-shaped buttons */
  --hds-button-primary-border-radius: 999px;
}
```

### 14.5 Preprocess Functions

```php
<?php
// rhp_theme.theme

/**
 * Implements hook_preprocess_node__article__teaser().
 */
function rhp_theme_preprocess_node__article__teaser(array &$variables): void {
  /** @var \Drupal\node\NodeInterface $node */
  $node = $variables['node'];

  $variables['wc'] = [
    'heading'      => $node->label(),
    'summary'      => $node->get('field_summary')->value ?? '',
    'category'     => $node->get('field_category')->entity?->label() ?? '',
    'href'         => $node->toUrl()->toString(),
    'publish_date' => date('c', $node->getCreatedTime()),
    'read_time'    => (int) ($node->get('field_read_time')->value ?? 0),
    'variant'      => $node->isPromoted() ? 'featured' : 'default',
  ];
}

/**
 * Implements hook_preprocess_node__article__full().
 */
function rhp_theme_preprocess_node__article__full(array &$variables): void {
  /** @var \Drupal\node\NodeInterface $node */
  $node = $variables['node'];

  $variables['wc'] = [
    'heading'    => $node->label(),
    'subtitle'   => $node->get('field_subtitle')->value ?? '',
    'date'       => date('F j, Y', $node->getCreatedTime()),
    'date_iso'   => date('c', $node->getCreatedTime()),
    'read_time'  => (int) ($node->get('field_read_time')->value ?? 0),
    'has_sidebar' => !$node->get('field_related_articles')->isEmpty(),
  ];

  // Author data
  $author = $node->get('field_author')->entity;
  if ($author) {
    $variables['wc']['author'] = [
      'name' => $author->label(),
      'bio'  => $author->get('field_bio')->value ?? '',
    ];

    if (!$author->get('field_avatar')->isEmpty()) {
      $avatar = $author->get('field_avatar')->entity;
      if ($avatar) {
        $variables['wc']['author']['avatar_url'] = \Drupal::service('file_url_generator')
          ->generateAbsoluteString($avatar->getFileUri());
      }
    }
  }
}
```

### 14.6 Key Templates

#### `node--article--teaser.html.twig`

```twig
{{ attach_library('rhp_theme/hds-components') }}

<hx-content-card
  heading="{{ wc.heading }}"
  summary="{{ wc.summary }}"
  category="{{ wc.category }}"
  href="{{ wc.href }}"
  publish-date="{{ wc.publish_date }}"
  read-time="{{ wc.read_time }}"
  variant="{{ wc.variant }}"
>
  {% if content.field_media|render|trim is not empty %}
    <div slot="media">
      {{ content.field_media }}
    </div>
  {% endif %}
</hx-content-card>
```

#### `node--article--full.html.twig`

```twig
{{ attach_library('rhp_theme/hds-components') }}

{# Hero #}
{% if content.field_hero_image|render|trim is not empty %}
  <hx-hero-banner
    heading="{{ wc.heading }}"
    subheading="{{ wc.subtitle }}"
  >
    <div slot="media">{{ content.field_hero_image }}</div>
  </hx-hero-banner>
{% endif %}

{# Article layout #}
<hx-article-layout {% if wc.has_sidebar %}has-sidebar{% endif %}>
  {# Breadcrumb #}
  <nav slot="breadcrumb" aria-label="{{ 'Breadcrumb'|t }}">
    {{ drupal_block('system_breadcrumb_block') }}
  </nav>

  {# Author #}
  {% if wc.author is defined %}
    <div slot="author">
      <hx-media-object>
        {% if wc.author.avatar_url is defined %}
          <hx-avatar
            slot="media"
            src="{{ wc.author.avatar_url }}"
            alt="{{ wc.author.name }}"
            size="md"
          ></hx-avatar>
        {% endif %}
        <div>
          <strong>{{ wc.author.name }}</strong>
          <time datetime="{{ wc.date_iso }}">{{ wc.date }}</time>
          {% if wc.read_time %}
            <span>&middot; {{ wc.read_time }} {{ 'min read'|t }}</span>
          {% endif %}
        </div>
      </hx-media-object>
    </div>
  {% endif %}

  {# Body #}
  {{ content.body }}

  {# Sidebar #}
  {% if wc.has_sidebar %}
    <div slot="sidebar">
      <h3>{{ 'Related Articles'|t }}</h3>
      {{ content.field_related_articles }}
    </div>
  {% endif %}

  {# Footer: tags #}
  <div slot="footer">
    {{ content.field_tags }}
  </div>
</hx-article-layout>
```

#### `views-view-unformatted--latest-articles.html.twig`

```twig
{{ attach_library('rhp_theme/hds-components') }}

{% if rows|length > 0 %}
  <hx-card-grid columns="3" gap="lg">
    {% for row in rows %}
      {{ row.content }}
    {% endfor %}
  </hx-card-grid>
{% endif %}
```

### 14.7 Behavior File

```javascript
/**
 * @file
 * Regional Content Partners -- WC component behaviors.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Track content card clicks in Google Analytics 4.
   */
  Drupal.behaviors.rhpCardAnalytics = {
    attach(context) {
      const cards = once('rhp-card-analytics', 'hx-content-card', context);

      cards.forEach((card) => {
        card.addEventListener('hx-card-click', (event) => {
          const { href, heading, keyboard } = event.detail;

          if (typeof gtag === 'function') {
            gtag('event', 'content_card_click', {
              content_title: heading,
              content_url: href,
              interaction_method: keyboard ? 'keyboard' : 'mouse',
              page_section: card.closest('[data-section]')?.dataset.section ?? 'unknown',
            });
          }
        });
      });
    },
  };

  /**
   * Connect search bar to Drupal Search API.
   */
  Drupal.behaviors.rhpSearch = {
    attach(context) {
      const searchBars = once('rhp-search', 'hx-search-bar', context);

      searchBars.forEach((searchBar) => {
        searchBar.addEventListener('hx-search-submit', (event) => {
          const { query } = event.detail;
          if (query.trim()) {
            window.location.href = `/search?keys=${encodeURIComponent(query)}`;
          }
        });
      });
    },
  };

  /**
   * Handle accordion tracking.
   */
  Drupal.behaviors.rhpAccordionTracking = {
    attach(context) {
      const accordions = once('rhp-accordion', 'hx-accordion', context);

      accordions.forEach((accordion) => {
        accordion.addEventListener('hx-accordion-toggle', (event) => {
          if (typeof gtag === 'function') {
            gtag('event', 'faq_toggle', {
              question: event.detail.heading,
              action: event.detail.open ? 'expand' : 'collapse',
            });
          }
        });
      });
    },
  };
})(Drupal, once);
```

### 14.8 Theme Toggle Behavior

```javascript
/**
 * @file
 * Theme toggle (light/dark mode) behavior.
 */

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.rhpThemeToggle = {
    attach(context) {
      const toggles = once('rhp-theme-toggle', '[data-theme-toggle]', context);

      toggles.forEach((toggle) => {
        toggle.addEventListener('click', () => {
          const current = document.documentElement.getAttribute('data-theme');
          const next = current === 'dark' ? 'light' : 'dark';

          document.documentElement.setAttribute('data-theme', next);
          localStorage.setItem('hds-theme-preference', next);

          // Update toggle button label for accessibility
          toggle.setAttribute(
            'aria-label',
            next === 'dark' ? Drupal.t('Switch to light mode') : Drupal.t('Switch to dark mode'),
          );
        });
      });
    },
  };
})(Drupal, once);
```

### 14.9 Integration Verification Checklist

Use this checklist to verify your integration is complete and correct:

- [ ] `npm install @helix/library` completed successfully
- [ ] `libraries.yml` declares both `hds-tokens` (CSS) and `hds-components` (JS)
- [ ] Component JS entry uses `type: module` and `preprocess: false`
- [ ] Libraries attached globally in `.info.yml` or per-template via `attach_library()`
- [ ] `drush cr` run after configuration changes
- [ ] Token CSS loads in `<head>` (verify with DevTools Elements tab)
- [ ] `:root` has `--hds-*` custom properties (verify with DevTools Computed tab)
- [ ] Component JS loads with `type="module"` attribute (verify in Network tab)
- [ ] Custom elements are registered (verify with `customElements.get('hx-content-card')` in console)
- [ ] Components render correctly on article teaser pages
- [ ] Components render correctly on article full-view pages
- [ ] Token overrides (brand colors, typography) are applied
- [ ] Dark mode toggle works and persists preference
- [ ] Events fire correctly (check Drupal behavior handlers)
- [ ] Analytics tracking records component interactions
- [ ] Keyboard navigation works through all components
- [ ] Screen reader announces component content correctly
- [ ] Performance: no FOUC, lazy loading works for below-fold components
- [ ] Cache: cleared after every configuration change, appropriate cache tags on render arrays

---

## Appendix A: Complete Attribute-to-Field Mapping Table

This table maps every `hx-content-card` attribute to its Drupal source and TWIG expression. Equivalent tables for each component are available in the Storybook documentation.

| WC Attribute   | Type                                      | Drupal Source                     | TWIG Expression                                          | Required |
| -------------- | ----------------------------------------- | --------------------------------- | -------------------------------------------------------- | -------- |
| `heading`      | String                                    | Node title                        | `{{ node.label }}`                                       | Yes      |
| `summary`      | String                                    | `field_summary` (Plain text)      | `{{ content.field_summary\|render\|striptags\|trim }}`   | No       |
| `category`     | String                                    | `field_category` (Term reference) | `{{ node.field_category.entity.label }}`                 | No       |
| `href`         | String                                    | Node canonical URL                | `{{ path('entity.node.canonical', {'node': node.id}) }}` | No       |
| `publish-date` | String (ISO 8601)                         | Node created timestamp            | `{{ node.getCreatedTime()\|date('c') }}`                 | No       |
| `read-time`    | Number                                    | `field_read_time` (Integer)       | `{{ node.field_read_time.value }}`                       | No       |
| `variant`      | String (`default`, `featured`, `compact`) | Derived from promotion status     | `{{ node.isPromoted() ? 'featured' : 'default' }}`       | No       |

## Appendix B: Event Reference

All custom events emitted by Web Components. These events use `bubbles: true` and `composed: true`, meaning they cross Shadow DOM boundaries and can be caught at any ancestor level.

| Event Name            | Component         | Detail Properties             | Use Case                  |
| --------------------- | ----------------- | ----------------------------- | ------------------------- |
| `hx-card-click`       | `hx-content-card` | `{ href, heading, keyboard }` | Analytics, navigation     |
| `hx-form-submit`      | `hx-form`         | `{ formData, valid }`         | Form processing           |
| `hx-input`            | `hx-text-input`   | `{ value, name }`             | Real-time validation      |
| `hx-change`           | `hx-text-input`   | `{ value, name }`             | Value change tracking     |
| `hx-search-submit`    | `hx-search-bar`   | `{ query }`                   | Search routing            |
| `hx-search-input`     | `hx-search-bar`   | `{ query }`                   | Autocomplete              |
| `hx-accordion-toggle` | `hx-accordion`    | `{ heading, open }`           | Analytics, state tracking |
| `hx-tab-change`       | `hx-tabs`         | `{ index, label }`            | Analytics, deep linking   |
| `hx-modal-open`       | `hx-modal`        | `{ id }`                      | Focus management          |
| `hx-modal-close`      | `hx-modal`        | `{ id }`                      | Focus restoration         |
| `hx-nav-toggle`       | `hx-nav-mobile`   | `{ open }`                    | Mobile nav state          |
| `hx-page-change`      | `hx-pagination`   | `{ page }`                    | AJAX paging               |

## Appendix C: CSS Custom Property Quick Reference

The most commonly overridden tokens for brand customization:

```css
:root {
  /* --- Brand Colors --- */
  --hds-color-interactive-primary: #YOUR_PRIMARY;
  --hds-color-interactive-primary-hover: #YOUR_PRIMARY_HOVER;
  --hds-color-feedback-success: #YOUR_SUCCESS;
  --hds-color-feedback-danger: #YOUR_DANGER;

  /* --- Typography --- */
  --hds-font-family-heading: 'Your Heading Font', serif;
  --hds-font-family-body: 'Your Body Font', sans-serif;

  /* --- Card Component --- */
  --hds-card-border-radius: 8px;
  --hds-card-padding: 1.5rem;
  --hds-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  /* --- Button Component --- */
  --hds-button-primary-border-radius: 8px;
  --hds-button-primary-bg: var(--hds-color-interactive-primary);
  --hds-button-font-size: 0.875rem;

  /* --- Focus Ring (critical for accessibility) --- */
  --hds-color-border-focus: #3b82f6;
}
```

---

## References

### Drupal Documentation

- [Adding Assets (CSS, JS) to a Drupal Module via libraries.yml](https://www.drupal.org/docs/develop/creating-modules/adding-assets-css-js-to-a-drupal-module-via-librariesyml)
- [Drupal Single Directory Components (SDC)](https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components/quickstart)
- [TWIG Template Reference](https://www.drupal.org/docs/develop/theming-drupal/twig-in-drupal)
- [Drupal JavaScript API and Behaviors](https://www.drupal.org/docs/develop/drupal-apis/javascript-api/javascript-api-overview)
- [Drupal AJAX Framework](https://www.drupal.org/docs/develop/drupal-apis/ajax-api)

### Web Components & Lit

- [Lit Official Documentation](https://lit.dev/docs/)
- [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/)
- [ElementInternals (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [Form-Associated Custom Elements](https://bennypowers.dev/posts/form-associated-custom-elements/)

### Integration Resources

- [Web Components Drupal Module](https://www.drupal.org/project/webcomponents)
- [Custom Elements Drupal Module](https://www.drupal.org/project/custom_elements)
- [Declarative Shadow DOM and the Future of Drupal Theming](https://john.albin.net/presentations/2025-11-18/declarative-shadow-dom-and-future-drupal-theming)
- [Server Rendering Lit Web Components with Drupal](https://bennypowers.dev/posts/drupal-lit-ssr/)
- [Drupal Meets Design Systems (Enterprise UI Consistency)](https://medium.com/@drupart-digital/drupal-meets-design-systems-a-new-era-in-enterprise-ui-consistency-86b4cc4a0b8a)

### Accessibility

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [European Accessibility Act (EAA)](https://ec.europa.eu/social/main.jsp?catId=1202)
