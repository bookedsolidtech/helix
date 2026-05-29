import { css } from 'lit';

export const helixTimePickerStyles = css`
  :host {
    display: block;
    position: relative;
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
    font-family: var(--hx-time-picker-font-family, var(--hx-font-family-sans, sans-serif));
  }
  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-time-picker-label-color, var(--hx-color-text-strong, #202b39));
    line-height: var(--hx-line-height-normal, 1.5);
  }
  .field__required-marker {
    color: var(--hx-time-picker-error-color, var(--hx-color-error-text, #c92a2a));
    font-weight: var(--hx-font-weight-bold, 700);
  }
  .field__combobox {
    position: relative;
    display: flex;
    align-items: center;
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-time-picker-border-color, var(--hx-color-border-strong, #66787b));
    border-radius: var(--hx-time-picker-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-time-picker-bg, var(--hx-color-surface-default, #ffffff));
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    overflow: visible;
  }
  .field__combobox:focus-within {
    border-color: var(--hx-time-picker-focus-ring-color, var(--hx-focus-ring-color));
    /* Opaque solid ring (WCAG 2.4.13 >=3:1) — follows the wrapper border-radius */
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      var(--hx-time-picker-focus-ring-color, var(--hx-focus-ring-color));
  }
  .field--error .field__combobox {
    border-color: var(--hx-time-picker-error-color, var(--hx-color-error-500, #e5493e));
  }
  .field--error .field__combobox:focus-within {
    border-color: var(--hx-time-picker-error-color, var(--hx-color-error-500, #e5493e));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      var(--hx-time-picker-error-color, var(--hx-color-error-500, #e5493e));
  }
  .field__input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    font-family: inherit;
    font-size: var(--hx-font-size-md, 1rem);
    color: var(--hx-time-picker-color, var(--hx-color-text-strong, #202b39));
    line-height: var(--hx-line-height-normal, 1.5);
    /* WCAG 2.5.5 (Enhanced) AAA — primary input surface must meet 44×44. */
    min-height: var(--hx-touch-target-min, 2.75rem);
    width: 100%;
    cursor: text;
  }
  .field__input::placeholder {
    color: var(--hx-color-text-placeholder, #66787b);
  }
  .field__input:disabled {
    cursor: not-allowed;
  }
  .field__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    padding: 0 var(--hx-space-3, 0.75rem);
    color: var(--hx-time-picker-chevron-color, var(--hx-color-text-muted, #4a5362));
    cursor: pointer;
    height: 100%;
    /* WCAG 2.5.5 (Enhanced) AAA — toggle button must meet 44×44 in
       BOTH dimensions; without min-width the icon button collapses to
       ~41 px wide and fails the matrix audit. */
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
    flex-shrink: 0;
    border-inline-start: var(--hx-border-width-thin, 1px) solid
      var(--hx-time-picker-border-color, var(--hx-color-border-strong, #66787b));
  }
  .field__toggle:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-time-picker-focus-ring-color, var(--hx-focus-ring-color));
    outline-offset: -2px;
    border-radius: 0 var(--hx-time-picker-border-radius, var(--hx-border-radius-md, 0.375rem));
  }
  .field__listbox {
    position: absolute;
    top: calc(100% + var(--hx-space-1, 0.25rem));
    inset-inline-start: 0;
    inset-inline-end: 0;
    z-index: var(--hx-z-index-dropdown, 1000);
    background-color: var(--hx-time-picker-listbox-bg, var(--hx-color-surface-default, #ffffff));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-time-picker-border-color, var(--hx-color-border-strong, #66787b));
    border-radius: var(--hx-time-picker-border-radius, var(--hx-border-radius-md, 0.375rem));
    box-shadow: var(
      --hx-time-picker-listbox-shadow,
      0 4px 16px color-mix(in srgb, var(--hx-color-neutral-900) 12%, transparent)
    );
    max-height: var(--hx-time-picker-listbox-max-height, 16rem);
    overflow-y: auto;
    padding: var(--hx-space-1, 0.25rem) 0;
    list-style: none;
    margin: 0;
  }
  @media (prefers-reduced-motion: no-preference) {
    .field__listbox {
      animation: hx-listbox-enter var(--hx-transition-fast, 150ms ease) forwards;
    }
  }
  @keyframes hx-listbox-enter {
    0% {
      opacity: 0;
      transform: translateY(-0.25rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .field__option {
    display: flex;
    align-items: center;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    font-size: var(--hx-font-size-md, 1rem);
    font-family: inherit;
    color: var(--hx-time-picker-option-color, var(--hx-color-text-strong, #202b39));
    cursor: pointer;
    transition: background-color var(--hx-transition-fast, 150ms ease);
    line-height: var(--hx-line-height-normal, 1.5);
  }
  .field__option:hover,
  .field__option--active {
    background-color: var(--hx-time-picker-option-hover-bg, var(--hx-color-primary-50, #ebf8f8));
    color: var(--hx-time-picker-option-hover-color, var(--hx-color-primary-700, #0f6363));
  }
  .field__option--selected {
    background-color: var(
      --hx-time-picker-option-selected-bg,
      var(--hx-color-primary-100, #dbf0f0)
    );
    color: var(--hx-time-picker-option-selected-color, var(--hx-color-primary-800, #07494a));
    font-weight: var(--hx-font-weight-medium, 500);
  }
  .field__option--selected.field__option--active {
    background-color: var(
      --hx-time-picker-option-selected-bg,
      var(--hx-color-primary-100, #dbf0f0)
    );
  }
  @media (prefers-reduced-motion: reduce) {
    .field__combobox,
    .field__option {
      transition: none;
    }
  }
  .field__help-text,
  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    line-height: var(--hx-line-height-normal, 1.5);
  }
  .field__help-text {
    color: var(--hx-color-text-muted, #4a5362);
  }
  .field__error {
    color: var(--hx-time-picker-error-color, var(--hx-color-error-text, #c92a2a));
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
  @media (forced-colors: active) {
    .field__combobox {
      border-color: ButtonText;
      background-color: Canvas;
    }
    .field__combobox:focus-within {
      outline: 3px solid Highlight;
      outline-offset: 0;
      box-shadow: none;
    }
    .field--error .field__combobox {
      border-color: LinkText;
    }
    .field--error .field__combobox:focus-within {
      outline-color: Highlight;
      box-shadow: none;
    }
    .field__toggle:focus-visible {
      outline: 3px solid Highlight;
      outline-offset: 0;
    }
    .field__listbox {
      border-color: ButtonText;
      background-color: Canvas;
      box-shadow: none;
    }
    .field__option:hover,
    .field__option--active {
      background-color: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
    .field__option--selected {
      background-color: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
    .field__error {
      color: LinkText;
    }
  }

  /* hx-icon glyph sizing for the migrated clock toggle icon. */
  .field__toggle-glyph {
    --hx-icon-size: 16px;
  }
`;
