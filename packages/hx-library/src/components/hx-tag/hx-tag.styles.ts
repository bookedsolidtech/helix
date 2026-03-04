import { css } from 'lit';

export const helixTagStyles = css`
  :host {
    display: inline-block;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-1, 0.25rem);
    border-radius: var(--hx-tag-border-radius, var(--hx-border-radius-md, 0.375rem));
    border: 1px solid var(--hx-tag-border-color, var(--hx-color-neutral-200, #e5e7eb));
    background-color: var(--hx-tag-bg, var(--hx-color-neutral-100, #f3f4f6));
    color: var(--hx-tag-color, var(--hx-color-neutral-700, #374151));
    font-family: var(--hx-tag-font-family, var(--hx-font-family-sans, sans-serif));
    font-weight: var(--hx-tag-font-weight, var(--hx-font-weight-medium, 500));
    line-height: var(--hx-line-height-tight, 1.25);
    white-space: nowrap;
    cursor: default;
    user-select: none;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease;
    outline: none;
    text-decoration: none;
  }

  /* ─── Size Variants ─── */

  .tag--sm {
    font-size: var(--hx-tag-font-size, var(--hx-font-size-2xs, 0.625rem));
    padding: var(--hx-tag-padding-y, var(--hx-space-0-5, 0.125rem))
      var(--hx-tag-padding-x, var(--hx-space-1-5, 0.375rem));
  }

  .tag--md {
    font-size: var(--hx-tag-font-size, var(--hx-font-size-xs, 0.75rem));
    padding: var(--hx-tag-padding-y, var(--hx-space-1, 0.25rem))
      var(--hx-tag-padding-x, var(--hx-space-2, 0.5rem));
  }

  .tag--lg {
    font-size: var(--hx-tag-font-size, var(--hx-font-size-sm, 0.875rem));
    padding: var(--hx-tag-padding-y, var(--hx-space-1-5, 0.375rem))
      var(--hx-tag-padding-x, var(--hx-space-3, 0.75rem));
  }

  /* ─── Variant: Primary ─── */

  .tag--primary {
    --hx-tag-bg: var(--hx-color-primary-100, #dbeafe);
    --hx-tag-color: var(--hx-color-primary-700, #1d4ed8);
    --hx-tag-border-color: var(--hx-color-primary-200, #bfdbfe);
  }

  /* ─── Variant: Secondary ─── */

  .tag--secondary {
    --hx-tag-bg: var(--hx-color-primary-500, #2563eb);
    --hx-tag-color: var(--hx-color-neutral-0, #ffffff);
    --hx-tag-border-color: var(--hx-color-primary-500, #2563eb);
  }

  /* ─── Variant: Neutral ─── */

  .tag--neutral {
    --hx-tag-bg: var(--hx-color-neutral-100, #f3f4f6);
    --hx-tag-color: var(--hx-color-neutral-700, #374151);
    --hx-tag-border-color: var(--hx-color-neutral-200, #e5e7eb);
  }

  /* ─── Variant: Outline ─── */

  .tag--outline {
    --hx-tag-bg: transparent;
    --hx-tag-color: var(--hx-color-neutral-700, #374151);
    --hx-tag-border-color: var(--hx-color-neutral-300, #d1d5db);
  }

  /* ─── Selected State ─── */

  .tag--selected {
    --hx-tag-bg: var(--hx-color-primary-500, #2563eb);
    --hx-tag-color: var(--hx-color-neutral-0, #ffffff);
    --hx-tag-border-color: var(--hx-color-primary-500, #2563eb);
  }

  /* ─── Disabled State ─── */

  .tag--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* ─── Focus Visible ─── */

  .tag:focus-visible {
    outline: 2px solid var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb));
    outline-offset: 2px;
  }

  /* ─── Prefix Slot Wrapper ─── */

  .tag__prefix {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .tag__prefix[hidden] {
    display: none;
  }

  /* ─── Remove Button ─── */

  .tag__remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0;
    margin: 0;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    line-height: 1;
    opacity: 0.6;
    font-size: 0.875em;
    transition: opacity 0.15s ease;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
  }

  .tag__remove:hover:not(:disabled) {
    opacity: 1;
  }

  .tag__remove:focus-visible {
    outline: 2px solid var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb));
    outline-offset: 1px;
    opacity: 1;
  }

  .tag__remove:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .tag {
      transition: none;
    }

    .tag__remove {
      transition: none;
    }
  }
`;
