import { css } from 'lit';

export const helixPopoverStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  .trigger-wrapper {
    display: inline-block;
  }

  [part='body'] {
    position: fixed;
    z-index: var(--hx-popover-z-index, 9999);
    max-width: var(--hx-popover-max-width, 320px);
    padding: var(--hx-popover-padding, var(--hx-space-3, 0.75rem));
    background: var(--hx-popover-bg, var(--hx-color-neutral-0, #ffffff));
    color: var(--hx-popover-color, var(--hx-color-neutral-900, #111827));
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-popover-font-size, var(--hx-font-size-sm, 0.875rem));
    line-height: var(--hx-line-height-normal, 1.5);
    border: 1px solid var(--hx-popover-border-color, var(--hx-color-neutral-200, #e5e7eb));
    border-radius: var(--hx-popover-border-radius, var(--hx-border-radius-md, 0.375rem));
    box-shadow: var(--hx-popover-shadow, 0 4px 16px rgba(0, 0, 0, 0.12));
    visibility: hidden;
    opacity: 0;
    transition:
      opacity var(--hx-popover-transition-duration, 0.2s) ease,
      visibility var(--hx-popover-transition-duration, 0.2s) ease;
    word-wrap: break-word;
  }

  [part='body'].visible {
    visibility: visible;
    opacity: 1;
  }

  [part='arrow'] {
    position: absolute;
    width: var(--hx-popover-arrow-size, 10px);
    height: var(--hx-popover-arrow-size, 10px);
    background: var(--hx-popover-bg, var(--hx-color-neutral-0, #ffffff));
    border: 1px solid var(--hx-popover-border-color, var(--hx-color-neutral-200, #e5e7eb));
    transform: rotate(45deg);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='body'] {
      transition: none;
    }
  }
`;
