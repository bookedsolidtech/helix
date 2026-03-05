import { css } from 'lit';

export const helixBadgeStyles = css`
  :host {
    display: inline-block;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-1, 0.25rem);
    border-radius: var(--hx-badge-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-badge-bg, var(--hx-color-primary-500, #2563eb));
    color: var(--hx-badge-color, var(--hx-color-neutral-0, #ffffff));
    font-family: var(--hx-badge-font-family, var(--hx-font-family-sans, sans-serif));
    font-weight: var(--hx-badge-font-weight, var(--hx-font-weight-semibold, 600));
    line-height: var(--hx-line-height-tight, 1.25);
    white-space: nowrap;
    vertical-align: middle;
    position: relative;
  }

  /* ─── Size Variants ─── */

  .badge--sm {
    font-size: var(--hx-badge-font-size, var(--hx-font-size-2xs, 0.625rem));
    padding: var(--hx-badge-padding-y, var(--hx-space-0-5, 0.125rem))
      var(--hx-badge-padding-x, var(--hx-space-1-5, 0.375rem));
  }

  .badge--md {
    font-size: var(--hx-badge-font-size, var(--hx-font-size-xs, 0.75rem));
    padding: var(--hx-badge-padding-y, var(--hx-space-1, 0.25rem))
      var(--hx-badge-padding-x, var(--hx-space-2, 0.5rem));
  }

  .badge--lg {
    font-size: var(--hx-badge-font-size, var(--hx-font-size-sm, 0.875rem));
    padding: var(--hx-badge-padding-y, var(--hx-space-1, 0.25rem))
      var(--hx-badge-padding-x, var(--hx-space-3, 0.75rem));
  }

  /* ─── Style Variants ─── */

  .badge--primary {
    --hx-badge-bg: var(--hx-color-primary-500, #2563eb);
    --hx-badge-color: var(--hx-color-neutral-0, #ffffff);
    --hx-badge-pulse-color: var(--hx-color-primary-500, #2563eb);
  }

  .badge--secondary {
    --hx-badge-bg: var(--hx-color-neutral-100, #f3f4f6);
    --hx-badge-color: var(--hx-color-neutral-700, #374151);
    --hx-badge-pulse-color: var(--hx-color-neutral-100, #f3f4f6);
  }

  .badge--success {
    --hx-badge-bg: var(--hx-color-success-700, #15803d);
    --hx-badge-color: var(--hx-color-neutral-0, #ffffff);
    --hx-badge-pulse-color: var(--hx-color-success-700, #15803d);
  }

  .badge--warning {
    --hx-badge-bg: var(--hx-color-warning-500, #eab308);
    --hx-badge-color: var(--hx-color-neutral-900, #1a1a1a);
    --hx-badge-pulse-color: var(--hx-color-warning-500, #eab308);
  }

  .badge--error {
    --hx-badge-bg: var(--hx-color-error-500, #dc2626);
    --hx-badge-color: var(--hx-color-neutral-0, #ffffff);
    --hx-badge-pulse-color: var(--hx-color-error-500, #dc2626);
  }

  .badge--neutral {
    --hx-badge-bg: var(--hx-color-neutral-200, #e5e7eb);
    --hx-badge-color: var(--hx-color-neutral-700, #374151);
    --hx-badge-pulse-color: var(--hx-color-neutral-200, #e5e7eb);
  }

  .badge--info {
    --hx-badge-bg: var(--hx-color-info-700, #0369a1);
    --hx-badge-color: var(--hx-color-neutral-0, #ffffff);
    --hx-badge-pulse-color: var(--hx-color-info-700, #0369a1);
  }

  /* ─── Pill Mode ─── */

  .badge--pill {
    border-radius: var(--hx-badge-border-radius, var(--hx-border-radius-full, 9999px));
  }

  /* ─── Dot Indicator (empty + pulse) ─── */

  .badge--dot {
    width: var(--hx-badge-dot-size, var(--hx-size-2, 0.5rem));
    height: var(--hx-badge-dot-size, var(--hx-size-2, 0.5rem));
    padding: 0;
    border-radius: var(--hx-border-radius-full, 9999px);
  }

  /* ─── Pulse Animation ─── */

  @keyframes wc-badge-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .badge--pulse {
    animation: wc-badge-pulse var(--hx-badge-pulse-duration, var(--hx-duration-slow, 2s))
      var(--hx-badge-pulse-easing, var(--hx-ease-in-out, ease-in-out)) infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .badge--pulse {
      animation: none;
    }
  }

  /* ─── Remove Button ─── */

  .badge__remove-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 0;
    margin-inline-start: var(--hx-space-1, 0.25rem);
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    border-radius: var(--hx-border-radius-sm, 0.125rem);
    line-height: 0;
  }

  .badge__remove-button:hover {
    opacity: 1;
  }

  .badge__remove-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, currentColor);
    outline-offset: var(--hx-focus-ring-offset, 1px);
  }
`;
