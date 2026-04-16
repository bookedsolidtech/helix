import { css } from 'lit';

export const helixGridStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    width: 100%;
  }
`;

export const helixGridItemStyles = css`
  :host {
    display: block;
    min-width: 0;
    min-height: 0;
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  /* hx-grid and hx-grid-item are layout wrappers with no state communicated
     via color. forced-color-adjust: auto (default) is sufficient. */
  @media (forced-colors: active) {
    :host {
      forced-color-adjust: auto;
    }
  }
`;
