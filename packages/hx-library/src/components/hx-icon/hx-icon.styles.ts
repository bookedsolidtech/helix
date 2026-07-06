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
    /* stroke-width is consumed by stroke-paint and mixed-paint icon libraries
       (Lucide, Heroicons-outline, Phosphor). Built-in helix + fa-free
       libraries declare paintMode: 'fill' and ignore this property; setting
       it here makes the token universally available without per-library
       branching in the resolver. */
    stroke-width: var(--hx-icon-stroke-width, 2);
    display: block;
    overflow: visible;
  }

  /* ─── Stroke-paint libraries (Feather, Lucide, Heroicons-outline) ───
     Outline glyphs whose visible ink is the stroke. <hx-icon> reflects the
     resolved library's paintMode onto [data-paint-mode]; we supply fill:none +
     stroke:currentColor here, and stroke-width comes from the
     --hx-icon-stroke-width token on the base rule above. Line cap/join is NOT
     set here — it is a library-specific design choice carried by each glyph's
     own geometry, so the component never imposes round on a stroke library
     whose source uses square caps or miter joins. */
  svg[part='svg'][data-paint-mode='stroke'] {
    fill: none;
    stroke: currentColor;
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
    stroke-width: var(--hx-icon-stroke-width, 2);
    display: block;
  }

  .icon__inline[data-paint-mode='stroke'] svg {
    fill: none;
    stroke: currentColor;
  }

  /* ─── Forced Colors (Windows High Contrast) ─── */

  @media (forced-colors: active) {
    :host {
      color: CanvasText;
    }
  }
`;
