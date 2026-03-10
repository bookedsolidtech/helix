import { css } from 'lit';

export const helixIconStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* vertical-align: middle ensures the icon aligns to the visual centre of
       adjacent inline text rather than the text baseline. */
    vertical-align: middle;
    /* overflow: hidden prevents malformed or oversized icons from painting
       outside the component boundary. The inner SVG may still set
       overflow: visible for its own viewBox content. */
    overflow: hidden;
    width: var(--hx-icon-size, var(--hx-size-6, 1.5rem));
    height: var(--hx-icon-size, var(--hx-size-6, 1.5rem));
    color: var(--hx-icon-color, currentColor);
    flex-shrink: 0;
  }

  /* ─── Size Variants ───
     Fallback pixel values mirror the design token values at time of writing.
     If token values are updated the fallbacks should be updated to match. */

  :host([hx-size='xs']) {
    --hx-icon-size: var(--hx-size-4, 1rem);
  }

  :host([hx-size='sm']) {
    --hx-icon-size: var(--hx-size-5, 1.25rem);
  }

  :host([hx-size='md']) {
    --hx-icon-size: var(--hx-size-6, 1.5rem);
  }

  :host([hx-size='lg']) {
    --hx-icon-size: var(--hx-size-8, 2rem);
  }

  :host([hx-size='xl']) {
    --hx-icon-size: var(--hx-size-10, 2.5rem);
  }

  /* ─── SVG (sprite mode) ───
     In sprite mode [part="svg"] is an actual <svg> element. The selector
     targets it specifically. In inline mode the part is applied to a <span>
     wrapper — see .icon__inline below. */

  svg[part='svg'] {
    width: 100%;
    height: 100%;
    fill: currentColor;
    display: block;
    overflow: visible;
  }

  /* ─── Inline SVG wrapper ───
     In inline mode [part="svg"] is a <span> that wraps the fetched SVG.
     The inner <svg> is sized to fill the wrapper. */

  .icon__inline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .icon__inline svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
    display: block;
  }
`;
