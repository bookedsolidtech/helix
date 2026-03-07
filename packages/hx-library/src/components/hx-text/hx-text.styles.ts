import { css } from 'lit';

export const helixTextStyles = css`
  :host {
    display: inline;
  }

  /* ─── Base ─── */

  .text {
    display: inline;
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-text-font-size);
    font-weight: var(--hx-text-font-weight);
    line-height: var(--hx-text-line-height);
    letter-spacing: var(--hx-text-letter-spacing);
    color: var(--hx-text-color);
    margin: 0;
    padding: 0;
  }

  /* ─── Variants ─── */

  .text--body {
    --hx-text-font-size: var(--hx-font-size-md, 1rem);
    --hx-text-font-weight: var(--hx-font-weight-regular, 400);
    --hx-text-line-height: var(--hx-line-height-normal, 1.5);
    --hx-text-letter-spacing: var(--hx-letter-spacing-normal, 0);
  }

  .text--body-sm {
    --hx-text-font-size: var(--hx-font-size-sm, 0.875rem);
    --hx-text-font-weight: var(--hx-font-weight-regular, 400);
    --hx-text-line-height: var(--hx-line-height-normal, 1.5);
    --hx-text-letter-spacing: var(--hx-letter-spacing-normal, 0);
  }

  .text--body-lg {
    --hx-text-font-size: var(--hx-font-size-lg, 1.125rem);
    --hx-text-font-weight: var(--hx-font-weight-regular, 400);
    --hx-text-line-height: var(--hx-line-height-normal, 1.5);
    --hx-text-letter-spacing: var(--hx-letter-spacing-normal, 0);
  }

  .text--label {
    --hx-text-font-size: var(--hx-font-size-md, 1rem);
    --hx-text-font-weight: var(--hx-font-weight-medium, 500);
    --hx-text-line-height: var(--hx-line-height-tight, 1.25);
    --hx-text-letter-spacing: var(--hx-letter-spacing-normal, 0);
  }

  .text--label-sm {
    --hx-text-font-size: var(--hx-font-size-sm, 0.875rem);
    --hx-text-font-weight: var(--hx-font-weight-medium, 500);
    --hx-text-line-height: var(--hx-line-height-tight, 1.25);
    --hx-text-letter-spacing: var(--hx-letter-spacing-normal, 0);
  }

  .text--caption {
    --hx-text-font-size: var(--hx-font-size-xs, 0.75rem);
    --hx-text-font-weight: var(--hx-font-weight-regular, 400);
    --hx-text-line-height: var(--hx-line-height-normal, 1.5);
    --hx-text-letter-spacing: var(--hx-letter-spacing-normal, 0);
  }

  .text--code {
    --hx-text-font-size: var(--hx-font-size-sm, 0.875rem);
    --hx-text-font-weight: var(--hx-font-weight-regular, 400);
    --hx-text-line-height: var(--hx-line-height-normal, 1.5);
    --hx-text-letter-spacing: var(--hx-letter-spacing-normal, 0);
    font-family: var(--hx-font-family-mono, monospace);
  }

  .text--overline {
    --hx-text-font-size: var(--hx-font-size-xs, 0.75rem);
    --hx-text-font-weight: var(--hx-font-weight-semibold, 600);
    --hx-text-line-height: var(--hx-line-height-tight, 1.25);
    --hx-text-letter-spacing: var(--hx-letter-spacing-wide, 0.05em);
    text-transform: uppercase;
  }

  /* ─── Colors ─── */

  .text--color-default {
    --hx-text-color: var(--hx-color-neutral-900, #0f172a);
  }

  .text--color-subtle {
    --hx-text-color: var(--hx-color-neutral-500, #64748b);
  }

  .text--color-disabled {
    --hx-text-color: var(--hx-color-neutral-400, #94a3b8);
  }

  .text--color-inverse {
    --hx-text-color: var(--hx-color-neutral-0, #ffffff);
  }

  .text--color-danger {
    --hx-text-color: var(--hx-color-error-600, #dc2626);
  }

  .text--color-success {
    --hx-text-color: var(--hx-color-success-600, #16a34a);
  }

  .text--color-warning {
    --hx-text-color: var(--hx-color-warning-600, #d97706);
  }

  /* ─── Weight Overrides ─── */

  .text--weight-regular {
    --hx-text-font-weight: var(--hx-font-weight-regular, 400);
  }

  .text--weight-medium {
    --hx-text-font-weight: var(--hx-font-weight-medium, 500);
  }

  .text--weight-semibold {
    --hx-text-font-weight: var(--hx-font-weight-semibold, 600);
  }

  .text--weight-bold {
    --hx-text-font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Truncation ─── */

  .text--truncate {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .text--clamp {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  :host([truncate]) {
    display: block;
  }

  :host([lines]) {
    display: block;
  }
`;
