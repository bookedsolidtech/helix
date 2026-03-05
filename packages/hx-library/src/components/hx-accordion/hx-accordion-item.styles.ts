import { css } from 'lit';

export const helixAccordionItemStyles = css`
  :host {
    display: block;
  }

  .item {
    border-bottom: var(--hx-border-width-thin, 1px) solid
      var(--hx-accordion-border-color, var(--hx-color-neutral-200, #dee2e6));
    font-family: var(--hx-font-family-sans, sans-serif);
  }

  :host(:first-child) .item {
    border-top: var(--hx-border-width-thin, 1px) solid
      var(--hx-accordion-border-color, var(--hx-color-neutral-200, #dee2e6));
  }

  /* Remove native details marker */
  .trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--hx-space-3, 0.75rem);
    padding: var(--hx-accordion-trigger-padding, var(--hx-space-4, 1rem));
    cursor: pointer;
    list-style: none;
    font-size: var(--hx-font-size-md, 1rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    color: var(--hx-accordion-trigger-color, var(--hx-color-neutral-800, #212529));
    background-color: var(--hx-accordion-trigger-bg, transparent);
    user-select: none;
    transition: background-color var(--hx-transition-fast, 150ms ease);
  }

  /* Hide the native details disclosure triangle */
  .trigger::-webkit-details-marker {
    display: none;
  }

  .trigger::marker {
    display: none;
  }

  .item--disabled .trigger {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .trigger:hover:not(.item--disabled .trigger) {
    background-color: var(--hx-accordion-trigger-hover-bg, var(--hx-color-neutral-50, #f8f9fa));
  }

  .trigger:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, -2px);
  }

  /* ─── Icon ─── */

  .icon {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--hx-accordion-icon-color, var(--hx-color-neutral-500, #6c757d));
    transition: transform var(--hx-transition-normal, 250ms ease);
  }

  .item--expanded .icon {
    transform: rotate(180deg);
  }

  /* ─── Content animation via CSS grid trick ─── */

  .content-wrapper {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--hx-transition-normal, 250ms ease);
    overflow: hidden;
  }

  .item--expanded .content-wrapper,
  details[open]:not(.item--expanded) .content-wrapper {
    grid-template-rows: 1fr;
  }

  .content-inner {
    overflow: hidden;
  }

  .content {
    padding: var(--hx-accordion-content-padding, 0 var(--hx-space-4, 1rem) var(--hx-space-4, 1rem));
    font-size: var(--hx-font-size-md, 1rem);
    line-height: var(--hx-line-height-normal, 1.5);
    color: var(--hx-accordion-content-color, var(--hx-color-neutral-600, #495057));
  }
`;
