import { css } from 'lit';

export const helixTableStyles = css`
  :host {
    display: block;
    overflow-x: auto;
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  /* ─── Scroll Wrapper ─── */

  .table-wrapper {
    min-width: 0;
    width: 100%;
  }

  /* ─── Table ─── */

  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  :host([full-width]) table {
    width: 100%;
  }

  /* ─── Caption ─── */

  caption {
    caption-side: top;
    text-align: left;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    color: var(--hx-table-header-color, var(--hx-color-neutral-700, #334155));
    font-size: var(--hx-font-size-base, 1rem);
  }

  /* ─── Slotted sub-component styling ─── */

  /* Header background via CSS vars that cascade through display:contents */
  ::slotted(hx-thead) {
    --_hx-table-cell-bg: var(--hx-table-header-bg, var(--hx-color-neutral-50, #f8fafc));
  }

  /* Striped variant: target even rows in slotted hx-tbody children */
  :host([variant='striped']) ::slotted(hx-tr) {
    --_hx-table-row-stripe-bg: var(--hx-table-stripe-bg, var(--hx-color-neutral-50, #f8fafc));
  }

  /* Hover variant: set hover bg variable */
  :host([variant='hover']) ::slotted(hx-tr),
  :host([variant='striped']) ::slotted(hx-tr),
  :host([variant='default']) ::slotted(hx-tr) {
    --_hx-table-row-hover-bg: var(--hx-table-row-hover-bg, var(--hx-color-neutral-50, #f8fafc));
  }

  /* Compact variant: reduced padding signal */
  :host([variant='compact']) ::slotted(hx-th),
  :host([variant='compact']) ::slotted(hx-td) {
    --_hx-table-cell-padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
  }

  /* ─── Sticky Header ─── */

  :host([sticky-header]) ::slotted(hx-th) {
    --_hx-table-th-position: sticky;
    --_hx-table-th-top: 0;
    --_hx-table-th-z-index: 1;
    --_hx-table-th-bg: var(--hx-table-header-bg, var(--hx-color-neutral-50, #f8fafc));
  }

  /* ─── Focus ─── */

  ::slotted(:focus-visible) {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, -2px);
  }

  /* ─── Dark Mode ─── */

  @media (prefers-color-scheme: dark) {
    :host {
      --hx-table-border-color: var(--hx-color-neutral-700, #334155);
      --hx-table-header-bg: var(--hx-color-neutral-800, #1e293b);
      --hx-table-header-color: var(--hx-color-neutral-200, #e2e8f0);
      --hx-table-cell-color: var(--hx-color-neutral-100, #f1f5f9);
      --hx-table-row-hover-bg: var(--hx-color-neutral-700, #334155);
      --hx-table-stripe-bg: var(--hx-color-neutral-800, #1e293b);
    }
  }

  /* ─── Responsive Mobile Card Layout ─── */

  @media (max-width: 768px) {
    .table-wrapper {
      overflow-x: visible;
    }
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    ::slotted(*) {
      transition: none !important;
    }
  }
`;

/**
 * Styles shared by sub-components (hx-th, hx-td) for cell layout.
 * Exported so sub-components can import them directly.
 */
export const helixTableCellBaseStyles = css`
  :host {
    display: contents;
  }
`;

export const helixTableRowBaseStyles = css`
  :host {
    display: contents;
  }
`;

export const helixTableSectionBaseStyles = css`
  :host {
    display: contents;
  }
`;
