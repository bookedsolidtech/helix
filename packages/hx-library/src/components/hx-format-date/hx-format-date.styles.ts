import { css } from 'lit';

export const helixFormatDateStyles = css`
  :host {
    display: inline;
  }

  [part='base'] {
    display: inline;
    font: inherit;
    color: inherit;
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  /* hx-format-date renders text-only content using color: inherit from its parent.
     forced-color-adjust: auto (default) is sufficient — the browser maps
     inherited text color to CanvasText automatically in forced-colors mode. */
  @media (forced-colors: active) {
    :host {
      forced-color-adjust: auto;
    }
  }
`;
