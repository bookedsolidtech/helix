import { css } from 'lit';

export const helixCarouselItemStyles = css`
  :host {
    display: block;
    flex-shrink: 0;
    width: var(--_hx-carousel-slide-width, 100%);
    box-sizing: border-box;
  }

  .slide-group {
    height: 100%;
    outline: none;
  }

  .slide-group:focus-visible {
    outline: var(--hx-focus-ring-width) solid var(--hx-focus-ring-color);
    outline-offset: var(--hx-focus-ring-offset);
  }
`;
