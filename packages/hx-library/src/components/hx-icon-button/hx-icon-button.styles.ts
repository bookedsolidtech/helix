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
    color: var(--hx-icon-button-color, var(--hx-color-primary-500, #429797));
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
      var(
        --hx-icon-button-focus-ring-color,
        var(--hx-focus-ring-color, var(--hx-color-primary-500, #429797))
      );
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .button:active {
    filter: brightness(var(--hx-filter-brightness-active, 0.8));
  }

  /* ─── Size Variants ─── */

  /* WCAG 2.5.5 (healthcare mandate): minimum 44x44px touch target for all sizes.
     min-width/min-height override the explicit size tokens when they fall below
     the 2.75rem (44px) threshold, preserving the visual icon size via font-size. */

  .button--sm {
    padding: var(--hx-space-1, 0.25rem);
    width: var(--hx-icon-button-size, var(--hx-size-8, 2rem));
    height: var(--hx-icon-button-size, var(--hx-size-8, 2rem));
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  .button--md {
    padding: var(--hx-space-2, 0.5rem);
    width: var(--hx-icon-button-size, var(--hx-size-10, 2.5rem));
    height: var(--hx-icon-button-size, var(--hx-size-10, 2.5rem));
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
    font-size: var(--hx-font-size-md, 1rem);
  }

  .button--lg {
    padding: var(--hx-space-3, 0.75rem);
    width: var(--hx-icon-button-size, var(--hx-size-12, 3rem));
    height: var(--hx-icon-button-size, var(--hx-size-12, 3rem));
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
    font-size: var(--hx-font-size-lg, 1.125rem);
  }

  /* ─── Style Variants ─── */

  .button--primary {
    --hx-icon-button-bg: var(--hx-color-primary-500, #429797);
    --hx-icon-button-color: var(--hx-color-text-on-primary, #ffffff);
    --hx-icon-button-border-color: transparent;
  }

  /* on-primary tokens are tuned for primary-500. primary-600 + on-primary
     drops icon contrast to 3.07:1 — fails the 4.5:1 floor for meaningful
     icons. Pin fg at neutral-0 (5.82:1 on primary-600). Mirrors hx-button. */
  .button--primary:hover {
    --hx-icon-button-bg: var(--hx-color-primary-600, #0f7078);
    --hx-icon-button-color: var(--hx-color-neutral-0, #ffffff);
  }

  .button--secondary {
    --hx-icon-button-bg: transparent;
    --hx-icon-button-color: var(--hx-color-primary-500, #429797);
    --hx-icon-button-border-color: var(--hx-color-primary-500, #429797);
  }

  .button--secondary:hover {
    --hx-icon-button-bg: var(--hx-color-primary-50, #ebf8f8);
  }

  .button--tertiary {
    --hx-icon-button-bg: transparent;
    --hx-icon-button-color: var(--hx-color-text-strong, #202b39);
    --hx-icon-button-border-color: var(--hx-color-border-strong, #66787b);
  }

  .button--tertiary:hover {
    --hx-icon-button-bg: var(--hx-color-surface-sunken, #ebeee9);
  }

  .button--danger {
    --hx-icon-button-bg: var(--hx-color-error-500, #e5493e);
    --hx-icon-button-color: var(--hx-color-text-on-error, #ffffff);
    --hx-icon-button-border-color: transparent;
  }

  /* on-error tokens are tuned for error-500. error-600 + on-error drops
     icon contrast to 2.25:1 — fails AA. Pin fg at neutral-0
     (6.47:1 on error-600). Mirrors hx-button danger:hover. */
  .button--danger:hover {
    --hx-icon-button-bg: var(--hx-color-error-600, #c92a2a);
    --hx-icon-button-color: var(--hx-color-neutral-0, #ffffff);
  }

  .button--ghost {
    --hx-icon-button-bg: transparent;
    --hx-icon-button-color: var(--hx-color-primary-500, #429797);
    --hx-icon-button-border-color: transparent;
  }

  .button--ghost:hover {
    --hx-icon-button-bg: var(--hx-color-surface-raised, #f5f8f3);
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
    /* P1-02 fix: opacity is set only on :host([disabled]) above to prevent
       multiplicative stacking (0.5 * 0.5 = 0.25). Do not add opacity here. */
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .button {
      transition: none;
    }
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .button {
      forced-color-adjust: none;
      background-color: ButtonFace;
      color: ButtonText;
      border: 2px solid ButtonText;
    }

    .button:focus-visible {
      outline: 3px solid Highlight;
      outline-offset: 2px;
    }

    .button[disabled] {
      background-color: ButtonFace;
      color: GrayText;
      border-color: GrayText;
      opacity: 1;
    }

    :host([disabled]) {
      opacity: 1;
    }
  }
`;
