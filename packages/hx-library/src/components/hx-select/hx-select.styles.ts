import { css } from 'lit';

export const helixSelectStyles = css`
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

  /* ─── Field Container ─── */

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    font-family: var(--hx-select-font-family, var(--hx-font-family-sans, sans-serif));
    position: relative;
  }

  /* ─── Label ─── */

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-select-label-color, var(--hx-color-neutral-700, #343a40));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--hx-select-error-color, var(--hx-color-error-500, #dc3545));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Select Wrapper ─── */

  .field__select-wrapper {
    position: relative;
    display: block;
  }

  /* ─── Trigger Button ─── */

  .field__trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--hx-space-2, 0.5rem);
    width: 100%;
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-select-border-color, var(--hx-color-neutral-300, #ced4da));
    border-radius: var(--hx-select-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-select-bg, var(--hx-color-neutral-0, #ffffff));
    color: var(--hx-select-color, var(--hx-color-neutral-800, #212529));
    font-family: inherit;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: var(--hx-line-height-normal, 1.5);
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    cursor: pointer;
    text-align: left;
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    outline: none;
  }

  /* Fallback focus ring for environments where :focus-visible is unavailable */
  .field__trigger:focus {
    border-color: var(--hx-select-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      var(--hx-select-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
  }

  /* Enhanced focus ring with opacity via color-mix when :focus-visible is available */
  .field__trigger:focus-visible {
    border-color: var(--hx-select-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      var(--hx-select-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
  }

  @supports (color: color-mix(in srgb, red 50%, blue)) {
    .field__trigger:focus-visible {
      box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
        color-mix(
          in srgb,
          var(--hx-select-focus-ring-color, var(--hx-focus-ring-color, #2563eb))
            calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
          transparent
        );
    }
  }

  .field__trigger[aria-disabled='true'] {
    cursor: not-allowed;
  }

  /* ─── Trigger size variants ─── */

  .field__trigger--sm {
    min-height: var(--hx-input-height-sm, var(--hx-size-8, 2rem));
    font-size: var(--hx-font-size-sm, 0.875rem);
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-3, 0.75rem);
  }

  .field__trigger--md {
    min-height: var(--hx-input-height-md, var(--hx-size-10, 2.5rem));
    font-size: var(--hx-font-size-md, 1rem);
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
  }

  .field__trigger--lg {
    min-height: var(--hx-input-height-lg, var(--hx-size-12, 3rem));
    font-size: var(--hx-font-size-lg, 1.125rem);
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem);
  }

  /* ─── Trigger value ─── */

  .field__trigger-value {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .field__trigger--placeholder .field__trigger-value {
    color: var(--hx-select-placeholder-color, var(--hx-color-neutral-400, #adb5bd));
  }

  /* ─── Chevron (CSS-drawn) ─── */

  .field__chevron {
    flex-shrink: 0;
    width: 12px;
    height: 8px;
    position: relative;
    color: var(--hx-select-chevron-color, var(--hx-color-neutral-500, #6c757d));
    pointer-events: none;
    transition: transform var(--hx-transition-fast, 150ms ease);
  }

  .field__chevron::after {
    content: '';
    position: absolute;
    top: 0;
    left: 2px;
    width: 7px;
    height: 7px;
    border-right: 1.5px solid currentColor;
    border-bottom: 1.5px solid currentColor;
    transform: rotate(45deg);
  }

  .field--open .field__chevron {
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .field__chevron {
      transition: none;
    }
  }

  /* ─── Error State (trigger) ─── */

  .field--error .field__trigger {
    border-color: var(--hx-select-error-color, var(--hx-color-error-500, #dc3545));
  }

  .field--error .field__trigger:focus {
    border-color: var(--hx-select-error-color, var(--hx-color-error-500, #dc3545));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      var(--hx-select-error-color, var(--hx-color-error-500, #dc3545));
  }

  .field--error .field__trigger:focus-visible {
    border-color: var(--hx-select-error-color, var(--hx-color-error-500, #dc3545));
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      var(--hx-select-error-color, var(--hx-color-error-500, #dc3545));
  }

  @supports (color: color-mix(in srgb, red 50%, blue)) {
    .field--error .field__trigger:focus-visible {
      box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
        color-mix(
          in srgb,
          var(--hx-select-error-color, var(--hx-color-error-500, #dc3545))
            calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
          transparent
        );
    }
  }

  /* ─── Listbox Panel ─── */

  .field__listbox {
    position: absolute;
    top: calc(100% + var(--hx-space-1, 0.25rem));
    left: 0;
    right: 0;
    z-index: var(--hx-z-index-dropdown, 100);
    background-color: var(--hx-select-listbox-bg, var(--hx-color-neutral-0, #ffffff));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-select-border-color, var(--hx-color-neutral-300, #ced4da));
    border-radius: var(--hx-select-border-radius, var(--hx-border-radius-md, 0.375rem));
    box-shadow: var(--hx-select-listbox-shadow, 0 4px 16px rgba(13, 17, 23, 0.12));
    max-height: var(--hx-select-listbox-max-height, 16rem);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .field__listbox[hidden] {
    display: none;
  }

  /* ─── Options Container ─── */

  .field__options {
    overflow-y: auto;
    flex: 1;
    padding: var(--hx-space-1, 0.25rem) 0;
  }

  /* ─── Individual Options ─── */

  .field__option {
    display: flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    font-size: var(--hx-font-size-md, 1rem);
    color: var(--hx-select-color, var(--hx-color-neutral-800, #212529));
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    transition: background-color var(--hx-transition-fast, 150ms ease);
  }

  .field__option:hover {
    background-color: var(--hx-select-option-hover-bg, var(--hx-color-primary-50, #eff6ff));
  }

  .field__option--selected {
    background-color: var(--hx-select-option-selected-bg, var(--hx-color-primary-100, #dbeafe));
    font-weight: var(--hx-font-weight-medium, 500);
  }

  .field__option--focused {
    background-color: var(--hx-select-option-hover-bg, var(--hx-color-primary-50, #eff6ff));
    outline: 2px solid var(--hx-select-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: -2px;
  }

  .field__option--focused.field__option--selected {
    background-color: var(--hx-select-option-selected-bg, var(--hx-color-primary-100, #dbeafe));
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

  /* ─── No Options State ─── */

  .field__no-options {
    padding: var(--hx-space-3, 0.75rem);
    text-align: center;
    color: var(--hx-color-neutral-400, #adb5bd);
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  /* ─── Hidden native select (form participation + test compat) ─── */

  .field__select {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    clip: rect(0, 0, 0, 0);
  }

  /* ─── Size Variants (mirrored on native select for test compat) ─── */

  .field__select--sm {
    min-height: var(--hx-input-height-sm, var(--hx-size-8, 2rem));
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  .field__select--md {
    min-height: var(--hx-input-height-md, var(--hx-size-10, 2.5rem));
    font-size: var(--hx-font-size-md, 1rem);
  }

  .field__select--lg {
    min-height: var(--hx-input-height-lg, var(--hx-size-12, 3rem));
    font-size: var(--hx-font-size-lg, 1.125rem);
  }

  /* ─── Help Text & Error Messages ─── */

  .field__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-neutral-500, #6c757d);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-select-error-color, var(--hx-color-error-500, #dc3545));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .field__trigger,
    .field__option {
      transition: none;
    }
  }
`;
