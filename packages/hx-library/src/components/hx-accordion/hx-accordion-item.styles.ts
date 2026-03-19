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

  /* ─── Heading reset ─── */
  /* The heading element wraps the button per ARIA APG. Reset heading styles so
     the visual appearance is controlled entirely by the trigger button. */

  .heading {
    margin: 0;
    padding: 0;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
  }

  /* ─── Trigger button ─── */

  .trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--hx-space-3, 0.75rem);
    width: 100%;
    padding: var(--hx-accordion-trigger-padding, var(--hx-space-4, 1rem));
    cursor: pointer;
    border: none;
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-font-size-md, 1rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    text-align: start;
    color: var(--hx-accordion-trigger-color, var(--hx-color-neutral-800, #212529));
    background-color: var(--hx-accordion-trigger-bg, transparent);
    user-select: none;
    transition: background-color var(--hx-transition-fast, 150ms ease);
    /* Minimum 44×44px touch target (WCAG 2.5.5) */
    min-height: 44px;
  }

  .item--disabled .trigger {
    cursor: not-allowed;
  }

  :host(:not([disabled])) .trigger:hover {
    background-color: var(--hx-accordion-trigger-hover-bg, var(--hx-color-neutral-50, #f8f9fa));
  }

  .trigger:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb));
    /* Positive offset keeps focus ring outside the button boundary for visibility */
    outline-offset: var(--hx-focus-ring-offset, 2px);
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

  .item--expanded .content-wrapper {
    grid-template-rows: 1fr;
  }

  .content-inner {
    overflow: hidden;
  }

  /* The content div uses the HTML hidden attribute when collapsed, which removes
     it from the accessibility tree. When visible, role="region" is exposed. */
  .content {
    padding: var(--hx-accordion-content-padding, 0 var(--hx-space-4, 1rem) var(--hx-space-4, 1rem));
    font-size: var(--hx-font-size-md, 1rem);
    line-height: var(--hx-line-height-normal, 1.5);
    color: var(--hx-accordion-content-color, var(--hx-color-neutral-600, #495057));
  }

  /* Override browser default display:none for hidden so animation can work.
     The content-wrapper grid collapses the visual space; hidden removes from AT. */
  .content[hidden] {
    display: block;
  }

  /* ─── Disabled host ─── */

  :host([disabled]) {
    pointer-events: none;
    opacity: 0.5;
  }

  /* ─── Reduced motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .trigger {
      transition: none;
    }

    .icon {
      transition: none;
    }

    .content-wrapper {
      transition: none;
    }
  }
`;
