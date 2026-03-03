import { css } from 'lit';

export const helixAccordionStyles = css`
  :host {
    display: block;
    font-family: var(--hx-font-family-sans, sans-serif);
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled, 0.5);
    pointer-events: none;
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Accordion Container ─── */

  .accordion {
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-accordion-border-color, var(--hx-color-neutral-200, #e9ecef));
    border-radius: var(--hx-border-radius-md, 0.375rem);
    overflow: hidden;
  }

  /* ─── Slot: removes trailing border on last item ─── */

  ::slotted(hx-accordion-item:last-child) {
    border-bottom: none;
  }
`;
