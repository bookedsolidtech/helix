import { css } from 'lit';

export const helixMenuDividerStyles = css`
  :host {
    display: block;
  }

  .menu-divider {
    height: var(--hx-border-width-thin, 1px);
    background-color: var(--hx-menu-divider-color, var(--hx-color-neutral-200, #e2e8f0));
    margin: var(--hx-space-1, 0.25rem) calc(-1 * var(--hx-space-1, 0.25rem));
  }
`;
