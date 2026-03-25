# HX Text

A semantic typography wrapper that applies consistent text styles using design tokens.

## Usage

```twig
{% include 'helix:hx-text' with {
  variant: 'body',
  weight: 'undefined',
  color: 'default',
  truncate: false,
  lines: 0,
  as: 'span',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | object | body | Typography variant controlling font size, line height, and letter spacing.

Note: The public variant set (body / body-sm / body-lg / label / label-sm / caption / code /
overline) intentionally extends the original audit spec (body / lead / small / caption /
overline). `lead` and `small` were replaced with the more granular `body-lg`, `body-sm`,
`label`, `label-sm`, and `code` variants to better serve healthcare UI density requirements.
There are no `lead` or `small` variants — consumers must use `body-lg` and `body-sm`
respectively. |
| weight | object | undefined | Font weight override. When unset, the variant's default weight is used. |
| color | object | default | Semantic color intent. |
| truncate | boolean | false | When true, clips text to a single line with an ellipsis overflow. |
| lines | number | 0 | Maximum number of lines to display before clamping with ellipsis.
When set, overrides `truncate`. Set to 0 to disable. |
| as | object | span | The HTML element to render as the inner base element.
Use to produce semantically appropriate markup (e.g., `p`, `strong`, `em`).
Defaults to `span` for inline usage.

In Drupal Twig: `<hx-text as="p" variant="body">...</hx-text>` |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for text content. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-text-font-size | - | Font size (set per variant). |
| --hx-text-font-weight | - | Font weight (overridden by weight prop). |
| --hx-text-line-height | - | Line height (set per variant). |
| --hx-text-letter-spacing | - | Letter spacing (set per variant). |
| --hx-text-color | - | Text color (set per color prop). |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The inner element (tag determined by the `as` property). |
