import { css } from 'lit';

export const helixNavStyles = css`
  :host {
    display: block;
    font-family: var(--hx-nav-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-nav-font-size, var(--hx-font-size-sm, 0.875rem));
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Nav Container ─── */

  [part='nav'] {
    position: relative;
    background-color: var(--hx-nav-bg, var(--hx-color-neutral-900, #111827));
    color: var(--hx-nav-color, var(--hx-color-neutral-100, #f3f4f6));
    padding: var(--hx-nav-padding, var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem));
  }

  /* ─── Hamburger Toggle ─── */

  [part='toggle'] {
    display: none;
    align-items: center;
    justify-content: center;
    padding: var(--hx-space-2, 0.5rem);
    background: transparent;
    border: none;
    border-radius: var(--hx-nav-border-radius, var(--hx-border-radius-sm, 0.25rem));
    color: var(--hx-nav-color, var(--hx-color-neutral-100, #f3f4f6));
    cursor: pointer;
    transition: background-color var(--hx-transition-fast, 150ms) ease;
    line-height: 0;
  }

  [part='toggle']:hover {
    background-color: var(--hx-nav-link-hover-bg, var(--hx-color-neutral-700, #374151));
  }

  [part='toggle']:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Navigation List ─── */

  [part='list'] {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: var(--hx-space-1, 0.25rem);
    align-items: center;
  }

  /* ─── Nav Item ─── */

  [part='item'] {
    position: relative;
  }

  /* ─── Nav Link / Button ─── */

  .nav__link {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-1, 0.25rem);
    padding: var(--hx-nav-item-padding, var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem));
    color: var(--hx-nav-link-color, var(--hx-color-neutral-100, #f3f4f6));
    text-decoration: none;
    border-radius: var(--hx-nav-border-radius, var(--hx-border-radius-sm, 0.25rem));
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    font-weight: var(--hx-font-weight-medium, 500);
    line-height: var(--hx-line-height-normal, 1.5);
    white-space: nowrap;
    transition:
      background-color var(--hx-transition-fast, 150ms) ease,
      color var(--hx-transition-fast, 150ms) ease;
  }

  .nav__link:hover {
    background-color: var(--hx-nav-link-hover-bg, var(--hx-color-neutral-700, #374151));
    color: var(--hx-nav-link-hover-color, var(--hx-color-white, #ffffff));
  }

  .nav__link:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .nav__link--active {
    background-color: var(--hx-nav-link-active-bg, var(--hx-color-primary-600, #2563eb));
    color: var(--hx-nav-link-active-color, var(--hx-color-white, #ffffff));
  }

  /* ─── Chevron Icon ─── */

  .nav__chevron {
    transition: transform var(--hx-transition-normal, 200ms) ease;
    flex-shrink: 0;
  }

  .nav__link--expanded .nav__chevron {
    transform: rotate(180deg);
  }

  /* ─── Submenu ─── */

  .nav__submenu {
    position: absolute;
    top: calc(100% + var(--hx-space-1, 0.25rem));
    left: 0;
    min-width: var(--hx-nav-submenu-min-width, 12rem);
    list-style: none;
    margin: 0;
    padding: var(--hx-space-1, 0.25rem) 0;
    background-color: var(--hx-nav-submenu-bg, var(--hx-color-neutral-800, #1f2937));
    border-radius: var(--hx-border-radius-md, 0.375rem);
    box-shadow: var(
      --hx-shadow-md,
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1)
    );
    z-index: var(--hx-z-index-dropdown, 100);
  }

  .nav__submenu[hidden] {
    display: none;
  }

  .nav__submenu .nav__link {
    display: block;
    width: 100%;
    text-align: left;
    border-radius: 0;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem);
  }

  /* ─── Vertical / Sidebar Orientation ─── */

  :host([orientation='vertical']) [part='nav'] {
    padding: var(--hx-space-4, 1rem) var(--hx-space-2, 0.5rem);
  }

  :host([orientation='vertical']) [part='list'] {
    flex-direction: column;
    align-items: stretch;
    gap: var(--hx-space-1, 0.25rem);
  }

  :host([orientation='vertical']) .nav__link {
    width: 100%;
    justify-content: flex-start;
  }

  :host([orientation='vertical']) .nav__submenu {
    position: static;
    box-shadow: none;
    border-radius: 0;
    background-color: transparent;
    padding: 0;
    padding-left: var(--hx-space-4, 1rem);
  }

  :host([orientation='vertical']) .nav__submenu[hidden] {
    display: none;
  }

  :host([orientation='vertical']) .nav__submenu .nav__link {
    padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem);
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-nav-link-color, var(--hx-color-neutral-300, #d1d5db));
  }

  /* ─── Mobile Responsive ─── */

  @media (max-width: 768px) {
    [part='nav'] {
      display: flex;
      flex-direction: column;
      padding: var(--hx-space-2, 0.5rem);
    }

    [part='toggle'] {
      display: inline-flex;
      align-self: flex-end;
    }

    [part='list'] {
      display: none;
      flex-direction: column;
      align-items: stretch;
      width: 100%;
      margin-top: var(--hx-space-2, 0.5rem);
      gap: var(--hx-space-1, 0.25rem);
    }

    [part='list'].nav__list--open {
      display: flex;
    }

    [part='item'] {
      width: 100%;
    }

    .nav__link {
      width: 100%;
      justify-content: flex-start;
    }

    .nav__submenu {
      position: static;
      box-shadow: none;
      border-radius: 0;
      padding-left: var(--hx-space-4, 1rem);
      background-color: transparent;
    }

    .nav__submenu .nav__link {
      padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem);
    }
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .nav__link,
    .nav__chevron,
    [part='toggle'] {
      transition: none;
      animation: none;
    }
  }
`;
