import { css } from 'lit';

export const helixRatingStyles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  /* ─── Base Container ─── */

  .base {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-rating-gap, var(--hx-space-1, 0.25rem));
    font-size: var(--hx-rating-size, var(--hx-font-size-xl, 1.25rem));
  }

  .base--readonly {
    cursor: default;
  }

  .base--disabled {
    cursor: not-allowed;
  }

  /* ─── Symbol (each star) ─── */

  .symbol {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
    color: var(--hx-rating-empty-color, var(--hx-color-border-strong, #66787b));
    line-height: 1;
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
    transition: transform var(--hx-transition-fast, 150ms ease);
  }

  .symbol:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-primary-600, #0f7078));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
  }

  .symbol--full,
  .symbol--half {
    color: var(--hx-rating-color, var(--hx-color-warning-400, #da904f));
  }

  .symbol--disabled {
    cursor: not-allowed;
  }

  .base:not(.base--readonly) .symbol:hover {
    transform: scale(1.15);
    color: var(--hx-rating-hover-color, var(--hx-color-warning-300, #eeb383));
  }

  /* ─── Half-Star Layout ─── */

  .star-half {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 1em;
    height: 1em;
  }

  .star-half__filled {
    position: absolute;
    left: 0;
    top: 0;
    /* Clip to left 50% for the filled half */
    clip-path: inset(0 50% 0 0);
  }

  .star-half__empty {
    position: absolute;
    left: 0;
    top: 0;
    color: var(--hx-rating-empty-color, var(--hx-color-border-strong, #66787b));
    /* Clip to right 50% for the empty half */
    clip-path: inset(0 0 0 50%);
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .symbol {
      transition: none;
    }
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .symbol {
      forced-color-adjust: none;
      color: ButtonText;
    }

    .symbol:focus-visible {
      outline: 3px solid Highlight;
      outline-offset: 2px;
    }

    .symbol--full,
    .symbol--half {
      color: Highlight;
    }

    .star-half__empty {
      color: ButtonText;
    }

    .base:not(.base--readonly) .symbol:hover {
      color: Highlight;
    }

    .symbol--disabled {
      color: GrayText;
    }

    :host([disabled]) {
      opacity: 1;
    }

    :host([disabled]) .symbol {
      color: GrayText;
    }
  }
`;
