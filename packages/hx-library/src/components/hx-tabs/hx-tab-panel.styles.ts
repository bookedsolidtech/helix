import { css } from 'lit';

export const helixTabPanelStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  * {
    box-sizing: border-box;
  }

  .panel {
    padding: var(--hx-tabs-panel-padding, var(--hx-space-4, 1rem));
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-font-size-md, 1rem);
    color: var(--hx-tabs-panel-color, var(--hx-color-neutral-700, #343a40));
    line-height: var(--hx-line-height-normal, 1.5);
    outline: none;
  }

  .panel:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-tabs-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-radius: var(--hx-border-radius-sm, 0.125rem);
  }
`;
