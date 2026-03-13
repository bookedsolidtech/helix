import { css } from 'lit';

export const helixRadioStyles = css`
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

  .radio {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    cursor: pointer;
    position: relative;
    font-family: var(--hx-font-family-sans, sans-serif);
  }

  .radio--disabled {
    cursor: not-allowed;
  }

  /* ─── Hidden Native Input ─── */

  .radio__input {
    position: absolute;
    width: var(--hx-space-px, 1px);
    height: var(--hx-space-px, 1px);
    padding: 0;
    margin: calc(var(--hx-space-px, 1px) * -1);
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
    width: var(--hx-radio-size, var(--hx-size-5, 1.25rem));
    height: var(--hx-radio-size, var(--hx-size-5, 1.25rem));
    border: var(--hx-border-width-medium, 2px) solid
      var(--hx-radio-border-color, var(--hx-color-neutral-300, #ced4da));
    border-radius: var(--hx-border-radius-full, 9999px);
    background-color: var(--hx-color-neutral-0, #ffffff);
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      background-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    flex-shrink: 0;
  }

  /* ─── Inner Dot ─── */

  .radio__dot {
    width: 0;
    height: 0;
    border-radius: var(--hx-border-radius-full, 9999px);
    background-color: var(--hx-radio-dot-color, var(--hx-color-neutral-0, #ffffff));
    transition:
      width var(--hx-transition-fast, 150ms ease),
      height var(--hx-transition-fast, 150ms ease);
  }

  /* ─── Checked State ─── */

  .radio--checked .radio__control {
    border-color: var(--hx-radio-checked-border-color, var(--hx-color-primary-500, #2563eb));
    background-color: var(--hx-radio-checked-bg, var(--hx-color-primary-500, #2563eb));
  }

  .radio--checked .radio__dot {
    width: calc(var(--hx-radio-size, var(--hx-size-5, 1.25rem)) * 0.4);
    height: calc(var(--hx-radio-size, var(--hx-size-5, 1.25rem)) * 0.4);
  }

  /* ─── Focus State ─── */

  :host(:focus-visible) .radio__control {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-radio-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Hover State ─── */

  .radio:not(.radio--disabled):not(.radio--checked):hover .radio__control {
    border-color: var(--hx-color-neutral-400, #adb5bd);
  }

  /* ─── Label ─── */

  .radio__label {
    font-size: var(--hx-font-size-md, 1rem);
    color: var(--hx-radio-label-color, var(--hx-color-neutral-700, #343a40));
    line-height: var(--hx-line-height-normal, 1.5);
    user-select: none;
    -webkit-user-select: none;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .radio__control,
    .radio__dot {
      transition: none;
    }
  }
`;
