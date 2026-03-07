import { css } from 'lit';

export const helixFieldStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled, 0.5);
    pointer-events: none;
  }

  * {
    box-sizing: border-box;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    font-family: var(--hx-field-font-family, var(--hx-font-family-sans, sans-serif));
  }

  /* ─── Label ─── */

  .field__label-wrapper {
    display: contents;
  }

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-field-label-color, var(--hx-color-neutral-700, #374151));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--hx-field-error-color, var(--hx-color-error-500, #ef4444));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Control Wrapper ─── */

  .field__control {
    display: contents;
  }

  /* ─── Size Variants ─── */

  :host([hx-size='sm']) .field__label {
    font-size: var(--hx-font-size-xs, 0.75rem);
  }

  :host([hx-size='lg']) .field__label {
    font-size: var(--hx-font-size-md, 1rem);
  }

  /* ─── Help Text & Error Messages ─── */

  .field__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-neutral-500, #6b7280);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-field-error-color, var(--hx-color-error-500, #ef4444));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Error State ─── */

  .field--error .field__label {
    color: var(--hx-field-error-color, var(--hx-color-error-500, #ef4444));
  }
`;
