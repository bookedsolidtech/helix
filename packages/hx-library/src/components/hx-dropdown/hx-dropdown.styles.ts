import { css } from 'lit';

export const helixDropdownStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  .trigger-wrapper {
    display: inline-block;
  }

  /*
   * AAA 2.4.13 Focus Appearance — enforce a ≥2px focus ring on the slotted
   * trigger (typically <hx-button>, <button>, or <hx-icon-button>). The host
   * is a popover-container; the interactive surface is the slotted trigger.
   */
  ::slotted([slot='trigger']:focus-visible),
  ::slotted(button:focus-visible),
  ::slotted(a:focus-visible) {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-dropdown-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  [part='panel'] {
    position: fixed;
    z-index: var(--hx-dropdown-panel-z-index, 1000);
    min-width: var(--hx-dropdown-panel-min-width, 160px);
    background: var(--hx-dropdown-panel-bg, var(--hx-color-surface-default, #ffffff));
    border: 1px solid var(--hx-dropdown-panel-border-color, var(--hx-color-border-default, #d6dbd5));
    border-radius: var(--hx-dropdown-panel-border-radius, var(--hx-border-radius-md, 0.375rem));
    box-shadow: var(
      --hx-dropdown-panel-shadow,
      0 4px 16px var(--hx-overlay-black-12, rgba(0, 0, 0, 0.12))
    );
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
    transition:
      opacity var(--hx-transition-fast, 150ms ease),
      visibility var(--hx-transition-fast, 150ms ease);
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

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    [part='panel'] {
      background-color: Canvas;
      border: 2px solid CanvasText;
    }
  }
`;
