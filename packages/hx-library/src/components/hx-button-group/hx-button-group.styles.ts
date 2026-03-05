import { css } from 'lit';

export const helixButtonGroupStyles = css`
  :host {
    display: inline-flex;
  }

  .group {
    display: inline-flex;
    align-items: stretch;
  }

  /* ─── Orientation Variants ─── */

  .group--horizontal {
    flex-direction: row;
  }

  .group--vertical {
    flex-direction: column;
  }

  /* ─── No Double Borders: Horizontal ─── */

  .group--horizontal ::slotted(*:not(:first-child)) {
    margin-left: calc(-1 * var(--hx-border-width-thin, 1px));
  }

  /* ─── No Double Borders: Vertical ─── */

  .group--vertical ::slotted(*:not(:first-child)) {
    margin-top: calc(-1 * var(--hx-border-width-thin, 1px));
  }

  /* ─── Border Radius: Horizontal — Single child keeps all corners ─── */

  .group--horizontal ::slotted(:only-child) {
    --hx-button-border-radius: var(--hx-border-radius-md, 0.375rem);
  }

  /* ─── Border Radius: Horizontal — First child keeps left corners ─── */

  .group--horizontal ::slotted(:first-child:not(:only-child)) {
    --hx-button-border-radius: var(--hx-border-radius-md, 0.375rem) 0 0
      var(--hx-border-radius-md, 0.375rem);
  }

  /* ─── Border Radius: Horizontal — Last child keeps right corners ─── */

  .group--horizontal ::slotted(:last-child:not(:only-child)) {
    --hx-button-border-radius: 0 var(--hx-border-radius-md, 0.375rem)
      var(--hx-border-radius-md, 0.375rem) 0;
  }

  /* ─── Border Radius: Horizontal — Middle children have no radius ─── */

  .group--horizontal ::slotted(:not(:first-child):not(:last-child)) {
    --hx-button-border-radius: 0;
  }

  /* ─── Border Radius: Vertical — Single child keeps all corners ─── */

  .group--vertical ::slotted(:only-child) {
    --hx-button-border-radius: var(--hx-border-radius-md, 0.375rem);
  }

  /* ─── Border Radius: Vertical — First child keeps top corners ─── */

  .group--vertical ::slotted(:first-child:not(:only-child)) {
    --hx-button-border-radius: var(--hx-border-radius-md, 0.375rem)
      var(--hx-border-radius-md, 0.375rem) 0 0;
  }

  /* ─── Border Radius: Vertical — Last child keeps bottom corners ─── */

  .group--vertical ::slotted(:last-child:not(:only-child)) {
    --hx-button-border-radius: 0 0 var(--hx-border-radius-md, 0.375rem)
      var(--hx-border-radius-md, 0.375rem);
  }

  /* ─── Border Radius: Vertical — Middle children have no radius ─── */

  .group--vertical ::slotted(:not(:first-child):not(:last-child)) {
    --hx-button-border-radius: 0;
  }

  /* ─── Z-index: Raise focused child above siblings to show full focus ring ─── */

  .group ::slotted(:focus-within) {
    z-index: 1;
    position: relative;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .group ::slotted(*) {
      transition: none;
    }
  }
`;
