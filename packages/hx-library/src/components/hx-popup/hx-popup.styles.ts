import { css } from 'lit';

export const helixPopupStyles = css`
  :host {
    display: inline-block;
  }

  [part='popup'] {
    position: var(--_strategy, fixed);
    z-index: var(--hx-popup-z-index, 9000);
    inset: 0 auto auto 0;
    box-sizing: border-box;
  }

  :host([strategy='absolute']) [part='popup'] {
    --_strategy: absolute;
  }

  :host(:not([active])) [part='popup'] {
    display: none;
  }

  [part='arrow'] {
    position: absolute;
    width: var(--hx-arrow-size, 8px);
    height: var(--hx-arrow-size, 8px);
    background: var(--hx-arrow-color, currentColor);
    transform: rotate(45deg);
    pointer-events: none;
  }
`;
