---
title: TWIG Patterns
description: How to use HELIX components in Drupal TWIG templates
---

HELIX components work naturally in Drupal TWIG templates. This guide covers common patterns for mapping Drupal fields to component attributes.

## Basic Usage

```twig
{# node--article.html.twig #}
<wc-card variant="elevated">
  <wc-heading level="2" slot="header">
    {{ label }}
  </wc-heading>
  <div>
    {{ content.body }}
  </div>
  {% if content.field_cta_link %}
    <wc-button slot="actions" variant="primary"
      href="{{ content.field_cta_link.0['#url'] }}">
      {{ content.field_cta_link.0['#title'] }}
    </wc-button>
  {% endif %}
</wc-card>
```

## Field Mapping

| Drupal Field     | Component Attribute | Example                                              |
| ---------------- | ------------------- | ---------------------------------------------------- |
| Text (plain)     | String attribute    | `variant="{{ field_variant }}"`                      |
| Boolean          | Boolean attribute   | `{% if field_featured %}featured{% endif %}`         |
| Link             | href attribute      | `href="{{ field_link.0.url }}"`                      |
| Entity reference | Nested component    | Loop with `{% for item in items %}`                  |
| Image            | src attribute       | `src="{{ file_url(field_image.entity.uri.value) }}"` |

## Conditional Rendering

```twig
{# Only render if field has value #}
{% if content.field_alert_type|render|trim %}
  <wc-alert variant="{{ content.field_alert_type.0['#markup'] }}">
    {{ content.field_alert_message }}
  </wc-alert>
{% endif %}
```

## Slot Patterns

```twig
{# Named slots for component composition #}
<wc-card>
  <span slot="header">{{ content.field_title }}</span>
  <span slot="media">{{ content.field_image }}</span>
  {{ content.body }}
  <span slot="actions">{{ content.field_cta }}</span>
</wc-card>
```

## Detailed Guide

See the [Pre-Planning: Drupal Integration Guide](/pre-planning/drupal-guide/) for comprehensive TWIG patterns.
