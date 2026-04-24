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
    color: var(--hx-input-label-color, var(--hx-color-text-strong, #334155));
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
      var(--hx-input-border-color, var(--hx-color-border-strong, #cbd5e1));
    border-radius: var(--hx-input-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-input-bg, var(--hx-color-surface-default, #ffffff));
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    overflow: hidden;
  }

  .field__textarea-wrapper:focus-within {
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

  /* --- Error State --- */

  .field--error .field__textarea-wrapper {
    border-color: var(--hx-input-error-color, var(--hx-color-error-500, #dc2626));
  }

  .field--error .field__textarea-wrapper:focus-within {
    border-color: var(--hx-input-error-color, var(--hx-color-error-500, #dc2626));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-input-error-color, var(--hx-color-error-500, #dc2626))
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
    color: var(--hx-input-color, var(--hx-color-text-strong, #1e293b));
    line-height: var(--hx-line-height-normal, 1.5);
    min-height: var(--hx-textarea-min-height, var(--hx-size-20, 5rem));
    width: 100%;
    resize: vertical;
  }

  .field__textarea::placeholder {
    color: var(--hx-color-text-placeholder, #94a3b8);
  }

  .field__textarea:focus-visible {
    outline: none; /* wrapper ring handles keyboard focus indication */
  }

  .field__textarea:disabled {
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    .field__textarea-wrapper {
      transition: none;
    }
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
    color: var(--hx-color-text-muted, #64748b);
    line-height: var(--hx-line-height-normal, 1.5);
    text-align: end;
  }

  /* --- Visually Hidden (screen reader only) --- */

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* --- Help Text & Error Messages --- */

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

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .field__textarea-wrapper {
      forced-color-adjust: none;
      background-color: Field;
      color: FieldText;
      border: 2px solid ButtonText;
    }

    .field__textarea {
      color: FieldText;
    }

    .field__textarea::placeholder {
      color: GrayText;
    }

    .field__textarea-wrapper:focus-within {
      border-color: Highlight;
      box-shadow: none;
    }

    .field__textarea:focus-visible {
      outline: 3px solid Highlight;
      outline-offset: -3px;
    }

    :host([disabled]) {
      opacity: 1;
    }

    :host([disabled]) .field__textarea-wrapper {
      border-color: GrayText;
      color: GrayText;
    }

    :host([disabled]) .field__textarea {
      color: GrayText;
    }

    .field--error .field__textarea-wrapper {
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
