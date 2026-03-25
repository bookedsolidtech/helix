# HX Prose

A Light DOM prose container that applies typographic styles to rich text
content such as CKEditor output, Markdown-rendered HTML, or any structured
body copy.

Renders in the Light DOM (no Shadow DOM) so that global and scoped styles
can target child elements directly. Uses the AdoptedStylesheetsController
to inject scoped prose CSS into the document without duplication.

## Usage

```twig
{% include 'helix:hx-prose' with {
  size: 'base',
  maxWidth: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | object | base | Typography scale for the prose content. |
| maxWidth | string |  | Maximum content width. When set, overrides the --hx-prose-max-width token.
Accepts any valid CSS width value (e.g., '640px', '80ch', '100%'). |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for rich text content (headings, paragraphs, lists, tables, etc.). |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-prose-max-width | 720px | Maximum content width. |
| --hx-prose-font-size | var(--hx-font-size-base) | Base font size. |
| --hx-prose-line-height | var(--hx-line-height-relaxed) | Base line height. |
| --hx-prose-color | var(--hx-color-text) | Body text color. |
| --hx-prose-heading-color | var(--hx-color-text-strong) | Heading color. |
| --hx-prose-link-color | var(--hx-color-primary) | Link color. |
