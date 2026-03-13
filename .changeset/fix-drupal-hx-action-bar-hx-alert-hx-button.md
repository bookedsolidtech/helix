---
"@helixui/library": patch
---

Fix Drupal integration findings for hx-alert, hx-button, hx-checkbox, and hx-checkbox-group

- hx-alert: simplify inverted show-icon Twig logic to idiomatic `{% if show_icon %}show-icon{% endif %}`
- hx-button: add hx-button.twig template with full Drupal integration documentation including htmx namespace awareness and anchor mode (rel="noopener noreferrer") guidance
- hx-checkbox: add hx-checkbox.twig template with documentation of hx-size/htmx namespace consideration and Drupal Form API usage patterns
- hx-checkbox-group: add hx-checkbox-group.twig template with full Drupal Form API integration guide including preprocess hook pattern for mapping Drupal options arrays
