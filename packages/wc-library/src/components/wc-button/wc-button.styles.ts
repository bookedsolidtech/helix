import { css } from 'lit';

export const wcButtonStyles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--wc-opacity-disabled, 0.5);
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--wc-space-2, 0.5rem);
    border: var(--wc-border-width-thin, 1px) solid var(--wc-button-border-color, transparent);
    border-radius: var(--wc-button-border-radius, var(--wc-border-radius-md, 0.375rem));
    background-color: var(--wc-button-bg, var(--wc-color-primary-500, #007878));
    color: var(--wc-button-color, var(--wc-color-neutral-0, #ffffff));
    font-family: var(--wc-button-font-family, var(--wc-font-family-sans, sans-serif));
    font-weight: var(--wc-button-font-weight, var(--wc-font-weight-semibold, 600));
    line-height: var(--wc-line-height-tight, 1.25);
    cursor: pointer;
    transition: background-color var(--wc-transition-fast, 150ms ease),
                color var(--wc-transition-fast, 150ms ease),
                border-color var(--wc-transition-fast, 150ms ease),
                box-shadow var(--wc-transition-fast, 150ms ease);
    text-decoration: none;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
  }

  .button:focus-visible {
    outline: var(--wc-focus-ring-width, 2px) solid var(--wc-button-focus-ring-color, var(--wc-focus-ring-color, #007878));
    outline-offset: var(--wc-focus-ring-offset, 2px);
  }

  .button:hover {
    filter: brightness(var(--wc-filter-brightness-hover, 0.9));
  }

  .button:active {
    filter: brightness(var(--wc-filter-brightness-active, 0.8));
  }

  /* ─── Size Variants ─── */

  .button--sm {
    padding: var(--wc-space-1, 0.25rem) var(--wc-space-3, 0.75rem);
    font-size: var(--wc-font-size-sm, 0.875rem);
    min-height: var(--wc-size-8, 2rem);
  }

  .button--md {
    padding: var(--wc-space-2, 0.5rem) var(--wc-space-4, 1rem);
    font-size: var(--wc-font-size-md, 1rem);
    min-height: var(--wc-size-10, 2.5rem);
  }

  .button--lg {
    padding: var(--wc-space-3, 0.75rem) var(--wc-space-6, 1.5rem);
    font-size: var(--wc-font-size-lg, 1.125rem);
    min-height: var(--wc-size-12, 3rem);
  }

  /* ─── Style Variants ─── */

  .button--primary {
    --wc-button-bg: var(--wc-color-primary-500, #007878);
    --wc-button-color: var(--wc-color-neutral-0, #ffffff);
    --wc-button-border-color: transparent;
  }

  .button--secondary {
    --wc-button-bg: transparent;
    --wc-button-color: var(--wc-color-primary-500, #007878);
    --wc-button-border-color: var(--wc-color-primary-500, #007878);
  }

  .button--secondary:hover {
    --wc-button-bg: var(--wc-color-primary-50, #e6f3f3);
  }

  .button--ghost {
    --wc-button-bg: transparent;
    --wc-button-color: var(--wc-color-primary-500, #007878);
    --wc-button-border-color: transparent;
  }

  .button--ghost:hover {
    --wc-button-bg: var(--wc-color-neutral-100, #e9ecef);
  }

  /* ─── Disabled ─── */

  .button[disabled] {
    cursor: not-allowed;
    opacity: var(--wc-opacity-disabled, 0.5);
  }
`;
