import { css } from 'lit';

export const wcCheckboxStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    opacity: var(--wc-opacity-disabled, 0.5);
    pointer-events: none;
  }

  * {
    box-sizing: border-box;
  }

  .checkbox {
    display: flex;
    flex-direction: column;
    gap: var(--wc-space-1, 0.25rem);
    font-family: var(--wc-font-family-sans, sans-serif);
  }

  /* ─── Control (checkbox + label row) ─── */

  .checkbox__control {
    display: inline-flex;
    align-items: flex-start;
    gap: var(--wc-space-2, 0.5rem);
    cursor: pointer;
  }

  :host([disabled]) .checkbox__control {
    cursor: not-allowed;
  }

  /* ─── Hidden Native Input ─── */

  .checkbox__input {
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

  /* ─── Visual Checkbox ─── */

  .checkbox__box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--wc-checkbox-size, var(--wc-size-5, 1.25rem));
    height: var(--wc-checkbox-size, var(--wc-size-5, 1.25rem));
    border: var(--wc-border-width-medium, 2px) solid var(--wc-checkbox-border-color, var(--wc-color-neutral-300, #ced4da));
    border-radius: var(--wc-checkbox-border-radius, var(--wc-border-radius-sm, 0.25rem));
    background-color: var(--wc-color-neutral-0, #ffffff);
    transition: background-color var(--wc-transition-fast, 150ms ease),
                border-color var(--wc-transition-fast, 150ms ease),
                box-shadow var(--wc-transition-fast, 150ms ease);
    margin-top: var(--wc-space-px, 1px);
  }

  /* ─── Focus Ring ─── */

  .checkbox__input:focus-visible ~ .checkbox__box {
    outline: var(--wc-focus-ring-width, 2px) solid var(--wc-checkbox-focus-ring-color, var(--wc-focus-ring-color, #007878));
    outline-offset: var(--wc-focus-ring-offset, 2px);
  }

  /* ─── Checked State ─── */

  .checkbox--checked .checkbox__box {
    background-color: var(--wc-checkbox-checked-bg, var(--wc-color-primary-500, #007878));
    border-color: var(--wc-checkbox-checked-border-color, var(--wc-color-primary-500, #007878));
  }

  /* ─── Indeterminate State ─── */

  .checkbox--indeterminate .checkbox__box {
    background-color: var(--wc-checkbox-checked-bg, var(--wc-color-primary-500, #007878));
    border-color: var(--wc-checkbox-checked-border-color, var(--wc-color-primary-500, #007878));
  }

  /* ─── Error State ─── */

  .checkbox--error .checkbox__box {
    border-color: var(--wc-checkbox-error-color, var(--wc-color-error-500, #dc3545));
  }

  .checkbox--error.checkbox--checked .checkbox__box,
  .checkbox--error.checkbox--indeterminate .checkbox__box {
    background-color: var(--wc-checkbox-error-color, var(--wc-color-error-500, #dc3545));
    border-color: var(--wc-checkbox-error-color, var(--wc-color-error-500, #dc3545));
  }

  /* ─── Hover ─── */

  .checkbox__control:hover .checkbox__box {
    border-color: var(--wc-color-primary-500, #007878);
  }

  .checkbox--checked .checkbox__control:hover .checkbox__box {
    filter: brightness(var(--wc-filter-brightness-hover, 0.9));
  }

  .checkbox--error .checkbox__control:hover .checkbox__box {
    border-color: var(--wc-checkbox-error-color, var(--wc-color-error-500, #dc3545));
  }

  /* ─── Checkmark Icon ─── */

  .checkbox__icon {
    display: none;
    width: calc(var(--wc-checkbox-size, var(--wc-size-5, 1.25rem)) * 0.65);
    height: calc(var(--wc-checkbox-size, var(--wc-size-5, 1.25rem)) * 0.65);
    fill: none;
    stroke: var(--wc-checkbox-checkmark-color, var(--wc-color-neutral-0, #ffffff));
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .checkbox--checked .checkbox__icon--check {
    display: block;
  }

  .checkbox--indeterminate .checkbox__icon--indeterminate {
    display: block;
  }

  /* ─── Label ─── */

  .checkbox__label {
    font-size: var(--wc-font-size-sm, 0.875rem);
    font-weight: var(--wc-font-weight-medium, 500);
    color: var(--wc-checkbox-label-color, var(--wc-color-neutral-700, #343a40));
    line-height: var(--wc-line-height-normal, 1.5);
    user-select: none;
    -webkit-user-select: none;
  }

  .checkbox__required-marker {
    color: var(--wc-checkbox-error-color, var(--wc-color-error-500, #dc3545));
    font-weight: var(--wc-font-weight-bold, 700);
  }

  /* ─── Help Text & Error Messages ─── */

  .checkbox__help-text {
    font-size: var(--wc-font-size-xs, 0.75rem);
    color: var(--wc-color-neutral-500, #6c757d);
    line-height: var(--wc-line-height-normal, 1.5);
    padding-left: calc(var(--wc-checkbox-size, var(--wc-size-5, 1.25rem)) + var(--wc-space-2, 0.5rem));
  }

  .checkbox__error {
    font-size: var(--wc-font-size-xs, 0.75rem);
    color: var(--wc-checkbox-error-color, var(--wc-color-error-500, #dc3545));
    line-height: var(--wc-line-height-normal, 1.5);
    padding-left: calc(var(--wc-checkbox-size, var(--wc-size-5, 1.25rem)) + var(--wc-space-2, 0.5rem));
  }
`;
