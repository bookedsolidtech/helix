import { css } from 'lit';

export const helixSelectStyles = css`
  /* ─── 3-tier token cascade: component → semantic → hardcoded fallback ─── */
  :host {
    display: block;
    /* Round-3 finding 1: host is the canonical combobox surface, so it owns
       keyboard focus. Suppress the UA default outline; the custom focus ring
       is painted on the inner trigger via :host(:focus-visible)
       .field__trigger so visual feedback follows the host's focus state. */
    outline: none;

    /* Background & foreground */
    --_bg: var(--hx-select-bg, var(--hx-color-surface-default, #ffffff));
    --_color: var(--hx-select-color, var(--hx-color-text-strong, #202b39));
    --_placeholder-color: var(
      --hx-select-placeholder-color,
      var(--hx-color-text-placeholder, #66787b)
    );

    /* Label */
    --_label-color: var(--hx-select-label-color, var(--hx-color-text-strong, #202b39));

    /* Border */
    --_border-color: var(--hx-select-border-color, var(--hx-color-border-strong, #66787b));
    --_border-radius: var(--hx-select-border-radius, var(--hx-border-radius-md, 0.375rem));

    /* Focus ring */
    --_focus-ring-color: var(--hx-select-focus-ring-color, var(--hx-focus-ring-color, #0f7078));

    /* Error */
    --_error-color: var(--hx-select-error-color, var(--hx-color-error-500, #e5493e));

    /* Chevron */
    --_chevron-color: var(--hx-select-chevron-color, var(--hx-color-text-muted, #4a5362));
    --_chevron-size: var(--hx-select-chevron-size, 0.5rem);

    /* Listbox */
    --_listbox-bg: var(--hx-select-listbox-bg, var(--hx-color-surface-default, #ffffff));
    --_option-hover-bg: var(--hx-select-option-hover-bg, var(--hx-color-primary-50, #ebf8f8));
    --_option-selected-bg: var(
      --hx-select-option-selected-bg,
      var(--hx-color-primary-100, #dbf0f0)
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
    color: var(--hx-select-error-color, var(--hx-color-error-text, #c92a2a));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  .field__select-wrapper {
    position: relative;
    display: block;
  }

  .field__trigger {
    /* Round-3 finding 1 / CodeRabbit F1: trigger is a <button type="button">
       (labelable) so native <label for> click activation works for mouse
       users. Reset native button chrome before applying field styles. */
    appearance: none;
    -webkit-appearance: none;
    margin: 0;
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
    font: inherit;
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

  /* Round-3 finding 1: host is the canonical focusable surface. Both the
     :host(:focus-visible) descendant selector AND the legacy
     .field__trigger:focus-visible (kept for forced-colors regression test
     parity) paint the focus ring on the visual trigger. */
  :host(:focus-visible) .field__trigger,
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

  :host(:focus-visible) .field--error .field__trigger,
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
    outline: var(--hx-focus-ring-width, 2px) solid var(--_focus-ring-color);
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
    color: var(--hx-color-text-muted, #4a5362);
  }

  .field__error {
    color: var(--hx-select-error-color, var(--hx-color-error-text, #c92a2a));
  }

  @media (prefers-reduced-motion: reduce) {
    .field__trigger,
    .field__chevron,
    .field__option {
      transition: none;
    }
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .field__trigger {
      forced-color-adjust: none;
      background-color: Field;
      color: FieldText;
      border: 2px solid ButtonText;
    }

    :host(:focus-visible) .field__trigger,
    .field__trigger:focus-visible {
      outline: 3px solid Highlight;
      outline-offset: 2px;
      box-shadow: none;
    }

    .field__trigger[aria-disabled='true'] {
      color: GrayText;
      border-color: GrayText;
    }

    .field__trigger--placeholder .field__trigger-value {
      color: GrayText;
    }

    .field__chevron::after {
      border-color: FieldText;
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

    .field--error .field__trigger {
      border-color: LinkText;
    }

    :host([disabled]) {
      opacity: 1;
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
