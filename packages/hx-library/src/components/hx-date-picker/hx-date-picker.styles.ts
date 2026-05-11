import { css } from 'lit';

export const helixDatePickerStyles = css`
  /* ============================================================
     Host
     ============================================================ */

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

  /* ============================================================
     Field layout
     ============================================================ */

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    font-family: var(--hx-date-picker-font-family, var(--hx-font-family-sans, sans-serif));
    position: relative;
  }

  .field__label-wrapper {
    display: contents;
  }

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-date-picker-label-color, var(--hx-color-text-strong, #202b39));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--hx-date-picker-error-color, var(--hx-color-error-text, #c92a2a));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ============================================================
     Input wrapper
     ============================================================ */

  .field__input-wrapper {
    display: flex;
    align-items: stretch;
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-date-picker-border-color, var(--hx-color-border-strong, #66787b));
    border-radius: var(--hx-date-picker-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-date-picker-bg, var(--hx-color-surface-default, #ffffff));
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    overflow: hidden;
  }

  .field__input-wrapper:focus-within {
    border-color: var(--hx-date-picker-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-date-picker-focus-ring-color, var(--hx-focus-ring-color, #0f7078))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  .field--error .field__input-wrapper {
    border-color: var(--hx-date-picker-error-color, var(--hx-color-error-500, #e5493e));
  }

  .field--error .field__input-wrapper:focus-within {
    border-color: var(--hx-date-picker-error-color, var(--hx-color-error-500, #e5493e));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--hx-date-picker-error-color, var(--hx-color-error-500, #e5493e))
          calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* ============================================================
     Input element
     ============================================================ */

  .field__input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    font-family: inherit;
    font-size: var(--hx-font-size-md, 1rem);
    color: var(--hx-date-picker-color, var(--hx-color-text-strong, #202b39));
    line-height: var(--hx-line-height-normal, 1.5);
    /* WCAG 2.5.5 (Enhanced) AAA — primary input surface must meet 44×44. */
    min-height: var(--hx-touch-target-min, 2.75rem);
    width: 100%;
    cursor: default;
  }

  .field__input::placeholder {
    color: var(--hx-color-text-placeholder, #66787b);
  }

  .field__input:disabled {
    cursor: not-allowed;
  }

  /* ============================================================
     Calendar trigger button
     ============================================================ */

  .field__trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    /* WCAG 2.5.5 (Enhanced) AAA — calendar trigger must clear 44×44.
       Without min-width the icon button collapses to ~41 px wide. */
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
    padding: 0 var(--hx-space-3, 0.75rem);
    border: none;
    border-left: var(--hx-border-width-thin, 1px) solid
      var(--hx-date-picker-border-color, var(--hx-color-border-strong, #66787b));
    background: transparent;
    color: var(--hx-date-picker-trigger-color, var(--hx-color-text-muted, #4a5362));
    cursor: pointer;
    flex-shrink: 0;
    transition: color var(--hx-transition-fast, 150ms ease);
    outline: none;
  }

  .field__trigger:focus-visible {
    color: var(--hx-date-picker-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    background-color: color-mix(
      in srgb,
      var(--hx-date-picker-focus-ring-color, var(--hx-focus-ring-color, #0f7078)) 8%,
      transparent
    );
  }

  .field__trigger:hover:not(:disabled) {
    color: var(--hx-date-picker-trigger-hover-color, var(--hx-color-text-strong, #202b39));
    background-color: color-mix(in srgb, var(--hx-color-neutral-900, #0d1825) 4%, transparent);
  }

  .field__trigger:disabled {
    cursor: not-allowed;
  }

  /* ============================================================
     Calendar popover
     ============================================================ */

  .calendar {
    position: absolute;
    top: calc(100% + var(--hx-space-1, 0.25rem));
    left: 0;
    z-index: var(--hx-z-index-dropdown, 1000);
    min-width: var(--hx-date-picker-calendar-min-width, 18rem);
    background-color: var(--hx-date-picker-calendar-bg, var(--hx-color-surface-default, #ffffff));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-date-picker-calendar-border-color, var(--hx-color-border-default, #d6dbd5));
    border-radius: var(--hx-date-picker-calendar-border-radius, var(--hx-border-radius-lg, 0.5rem));
    box-shadow: var(
      --hx-date-picker-calendar-shadow,
      var(--hx-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1))
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
    0% {
      opacity: 0;
      transform: translateY(-0.25rem);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ============================================================
     Calendar navigation
     ============================================================ */

  .calendar__nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--hx-space-3, 0.75rem);
  }

  :is(.calendar__nav-btn, .calendar__day, .calendar__day-cell, .calendar__weekday) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :is(.calendar__nav-btn, .calendar__day) {
    width: var(--hx-touch-target-min, 2.75rem);
    height: var(--hx-touch-target-min, 2.75rem);
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    cursor: pointer;
    outline: none;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease);
  }

  .calendar__nav-btn {
    color: var(--hx-color-text-secondary, #313e4b);
    font-size: var(--hx-font-size-lg, 1.125rem);
    line-height: 1;
  }

  .calendar__nav-btn:hover {
    background-color: var(--hx-date-picker-day-hover-bg, var(--hx-color-surface-sunken, #ebeee9));
    color: var(--hx-color-text-primary, #0d1825);
  }

  :is(.calendar__nav-btn, .calendar__day):focus-visible {
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      var(--hx-date-picker-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    z-index: 1;
  }

  .calendar__nav-btn:disabled {
    opacity: var(--hx-opacity-disabled, 0.5);
    cursor: not-allowed;
    pointer-events: none;
  }

  .calendar__month-label {
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    color: var(--hx-color-text-strong, #202b39);
    flex: 1;
    text-align: center;
  }

  /* ============================================================
     Calendar grid
     ============================================================ */

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
    height: var(--hx-size-8, 2rem);
    font-size: var(--hx-font-size-xs, 0.75rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    color: var(--hx-color-text-muted, #4a5362);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ============================================================
     Calendar day cells
     ============================================================ */

  .calendar__day {
    color: var(--hx-color-text-strong, #202b39);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-family: inherit;
    position: relative;
  }

  .calendar__day:hover:not(.calendar__day--disabled):not(.calendar__day--selected) {
    background-color: var(--hx-date-picker-day-hover-bg, var(--hx-color-surface-sunken, #ebeee9));
    color: var(--hx-color-text-primary, #0d1825);
  }

  .calendar__day--selected {
    background-color: var(--hx-date-picker-selected-bg, var(--hx-color-action-primary-bg, #0f7078));
    color: var(--hx-date-picker-selected-color, var(--hx-color-text-on-primary, #ffffff));
    font-weight: var(--hx-font-weight-semibold, 600);
  }

  .calendar__day--selected:hover {
    background-color: var(
      --hx-date-picker-selected-hover-bg,
      var(--hx-color-action-primary-bg-hover, #0f6363)
    );
  }

  .calendar__day--today:not(.calendar__day--selected) {
    font-weight: var(--hx-font-weight-bold, 700);
    color: var(--hx-date-picker-today-color, var(--hx-color-primary-600, #0f7078));
  }

  .calendar__day--today:not(.calendar__day--selected)::after {
    content: '';
    position: absolute;
    bottom: 0.2rem;
    left: 50%;
    transform: translate(-50%);
    width: 0.25rem;
    height: 0.25rem;
    border-radius: 50%;
    background-color: currentColor;
  }

  .calendar__day--disabled {
    opacity: var(--hx-opacity-disabled, 0.5);
    cursor: not-allowed;
    pointer-events: none;
  }

  /* ============================================================
     Live region (screen reader announcements)
     ============================================================ */

  .calendar__live-region,
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

  /* ============================================================
     Help text and error message
     ============================================================ */

  .field__help-text,
  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__help-text {
    color: var(--hx-color-text-muted, #4a5362);
  }

  .field__error {
    color: var(--hx-date-picker-error-color, var(--hx-color-error-text, #c92a2a));
  }

  /* ============================================================
     Reduced motion
     ============================================================ */

  @media (prefers-reduced-motion: reduce) {
    .field__input-wrapper,
    .field__trigger,
    .calendar__nav-btn,
    .calendar__day {
      transition: none;
    }
  }

  /* ============================================================
     Forced colors (Windows High Contrast)
     ============================================================ */

  @media (forced-colors: active) {
    .field__input-wrapper {
      border: 1px solid ButtonText;
    }

    .field__input-wrapper:focus-within {
      outline: 2px solid Highlight;
      outline-offset: 1px;
      box-shadow: none;
    }

    :is(.calendar__day:focus-visible, .calendar__nav-btn:focus-visible) {
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

    .field--error .field__input-wrapper {
      border-color: LinkText;
    }
  }

  /* hx-icon glyph sizing for the migrated calendar trigger SVG. */
  .field__trigger-glyph {
    --hx-icon-size: 16px;
  }
`;
