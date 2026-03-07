import { css } from 'lit';

export const helixGridStyles = css`
  :host {
    display: grid;
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
`;
