import { css } from 'lit';

export const wcAlertStyles = css`
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
    gap: var(--wc-alert-gap, var(--wc-space-3, 0.75rem));
    padding: var(--wc-alert-padding, var(--wc-space-4, 1rem));
    border: var(--wc-alert-border-width, var(--wc-border-width-thin, 1px)) solid
      var(--wc-alert-border-color, var(--wc-color-info-200, #b3d9ef));
    border-radius: var(--wc-alert-border-radius, var(--wc-border-radius-md, 0.375rem));
    background-color: var(--wc-alert-bg, var(--wc-color-info-50, #e8f4fd));
    color: var(--wc-alert-color, var(--wc-color-info-800, #1a3a4a));
    font-family: var(--wc-alert-font-family, var(--wc-font-family-sans, sans-serif));
    font-size: var(--wc-font-size-sm, 0.875rem);
    line-height: var(--wc-line-height-normal, 1.5);
  }

  /* ─── Icon ─── */

  .alert__icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--wc-alert-icon-color, var(--wc-color-info-500, #3b82f6));
  }

  .alert__icon svg {
    width: var(--wc-space-5, 1.25rem);
    height: var(--wc-space-5, 1.25rem);
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
    gap: var(--wc-space-2, 0.5rem);
    margin-top: var(--wc-space-2, 0.5rem);
  }

  /* ─── Close Button ─── */

  .alert__close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--wc-space-6, 1.5rem);
    height: var(--wc-space-6, 1.5rem);
    margin-left: auto;
    padding: 0;
    border: none;
    border-radius: var(--wc-border-radius-sm, 0.25rem);
    background: transparent;
    color: var(--wc-alert-color, var(--wc-color-info-800, #1a3a4a));
    cursor: pointer;
    font-size: var(--wc-font-size-md, 1rem);
    line-height: 1;
    transition: background-color var(--wc-transition-fast, 150ms ease),
                opacity var(--wc-transition-fast, 150ms ease);
    opacity: 0.7;
  }

  .alert__close-button:hover {
    opacity: 1;
    background-color: color-mix(in srgb, currentColor 10%, transparent);
  }

  .alert__close-button:focus-visible {
    outline: var(--wc-focus-ring-width, 2px) solid
      var(--wc-focus-ring-color, #007878);
    outline-offset: var(--wc-focus-ring-offset, 2px);
    opacity: 1;
  }

  .alert__close-button svg {
    width: var(--wc-space-4, 1rem);
    height: var(--wc-space-4, 1rem);
    fill: currentColor;
  }

  /* ─── Variant: info ─── */

  :host([variant='info']) .alert,
  :host(:not([variant])) .alert {
    --wc-alert-bg: var(--wc-color-info-50, #e8f4fd);
    --wc-alert-border-color: var(--wc-color-info-200, #b3d9ef);
    --wc-alert-color: var(--wc-color-info-800, #1a3a4a);
    --wc-alert-icon-color: var(--wc-color-info-500, #3b82f6);
  }

  /* ─── Variant: success ─── */

  :host([variant='success']) .alert {
    --wc-alert-bg: var(--wc-color-success-50, #ecfdf5);
    --wc-alert-border-color: var(--wc-color-success-200, #a7f3d0);
    --wc-alert-color: var(--wc-color-success-800, #065f46);
    --wc-alert-icon-color: var(--wc-color-success-500, #10b981);
  }

  /* ─── Variant: warning ─── */

  :host([variant='warning']) .alert {
    --wc-alert-bg: var(--wc-color-warning-50, #fffbeb);
    --wc-alert-border-color: var(--wc-color-warning-200, #fde68a);
    --wc-alert-color: var(--wc-color-warning-800, #92400e);
    --wc-alert-icon-color: var(--wc-color-warning-500, #f59e0b);
  }

  /* ─── Variant: error ─── */

  :host([variant='error']) .alert {
    --wc-alert-bg: var(--wc-color-error-50, #fef2f2);
    --wc-alert-border-color: var(--wc-color-error-200, #fecaca);
    --wc-alert-color: var(--wc-color-error-800, #991b1b);
    --wc-alert-icon-color: var(--wc-color-error-500, #ef4444);
  }
`;
