import { css } from 'lit';

export const helixImageStyles = css`
  :host {
    display: block;
  }

  .image__figure {
    margin: 0;
    display: block;
  }

  .image__container {
    position: relative;
    display: block;
    overflow: hidden;
    aspect-ratio: var(--_ratio, var(--hx-image-aspect-ratio));
    border-radius: var(--_radius, var(--hx-image-border-radius, 0));
  }

  .image__container--error {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--hx-image-fallback-min-height, 3rem);
    background-color: var(--hx-image-fallback-bg, var(--hx-color-neutral-100, #f3f4f6));
    color: var(--hx-image-fallback-color, var(--hx-color-neutral-600, #4b5563));
  }

  .image__fallback-text {
    font-size: 0.875rem;
  }

  .image__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: var(--_fit, var(--hx-image-object-fit, cover));
  }

  .image__caption {
    padding-block: 0.5rem;
    color: var(--hx-image-caption-color, var(--hx-color-neutral-600, #6b7280));
    font-size: var(--hx-image-caption-font-size, 0.875rem);
  }
`;
