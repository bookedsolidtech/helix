import { css } from 'lit';

export const helixTreeViewStyles = css`
  :host {
    display: block;
    contain: layout style;
    font-family: var(--hx-tree-font-family, var(--hx-font-family-sans, sans-serif));
  }

  * {
    box-sizing: border-box;
  }

  .tree {
    display: block;
    outline: none;
  }

  .tree:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-primary-400, #6ab1b1));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .tree:focus-visible {
      outline: 3px solid Highlight;
      outline-offset: 2px;
    }
  }
`;
