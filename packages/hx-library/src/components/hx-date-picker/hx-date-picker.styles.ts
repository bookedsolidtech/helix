import { css } from 'lit';

export const helixDatePickerStyles = css`
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
    font-family: var(--hx-date-picker-font-family, var(--hx-font-family-sans, sans-serif));
    position: relative;
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
    color: var(--hx-date-picker-label-color, var(--hx-color-neutral-700, #343a40));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--hx-date-picker-error-color, var(--hx-color-error-500, #dc3545));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Input Wrapper ─── */

  .field__input-wrapper {
    display: flex;
    align-items: stretch;
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-date-picker-border-color, var(--hx-color-neutral-300, #ced4da));
    border-radius: var(--hx-date-picker-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-date-picker-bg, var(--hx-color-neutral-0, #ffffff));
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    overflow: hidden;
  }

  .field__input-wrapper:focus-within {
    border-color: var(--hx-date-picker-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-date-picker-focus-ring-color, var(--hx-focus-ring-color, #2563eb))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* ─── Error State ─── */

  .field--error .field__input-wrapper {
    border-color: var(--hx-date-picker-error-color, var(--hx-color-error-500, #dc3545));
  }

  .field--error .field__input-wrapper:focus-within {
    border-color: var(--hx-date-picker-error-color, var(--hx-color-error-500, #dc3545));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-date-picker-error-color, var(--hx-color-error-500, #dc3545))
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
    color: var(--hx-date-picker-color, var(--hx-color-neutral-800, #212529));
    line-height: var(--hx-line-height-normal, 1.5);
    min-height: var(--hx-size-10, 2.5rem);
    width: 100%;
    cursor: default;
  }

  .field__input::placeholder {
    color: var(--hx-color-neutral-400, #adb5bd);
  }

  .field__input:disabled {
    cursor: not-allowed;
  }

  /* ─── Calendar Trigger Button ─── */

  .field__trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--hx-space-3, 0.75rem);
    border: none;
    border-left: var(--hx-border-width-thin, 1px) solid
      var(--hx-date-picker-border-color, var(--hx-color-neutral-300, #ced4da));
    background: transparent;
    color: var(--hx-date-picker-trigger-color, var(--hx-color-neutral-500, #6c757d));
    cursor: pointer;
    flex-shrink: 0;
    transition: color var(--hx-transition-fast, 150ms ease);
    outline: none;
  }

  .field__trigger:focus-visible {
    color: var(--hx-date-picker-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    background-color: color-mix(
      in srgb,
      var(--hx-date-picker-focus-ring-color, var(--hx-focus-ring-color, #2563eb)) 8%,
      transparent
    );
  }

  .field__trigger:hover:not(:disabled) {
    color: var(--hx-date-picker-trigger-hover-color, var(--hx-color-neutral-700, #343a40));
    background-color: color-mix(in srgb, var(--hx-color-neutral-900, #212529) 4%, transparent);
  }

  .field__trigger:disabled {
    cursor: not-allowed;
  }

  /* ─── Calendar Popup ─── */

  .calendar {
    position: absolute;
    top: calc(100% + var(--hx-space-1, 0.25rem));
    left: 0;
    z-index: var(--hx-z-index-dropdown, 1000);
    min-width: var(--hx-date-picker-calendar-min-width, 18rem);
    background-color: var(--hx-date-picker-calendar-bg, var(--hx-color-neutral-0, #ffffff));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-date-picker-calendar-border-color, var(--hx-color-neutral-200, #e9ecef));
    border-radius: var(--hx-date-picker-calendar-border-radius, var(--hx-border-radius-lg, 0.5rem));
    box-shadow: var(
      --hx-date-picker-calendar-shadow,
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -2px rgba(0, 0, 0, 0.1)
    );
    padding: var(--hx-space-3, 0.75rem);
    outline: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    .calendar {
      animation: calendar-appear var(--hx-transition-fast, 150ms ease) forwards;
    }
  }

  @keyframes calendar-appear {
    from {
      opacity: 0;
      transform: translateY(-0.25rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ─── Month Navigation ─── */

  .calendar__nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--hx-space-3, 0.75rem);
  }

  .calendar__nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--hx-size-8, 2rem);
    height: var(--hx-size-8, 2rem);
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    color: var(--hx-color-neutral-600, #495057);
    cursor: pointer;
    font-size: var(--hx-font-size-lg, 1.125rem);
    line-height: 1;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease);
    outline: none;
  }

  .calendar__nav-btn:hover {
    background-color: var(--hx-color-neutral-100, #f8f9fa);
    color: var(--hx-color-neutral-900, #212529);
  }

  .calendar__nav-btn:focus-visible {
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      var(--hx-date-picker-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
  }

  .calendar__month-label {
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    color: var(--hx-color-neutral-800, #212529);
    flex: 1;
    text-align: center;
  }

  /* ─── Calendar Grid ─── */

  .calendar__grid {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
  }

  .calendar__row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--hx-space-1, 0.25rem);
  }

  .calendar__weekday {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--hx-size-8, 2rem);
    font-size: var(--hx-font-size-xs, 0.75rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    color: var(--hx-color-neutral-500, #6c757d);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ─── Day Cells ─── */

  .calendar__day-cell {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .calendar__day {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--hx-size-8, 2rem);
    height: var(--hx-size-8, 2rem);
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    color: var(--hx-color-neutral-800, #212529);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-family: inherit;
    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease);
    outline: none;
    position: relative;
  }

  .calendar__day:hover:not(.calendar__day--disabled):not(.calendar__day--selected) {
    background-color: var(--hx-color-neutral-100, #f8f9fa);
    color: var(--hx-color-neutral-900, #212529);
  }

  .calendar__day:focus-visible {
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      var(--hx-date-picker-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    z-index: 1;
  }

  .calendar__day--selected {
    background-color: var(--hx-date-picker-selected-bg, var(--hx-color-primary-500, #2563eb));
    color: var(--hx-date-picker-selected-color, var(--hx-color-neutral-0, #ffffff));
    font-weight: var(--hx-font-weight-semibold, 600);
  }

  .calendar__day--selected:hover {
    background-color: var(--hx-date-picker-selected-hover-bg, var(--hx-color-primary-600, #1d4ed8));
  }

  .calendar__day--today:not(.calendar__day--selected) {
    font-weight: var(--hx-font-weight-bold, 700);
    color: var(--hx-date-picker-today-color, var(--hx-color-primary-600, #1d4ed8));
  }

  .calendar__day--today:not(.calendar__day--selected)::after {
    content: '';
    position: absolute;
    bottom: 0.2rem;
    left: 50%;
    transform: translateX(-50%);
    width: 0.25rem;
    height: 0.25rem;
    border-radius: 50%;
    background-color: var(--hx-date-picker-today-color, var(--hx-color-primary-600, #1d4ed8));
  }

  .calendar__day--disabled {
    opacity: var(--hx-opacity-disabled, 0.4);
    cursor: not-allowed;
    pointer-events: none;
  }

  /* ─── Live Region ─── */

  .calendar__live-region {
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

  /* ─── Help Text & Error Messages ─── */

  .field__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-neutral-500, #6c757d);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-date-picker-error-color, var(--hx-color-error-500, #dc3545));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .calendar__nav-btn:disabled {
    opacity: var(--hx-opacity-disabled, 0.4);
    cursor: not-allowed;
    pointer-events: none;
  }

  /* ─── Forced Colors (High Contrast Mode) ─── */

  @media (forced-colors: active) {
    .field__input-wrapper {
      border: 1px solid ButtonText;
    }

    .field__input-wrapper:focus-within {
      outline: 2px solid Highlight;
      outline-offset: 1px;
      box-shadow: none;
    }

    .calendar__day:focus-visible {
      outline: 2px solid Highlight;
      box-shadow: none;
    }

    .calendar__day--selected {
      background-color: Highlight;
      color: HighlightText;
      border: 1px solid Highlight;
    }

    .calendar__day--today:not(.calendar__day--selected) {
      border: 2px solid LinkText;
    }

    .calendar__day--today:not(.calendar__day--selected)::after {
      display: none;
    }

    .calendar__day--disabled {
      color: GrayText;
    }

    .calendar__nav-btn:focus-visible {
      outline: 2px solid Highlight;
      box-shadow: none;
    }

    .field--error .field__input-wrapper {
      border-color: LinkText;
    }
  }
`;
