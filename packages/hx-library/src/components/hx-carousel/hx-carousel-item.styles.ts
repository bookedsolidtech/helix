import { css } from 'lit';

export const helixCarouselItemStyles = css`
  :host {
    display: block;
    flex-shrink: 0;
    /* Public --hx-carousel-slide-width wins when a consumer sets it; otherwise the
       per-page width computed by hx-carousel (_syncSlides) applies, then 100%. */
    width: var(--hx-carousel-slide-width, var(--_hx-carousel-computed-slide-width, 100%));
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

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .slide-group:focus-visible {
      outline: 3px solid Highlight;
      outline-offset: 2px;
    }
  }
`;
