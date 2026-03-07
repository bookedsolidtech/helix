import { css } from 'lit';

export const helixNavItemStyles = css`
  :host {
    display: block;
    background-color: var(--hx-nav-item-host-bg, var(--hx-color-neutral-900, #111827));
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
    color: var(--hx-nav-item-color, var(--hx-color-neutral-300, #d1d5db));
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
    text-align: left;
  }

  /* Link variant */
  a.nav-item__link {
    display: flex;
  }

  .nav-item__link:hover {
    background-color: var(
      --hx-nav-item-hover-bg,
      color-mix(in srgb, currentColor 10%, transparent)
    );
    color: var(--hx-nav-item-hover-color, var(--hx-color-neutral-100, #f3f4f6));
  }

  .nav-item__link:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Active State ─── */

  :host([active]) .nav-item__link {
    background-color: var(--hx-nav-item-active-bg, var(--hx-color-primary-600, #2563eb));
    color: var(--hx-nav-item-active-color, var(--hx-color-neutral-50, #f9fafb));
  }

  :host([active]) .nav-item__link:hover {
    background-color: var(--hx-nav-item-active-hover-bg, var(--hx-color-primary-700, #1d4ed8));
  }

  /* ─── Disabled State ─── */

  :host([disabled]) .nav-item__link {
    opacity: 0.4;
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
    transition:
      opacity var(--hx-transition-fast, 150ms) ease,
      width var(--hx-transition-fast, 150ms) ease;
  }

  /* ─── Badge ─── */

  .nav-item__badge {
    margin-left: auto;
    flex-shrink: 0;
  }

  /* ─── Expand Arrow ─── */

  .nav-item__arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-left: auto;
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
    display: none;
    flex-direction: column;
    padding-left: var(--hx-space-6, 1.5rem);
  }

  :host([expanded]) .nav-item__children {
    display: flex;
  }

  /* ─── Tooltip (collapsed mode) ─── */

  .nav-item__tooltip {
    position: absolute;
    left: calc(100% + var(--hx-space-2, 0.5rem));
    top: 50%;
    transform: translateY(-50%);
    background-color: var(--hx-color-neutral-800, #1f2937);
    color: var(--hx-color-neutral-100, #f3f4f6);
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    font-size: var(--hx-font-size-xs, 0.75rem);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--hx-transition-fast, 150ms) ease;
    z-index: 100;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.2);
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
    .nav-item__label,
    .nav-item__arrow,
    .nav-item__tooltip {
      transition: none;
    }
  }
`;
