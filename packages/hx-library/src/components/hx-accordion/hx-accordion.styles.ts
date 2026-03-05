import { css } from 'lit';

export const helixAccordionStyles = css`
  :host {
    display: block;
    font-family: var(--hx-font-family-sans, sans-serif);
  }

  .accordion {
    border-radius: var(--hx-accordion-border-radius, var(--hx-border-radius-md, 0.375rem));
    overflow: hidden;
  }
`;
