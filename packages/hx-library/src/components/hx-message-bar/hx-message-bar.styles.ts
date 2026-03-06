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
    gap: var(--hx-message-bar-gap, var(--hx-space-3, 0.75rem));
    padding: var(--hx-message-bar-padding, var(--hx-space-4, 1rem));
    border-bottom: var(--hx-border-width-thin, 1px) solid
      var(--hx-message-bar-border-color, var(--hx-color-info-200, #b3d9ef));
    background-color: var(--hx-message-bar-bg, var(--hx-color-info-50, #e8f4fd));
    color: var(--hx-message-bar-color, var(--hx-color-info-800, #1a3a4a));
    font-family: var(--hx-message-bar-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-font-size-sm, 0.875rem);
    line-height: var(--hx-line-height-normal, 1.5);
    width: 100%;
  }

  /* ─── Sticky ─── */

  .message-bar--sticky {
    position: sticky;
    top: 0;
    z-index: var(--hx-z-index-sticky, 100);
  }

  /* ─── Icon ─── */

  .message-bar__icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--hx-message-bar-icon-color, var(--hx-color-info-500, #3b82f6));
  }

  .message-bar__icon svg {
    width: var(--hx-space-5, 1.25rem);
    height: var(--hx-space-5, 1.25rem);
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
    gap: var(--hx-space-2, 0.5rem);
  }

  .message-bar__action[hidden] {
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
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    color: var(--hx-message-bar-color, var(--hx-color-info-800, #1a3a4a));
    cursor: pointer;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: 1;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      opacity var(--hx-transition-fast, 150ms ease);
    opacity: 0.7;
  }

  .message-bar__close-button:hover {
    opacity: 1;
    background-color: color-mix(in srgb, currentColor 10%, transparent);
  }

  .message-bar__close-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
    opacity: 1;
  }

  .message-bar__close-button svg {
    width: var(--hx-space-4, 1rem);
    height: var(--hx-space-4, 1rem);
    fill: currentColor;
  }

  /* ─── Variant: info ─── */

  :host([variant='info']) .message-bar,
  :host(:not([variant])) .message-bar {
    --hx-message-bar-bg: var(--hx-color-info-50, #e8f4fd);
    --hx-message-bar-border-color: var(--hx-color-info-200, #b3d9ef);
    --hx-message-bar-color: var(--hx-color-info-800, #1a3a4a);
    --hx-message-bar-icon-color: var(--hx-color-info-500, #3b82f6);
  }

  /* ─── Variant: success ─── */

  :host([variant='success']) .message-bar {
    --hx-message-bar-bg: var(--hx-color-success-50, #ecfdf5);
    --hx-message-bar-border-color: var(--hx-color-success-200, #a7f3d0);
    --hx-message-bar-color: var(--hx-color-success-800, #065f46);
    --hx-message-bar-icon-color: var(--hx-color-success-500, #10b981);
  }

  /* ─── Variant: warning ─── */

  :host([variant='warning']) .message-bar {
    --hx-message-bar-bg: var(--hx-color-warning-50, #fffbeb);
    --hx-message-bar-border-color: var(--hx-color-warning-200, #fde68a);
    --hx-message-bar-color: var(--hx-color-warning-800, #92400e);
    --hx-message-bar-icon-color: var(--hx-color-warning-500, #f59e0b);
  }

  /* ─── Variant: error ─── */

  :host([variant='error']) .message-bar {
    --hx-message-bar-bg: var(--hx-color-error-50, #fef2f2);
    --hx-message-bar-border-color: var(--hx-color-error-200, #fecaca);
    --hx-message-bar-color: var(--hx-color-error-800, #991b1b);
    --hx-message-bar-icon-color: var(--hx-color-error-500, #ef4444);
  }
`;
