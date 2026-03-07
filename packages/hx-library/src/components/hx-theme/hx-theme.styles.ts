import { css } from 'lit';

export const helixThemeStyles = css`
  :host {
    display: contents;
  }

  /* display: contents makes this wrapper layout-invisible; exposed as [part="base"]
     for consumer targeting via CSS parts without affecting layout */
  .theme-base {
    display: contents;
  }

  /* Visually hidden but accessible to screen readers — used for aria-live announcements */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;
