import { css } from 'lit';

export const helixMeterStyles = css`
  :host {
    display: block;
    width: 100%;
  }

  .meter {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-2, 0.5rem);
    width: 100%;
  }

  .meter__label {
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-meter-label-color, var(--hx-color-neutral-700, #374151));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .meter__track {
    position: relative;
    width: 100%;
    height: var(--hx-meter-track-height, var(--hx-size-2, 0.5rem));
    background-color: var(--hx-meter-track-color, var(--hx-color-neutral-200, #e5e7eb));
    border-radius: var(--hx-meter-track-radius, var(--hx-radius-full, 9999px));
    overflow: hidden;
  }

  .meter__indicator {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    height: 100%;
    border-radius: inherit;
    background-color: var(--_indicator-color);
    transition:
      width var(--hx-duration-fast, 150ms) ease,
      background-color var(--hx-duration-fast, 150ms) ease;
  }

  /* ─── Default (no thresholds configured) ─── */

  :host {
    --_indicator-color: var(--hx-meter-indicator-color, var(--hx-color-primary-500, #3b82f6));
  }

  /* ─── Semantic state colors ─── */

  :host([data-state='optimum']) {
    --_indicator-color: var(--hx-meter-color-optimum, var(--hx-color-success-500, #22c55e));
  }

  :host([data-state='warning']) {
    --_indicator-color: var(--hx-meter-color-warning, var(--hx-color-warning-500, #f59e0b));
  }

  :host([data-state='danger']) {
    --_indicator-color: var(--hx-meter-color-danger, var(--hx-color-danger-500, #ef4444));
  }

  /* ─── Native meter hidden (we use custom rendering) ─── */

  .meter__native {
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
