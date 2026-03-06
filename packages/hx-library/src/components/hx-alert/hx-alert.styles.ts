import { css } from 'lit';

export const helixAlertStyles = css`
  :host {
    display: block;
  }

  :host(:not([open])) {
    display: none;
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Alert Container ─── */

  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--hx-alert-gap, var(--hx-space-3, 0.75rem));
    padding: var(--hx-alert-padding, var(--hx-space-4, 1rem));
    border: var(--hx-alert-border-width, var(--hx-border-width-thin, 1px)) solid
      var(--hx-alert-border-color, var(--hx-color-info-200, #b3d9ef));
    border-radius: var(--hx-alert-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-alert-bg, var(--hx-color-info-50, #e8f4fd));
    color: var(--hx-alert-color, var(--hx-color-info-800, #1a3a4a));
    font-family: var(--hx-alert-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-font-size-sm, 0.875rem);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Icon ─── */

  .alert__icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--hx-alert-icon-color, var(--hx-color-info-500, #3b82f6));
  }

  .alert__icon svg {
    width: var(--hx-space-5, 1.25rem);
    height: var(--hx-space-5, 1.25rem);
    fill: currentColor;
  }

  /* ─── Message ─── */

  .alert__message {
    flex: 1;
    min-width: 0;
  }

  /* ─── Actions ─── */

  .alert__actions {
    display: flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    margin-top: var(--hx-space-2, 0.5rem);
  }

  .alert__actions:not(:has(*)) {
    display: none;
  }

  /* ─── Close Button ─── */
  /* Minimum 44x44px touch target per WCAG 2.5.8 / Apple HIG. */

  .alert__close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-width: 44px;
    min-height: 44px;
    margin-left: auto;
    padding: 0;
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    color: var(--hx-alert-color, var(--hx-color-info-800, #1a3a4a));
    cursor: pointer;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: 1;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      opacity var(--hx-transition-fast, 150ms ease);
    opacity: 0.7;
  }

  .alert__close-button:hover {
    opacity: 1;
    background-color: color-mix(in srgb, currentColor 10%, transparent);
  }

  .alert__close-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
    opacity: 1;
  }

  .alert__close-button svg {
    width: var(--hx-space-4, 1rem);
    height: var(--hx-space-4, 1rem);
    fill: currentColor;
  }

  /* ─── Variant: info ─── */

  :host([variant='info']) .alert,
  :host(:not([variant])) .alert {
    --hx-alert-bg: var(--hx-color-info-50, #e8f4fd);
    --hx-alert-border-color: var(--hx-color-info-200, #b3d9ef);
    --hx-alert-color: var(--hx-color-info-800, #1a3a4a);
    --hx-alert-icon-color: var(--hx-color-info-500, #3b82f6);
  }

  /* ─── Variant: success ─── */

  :host([variant='success']) .alert {
    --hx-alert-bg: var(--hx-color-success-50, #ecfdf5);
    --hx-alert-border-color: var(--hx-color-success-200, #a7f3d0);
    --hx-alert-color: var(--hx-color-success-800, #065f46);
    --hx-alert-icon-color: var(--hx-color-success-500, #10b981);
  }

  /* ─── Variant: warning ─── */

  :host([variant='warning']) .alert {
    --hx-alert-bg: var(--hx-color-warning-50, #fffbeb);
    --hx-alert-border-color: var(--hx-color-warning-200, #fde68a);
    --hx-alert-color: var(--hx-color-warning-800, #92400e);
    --hx-alert-icon-color: var(--hx-color-warning-500, #f59e0b);
  }

  /* ─── Variant: error ─── */

  :host([variant='error']) .alert {
    --hx-alert-bg: var(--hx-color-error-50, #fef2f2);
    --hx-alert-border-color: var(--hx-color-error-200, #fecaca);
    --hx-alert-color: var(--hx-color-error-800, #991b1b);
    --hx-alert-icon-color: var(--hx-color-error-500, #ef4444);
  }
`;
