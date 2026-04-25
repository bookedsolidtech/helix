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
    outline: none;
    border-radius: var(--hx-border-radius-md, 0.375rem);
  }

  .meter:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-primary-500, #429797));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .meter__label {
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-meter-label-color, var(--hx-color-neutral-700, #313E4B));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .meter__track {
    position: relative;
    width: 100%;
    height: var(--hx-meter-track-height, var(--hx-space-2, 0.5rem));
    background-color: var(--hx-meter-track-color, var(--hx-color-neutral-200, #D6DBD5));
    border-radius: var(--hx-meter-track-radius, var(--hx-border-radius-full, 9999px));
    overflow: hidden;
  }

  .meter__indicator {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    height: 100%;
    width: 100%;
    border-radius: inherit;
    background-color: var(--_indicator-color);
    transform-origin: left center;
    transform: scaleX(var(--_value-ratio, 0));
    transition:
      transform var(--hx-transition-fast, 150ms ease),
      background-color var(--hx-transition-fast, 150ms ease);
  }

  @media (prefers-reduced-motion: reduce) {
    .meter__indicator {
      transition: none;
    }
  }

  /* ─── Default (no thresholds configured) ─── */

  :host {
    --_indicator-color: var(--hx-meter-indicator-color, var(--hx-color-primary-500, #429797));
  }

  /* ─── Semantic state colors ─── */

  :host([data-state='optimum']) {
    --_indicator-color: var(--hx-meter-color-optimum, var(--hx-color-success-500, #3B9E58));
  }

  :host([data-state='warning']) {
    --_indicator-color: var(--hx-meter-color-warning, var(--hx-color-warning-500, #C2711C));
  }

  :host([data-state='danger']) {
    --_indicator-color: var(--hx-meter-color-danger, var(--hx-color-error-500, #E5493E));
  }

  /* ─── State Label (WCAG 1.4.1) ─── */
  /* Visible text label rendered below the track when a semantic state is active. */
  /* Ensures the meter state is not conveyed by fill color alone.                 */
  /* aria-hidden="true" because aria-valuetext already includes the state for AT. */

  .meter__state-label {
    font-size: var(--hx-font-size-xs, 0.75rem);
    font-weight: var(--hx-font-weight-medium, 500);
    line-height: var(--hx-line-height-tight, 1.25);
    font-family: var(--hx-meter-font-family, var(--hx-font-family-sans, sans-serif));
  }

  .meter__state-label[data-state='optimum'] {
    color: var(--hx-meter-color-optimum, var(--hx-color-success-700, #146831));
  }

  .meter__state-label[data-state='warning'] {
    color: var(--hx-meter-color-warning, var(--hx-color-warning-700, #804605));
  }

  .meter__state-label[data-state='danger'] {
    color: var(--hx-meter-color-danger, var(--hx-color-error-700, #A21312));
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

  /* ─── Forced Colors (Windows High Contrast) ─── */

  @media (forced-colors: active) {
    .meter__track {
      border: 1px solid CanvasText;
    }

    .meter__indicator {
      forced-color-adjust: none;
      background-color: Highlight;
    }
  }
`;
