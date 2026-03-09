import { css } from 'lit';

export const helixMessageBarStyles = css`
  :host {
    display: block;
    width: 100%;
  }

  :host(:not([open])) {
    display: none;
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Base Container ─── */

  .message-bar {
    display: flex;
    align-items: center;
    gap: var(--hx-message-bar-gap, var(--hx-space-3));
    padding: var(--hx-message-bar-padding, var(--hx-space-4));
    border-bottom: var(--hx-border-width-thin, 1px) solid
      var(--hx-message-bar-border-color, var(--hx-color-info-200));
    background-color: var(--hx-message-bar-bg, var(--hx-color-info-50));
    color: var(--hx-message-bar-color, var(--hx-color-info-800));
    font-family: var(--hx-message-bar-font-family, var(--hx-font-family-sans));
    font-size: var(--hx-font-size-sm);
    line-height: var(--hx-line-height-normal);
    width: 100%;
  }

  /* ─── Sticky ─── */

  .message-bar--sticky {
    position: sticky;
    top: 0;
    z-index: var(--hx-z-index-sticky);
  }

  /* ─── Icon ─── */

  .message-bar__icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--hx-message-bar-icon-color, var(--hx-color-info-500));
  }

  .message-bar__icon svg {
    width: var(--hx-space-5);
    height: var(--hx-space-5);
    fill: currentColor;
  }

  /* ─── Message ─── */

  .message-bar__message {
    flex: 1;
    min-width: 0;
  }

  /* ─── Action ─── */

  .message-bar__action {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: var(--hx-space-2);
  }

  .message-bar__action:empty {
    display: none;
  }

  /* ─── Close Button ─── */
  /* Minimum 44x44px touch target per WCAG 2.5.5 (healthcare mandate). */

  .message-bar__close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-width: 2.75rem; /* 44px */
    min-height: 2.75rem; /* 44px */
    margin-left: auto;
    padding: 0;
    border: none;
    border-radius: var(--hx-border-radius-sm);
    background: transparent;
    color: var(--hx-message-bar-color, var(--hx-color-info-800));
    cursor: pointer;
    font-size: var(--hx-font-size-md);
    line-height: 1;
    transition:
      background-color var(--hx-transition-fast),
      opacity var(--hx-transition-fast);
    opacity: 0.7;
  }

  .message-bar__close-button:hover {
    opacity: 1;
  }

  .message-bar__close-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color);
    outline-offset: var(--hx-focus-ring-offset, 2px);
    opacity: 1;
  }

  .message-bar__close-button svg {
    width: var(--hx-space-4);
    height: var(--hx-space-4);
    fill: currentColor;
  }

  /* ─── Variant: info ─── */

  :host([variant='info']) .message-bar,
  :host(:not([variant])) .message-bar {
    --hx-message-bar-bg: var(--hx-color-info-50);
    --hx-message-bar-border-color: var(--hx-color-info-200);
    --hx-message-bar-color: var(--hx-color-info-800);
    --hx-message-bar-icon-color: var(--hx-color-info-500);
  }

  /* ─── Variant: success ─── */

  :host([variant='success']) .message-bar {
    --hx-message-bar-bg: var(--hx-color-success-50);
    --hx-message-bar-border-color: var(--hx-color-success-200);
    --hx-message-bar-color: var(--hx-color-success-800);
    --hx-message-bar-icon-color: var(--hx-color-success-500);
  }

  /* ─── Variant: warning ─── */

  :host([variant='warning']) .message-bar {
    --hx-message-bar-bg: var(--hx-color-warning-50);
    --hx-message-bar-border-color: var(--hx-color-warning-200);
    --hx-message-bar-color: var(--hx-color-warning-800);
    --hx-message-bar-icon-color: var(--hx-color-warning-500);
  }

  /* ─── Variant: error ─── */

  :host([variant='error']) .message-bar {
    --hx-message-bar-bg: var(--hx-color-error-50);
    --hx-message-bar-border-color: var(--hx-color-error-200);
    --hx-message-bar-color: var(--hx-color-error-800);
    --hx-message-bar-icon-color: var(--hx-color-error-500);
  }
`;
