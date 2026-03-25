# HX Tr

Semantic table row. Must be a child of `hx-thead`, `hx-tbody`, or `hx-tfoot`.
Contains `hx-th` or `hx-td` cells.

## Usage

```twig
{% include 'helix:hx-tr' with {
  selected: false,
  disabled: false,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| selected | boolean | false | When true, marks the row as selected and applies selected styling. |
| disabled | boolean | false | When true, the row is visually disabled and non-interactive. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for `hx-th` and `hx-td` elements. |

## CSS Parts

| Part | Description |
|------|-------------|
| row | The `<tr>` element. |
