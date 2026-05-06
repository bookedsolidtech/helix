import { css } from 'lit';

export const helixTabStyles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  * {
    box-sizing: border-box;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    min-height: var(--hx-touch-target-min, 44px);
    padding: var(--hx-tabs-tab-padding-y, var(--hx-space-2, 0.5rem))
      var(--hx-tabs-tab-padding-x, var(--hx-space-4, 1rem));
    border: none;
    border-bottom: var(--_tab-indicator-bottom, var(--hx-tabs-indicator-size, 2px)) solid
      transparent;
    border-inline-end: var(--_tab-indicator-end, 0px) solid transparent;
    background: none;
    font-family: var(--hx-tabs-tab-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-tabs-tab-font-size, var(--hx-font-size-md, 1rem));
    font-weight: var(--hx-tabs-tab-font-weight, var(--hx-font-weight-medium, 500));
    color: var(--hx-tabs-tab-color, var(--hx-color-neutral-600, #4a5362));
    line-height: var(--hx-line-height-tight, 1.25);
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
    transition:
      color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease),
      border-inline-end-color var(--hx-transition-fast, 150ms ease),
      background-color var(--hx-transition-fast, 150ms ease);
    position: relative;
  }

  /* ─── Hover State ───
     Group 5a host-canonical: drive visual state from host attributes
     (selected / disabled are reflect: true), not from inner-element ARIA
     attributes which now live on the host's ElementInternals. */

  :host(:not([selected]):not([disabled])) .tab:hover {
    color: var(--hx-tabs-tab-hover-color, var(--hx-color-neutral-800, #202b39));
    background-color: var(--hx-tabs-tab-hover-bg, var(--hx-color-neutral-50, #f5f8f3));
  }

  /* ─── Selected State ─── */

  :host([selected]) .tab {
    color: var(--hx-tabs-tab-active-color, var(--hx-color-primary-600, #0f7078));
    border-bottom-color: var(
      --_tab-indicator-bottom-color,
      var(--hx-tabs-indicator-color, var(--hx-color-primary-500, #429797))
    );
    border-inline-end-color: var(--_tab-indicator-end-color, transparent);
    font-weight: var(--hx-tabs-tab-active-font-weight, var(--hx-font-weight-semibold, 600));
  }

  /* ─── Focus State ───
     Focus lands on the HOST in Group 5a host-canonical mode. The inner
     [part="tab"] is presentational (tabindex=-1). Use :host(:focus-visible). */

  :host(:focus-visible) .tab {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-tabs-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
  }

  /* Strip the default host focus ring — outline lands on the inner [part="tab"]
     surface above for visual continuity with the existing component appearance. */
  :host(:focus) {
    outline: none;
  }

  /* ─── Disabled State ─── */

  :host([disabled]) {
    cursor: not-allowed;
  }

  :host([disabled]) .tab {
    pointer-events: none;
    color: var(--hx-tabs-tab-disabled-color, var(--hx-color-neutral-400, #8e9c98));
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

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .tab {
      forced-color-adjust: none;
      color: ButtonText;
      border-bottom-color: transparent;
      background-color: ButtonFace;
    }

    :host([selected]) .tab {
      color: HighlightText;
      background-color: Highlight;
      border-bottom-color: Highlight;
    }

    :host(:focus-visible) .tab {
      outline: 3px solid Highlight;
      outline-offset: 2px;
    }

    :host([disabled]) .tab {
      color: GrayText;
    }
  }
`;
