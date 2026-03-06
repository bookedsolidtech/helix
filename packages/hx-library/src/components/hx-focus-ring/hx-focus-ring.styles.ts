import { css } from 'lit';

export const helixFocusRingStyles = css`
  :host {
    display: inline-block;
    position: relative;

    --_ring-color: var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb));
    --_ring-width: var(--hx-focus-ring-width, var(--hx-border-width-focus, 2px));
    --_ring-offset: var(--hx-focus-ring-offset, var(--hx-spacing-focus-offset, 2px));
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

  :host([visible]) .ring,
  .ring--active {
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

  /* ─── Dark Mode ─── */

  @media (prefers-color-scheme: dark) {
    :host {
      --_ring-color: var(--hx-focus-ring-color, var(--hx-color-primary-300, #93c5fd));
    }
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .ring {
      transition: none;
    }
  }

  /* ─── Forced Colors (Windows High Contrast) ─── */

  @media (forced-colors: active) {
    .ring {
      border-color: Highlight;
    }
  }
`;
