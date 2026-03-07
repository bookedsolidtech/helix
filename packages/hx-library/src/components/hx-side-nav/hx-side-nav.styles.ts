import { css } from 'lit';

export const helixSideNavStyles = css`
  :host {
    display: block;
    height: 100%;
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Nav Container ─── */

  .side-nav {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: var(--hx-side-nav-width, 16rem);
    background-color: var(--hx-side-nav-bg, var(--hx-color-neutral-900, #111827));
    color: var(--hx-side-nav-color, var(--hx-color-neutral-100, #f3f4f6));
    transition: width var(--hx-transition-normal, 300ms) ease;
    overflow: hidden;
    border-right: var(--hx-border-width-thin, 1px) solid
      var(--hx-side-nav-border-color, var(--hx-color-neutral-700, #374151));
  }

  /* ─── Collapsed State ─── */

  :host([collapsed]) .side-nav {
    width: var(--hx-side-nav-collapsed-width, 3.5rem);
  }

  /* ─── Header ─── */

  .side-nav__header {
    display: flex;
    align-items: center;
    padding: var(--hx-side-nav-header-padding, var(--hx-space-4, 1rem));
    flex-shrink: 0;
    min-height: var(--hx-space-14, 3.5rem);
    border-bottom: var(--hx-border-width-thin, 1px) solid
      var(--hx-side-nav-border-color, var(--hx-color-neutral-700, #374151));
    overflow: hidden;
  }

  :host([collapsed]) .side-nav__header {
    justify-content: center;
    padding: var(--hx-space-3, 0.75rem);
  }

  /* ─── Body ─── */

  .side-nav__body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--hx-space-2, 0.5rem) 0;
  }

  /* ─── Footer ─── */

  .side-nav__footer {
    display: flex;
    align-items: center;
    padding: var(--hx-side-nav-footer-padding, var(--hx-space-4, 1rem));
    flex-shrink: 0;
    min-height: var(--hx-space-14, 3.5rem);
    border-top: var(--hx-border-width-thin, 1px) solid
      var(--hx-side-nav-border-color, var(--hx-color-neutral-700, #374151));
    overflow: hidden;
  }

  :host([collapsed]) .side-nav__footer {
    justify-content: center;
    padding: var(--hx-space-3, 0.75rem);
  }

  /* ─── Toggle Button ─── */

  .side-nav__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--hx-space-8, 2rem);
    height: var(--hx-space-8, 2rem);
    margin-left: auto;
    flex-shrink: 0;
    padding: 0;
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    color: var(--hx-side-nav-toggle-color, var(--hx-color-neutral-400, #9ca3af));
    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast, 150ms) ease,
      color var(--hx-transition-fast, 150ms) ease;
  }

  .side-nav__toggle:hover {
    background-color: color-mix(in srgb, currentColor 15%, transparent);
    color: var(--hx-color-neutral-100, #f3f4f6);
  }

  .side-nav__toggle:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .side-nav__toggle svg {
    width: var(--hx-space-5, 1.25rem);
    height: var(--hx-space-5, 1.25rem);
    fill: currentColor;
    flex-shrink: 0;
    transition: transform var(--hx-transition-normal, 300ms) ease;
  }

  :host([collapsed]) .side-nav__toggle svg {
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .side-nav {
      transition: none;
    }

    .side-nav__toggle svg {
      transition: none;
    }
  }
`;
