# hx-card — Drupal Integration Guide

## Overview

`hx-card` is a flexible content container with image, heading, body, footer, and actions slots. In Drupal, it can be used to display node teasers, patient summaries, search results, and other grouped content.

## Twig Template

Use the provided `hx-card.twig` template or render the component directly:

```twig
{# Basic card #}
<hx-card variant="default" elevation="raised">
  <h3 slot="heading">{{ node.title }}</h3>
  <p>{{ node.body.summary }}</p>
  <span slot="footer">{{ node.field_date }}</span>
</hx-card>
```

```twig
{# Include via template #}
{% include 'hx-card.twig' with {
  variant: 'featured',
  elevation: 'raised',
  heading: node.title,
  heading_tag: 'h3',
  body: node.body.summary,
  footer: node.field_date,
  image: {
    src: node.field_image.url,
    alt: node.field_image.alt,
  },
} %}
```

## Template Variables

| Variable       | Type                                  | Default     | Description                                                        |
|----------------|---------------------------------------|-------------|--------------------------------------------------------------------|
| `variant`      | `'default'` \| `'featured'` \| `'compact'` | `'default'` | Visual style variant                                         |
| `elevation`    | `'flat'` \| `'raised'` \| `'floating'`| `'flat'`    | Shadow depth                                                       |
| `href`         | string                                |             | URL to navigate to. When set, the card becomes interactive.        |
| `aria_label`   | string                                |             | Required when `href` is set. Meaningful description for screen readers. |
| `heading`      | string                                |             | Card title text                                                    |
| `heading_tag`  | string                                | `'h3'`      | HTML tag for the heading element (`h2`, `h3`, etc.)                |
| `body`         | markup                                |             | Card body content (raw HTML/Twig markup)                           |
| `footer`       | string/markup                         |             | Footer content                                                     |
| `actions`      | markup                                |             | Action buttons. Do NOT use together with `href`.                   |
| `image`        | object `{ src, alt }`                 |             | Image for the image slot                                           |

## Interactive Cards (hx-href)

When `hx-href` is set, the card becomes a clickable navigation element. It fires the `hx-click` custom event instead of performing default browser navigation.

**In Drupal, you must handle the `hx-click` event via a Drupal behavior to perform navigation:**

```js
(function (Drupal, once) {
  Drupal.behaviors.hxCardNavigation = {
    attach(context) {
      // Use once() to avoid double-initialization on AJAX-rebuilt content
      once('hx-card-nav', 'hx-card[hx-href]', context).forEach((card) => {
        card.addEventListener('hx-click', (e) => {
          window.location.href = e.detail.href;
        });
      });
    },
  };
})(Drupal, once);
```

### Accessible Labels for Interactive Cards

Always provide `hx-aria-label` when using `hx-href`. The label should describe the card's purpose, not expose the raw URL:

```twig
{# Wrong — exposes raw URL to screen readers #}
<hx-card hx-href="/node/1234">...</hx-card>

{# Correct — meaningful description #}
<hx-card
  hx-href="/node/1234"
  hx-aria-label="View chart for Margaret Thompson"
>
  <h3 slot="heading">Margaret Thompson</h3>
  ...
</hx-card>
```

```twig
{# Drupal field mapping example #}
<hx-card
  hx-href="{{ node.url }}"
  hx-aria-label="{{ 'View @title'|t({'@title': node.title}) }}"
>
  <h3 slot="heading">{{ node.title }}</h3>
  {{ node.body.summary }}
</hx-card>
```

### AJAX Navigation (Drupal-style)

For Drupal AJAX navigation (e.g., Views AJAX pager, BigPipe updates):

```js
(function (Drupal, once) {
  Drupal.behaviors.hxCardAjax = {
    attach(context) {
      once('hx-card-ajax', 'hx-card[hx-href]', context).forEach((card) => {
        card.addEventListener('hx-click', (e) => {
          const href = e.detail.href;
          // Use Drupal AJAX or history API as appropriate for your project
          history.pushState(null, '', href);
          // Trigger content reload if needed
        });
      });
    },
  };
})(Drupal, once);
```

## Anti-Pattern Warning: hx-href + actions slot

Do NOT use `hx-href` and `slot="actions"` together on the same card. This creates an ARIA violation: interactive controls (buttons) nested inside a `role="link"` element.

```twig
{# WRONG — ARIA violation: buttons inside role="link" #}
<hx-card hx-href="/node/1234">
  <span slot="actions">
    <hx-button>View Chart</hx-button>
  </span>
</hx-card>

{# CORRECT — Use either hx-href OR actions, not both #}
<hx-card hx-href="/node/1234" hx-aria-label="View Margaret Thompson">
  <h3 slot="heading">Margaret Thompson</h3>
</hx-card>

{# OR #}
<hx-card>
  <h3 slot="heading">Margaret Thompson</h3>
  <span slot="actions">
    <hx-button>View Chart</hx-button>
    <hx-button variant="secondary">Orders</hx-button>
  </span>
</hx-card>
```

## Slot Reference

| Slot      | Description                                                                           |
|-----------|---------------------------------------------------------------------------------------|
| `image`   | Optional image/media at the top of the card. Use `<img slot="image" src="..." alt="...">`. |
| `heading` | Card title. **Always use a semantic heading element** (`h2`, `h3`, etc.) for accessibility. Do not use `<span>`. |
| default   | Card body content — text, markup, nested components.                                  |
| `footer`  | Optional footer below the body.                                                       |
| `actions` | Optional action buttons. Incompatible with `hx-href`.                                 |

## Attribute Notes

| Attribute       | Drupal-safe? | Notes                                                                      |
|-----------------|:------------:|----------------------------------------------------------------------------|
| `variant`       | Yes          | String. `default`, `featured`, or `compact`.                               |
| `elevation`     | Yes          | String. `flat`, `raised`, or `floating`.                                   |
| `hx-href`       | Yes          | Custom attribute with `hx-` prefix. Valid HTML. Use `attributes.setAttribute('hx-href', url)` in PHP. |
| `hx-aria-label` | Yes          | String. Required when `hx-href` is set. Provides meaningful label for AT.  |

## Drupal Views Integration

For rendering a Views result as cards:

```twig
{# views/views-view-unformatted--patient-list.html.twig #}
<div class="patient-cards">
  {% for row in rows %}
    {% set patient = row.content['#row'] %}
    <hx-card
      variant="default"
      elevation="raised"
      hx-href="{{ patient.url }}"
      hx-aria-label="{{ 'View chart for @name'|t({'@name': patient.title}) }}"
    >
      <h3 slot="heading">{{ patient.title }}</h3>
      <p>{{ patient.field_summary }}</p>
      <span slot="footer">{{ patient.field_last_visit }}</span>
    </hx-card>
  {% endfor %}
</div>
```

## Asset Loading

```yaml
# mytheme.libraries.yml
hx-card:
  js:
    https://cdn.example.com/@helixui/library/dist/hx-card.js:
      type: external
      attributes:
        type: module
  dependencies:
    - core/once
```
