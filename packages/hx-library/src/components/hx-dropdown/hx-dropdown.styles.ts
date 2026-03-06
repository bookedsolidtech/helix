import { css } from 'lit';

export const helixDropdownStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: 0.5;
  }

  .trigger-wrapper {
    display: inline-block;
  }

  [part='panel'] {
    position: fixed;
    z-index: var(--hx-dropdown-panel-z-index, 1000);
    min-width: var(--hx-dropdown-panel-min-width, 160px);
    background: var(--hx-dropdown-panel-bg, var(--hx-color-neutral-0, #ffffff));
    border: 1px solid var(--hx-dropdown-panel-border-color, var(--hx-color-neutral-200, #e5e7eb));
    border-radius: var(--hx-dropdown-panel-border-radius, var(--hx-border-radius-md, 0.375rem));
    box-shadow: var(--hx-dropdown-panel-shadow, 0 4px 16px rgba(0, 0, 0, 0.12));
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
    transition:
      opacity 0.15s ease,
      visibility 0.15s ease;
    outline: none;
  }

  [part='panel'].panel--visible {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='panel'] {
      transition: none;
    }
  }
`;
