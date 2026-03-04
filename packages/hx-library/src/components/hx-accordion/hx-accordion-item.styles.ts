import { css } from 'lit';

export const helixAccordionItemStyles = css`
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

  /* ─── Item Container ─── */

  .item {
    border-bottom: var(--hx-border-width-thin) solid
      var(--hx-accordion-item-border-color, var(--hx-color-neutral-200));
  }

  :host(:last-of-type) .item {
    border-bottom: none;
  }

  /* ─── Heading / Trigger ─── */

  .heading {
    margin: 0;
  }

  .trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--hx-space-4);
    background-color: var(--hx-accordion-item-heading-bg, var(--hx-color-neutral-50));
    color: var(--hx-accordion-item-heading-color, var(--hx-color-neutral-900));
    border: none;
    border-radius: 0;
    font-family: inherit;
    font-size: var(--hx-font-size-md);
    font-weight: var(--hx-font-weight-medium);
    line-height: var(--hx-line-height-normal);
    cursor: pointer;
    text-align: left;
    transition: background-color var(--hx-transition-fast);
  }

  .trigger:hover:not(:disabled) {
    background-color: var(--hx-color-neutral-100);
  }

  .trigger:focus-visible {
    outline: var(--hx-focus-ring-width) solid var(--hx-focus-ring-color);
    outline-offset: var(--hx-focus-ring-offset);
    z-index: 1;
    position: relative;
  }

  .trigger:disabled {
    cursor: not-allowed;
  }

  /* ─── Chevron Icon ─── */

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--hx-size-5);
    height: var(--hx-size-5);
    color: var(--hx-accordion-item-heading-color, var(--hx-color-neutral-900));
    transition: transform var(--hx-transition-normal);
  }

  :host([open]) .icon {
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .icon {
      transition: none;
    }
  }

  /* ─── Content Panel — CSS grid trick for smooth height animation ─── */

  .content-wrapper {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--hx-transition-normal);
  }

  :host([open]) .content-wrapper {
    grid-template-rows: 1fr;
  }

  @media (prefers-reduced-motion: reduce) {
    .content-wrapper {
      transition: none;
    }
  }

  .content-inner {
    overflow: hidden;
  }

  .content {
    padding: var(--hx-accordion-item-content-padding, var(--hx-space-4));
    background-color: var(--hx-accordion-item-content-bg, var(--hx-color-neutral-0));
    color: var(--hx-color-neutral-900);
    font-size: var(--hx-font-size-md);
    line-height: var(--hx-line-height-normal);
  }
`;
