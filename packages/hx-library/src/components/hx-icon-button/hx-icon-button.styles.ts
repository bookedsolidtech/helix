import { css } from 'lit';

export const helixIconButtonStyles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled);
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: var(--hx-border-width-thin) solid var(--hx-icon-button-border-color);
    border-radius: var(--hx-icon-button-border-radius, var(--hx-border-radius-md));
    background-color: var(--hx-icon-button-bg);
    color: var(--hx-icon-button-color, var(--hx-color-primary-500));
    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast),
      color var(--hx-transition-fast),
      border-color var(--hx-transition-fast),
      box-shadow var(--hx-transition-fast);
    text-decoration: none;
    user-select: none;
    -webkit-user-select: none;
    flex-shrink: 0;
  }

  .button:focus-visible {
    outline: var(--hx-focus-ring-width) solid
      var(--hx-icon-button-focus-ring-color, var(--hx-focus-ring-color));
    outline-offset: var(--hx-focus-ring-offset);
  }

  .button:hover {
    filter: brightness(var(--hx-filter-brightness-hover, 0.9));
  }

  .button:active {
    filter: brightness(var(--hx-filter-brightness-active, 0.8));
  }

  /* ─── Size Variants ─── */

  .button--sm {
    padding: var(--hx-space-1);
    width: var(--hx-icon-button-size, var(--hx-size-8));
    height: var(--hx-icon-button-size, var(--hx-size-8));
    font-size: var(--hx-font-size-sm);
  }

  .button--md {
    padding: var(--hx-space-2);
    width: var(--hx-icon-button-size, var(--hx-size-10));
    height: var(--hx-icon-button-size, var(--hx-size-10));
    font-size: var(--hx-font-size-md);
  }

  .button--lg {
    padding: var(--hx-space-3);
    width: var(--hx-icon-button-size, var(--hx-size-12));
    height: var(--hx-icon-button-size, var(--hx-size-12));
    font-size: var(--hx-font-size-lg);
  }

  /* ─── Style Variants ─── */

  .button--primary {
    --hx-icon-button-bg: var(--hx-color-primary-500);
    --hx-icon-button-color: var(--hx-color-neutral-0);
    --hx-icon-button-border-color: transparent;
  }

  .button--secondary {
    --hx-icon-button-bg: transparent;
    --hx-icon-button-color: var(--hx-color-primary-500);
    --hx-icon-button-border-color: var(--hx-color-primary-500);
  }

  .button--secondary:hover {
    --hx-icon-button-bg: var(--hx-color-primary-50);
  }

  .button--tertiary {
    --hx-icon-button-bg: transparent;
    --hx-icon-button-color: var(--hx-color-neutral-700);
    --hx-icon-button-border-color: var(--hx-color-neutral-300);
  }

  .button--tertiary:hover {
    --hx-icon-button-bg: var(--hx-color-neutral-100);
  }

  .button--danger {
    --hx-icon-button-bg: var(--hx-color-danger-500);
    --hx-icon-button-color: var(--hx-color-neutral-0);
    --hx-icon-button-border-color: transparent;
  }

  .button--danger:hover {
    --hx-icon-button-bg: var(--hx-color-danger-600);
  }

  .button--ghost {
    --hx-icon-button-bg: transparent;
    --hx-icon-button-color: var(--hx-color-primary-500);
    --hx-icon-button-border-color: transparent;
  }

  .button--ghost:hover {
    --hx-icon-button-bg: var(--hx-color-neutral-100);
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
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .button {
      transition: none;
    }
  }
`;
