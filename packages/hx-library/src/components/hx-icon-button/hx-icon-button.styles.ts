import { css } from 'lit';

export const helixIconButtonStyles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: var(--hx-border-width-thin, 1px) solid var(--hx-icon-button-border-color, transparent);
    border-radius: var(--hx-icon-button-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-icon-button-bg, transparent);
    color: var(--hx-icon-button-color, var(--hx-color-primary-500, #2563eb));
    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    text-decoration: none;
    user-select: none;
    -webkit-user-select: none;
    flex-shrink: 0;
  }

  .button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-icon-button-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
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
    padding: var(--hx-space-1, 0.25rem);
    width: var(--hx-icon-button-size, var(--hx-size-8, 2rem));
    height: var(--hx-icon-button-size, var(--hx-size-8, 2rem));
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  .button--md {
    padding: var(--hx-space-2, 0.5rem);
    width: var(--hx-icon-button-size, var(--hx-size-10, 2.5rem));
    height: var(--hx-icon-button-size, var(--hx-size-10, 2.5rem));
    font-size: var(--hx-font-size-md, 1rem);
  }

  .button--lg {
    padding: var(--hx-space-3, 0.75rem);
    width: var(--hx-icon-button-size, var(--hx-size-12, 3rem));
    height: var(--hx-icon-button-size, var(--hx-size-12, 3rem));
    font-size: var(--hx-font-size-lg, 1.125rem);
  }

  /* ─── Style Variants ─── */

  .button--primary {
    --hx-icon-button-bg: var(--hx-color-primary-500, #2563eb);
    --hx-icon-button-color: var(--hx-color-neutral-0, #ffffff);
    --hx-icon-button-border-color: transparent;
  }

  .button--secondary {
    --hx-icon-button-bg: transparent;
    --hx-icon-button-color: var(--hx-color-primary-500, #2563eb);
    --hx-icon-button-border-color: var(--hx-color-primary-500, #2563eb);
  }

  .button--secondary:hover {
    --hx-icon-button-bg: var(--hx-color-primary-50, #eff6ff);
  }

  .button--tertiary {
    --hx-icon-button-bg: transparent;
    --hx-icon-button-color: var(--hx-color-neutral-700, #374151);
    --hx-icon-button-border-color: var(--hx-color-neutral-300, #d1d5db);
  }

  .button--tertiary:hover {
    --hx-icon-button-bg: var(--hx-color-neutral-100, #f1f5f9);
  }

  .button--danger {
    --hx-icon-button-bg: var(--hx-color-danger-500, #dc2626);
    --hx-icon-button-color: var(--hx-color-neutral-0, #ffffff);
    --hx-icon-button-border-color: transparent;
  }

  .button--danger:hover {
    --hx-icon-button-bg: var(--hx-color-danger-600, #b91c1c);
  }

  .button--ghost {
    --hx-icon-button-bg: transparent;
    --hx-icon-button-color: var(--hx-color-primary-500, #2563eb);
    --hx-icon-button-border-color: transparent;
  }

  .button--ghost:hover {
    --hx-icon-button-bg: var(--hx-color-neutral-100, #f1f5f9);
  }

  /* ─── Icon Container ─── */

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1em;
    height: 1em;
    line-height: 1;
    pointer-events: none;
  }

  /* ─── Disabled ─── */

  .button[disabled] {
    cursor: not-allowed;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .button {
      transition: none;
    }
  }
`;
