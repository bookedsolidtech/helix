import { css } from 'lit';

export const helixTextareaStyles = css`
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

  /* --- Label --- */

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
    color: var(--hx-input-error-color, var(--hx-color-error-text, #b91c1c));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* --- Textarea Wrapper --- */

  .field__textarea-wrapper {
    display: flex;
    flex-direction: column;
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-input-border-color, var(--hx-color-neutral-300, #ced4da));
    border-radius: var(--hx-input-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-input-bg, var(--hx-color-neutral-0, #ffffff));
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    overflow: hidden;
  }

  .field__textarea-wrapper:focus-within {
    border-color: var(--hx-input-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    /* Solid fallback for browsers without color-mix() (Chrome < 111, Safari < 16.2) — WCAG 1.4.11 */
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      rgba(37, 99, 235, var(--hx-focus-ring-opacity, 0.25));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-input-focus-ring-color, var(--hx-focus-ring-color, #2563eb))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* --- Error State --- */

  .field--error .field__textarea-wrapper {
    border-color: var(--hx-input-error-color, var(--hx-color-error-500, #dc3545));
  }

  .field--error .field__textarea-wrapper:focus-within {
    border-color: var(--hx-input-error-color, var(--hx-color-error-500, #dc3545));
    /* Solid fallback for browsers without color-mix() — WCAG 1.4.11 */
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      rgba(220, 53, 69, var(--hx-focus-ring-opacity, 0.25));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-input-error-color, var(--hx-color-error-500, #dc3545))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* --- Native Textarea --- */

  .field__textarea {
    border: none;
    outline: none;
    background: transparent;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    font-family: inherit;
    font-size: var(--hx-font-size-md, 1rem);
    color: var(--hx-input-color, var(--hx-color-neutral-800, #212529));
    line-height: var(--hx-line-height-normal, 1.5);
    min-height: var(--hx-textarea-min-height, var(--hx-size-20, 5rem));
    width: 100%;
    resize: vertical;
  }

  .field__textarea::placeholder {
    color: var(--hx-color-neutral-400, #adb5bd);
  }

  .field__textarea:disabled {
    cursor: not-allowed;
  }

  /* --- Resize Variants --- */

  :host([resize='none']) .field__textarea {
    resize: none;
  }

  /* resize: vertical is the base default — no override needed for [resize='vertical'] */

  :host([resize='both']) .field__textarea {
    resize: both;
  }

  :host([resize='auto']) .field__textarea {
    resize: none;
    overflow: hidden;
  }

  /* --- Character Counter --- */

  .field__counter {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-neutral-500, #6c757d);
    line-height: var(--hx-line-height-normal, 1.5);
    text-align: right;
  }

  /* --- Help Text & Error Messages --- */

  .field__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-neutral-500, #6c757d);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-input-error-color, var(--hx-color-error-text, #b91c1c));
    line-height: var(--hx-line-height-normal, 1.5);
  }
`;
