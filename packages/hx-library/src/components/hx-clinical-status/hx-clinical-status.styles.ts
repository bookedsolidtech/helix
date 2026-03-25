import { css } from 'lit';

export const helixClinicalStatusStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Screen-reader-only utility ─── */

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ─── Container ─── */

  .clinical-status {
    display: flex;
    align-items: flex-start;
    gap: var(--hx-clinical-status-gap, var(--hx-space-3, 0.75rem));
    padding: var(--hx-clinical-status-padding, var(--hx-space-4, 1rem));
    border: var(--hx-clinical-status-border-width, var(--hx-border-width-thin, 1px)) solid
      var(--hx-clinical-status-border-color, var(--hx-color-info-200, #b3d9ef));
    border-radius: var(--hx-clinical-status-border-radius, var(--hx-border-radius-md, 0.375rem));
    border-left: var(--hx-clinical-status-accent-width, 4px) solid
      var(--hx-clinical-status-accent-color, var(--hx-color-info-500, #3b82f6));
    background-color: var(--hx-clinical-status-bg, var(--hx-color-info-50, #e8f4fd));
    color: var(--hx-clinical-status-color, var(--hx-color-info-800, #1a3a4a));
    font-family: var(--hx-clinical-status-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-font-size-sm, 0.875rem);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Compact mode ─── */

  :host([compact]) .clinical-status {
    padding: var(--hx-clinical-status-padding-compact, var(--hx-space-2, 0.5rem));
    gap: var(--hx-clinical-status-gap-compact, var(--hx-space-2, 0.5rem));
    font-size: var(--hx-font-size-xs, 0.75rem);
  }

  /* ─── Icon ─── */

  .clinical-status__icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--hx-clinical-status-icon-color, var(--hx-color-info-500, #3b82f6));
  }

  .clinical-status__icon svg {
    width: var(--hx-space-5, 1.25rem);
    height: var(--hx-space-5, 1.25rem);
    fill: currentColor;
  }

  :host([compact]) .clinical-status__icon svg {
    width: var(--hx-space-4, 1rem);
    height: var(--hx-space-4, 1rem);
  }

  /* ─── Message ─── */

  .clinical-status__message {
    flex: 1;
    min-width: 0;
  }

  /* ─── Dismiss button ─── */

  .clinical-status__dismiss {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-width: var(--hx-touch-target-size, 44px);
    min-height: var(--hx-touch-target-size, 44px);
    margin-left: auto;
    padding: 0;
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    color: var(--hx-clinical-status-color, var(--hx-color-info-800, #1a3a4a));
    cursor: pointer;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: 1;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      opacity var(--hx-transition-fast, 150ms ease);
    opacity: 0.7;
  }

  :host([compact]) .clinical-status__dismiss {
    min-width: var(--hx-space-6, 1.5rem);
    min-height: var(--hx-space-6, 1.5rem);
  }

  .clinical-status__dismiss:hover {
    opacity: 1;
    background-color: color-mix(in srgb, currentColor 10%, transparent);
  }

  .clinical-status__dismiss:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
    opacity: 1;
  }

  .clinical-status__dismiss svg {
    width: var(--hx-space-4, 1rem);
    height: var(--hx-space-4, 1rem);
    fill: currentColor;
  }

  @media (prefers-reduced-motion: reduce) {
    .clinical-status__dismiss {
      transition: none;
    }
  }

  /* ─── Severity: info (default) ─── */

  :host([severity='info']) .clinical-status,
  :host(:not([severity])) .clinical-status {
    --hx-clinical-status-bg: var(--hx-color-info-50, #e8f4fd);
    --hx-clinical-status-border-color: var(--hx-color-info-200, #b3d9ef);
    --hx-clinical-status-accent-color: var(--hx-color-info-500, #3b82f6);
    --hx-clinical-status-color: var(--hx-color-info-800, #1a3a4a);
    --hx-clinical-status-icon-color: var(--hx-color-info-500, #3b82f6);
  }

  /* ─── Severity: success ─── */

  :host([severity='success']) .clinical-status {
    --hx-clinical-status-bg: var(--hx-color-success-50, #ecfdf5);
    --hx-clinical-status-border-color: var(--hx-color-success-200, #a7f3d0);
    --hx-clinical-status-accent-color: var(--hx-color-success-500, #10b981);
    --hx-clinical-status-color: var(--hx-color-success-800, #065f46);
    --hx-clinical-status-icon-color: var(--hx-color-success-500, #10b981);
  }

  /* ─── Severity: warning ─── */

  :host([severity='warning']) .clinical-status {
    --hx-clinical-status-bg: var(--hx-color-warning-50, #fffbeb);
    --hx-clinical-status-border-color: var(--hx-color-warning-200, #fde68a);
    --hx-clinical-status-accent-color: var(--hx-color-warning-500, #f59e0b);
    --hx-clinical-status-color: var(--hx-color-warning-800, #92400e);
    --hx-clinical-status-icon-color: var(--hx-color-warning-500, #f59e0b);
  }

  /* ─── Severity: critical ─── */

  :host([severity='critical']) .clinical-status {
    --hx-clinical-status-bg: var(--hx-color-error-50, #fef2f2);
    --hx-clinical-status-border-color: var(--hx-color-error-200, #fecaca);
    --hx-clinical-status-accent-color: var(--hx-color-error-500, #ef4444);
    --hx-clinical-status-color: var(--hx-color-error-800, #991b1b);
    --hx-clinical-status-icon-color: var(--hx-color-error-500, #ef4444);
  }
`;
