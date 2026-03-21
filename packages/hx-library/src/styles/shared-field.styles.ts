/**
 * Shared field layout styles — label, help-text, error, required marker.
 *
 * Used by form-field components (combobox, select, date-picker, time-picker)
 * to avoid duplicating identical CSS across multiple style files.
 *
 * Import alongside component-specific styles via CSSResultGroup:
 *   static override styles = [tokenStyles, sharedFieldStyles, helixMyComponentStyles];
 */
import { css } from 'lit';

export const sharedFieldStyles = css`
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
    position: relative;
  }

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__required-marker {
    font-weight: var(--hx-font-weight-bold, 700);
  }

  .field__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-color-neutral-500, #6c757d);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    line-height: var(--hx-line-height-normal, 1.5);
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
`;

/**
 * Shared listbox + option styles — used by combobox and select.
 */
export const sharedListboxStyles = css`
  .field__listbox {
    position: absolute;
    top: calc(100% + var(--hx-space-1, 0.25rem));
    left: 0;
    right: 0;
    z-index: var(--hx-z-index-dropdown, 100);
    border-radius: var(--hx-border-radius-md, 0.375rem);
    max-height: 16rem;
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
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    transition: background-color var(--hx-transition-fast, 150ms ease);
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
    color: var(--hx-color-neutral-400, #adb5bd);
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .field__option {
      transition: none;
    }
  }
`;
