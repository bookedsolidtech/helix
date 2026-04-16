import { css } from 'lit';

export const helixListItemStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  /* ─── Base list item ─── */

  .list-item {
    display: flex;
    align-items: center;
    gap: var(--hx-space-3, 0.75rem);
    padding: var(--hx-list-item-padding, var(--hx-space-3, 0.75rem));
    color: var(--hx-list-item-color, var(--hx-color-neutral-900, #0f172a));
    font-family: var(--hx-list-item-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-font-size-md, 1rem);
    line-height: var(--hx-line-height-normal, 1.5);
    cursor: default;
    box-sizing: border-box;
    width: 100%;
  }

  /* ─── Interactive items — use :host([interactive]) instead of deprecated :host-context() ─── */

  :host([interactive]) .list-item {
    cursor: pointer;
    border-radius: var(--hx-border-radius-md, 0.375rem);
    transition: background-color var(--hx-transition-fast, 150ms ease);
  }

  :host([interactive]) .list-item:hover:not(.list-item--disabled) {
    background-color: var(--hx-list-item-bg-hover, var(--hx-color-neutral-50, #f8fafc));
  }

  :host([interactive]):focus-visible .list-item {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-primary-600, #1d4ed8));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Selected state ─── */

  .list-item--selected {
    background-color: var(--hx-list-item-bg-selected, var(--hx-color-primary-50, #eff6ff));
    color: var(--hx-list-item-color-selected, var(--hx-color-primary-700, #1e40af));
  }

  /* ─── Disabled state ─── */

  .list-item--disabled {
    cursor: not-allowed;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  /* ─── Link mode ─── */

  .list-item__link {
    display: flex;
    align-items: center;
    gap: var(--hx-space-3, 0.75rem);
    width: 100%;
    text-decoration: none;
    color: inherit;
  }

  .list-item__link:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-primary-600, #1d4ed8));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
  }

  /* ─── Slots ─── */

  .list-item__prefix,
  .list-item__suffix {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .list-item__body {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-width: 0;
  }

  .list-item__label {
    display: block;
  }

  .list-item__description {
    display: block;
    font-size: var(--hx-font-size-sm, 0.875rem);
    color: var(--hx-list-item-description-color, var(--hx-color-neutral-500, #64748b));
    margin-top: var(--hx-space-1, 0.25rem);
  }

  @media (prefers-reduced-motion: reduce) {
    :host([interactive]) .list-item {
      transition: none;
    }
  }

  /* ─── Forced colors (Windows High Contrast / forced-colors mode) ─── */

  @media (forced-colors: active) {
    /* Selected state: replace background-color with a visible border using system Highlight color */
    :host([interactive]) .list-item--selected {
      background-color: transparent;
      border: 2px solid Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }

    /* Hover state: use an outline instead of background-color */
    :host([interactive]) .list-item:hover:not(.list-item--disabled) {
      background-color: transparent;
      outline: 1px solid Highlight;
      outline-offset: -1px;
    }

    /* Disabled state: use system GrayText color */
    :host([interactive][disabled]) .list-item,
    :host([interactive]) .list-item--disabled {
      color: GrayText;
    }

    /* Focus ring: ensure visibility in forced-colors mode */
    :host([interactive]):focus-visible .list-item {
      outline: 2px solid Highlight;
      outline-offset: 2px;
      forced-color-adjust: none;
    }
  }
`;
