import { css } from 'lit';

export const helixMenuItemStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    cursor: pointer;
    color: var(--hx-menu-item-color, var(--hx-color-neutral-900, #0f172a));
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-family: var(--hx-font-family-sans, sans-serif);
    line-height: var(--hx-line-height-tight, 1.25);
    user-select: none;
    -webkit-user-select: none;
    outline: none;
    background: none;
    width: 100%;
    box-sizing: border-box;
    transition: background-color var(--hx-transition-fast, 150ms ease);
  }

  .menu-item:hover,
  .menu-item:focus-visible {
    background-color: var(--hx-menu-item-hover-bg, var(--hx-color-neutral-100, #f1f5f9));
  }

  .menu-item__prefix,
  .menu-item__suffix {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .menu-item__label {
    flex: 1 1 auto;
  }

  .menu-item__checked-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    width: 1em;
    opacity: 0;
    transition: opacity var(--hx-transition-fast, 150ms ease);
  }

  .menu-item--checked .menu-item__checked-icon {
    opacity: 1;
  }

  .menu-item__submenu-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    margin-inline-start: auto;
  }

  .menu-item__spinner {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
    animation: hx-menu-spin var(--hx-duration-spinner, 750ms) linear infinite;
  }

  @keyframes hx-menu-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .menu-item__spinner {
      animation: none;
      opacity: var(--hx-opacity-muted, 0.6);
    }
  }
`;
