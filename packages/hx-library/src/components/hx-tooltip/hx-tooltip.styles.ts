import { css } from 'lit';

export const helixTooltipStyles = css`
  :host {
    display: inline-block;
  }

  .trigger-wrapper {
    display: inline-block;
  }

  [part='tooltip'] {
    position: fixed;
    z-index: var(--hx-tooltip-z-index, 9999);
    max-width: var(--hx-tooltip-max-width, 280px);
    padding: var(--hx-tooltip-padding, var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem));
    background: var(--hx-tooltip-bg, var(--hx-color-neutral-900, #111827));
    color: var(--hx-tooltip-color, var(--hx-color-neutral-50, #f9fafb));
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-tooltip-font-size, var(--hx-font-size-xs, 0.75rem));
    line-height: var(--hx-line-height-normal, 1.5);
    border-radius: var(--hx-tooltip-border-radius, var(--hx-border-radius-sm, 0.25rem));
    box-shadow: var(--hx-tooltip-shadow, var(--hx-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.2)));
    pointer-events: none;
    visibility: hidden;
    opacity: 0;
    transition:
      opacity var(--hx-tooltip-transition-duration, 0.15s) ease,
      visibility var(--hx-tooltip-transition-duration, 0.15s) ease;
    word-wrap: break-word;
  }

  [part='tooltip'].visible {
    visibility: visible;
    opacity: 1;
  }

  [part='arrow'] {
    position: absolute;
    width: var(--hx-tooltip-arrow-size, 8px);
    height: var(--hx-tooltip-arrow-size, 8px);
    background: var(--hx-tooltip-bg, var(--hx-color-neutral-900, #111827));
    transform: rotate(45deg);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='tooltip'] {
      transition: none;
    }
  }
`;
