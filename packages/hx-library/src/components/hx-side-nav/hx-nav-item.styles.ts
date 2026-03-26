import { css } from 'lit';

export const helixNavItemStyles = css`
  :host {
    display: block;
    /* The host background must be a concrete color so that axe-core can
       resolve text contrast ratios for shadow-DOM content correctly.
       WCAG 2.1 AA: neutral-300 (#cbd5e1) on neutral-900 (#0f172a) = 12.02:1. */
    background-color: var(--hx-nav-item-host-bg, var(--hx-color-neutral-900, #0f172a));
    color: var(--hx-nav-item-color, var(--hx-color-neutral-300, #cbd5e1));
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Nav Item ─── */

  .nav-item {
    display: flex;
    flex-direction: column;
  }

  /* ─── Link / Button ─── */

  .nav-item__link {
    display: flex;
    align-items: center;
    gap: var(--hx-space-3, 0.75rem);
    padding: var(--hx-nav-item-padding, var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem));
    min-height: var(--hx-space-10, 2.5rem);
    text-decoration: none;
    color: var(--hx-nav-item-color, var(--hx-color-neutral-300, #cbd5e1));
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    margin: 0 var(--hx-space-2, 0.5rem);
    transition:
      background-color var(--hx-transition-fast, 150ms) ease,
      color var(--hx-transition-fast, 150ms) ease;
    white-space: nowrap;
    overflow: hidden;
    cursor: pointer;
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    line-height: var(--hx-line-height-normal, 1.5);
    position: relative;
    border: none;
    background: transparent;
    width: calc(100% - var(--hx-space-4, 1rem));
    text-align: start;
  }

  /* Link variant */
  a.nav-item__link {
    display: flex;
  }

  .nav-item__link:hover {
    background-color: var(
      --hx-nav-item-hover-bg,
      var(--hx-overlay-white-8, rgba(255, 255, 255, 0.08))
    ); /* fallback for browsers without color-mix() */
    color: var(--hx-nav-item-hover-color, var(--hx-color-neutral-100, #f1f5f9));
  }

  @supports (color: color-mix(in srgb, red 50%, blue)) {
    .nav-item__link:hover {
      background-color: var(
        --hx-nav-item-hover-bg,
        color-mix(in srgb, currentColor 10%, transparent)
      );
    }
  }

  .nav-item__link:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, var(--hx-color-primary-400, #60a5fa));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Active State ─── */

  :host([active]) .nav-item__link {
    /* neutral-50 (#f8fafc) on primary-600 (#1d4ed8) = 6.41:1 — WCAG AA ✓ */
    background-color: var(--hx-nav-item-active-bg, var(--hx-color-primary-600, #1d4ed8));
    color: var(--hx-nav-item-active-color, var(--hx-color-neutral-50, #f8fafc));
  }

  :host([active]) .nav-item__link:hover {
    /* neutral-50 (#f8fafc) on primary-700 (#1e40af) = 8.05:1 — WCAG AA ✓ */
    background-color: var(--hx-nav-item-active-hover-bg, var(--hx-color-primary-700, #1e40af));
  }

  /* ─── Disabled State ─── */

  :host([disabled]) .nav-item__link {
    opacity: var(--hx-opacity-disabled, 0.5);
    pointer-events: none;
    cursor: not-allowed;
  }

  /* ─── Icon ─── */

  .nav-item__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--hx-space-5, 1.25rem);
    height: var(--hx-space-5, 1.25rem);
  }

  /* ─── Label ─── */

  .nav-item__label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity var(--hx-transition-fast, 150ms) ease;
  }

  /* ─── Badge ─── */

  .nav-item__badge {
    margin-inline-start: auto;
    flex-shrink: 0;
  }

  /* ─── Expand Arrow ─── */

  .nav-item__arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-inline-start: auto;
    width: var(--hx-space-5, 1.25rem);
    height: var(--hx-space-5, 1.25rem);
    transition: transform var(--hx-transition-normal, 300ms) ease;
  }

  .nav-item__arrow svg {
    width: var(--hx-space-4, 1rem);
    height: var(--hx-space-4, 1rem);
    fill: currentColor;
  }

  :host([expanded]) .nav-item__arrow {
    transform: rotate(90deg);
  }

  /* ─── Children (sub-nav) ─── */

  .nav-item__children {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--hx-transition-normal, 300ms ease);
    overflow: hidden;
  }

  :host([expanded]) .nav-item__children {
    grid-template-rows: 1fr;
  }

  .nav-item__children-inner {
    overflow: hidden;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding-inline-start: var(--hx-space-6, 1.5rem);
  }

  /* ─── Tooltip (collapsed mode) ─── */

  .nav-item__tooltip {
    position: absolute;
    left: calc(100% + var(--hx-space-2, 0.5rem));
    top: 50%;
    transform: translateY(-50%);
    /* neutral-100 (#f1f5f9) on neutral-800 (#1e293b) = 13.35:1 — WCAG AA ✓ */
    background-color: var(--hx-color-neutral-800, #1e293b);
    color: var(--hx-color-neutral-100, #f1f5f9);
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    font-size: var(--hx-font-size-xs, 0.75rem);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--hx-transition-fast, 150ms) ease;
    z-index: var(--hx-z-index-tooltip, 1600);
    box-shadow: var(--hx-shadow-md, 0 2px 8px rgb(0 0 0 / 0.2));
  }

  :host([data-collapsed]) .nav-item__link:hover .nav-item__tooltip,
  :host([data-collapsed]) .nav-item__link:focus-visible .nav-item__tooltip {
    opacity: 1;
  }

  /* ─── Collapsed host state (propagated from parent) ─── */

  :host([data-collapsed]) .nav-item__label {
    width: 0;
    overflow: hidden;
    opacity: 0;
  }

  :host([data-collapsed]) .nav-item__badge {
    display: none;
  }

  :host([data-collapsed]) .nav-item__arrow {
    display: none;
  }

  :host([data-collapsed]) .nav-item__children {
    display: none !important;
  }

  :host([data-collapsed]) .nav-item__link {
    justify-content: center;
    margin: 0 var(--hx-space-1, 0.25rem);
    width: calc(100% - var(--hx-space-2, 0.5rem));
    padding: var(--hx-space-2, 0.5rem);
    position: relative;
    overflow: visible;
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-item__link,
    .nav-item__label,
    .nav-item__arrow,
    .nav-item__children,
    .nav-item__tooltip {
      transition: none;
    }

    :host([expanded]) .nav-item__children {
      grid-template-rows: 1fr;
    }
  }
`;
