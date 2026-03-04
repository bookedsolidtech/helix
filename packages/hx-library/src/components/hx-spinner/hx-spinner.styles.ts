import { css } from 'lit';

export const helixSpinnerStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* ─── Spinner Container ─── */

  .spinner {
    display: inline-block;
    position: relative;
    flex-shrink: 0;
    width: var(--hx-spinner-size, var(--hx-size-6, 1.5rem));
    height: var(--hx-spinner-size, var(--hx-size-6, 1.5rem));
    box-sizing: border-box;
  }

  /* ─── Size Variants ─── */

  .spinner--sm {
    --hx-spinner-size: var(--hx-size-4, 1rem);
  }

  .spinner--md {
    --hx-spinner-size: var(--hx-size-6, 1.5rem);
  }

  .spinner--lg {
    --hx-spinner-size: var(--hx-size-8, 2rem);
  }

  /* ─── Color Variants ─── */

  .spinner--primary {
    --hx-spinner-track-color: var(--hx-color-primary-200, #bfdbfe);
    --hx-spinner-indicator-color: var(--hx-color-primary-500, #2563eb);
  }

  .spinner--neutral {
    --hx-spinner-track-color: var(--hx-color-neutral-200, #e5e7eb);
    --hx-spinner-indicator-color: var(--hx-color-neutral-600, #4b5563);
  }

  /* ─── Track ─── */

  .spinner__track {
    position: absolute;
    inset: 0;
    border-radius: var(--hx-border-radius-full, 9999px);
    border-style: solid;
    border-width: var(--hx-spinner-border-width, 2px);
    border-color: var(--hx-spinner-track-color, var(--hx-color-primary-200, #bfdbfe));
    box-sizing: border-box;
  }

  /* ─── Indicator (rotating arc) ─── */

  .spinner__indicator {
    position: absolute;
    inset: 0;
    border-radius: var(--hx-border-radius-full, 9999px);
    border-style: solid;
    border-width: var(--hx-spinner-border-width, 2px);
    border-color: transparent;
    border-top-color: var(--hx-spinner-indicator-color, var(--hx-color-primary-500, #2563eb));
    box-sizing: border-box;
    animation: hx-spin var(--hx-spinner-duration, 0.75s) linear infinite;
  }

  /* ─── Spin Keyframe ─── */

  @keyframes hx-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .spinner__indicator {
      animation: none;
    }
  }
`;
