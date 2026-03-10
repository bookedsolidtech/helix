import { css } from 'lit';

export const helixTextInputStyles = css`
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
    font-family: var(--hx-input-font-family, var(--hx-font-family-sans, sans-serif));
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
    color: var(--hx-input-label-color, var(--hx-color-neutral-700, #343a40));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--hx-input-error-color, var(--hx-color-error-500, #dc3545));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Input Wrapper ─── */

  .field__input-wrapper {
    display: flex;
    align-items: center;
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-input-border-color, var(--hx-color-neutral-300, #ced4da));
    border-radius: var(--hx-input-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-input-bg, var(--hx-color-neutral-0, #ffffff));
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    overflow: hidden;
  }

  .field__input-wrapper:focus-within {
    border-color: var(--hx-input-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-input-focus-ring-color, var(--hx-focus-ring-color, #2563eb))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* ─── Error State ─── */

  .field--error .field__input-wrapper {
    border-color: var(--hx-input-error-color, var(--hx-color-error-500, #dc3545));
  }

  .field--error .field__input-wrapper:focus-within {
    border-color: var(--hx-input-error-color, var(--hx-color-error-500, #dc3545));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-input-error-color, var(--hx-color-error-500, #dc3545))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* ─── Slots (Prefix / Suffix) ─── */

  .field__prefix,
  .field__suffix {
    display: flex;
    align-items: center;
    color: var(--hx-color-neutral-500, #6c757d);
    flex-shrink: 0;
  }

  /* Only add padding when slot has content — avoids phantom space on empty slots */
  .field__prefix--filled {
    padding: 0 var(--hx-space-3, 0.75rem);
  }

  .field__suffix--filled {
    padding: 0 var(--hx-space-3, 0.75rem);
  }

  /* ─── Native Input ─── */

  .field__input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    font-family: inherit;
    font-size: var(--hx-font-size-md, 1rem);
    color: var(--hx-input-color, var(--hx-color-neutral-800, #212529));
    line-height: var(--hx-line-height-normal, 1.5);
    min-height: var(--hx-size-10, 2.5rem);
    width: 100%;
  }

  .field__input::placeholder {
    color: var(--hx-color-neutral-400, #adb5bd);
  }

  .field__input:disabled {
    cursor: not-allowed;
  }

  /* ─── Size Variants ─── */

  .field--size-sm .field__input {
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
    min-height: var(--hx-size-8, 2rem);
    font-size: var(--hx-input-sm-font-size, 0.875rem);
  }

  .field--size-md .field__input {
    /* md is the default — no overrides needed */
  }

  .field--size-lg .field__input {
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem);
    min-height: var(--hx-size-12, 3rem);
    font-size: var(--hx-input-lg-font-size, 1.125rem);
  }

  /* ─── Help Text & Error Messages ─── */

  .field__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-neutral-500, #6c757d);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-input-error-color, var(--hx-color-error-500, #dc3545));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .field__input-wrapper {
      transition: none;
    }
  }
`;
