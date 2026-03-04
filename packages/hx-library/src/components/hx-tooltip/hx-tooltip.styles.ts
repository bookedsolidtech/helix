import { css } from 'lit';

export const helixTooltipStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Tooltip Popup ─── */

  .tooltip {
    position: absolute;
    z-index: var(--hx-tooltip-z-index, 1000);
    max-width: var(--hx-tooltip-max-width, 17.5rem);
    padding: var(--hx-tooltip-padding, var(--hx-space-1-5, 0.375rem) var(--hx-space-2-5, 0.625rem));
    border-radius: var(--hx-tooltip-border-radius, var(--hx-border-radius-sm, 0.25rem));
    background-color: var(--hx-tooltip-bg, var(--hx-color-neutral-900, #111827));
    color: var(--hx-tooltip-color, var(--hx-color-neutral-50, #f9fafb));
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-tooltip-font-size, var(--hx-font-size-xs, 0.75rem));
    line-height: var(--hx-line-height-normal, 1.5);
    white-space: normal;
    word-break: break-word;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transition:
      opacity var(--hx-transition-fast, 150ms ease),
      visibility var(--hx-transition-fast, 150ms ease);
  }

  .tooltip--visible {
    opacity: 1;
    visibility: visible;
  }

  /* ─── Placement: top (default) ─── */

  .tooltip--top {
    bottom: calc(100% + var(--hx-space-2, 0.5rem));
    left: 50%;
    transform: translateX(-50%);
  }

  /* ─── Placement: bottom ─── */

  .tooltip--bottom {
    top: calc(100% + var(--hx-space-2, 0.5rem));
    left: 50%;
    transform: translateX(-50%);
  }

  /* ─── Placement: left ─── */

  .tooltip--left {
    top: 50%;
    right: calc(100% + var(--hx-space-2, 0.5rem));
    transform: translateY(-50%);
  }

  /* ─── Placement: right ─── */

  .tooltip--right {
    top: 50%;
    left: calc(100% + var(--hx-space-2, 0.5rem));
    transform: translateY(-50%);
  }

  /* ─── Arrow ─── */

  .tooltip__arrow {
    position: absolute;
    width: 0;
    height: 0;
  }

  .tooltip--top .tooltip__arrow {
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid var(--hx-tooltip-bg, var(--hx-color-neutral-900, #111827));
  }

  .tooltip--bottom .tooltip__arrow {
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid var(--hx-tooltip-bg, var(--hx-color-neutral-900, #111827));
  }

  .tooltip--left .tooltip__arrow {
    top: 50%;
    right: -4px;
    transform: translateY(-50%);
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 5px solid var(--hx-tooltip-bg, var(--hx-color-neutral-900, #111827));
  }

  .tooltip--right .tooltip__arrow {
    top: 50%;
    left: -4px;
    transform: translateY(-50%);
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 5px solid var(--hx-tooltip-bg, var(--hx-color-neutral-900, #111827));
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .tooltip {
      transition: none;
    }
  }
`;
