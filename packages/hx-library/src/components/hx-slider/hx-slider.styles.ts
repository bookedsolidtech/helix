import { css } from 'lit';

export const helixSliderStyles = css`
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

  /* ─── Container ─── */

  .slider {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    font-family: var(--hx-font-family-sans, sans-serif);
  }

  /* ─── Label Row ─── */

  .slider__label-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--hx-space-2, 0.5rem);
  }

  .slider__label {
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-slider-label-color, var(--hx-color-neutral-700, #343a40));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .slider__value-display {
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-slider-value-color, var(--hx-color-neutral-600, #6c757d));
    line-height: var(--hx-line-height-normal, 1.5);
    font-variant-numeric: tabular-nums;
    min-width: var(--hx-size-8, 2rem);
    text-align: right;
  }

  /* ─── Track Container ─── */

  .slider__track-container {
    position: relative;
    width: 100%;
  }

  .slider__track {
    position: relative;
    width: 100%;
    border-radius: var(--hx-border-radius-full, 9999px);
    background-color: var(--hx-slider-track-bg, var(--hx-color-neutral-200, #e9ecef));
    overflow: visible;
  }

  /* ─── Size: sm ─── */

  .slider--sm .slider__track {
    height: var(--hx-slider-track-height-sm, var(--hx-size-1, 0.25rem));
  }

  .slider--sm .slider__input {
    height: var(--hx-slider-track-height-sm, var(--hx-size-1, 0.25rem));
  }

  /* ─── Size: md ─── */

  .slider--md .slider__track {
    height: var(--hx-slider-track-height-md, var(--hx-size-1-5, 0.375rem));
  }

  .slider--md .slider__input {
    height: var(--hx-slider-track-height-md, var(--hx-size-1-5, 0.375rem));
  }

  /* ─── Size: lg ─── */

  .slider--lg .slider__track {
    height: var(--hx-slider-track-height-lg, var(--hx-size-2, 0.5rem));
  }

  .slider--lg .slider__input {
    height: var(--hx-slider-track-height-lg, var(--hx-size-2, 0.5rem));
  }

  /* ─── Fill ─── */

  .slider__fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: var(--hx-border-radius-full, 9999px);
    background-color: var(--hx-slider-fill-bg, var(--hx-color-primary-500, #2563eb));
    pointer-events: none;
    transition: width var(--hx-transition-fast, 150ms ease);
  }

  /* Suppress fill animation on initial render — only animate on user interaction */
  :host(:not([data-ready])) .slider__fill {
    transition: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .slider__fill {
      transition: none;
    }
  }

  /* ─── Native Range Input ─── */

  .slider__input {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    width: 100%;
    margin: 0;
    padding: 0;
    opacity: 0;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    border: none;
    outline: none;
    /* Expand the hit area so the thumb is easy to grab */
    padding-block: var(--hx-slider-input-padding-block, 0.75rem);
  }

  /* In forced-color mode, restore native outline so the input remains focusable */
  @media (forced-colors: active) {
    .slider__input {
      outline: revert;
      opacity: 1;
    }
    .slider__input:focus-visible {
      outline: 2px solid ButtonText;
    }
  }

  .slider__input:disabled {
    cursor: not-allowed;
  }

  /* ─── Thumb (visual, :before on a wrapper or via ::after on track) ─── */
  /*
   * The native thumb is hidden (opacity 0 on the input). We render a visible
   * thumb element positioned by --fill-pct (a raw 0–100 number set in JS).
   *
   * Correct alignment formula keeps the thumb centered within the track at
   * both extremes, preventing the left/right halves from clipping outside:
   *   left = fillPct% * (1 – thumbSize/100%) + thumbSize * (1 – fillPct/100)
   * Simplified: left = calc(var(--fill-pct,0)*1% + var(--_thumb-size)*(1 - var(--fill-pct,0)/100))
   * Combined with translate(-50%,-50%) this places the thumb center correctly
   * at every position from min to max.
   */

  .slider__thumb-visual {
    position: absolute;
    top: 50%;
    /* Corrected position: thumb stays within track at all fill values */
    left: calc(var(--fill-pct, 0) * 1% + var(--_thumb-size, 1rem) * (1 - var(--fill-pct, 0) / 100));
    transform: translate(-50%, -50%);
    border-radius: var(--hx-border-radius-full, 9999px);
    background-color: var(--hx-slider-thumb-bg, var(--hx-color-neutral-0, #ffffff));
    border: var(--hx-slider-thumb-border-width, 2px) solid
      var(--hx-slider-thumb-border-color, var(--hx-color-primary-500, #2563eb));
    box-shadow: var(--hx-slider-thumb-shadow, var(--hx-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05)));
    pointer-events: none;
    transition:
      box-shadow var(--hx-transition-fast, 150ms ease),
      transform var(--hx-transition-fast, 150ms ease);
  }

  @media (prefers-reduced-motion: reduce) {
    .slider__thumb-visual {
      transition: none;
    }
  }

  .slider__input:focus-visible ~ .slider__thumb-visual {
    box-shadow:
      0 0 0 var(--hx-focus-ring-width, 2px)
        var(--hx-slider-focus-ring-color, var(--hx-focus-ring-color, #2563eb)),
      var(--hx-slider-thumb-shadow, var(--hx-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05)));
  }

  /* ─── Thumb sizes ─── */

  .slider--sm .slider__thumb-visual {
    --_thumb-size: var(--hx-slider-thumb-size-sm, var(--hx-size-3, 0.75rem));
    width: var(--_thumb-size);
    height: var(--_thumb-size);
  }

  .slider--md .slider__thumb-visual {
    --_thumb-size: var(--hx-slider-thumb-size-md, var(--hx-size-4, 1rem));
    width: var(--_thumb-size);
    height: var(--_thumb-size);
  }

  .slider--lg .slider__thumb-visual {
    --_thumb-size: var(--hx-slider-thumb-size-lg, var(--hx-size-5, 1.25rem));
    width: var(--_thumb-size);
    height: var(--_thumb-size);
  }

  /* ─── Forced colors (Windows High Contrast) ─── */
  @media (forced-colors: active) {
    .slider__fill {
      background-color: Highlight;
    }
    .slider__track {
      background-color: ButtonFace;
      border: 1px solid ButtonText;
    }
    .slider__thumb-visual {
      background-color: ButtonText;
      border-color: ButtonText;
    }
    .slider__input:focus-visible ~ .slider__thumb-visual {
      outline: 2px solid Highlight;
    }
  }

  /* ─── Ticks ─── */

  .slider__ticks {
    position: relative;
    width: 100%;
    height: var(--hx-size-2, 0.5rem);
    margin-top: var(--hx-space-1, 0.25rem);
  }

  .slider__tick {
    position: absolute;
    top: 0;
    width: var(--hx-border-width-thin, 1px);
    height: 100%;
    background-color: var(--hx-slider-tick-color, var(--hx-color-neutral-400, #adb5bd));
    transform: translateX(-50%);
  }

  /* ─── Range Labels ─── */

  .slider__range-labels {
    display: flex;
    justify-content: space-between;
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-slider-range-label-color, var(--hx-color-neutral-500, #6c757d));
    line-height: var(--hx-line-height-normal, 1.5);
    margin-top: var(--hx-space-0-5, 0.125rem);
  }

  /* ─── Help Text ─── */

  .slider__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-slider-help-text-color, var(--hx-color-neutral-500, #6c757d));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Disabled state ─── */

  .slider--disabled .slider__fill {
    background-color: var(--hx-color-neutral-400, #adb5bd);
  }

  .slider--disabled .slider__thumb-visual {
    border-color: var(--hx-color-neutral-400, #adb5bd);
  }
`;
