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

  /* ─── Label ─── */

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-time-picker-label-color, var(--hx-color-neutral-700));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--hx-time-picker-error-color, var(--hx-color-error-500));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Combobox Wrapper ─── */

  .field__combobox {
    position: relative;
    display: flex;
    align-items: center;
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-time-picker-border-color, var(--hx-color-neutral-300));
    border-radius: var(--hx-time-picker-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-time-picker-bg, var(--hx-color-neutral-0));
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    overflow: visible;
  }

  .field__combobox:focus-within {
    border-color: var(--hx-time-picker-focus-ring-color, var(--hx-focus-ring-color));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-time-picker-focus-ring-color, var(--hx-focus-ring-color))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* ─── Error State ─── */

  .field--error .field__combobox {
    border-color: var(--hx-time-picker-error-color, var(--hx-color-error-500));
  }

  .field--error .field__combobox:focus-within {
    border-color: var(--hx-time-picker-error-color, var(--hx-color-error-500));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-time-picker-error-color, var(--hx-color-error-500))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
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
    color: var(--hx-time-picker-color, var(--hx-color-neutral-800));
    line-height: var(--hx-line-height-normal, 1.5);
    min-height: var(--hx-size-10, 2.5rem);
    width: 100%;
    cursor: text;
  }

  .field__input::placeholder {
    color: var(--hx-color-neutral-400);
  }

  .field__input:disabled {
    cursor: not-allowed;
  }

  /* ─── Toggle Button ─── */

  .field__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    padding: 0 var(--hx-space-3, 0.75rem);
    color: var(--hx-time-picker-chevron-color, var(--hx-color-neutral-500));
    cursor: pointer;
    height: 100%;
    min-height: var(--hx-size-10, 2.5rem);
    flex-shrink: 0;
    border-left: var(--hx-border-width-thin, 1px) solid
      var(--hx-time-picker-border-color, var(--hx-color-neutral-300));
  }

  .field__toggle:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-time-picker-focus-ring-color, var(--hx-focus-ring-color));
    outline-offset: -2px;
    border-radius: 0 var(--hx-time-picker-border-radius, var(--hx-border-radius-md, 0.375rem))
      var(--hx-time-picker-border-radius, var(--hx-border-radius-md, 0.375rem)) 0;
  }

  /* ─── Listbox Dropdown ─── */

  .field__listbox {
    position: absolute;
    top: calc(100% + var(--hx-space-1, 0.25rem));
    left: 0;
    right: 0;
    z-index: var(--hx-z-index-dropdown, 1000);
    background-color: var(--hx-time-picker-listbox-bg, var(--hx-color-neutral-0));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-time-picker-border-color, var(--hx-color-neutral-300));
    border-radius: var(--hx-time-picker-border-radius, var(--hx-border-radius-md, 0.375rem));
    box-shadow: var(
      --hx-time-picker-listbox-shadow,
      0 4px 16px
        color-mix(in srgb, var(--hx-color-neutral-900) 12%, transparent)
    );
    max-height: var(--hx-time-picker-listbox-max-height, 16rem);
    overflow-y: auto;
    padding: var(--hx-space-1, 0.25rem) 0;
    list-style: none;
    margin: 0;

    @media (prefers-reduced-motion: no-preference) {
      animation: hx-listbox-enter var(--hx-transition-fast, 150ms ease) forwards;
    }
  }

  @keyframes hx-listbox-enter {
    from {
      opacity: 0;
      transform: translateY(calc(-1 * var(--hx-space-1, 0.25rem)));
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ─── Option Items ─── */

  .field__option {
    display: flex;
    align-items: center;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    font-size: var(--hx-font-size-md, 1rem);
    font-family: inherit;
    color: var(--hx-time-picker-option-color, var(--hx-color-neutral-800));
    cursor: pointer;
    transition: background-color var(--hx-transition-fast, 150ms ease);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__option:hover,
  .field__option--active {
    background-color: var(
      --hx-time-picker-option-hover-bg,
      var(--hx-color-primary-50)
    );
    color: var(--hx-time-picker-option-hover-color, var(--hx-color-primary-700));
  }

  .field__option--selected {
    background-color: var(
      --hx-time-picker-option-selected-bg,
      var(--hx-color-primary-100)
    );
    color: var(
      --hx-time-picker-option-selected-color,
      var(--hx-color-primary-800)
    );
    font-weight: var(--hx-font-weight-medium, 500);
  }

  .field__option--selected.field__option--active {
    background-color: var(
      --hx-time-picker-option-selected-bg,
      var(--hx-color-primary-100)
    );
  }

  /* ─── Help Text & Error Messages ─── */

  .field__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-neutral-500);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-time-picker-error-color, var(--hx-color-error-500));
    line-height: var(--hx-line-height-normal, 1.5);
  }
`;
