import { css } from 'lit';

// ─── hx-accordion (container) styles ─────────────────────────────────────────

export const helixAccordionStyles = css`
  :host {
    display: block;
  }

  .accordion {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
`;

// ─── hx-accordion-item styles ─────────────────────────────────────────────────

export const helixAccordionItemStyles = css`
  :host {
    display: block;
  }

  /* ─── Reset <details> native styles ─── */

  details {
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-accordion-item-border-color, var(--hx-color-neutral-200, #dee2e6));
    border-radius: var(--hx-accordion-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-accordion-trigger-bg, var(--hx-color-neutral-0, #ffffff));
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-font-size-md, 1rem);
    overflow: hidden;
  }

  /* Remove default details marker */
  details summary::-webkit-details-marker {
    display: none;
  }

  details summary::marker {
    display: none;
    content: '';
  }

  /* ─── Trigger (summary) ─── */

  .item__trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--hx-space-3, 0.75rem);
    padding: var(--hx-space-4, 1rem) var(--hx-space-5, 1.25rem);
    cursor: pointer;
    user-select: none;
    list-style: none;
    background-color: var(--hx-accordion-trigger-bg, var(--hx-color-neutral-0, #ffffff));
    color: var(--hx-accordion-trigger-color, var(--hx-color-neutral-800, #212529));
    font-weight: var(--hx-font-weight-medium, 500);
    line-height: var(--hx-line-height-tight, 1.25);
    transition: background-color var(--hx-transition-fast, 150ms ease);
    outline: none;
  }

  .item__trigger:hover:not([aria-disabled='true']) {
    background-color: var(--hx-accordion-trigger-bg-hover, var(--hx-color-neutral-50, #f8f9fa));
  }

  .item__trigger:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, -2px);
    border-radius: inherit;
    z-index: 1;
    position: relative;
  }

  /* Disabled state */
  :host([disabled]) .item__trigger {
    cursor: not-allowed;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  /* ─── Trigger label slot ─── */

  .item__trigger-label {
    flex: 1;
    min-width: 0;
  }

  /* ─── Chevron icon ─── */

  .item__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    color: var(--hx-accordion-icon-color, var(--hx-color-neutral-500, #6c757d));
    transition: transform var(--hx-transition-normal, 250ms ease);
    pointer-events: none;
  }

  :host([open]) .item__icon {
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .item__icon {
      transition: none;
    }
  }

  /* ─── Content panel (CSS grid trick for smooth height animation) ─── */

  .item__content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--hx-transition-normal, 250ms ease);
    background-color: var(--hx-accordion-content-bg, var(--hx-color-neutral-0, #ffffff));
  }

  :host([open]) .item__content {
    grid-template-rows: 1fr;
  }

  @media (prefers-reduced-motion: reduce) {
    .item__content {
      transition: none;
    }
  }

  .item__content-inner {
    overflow: hidden;
    padding: 0;
    transition: padding var(--hx-transition-normal, 250ms ease);
  }

  :host([open]) .item__content-inner {
    padding: var(--hx-accordion-content-padding, var(--hx-space-5, 1.25rem));
  }

  @media (prefers-reduced-motion: reduce) {
    .item__content-inner {
      transition: none;
    }
  }

  /* ─── Border between trigger and content ─── */

  :host([open]) details {
    border-color: var(--hx-accordion-item-border-color, var(--hx-color-neutral-200, #dee2e6));
  }

  :host([open]) .item__trigger {
    border-bottom: var(--hx-border-width-thin, 1px) solid
      var(--hx-accordion-item-border-color, var(--hx-color-neutral-200, #dee2e6));
  }

  /* ─── Hidden utility ─── */

  [hidden] {
    display: none !important;
  }
`;
