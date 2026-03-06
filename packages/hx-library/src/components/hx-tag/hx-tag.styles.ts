import { css } from 'lit';

export const helixTagStyles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-1, 0.25rem);
    border-radius: var(--hx-tag-border-radius, var(--hx-border-radius-sm, 0.25rem));
    background-color: var(--hx-tag-bg, var(--hx-color-neutral-100, #f3f4f6));
    color: var(--hx-tag-color, var(--hx-color-neutral-700, #374151));
    font-family: var(--hx-tag-font-family, var(--hx-font-family-sans, sans-serif));
    font-weight: var(--hx-tag-font-weight, var(--hx-font-weight-medium, 500));
    line-height: var(--hx-line-height-tight, 1.25);
    white-space: nowrap;
    vertical-align: middle;
    border: 1px solid var(--hx-tag-border-color, var(--hx-color-neutral-200, #e5e7eb));
  }

  /* ─── Size Variants ─── */

  .tag--sm {
    font-size: var(--hx-tag-font-size, var(--hx-font-size-xs, 0.75rem));
    padding: var(--hx-tag-padding-y, var(--hx-space-0-5, 0.125rem))
      var(--hx-tag-padding-x, var(--hx-space-1-5, 0.375rem));
  }

  .tag--md {
    font-size: var(--hx-tag-font-size, var(--hx-font-size-sm, 0.875rem));
    padding: var(--hx-tag-padding-y, var(--hx-space-1, 0.25rem))
      var(--hx-tag-padding-x, var(--hx-space-2, 0.5rem));
  }

  .tag--lg {
    font-size: var(--hx-tag-font-size, var(--hx-font-size-base, 1rem));
    padding: var(--hx-tag-padding-y, var(--hx-space-1-5, 0.375rem))
      var(--hx-tag-padding-x, var(--hx-space-3, 0.75rem));
  }

  /* ─── Color Variants ─── */

  .tag--default {
    --hx-tag-bg: var(--hx-color-neutral-100, #f3f4f6);
    --hx-tag-color: var(--hx-color-neutral-700, #374151);
    --hx-tag-border-color: var(--hx-color-neutral-200, #e5e7eb);
  }

  .tag--primary {
    --hx-tag-bg: var(--hx-color-primary-50, #eff6ff);
    --hx-tag-color: var(--hx-color-primary-700, #1d4ed8);
    --hx-tag-border-color: var(--hx-color-primary-200, #bfdbfe);
  }

  .tag--success {
    --hx-tag-bg: var(--hx-color-success-50, #f0fdf4);
    --hx-tag-color: var(--hx-color-success-700, #15803d);
    --hx-tag-border-color: var(--hx-color-success-200, #bbf7d0);
  }

  .tag--warning {
    --hx-tag-bg: var(--hx-color-warning-50, #fffbeb);
    --hx-tag-color: var(--hx-color-warning-700, #b45309);
    --hx-tag-border-color: var(--hx-color-warning-200, #fde68a);
  }

  .tag--danger {
    --hx-tag-bg: var(--hx-color-error-50, #fef2f2);
    --hx-tag-color: var(--hx-color-error-700, #b91c1c);
    --hx-tag-border-color: var(--hx-color-error-200, #fecaca);
  }

  /* ─── Pill Mode ─── */

  .tag--pill {
    border-radius: var(--hx-tag-border-radius, var(--hx-border-radius-full, 9999px));
  }

  /* ─── Prefix / Suffix slots ─── */

  .tag__prefix,
  .tag__suffix {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* ─── Remove Button ─── */

  .tag__remove-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 0;
    margin-inline-start: var(--hx-space-1, 0.25rem);
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    border-radius: var(--hx-border-radius-sm, 0.125rem);
    line-height: 0;
  }

  .tag__remove-button:hover {
    opacity: 1;
  }

  .tag__remove-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, currentColor);
    outline-offset: var(--hx-focus-ring-offset, 1px);
  }
`;
