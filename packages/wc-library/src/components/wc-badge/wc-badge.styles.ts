import { css } from 'lit';

export const wcBadgeStyles = css`
  :host {
    display: inline-block;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--wc-badge-border-radius, var(--wc-border-radius-md, 0.375rem));
    background-color: var(--wc-badge-bg, var(--wc-color-primary-500, #007878));
    color: var(--wc-badge-color, var(--wc-color-neutral-0, #ffffff));
    font-family: var(--wc-badge-font-family, var(--wc-font-family-sans, sans-serif));
    font-weight: var(--wc-badge-font-weight, var(--wc-font-weight-semibold, 600));
    line-height: var(--wc-line-height-tight, 1.25);
    white-space: nowrap;
    vertical-align: middle;
    position: relative;
  }

  /* ─── Size Variants ─── */

  .badge--sm {
    font-size: var(--wc-badge-font-size, var(--wc-font-size-2xs, 0.625rem));
    padding: var(--wc-badge-padding-y, var(--wc-space-0-5, 0.125rem)) var(--wc-badge-padding-x, var(--wc-space-1-5, 0.375rem));
  }

  .badge--md {
    font-size: var(--wc-badge-font-size, var(--wc-font-size-xs, 0.75rem));
    padding: var(--wc-badge-padding-y, var(--wc-space-1, 0.25rem)) var(--wc-badge-padding-x, var(--wc-space-2, 0.5rem));
  }

  .badge--lg {
    font-size: var(--wc-badge-font-size, var(--wc-font-size-sm, 0.875rem));
    padding: var(--wc-badge-padding-y, var(--wc-space-1, 0.25rem)) var(--wc-badge-padding-x, var(--wc-space-3, 0.75rem));
  }

  /* ─── Style Variants ─── */

  .badge--primary {
    --wc-badge-bg: var(--wc-color-primary-500, #007878);
    --wc-badge-color: var(--wc-color-neutral-0, #ffffff);
    --wc-badge-pulse-color: var(--wc-color-primary-500, #007878);
  }

  .badge--success {
    --wc-badge-bg: var(--wc-color-success-500, #16a34a);
    --wc-badge-color: var(--wc-color-neutral-0, #ffffff);
    --wc-badge-pulse-color: var(--wc-color-success-500, #16a34a);
  }

  .badge--warning {
    --wc-badge-bg: var(--wc-color-warning-500, #eab308);
    --wc-badge-color: var(--wc-color-neutral-900, #1a1a1a);
    --wc-badge-pulse-color: var(--wc-color-warning-500, #eab308);
  }

  .badge--error {
    --wc-badge-bg: var(--wc-color-error-500, #dc2626);
    --wc-badge-color: var(--wc-color-neutral-0, #ffffff);
    --wc-badge-pulse-color: var(--wc-color-error-500, #dc2626);
  }

  .badge--neutral {
    --wc-badge-bg: var(--wc-color-neutral-200, #e5e7eb);
    --wc-badge-color: var(--wc-color-neutral-700, #374151);
    --wc-badge-pulse-color: var(--wc-color-neutral-200, #e5e7eb);
  }

  /* ─── Pill Mode ─── */

  .badge--pill {
    border-radius: var(--wc-badge-border-radius, var(--wc-border-radius-full, 9999px));
  }

  /* ─── Dot Indicator (empty + pulse) ─── */

  .badge--dot {
    width: var(--wc-badge-dot-size, var(--wc-size-2, 0.5rem));
    height: var(--wc-badge-dot-size, var(--wc-size-2, 0.5rem));
    padding: 0;
    border-radius: var(--wc-border-radius-full, 9999px);
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
    animation: wc-badge-pulse 2s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .badge--pulse {
      animation: none;
    }
  }
`;
