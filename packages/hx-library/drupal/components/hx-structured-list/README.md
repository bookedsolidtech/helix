# HX Structured List

Container for structured key-value data display. Renders as a description
list for accessible term/definition semantics. Use `hx-structured-list-row`
as direct children.

## Usage

```twig
{% include 'helix:hx-structured-list' with {
  bordered: false,
  condensed: false,
  striped: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| bordered | boolean | false | Renders a border around the entire list. |
| condensed | boolean | false | Reduces row padding for denser layouts. |
| striped | boolean | false | Alternates row background colors for easier scanning. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | One or more `hx-structured-list-row` elements. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-structured-list-border-color | var(--hx-color-neutral-200) | Border color when bordered. |
| --hx-structured-list-border-width | var(--hx-border-width-thin) | Border width when bordered. |
| --hx-structured-list-stripe-bg | var(--hx-color-neutral-50) | Stripe background color. |
| --hx-structured-list-padding-block | var(--hx-space-4) | Row block padding. |
| --hx-structured-list-padding-inline | var(--hx-space-4) | Row inline padding. |
| --hx-structured-list-condensed-padding-block | var(--hx-space-2) | Row block padding (condensed). |
| --hx-structured-list-condensed-padding-inline | var(--hx-space-3) | Row inline padding (condensed). |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The root list element. |
