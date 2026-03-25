# HX Pagination

A pagination component for navigating content listings.

## Usage

```twig
{% include 'helix:hx-pagination' with {
  totalPages: 1,
  currentPage: 1,
  siblingCount: 1,
  boundaryCount: 1,
  showFirstLast: false,
  label: 'Pagination',
  pageSize: 25,
  showPageSize: false,
  labelRowsPerPage: 'Rows per page:',
  labelFirstPage: 'First page',
  labelPrevPage: 'Previous page',
  labelNextPage: 'Next page',
  labelLastPage: 'Last page',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| totalPages | number | 1 | Total number of pages. |
| currentPage | number | 1 | The currently active page (1-based). |
| siblingCount | number | 1 | Number of page buttons shown on each side of the current page. |
| boundaryCount | number | 1 | Number of pages always shown at the start and end of the list. |
| showFirstLast | boolean | false | Whether to show First and Last page buttons. |
| label | string | Pagination | Accessible label for the `<nav>` element. |
| pageSize | number | 25 | The number of items displayed per page. When set, a page-size selector
`<select>` is rendered. Set `show-page-size` to display the selector. |
| showPageSize | boolean | false | Whether to show the page-size selector UI. |
| labelRowsPerPage | string | Rows per page: | Label text for the rows-per-page selector. |
| labelFirstPage | string | First page | Accessible label for the first-page button. |
| labelPrevPage | string | Previous page | Accessible label for the previous-page button. |
| labelNextPage | string | Next page | Accessible label for the next-page button. |
| labelLastPage | string | Last page | Accessible label for the last-page button. |

## Events

| Event | Description |
|-------|-------------|
| hx-page-change | Fired when the user navigates to a new page. |
| hx-page-size-change | Fired when the user selects a new page size. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-pagination-gap | 0.25rem | Gap between pagination buttons. Inherits from --hx-spacing-1. |
| --hx-pagination-button-size | 2.25rem | Minimum width and height of each button. |
| --hx-pagination-border-color | - | Border color of buttons. Inherits from --hx-color-border (final fallback: #d1d5db). |
| --hx-pagination-border-radius | - | Border radius of buttons. Inherits from --hx-border-radius-md (final fallback: 0.375rem). |
| --hx-pagination-bg | - | Background color of buttons. Inherits from --hx-color-surface (final fallback: #ffffff). |
| --hx-pagination-color | - | Text color of buttons. Inherits from --hx-color-text-primary (final fallback: #111827). |
| --hx-pagination-hover-bg | - | Background color of buttons on hover. Inherits from --hx-color-surface-hover (final fallback: #f3f4f6). |
| --hx-pagination-hover-border-color | - | Border color of buttons on hover. Inherits from --hx-color-primary (final fallback: #2563eb). |
| --hx-pagination-active-bg | - | Background color of the active/current page button. Inherits from --hx-color-primary (final fallback: #2563eb). |
| --hx-pagination-active-color | - | Text color of the active/current page button. Inherits from --hx-color-surface (final fallback: #ffffff). |
| --hx-pagination-active-border-color | - | Border color of the active/current page button. Defaults to --hx-pagination-active-bg. |
| --hx-pagination-ellipsis-color | - | Color of ellipsis characters. Inherits from --hx-color-text-secondary (final fallback: #6b7280). |
| --hx-transition-fast | 150ms | Duration used for hover/focus transitions. |

## CSS Parts

| Part | Description |
|------|-------------|
| nav | The wrapping `<nav>` element. |
| list | The `<ul>` containing pagination items. |
| item | Each `<li>` item. |
| button | Each page button or prev/next control. |
| ellipsis | The ellipsis (`…`) span between page groups. |
| page-size-wrapper | The wrapper `<div>` around the page-size selector. |
| page-size-label | The `<label>` element for the page-size selector. |
| page-size-select | The `<select>` element for page-size. |
