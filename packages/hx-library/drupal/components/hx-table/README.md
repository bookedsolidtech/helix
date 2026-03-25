# HX Table

A semantic table container with variant styling and accessibility support.
Compose with `hx-thead`, `hx-tbody`, `hx-tfoot`, `hx-tr`, `hx-th`, and `hx-td`.

## Usage

```twig
{% include 'helix:hx-table' with {
  label: '',
  caption: '',
  variant: 'default',
  stickyHeader: false,
  fullWidth: true,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string |  | Accessible name for the table (WCAG 4.1.2 requirement).
Exposed via `aria-label` on the `<table>` element. |
| caption | string |  | Visible caption text. When set, renders a `<caption>` element.
Use the `caption` slot for richer caption content. |
| variant | object | default | Visual variant that controls row styling. |
| stickyHeader | boolean | false | When true, the header row stays fixed while the table body scrolls. |
| fullWidth | boolean | true | When true, the table expands to fill 100% of its container width. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default slot for `hx-thead`, `hx-tbody`, and `hx-tfoot` sub-components. |
| caption | Custom caption content rendered inside the `<caption>` element. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-table-border-color | var(--hx-color-neutral-200, #e2e8f0) | Cell border color. |
| --hx-table-header-bg | var(--hx-color-neutral-50, #f8fafc) | Header row background. |
| --hx-table-header-color | var(--hx-color-neutral-700, #334155) | Header text color. |
| --hx-table-cell-color | var(--hx-color-neutral-900, #0f172a) | Cell text color. |
| --hx-table-row-hover-bg | var(--hx-color-neutral-50, #f8fafc) | Row hover background. |
| --hx-table-stripe-bg | var(--hx-color-neutral-50, #f8fafc) | Striped row background. |

## CSS Parts

| Part | Description |
|------|-------------|
| table | The `<table>` element. |
| caption | The `<caption>` element. |
