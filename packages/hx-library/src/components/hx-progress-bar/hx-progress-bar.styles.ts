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
    height: var(--hx-progress-bar-height-sm, var(--hx-size-1, 0.25rem));
  }

  .progress-bar--md .progress-bar__track {
    height: var(--hx-progress-bar-height-md, var(--hx-size-2, 0.5rem));
  }

  .progress-bar--lg .progress-bar__track {
    height: var(--hx-progress-bar-height-lg, var(--hx-size-3, 0.75rem));
  }

  .progress-bar__fill {
    height: 100%;
    border-radius: inherit;
    background-color: var(--hx-progress-bar-indicator-bg, var(--hx-color-primary-500));
    transition: width 0.2s ease;
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
      transform: translateX(-100%);
      width: 40%;
    }
    50% {
      width: 60%;
    }
    100% {
      transform: translateX(250%);
      width: 40%;
    }
  }

  .progress-bar--indeterminate .progress-bar__fill {
    width: 40%;
    animation: hx-progress-indeterminate 1.5s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .progress-bar--indeterminate .progress-bar__fill {
      animation: none;
      width: 100%;
      opacity: 0.4;
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
