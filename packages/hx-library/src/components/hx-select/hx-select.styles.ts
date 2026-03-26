import { css } from 'lit';

export const helixSelectStyles = css`
  /* ─── 3-tier token cascade: component → semantic → hardcoded fallback ─── */
  :host {
    display: block;

    /* Background & foreground */
    --_bg: var(--hx-select-bg, var(--hx-color-neutral-0, #ffffff));
    --_color: var(--hx-select-color, var(--hx-color-neutral-800, #212529));
    --_placeholder-color: var(--hx-select-placeholder-color, var(--hx-color-neutral-400, #adb5bd));

    /* Label */
    --_label-color: var(--hx-select-label-color, var(--hx-color-neutral-700, #343a40));

    /* Border */
    --_border-color: var(--hx-select-border-color, var(--hx-color-neutral-300, #ced4da));
    --_border-radius: var(--hx-select-border-radius, var(--hx-border-radius-md, 0.375rem));

    /* Focus ring */
    --_focus-ring-color: var(
      --hx-select-focus-ring-color,
      var(--hx-focus-ring-color, var(--hx-color-primary-400, #60a5fa))
    );

    /* Error */
    --_error-color: var(--hx-select-error-color, var(--hx-color-error-500, #dc3545));

    /* Chevron */
    --_chevron-color: var(--hx-select-chevron-color, var(--hx-color-neutral-500, #6c757d));
    --_chevron-size: var(--hx-select-chevron-size, 0.5rem);

    /* Listbox */
    --_listbox-bg: var(--hx-select-listbox-bg, var(--hx-color-neutral-0, #ffffff));
    --_option-hover-bg: var(--hx-select-option-hover-bg, var(--hx-color-primary-50, #eff6ff));
    --_option-selected-bg: var(
      --hx-select-option-selected-bg,
      var(--hx-color-primary-100, #dbeafe)
    );

    /* Typography */
    --_font-family: var(--hx-select-font-family, var(--hx-font-family-sans, sans-serif));
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
    font-family: var(--_font-family);
    position: relative;
  }

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--_label-color);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--hx-select-error-color, var(--hx-color-error-text, #b91c1c));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  .field__select-wrapper {
    position: relative;
    display: block;
  }

  .field__trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--hx-space-2, 0.5rem);
    width: 100%;
    min-height: var(--hx-input-height-md, var(--hx-size-10, 2.5rem));
    border: var(--hx-border-width-thin, 1px) solid var(--_border-color);
    border-radius: var(--_border-radius);
    background-color: var(--_bg);
    color: var(--_color);
    font-family: inherit;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: var(--hx-line-height-normal, 1.5);
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    cursor: pointer;
    text-align: start;
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    outline: none;
  }

  .field__trigger:focus,
  .field__trigger:focus-visible {
    border-color: var(--_focus-ring-color);
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--_focus-ring-color) calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  .field__trigger[aria-disabled='true'] {
    cursor: not-allowed;
  }

  .field__trigger--sm {
    min-height: var(--hx-input-height-sm, var(--hx-size-8, 2rem));
    font-size: var(--hx-font-size-sm, 0.875rem);
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-3, 0.75rem);
  }

  .field__trigger--lg {
    min-height: var(--hx-input-height-lg, var(--hx-size-12, 3rem));
    font-size: var(--hx-font-size-lg, 1.125rem);
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem);
  }

  .field__trigger-value {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .field__trigger--placeholder .field__trigger-value {
    color: var(--_placeholder-color);
  }

  .field__chevron {
    flex-shrink: 0;
    width: calc(var(--_chevron-size) * 1.5);
    height: var(--_chevron-size);
    position: relative;
    color: var(--_chevron-color);
    pointer-events: none;
    transition: transform var(--hx-transition-fast, 150ms ease);
  }

  .field__chevron::after {
    content: '';
    position: absolute;
    top: 0;
    left: var(--hx-space-px, 2px);
    width: var(--_chevron-size);
    height: var(--_chevron-size);
    border-inline-end: var(--hx-border-width-thin, 1.5px) solid currentColor;
    border-bottom: var(--hx-border-width-thin, 1.5px) solid currentColor;
    transform: rotate(45deg);
  }

  .field--open .field__chevron {
    transform: rotate(180deg);
  }

  .field--error .field__trigger {
    border-color: var(--_error-color);
  }

  .field--error .field__trigger:focus,
  .field--error .field__trigger:focus-visible {
    border-color: var(--_error-color);
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      color-mix(
        in srgb,
        var(--_error-color) calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  .field__listbox {
    position: absolute;
    top: calc(100% + var(--hx-space-1, 0.25rem));
    left: 0;
    right: 0;
    z-index: var(--hx-z-index-dropdown, 1000);
    background-color: var(--_listbox-bg);
    border: var(--hx-border-width-thin, 1px) solid var(--_border-color);
    border-radius: var(--_border-radius);
    box-shadow: var(
      --hx-select-listbox-shadow,
      0 4px 16px var(--hx-overlay-neutral-12, rgba(13, 17, 23, 0.12))
    );
    max-height: var(--hx-select-listbox-max-height, 16rem);
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
    color: var(--_color);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    transition: background-color var(--hx-transition-fast, 150ms ease);
  }

  .field__option:hover {
    background-color: var(--_option-hover-bg);
  }

  .field__option--selected {
    background-color: var(--_option-selected-bg);
    font-weight: var(--hx-font-weight-medium, 500);
  }

  .field__option--focused {
    background-color: var(--_option-hover-bg);
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--_focus-ring-color, var(--hx-color-primary-500));
    outline-offset: var(--hx-select-option-focus-ring-offset, -2px);
  }

  .field__option--focused.field__option--selected {
    background-color: var(--_option-selected-bg);
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
    color: var(--_placeholder-color);
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  .field__select {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    clip: rect(0, 0, 0, 0);
  }

  .field__help-text,
  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__help-text {
    color: var(--hx-color-neutral-500, #6c757d);
  }

  .field__error {
    color: var(--hx-select-error-color, var(--hx-color-error-text, #b91c1c));
  }

  @media (prefers-reduced-motion: reduce) {
    .field__trigger,
    .field__chevron,
    .field__option {
      transition: none;
    }
  }
`;
