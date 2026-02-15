import { css } from 'lit';

export const wcSelectStyles = css`
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

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--wc-space-1, 0.25rem);
    font-family: var(--wc-select-font-family, var(--wc-font-family-sans, sans-serif));
  }

  /* ─── Label ─── */

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--wc-space-1, 0.25rem);
    font-size: var(--wc-font-size-sm, 0.875rem);
    font-weight: var(--wc-font-weight-medium, 500);
    color: var(--wc-select-label-color, var(--wc-color-neutral-700, #343a40));
    line-height: var(--wc-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--wc-select-error-color, var(--wc-color-error-500, #dc3545));
    font-weight: var(--wc-font-weight-bold, 700);
  }

  /* ─── Select Wrapper ─── */

  .field__select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    border: var(--wc-border-width-thin, 1px) solid var(--wc-select-border-color, var(--wc-color-neutral-300, #ced4da));
    border-radius: var(--wc-select-border-radius, var(--wc-border-radius-md, 0.375rem));
    background-color: var(--wc-select-bg, var(--wc-color-neutral-0, #ffffff));
    transition: border-color var(--wc-transition-fast, 150ms ease),
                box-shadow var(--wc-transition-fast, 150ms ease);
    overflow: hidden;
  }

  .field__select-wrapper:focus-within {
    border-color: var(--wc-select-focus-ring-color, var(--wc-focus-ring-color, #007878));
    box-shadow: 0 0 0 var(--wc-focus-ring-width, 2px) color-mix(in srgb, var(--wc-select-focus-ring-color, var(--wc-focus-ring-color, #007878)) calc(var(--wc-focus-ring-opacity, 0.25) * 100%), transparent);
  }

  /* ─── Error State ─── */

  .field--error .field__select-wrapper {
    border-color: var(--wc-select-error-color, var(--wc-color-error-500, #dc3545));
  }

  .field--error .field__select-wrapper:focus-within {
    border-color: var(--wc-select-error-color, var(--wc-color-error-500, #dc3545));
    box-shadow: 0 0 0 var(--wc-focus-ring-width, 2px) color-mix(in srgb, var(--wc-select-error-color, var(--wc-color-error-500, #dc3545)) calc(var(--wc-focus-ring-opacity, 0.25) * 100%), transparent);
  }

  /* ─── Native Select ─── */

  .field__select {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: var(--wc-space-2, 0.5rem) var(--wc-space-8, 2rem) var(--wc-space-2, 0.5rem) var(--wc-space-3, 0.75rem);
    font-family: inherit;
    font-size: var(--wc-font-size-md, 1rem);
    color: var(--wc-select-color, var(--wc-color-neutral-800, #212529));
    line-height: var(--wc-line-height-normal, 1.5);
    width: 100%;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  }

  .field__select:disabled {
    cursor: not-allowed;
  }

  /* ─── Size Variants ─── */

  .field__select--sm {
    min-height: var(--wc-input-height-sm, var(--wc-size-8, 2rem));
    font-size: var(--wc-font-size-sm, 0.875rem);
  }

  .field__select--md {
    min-height: var(--wc-input-height-md, var(--wc-size-10, 2.5rem));
    font-size: var(--wc-font-size-md, 1rem);
  }

  .field__select--lg {
    min-height: var(--wc-input-height-lg, var(--wc-size-12, 3rem));
    font-size: var(--wc-font-size-lg, 1.125rem);
  }

  /* ─── Custom Chevron ─── */

  .field__chevron {
    position: absolute;
    right: var(--wc-space-3, 0.75rem);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--wc-select-chevron-color, var(--wc-color-neutral-500, #6c757d));
    pointer-events: none;
  }

  /* ─── Help Text & Error Messages ─── */

  .field__help-text {
    font-size: var(--wc-font-size-xs, 0.75rem);
    color: var(--wc-color-neutral-500, #6c757d);
    line-height: var(--wc-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--wc-font-size-xs, 0.75rem);
    color: var(--wc-select-error-color, var(--wc-color-error-500, #dc3545));
    line-height: var(--wc-line-height-normal, 1.5);
  }
`;
