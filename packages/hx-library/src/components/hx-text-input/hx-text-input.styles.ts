import { css } from 'lit';

export const helixTextInputStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled, 0.5);
    pointer-events: none;
  }

  /*
   * Attribute-based focus hooks set by FocusMixin.
   * :host([focused]) — fires whenever the component or any descendant has focus.
   * :host([focused-visible]) — fires only for keyboard-initiated focus.
   * These complement the :focus-within rules on .field__input-wrapper and are
   * exposed as theming hooks for consumers who target the host element.
   */
  :host([focused]) .field__input-wrapper {
    border-color: var(
      --hx-input-focus-ring-color,
      var(--hx-focus-ring-color, var(--hx-color-primary-400, #60a5fa))
    );
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(
            --hx-input-focus-ring-color,
            var(--hx-focus-ring-color, var(--hx-color-primary-400, #60a5fa))
          )
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  :host([focused-visible]) .field__input-wrapper {
    border-color: var(
      --hx-input-focus-ring-color,
      var(--hx-focus-ring-color, var(--hx-color-primary-400, #60a5fa))
    );
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(
            --hx-input-focus-ring-color,
            var(--hx-focus-ring-color, var(--hx-color-primary-400, #60a5fa))
          )
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
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
    color: var(--hx-input-label-color, var(--hx-color-text-strong, #334155));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--hx-input-error-color, var(--hx-color-error-text, #b91c1c));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Input Wrapper ─── */

  .field__input-wrapper {
    display: flex;
    align-items: center;
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-input-border-color, var(--hx-color-border-strong, #cbd5e1));
    border-radius: var(--hx-input-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-input-bg, var(--hx-color-surface-default, #ffffff));
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    overflow: hidden;
  }

  .field__input-wrapper:focus-within {
    border-color: var(
      --hx-input-focus-ring-color,
      var(--hx-focus-ring-color, var(--hx-color-primary-400, #60a5fa))
    );
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(
            --hx-input-focus-ring-color,
            var(--hx-focus-ring-color, var(--hx-color-primary-400, #60a5fa))
          )
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* ─── Error State ─── */

  .field--error .field__input-wrapper {
    border-color: var(--hx-input-error-color, var(--hx-color-error-500, #dc2626));
  }

  .field--error .field__input-wrapper:focus-within {
    border-color: var(--hx-input-error-color, var(--hx-color-error-500, #dc2626));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-input-error-color, var(--hx-color-error-500, #dc2626))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* ─── Slots (Prefix / Suffix) ─── */

  .field__prefix,
  .field__suffix {
    display: flex;
    align-items: center;
    color: var(--hx-color-text-muted, #64748b);
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
    color: var(--hx-input-color, var(--hx-color-text-strong, #1e293b));
    line-height: var(--hx-line-height-normal, 1.5);
    min-height: var(--hx-size-10, 2.5rem);
    width: 100%;
  }

  .field__input::placeholder {
    color: var(--hx-color-text-placeholder, #94a3b8);
  }

  .field__input:focus-visible {
    outline: none; /* wrapper ring handles keyboard focus indication */
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
    color: var(--hx-color-text-muted, #64748b);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-input-error-color, var(--hx-color-error-text, #b91c1c));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .field__input-wrapper {
      transition: none;
    }
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .field__input-wrapper {
      forced-color-adjust: none;
      background-color: Field;
      color: FieldText;
      border: 2px solid ButtonText;
    }

    .field__input {
      color: FieldText;
    }

    .field__input::placeholder {
      color: GrayText;
    }

    .field__input-wrapper:focus-within {
      border-color: Highlight;
      box-shadow: none;
    }

    .field__input:focus-visible {
      outline: 3px solid Highlight;
      outline-offset: -3px;
    }

    :host([disabled]) {
      opacity: 1;
    }

    :host([disabled]) .field__input-wrapper {
      border-color: GrayText;
      color: GrayText;
    }

    :host([disabled]) .field__input {
      color: GrayText;
    }

    .field--error .field__input-wrapper {
      border-color: LinkText;
    }

    .field__label {
      color: CanvasText;
    }

    .field__help-text {
      color: GrayText;
    }

    .field__error {
      color: LinkText;
    }
  }
`;
