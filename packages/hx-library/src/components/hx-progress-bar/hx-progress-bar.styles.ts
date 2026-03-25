import { css } from 'lit';

export const helixProgressBarStyles = css`
  :host {
    display: block;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .progress-bar {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
  }

  .progress-bar__label {
    font-family: var(--hx-progress-bar-label-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-progress-bar-label-font-size, var(--hx-font-size-sm, 0.875rem));
    font-weight: var(--hx-progress-bar-label-font-weight, var(--hx-font-weight-medium, 500));
    color: var(--hx-progress-bar-label-color, var(--hx-color-neutral-700));
    line-height: var(--hx-line-height-tight, 1.25);
  }

  .progress-bar__track {
    position: relative;
    overflow: hidden;
    border-radius: var(--hx-progress-bar-border-radius, var(--hx-border-radius-full, 9999px));
    background-color: var(--hx-progress-bar-track-bg, var(--hx-color-neutral-100));
    width: 100%;
  }

  /* ─── Size Variants ─── */

  .progress-bar--sm .progress-bar__track {
    height: var(--hx-progress-bar-height-sm, var(--hx-space-1, 0.25rem));
  }

  .progress-bar--md .progress-bar__track {
    height: var(--hx-progress-bar-height-md, var(--hx-space-2, 0.5rem));
  }

  .progress-bar--lg .progress-bar__track {
    height: var(--hx-progress-bar-height-lg, var(--hx-space-3, 0.75rem));
  }

  .progress-bar__fill {
    height: 100%;
    width: 100%;
    border-radius: inherit;
    background-color: var(--hx-progress-bar-indicator-bg, var(--hx-color-primary-500));
    transform-origin: left center;
    transform: scaleX(var(--_value-ratio, 0));
    transition: transform var(--hx-transition-fast, 150ms ease);
  }

  @media (prefers-reduced-motion: reduce) {
    .progress-bar__fill {
      transition: none;
    }
  }

  /* ─── Variant Colors ─── */

  .progress-bar--default .progress-bar__fill {
    --hx-progress-bar-indicator-bg: var(--hx-color-primary-500);
  }

  .progress-bar--success .progress-bar__fill {
    --hx-progress-bar-indicator-bg: var(--hx-color-success-700);
  }

  .progress-bar--warning .progress-bar__fill {
    --hx-progress-bar-indicator-bg: var(--hx-color-warning-500);
  }

  .progress-bar--danger .progress-bar__fill {
    --hx-progress-bar-indicator-bg: var(--hx-color-error-500);
  }

  /* ─── Indeterminate Animation ─── */

  @keyframes hx-progress-indeterminate {
    0% {
      transform: translateX(-100%) scaleX(0.4);
    }
    50% {
      transform: translateX(50%) scaleX(0.6);
    }
    100% {
      transform: translateX(250%) scaleX(0.4);
    }
  }

  .progress-bar--indeterminate .progress-bar__fill {
    transform: translateX(-100%) scaleX(0.4);
    transform-origin: left center;
    animation: hx-progress-indeterminate var(--hx-progress-bar-indeterminate-duration, 1.5s)
      ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .progress-bar__fill {
      transition: none;
    }

    .progress-bar--indeterminate .progress-bar__fill {
      animation: none;
      transform: scaleX(1);
      opacity: var(--hx-opacity-disabled, 0.5); /* reduced from animation; no exact token for 0.4 */
    }
  }

  /* ─── High Contrast Mode ─── */

  @media (forced-colors: active) {
    .progress-bar__track {
      border: 1px solid ButtonText;
      background-color: Canvas;
    }

    .progress-bar__fill {
      background-color: Highlight;
      forced-color-adjust: none;
    }
  }
`;
