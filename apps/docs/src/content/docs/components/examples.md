---
title: Component Examples
description: Working examples of HELIX enterprise web components
---

The following examples show common composition patterns for HELIX components. For live interactive demos, see the [Component Library](/component-library/overview/).

## Card Component

```html
<hx-card variant="elevated">
  <span slot="heading">Featured Resources</span>
  <hx-text>Access our latest articles, resources, and support services.</hx-text>
  <hx-button slot="actions" variant="primary">Learn More</hx-button>
</hx-card>
```

## Alert Component

```html
<hx-alert variant="info" dismissible>
  <hx-icon name="info-circle" slot="icon"></hx-icon>
  New content updates are now available across all sections.
</hx-alert>

<hx-alert variant="warning">
  <hx-icon name="alert-triangle" slot="icon"></hx-icon>
  This service is currently undergoing maintenance. Please check back later.
</hx-alert>
```

## Accordion Component

```html
<hx-accordion>
  <hx-accordion-item heading="What subscription plans do you offer?">
    We offer Free, Professional, and Enterprise plans to fit your needs.
  </hx-accordion-item>
  <hx-accordion-item heading="How do I contact support?">
    Contact our support team or use the online user portal.
  </hx-accordion-item>
</hx-accordion>
```

## Form Components

```html
<hx-form>
  <hx-text-input label="Full Name" required></hx-text-input>

  <hx-select label="Category" required>
    <option value="">Select a category</option>
    <option value="general">General Inquiry</option>
    <option value="support">Technical Support</option>
    <option value="feedback">Feedback</option>
  </hx-select>

  <hx-textarea label="Additional Notes" rows="4" maxlength="500"></hx-textarea>

  <hx-button type="submit" variant="primary">Submit Request</hx-button>
</hx-form>
```

## Drupal TWIG Integration

```twig
{# Drupal template using HELIX components #}
<hx-card variant="{{ content.field_card_variant.0['#markup'] }}">
  <span slot="heading">
    {{ content.field_title }}
  </span>
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
- [Drupal Integration](/drupal-integration/overview/) - Use components in Drupal
- [Design Tokens](/design-tokens/overview/) - Customize the visual design
