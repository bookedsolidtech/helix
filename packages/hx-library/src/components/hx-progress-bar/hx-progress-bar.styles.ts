import { css } from 'lit';

export const helixProgressBarStyles = css`
  :host {
    display: block;
  }

  /* ─── Bar (outer track container) ─── */

  .bar {
    display: flex;
    flex-direction: column;
    gap: var(--hx-progress-bar-gap, var(--hx-space-1, 0.25rem));
  }

  /* ─── Label ─── */

  .bar__label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: var(--hx-progress-bar-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-progress-bar-font-size, var(--hx-font-size-sm, 0.875rem));
    font-weight: var(--hx-progress-bar-font-weight, var(--hx-font-weight-semibold, 600));
    color: var(--hx-progress-bar-label-color, var(--hx-color-neutral-700, #374151));
    line-height: var(--hx-line-height-tight, 1.25);
  }

  .bar__label:empty {
    display: none;
  }

  /* ─── Value text ─── */

  .bar__value {
    font-family: var(--hx-progress-bar-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-progress-bar-font-size, var(--hx-font-size-sm, 0.875rem));
    font-weight: var(--hx-progress-bar-font-weight, var(--hx-font-weight-semibold, 600));
    color: var(--hx-progress-bar-label-color, var(--hx-color-neutral-700, #374151));
    white-space: nowrap;
  }

  /* ─── Track ─── */

  .bar__track {
    position: relative;
    overflow: hidden;
    height: var(--hx-progress-bar-height, var(--hx-space-2, 0.5rem));
    border-radius: var(--hx-progress-bar-border-radius, var(--hx-border-radius-full, 9999px));
    background-color: var(--hx-progress-bar-track-bg, var(--hx-color-neutral-200, #e5e7eb));
  }

  /* ─── Fill ─── */

  .bar__fill {
    height: 100%;
    border-radius: var(--hx-progress-bar-border-radius, var(--hx-border-radius-full, 9999px));
    background-color: var(--hx-progress-bar-fill-bg, var(--hx-color-primary-500, #2563eb));
    transition: width 0.3s ease;
    transform-origin: left center;
  }

  /* ─── Variant fill colors ─── */

  .bar--primary .bar__fill {
    --hx-progress-bar-fill-bg: var(--hx-color-primary-500, #2563eb);
  }

  .bar--success .bar__fill {
    --hx-progress-bar-fill-bg: var(--hx-color-success-700, #15803d);
  }

  .bar--warning .bar__fill {
    --hx-progress-bar-fill-bg: var(--hx-color-warning-500, #eab308);
  }

  .bar--danger .bar__fill {
    --hx-progress-bar-fill-bg: var(--hx-color-error-500, #dc2626);
  }

  /* ─── Indeterminate Animation ─── */

  @keyframes hx-progress-bar-indeterminate {
    0% {
      left: -35%;
      right: 100%;
    }
    40% {
      left: 100%;
      right: -90%;
    }
    100% {
      left: 100%;
      right: -90%;
    }
  }

  @keyframes hx-progress-bar-indeterminate-short {
    0% {
      left: -200%;
      right: 100%;
    }
    60% {
      left: 107%;
      right: -8%;
    }
    100% {
      left: 107%;
      right: -8%;
    }
  }

  .bar__fill--indeterminate {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 30%;
    left: 0;
    transition: none;
    animation: hx-progress-bar-indeterminate 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
  }

  .bar__fill--indeterminate::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    border-radius: var(--hx-progress-bar-border-radius, var(--hx-border-radius-full, 9999px));
    background-color: var(--hx-progress-bar-fill-bg, var(--hx-color-primary-500, #2563eb));
    animation: hx-progress-bar-indeterminate-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s
      infinite;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .bar__fill {
      transition: none;
    }

    .bar__fill--indeterminate {
      animation: none;
      width: 30%;
      left: 35%;
    }

    .bar__fill--indeterminate::after {
      animation: none;
    }
  }
`;
