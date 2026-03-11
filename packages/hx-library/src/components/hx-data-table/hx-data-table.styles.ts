import { css } from 'lit';

export const helixDataTableStyles = css`
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
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
    min-width: var(--hx-data-table-min-width, 600px);
  }

  /* ─── Head ─── */

  thead {
    background-color: var(--hx-data-table-header-bg, var(--hx-color-neutral-50, #f8fafc));
  }

  :host([sticky-header]) thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--hx-data-table-header-bg, var(--hx-color-neutral-50, #f8fafc));
  }

  /* ─── Cells ─── */

  th,
  td {
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem);
    text-align: left;
    border-bottom: var(--hx-border-width-thin, 1px) solid
      var(--hx-data-table-border-color, var(--hx-color-neutral-200, #e2e8f0));
    vertical-align: middle;
  }

  th {
    font-weight: var(--hx-font-weight-semibold, 600);
    color: var(--hx-data-table-header-color, var(--hx-color-neutral-700, #334155));
    white-space: nowrap;
  }

  td {
    color: var(--hx-data-table-cell-color, var(--hx-color-neutral-900, #0f172a));
  }

  /* ─── Checkbox Column ─── */

  th.col-checkbox,
  td.col-checkbox {
    width: 40px;
    min-width: 40px;
    padding-right: var(--hx-space-2, 0.5rem);
  }

  th.col-checkbox {
    text-align: center;
  }

  td.col-checkbox {
    text-align: center;
  }

  /* ─── Sort Button ─── */

  .sort-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-1, 0.25rem);
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    font-weight: inherit;
    color: inherit;
    cursor: pointer;
    white-space: nowrap;
  }

  .sort-btn:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-radius: var(--hx-border-radius-sm, 2px);
  }

  /* ─── Sort Icon ─── */

  .sort-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    width: 1em;
    height: 1em;
    opacity: 0.4;
    transition:
      opacity var(--hx-transition-fast, 150ms ease),
      transform var(--hx-transition-fast, 150ms ease);
  }

  .sort-icon--active {
    opacity: 1;
    color: var(--hx-color-primary-500, #2563eb);
  }

  .sort-icon--desc {
    transform: rotate(180deg);
  }

  /* ─── Row States ─── */

  tbody tr {
    transition: background-color var(--hx-transition-fast, 150ms ease);
  }

  tbody tr:hover {
    background-color: var(--hx-data-table-row-hover-bg, var(--hx-color-neutral-50, #f8fafc));
  }

  tbody tr[aria-selected='true'] {
    background-color: var(--hx-data-table-row-selected-bg, var(--hx-color-primary-50, #eff6ff));
  }

  /* ─── Checkbox Input ─── */

  input[type='checkbox'] {
    width: var(--hx-size-4, 1rem);
    height: var(--hx-size-4, 1rem);
    cursor: pointer;
    accent-color: var(--hx-color-primary-500, #2563eb);
  }

  /* ─── Loading Skeleton ─── */

  .skeleton-cell {
    display: block;
    height: 1em;
    border-radius: var(--hx-border-radius-sm, 2px);
    background: linear-gradient(
      90deg,
      var(--hx-color-neutral-200, #e2e8f0) 25%,
      var(--hx-color-neutral-100, #f1f5f9) 50%,
      var(--hx-color-neutral-200, #e2e8f0) 75%
    );
    background-size: 200% 100%;
    animation: hx-shimmer 1.5s infinite;
  }

  @keyframes hx-shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton-cell {
      animation: none;
      opacity: 0.6;
    }
  }

  /* ─── Cell Focus ─── */

  td:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, -2px);
    border-radius: var(--hx-border-radius-sm, 2px);
  }

  /* ─── Empty State ─── */

  .empty-cell {
    text-align: center;
    color: var(--hx-data-table-empty-color, var(--hx-color-neutral-600, #475569));
    padding: var(--hx-space-8, 2rem) var(--hx-space-4, 1rem);
  }
`;
