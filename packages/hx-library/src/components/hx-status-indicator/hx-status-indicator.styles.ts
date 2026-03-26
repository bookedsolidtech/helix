import { css } from 'lit';

export const helixStatusIndicatorStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-2, 0.5rem);
    position: relative;
    flex-shrink: 0;
    --_dot-color: var(--hx-status-indicator-color-default, var(--hx-color-neutral-300, #ced4da));
    /* Default size (md) — always defined so .indicator never collapses to 0x0 */
    --_indicator-size: var(--hx-status-indicator-size-md, var(--hx-space-3, 0.75rem));
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
    z-index: 1; /* dot above pulse ring within shadow root */
  }

  .indicator__pulse-ring {
    display: none;
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background-color: var(--hx-status-indicator-pulse-color, var(--_dot-color));
    opacity: var(--hx-state-focus-opacity, 0.12); /* intentional: pulse ring start opacity */
    animation: hx-status-pulse var(--hx-status-indicator-pulse-duration, 1.5s) ease-out infinite;
    z-index: 0; /* pulse ring beneath dot within shadow root */
  }

  :host([pulse]) .indicator__pulse-ring {
    display: block;
  }

  @keyframes hx-status-pulse {
    0% {
      transform: scale(1);
      opacity: var(--hx-state-focus-opacity, 0.12); /* intentional: pulse ring start opacity */
    }
    100% {
      transform: scale(var(--hx-status-indicator-pulse-scale, 2.5));
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host([pulse]) .indicator__pulse-ring {
      animation: none;
      display: none;
    }
  }

  /* ─── Visible label (part="label") ─── */

  .indicator__label {
    font-size: var(
      --hx-status-indicator-label-font-size,
      var(--hx-font-size-sm, var(--hx-text-sm, 0.875rem))
    );
    color: var(--hx-status-indicator-label-color, var(--hx-color-neutral-700, #374151));
    line-height: 1;
    white-space: nowrap;
  }

  /* ─── aria-live announcement region (visually hidden) ─── */

  .indicator__live-region {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ─── Size Variants ─── */

  :host([hx-size='sm']) {
    --_indicator-size: var(--hx-status-indicator-size-sm, var(--hx-space-2, 0.5rem));
  }

  :host([hx-size='md']) {
    --_indicator-size: var(--hx-status-indicator-size-md, var(--hx-space-3, 0.75rem));
  }

  :host([hx-size='lg']) {
    --_indicator-size: var(--hx-status-indicator-size-lg, var(--hx-space-4, 1rem));
  }

  /* ─── Status Colors ─── */

  :host([status='online']) {
    --_dot-color: var(--hx-status-indicator-color-online, var(--hx-color-success-500));
  }

  :host([status='offline']) {
    --_dot-color: var(--hx-status-indicator-color-offline, var(--hx-color-neutral-400));
  }

  :host([status='away']) {
    --_dot-color: var(--hx-status-indicator-color-away, var(--hx-color-warning-500));
  }

  :host([status='busy']) {
    --_dot-color: var(--hx-status-indicator-color-busy, var(--hx-color-error-500));
  }

  :host([status='unknown']) {
    --_dot-color: var(--hx-status-indicator-color-unknown, var(--hx-color-neutral-300));
  }
`;
