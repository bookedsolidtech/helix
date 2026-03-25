# HX Data Table

An enterprise data table with sorting, row selection, and keyboard navigation.

## Usage

```twig
{% include 'helix:hx-data-table' with {
  columns: '[]',
  rows: '[]',
  selectable: false,
  sortKey: '',
  sortDirection: 'asc',
  loading: false,
  emptyLabel: 'No data',
  label: '',
  stickyHeader: false,
  labelSelectAll: 'Select all rows',
  page: 1,
  pageSize: 0,
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columns | object | [] | Column definitions. Each item: `{ key, label, sortable?, width? }`.
Can be set as a JS array or a JSON string (e.g., from a Drupal Twig attribute). |
| rows | object | [] | Row data. Each item is a plain object keyed by column `key` values.
Can be set as a JS array or a JSON string (e.g., from a Drupal Twig attribute). |
| selectable | boolean | false | When true, renders a checkbox column for row selection. |
| sortKey | string |  | The column key currently used for sorting. |
| sortDirection | object | asc | Current sort direction. |
| loading | boolean | false | When true, renders a loading skeleton and sets `aria-busy="true"` on the host. |
| emptyLabel | string | No data | Text displayed in the default empty state when `rows` is empty and not loading. |
| label | string |  | Accessible name for the table. Exposed via `aria-label` on the `<table>` element.
Required when the table has columns — a missing label is a WCAG 4.1.2 violation. |
| stickyHeader | boolean | false | When true, the header row is sticky (position: sticky; top: 0). |
| labelSelectAll | string | Select all rows | Accessible label for the "select all rows" checkbox. |
| page | number | 1 | Current page (1-based). Set to 0 or leave at default (0) to disable pagination. |
| pageSize | number | 0 | Number of rows per page. Set to 0 to disable pagination (show all rows). |

## Slots

| Slot | Description |
|------|-------------|
| toolbar | Content rendered above the table (e.g., search, actions). |
| empty | Custom empty-state content rendered when `rows` is empty and not loading. |
| loading | Custom loading content rendered when `loading` is true. |

## Events

| Event | Description |
|-------|-------------|
| hx-sort | Dispatched when a sortable column header is clicked. |
| hx-row-click | Dispatched when a data row is clicked. |
| hx-select | Dispatched when row selection changes. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-data-table-header-bg | var(--hx-color-neutral-50) | Header background color. |
| --hx-data-table-header-color | var(--hx-color-neutral-700) | Header text color. |
| --hx-data-table-cell-color | var(--hx-color-neutral-900) | Cell text color. |
| --hx-data-table-border-color | var(--hx-color-neutral-200) | Row border color. |
| --hx-data-table-row-hover-bg | var(--hx-color-neutral-50) | Row hover background. |
| --hx-data-table-row-selected-bg | var(--hx-color-primary-50) | Selected row background. |
| --hx-data-table-empty-color | var(--hx-color-neutral-600) | Empty state text color. |
| --hx-data-table-min-width | 600px | Minimum table width before horizontal scrolling. |

## CSS Parts

| Part | Description |
|------|-------------|
| table | The `<table>` element. |
| thead | The `<thead>` element. |
| tbody | The `<tbody>` element. |
| tr | Each `<tr>` element. |
| th | Each `<th>` element. |
| td | Each `<td>` element. |
| sort-icon | The sort indicator icon `<span>` inside sortable headers. |
| checkbox | Each `<input type="checkbox">` element. |
