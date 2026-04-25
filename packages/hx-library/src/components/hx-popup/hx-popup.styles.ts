import { css } from 'lit';

/**
 * hx-popup styles.
 *
 * Positioning primitive — does NOT paint a surface of its own. Per the 3.2.0
 * surfaces & containers plan we apply restraint here: no coverage-gap fill,
 * since there is no real surface. Forced-colors mixin is still applied so
 * that any consumer that DOES style the popup body via tokens still meets
 * the OS-level affordance contract.
 */
export const helixPopupStyles = css`
  :host {
    display: inline-block;
  }

  [part='popup'] {
    position: fixed;
    z-index: var(--hx-popup-z-index, 9000);
    inset: 0 auto auto 0;
    box-sizing: border-box;
    transition: var(--hx-popup-transition, none);
  }

  :host(:not([active])) [part='popup'] {
    display: none;
  }

  [part='arrow'] {
    position: absolute;
    width: var(--hx-arrow-size, 8px);
    height: var(--hx-arrow-size, 8px);
    background: var(--hx-arrow-color, var(--hx-color-neutral-0, #ffffff));
    transform: rotate(45deg);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='popup'] {
      transition: none;
    }
  }

  /* ─── Forced Colors (Windows High Contrast) ─── */

  @media (forced-colors: active) {
    [part='popup'] {
      border: 1px solid CanvasText;
    }

    [part='arrow'] {
      border: 1px solid CanvasText;
    }
  }
`;
