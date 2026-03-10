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
    /* SVG arc math: viewBox is 24×24, r=10, circumference = 2π × 10 ≈ 62.83.
       stroke-dasharray: 56 creates a visible arc of ~89% of circumference.
       stroke-dashoffset: 14 shifts the arc start to produce the ~75% visible gap aesthetic.
       Adjust both proportionally if r or viewBox dimensions change. */
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

  @media (prefers-reduced-motion: reduce) {
    .spinner__svg {
      animation: none;
    }

    .spinner__arc {
      animation: none;
      /* Maintain the static partial arc at full opacity so the loading state remains
         clearly communicated without motion. A faded arc looks broken; full opacity
         alongside the track ring unambiguously signals "in progress". */
      stroke-dashoffset: 14;
      opacity: 1;
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
    /* Fallback for browsers without color-mix() support (Chrome < 111, Firefox < 113, Safari < 16.2).
       rgba(255, 255, 255, 0.3) approximates the intended 30% white track color. */
    --_spinner-track-color: var(--hx-spinner-track-color, rgba(255, 255, 255, 0.3));
  }

  @supports (color: color-mix(in srgb, white 30%, transparent)) {
    :host([variant='inverted']) {
      --_spinner-track-color: var(
        --hx-spinner-track-color,
        color-mix(in srgb, var(--hx-color-neutral-0, #ffffff) 30%, transparent)
      );
    }
  }
`;
