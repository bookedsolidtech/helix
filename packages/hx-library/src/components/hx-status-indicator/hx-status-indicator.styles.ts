import { css } from 'lit';

export const helixStatusIndicatorStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-shrink: 0;
  }

  .indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: var(--_indicator-size);
    height: var(--_indicator-size);
    flex-shrink: 0;
  }

  .indicator__dot {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: var(--_dot-color);
    position: relative;
    z-index: 1;
  }

  .indicator__pulse-ring {
    display: none;
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background-color: var(--_dot-color);
    opacity: 0.4;
    animation: hx-status-pulse var(--hx-status-indicator-pulse-duration, 1.5s) ease-out infinite;
    z-index: 0;
  }

  :host([pulse]) .indicator__pulse-ring {
    display: block;
  }

  @keyframes hx-status-pulse {
    0% {
      transform: scale(1);
      opacity: 0.4;
    }
    100% {
      transform: scale(var(--hx-status-indicator-pulse-scale, 2.5));
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .indicator__pulse-ring {
      display: none !important;
    }
  }

  /* ─── Size Variants ─── */

  :host([size='sm']) {
    --_indicator-size: var(--hx-status-indicator-size-sm, var(--hx-size-2, 0.5rem));
  }

  :host([size='md']) {
    --_indicator-size: var(--hx-status-indicator-size-md, var(--hx-size-3, 0.75rem));
  }

  :host([size='lg']) {
    --_indicator-size: var(--hx-status-indicator-size-lg, var(--hx-size-4, 1rem));
  }

  /* ─── Status Colors ─── */

  :host([status='online']) {
    --_dot-color: var(--hx-status-indicator-color-online, var(--hx-color-success-500, #22c55e));
  }

  :host([status='offline']) {
    --_dot-color: var(--hx-status-indicator-color-offline, var(--hx-color-neutral-400, #94a3b8));
  }

  :host([status='away']) {
    --_dot-color: var(--hx-status-indicator-color-away, var(--hx-color-warning-500, #f59e0b));
  }

  :host([status='busy']) {
    --_dot-color: var(--hx-status-indicator-color-busy, var(--hx-color-danger-500, #ef4444));
  }

  :host([status='unknown']) {
    --_dot-color: var(--hx-status-indicator-color-unknown, var(--hx-color-neutral-300, #cbd5e1));
  }
`;
