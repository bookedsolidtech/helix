import { css } from 'lit';

export const helixVisuallyHiddenStyles = css`
  :host {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    clip-path: inset(50%) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  :host([focusable]:focus-within) {
    position: static !important;
    width: auto !important;
    height: auto !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    clip: auto !important;
    clip-path: none !important;
    white-space: normal !important;
    border: 0 !important;
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  /* hx-visually-hidden clips content off-screen for sighted users; in forced-colors
     mode this behavior is intentional. When the focusable variant becomes visible
     on focus, the browser's forced-colors mapping handles text/background colors
     correctly via the default forced-color-adjust: auto. */
  @media (forced-colors: active) {
    :host([focusable]:focus-within) {
      forced-color-adjust: auto;
    }
  }
`;
