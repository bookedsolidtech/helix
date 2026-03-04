import { css } from 'lit';

export const helixTooltipStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  /* ─── Trigger Wrapper ─── */

  .trigger {
    display: contents;
  }

  /* ─── Tooltip Panel ─── */

  .tooltip {
    position: fixed;
    z-index: var(--hx-z-tooltip, 9999);
    max-width: var(--hx-tooltip-max-width, 20rem);
    background-color: var(--hx-tooltip-bg, var(--hx-color-neutral-900, #0f172a));
    color: var(--hx-tooltip-color, var(--hx-color-neutral-0, #ffffff));
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-tooltip-font-size, var(--hx-font-size-sm, 0.875rem));
    line-height: var(--hx-line-height-normal, 1.5);
    padding: var(--hx-tooltip-padding, var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem));
    border-radius: var(--hx-tooltip-border-radius, var(--hx-border-radius-md, 0.375rem));
    pointer-events: none;
    white-space: normal;
    word-wrap: break-word;

    /* Hidden by default */
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 150ms ease,
      transform 150ms ease,
      visibility 0ms linear 150ms;

    /* Initial transform per placement — overridden by JS positioning */
    transform: translateY(4px);
  }

  /* ─── Visible State ─── */

  .tooltip--visible {
    opacity: 1;
    visibility: visible;
    transform: translate(0, 0);
    transition:
      opacity 150ms ease,
      transform 150ms ease,
      visibility 0ms linear 0ms;
  }

  /* ─── Placement Transform Origins ─── */

  .tooltip--top {
    transform: translateY(4px);
  }

  .tooltip--top.tooltip--visible {
    transform: translateY(0);
  }

  .tooltip--bottom {
    transform: translateY(-4px);
  }

  .tooltip--bottom.tooltip--visible {
    transform: translateY(0);
  }

  .tooltip--left {
    transform: translateX(4px);
  }

  .tooltip--left.tooltip--visible {
    transform: translateX(0);
  }

  .tooltip--right {
    transform: translateX(-4px);
  }

  .tooltip--right.tooltip--visible {
    transform: translateX(0);
  }

  /* ─── Arrow ─── */

  .arrow {
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  /* Arrow for top placement: points downward (toward the trigger) */
  .tooltip--top .arrow {
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid var(--hx-tooltip-bg, var(--hx-color-neutral-900, #0f172a));
  }

  /* Arrow for bottom placement: points upward (toward the trigger) */
  .tooltip--bottom .arrow {
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid var(--hx-tooltip-bg, var(--hx-color-neutral-900, #0f172a));
  }

  /* Arrow for left placement: points rightward (toward the trigger) */
  .tooltip--left .arrow {
    right: -6px;
    top: 50%;
    transform: translateY(-50%);
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 6px solid var(--hx-tooltip-bg, var(--hx-color-neutral-900, #0f172a));
  }

  /* Arrow for right placement: points leftward (toward the trigger) */
  .tooltip--right .arrow {
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 6px solid var(--hx-tooltip-bg, var(--hx-color-neutral-900, #0f172a));
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .tooltip {
      transition: opacity 0ms, visibility 0ms;
    }

    .tooltip--visible {
      transition: opacity 0ms, visibility 0ms;
    }

    .tooltip--top,
    .tooltip--bottom,
    .tooltip--left,
    .tooltip--right {
      transform: none;
    }

    .tooltip--top.tooltip--visible,
    .tooltip--bottom.tooltip--visible,
    .tooltip--left.tooltip--visible,
    .tooltip--right.tooltip--visible {
      transform: none;
    }
  }
`;
