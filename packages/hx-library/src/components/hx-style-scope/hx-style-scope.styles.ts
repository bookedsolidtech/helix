import { css } from 'lit';

/**
 * Styles for hx-style-scope.
 *
 * The element acts as a transparent wrapper — `display: contents` removes it
 * from the layout box model so slotted children lay out as if the wrapper
 * were absent. This prevents hx-style-scope from introducing unexpected
 * layout shifts or block-formatting-context changes.
 */
export const hxStyleScopeStyles = css`
  :host {
    display: contents;
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  /* hx-style-scope is a transparent layout wrapper (display: contents).
     It has no visual output of its own. forced-color-adjust: auto (default)
     is sufficient. */
  @media (forced-colors: active) {
    :host {
      forced-color-adjust: auto;
    }
  }
`;
