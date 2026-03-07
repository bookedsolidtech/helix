import { css } from 'lit';

export const helixFocusRingStyles = css`
  :host {
    display: inline-block;
    position: relative;

    --_ring-color: var(--hx-focus-ring-color, #2563eb);
    --_ring-width: var(--hx-focus-ring-width, 2px);
    --_ring-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Base ─── */

  .base {
    display: inline-block;
    position: relative;
  }

  /* ─── Ring ─── */

  .ring {
    position: absolute;
    inset: calc(-1 * var(--_ring-offset));
    border: var(--_ring-width) solid var(--_ring-color);
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--hx-transition-fast, 150ms ease);
  }

  :host([visible]) .ring {
    opacity: 1;
  }

  /* ─── Shape Variants ─── */

  .ring--box {
    border-radius: var(--hx-border-radius-md, 0.375rem);
  }

  .ring--circle {
    border-radius: 50%;
  }

  .ring--pill {
    border-radius: 9999px;
  }
`;
