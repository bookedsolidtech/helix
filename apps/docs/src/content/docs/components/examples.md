---
title: Component Examples
description: Working examples of WC-2026 healthcare web components
---

Live component examples will be available once the component library is implemented in Phase 2. Below are usage patterns from the specification.

## Card Component

```html
<wc-card variant="elevated">
  <wc-heading level="3" slot="header">
    Patient Resources
  </wc-heading>
  <wc-text>
    Access healthcare information, appointment scheduling,
    and support services.
  </wc-text>
  <wc-button slot="actions" variant="primary">
    Learn More
  </wc-button>
</wc-card>
```

## Alert Component

```html
<wc-alert variant="info" dismissible>
  <wc-icon name="info-circle" slot="icon"></wc-icon>
  New flu vaccines are now available at all locations.
</wc-alert>

<wc-alert variant="warning">
  <wc-icon name="alert-triangle" slot="icon"></wc-icon>
  This facility is currently at capacity. Please check back later.
</wc-alert>
```

## Accordion Component

```html
<wc-accordion>
  <wc-accordion-item heading="What insurance do you accept?">
    We accept Medicare, Medicaid, and most major private insurance plans.
  </wc-accordion-item>
  <wc-accordion-item heading="How do I schedule an appointment?">
    Call our scheduling line or use the online patient portal.
  </wc-accordion-item>
</wc-accordion>
```

## Form Components

```html
<form>
  <wc-input
    label="Full Name"
    required
    error-message="Please enter your name"
  ></wc-input>

  <wc-select label="Department" required>
    <option value="">Select a department</option>
    <option value="primary">Primary Care</option>
    <option value="cardiology">Cardiology</option>
    <option value="oncology">Oncology</option>
  </wc-select>

  <wc-textarea
    label="Additional Notes"
    rows="4"
    maxlength="500"
  ></wc-textarea>

  <wc-button type="submit" variant="primary">
    Submit Request
  </wc-button>
</form>
```

## Drupal TWIG Integration

```twig
{# Drupal template using WC-2026 components #}
<wc-card variant="{{ content.field_card_variant.0['#markup'] }}">
  <wc-heading level="3" slot="header">
    {{ content.field_title }}
  </wc-heading>
  {{ content.field_body }}
  {% if content.field_cta_url %}
    <wc-button slot="actions" variant="primary"
      href="{{ content.field_cta_url.0['#url'] }}">
      {{ content.field_cta_text }}
    </wc-button>
  {% endif %}
</wc-card>
```

## Next Steps

- [Building Components](/components/building/) - Create your own components
- [Drupal Integration](/drupal-integration/overview/) - Use components in Drupal
- [Design Tokens](/design-tokens/overview/) - Customize the visual design
