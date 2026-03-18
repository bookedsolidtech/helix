import { css } from 'lit';

export const helixCounterStyles = css`
  :host {
    display: inline-block;
  }

  .counter {
    display: inline-flex;
    align-items: baseline;
    font-family: var(--hx-counter-font-family, var(--hx-font-family-sans, sans-serif));
    font-weight: var(--hx-counter-font-weight, var(--hx-font-weight-bold, 700));
    color: var(--hx-counter-color, var(--hx-color-neutral-900, #111827));
    line-height: var(--hx-line-height-tight, 1.25);
    font-variant-numeric: tabular-nums;
  }

  /* ─── Size Variants ─── */

  .counter--sm {
    font-size: var(--hx-counter-font-size-sm, var(--hx-font-size-xl, 1.25rem));
  }

  .counter--md {
    font-size: var(--hx-counter-font-size-md, var(--hx-font-size-3xl, 1.875rem));
  }

  .counter--lg {
    font-size: var(--hx-counter-font-size-lg, var(--hx-font-size-5xl, 3rem));
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .counter {
      /* Animation is handled in JS — reduced-motion consumers
         will see the final value immediately via the component logic */
    }
  }
`;
