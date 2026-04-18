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
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    font-family: var(--hx-combobox-font-family, var(--hx-font-family-sans, sans-serif));
    position: relative;
  }
  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-combobox-label-color, var(--hx-color-neutral-700, #334155));
    line-height: var(--hx-line-height-normal, 1.5);
  }
  .field__required-marker {
    color: var(--hx-combobox-error-color, var(--hx-color-error-text, #b91c1c));
    font-weight: var(--hx-font-weight-bold, 700);
  }
  .field__input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-combobox-border-color, var(--hx-color-neutral-300, #cbd5e1));
    border-radius: var(--hx-combobox-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-combobox-bg, var(--hx-color-neutral-0, #ffffff));
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
  }
  .field__input-wrapper:focus-within {
    border-color: var(
      --hx-combobox-focus-ring-color,
      var(--hx-focus-ring-color, var(--hx-color-primary-400, #60a5fa))
    );
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(
            --hx-combobox-focus-ring-color,
            var(--hx-focus-ring-color, var(--hx-color-primary-400, #60a5fa))
          )
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }
  .field--error .field__input-wrapper {
    border-color: var(--hx-combobox-error-color, var(--hx-color-error-500, #dc2626));
  }
  .field--error .field__input-wrapper:focus-within {
    border-color: var(--hx-combobox-error-color, var(--hx-color-error-500, #dc2626));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-combobox-error-color, var(--hx-color-error-500, #dc2626))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }
  .field__prefix,
  .field__suffix {
    display: flex;
    align-items: center;
    padding: 0 var(--hx-space-2, 0.5rem);
    color: var(--hx-color-neutral-500, #64748b);
    flex-shrink: 0;
  }
  .field__input {
    flex: 1;
    min-width: 0;
    min-height: var(--hx-input-height-md, var(--hx-size-10, 2.5rem));
    border: none;
    background: transparent;
    outline: none;
    font-family: inherit;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: var(--hx-line-height-normal, 1.5);
    color: var(--hx-combobox-color, var(--hx-color-neutral-800, #1e293b));
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
  }
  .field__input::placeholder {
    color: var(--hx-color-neutral-400, #94a3b8);
  }
  .field__input--sm {
    min-height: var(--hx-input-height-sm, var(--hx-size-8, 2rem));
    font-size: var(--hx-font-size-sm, 0.875rem);
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-3, 0.75rem);
  }
  .field__input--lg {
    min-height: var(--hx-input-height-lg, var(--hx-size-12, 3rem));
    font-size: var(--hx-font-size-lg, 1.125rem);
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem);
  }
  .field__clear-button,
  .field__loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-inline-end: var(--hx-space-2, 0.5rem);
    flex-shrink: 0;
    color: var(--hx-color-neutral-400, #94a3b8);
  }
  .field__clear-button {
    width: 1.25rem;
    height: 1.25rem;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    border-radius: var(--hx-border-radius-full, 9999px);
    transition: color var(--hx-transition-fast, 150ms ease);
  }
  .field__clear-button:hover {
    color: var(--hx-color-neutral-700, #334155);
  }
  .field__clear-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-combobox-focus-ring-color, var(--hx-focus-ring-color, var(--hx-color-primary-500)));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }
  .field__loading-indicator {
    width: 1rem;
    height: 1rem;
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
  .field__listbox {
    position: absolute;
    top: calc(100% + var(--hx-space-1, 0.25rem));
    left: 0;
    right: 0;
    z-index: var(--hx-z-index-dropdown, 1000);
    background-color: var(--hx-combobox-listbox-bg, var(--hx-color-neutral-0, #ffffff));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-combobox-border-color, var(--hx-color-neutral-300, #cbd5e1));
    border-radius: var(--hx-combobox-border-radius, var(--hx-border-radius-md, 0.375rem));
    box-shadow: var(
      --hx-combobox-listbox-shadow,
      0 4px 16px color-mix(in srgb, var(--hx-color-neutral-900, #0f172a) 12%, transparent)
    );
    max-height: var(--hx-combobox-listbox-max-height, 16rem);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .field__listbox[hidden] {
    display: none;
  }
  .field__options {
    overflow-y: auto;
    flex: 1;
    padding: var(--hx-space-1, 0.25rem) 0;
  }
  .field__option {
    display: flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    font-size: var(--hx-font-size-md, 1rem);
    color: var(--hx-combobox-color, var(--hx-color-neutral-800, #1e293b));
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
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-combobox-focus-ring-color, var(--hx-focus-ring-color, var(--hx-color-primary-500)));
    outline-offset: var(--hx-combobox-option-focus-ring-offset, -2px);
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
  .field__no-options {
    padding: var(--hx-space-3, 0.75rem);
    text-align: center;
    color: var(--hx-color-neutral-400, #94a3b8);
    font-size: var(--hx-font-size-sm, 0.875rem);
  }
  .field__sr-only {
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
  .field__help-text,
  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    line-height: var(--hx-line-height-normal, 1.5);
  }
  .field__help-text {
    color: var(--hx-color-neutral-500, #64748b);
  }
  .field__error {
    color: var(--hx-combobox-error-color, var(--hx-color-error-text, #b91c1c));
  }
  @media (prefers-reduced-motion: reduce) {
    .field__input-wrapper,
    .field__option,
    .field__clear-button,
    .field__chip-remove {
      transition: none;
    }
  }
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
    .field__listbox {
      forced-color-adjust: none;
      background-color: Canvas;
      border: 2px solid CanvasText;
      box-shadow: none;
    }
    .field__option {
      color: CanvasText;
    }
    .field__option:hover {
      background-color: Highlight;
      color: HighlightText;
    }
    .field__option--selected {
      background-color: Highlight;
      color: HighlightText;
    }
    .field__option--focused {
      outline-color: Highlight;
      background-color: Highlight;
      color: HighlightText;
    }
    .field__option--disabled {
      color: GrayText;
      opacity: 1;
    }
    .field__chip {
      forced-color-adjust: none;
      background-color: Highlight;
      color: HighlightText;
      border: 1px solid HighlightText;
    }
    .field__chip-remove:focus-visible {
      outline-color: Highlight;
    }
    .field__clear-button:focus-visible {
      outline-color: Highlight;
    }
    .field--error .field__input-wrapper {
      border-color: LinkText;
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
  :host([multiple]) .field__input-wrapper {
    flex-wrap: wrap;
    padding: var(--hx-space-1, 0.25rem);
    gap: var(--hx-space-1, 0.25rem);
    align-items: center;
  }
  :host([multiple]) .field__input {
    min-width: 8rem;
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
    flex-shrink: 1;
  }
  .field__chip {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-1, 0.25rem);
    padding: 0 var(--hx-space-1, 0.25rem) 0 var(--hx-space-2, 0.5rem);
    height: 1.5rem;
    background-color: var(--hx-combobox-chip-bg, var(--hx-color-primary-100, #dbeafe));
    color: var(--hx-combobox-chip-color, var(--hx-color-primary-800, #1e3a8a));
    border-radius: var(--hx-border-radius-full, 9999px);
    font-size: var(--hx-font-size-sm, 0.875rem);
    white-space: nowrap;
    max-width: 12rem;
    flex-shrink: 0;
  }
  .field__chip-label {
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 8rem;
  }
  .field__chip-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    color: inherit;
    opacity: 0.7;
    border-radius: 50%;
    line-height: 1;
    transition: opacity var(--hx-transition-fast, 150ms ease);
  }
  .field__chip-remove:hover {
    opacity: 1;
    background-color: var(--hx-combobox-chip-remove-hover-bg, var(--hx-color-primary-200, #bfdbfe));
  }
  .field__chip-remove:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-combobox-focus-ring-color, var(--hx-focus-ring-color, var(--hx-color-primary-500)));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    opacity: 1;
  }
`;
