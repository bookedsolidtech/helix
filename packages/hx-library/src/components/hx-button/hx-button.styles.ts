import { css } from 'lit';

export const helixButtonStyles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  :host([full]) {
    display: block;
    width: 100%;
  }

  :host([full]) .button {
    width: 100%;
    justify-content: center;
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
      var(--hx-button-focus-ring-color, var(--hx-focus-ring-color, var(--hx-color-primary-500)));
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
    --hx-button-bg: var(--hx-color-primary-500);
    --hx-button-color: var(--hx-color-neutral-0);
    --hx-button-border-color: transparent;
  }

  .button--secondary {
    --hx-button-bg: transparent;
    --hx-button-color: var(--hx-color-primary-500);
    --hx-button-border-color: var(--hx-color-primary-500);
  }

  .button--secondary:hover {
    --hx-button-bg: var(--hx-button-hover-bg, var(--hx-color-primary-50));
  }

  .button--tertiary {
    --hx-button-bg: var(--hx-color-neutral-100);
    --hx-button-color: var(--hx-color-neutral-900);
    --hx-button-border-color: transparent;
  }

  .button--tertiary:hover {
    --hx-button-bg: var(--hx-button-hover-bg, var(--hx-color-neutral-200));
  }

  .button--danger {
    --hx-button-bg: var(--hx-color-error-500);
    --hx-button-color: var(--hx-color-neutral-0);
    --hx-button-border-color: transparent;
  }

  .button--danger:hover {
    --hx-button-bg: var(--hx-button-hover-bg, var(--hx-color-error-600));
  }

  .button--ghost {
    --hx-button-bg: transparent;
    --hx-button-color: var(--hx-color-primary-500);
    --hx-button-border-color: transparent;
  }

  .button--ghost:hover {
    --hx-button-bg: var(--hx-button-hover-bg, var(--hx-color-neutral-100));
  }

  .button--outline {
    --hx-button-bg: transparent;
    --hx-button-color: var(--hx-color-neutral-900);
    --hx-button-border-color: var(--hx-color-neutral-300);
  }

  .button--outline:hover {
    --hx-button-bg: var(--hx-button-hover-bg, var(--hx-color-neutral-50));
  }

  .button--primary:hover {
    --hx-button-bg: var(--hx-button-hover-bg, var(--hx-color-primary-500));
  }

  /* ─── Disabled ─── */

  /* Note: opacity is applied on :host([disabled]) above — do NOT add opacity here.
     Stacking opacity on both :host and .button[disabled] would multiply to 0.25. */
  .button[disabled] {
    cursor: not-allowed;
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
    .button {
      transition: none;
    }

    .button__spinner {
      animation: none;
      opacity: var(--hx-opacity-muted, 0.6);
    }
  }

  /* ─── Inverted Mode ─── */

  /* Override text color and filter-based hover/active for all variants */
  :host([inverted]) .button {
    color: var(--hx-button-inverted-color, var(--hx-color-neutral-0));
    filter: none;
  }

  :host([inverted]) .button:hover {
    filter: none;
  }

  :host([inverted]) .button:active {
    filter: none;
  }

  :host([inverted]) .button:focus-visible {
    outline-color: var(
      --hx-button-inverted-focus-ring-color,
      var(--hx-overlay-white-50, rgba(255, 255, 255, 0.5))
    );
  }

  /* Primary inverted — slight transparent white overlay on hover */
  :host([inverted]) .button--primary:hover {
    --hx-button-bg: var(--hx-color-primary-400, #3b82f6);
  }

  /* Secondary inverted — white border and text */
  :host([inverted]) .button--secondary {
    --hx-button-border-color: var(--hx-overlay-white-70, rgba(255, 255, 255, 0.7));
  }

  :host([inverted]) .button--secondary:hover {
    --hx-button-bg: var(--hx-overlay-white-15, rgba(255, 255, 255, 0.15));
  }

  /* Tertiary inverted */
  :host([inverted]) .button--tertiary {
    --hx-button-bg: var(--hx-overlay-white-15, rgba(255, 255, 255, 0.15));
    --hx-button-border-color: transparent;
  }

  :host([inverted]) .button--tertiary:hover {
    --hx-button-bg: var(--hx-overlay-white-25, rgba(255, 255, 255, 0.25));
  }

  /* Ghost inverted — transparent base, white hover bg */
  :host([inverted]) .button--ghost {
    --hx-button-bg: transparent;
    --hx-button-border-color: transparent;
  }

  :host([inverted]) .button--ghost:hover {
    --hx-button-bg: var(
      --hx-button-inverted-ghost-hover-bg,
      var(--hx-overlay-white-20, rgba(255, 255, 255, 0.2))
    );
  }

  /* Outline inverted — white border */
  :host([inverted]) .button--outline {
    --hx-button-border-color: var(--hx-overlay-white-70, rgba(255, 255, 255, 0.7));
  }

  :host([inverted]) .button--outline:hover {
    --hx-button-bg: var(--hx-overlay-white-15, rgba(255, 255, 255, 0.15));
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
