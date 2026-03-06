import { css } from 'lit';

export const helixProgressRingStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* ─── Base Container ─── */

  .progress-ring {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* ─── SVG ─── */

  .progress-ring__svg {
    transform: rotate(-90deg);
    overflow: visible;
  }

  /* ─── Track ─── */

  .progress-ring__track {
    fill: none;
    stroke: var(--hx-progress-ring-track-color, var(--hx-color-neutral-200, #e2e8f0));
  }

  /* ─── Indicator ─── */

  .progress-ring__indicator {
    fill: none;
    stroke: var(--hx-progress-ring-indicator-color, var(--hx-color-primary-500, #2563eb));
    stroke-linecap: round;
    transition: stroke-dashoffset var(--hx-transition-base, 300ms ease);
  }

  /* ─── Variant Colors ─── */

  :host([variant='success']) .progress-ring__indicator {
    stroke: var(--hx-progress-ring-indicator-color, var(--hx-color-success-500, #16a34a));
  }

  :host([variant='warning']) .progress-ring__indicator {
    stroke: var(--hx-progress-ring-indicator-color, var(--hx-color-warning-500, #d97706));
  }

  :host([variant='danger']) .progress-ring__indicator {
    stroke: var(--hx-progress-ring-indicator-color, var(--hx-color-error-500, #dc2626));
  }

  /* ─── Indeterminate Animation ─── */

  :host([indeterminate]) .progress-ring__svg {
    animation: hx-progress-ring-rotate var(--hx-duration-spinner, 1400ms) linear infinite;
  }

  :host([indeterminate]) .progress-ring__indicator {
    animation: hx-progress-ring-dash var(--hx-duration-spinner, 1400ms) ease-in-out infinite;
    transition: none;
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }

  @keyframes hx-progress-ring-rotate {
    to {
      transform: rotate(270deg);
    }
  }

  @keyframes hx-progress-ring-dash {
    0% {
      stroke-dasharray: 1, 200;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 89, 200;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 89, 200;
      stroke-dashoffset: -124;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host([indeterminate]) .progress-ring__svg {
      animation: none;
    }

    :host([indeterminate]) .progress-ring__indicator {
      animation: none;
      stroke-dasharray: 89, 200;
      stroke-dashoffset: -35;
    }

    .progress-ring__indicator {
      transition: none;
    }
  }

  /* ─── Size Variants ─── */

  :host([size='sm']) .progress-ring {
    width: var(--hx-size-8, 2rem);
    height: var(--hx-size-8, 2rem);
  }

  :host([size='md']) .progress-ring,
  .progress-ring {
    width: var(--hx-size-12, 3rem);
    height: var(--hx-size-12, 3rem);
  }

  :host([size='lg']) .progress-ring {
    width: var(--hx-size-16, 4rem);
    height: var(--hx-size-16, 4rem);
  }

  /* ─── Label (center slot wrapper) ─── */

  .progress-ring__label {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    inset: 0;
    font-size: var(--hx-font-size-xs, 0.75rem);
    font-family: var(--hx-font-family-sans, sans-serif);
    font-weight: var(--hx-font-weight-semibold, 600);
    color: var(--hx-progress-ring-label-color, var(--hx-color-neutral-900, #0f172a));
    pointer-events: none;
  }
`;
