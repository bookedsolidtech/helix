import { css } from 'lit';

export const helixTabStyles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled, 0.5);
    pointer-events: none;
  }

  * {
    box-sizing: border-box;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    padding: var(--hx-tabs-tab-padding-y, var(--hx-space-2, 0.5rem))
      var(--hx-tabs-tab-padding-x, var(--hx-space-4, 1rem));
    border: none;
    border-bottom: var(--hx-tabs-indicator-size, 2px) solid transparent;
    background: none;
    font-family: var(--hx-tabs-tab-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-tabs-tab-font-size, var(--hx-font-size-md, 1rem));
    font-weight: var(--hx-tabs-tab-font-weight, var(--hx-font-weight-medium, 500));
    color: var(--hx-tabs-tab-color, var(--hx-color-neutral-600, #495057));
    line-height: var(--hx-line-height-tight, 1.25);
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
    transition:
      color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease),
      background-color var(--hx-transition-fast, 150ms ease);
    position: relative;
  }

  /* ─── Hover State ─── */

  .tab:not([aria-selected='true']):hover {
    color: var(--hx-tabs-tab-hover-color, var(--hx-color-neutral-800, #212529));
    background-color: var(--hx-tabs-tab-hover-bg, var(--hx-color-neutral-50, #f8f9fa));
  }

  /* ─── Selected State ─── */

  .tab[aria-selected='true'] {
    color: var(--hx-tabs-tab-active-color, var(--hx-color-primary-600, #1d4ed8));
    border-bottom-color: var(--hx-tabs-indicator-color, var(--hx-color-primary-500, #2563eb));
    font-weight: var(--hx-tabs-tab-active-font-weight, var(--hx-font-weight-semibold, 600));
  }

  /* ─── Focus State ─── */

  .tab:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-tabs-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-radius: var(--hx-border-radius-sm, 0.125rem);
  }

  /* ─── Disabled State ─── */

  .tab[disabled] {
    cursor: not-allowed;
    color: var(--hx-color-neutral-400, #adb5bd);
  }

  /* ─── Prefix / Suffix Slots ─── */

  .tab__prefix,
  .tab__suffix {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .tab {
      transition: none;
    }
  }
`;
