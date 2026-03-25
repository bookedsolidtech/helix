# HX Grid Item

Optional companion element for precise grid item placement.
Applies grid-column and grid-row directly to the host element
so it participates correctly in the parent CSS grid layout.

## Usage

```twig
{% include 'helix:hx-grid-item' with {
  column: '',
  row: '',
  span: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| column | object | - | CSS grid-column value (e.g., "1 / 3", "span 2"). |
| row | object | - | CSS grid-row value (e.g., "1 / 2"). |
| span | object | - | Column span shorthand — equivalent to setting `column: "span N"`. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for item content. |
