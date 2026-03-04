import { css } from 'lit';

export const helixAccordionStyles = css`
  :host {
    display: block;
    font-family: var(--hx-font-family-sans);
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled);
    pointer-events: none;
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Accordion Container ─── */

  .accordion {
    border: var(--hx-border-width-thin) solid
      var(--hx-accordion-border-color, var(--hx-color-neutral-200));
    border-radius: var(--hx-border-radius-md);
    overflow: hidden;
  }
`;
