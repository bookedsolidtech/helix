import { css } from 'lit';

export const helixSpinnerStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .spinner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--_spinner-size);
    height: var(--_spinner-size);
    flex-shrink: 0;
  }

  .spinner__svg {
    width: 100%;
    height: 100%;
    animation: hx-spinner-rotate var(--hx-duration-spinner, 750ms) linear infinite;
  }

  .spinner__track {
    stroke: var(--_spinner-track-color);
  }

  .spinner__arc {
    stroke: var(--_spinner-color);
    stroke-dasharray: 56;
    stroke-dashoffset: 14;
    animation: hx-spinner-dash 1.5s ease-in-out infinite;
    transform-origin: center;
  }

  @keyframes hx-spinner-rotate {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes hx-spinner-dash {
    0% {
      stroke-dashoffset: 50;
    }
    50% {
      stroke-dashoffset: 14;
    }
    100% {
      stroke-dashoffset: 50;
    }
  }

  @keyframes hx-spinner-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner__svg {
      animation: hx-spinner-pulse 2s ease-in-out infinite;
    }

    .spinner__arc {
      animation: none;
      stroke-dashoffset: 14;
    }
  }

  /* ─── Size Variants ─── */

  :host([size='sm']) {
    --_spinner-size: var(--hx-size-4, 1rem);
  }

  :host([size='md']) {
    --_spinner-size: var(--hx-size-6, 1.5rem);
  }

  :host([size='lg']) {
    --_spinner-size: var(--hx-size-8, 2rem);
  }

  /* ─── Variant Colors ─── */

  :host([variant='default']) {
    --_spinner-color: var(--hx-spinner-color, var(--hx-color-neutral-600, #475569));
    --_spinner-track-color: var(--hx-spinner-track-color, var(--hx-color-neutral-200, #e2e8f0));
  }

  :host([variant='primary']) {
    --_spinner-color: var(--hx-spinner-color, var(--hx-color-primary-500, #2563eb));
    --_spinner-track-color: var(--hx-spinner-track-color, var(--hx-color-primary-100, #dbeafe));
  }

  :host([variant='inverted']) {
    --_spinner-color: var(--hx-spinner-color, var(--hx-color-neutral-0, #ffffff));
    --_spinner-track-color: var(--hx-spinner-track-color, rgba(255, 255, 255, 0.3));
  }

  @supports (color: color-mix(in srgb, red, blue)) {
    :host([variant='inverted']) {
      --_spinner-track-color: var(
        --hx-spinner-track-color,
        color-mix(in srgb, var(--hx-color-neutral-0, #ffffff) 30%, transparent)
      );
    }
  }
`;
