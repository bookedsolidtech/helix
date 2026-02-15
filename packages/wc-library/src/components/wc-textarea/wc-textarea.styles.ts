import { css } from 'lit';

export const wcTextareaStyles = css`
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
    font-family: var(--wc-input-font-family, var(--wc-font-family-sans, sans-serif));
  }

  /* --- Label --- */

  .field__label-wrapper {
    display: contents;
  }

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--wc-space-1, 0.25rem);
    font-size: var(--wc-font-size-sm, 0.875rem);
    font-weight: var(--wc-font-weight-medium, 500);
    color: var(--wc-input-label-color, var(--wc-color-neutral-700, #343a40));
    line-height: var(--wc-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--wc-input-error-color, var(--wc-color-error-500, #dc3545));
    font-weight: var(--wc-font-weight-bold, 700);
  }

  /* --- Textarea Wrapper --- */

  .field__textarea-wrapper {
    display: flex;
    flex-direction: column;
    border: var(--wc-border-width-thin, 1px) solid var(--wc-input-border-color, var(--wc-color-neutral-300, #ced4da));
    border-radius: var(--wc-input-border-radius, var(--wc-border-radius-md, 0.375rem));
    background-color: var(--wc-input-bg, var(--wc-color-neutral-0, #ffffff));
    transition: border-color var(--wc-transition-fast, 150ms ease),
                box-shadow var(--wc-transition-fast, 150ms ease);
    overflow: hidden;
  }

  .field__textarea-wrapper:focus-within {
    border-color: var(--wc-input-focus-ring-color, var(--wc-focus-ring-color, #007878));
    box-shadow: 0 0 0 var(--wc-focus-ring-width, 2px) color-mix(in srgb, var(--wc-input-focus-ring-color, var(--wc-focus-ring-color, #007878)) calc(var(--wc-focus-ring-opacity, 0.25) * 100%), transparent);
  }

  /* --- Error State --- */

  .field--error .field__textarea-wrapper {
    border-color: var(--wc-input-error-color, var(--wc-color-error-500, #dc3545));
  }

  .field--error .field__textarea-wrapper:focus-within {
    border-color: var(--wc-input-error-color, var(--wc-color-error-500, #dc3545));
    box-shadow: 0 0 0 var(--wc-focus-ring-width, 2px) color-mix(in srgb, var(--wc-input-error-color, var(--wc-color-error-500, #dc3545)) calc(var(--wc-focus-ring-opacity, 0.25) * 100%), transparent);
  }

  /* --- Native Textarea --- */

  .field__textarea {
    border: none;
    outline: none;
    background: transparent;
    padding: var(--wc-space-2, 0.5rem) var(--wc-space-3, 0.75rem);
    font-family: inherit;
    font-size: var(--wc-font-size-md, 1rem);
    color: var(--wc-input-color, var(--wc-color-neutral-800, #212529));
    line-height: var(--wc-line-height-normal, 1.5);
    min-height: var(--wc-textarea-min-height, var(--wc-size-20, 5rem));
    width: 100%;
    resize: vertical;
  }

  .field__textarea::placeholder {
    color: var(--wc-color-neutral-400, #adb5bd);
  }

  .field__textarea:disabled {
    cursor: not-allowed;
  }

  /* --- Resize Variants --- */

  :host([resize='none']) .field__textarea {
    resize: none;
  }

  :host([resize='vertical']) .field__textarea {
    resize: vertical;
  }

  :host([resize='both']) .field__textarea {
    resize: both;
  }

  :host([resize='auto']) .field__textarea {
    resize: none;
    overflow: hidden;
  }

  /* --- Character Counter --- */

  .field__counter {
    font-size: var(--wc-font-size-xs, 0.75rem);
    color: var(--wc-color-neutral-500, #6c757d);
    line-height: var(--wc-line-height-normal, 1.5);
    text-align: right;
  }

  /* --- Help Text & Error Messages --- */

  .field__help-text {
    font-size: var(--wc-font-size-xs, 0.75rem);
    color: var(--wc-color-neutral-500, #6c757d);
    line-height: var(--wc-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--wc-font-size-xs, 0.75rem);
    color: var(--wc-input-error-color, var(--wc-color-error-500, #dc3545));
    line-height: var(--wc-line-height-normal, 1.5);
  }
`;
