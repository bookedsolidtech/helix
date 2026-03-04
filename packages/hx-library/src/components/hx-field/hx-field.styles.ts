import { css } from 'lit';

export const helixFieldStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled);
    pointer-events: none;
  }

  * {
    box-sizing: border-box;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1);
    font-family: var(--hx-field-font-family, var(--hx-font-family-sans));
  }

  /* ─── Label ─── */

  .field__label-wrapper {
    display: contents;
  }

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1);
    font-size: var(--hx-font-size-sm);
    font-weight: var(--hx-font-weight-medium);
    color: var(--hx-field-label-color, var(--hx-color-neutral-700));
    line-height: var(--hx-line-height-normal);
  }

  .field__required-marker {
    color: var(--hx-field-error-color, var(--hx-color-error-500));
    font-weight: var(--hx-font-weight-bold);
  }

  /* ─── Control Wrapper ─── */

  .field__control {
    display: contents;
  }

  /* ─── Size Variants ─── */

  :host([hx-size='sm']) .field__label {
    font-size: var(--hx-font-size-xs);
  }

  :host([hx-size='lg']) .field__label {
    font-size: var(--hx-font-size-md);
  }

  /* ─── Help Text & Error Messages ─── */

  .field__help-text {
    font-size: var(--hx-font-size-xs);
    color: var(--hx-color-neutral-500);
    line-height: var(--hx-line-height-normal);
  }

  .field__error {
    font-size: var(--hx-font-size-xs);
    color: var(--hx-field-error-color, var(--hx-color-error-500));
    line-height: var(--hx-line-height-normal);
  }

  /* ─── Error State ─── */

  .field--error .field__label {
    color: var(--hx-field-error-color, var(--hx-color-error-500));
  }
`;
