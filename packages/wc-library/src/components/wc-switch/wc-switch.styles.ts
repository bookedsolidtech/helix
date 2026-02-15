import { css } from 'lit';

export const wcSwitchStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    opacity: var(--wc-opacity-disabled, 0.5);
    pointer-events: none;
  }

  * {
    box-sizing: border-box;
  }

  /* --- Layout --- */

  .switch {
    display: flex;
    flex-direction: column;
    gap: var(--wc-space-1, 0.25rem);
    font-family: var(--wc-font-family-sans, sans-serif);
  }

  .switch__control-row {
    display: flex;
    align-items: center;
    gap: var(--wc-space-2, 0.5rem);
  }

  /* --- Track --- */

  .switch__track {
    position: relative;
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    border: none;
    padding: 0;
    border-radius: var(--wc-border-radius-full, 9999px);
    background-color: var(--wc-switch-track-bg, var(--wc-color-neutral-300, #ced4da));
    cursor: pointer;
    transition: background-color var(--wc-transition-fast, 150ms ease);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .switch__track:focus-visible {
    outline: var(--wc-focus-ring-width, 2px) solid var(--wc-switch-focus-ring-color, var(--wc-focus-ring-color, #007878));
    outline-offset: var(--wc-focus-ring-offset, 2px);
  }

  .switch--checked .switch__track {
    background-color: var(--wc-switch-track-checked-bg, var(--wc-color-primary-500, #007878));
  }

  /* --- Thumb --- */

  .switch__thumb {
    position: absolute;
    border-radius: var(--wc-border-radius-full, 9999px);
    background-color: var(--wc-switch-thumb-bg, var(--wc-color-neutral-0, #ffffff));
    box-shadow: var(--wc-switch-thumb-shadow, var(--wc-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05)));
    transition: transform var(--wc-transition-fast, 150ms ease);
  }

  /* --- Size: sm (track 32x18, thumb 14px) --- */

  .switch--sm .switch__track {
    width: var(--wc-switch-track-width-sm, var(--wc-size-8, 2rem));
    height: var(--wc-switch-track-height-sm, var(--wc-size-4-5, 1.125rem));
  }

  .switch--sm .switch__thumb {
    width: var(--wc-switch-thumb-size-sm, var(--wc-size-3-5, 0.875rem));
    height: var(--wc-switch-thumb-size-sm, var(--wc-size-3-5, 0.875rem));
    top: 50%;
    left: var(--wc-switch-thumb-offset, var(--wc-space-0-5, 0.125rem));
    transform: translateY(-50%);
  }

  .switch--sm.switch--checked .switch__thumb {
    transform: translateY(-50%) translateX(var(--wc-switch-thumb-size-sm, var(--wc-size-3-5, 0.875rem)));
  }

  /* --- Size: md (track 40x22, thumb 18px) --- */

  .switch--md .switch__track {
    width: var(--wc-switch-track-width-md, var(--wc-size-10, 2.5rem));
    height: var(--wc-switch-track-height-md, var(--wc-size-5-5, 1.375rem));
  }

  .switch--md .switch__thumb {
    width: var(--wc-switch-thumb-size-md, var(--wc-size-4-5, 1.125rem));
    height: var(--wc-switch-thumb-size-md, var(--wc-size-4-5, 1.125rem));
    top: 50%;
    left: var(--wc-switch-thumb-offset, var(--wc-space-0-5, 0.125rem));
    transform: translateY(-50%);
  }

  .switch--md.switch--checked .switch__thumb {
    transform: translateY(-50%) translateX(var(--wc-switch-thumb-size-md, var(--wc-size-4-5, 1.125rem)));
  }

  /* --- Size: lg (track 48x26, thumb 22px) --- */

  .switch--lg .switch__track {
    width: var(--wc-switch-track-width-lg, var(--wc-size-12, 3rem));
    height: var(--wc-switch-track-height-lg, var(--wc-size-6-5, 1.625rem));
  }

  .switch--lg .switch__thumb {
    width: var(--wc-switch-thumb-size-lg, var(--wc-size-5-5, 1.375rem));
    height: var(--wc-switch-thumb-size-lg, var(--wc-size-5-5, 1.375rem));
    top: 50%;
    left: var(--wc-switch-thumb-offset, var(--wc-space-0-5, 0.125rem));
    transform: translateY(-50%);
  }

  .switch--lg.switch--checked .switch__thumb {
    transform: translateY(-50%) translateX(var(--wc-switch-thumb-size-lg, var(--wc-size-5-5, 1.375rem)));
  }

  /* --- Label --- */

  .switch__label {
    font-size: var(--wc-font-size-sm, 0.875rem);
    font-weight: var(--wc-font-weight-medium, 500);
    color: var(--wc-switch-label-color, var(--wc-color-neutral-700, #343a40));
    line-height: var(--wc-line-height-normal, 1.5);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }

  .switch__required-marker {
    color: var(--wc-switch-error-color, var(--wc-color-error-500, #dc3545));
    font-weight: var(--wc-font-weight-bold, 700);
  }

  /* --- Help Text & Error --- */

  .switch__help-text {
    font-size: var(--wc-font-size-xs, 0.75rem);
    color: var(--wc-color-neutral-500, #6c757d);
    line-height: var(--wc-line-height-normal, 1.5);
  }

  .switch__error {
    font-size: var(--wc-font-size-xs, 0.75rem);
    color: var(--wc-switch-error-color, var(--wc-color-error-500, #dc3545));
    line-height: var(--wc-line-height-normal, 1.5);
  }
`;
