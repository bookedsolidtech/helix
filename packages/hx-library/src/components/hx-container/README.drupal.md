# hx-container — Drupal Integration Guide

## Overview

`hx-container` is a layout primitive for constraining content width and applying consistent vertical spacing. It carries no semantic meaning and is intentionally transparent to assistive technologies. In Drupal, it is used to wrap page sections, paragraphs, and block content.

## Twig Template

Use the provided `hx-container.twig` template or render the component directly:

```twig
{# Basic usage — wrap a Drupal block region #}
<hx-container width="content" padding="lg">
  {{ content }}
</hx-container>
```

```twig
{# Include via template #}
{% include 'hx-container.twig' with {
  width: 'content',
  padding: 'xl',
  bg_color: 'var(--hx-color-primary-900)',
  content: content,
} %}
```

## Template Variables

| Variable     | Type                                                                          | Default     | Description                                           |
| ------------ | ----------------------------------------------------------------------------- | ----------- | ----------------------------------------------------- |
| `width`      | `'full'` \| `'content'` \| `'narrow'` \| `'sm'` \| `'md'` \| `'lg'` \| `'xl'` | `'content'` | Controls the max-width of the inner content wrapper   |
| `padding`    | `'none'` \| `'sm'` \| `'md'` \| `'lg'` \| `'xl'` \| `'2xl'`                   | `'none'`    | Vertical padding applied to the outer wrapper         |
| `bg_color`   | CSS color string                                                              |             | Background color via `--hx-container-bg` inline style |
| `content`    | markup                                                                        |             | Inner content (required)                              |
| `attributes` | Drupal attributes object                                                      |             | Additional HTML attributes forwarded to the element   |

## Width Presets

| Value     | Default max-width | Override token           |
| --------- | ----------------- | ------------------------ |
| `full`    | No constraint     | —                        |
| `content` | 72rem (1152px)    | `--hx-container-content` |
| `narrow`  | 48rem (768px)     | `--hx-container-narrow`  |
| `sm`      | 640px             | `--hx-container-sm`      |
| `md`      | 768px             | `--hx-container-md`      |
| `lg`      | 1024px            | `--hx-container-lg`      |
| `xl`      | 1280px            | `--hx-container-xl`      |

## Drupal Paragraph Template Example

```twig
{# paragraph--hero-section.html.twig #}
<hx-container
  width="content"
  padding="xl"
  style="--hx-container-bg: var(--hx-color-primary-900);"
>
  {% if content.field_heading %}
    <h2>{{ content.field_heading }}</h2>
  {% endif %}
  {{ content.field_body }}
</hx-container>
```

## Block Region Example

```twig
{# block--system-main-block.html.twig #}
<hx-container width="content" padding="md">
  {{ content }}
</hx-container>
```

## Responsive Padding

The container does not apply responsive padding internally. Drupal themes can override the gutter at any breakpoint via CSS custom properties:

```css
/* In your theme's CSS — override gutter on small screens */
@media (max-width: 640px) {
  hx-container {
    --hx-container-gutter: var(--hx-space-4);
  }
}
```

Or override specific width presets to match your design grid:

```css
hx-container {
  --hx-container-content: 960px;
  --hx-container-narrow: 600px;
}
```

## Asset Loading

```yaml
# mytheme.libraries.yml
hx-container:
  js:
    https://cdn.example.com/@helixui/library/dist/hx-container.js:
      type: external
      attributes:
        type: module
```

Attach in your template:

```twig
{{ attach_library('mytheme/hx-container') }}
```

## Accessibility Notes

`hx-container` is a layout-only component with no ARIA role. Screen readers announce slotted content directly, bypassing the container element itself. Integrators remain responsible for ensuring slotted content meets WCAG 2.1 AA requirements, including landmark semantics, correct heading nesting, color contrast, keyboard focus, and appropriate ARIA attributes.

- Do not use `hx-container` as a landmark region. Wrap it in `<main>`, `<section>`, `<aside>`, etc. as appropriate.
- Ensure slotted content uses correctly nested heading levels for a logical document outline.
