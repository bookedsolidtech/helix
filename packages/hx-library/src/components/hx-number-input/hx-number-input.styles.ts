import { css } from 'lit';

export const helixNumberInputStyles = css`
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
    font-family: var(--hx-number-input-font-family, var(--hx-font-family-sans, sans-serif));
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
    color: var(--hx-number-input-label-color, var(--hx-color-neutral-700, #343a40));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--hx-number-input-error-color, var(--hx-color-error-500, #dc3545));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Input Wrapper ─── */

  .field__input-wrapper {
    display: flex;
    align-items: stretch;
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-number-input-border-color, var(--hx-color-neutral-300, #ced4da));
    border-radius: var(
      --hx-number-input-border-radius,
      var(--hx-border-radius-md, 0.375rem)
    );
    background-color: var(--hx-number-input-bg, var(--hx-color-neutral-0, #ffffff));
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    overflow: hidden;
  }

  .field__input-wrapper:focus-within {
    border-color: var(
      --hx-number-input-focus-ring-color,
      var(--hx-focus-ring-color, #2563eb)
    );
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-number-input-focus-ring-color, var(--hx-focus-ring-color, #2563eb))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* ─── Error State ─── */

  .field--error .field__input-wrapper {
    border-color: var(
      --hx-number-input-error-color,
      var(--hx-color-error-500, #dc3545)
    );
  }

  .field--error .field__input-wrapper:focus-within {
    border-color: var(
      --hx-number-input-error-color,
      var(--hx-color-error-500, #dc3545)
    );
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-number-input-error-color, var(--hx-color-error-500, #dc3545))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* ─── Slots (Prefix / Suffix) ─── */

  .field__prefix,
  .field__suffix {
    display: flex;
    align-items: center;
    padding: 0 var(--hx-space-3, 0.75rem);
    color: var(--hx-color-neutral-500, #6c757d);
    flex-shrink: 0;
  }

  /* ─── Native Input ─── */

  .field__input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
    color: var(--hx-number-input-color, var(--hx-color-neutral-800, #212529));
    line-height: var(--hx-line-height-normal, 1.5);
    width: 100%;
    /* Size: md (default) */
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    font-size: var(--hx-font-size-md, 1rem);
    min-height: var(--hx-size-10, 2.5rem);
  }

  .field__input::placeholder {
    color: var(--hx-color-neutral-400, #adb5bd);
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
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    min-height: var(--hx-size-8, 2rem);
  }

  .field--lg .field__input {
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem);
    font-size: var(--hx-font-size-lg, 1.125rem);
    min-height: var(--hx-size-12, 3rem);
  }

  /* ─── Stepper ─── */

  .field__stepper {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    border-left: var(--hx-border-width-thin, 1px) solid
      var(--hx-number-input-border-color, var(--hx-color-neutral-300, #ced4da));
  }

  .field__stepper-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    outline: none;
    cursor: pointer;
    color: var(--hx-color-neutral-600, #495057);
    padding: 0;
    flex: 1;
    min-width: var(--hx-size-8, 2rem);
    line-height: 1;
    transition: background-color var(--hx-transition-fast, 150ms ease);
    user-select: none;
    -webkit-user-select: none;
  }

  .field__stepper-btn:not(:last-child) {
    border-bottom: var(--hx-border-width-thin, 1px) solid
      var(--hx-number-input-border-color, var(--hx-color-neutral-300, #ced4da));
  }

  .field__stepper-btn:hover:not(:disabled) {
    background-color: var(--hx-color-neutral-50, #f8f9fa);
    color: var(--hx-color-neutral-800, #212529);
  }

  .field__stepper-btn:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-number-input-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: -2px;
  }

  .field__stepper-btn:disabled {
    opacity: var(--hx-opacity-disabled, 0.5);
    cursor: not-allowed;
  }

  .field__stepper-btn svg {
    pointer-events: none;
    width: 0.75rem;
    height: 0.75rem;
  }

  /* Size sm adjustments for stepper */
  .field--sm .field__stepper-btn {
    min-width: var(--hx-size-6, 1.5rem);
  }

  /* Size lg adjustments for stepper */
  .field--lg .field__stepper-btn {
    min-width: var(--hx-size-10, 2.5rem);
  }

  /* ─── Help Text & Error Messages ─── */

  .field__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-neutral-500, #6c757d);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-number-input-error-color, var(--hx-color-error-500, #dc3545));
    line-height: var(--hx-line-height-normal, 1.5);
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
