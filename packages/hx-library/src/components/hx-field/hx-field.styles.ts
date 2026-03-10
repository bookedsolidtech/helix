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
    gap: var(--hx-field-gap, var(--hx-space-1, 0.25rem));
    font-family: var(--hx-field-font-family, var(--hx-font-family-sans, sans-serif));
  }

  /* ─── Inline Layout ─── */

  .field--layout-inline {
    flex-direction: row;
    align-items: baseline;
    flex-wrap: wrap;
  }

  .field--layout-inline .field__label-wrapper {
    display: flex;
    align-items: baseline;
    flex-shrink: 0;
    min-width: 8rem;
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
    cursor: pointer;
  }

  .field__required-marker {
    color: var(--hx-field-error-color, var(--hx-color-error-text, #b91c1c));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Control Wrapper ─── */

  .field__control {
    display: block;
  }

  /* ─── Error Slot Announcer (visually hidden live region) ─── */

  .field__error-slot-announcer {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ─── Size Variants ─── */

  :host([hx-size='sm']) .field__label {
    font-size: var(--hx-font-size-xs, 0.75rem);
  }

  :host([hx-size='lg']) .field__label {
    font-size: var(--hx-font-size-md, 1rem);
  }

  :host([hx-size='sm']) .field__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
  }

  :host([hx-size='lg']) .field__help-text {
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  /* ─── Help Text & Error Messages ─── */

  .field__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-field-help-text-color, var(--hx-color-neutral-500, #6b7280));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-field-error-color, var(--hx-color-error-text, #b91c1c));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Error State ─── */

  .field--error .field__label {
    color: var(--hx-field-error-color, var(--hx-color-error-text, #b91c1c));
  }

  .field--error .field__control {
    outline: 2px solid var(--hx-field-error-color, var(--hx-color-error-500, #ef4444));
    outline-offset: 2px;
    border-radius: 0.25rem;
  }
`;
