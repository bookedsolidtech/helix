import { css } from 'lit';

export const helixSwitchStyles = css`
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

  /* --- Layout --- */

  .switch {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    font-family: var(--hx-font-family-sans, sans-serif);
  }

  .switch__control-row {
    display: flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
  }

  /* --- Track --- */

  .switch__track {
    position: relative;
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    border: none;
    padding: 0;
    border-radius: var(--hx-border-radius-full, 9999px);
    background-color: var(--hx-switch-track-bg, var(--hx-color-neutral-300, #ced4da));
    cursor: pointer;
    transition: background-color var(--hx-transition-fast, 150ms ease);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .switch__track:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-switch-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .switch--checked .switch__track {
    background-color: var(--hx-switch-track-checked-bg, var(--hx-color-primary-500, #2563eb));
  }

  /* --- Thumb --- */

  .switch__thumb {
    position: absolute;
    border-radius: var(--hx-border-radius-full, 9999px);
    background-color: var(--hx-switch-thumb-bg, var(--hx-color-neutral-0, #ffffff));
    box-shadow: var(--hx-switch-thumb-shadow, var(--hx-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05)));
    transition: transform var(--hx-transition-fast, 150ms ease);
  }

  /* --- Size: sm (track 32x18, thumb 14px) --- */

  .switch--sm .switch__track {
    width: var(--hx-switch-track-width-sm, var(--hx-size-8, 2rem));
    height: var(--hx-switch-track-height-sm, var(--hx-size-4-5, 1.125rem));
  }

  .switch--sm .switch__thumb {
    width: var(--hx-switch-thumb-size-sm, var(--hx-size-3-5, 0.875rem));
    height: var(--hx-switch-thumb-size-sm, var(--hx-size-3-5, 0.875rem));
    top: 50%;
    left: var(--hx-switch-thumb-offset, var(--hx-space-0-5, 0.125rem));
    transform: translateY(-50%);
  }

  .switch--sm.switch--checked .switch__thumb {
    transform: translateY(-50%)
      translateX(var(--hx-switch-thumb-size-sm, var(--hx-size-3-5, 0.875rem)));
  }

  /* --- Size: md (track 40x22, thumb 18px) --- */

  .switch--md .switch__track {
    width: var(--hx-switch-track-width-md, var(--hx-size-10, 2.5rem));
    height: var(--hx-switch-track-height-md, var(--hx-size-5-5, 1.375rem));
  }

  .switch--md .switch__thumb {
    width: var(--hx-switch-thumb-size-md, var(--hx-size-4-5, 1.125rem));
    height: var(--hx-switch-thumb-size-md, var(--hx-size-4-5, 1.125rem));
    top: 50%;
    left: var(--hx-switch-thumb-offset, var(--hx-space-0-5, 0.125rem));
    transform: translateY(-50%);
  }

  .switch--md.switch--checked .switch__thumb {
    transform: translateY(-50%)
      translateX(var(--hx-switch-thumb-size-md, var(--hx-size-4-5, 1.125rem)));
  }

  /* --- Size: lg (track 48x26, thumb 22px) --- */

  .switch--lg .switch__track {
    width: var(--hx-switch-track-width-lg, var(--hx-size-12, 3rem));
    height: var(--hx-switch-track-height-lg, var(--hx-size-6-5, 1.625rem));
  }

  .switch--lg .switch__thumb {
    width: var(--hx-switch-thumb-size-lg, var(--hx-size-5-5, 1.375rem));
    height: var(--hx-switch-thumb-size-lg, var(--hx-size-5-5, 1.375rem));
    top: 50%;
    left: var(--hx-switch-thumb-offset, var(--hx-space-0-5, 0.125rem));
    transform: translateY(-50%);
  }

  .switch--lg.switch--checked .switch__thumb {
    transform: translateY(-50%)
      translateX(var(--hx-switch-thumb-size-lg, var(--hx-size-5-5, 1.375rem)));
  }

  /* --- Label --- */

  .switch__label {
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-switch-label-color, var(--hx-color-neutral-700, #343a40));
    line-height: var(--hx-line-height-normal, 1.5);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }

  .switch__required-marker {
    color: var(--hx-switch-error-color, var(--hx-color-error-text, #b91c1c));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* --- Help Text & Error --- */

  .switch__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-switch-help-text-color, var(--hx-color-neutral-500, #6c757d));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .switch__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-switch-error-color, var(--hx-color-error-text, #b91c1c));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* --- Reduced Motion --- */

  @media (prefers-reduced-motion: reduce) {
    .switch__track,
    .switch__thumb {
      transition: none;
    }
  }
`;
