import { css } from 'lit';

export const helixOverflowMenuStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.4);
  }

  /* ─── Trigger Button ─── */

  .trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: var(--hx-border-width-thin, 1px) solid transparent;
    border-radius: var(--hx-border-radius-md, 0.375rem);
    background-color: transparent;
    color: var(--hx-overflow-menu-button-color, var(--hx-color-neutral-600, #4b5563));
    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast, 0.15s ease),
      color var(--hx-transition-fast, 0.15s ease);
    flex-shrink: 0;
    padding: 0;
    line-height: 1;
  }

  .trigger:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .trigger:hover:not([disabled]) {
    background-color: var(--hx-color-neutral-100, #f3f4f6);
  }

  .trigger--open {
    background-color: var(--hx-color-neutral-100, #f3f4f6);
  }

  .trigger[disabled] {
    cursor: not-allowed;
  }

  /* ─── Size Variants ─── */

  .trigger--sm {
    width: var(--hx-size-8, 2rem);
    height: var(--hx-size-8, 2rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
  }

  .trigger--md {
    width: var(--hx-size-10, 2.5rem);
    height: var(--hx-size-10, 2.5rem);
    font-size: var(--hx-font-size-md, 1rem);
  }

  .trigger--lg {
    width: var(--hx-size-12, 3rem);
    height: var(--hx-size-12, 3rem);
    font-size: var(--hx-font-size-lg, 1.125rem);
  }

  /* ─── Panel ─── */

  .panel {
    position: fixed;
    z-index: var(--hx-overflow-menu-panel-z-index, 1000);
    min-width: var(--hx-overflow-menu-panel-min-width, 160px);
    background: var(--hx-overflow-menu-panel-bg, var(--hx-color-neutral-0, #fff));
    border: var(--hx-overflow-menu-panel-border, 1px solid var(--hx-color-neutral-200, #e5e7eb));
    border-radius: var(
      --hx-overflow-menu-panel-border-radius,
      var(--hx-border-radius-md, 0.375rem)
    );
    box-shadow: var(--hx-overflow-menu-panel-shadow, 0 4px 16px rgba(0, 0, 0, 0.12));
    padding: var(--hx-space-1, 0.25rem) 0;
    outline: none;
  }

  /* ─── Slot: menu items ─── */

  ::slotted([role='menuitem']),
  ::slotted([role='menuitemcheckbox']),
  ::slotted([role='menuitemradio']) {
    display: block;
    width: 100%;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    background: none;
    border: none;
    text-align: left;
    font-size: var(--hx-font-size-sm, 0.875rem);
    color: var(--hx-color-neutral-900, #111827);
    cursor: pointer;
    white-space: nowrap;
    box-sizing: border-box;
  }

  ::slotted([role='menuitem']:hover),
  ::slotted([role='menuitemcheckbox']:hover),
  ::slotted([role='menuitemradio']:hover) {
    background-color: var(--hx-color-neutral-50, #f9fafb);
  }

  ::slotted([role='menuitem']:focus-visible),
  ::slotted([role='menuitemcheckbox']:focus-visible),
  ::slotted([role='menuitemradio']:focus-visible) {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: -2px;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .trigger {
      transition: none;
    }
  }
`;
