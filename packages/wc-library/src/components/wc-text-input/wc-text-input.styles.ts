import { css } from 'lit';

export const wcTextInputStyles = css`
  :host {
    display: block;

    /**
     * @cssprop [--wc-input-bg=var(--wc-color-neutral-0, #ffffff)] - Input background color.
     * @cssprop [--wc-input-color=var(--wc-color-neutral-800, #212529)] - Input text color.
     * @cssprop [--wc-input-border-color=var(--wc-color-neutral-300, #ced4da)] - Input border color.
     * @cssprop [--wc-input-border-radius=var(--wc-border-radius-md, 0.375rem)] - Input border radius.
     * @cssprop [--wc-input-font-family=var(--wc-font-family-sans, sans-serif)] - Input font family.
     * @cssprop [--wc-input-focus-ring-color=var(--wc-focus-ring-color, #007878)] - Focus ring color.
     * @cssprop [--wc-input-error-color=var(--wc-color-error-500, #dc3545)] - Error state color.
     * @cssprop [--wc-input-label-color=var(--wc-color-neutral-700, #343a40)] - Label text color.
     */
  }

  :host([disabled]) {
    opacity: 0.5;
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

  /* ─── Label ─── */

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

  /* ─── Input Wrapper ─── */

  .field__input-wrapper {
    display: flex;
    align-items: center;
    border: var(--wc-border-width-thin, 1px) solid var(--wc-input-border-color, var(--wc-color-neutral-300, #ced4da));
    border-radius: var(--wc-input-border-radius, var(--wc-border-radius-md, 0.375rem));
    background-color: var(--wc-input-bg, var(--wc-color-neutral-0, #ffffff));
    transition: border-color var(--wc-transition-fast, 150ms ease),
                box-shadow var(--wc-transition-fast, 150ms ease);
    overflow: hidden;
  }

  .field__input-wrapper:focus-within {
    border-color: var(--wc-input-focus-ring-color, var(--wc-focus-ring-color, #007878));
    box-shadow: 0 0 0 var(--wc-focus-ring-width, 2px) color-mix(in srgb, var(--wc-input-focus-ring-color, var(--wc-focus-ring-color, #007878)) 25%, transparent);
  }

  /* ─── Error State ─── */

  .field--error .field__input-wrapper {
    border-color: var(--wc-input-error-color, var(--wc-color-error-500, #dc3545));
  }

  .field--error .field__input-wrapper:focus-within {
    border-color: var(--wc-input-error-color, var(--wc-color-error-500, #dc3545));
    box-shadow: 0 0 0 var(--wc-focus-ring-width, 2px) color-mix(in srgb, var(--wc-input-error-color, var(--wc-color-error-500, #dc3545)) 25%, transparent);
  }

  /* ─── Slots (Prefix / Suffix) ─── */

  .field__prefix,
  .field__suffix {
    display: flex;
    align-items: center;
    padding: 0 var(--wc-space-3, 0.75rem);
    color: var(--wc-color-neutral-500, #6c757d);
    flex-shrink: 0;
  }

  /* ─── Native Input ─── */

  .field__input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: var(--wc-space-2, 0.5rem) var(--wc-space-3, 0.75rem);
    font-family: inherit;
    font-size: var(--wc-font-size-md, 1rem);
    color: var(--wc-input-color, var(--wc-color-neutral-800, #212529));
    line-height: var(--wc-line-height-normal, 1.5);
    min-height: 2.5rem;
    width: 100%;
  }

  .field__input::placeholder {
    color: var(--wc-color-neutral-400, #adb5bd);
  }

  .field__input:disabled {
    cursor: not-allowed;
  }

  /* ─── Help Text & Error Messages ─── */

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
