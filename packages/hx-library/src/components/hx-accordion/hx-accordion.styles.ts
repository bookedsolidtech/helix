import { css } from 'lit';

export const helixAccordionStyles = css`
  :host {
    display: block;
  }

  .accordion {
    border-radius: var(--hx-accordion-border-radius, var(--hx-border-radius-md, 0.375rem));
    overflow: hidden;
    font-family: var(--hx-font-family-sans, sans-serif);
  }
`;
