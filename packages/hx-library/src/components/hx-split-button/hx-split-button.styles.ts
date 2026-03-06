import { css } from 'lit';

export const helixSplitButtonStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  /* ─── Container ─── */

  .split-button {
    display: inline-flex;
    align-items: stretch;
    position: relative;
  }

  /* ─── Primary Button ─── */

  .split-button__primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-2, 0.5rem);
    border: var(--hx-border-width-thin, 1px) solid var(--hx-split-button-border-color, transparent);
    border-right: none;
    border-radius: var(--hx-split-button-border-radius, var(--hx-border-radius-md, 0.375rem)) 0 0
      var(--hx-split-button-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-split-button-bg, var(--hx-color-primary-500, #2563eb));
    color: var(--hx-split-button-color, var(--hx-color-neutral-0, #ffffff));
    font-family: var(--hx-split-button-font-family, var(--hx-font-family-sans, sans-serif));
    font-weight: var(--hx-split-button-font-weight, var(--hx-font-weight-semibold, 600));
    line-height: var(--hx-line-height-tight, 1.25);
    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    text-decoration: none;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
    flex: 1 1 auto;
  }

  .split-button__primary:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-split-button-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    z-index: 1;
    position: relative;
  }

  .split-button__primary:hover {
    filter: brightness(var(--hx-filter-brightness-hover, 0.9));
  }

  .split-button__primary:active {
    filter: brightness(var(--hx-filter-brightness-active, 0.8));
  }

  .split-button__primary[disabled] {
    cursor: not-allowed;
  }

  /* ─── Trigger Button ─── */

  .split-button__trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: var(--hx-border-width-thin, 1px) solid var(--hx-split-button-border-color, transparent);
    border-left: var(--hx-border-width-thin, 1px) solid
      var(--hx-split-button-divider-color, var(--hx-color-primary-400, #3b82f6));
    border-radius: 0 var(--hx-split-button-border-radius, var(--hx-border-radius-md, 0.375rem))
      var(--hx-split-button-border-radius, var(--hx-border-radius-md, 0.375rem)) 0;
    background-color: var(--hx-split-button-bg, var(--hx-color-primary-500, #2563eb));
    color: var(--hx-split-button-color, var(--hx-color-neutral-0, #ffffff));
    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    user-select: none;
    -webkit-user-select: none;
  }

  .split-button__trigger:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-split-button-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    z-index: 1;
    position: relative;
  }

  .split-button__trigger:hover {
    filter: brightness(var(--hx-filter-brightness-hover, 0.9));
  }

  .split-button__trigger:active {
    filter: brightness(var(--hx-filter-brightness-active, 0.8));
  }

  .split-button__trigger[disabled] {
    cursor: not-allowed;
  }

  /* ─── Trigger Icon ─── */

  .split-button__chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--hx-transition-fast, 150ms ease);
  }

  .split-button__chevron--open {
    transform: rotate(180deg);
  }

  /* ─── Size Variants ─── */

  /* sm */
  .split-button--sm .split-button__primary {
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-3, 0.75rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    min-height: var(--hx-size-8, 2rem);
  }

  .split-button--sm .split-button__trigger {
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
    min-height: var(--hx-size-8, 2rem);
  }

  /* md */
  .split-button--md .split-button__primary {
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem);
    font-size: var(--hx-font-size-md, 1rem);
    min-height: var(--hx-size-10, 2.5rem);
  }

  .split-button--md .split-button__trigger {
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    min-height: var(--hx-size-10, 2.5rem);
  }

  /* lg */
  .split-button--lg .split-button__primary {
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-6, 1.5rem);
    font-size: var(--hx-font-size-lg, 1.125rem);
    min-height: var(--hx-size-12, 3rem);
  }

  .split-button--lg .split-button__trigger {
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem);
    min-height: var(--hx-size-12, 3rem);
  }

  /* ─── Variant: primary ─── */

  .split-button--primary .split-button__primary,
  .split-button--primary .split-button__trigger {
    --hx-split-button-bg: var(--hx-color-primary-500, #2563eb);
    --hx-split-button-color: var(--hx-color-neutral-0, #ffffff);
    --hx-split-button-border-color: transparent;
    --hx-split-button-divider-color: var(--hx-color-primary-400, #3b82f6);
  }

  /* ─── Variant: secondary ─── */

  .split-button--secondary .split-button__primary,
  .split-button--secondary .split-button__trigger {
    --hx-split-button-bg: transparent;
    --hx-split-button-color: var(--hx-color-primary-500, #2563eb);
    --hx-split-button-border-color: var(--hx-color-primary-500, #2563eb);
    --hx-split-button-divider-color: var(--hx-color-primary-300, #93c5fd);
  }

  .split-button--secondary .split-button__primary:hover,
  .split-button--secondary .split-button__trigger:hover {
    --hx-split-button-bg: var(--hx-color-primary-50, #eff6ff);
    filter: none;
  }

  /* ─── Variant: tertiary ─── */

  .split-button--tertiary .split-button__primary,
  .split-button--tertiary .split-button__trigger {
    --hx-split-button-bg: var(--hx-color-neutral-100, #f1f5f9);
    --hx-split-button-color: var(--hx-color-neutral-900, #0f172a);
    --hx-split-button-border-color: transparent;
    --hx-split-button-divider-color: var(--hx-color-neutral-300, #cbd5e1);
  }

  .split-button--tertiary .split-button__primary:hover,
  .split-button--tertiary .split-button__trigger:hover {
    --hx-split-button-bg: var(--hx-color-neutral-200, #e2e8f0);
    filter: none;
  }

  /* ─── Variant: danger ─── */

  .split-button--danger .split-button__primary,
  .split-button--danger .split-button__trigger {
    --hx-split-button-bg: var(--hx-color-error-500, #dc2626);
    --hx-split-button-color: var(--hx-color-neutral-0, #ffffff);
    --hx-split-button-border-color: transparent;
    --hx-split-button-divider-color: var(--hx-color-error-400, #f87171);
  }

  .split-button--danger .split-button__primary:hover,
  .split-button--danger .split-button__trigger:hover {
    --hx-split-button-bg: var(--hx-color-error-600, #b91c1c);
    filter: none;
  }

  /* ─── Variant: ghost ─── */

  .split-button--ghost .split-button__primary,
  .split-button--ghost .split-button__trigger {
    --hx-split-button-bg: transparent;
    --hx-split-button-color: var(--hx-color-primary-500, #2563eb);
    --hx-split-button-border-color: transparent;
    --hx-split-button-divider-color: var(--hx-color-primary-200, #bfdbfe);
  }

  .split-button--ghost .split-button__primary:hover,
  .split-button--ghost .split-button__trigger:hover {
    --hx-split-button-bg: var(--hx-color-neutral-100, #f1f5f9);
    filter: none;
  }

  /* ─── Variant: outline ─── */

  .split-button--outline .split-button__primary,
  .split-button--outline .split-button__trigger {
    --hx-split-button-bg: transparent;
    --hx-split-button-color: var(--hx-color-neutral-900, #0f172a);
    --hx-split-button-border-color: var(--hx-color-neutral-300, #cbd5e1);
    --hx-split-button-divider-color: var(--hx-color-neutral-300, #cbd5e1);
  }

  .split-button--outline .split-button__primary:hover,
  .split-button--outline .split-button__trigger:hover {
    --hx-split-button-bg: var(--hx-color-neutral-50, #f8fafc);
    filter: none;
  }

  /* ─── Dropdown Menu Panel ─── */

  .split-button__menu {
    display: none;
    position: absolute;
    top: calc(100% + var(--hx-space-1, 0.25rem));
    inset-inline-end: 0;
    min-width: 100%;
    background-color: var(--hx-split-button-menu-bg, var(--hx-color-neutral-0, #ffffff));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-split-button-menu-border-color, var(--hx-color-neutral-200, #e2e8f0));
    border-radius: var(--hx-split-button-menu-border-radius, var(--hx-border-radius-md, 0.375rem));
    box-shadow: var(
      --hx-split-button-menu-shadow,
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -2px rgba(0, 0, 0, 0.1)
    );
    padding: var(--hx-space-1, 0.25rem);
    z-index: var(--hx-z-index-dropdown, 200);
    overflow: hidden;
  }

  .split-button__menu--open {
    display: block;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .split-button__primary,
    .split-button__trigger,
    .split-button__chevron {
      transition: none;
    }
  }
`;
