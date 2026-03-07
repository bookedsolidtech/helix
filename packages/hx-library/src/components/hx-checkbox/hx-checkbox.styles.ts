import { css } from 'lit';

export const helixCheckboxStyles = css`
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

  .checkbox {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    font-family: var(--hx-font-family-sans, sans-serif);
  }

  /* ─── Control (checkbox + label row) ─── */

  .checkbox__control {
    display: inline-flex;
    align-items: flex-start;
    gap: var(--hx-space-2, 0.5rem);
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
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  /* ─── Visual Checkbox ─── */

  .checkbox__box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--hx-checkbox-size, var(--hx-size-5, 1.25rem));
    height: var(--hx-checkbox-size, var(--hx-size-5, 1.25rem));
    border: var(--hx-border-width-medium, 2px) solid
      var(--hx-checkbox-border-color, var(--hx-color-neutral-300, #ced4da));
    border-radius: var(--hx-checkbox-border-radius, var(--hx-border-radius-sm, 0.25rem));
    background-color: var(--hx-checkbox-bg, var(--hx-color-neutral-0, #ffffff));
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    margin-top: var(--hx-space-px, 1px);
  }

  /* ─── Focus Ring ─── */

  .checkbox__input:focus-visible ~ .checkbox__box {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-checkbox-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Checked State ─── */

  .checkbox--checked .checkbox__box {
    background-color: var(--hx-checkbox-checked-bg, var(--hx-color-primary-500, #2563eb));
    border-color: var(--hx-checkbox-checked-border-color, var(--hx-color-primary-500, #2563eb));
  }

  /* ─── Indeterminate State ─── */

  .checkbox--indeterminate .checkbox__box {
    background-color: var(--hx-checkbox-checked-bg, var(--hx-color-primary-500, #2563eb));
    border-color: var(--hx-checkbox-checked-border-color, var(--hx-color-primary-500, #2563eb));
  }

  /* ─── Error State ─── */

  .checkbox--error .checkbox__box {
    border-color: var(--hx-checkbox-error-color, var(--hx-color-error-500, #dc3545));
  }

  .checkbox--error.checkbox--checked .checkbox__box,
  .checkbox--error.checkbox--indeterminate .checkbox__box {
    background-color: var(--hx-checkbox-error-color, var(--hx-color-error-500, #dc3545));
    border-color: var(--hx-checkbox-error-color, var(--hx-color-error-500, #dc3545));
  }

  /* ─── Hover ─── */

  /* P1-03: use component token so consumer overrides of --hx-checkbox-border-color work on hover */
  .checkbox__control:hover .checkbox__box {
    border-color: var(
      --hx-checkbox-hover-border-color,
      var(--hx-checkbox-border-color, var(--hx-color-primary-500, #2563eb))
    );
  }

  .checkbox--checked .checkbox__control:hover .checkbox__box {
    filter: brightness(var(--hx-filter-brightness-hover, 0.9));
  }

  .checkbox--error .checkbox__control:hover .checkbox__box {
    border-color: var(--hx-checkbox-error-color, var(--hx-color-error-500, #dc3545));
  }

  /* ─── Checkmark Icon ─── */

  .checkbox__icon {
    display: none;
    width: calc(var(--hx-checkbox-size, var(--hx-size-5, 1.25rem)) * 0.65);
    height: calc(var(--hx-checkbox-size, var(--hx-size-5, 1.25rem)) * 0.65);
    fill: none;
    stroke: var(--hx-checkbox-checkmark-color, var(--hx-color-neutral-0, #ffffff));
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
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-checkbox-label-color, var(--hx-color-neutral-700, #343a40));
    line-height: var(--hx-line-height-normal, 1.5);
    user-select: none;
    -webkit-user-select: none;
  }

  .checkbox__required-marker {
    color: var(--hx-checkbox-error-color, var(--hx-color-error-500, #dc3545));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Help Text & Error Messages ─── */

  .checkbox__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-checkbox-help-text-color, var(--hx-color-neutral-500, #6c757d));
    line-height: var(--hx-line-height-normal, 1.5);
    padding-left: calc(
      var(--hx-checkbox-size, var(--hx-size-5, 1.25rem)) + var(--hx-space-2, 0.5rem)
    );
  }

  .checkbox__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-checkbox-error-color, var(--hx-color-error-500, #dc3545));
    line-height: var(--hx-line-height-normal, 1.5);
    padding-left: calc(
      var(--hx-checkbox-size, var(--hx-size-5, 1.25rem)) + var(--hx-space-2, 0.5rem)
    );
  }

  /* ─── Size Variants ─── */

  :host([hx-size='sm']) {
    --hx-checkbox-size: var(--hx-size-4, 1rem);
  }

  :host([hx-size='sm']) .checkbox__label {
    font-size: var(--hx-font-size-xs, 0.75rem);
  }

  :host([hx-size='sm']) .checkbox__help-text,
  :host([hx-size='sm']) .checkbox__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    padding-left: calc(var(--hx-size-4, 1rem) + var(--hx-space-2, 0.5rem));
  }

  :host([hx-size='lg']) {
    --hx-checkbox-size: var(--hx-size-6, 1.5rem);
  }

  :host([hx-size='lg']) .checkbox__label {
    font-size: var(--hx-font-size-base, 1rem);
  }

  :host([hx-size='lg']) .checkbox__help-text,
  :host([hx-size='lg']) .checkbox__error {
    font-size: var(--hx-font-size-sm, 0.875rem);
    padding-left: calc(var(--hx-size-6, 1.5rem) + var(--hx-space-2, 0.5rem));
  }
`;
