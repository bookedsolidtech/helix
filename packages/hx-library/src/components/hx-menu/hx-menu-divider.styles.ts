import { css } from 'lit';

export const helixMenuDividerStyles = css`
  :host {
    display: block;
  }

  .menu-divider {
    height: var(--hx-border-width-thin, 1px);
    background-color: var(--hx-menu-divider-color, var(--hx-color-border-default, #d6dbd5));
    margin: var(--hx-space-1, 0.25rem) calc(-1 * var(--hx-space-1, 0.25rem));
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .menu-divider {
      background-color: GrayText;
    }
  }
`;
