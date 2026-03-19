import { css } from 'lit';

export const helixStatStyles = css`
  :host {
    display: block;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: var(--hx-stat-gap, var(--hx-space-1, 0.25rem));
    font-family: var(--hx-stat-font-family, var(--hx-font-family-sans, sans-serif));
    color: var(--hx-stat-color, var(--hx-color-neutral-800, #212529));
  }

  /* ─── Size Variants ─── */

  .stat--sm .stat__value {
    font-size: var(--hx-stat-value-font-size-sm, var(--hx-font-size-xl, 1.25rem));
    line-height: var(--hx-line-height-tight, 1.25);
    font-weight: var(--hx-stat-value-font-weight, var(--hx-font-weight-bold, 700));
  }

  .stat--sm .stat__label {
    font-size: var(--hx-stat-label-font-size-sm, var(--hx-font-size-xs, 0.75rem));
  }

  .stat--md .stat__value {
    font-size: var(--hx-stat-value-font-size-md, var(--hx-font-size-3xl, 1.875rem));
    line-height: var(--hx-line-height-tight, 1.25);
    font-weight: var(--hx-stat-value-font-weight, var(--hx-font-weight-bold, 700));
  }

  .stat--md .stat__label {
    font-size: var(--hx-stat-label-font-size-md, var(--hx-font-size-sm, 0.875rem));
  }

  .stat--lg .stat__value {
    font-size: var(--hx-stat-value-font-size-lg, var(--hx-font-size-5xl, 3rem));
    line-height: var(--hx-line-height-tight, 1.25);
    font-weight: var(--hx-stat-value-font-weight, var(--hx-font-weight-bold, 700));
  }

  .stat--lg .stat__label {
    font-size: var(--hx-stat-label-font-size-lg, var(--hx-font-size-md, 1rem));
  }

  /* ─── Value ─── */

  .stat__header {
    display: flex;
    align-items: center;
    gap: var(--hx-stat-header-gap, var(--hx-space-2, 0.5rem));
  }

  .stat__value {
    color: var(--hx-stat-value-color, var(--hx-color-neutral-900, #111827));
  }

  /* ─── Label ─── */

  .stat__label {
    color: var(--hx-stat-label-color, var(--hx-color-neutral-500, #6c757d));
    font-weight: var(--hx-font-weight-normal, 400);
  }

  /* ─── Icon Slot ─── */

  .stat__icon {
    display: flex;
    align-items: center;
    color: var(--hx-stat-icon-color, var(--hx-color-primary-500, #2563eb));
    flex-shrink: 0;
  }

  /* ─── Trend Indicator ─── */

  .stat__trend {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    padding: var(--hx-space-0-5, 0.125rem) var(--hx-space-1-5, 0.375rem);
  }

  .stat__trend--up {
    color: var(--hx-stat-trend-up-color, var(--hx-color-success-700, #15803d));
    background-color: var(--hx-stat-trend-up-bg, var(--hx-color-success-50, #f0fdf4));
  }

  .stat__trend--down {
    color: var(--hx-stat-trend-down-color, var(--hx-color-error-700, #b91c1c));
    background-color: var(--hx-stat-trend-down-bg, var(--hx-color-error-50, #fef2f2));
  }

  .stat__trend-arrow {
    width: 0.75em;
    height: 0.75em;
    flex-shrink: 0;
  }

  /* ─── Hidden empty slot wrappers ─── */

  [hidden] {
    display: none !important;
  }
`;
