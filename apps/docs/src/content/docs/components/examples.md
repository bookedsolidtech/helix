---
title: Component Examples
description: Working examples of HELIX enterprise web components
---

The following examples show common composition patterns for HELIX components. For live interactive demos, see [Storybook](https://storybook.helix.bookedsolid.tech/).

## Card Component

```html
<hx-card variant="featured" elevation="raised">
  <h3 slot="heading">Featured Resources</h3>
  <hx-text>Access our latest articles, resources, and support services.</hx-text>
  <hx-button slot="actions" variant="primary">Learn More</hx-button>
</hx-card>
```

## Alert Component

```html
<hx-alert variant="info" open show-icon dismissible>
  New content updates are now available across all sections.
</hx-alert>

<hx-alert variant="warning" open show-icon>
  This service is currently undergoing maintenance. Please check back later.
</hx-alert>
```

`hx-alert` requires the `open` attribute to render — it is hidden by default — and uses its built-in iconography when `show-icon` is set. Override the icon via the `icon` slot with an explicit `library` on `hx-icon`:

```html
<hx-alert variant="info" open show-icon>
  <hx-icon slot="icon" library="default" name="info-circle"></hx-icon>
  Custom icon override.
</hx-alert>
```

## Accordion Component

```html
<hx-accordion>
  <hx-accordion-item>
    <span slot="trigger">What subscription plans do you offer?</span>
    We offer Free, Professional, and Enterprise plans to fit your needs.
  </hx-accordion-item>
  <hx-accordion-item>
    <span slot="trigger">How do I contact support?</span>
    Contact our support team or use the online user portal.
  </hx-accordion-item>
</hx-accordion>
```

## Form Components

`hx-form` is a layout helper around a native `<form>` — wire the underlying form's `method`/`action` (or a JS submit handler) and give every field a `name` so `FormData` collects values:

```html
<hx-form>
  <form action="/api/contact" method="POST">
    <hx-text-input name="full_name" label="Full Name" required></hx-text-input>

    <hx-select name="category" label="Category" required>
      <option value="">Select a category</option>
      <option value="general">General Inquiry</option>
      <option value="support">Technical Support</option>
      <option value="feedback">Feedback</option>
    </hx-select>

    <hx-textarea name="notes" label="Additional Notes" rows="4" maxlength="500"></hx-textarea>

    <hx-button type="submit" variant="primary">Submit Request</hx-button>
  </form>
</hx-form>
```

## Drupal TWIG Integration

```twig
{# Drupal template using HELIX components #}
<hx-card
  variant="{{ content.field_card_variant.0['#markup'] }}"
  elevation="raised">
  <h3 slot="heading">
    {{ content.field_title }}
  </h3>
  {{ content.field_body }}
  {% if content.field_cta_url %}
    <hx-button slot="actions" variant="primary"
      href="{{ content.field_cta_url.0['#url'] }}">
      {{ content.field_cta_text }}
    </hx-button>
  {% endif %}
</hx-card>
```

## Next Steps

- [Building Components](/components/building/) - Create your own components
- [Drupal Integration](/drupal/installation/getting-started/) - Use components in Drupal
- [Design Tokens](/design-tokens/overview/) - Customize the visual design
