import { css } from 'lit';

export const helixAccordionItemStyles = css`
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

  /* ─── Item Container ─── */

  .item {
    border-bottom: var(--hx-border-width-thin, 1px) solid
      var(--hx-accordion-item-border-color, var(--hx-color-neutral-200, #e9ecef));
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
    padding: var(--hx-space-4, 1rem);
    background-color: var(--hx-accordion-item-heading-bg, var(--hx-color-neutral-50, #f8f9fa));
    color: var(--hx-accordion-item-heading-color, var(--hx-color-neutral-900, #212529));
    border: none;
    border-radius: 0;
    font-family: inherit;
    font-size: var(--hx-font-size-md, 1rem);
    font-weight: var(--hx-font-weight-medium, 500);
    line-height: var(--hx-line-height-normal, 1.5);
    cursor: pointer;
    text-align: left;
    transition: background-color var(--hx-transition-fast, 150ms ease);
  }

  .trigger:hover:not([aria-disabled='true']) {
    background-color: var(--hx-color-neutral-100, #f1f3f5);
  }

  .trigger:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, -2px);
    z-index: 1;
    position: relative;
  }

  .trigger[aria-disabled='true'] {
    cursor: not-allowed;
  }

  /* ─── Chevron Icon ─── */

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--hx-size-5, 1.25rem);
    height: var(--hx-size-5, 1.25rem);
    color: var(--hx-accordion-item-heading-color, var(--hx-color-neutral-900, #212529));
    transition: transform var(--hx-transition-normal, 250ms ease);
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
    transition: grid-template-rows var(--hx-transition-normal, 250ms ease);
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
    padding: var(--hx-accordion-item-content-padding, var(--hx-space-4, 1rem));
    background-color: var(--hx-accordion-item-content-bg, var(--hx-color-neutral-0, #ffffff));
    color: var(--hx-color-neutral-900, #212529);
    font-size: var(--hx-font-size-md, 1rem);
    line-height: var(--hx-line-height-normal, 1.5);
  }
`;
