---
title: XSS Prevention
description: XSS prevention for HELiX components in Drupal — sanitizing slot content with |escape and safe_join, attribute sanitization, twig_escape_filter, secure patterns for user-generated content, CSP for external CDN, and avoiding |raw in component attributes.
sidebar:
  order: 12
---

HELiX web components introduce two surfaces that require XSS attention in Drupal: **slot content** (HTML projected into the component's light DOM) and **component attributes** (string values passed to Shadow DOM properties). Drupal's Twig auto-escaping handles most cases correctly, but several patterns can bypass it.

---

## How Drupal's Twig Auto-Escaping Works

Drupal configures Twig with auto-escaping enabled. Any variable printed with `{{ variable }}` is run through `twig_escape_filter`, which converts `<`, `>`, `"`, `'`, and `&` to their HTML entities.

```twig
{# User input ""><script>alert(1)</script>" becomes: #}
{{ user_name }}
{# Output: "&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;" — safe #}
```

This is the default. The risk surfaces are:

1. Using `|raw` to bypass escaping
2. Passing render arrays through `|render` without subsequent escaping
3. Setting HTML attributes from user input without escaping

---

## Slot Content: Safe and Unsafe Patterns

### Safe: auto-escaped text in slots

```twig
{# Safe — Twig auto-escaping converts HTML entities #}
<hx-card>
  <span slot="heading">{{ node.label }}</span>
</hx-card>
```

### Unsafe: `|raw` on user-generated content

```twig
{# DANGEROUS — bypasses all escaping #}
<hx-card>
  {{ user_submitted_bio|raw }}
</hx-card>
```

If `user_submitted_bio` contains `<script>alert(document.cookie)</script>`, that script executes in the page context with full access to Drupal session cookies.

### Safe: `|raw` only on Drupal-rendered content

The `|raw` filter is safe when the value has already passed through Drupal's rendering pipeline, which applies `twig_escape_filter` or the configured text format's HTML filters:

```twig
{# Safe — content.field_body is rendered by Drupal's render pipeline,
   which applies the body field's text format (e.g., filtered_html). #}
<hx-card>
  <div slot="body">
    {{ content.field_body|render|raw }}
  </div>
</hx-card>
```

**Rule:** `|raw` is acceptable only on values that originate from `content.*` render arrays, not on raw field values (`node.field_bio.value`), user-submitted form data, or URL parameters.

### Safe: escaping user-generated rich text

For user-submitted content that must render as HTML (formatted text), pipe through the `check_markup` function or use a text format with appropriate filters:

```twig
{# Applies the 'basic_html' text format — strips disallowed tags #}
<hx-card>
  <div slot="body">
    {{ node.field_bio.value|check_markup('basic_html') }}
  </div>
</hx-card>
```

### Safe: `|escape` + `|safe_join` for lists

When building slot content from an array of user values:

```twig
{# Escape each item, then join — |safe_join is safe because items are already escaped #}
<hx-card>
  <ul slot="tags">
    {% for tag in node.field_tags %}
      <li>{{ tag.entity.label|escape }}</li>
    {% endfor %}
  </ul>
</hx-card>
```

Or using `|map` and `|safe_join`:

```twig
{% set tag_labels = node.field_tags|map(t => t.entity.label|escape) %}
<hx-badge>{{ tag_labels|safe_join(', ') }}</hx-badge>
```

---

## Attribute Sanitization

Component attributes are reflected as JavaScript properties. An unescaped attribute value can break out of the attribute context and inject HTML.

### Always escape attribute values

```twig
{# Unsafe — user input can break out of attribute #}
<hx-card variant="{{ user_input }}">

{# Safe — Twig auto-escaping handles this by default #}
<hx-card variant="{{ variant }}">
```

Twig auto-escaping handles `{{ variable }}` inside attribute contexts correctly. The risk is using `|raw` or `attribute()` without proper sanitization:

```twig
{# Unsafe — raw attribute object from untrusted source #}
<hx-button {{ user_attributes|raw }}>

{# Safe — only pass known, trusted keys #}
<hx-button
  variant="{{ variant|escape }}"
  href="{{ url|escape }}"
>
```

### Sanitizing URLs

URLs can carry `javascript:` protocol payloads:

```twig
{# Unsafe — user can set url to "javascript:alert(1)" #}
<hx-button href="{{ user_provided_url }}">

{# Safe — check scheme before rendering #}
{% if user_provided_url matches '/^https?:\\/\\//i' %}
  <hx-button href="{{ user_provided_url|escape }}">Click</hx-button>
{% endif %}
```

In PHP preprocess:

```php
function mytheme_preprocess_node(array &$variables): void {
  $url = $variables['node']->field_external_link->uri;
  // UrlHelper::isValid() rejects javascript: and data: URIs
  $variables['safe_url'] = \Drupal\Component\Utility\UrlHelper::isValid($url, TRUE)
    ? $url
    : '';
}
```

### Boolean attributes

Boolean attributes (`required`, `disabled`, `checked`) should be set conditionally, not from user input:

```twig
{# Unsafe — user can set required to any string #}
<hx-text-input required="{{ user_required }}">

{# Safe — evaluate boolean from trusted source #}
<hx-text-input{% if element['#required'] %} required{% endif %}>
```

---

## Drupal's twig_escape_filter

Drupal overrides Twig's default escape strategy with `twig_escape_filter`, which is context-aware. For HTML body context (the default), it applies `Html::escape()`. This converts the five special HTML characters to entities and is safe for all attribute values and text content.

You can call it explicitly via the `|escape` filter or its alias `|e`:

```twig
{{ node.label|escape }}
{{ node.label|e }}
{{ node.label }}  {# equivalent — auto-escaping applies the same filter #}
```

---

## Preventing XSS in Component Properties vs. Slots

HELiX components handle their own internal rendering inside Shadow DOM. The security boundary is the light DOM — slot content and attribute values that come from your Twig templates.

| Surface | Risk | Defense |
|---|---|---|
| Slot text content | Script injection | Twig auto-escaping (default) |
| Slot HTML content | Tag injection | `check_markup()` or `\|escape` per-item |
| Attribute string values | Attribute breakout | Twig auto-escaping (default) |
| Attribute URL values | `javascript:` injection | `UrlHelper::isValid()` + `\|escape` |
| Attribute boolean values | Incorrect state | Use `{% if %}` conditionals, not user input |

---

## Content Security Policy for CDN

When loading HELiX components from jsDelivr, your CSP `script-src` must include the CDN origin:

```text
Content-Security-Policy: script-src 'self' https://cdn.jsdelivr.net;
```

Configure in Drupal:

```php
// settings.php
$config['security_kit.settings']['seckit_xss']['csp']['script-src'] = [
  "'self'",
  'https://cdn.jsdelivr.net',
];

// If loading tokens CSS from CDN:
$config['security_kit.settings']['seckit_xss']['csp']['style-src'] = [
  "'self'",
  'https://cdn.jsdelivr.net',
];
```

### Subresource Integrity (SRI)

Add `integrity` attributes to CDN-loaded resources to verify file authenticity:

```yaml
# mytheme.libraries.yml
helix-button:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/components/hx-button/index.js:
      type: external
      preprocess: false
      attributes:
        type: module
        crossorigin: anonymous
        integrity: sha384-HASH_FROM_JSDELIVR_SRIHASH_TOOL
```

Get the hash from [https://www.srihash.org](https://www.srihash.org) or jsDelivr's SRI tool.

---

## Patterns to Avoid

### Never pass raw user input directly to slot attributes

```twig
{# DANGEROUS: user controls the label attribute #}
<hx-text-input label="{{ request.query.label }}">

{# Safe: label comes from server-controlled content #}
<hx-text-input label="{{ element['#title']|escape }}">
```

### Never use |raw for field values without text format filtering

```twig
{# DANGEROUS: field.value is the raw stored string, no format applied #}
<hx-card>{{ node.field_description.value|raw }}</hx-card>

{# Safe: use the rendered content array (text format applied) #}
<hx-card>{{ content.field_description }}</hx-card>
```

### Never trust user-provided attribute arrays

```twig
{# DANGEROUS: arbitrary attributes from user input #}
<hx-button {{ form_element['#attributes']|raw }}>

{# Safe: build attributes explicitly from known-trusted values #}
<hx-button
  variant="{{ variant }}"
  {% if disabled %}disabled{% endif %}
>
```

---

## Related

- [Theming](/drupal/theming/) — CSS custom properties (no XSS risk — custom properties are CSS context)
- [Twig Templates: Properties](/drupal/twig-templates/properties/) — Attribute output patterns
- [Troubleshooting](/drupal/troubleshooting/) — Debugging unexpected component behavior
