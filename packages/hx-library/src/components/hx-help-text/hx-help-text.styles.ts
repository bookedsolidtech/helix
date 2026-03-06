import { css } from 'lit';

export const helixHelpTextStyles = css`
  :host {
    display: block;
  }

  .help-text {
    font-family: var(--hx-help-text-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-help-text-font-size, var(--hx-font-size-sm, 0.875rem));
    font-weight: var(--hx-help-text-font-weight, var(--hx-font-weight-normal, 400));
    line-height: var(--hx-help-text-line-height, var(--hx-line-height-normal, 1.5));
    color: var(--hx-help-text-color, var(--hx-color-neutral-500, #6b7280));
    margin: 0;
  }

  /* ─── Variant: default ─── */

  .help-text--default {
    --hx-help-text-color: var(--hx-color-neutral-500, #6b7280);
  }

  /* ─── Variant: error ─── */

  .help-text--error {
    --hx-help-text-color: var(--hx-color-error-600, #dc2626);
  }

  /* ─── Variant: warning ─── */

  .help-text--warning {
    --hx-help-text-color: var(--hx-color-warning-700, #b45309);
  }

  /* ─── Variant: success ─── */

  .help-text--success {
    --hx-help-text-color: var(--hx-color-success-700, #15803d);
  }
`;
