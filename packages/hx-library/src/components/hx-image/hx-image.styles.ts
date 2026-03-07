import { css } from 'lit';

export const helixImageStyles = css`
  :host {
    display: inline-block;
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
    background-color: var(--hx-color-neutral-100, #f3f4f6);
    color: var(--hx-color-neutral-500, #6b7280);
  }

  .image__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: var(--_fit, var(--hx-image-object-fit, cover));
  }
`;
