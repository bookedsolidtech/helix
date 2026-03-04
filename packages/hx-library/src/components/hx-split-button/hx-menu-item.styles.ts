import { css } from 'lit';

export const helixMenuItemStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  /* ─── Menu Item ─── */

  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    width: 100%;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    background-color: var(--hx-menu-item-bg, transparent);
    color: var(--hx-menu-item-color, var(--hx-color-neutral-800, #1e293b));
    font-family: var(--hx-menu-item-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-menu-item-font-size, var(--hx-font-size-md, 1rem));
    font-weight: var(--hx-menu-item-font-weight, var(--hx-font-weight-normal, 400));
    line-height: var(--hx-line-height-normal, 1.5);
    text-align: start;
    border: none;
    border-radius: var(--hx-menu-item-border-radius, var(--hx-border-radius-sm, 0.25rem));
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
    transition: background-color var(--hx-transition-fast, 150ms ease);
  }

  .menu-item:hover {
    background-color: var(--hx-menu-item-bg-hover, var(--hx-color-primary-50, #eff6ff));
    color: var(--hx-menu-item-color-hover, var(--hx-color-primary-700, #1d4ed8));
  }

  .menu-item:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-menu-item-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, -2px);
  }

  .menu-item:active {
    background-color: var(--hx-menu-item-bg-active, var(--hx-color-primary-100, #dbeafe));
  }

  /* ─── Disabled ─── */

  .menu-item[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: var(--hx-opacity-disabled, 0.5);
    pointer-events: none;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .menu-item {
      transition: none;
    }
  }
`;
