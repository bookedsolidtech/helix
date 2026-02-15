import { css } from 'lit';

export const helixSelectStyles = css`
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
    font-family: var(--hx-select-font-family, var(--hx-font-family-sans, sans-serif));
  }

  /* ─── Label ─── */

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-select-label-color, var(--hx-color-neutral-700, #343a40));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--hx-select-error-color, var(--hx-color-error-500, #dc3545));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Select Wrapper ─── */

  .field__select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    border: var(--hx-border-width-thin, 1px) solid var(--hx-select-border-color, var(--hx-color-neutral-300, #ced4da));
    border-radius: var(--hx-select-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-select-bg, var(--hx-color-neutral-0, #ffffff));
    transition: border-color var(--hx-transition-fast, 150ms ease),
                box-shadow var(--hx-transition-fast, 150ms ease);
    overflow: hidden;
  }

  .field__select-wrapper:focus-within {
    border-color: var(--hx-select-focus-ring-color, var(--hx-focus-ring-color, #007878));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px) color-mix(in srgb, var(--hx-select-focus-ring-color, var(--hx-focus-ring-color, #007878)) calc(var(--hx-focus-ring-opacity, 0.25) * 100%), transparent);
  }

  /* ─── Error State ─── */

  .field--error .field__select-wrapper {
    border-color: var(--hx-select-error-color, var(--hx-color-error-500, #dc3545));
  }

  .field--error .field__select-wrapper:focus-within {
    border-color: var(--hx-select-error-color, var(--hx-color-error-500, #dc3545));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px) color-mix(in srgb, var(--hx-select-error-color, var(--hx-color-error-500, #dc3545)) calc(var(--hx-focus-ring-opacity, 0.25) * 100%), transparent);
  }

  /* ─── Native Select ─── */

  .field__select {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-8, 2rem) var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    font-family: inherit;
    font-size: var(--hx-font-size-md, 1rem);
    color: var(--hx-select-color, var(--hx-color-neutral-800, #212529));
    line-height: var(--hx-line-height-normal, 1.5);
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
    min-height: var(--hx-input-height-sm, var(--hx-size-8, 2rem));
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  .field__select--md {
    min-height: var(--hx-input-height-md, var(--hx-size-10, 2.5rem));
    font-size: var(--hx-font-size-md, 1rem);
  }

  .field__select--lg {
    min-height: var(--hx-input-height-lg, var(--hx-size-12, 3rem));
    font-size: var(--hx-font-size-lg, 1.125rem);
  }

  /* ─── Custom Chevron ─── */

  .field__chevron {
    position: absolute;
    right: var(--hx-space-3, 0.75rem);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--hx-select-chevron-color, var(--hx-color-neutral-500, #6c757d));
    pointer-events: none;
  }

  /* ─── Help Text & Error Messages ─── */

  .field__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-neutral-500, #6c757d);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-select-error-color, var(--hx-color-error-500, #dc3545));
    line-height: var(--hx-line-height-normal, 1.5);
  }
`;
