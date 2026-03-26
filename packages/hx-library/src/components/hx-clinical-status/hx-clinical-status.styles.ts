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
  /* @design-system-approved: WCAG standard visually-hidden technique for a11y */

  .sr-only {
    position: absolute;
    width: 1px; /* @design-system-approved: standard sr-only technique */
    height: 1px; /* @design-system-approved: standard sr-only technique */
    padding: 0;
    margin: -1px; /* @design-system-approved: standard sr-only technique */
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
    border-inline-start: var(--hx-clinical-status-accent-width, 4px) solid
      var(--hx-clinical-status-accent-color, var(--hx-color-info-500, #3b82f6));
    border-radius: var(--hx-clinical-status-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-clinical-status-bg, var(--hx-color-info-50, #e8f4fd));
    color: var(--hx-clinical-status-color, var(--hx-color-info-800, #1a3a4a));
    font-family: var(--hx-clinical-status-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-font-size-sm, 0.875rem);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Compact Mode ─── */

  .clinical-status--compact {
    padding: var(
      --hx-clinical-status-compact-padding,
      var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem)
    );
    gap: var(--hx-space-2, 0.5rem);
    font-size: var(--hx-font-size-xs, 0.75rem);
  }

  /* ─── Severity: info ─── */

  :host([severity='info']) .clinical-status,
  :host(:not([severity])) .clinical-status {
    --hx-clinical-status-bg: var(--hx-color-info-50, #e8f4fd);
    --hx-clinical-status-border-color: var(--hx-color-info-200, #b3d9ef);
    --hx-clinical-status-accent-color: var(--hx-color-info-500, #3b82f6);
    --hx-clinical-status-color: var(--hx-color-info-800, #1a3a4a);
    --hx-clinical-status-icon-color: var(--hx-color-info-500, #3b82f6);
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

  /* ─── Severity: emergent ─── */

  :host([severity='emergent']) .clinical-status {
    --hx-clinical-status-bg: var(--hx-color-error-50, #fef2f2);
    --hx-clinical-status-border-color: var(--hx-color-error-300, #fca5a5);
    --hx-clinical-status-accent-color: var(--hx-color-error-700, #b91c1c);
    --hx-clinical-status-color: var(--hx-color-error-900, #7f1d1d);
    --hx-clinical-status-icon-color: var(--hx-color-error-700, #b91c1c);
    border-inline-start-width: var(--hx-clinical-status-emergent-accent-width, 6px);
    font-weight: var(--hx-font-weight-semibold, 600);
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

  .clinical-status--compact .clinical-status__icon svg {
    width: var(--hx-space-4, 1rem);
    height: var(--hx-space-4, 1rem);
  }

  /* ─── Message ─── */

  .clinical-status__message {
    flex: 1;
    min-width: 0;
  }

  /* ─── Severity Label (WCAG 1.4.1) ─── */
  /* @design-system-approved: WCAG 1.4.1 non-color severity indicator for screen readers */

  .clinical-status__severity-label {
    position: absolute;
    width: 1px; /* @design-system-approved: standard sr-only technique */
    height: 1px; /* @design-system-approved: standard sr-only technique */
    padding: 0;
    margin: -1px; /* @design-system-approved: standard sr-only technique */
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ─── Actions ─── */

  .clinical-status__actions {
    display: none;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    margin-inline-start: auto;
    flex-shrink: 0;
  }

  .clinical-status__actions--visible {
    display: flex;
  }

  /* ─── Dismiss Button ─── */

  .clinical-status__dismiss-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-width: var(--hx-touch-target-size, 44px);
    min-height: var(--hx-touch-target-size, 44px);
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

  .clinical-status__dismiss-button:hover {
    opacity: 1;
    background-color: color-mix(in srgb, currentColor 10%, transparent);
  }

  .clinical-status__dismiss-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-focus, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    opacity: 1;
  }

  .clinical-status__dismiss-button svg {
    width: var(--hx-space-4, 1rem);
    height: var(--hx-space-4, 1rem);
    fill: currentColor;
  }

  .clinical-status--compact .clinical-status__dismiss-button {
    min-width: var(--hx-space-8, 2rem);
    min-height: var(--hx-space-8, 2rem);
  }

  /* ─── Acknowledge Button ─── */

  .clinical-status__acknowledge-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-3, 0.75rem);
    border: var(--hx-border-width-thin, 1px) solid currentColor;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: var(--hx-font-size-xs, 0.75rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    text-transform: uppercase;
    letter-spacing: var(--hx-letter-spacing-wide, 0.05em);
    cursor: pointer;
    line-height: var(--hx-line-height-normal, 1.5);
    min-height: var(--hx-touch-target-size, 44px);
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      opacity var(--hx-transition-fast, 150ms ease);
  }

  .clinical-status__acknowledge-button:hover {
    background-color: color-mix(in srgb, currentColor 10%, transparent);
  }

  .clinical-status__acknowledge-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-focus, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .clinical-status--compact .clinical-status__acknowledge-button {
    min-height: var(--hx-space-8, 2rem);
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .clinical-status__dismiss-button,
    .clinical-status__acknowledge-button {
      transition: none;
    }
  }
`;
