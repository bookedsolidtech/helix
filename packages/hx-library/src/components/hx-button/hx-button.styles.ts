import { css } from 'lit';

export const helixButtonStyles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  /* ─── Base Button ─── */

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-2, 0.5rem);
    border: var(--hx-border-width-thin, 1px) solid var(--hx-button-border-color, transparent);
    border-radius: var(--hx-button-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));
    color: var(--hx-button-color, var(--hx-color-neutral-0, #ffffff));
    font-family: var(--hx-button-font-family, var(--hx-font-family-sans, sans-serif));
    font-weight: var(--hx-button-font-weight, var(--hx-font-weight-semibold, 600));
    line-height: var(--hx-line-height-tight, 1.25);
    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    text-decoration: none;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
  }

  .button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-button-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .button:hover {
    filter: brightness(var(--hx-filter-brightness-hover, 0.9));
  }

  .button:active {
    filter: brightness(var(--hx-filter-brightness-active, 0.8));
  }

  /* ─── Size Variants ─── */

  .button--sm {
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-3, 0.75rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    min-height: var(--hx-size-8, 2rem);
  }

  .button--md {
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem);
    font-size: var(--hx-font-size-md, 1rem);
    min-height: var(--hx-size-10, 2.5rem);
  }

  .button--lg {
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-6, 1.5rem);
    font-size: var(--hx-font-size-lg, 1.125rem);
    min-height: var(--hx-size-12, 3rem);
  }

  /* ─── Style Variants ─── */

  .button--primary {
    --hx-button-bg: var(--hx-color-primary-500, #2563eb);
    --hx-button-color: var(--hx-color-neutral-0, #ffffff);
    --hx-button-border-color: transparent;
  }

  .button--secondary {
    --hx-button-bg: transparent;
    --hx-button-color: var(--hx-color-primary-500, #2563eb);
    --hx-button-border-color: var(--hx-color-primary-500, #2563eb);
  }

  .button--secondary:hover {
    --hx-button-bg: var(--hx-color-primary-50, #eff6ff);
  }

  .button--tertiary {
    --hx-button-bg: var(--hx-color-neutral-100, #f1f5f9);
    --hx-button-color: var(--hx-color-neutral-900, #0f172a);
    --hx-button-border-color: transparent;
  }

  .button--tertiary:hover {
    --hx-button-bg: var(--hx-color-neutral-200, #e2e8f0);
  }

  .button--danger {
    --hx-button-bg: var(--hx-color-error-500, #dc2626);
    --hx-button-color: var(--hx-color-neutral-0, #ffffff);
    --hx-button-border-color: transparent;
  }

  .button--danger:hover {
    --hx-button-bg: var(--hx-color-error-600, #b91c1c);
  }

  .button--ghost {
    --hx-button-bg: transparent;
    --hx-button-color: var(--hx-color-primary-500, #2563eb);
    --hx-button-border-color: transparent;
  }

  .button--ghost:hover {
    --hx-button-bg: var(--hx-color-neutral-100, #f1f5f9);
  }

  .button--outline {
    --hx-button-bg: transparent;
    --hx-button-color: var(--hx-color-neutral-900, #0f172a);
    --hx-button-border-color: var(--hx-color-neutral-300, #cbd5e1);
  }

  .button--outline:hover {
    --hx-button-bg: var(--hx-color-neutral-50, #f8fafc);
  }

  /* ─── Disabled ─── */

  .button[disabled] {
    cursor: not-allowed;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  /* ─── Loading State ─── */

  .button--loading {
    position: relative;
    cursor: wait;
  }

  .button__spinner {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
    animation: hx-spin var(--hx-duration-spinner, 750ms) linear infinite;
  }

  @keyframes hx-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .button__spinner {
      animation: none;
      opacity: var(--hx-opacity-muted, 0.6);
    }
  }

  /* ─── Prefix / Suffix / Label ─── */

  .button__prefix,
  .button__suffix {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .button__label {
    flex: 1 1 auto;
  }
`;
