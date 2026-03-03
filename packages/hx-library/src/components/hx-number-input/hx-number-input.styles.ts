import { css } from 'lit';

export const helixNumberInputStyles = css`
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
    font-family: var(--hx-number-input-font-family, var(--hx-font-family-sans));
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
    color: var(--hx-number-input-label-color, var(--hx-color-neutral-700));
    line-height: var(--hx-line-height-normal);
  }

  .field__required-marker {
    color: var(--hx-number-input-error-color, var(--hx-color-error-500));
    font-weight: var(--hx-font-weight-bold);
  }

  /* ─── Input Wrapper ─── */

  .field__input-wrapper {
    display: flex;
    align-items: stretch;
    border: var(--hx-border-width-thin) solid
      var(--hx-number-input-border-color, var(--hx-color-neutral-300));
    border-radius: var(--hx-number-input-border-radius, var(--hx-border-radius-md));
    background-color: var(--hx-number-input-bg, var(--hx-color-neutral-0));
    transition:
      border-color var(--hx-transition-fast),
      box-shadow var(--hx-transition-fast);
    overflow: hidden;
  }

  .field__input-wrapper:focus-within {
    border-color: var(--hx-number-input-focus-ring-color, var(--hx-focus-ring-color));
    box-shadow: 0 0 0 var(--hx-focus-ring-width)
      color-mix(
        in srgb,
        var(--hx-number-input-focus-ring-color, var(--hx-focus-ring-color))
          calc(var(--hx-focus-ring-opacity) * 100%),
        transparent
      );
  }

  /* ─── Error State ─── */

  .field--error .field__input-wrapper {
    border-color: var(--hx-number-input-error-color, var(--hx-color-error-500));
  }

  .field--error .field__input-wrapper:focus-within {
    border-color: var(--hx-number-input-error-color, var(--hx-color-error-500));
    box-shadow: 0 0 0 var(--hx-focus-ring-width)
      color-mix(
        in srgb,
        var(--hx-number-input-error-color, var(--hx-color-error-500))
          calc(var(--hx-focus-ring-opacity) * 100%),
        transparent
      );
  }

  /* ─── Slots (Prefix / Suffix) ─── */

  .field__prefix,
  .field__suffix {
    display: flex;
    align-items: center;
    padding: 0 var(--hx-space-3);
    color: var(--hx-color-neutral-500);
    flex-shrink: 0;
  }

  /* ─── Native Input ─── */

  .field__input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
    color: var(--hx-number-input-color, var(--hx-color-neutral-800));
    line-height: var(--hx-line-height-normal);
    width: 100%;
    /* Size: md (default) */
    padding: var(--hx-space-2) var(--hx-space-3);
    font-size: var(--hx-font-size-md);
    min-height: var(--hx-size-10);
  }

  .field__input::placeholder {
    color: var(--hx-color-neutral-400);
  }

  .field__input:disabled {
    cursor: not-allowed;
  }

  /* ─── Hide native browser spinners ─── */

  .field__input[type='number']::-webkit-inner-spin-button,
  .field__input[type='number']::-webkit-outer-spin-button {
    display: none;
  }

  .field__input[type='number'] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  /* ─── Size Variants ─── */

  .field--sm .field__input {
    padding: var(--hx-space-1) var(--hx-space-2);
    font-size: var(--hx-font-size-sm);
    min-height: var(--hx-size-8);
  }

  .field--lg .field__input {
    padding: var(--hx-space-3) var(--hx-space-4);
    font-size: var(--hx-font-size-lg);
    min-height: var(--hx-size-12);
  }

  /* ─── Stepper ─── */

  .field__stepper {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    border-left: var(--hx-border-width-thin) solid
      var(--hx-number-input-border-color, var(--hx-color-neutral-300));
  }

  .field__stepper-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    outline: none;
    cursor: pointer;
    color: var(--hx-color-neutral-600);
    padding: 0;
    flex: 1;
    min-width: var(--hx-size-8);
    line-height: 1;
    transition: background-color var(--hx-transition-fast);
    user-select: none;
    -webkit-user-select: none;
  }

  .field__stepper-btn:not(:last-child) {
    border-bottom: var(--hx-border-width-thin) solid
      var(--hx-number-input-border-color, var(--hx-color-neutral-300));
  }

  .field__stepper-btn:hover:not(:disabled) {
    background-color: var(--hx-color-neutral-50);
    color: var(--hx-color-neutral-800);
  }

  .field__stepper-btn:focus-visible {
    outline: var(--hx-focus-ring-width) solid
      var(--hx-number-input-focus-ring-color, var(--hx-focus-ring-color));
    outline-offset: -2px;
  }

  .field__stepper-btn:disabled {
    opacity: var(--hx-opacity-disabled);
    cursor: not-allowed;
  }

  .field__stepper-btn svg {
    pointer-events: none;
    width: 0.75rem;
    height: 0.75rem;
  }

  /* Size sm adjustments for stepper */
  .field--sm .field__stepper-btn {
    min-width: var(--hx-size-6);
  }

  /* Size lg adjustments for stepper */
  .field--lg .field__stepper-btn {
    min-width: var(--hx-size-10);
  }

  /* ─── Help Text & Error Messages ─── */

  .field__help-text {
    font-size: var(--hx-font-size-xs);
    color: var(--hx-color-neutral-500);
    line-height: var(--hx-line-height-normal);
  }

  .field__error {
    font-size: var(--hx-font-size-xs);
    color: var(--hx-number-input-error-color, var(--hx-color-error-500));
    line-height: var(--hx-line-height-normal);
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .field__input-wrapper {
      transition: none;
    }

    .field__stepper-btn {
      transition: none;
    }
  }
`;
