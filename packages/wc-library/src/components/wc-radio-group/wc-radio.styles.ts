import { css } from 'lit';

export const wcRadioStyles = css`
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

  .radio {
    display: inline-flex;
    align-items: center;
    gap: var(--wc-space-2, 0.5rem);
    cursor: pointer;
    position: relative;
    font-family: var(--wc-font-family-sans, sans-serif);
  }

  .radio--disabled {
    cursor: not-allowed;
  }

  /* ─── Hidden Native Input ─── */

  .radio__input {
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

  /* ─── Visual Radio Circle ─── */

  .radio__control {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--wc-radio-size, var(--wc-size-5, 1.25rem));
    height: var(--wc-radio-size, var(--wc-size-5, 1.25rem));
    border: var(--wc-border-width-medium, 2px) solid var(--wc-radio-border-color, var(--wc-color-neutral-300, #ced4da));
    border-radius: var(--wc-border-radius-full, 9999px);
    background-color: var(--wc-color-neutral-0, #ffffff);
    transition: border-color var(--wc-transition-fast, 150ms ease),
                background-color var(--wc-transition-fast, 150ms ease),
                box-shadow var(--wc-transition-fast, 150ms ease);
    flex-shrink: 0;
  }

  /* ─── Inner Dot ─── */

  .radio__dot {
    width: 0;
    height: 0;
    border-radius: var(--wc-border-radius-full, 9999px);
    background-color: var(--wc-radio-dot-color, var(--wc-color-neutral-0, #ffffff));
    transition: width var(--wc-transition-fast, 150ms ease),
                height var(--wc-transition-fast, 150ms ease);
  }

  /* ─── Checked State ─── */

  .radio--checked .radio__control {
    border-color: var(--wc-radio-checked-border-color, var(--wc-color-primary-500, #007878));
    background-color: var(--wc-radio-checked-bg, var(--wc-color-primary-500, #007878));
  }

  .radio--checked .radio__dot {
    width: calc(var(--wc-radio-size, var(--wc-size-5, 1.25rem)) * 0.4);
    height: calc(var(--wc-radio-size, var(--wc-size-5, 1.25rem)) * 0.4);
  }

  /* ─── Focus State ─── */

  .radio__input:focus-visible ~ .radio__control {
    outline: var(--wc-focus-ring-width, 2px) solid var(--wc-radio-focus-ring-color, var(--wc-focus-ring-color, #007878));
    outline-offset: var(--wc-focus-ring-offset, 2px);
  }

  /* ─── Hover State ─── */

  .radio:not(.radio--disabled):not(.radio--checked):hover .radio__control {
    border-color: var(--wc-color-neutral-400, #adb5bd);
  }

  /* ─── Label ─── */

  .radio__label {
    font-size: var(--wc-font-size-md, 1rem);
    color: var(--wc-radio-label-color, var(--wc-color-neutral-700, #343a40));
    line-height: var(--wc-line-height-normal, 1.5);
    user-select: none;
    -webkit-user-select: none;
  }
`;
