import { css } from 'lit';

export const helixComboboxStyles = css`
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

  /* ─── Field Container ─── */

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    font-family: var(--hx-combobox-font-family, var(--hx-font-family-sans, sans-serif));
    position: relative;
  }

  /* ─── Label ─── */

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-combobox-label-color, var(--hx-color-neutral-700, #343a40));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--hx-combobox-error-color, var(--hx-color-error-500, #dc3545));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Input Wrapper ─── */

  .field__input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-combobox-border-color, var(--hx-color-neutral-300, #ced4da));
    border-radius: var(--hx-combobox-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-combobox-bg, var(--hx-color-neutral-0, #ffffff));
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
  }

  .field__input-wrapper:focus-within {
    border-color: var(--hx-combobox-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-combobox-focus-ring-color, var(--hx-focus-ring-color, #2563eb))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  .field--error .field__input-wrapper {
    border-color: var(--hx-combobox-error-color, var(--hx-color-error-500, #dc3545));
  }

  .field--error .field__input-wrapper:focus-within {
    border-color: var(--hx-combobox-error-color, var(--hx-color-error-500, #dc3545));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-combobox-error-color, var(--hx-color-error-500, #dc3545))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* ─── Prefix / Suffix Slots ─── */

  .field__prefix,
  .field__suffix {
    display: flex;
    align-items: center;
    padding: 0 var(--hx-space-2, 0.5rem);
    color: var(--hx-color-neutral-500, #6c757d);
    flex-shrink: 0;
  }

  /* ─── Text Input ─── */

  .field__input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
    font-family: inherit;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: var(--hx-line-height-normal, 1.5);
    color: var(--hx-combobox-color, var(--hx-color-neutral-800, #212529));
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
  }

  .field__input::placeholder {
    color: var(--hx-color-neutral-400, #adb5bd);
  }

  /* ─── Input size variants ─── */

  .field__input--sm {
    min-height: var(--hx-input-height-sm, var(--hx-size-8, 2rem));
    font-size: var(--hx-font-size-sm, 0.875rem);
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-3, 0.75rem);
  }

  .field__input--md {
    min-height: var(--hx-input-height-md, var(--hx-size-10, 2.5rem));
    font-size: var(--hx-font-size-md, 1rem);
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
  }

  .field__input--lg {
    min-height: var(--hx-input-height-lg, var(--hx-size-12, 3rem));
    font-size: var(--hx-font-size-lg, 1.125rem);
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem);
  }

  /* ─── Clear Button ─── */

  .field__clear-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    margin-inline-end: var(--hx-space-2, 0.5rem);
    flex-shrink: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    color: var(--hx-color-neutral-400, #adb5bd);
    border-radius: var(--hx-border-radius-full, 9999px);
    transition: color var(--hx-transition-fast, 150ms ease);
  }

  .field__clear-button:hover {
    color: var(--hx-color-neutral-700, #343a40);
  }

  .field__clear-button:focus-visible {
    outline: 2px solid var(--hx-combobox-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: 1px;
  }

  /* ─── Loading Indicator ─── */

  .field__loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    margin-inline-end: var(--hx-space-2, 0.5rem);
    flex-shrink: 0;
    color: var(--hx-color-neutral-400, #adb5bd);
  }

  .field__loading-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: hx-spin 0.7s linear infinite;
  }

  @keyframes hx-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .field__loading-spinner {
      animation: none;
    }
  }

  /* ─── Listbox Panel ─── */

  .field__listbox {
    position: absolute;
    top: calc(100% + var(--hx-space-1, 0.25rem));
    left: 0;
    right: 0;
    z-index: var(--hx-z-index-dropdown, 100);
    background-color: var(--hx-combobox-listbox-bg, var(--hx-color-neutral-0, #ffffff));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-combobox-border-color, var(--hx-color-neutral-300, #ced4da));
    border-radius: var(--hx-combobox-border-radius, var(--hx-border-radius-md, 0.375rem));
    box-shadow: var(
      --hx-combobox-listbox-shadow,
      0 4px 16px color-mix(in srgb, var(--hx-color-neutral-900, #0d1117) 12%, transparent)
    );
    max-height: var(--hx-combobox-listbox-max-height, 16rem);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .field__listbox[hidden] {
    display: none;
  }

  /* ─── Options Container ─── */

  .field__options {
    overflow-y: auto;
    flex: 1;
    padding: var(--hx-space-1, 0.25rem) 0;
  }

  /* ─── Individual Options ─── */

  .field__option {
    display: flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    font-size: var(--hx-font-size-md, 1rem);
    color: var(--hx-combobox-color, var(--hx-color-neutral-800, #212529));
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    transition: background-color var(--hx-transition-fast, 150ms ease);
  }

  .field__option:hover {
    background-color: var(--hx-combobox-option-hover-bg, var(--hx-color-primary-50, #eff6ff));
  }

  .field__option--selected {
    background-color: var(--hx-combobox-option-selected-bg, var(--hx-color-primary-100, #dbeafe));
    font-weight: var(--hx-font-weight-medium, 500);
  }

  .field__option--focused {
    background-color: var(--hx-combobox-option-hover-bg, var(--hx-color-primary-50, #eff6ff));
    outline: 2px solid var(--hx-combobox-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: -2px;
  }

  .field__option--focused.field__option--selected {
    background-color: var(--hx-combobox-option-selected-bg, var(--hx-color-primary-100, #dbeafe));
  }

  .field__option--disabled {
    opacity: var(--hx-opacity-disabled, 0.5);
    cursor: not-allowed;
    pointer-events: none;
  }

  .field__option-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ─── No Options / Empty State ─── */

  .field__no-options {
    padding: var(--hx-space-3, 0.75rem);
    text-align: center;
    color: var(--hx-color-neutral-400, #adb5bd);
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  /* ─── Help Text & Error Messages ─── */

  .field__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-neutral-500, #6c757d);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-combobox-error-color, var(--hx-color-error-500, #dc3545));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .field__input-wrapper,
    .field__option {
      transition: none;
    }
  }
`;
