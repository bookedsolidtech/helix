# HX Th

Semantic table header cell. Must be a child of `hx-tr`.
Supports sortable columns with accessible sort state.

## Usage

```twig
{% include 'helix:hx-th' with {
  sortable: false,
  sortDirection: 'none',
  scope: 'col',
  colspan: 0,
  rowspan: 0,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| sortable | boolean | false | When true, the header renders a sort button and emits `hx-sort` on activation. |
| sortDirection | object | none | Current sort direction. Reflected for CSS targeting. |
| scope | object | col | The `scope` attribute for the underlying `<th>` element. |
| colspan | number | 0 | Number of columns this header spans. |
| rowspan | number | 0 | Number of rows this header spans. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for header label content. |

## Events

| Event | Description |
|-------|-------------|
| hx-sort | Dispatched when a sortable header is activated. |

## CSS Parts

| Part | Description |
|------|-------------|
| header | The `<th>` element. |
| sort-icon | The sort indicator icon `<span>` inside sortable headers. |
