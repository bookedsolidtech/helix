import { css } from 'lit';

export const helixImageStyles = css`
  :host {
    display: block;
  }

  .image__container {
    position: relative;
    display: block;
    overflow: hidden;
    margin: 0;
    padding: 0;
    aspect-ratio: var(--_ratio, var(--hx-image-aspect-ratio));
    border-radius: var(--_radius, var(--hx-image-border-radius, 0));
  }

  .image__container--error {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--hx-image-fallback-min-height, 3rem);
    background-color: var(
      --hx-image-fallback-bg,
      var(--hx-color-neutral-100, #EBEEE9)
    );
    color: var(--hx-image-fallback-color, var(--hx-color-neutral-500, #66787B));
  }

  .image__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: var(--_fit, var(--hx-image-object-fit, cover));
  }

  .image__caption {
    display: none;
    padding: var(--hx-image-caption-padding, 0.5rem 0 0);
    color: var(--hx-image-caption-color, var(--hx-color-neutral-600, #4A5362));
    font-size: var(--hx-image-caption-font-size, 0.875rem);
  }

  .image__caption--visible {
    display: block;
  }

  /* ─── Forced Colors (Windows High Contrast) ─── */

  @media (forced-colors: active) {
    .image__container--error {
      border: 1px solid GrayText;
    }
  }
`;
