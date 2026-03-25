# HX Td

Semantic table data cell. Must be a child of `hx-tr`.

## Usage

```twig
{% include 'helix:hx-td' with {
  align: 'left',
  colspan: 0,
  rowspan: 0,
  label: '',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| align | object | left | Horizontal alignment for cell content. |
| colspan | number | 0 | Number of columns this cell spans. |
| rowspan | number | 0 | Number of rows this cell spans. |
| label | string |  | Column header label for this cell. Forwarded as `data-label` on the native `<td>` for
the mobile card layout (`td::before { content: attr(data-label) }`) and as `aria-label`
so screen readers identify the column when the header row is hidden. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for cell content. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-table-cell-color | var(--hx-color-neutral-900, #0f172a) | Cell text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| cell | The `<td>` element. |
