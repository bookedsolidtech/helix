import { css } from 'lit';

export const helixMenuItemStyles = css`
  :host {
    display: block;
    /* Host carries the roving tabindex on the modern host-canonical path,
       so it becomes the focusable surface. Strip the default focus outline
       from the host so the inner .menu-item:focus-visible (and the host
       :focus-visible rule below) own the visual treatment. */
    outline: none;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  /* Host is the Tab stop on the modern path; mirror the inner focus-ring
     onto the host so keyboard focus is visible on whichever surface the
     UA paints. The inner-element rule below still applies on the legacy
     fallback path (where the inner div carries the role + tabindex). */
  :host(:focus-visible) .menu-item {
    background-color: var(--hx-menu-item-hover-bg, var(--hx-color-surface-sunken, #ebeee9));
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-menu-item-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    outline-offset: var(--hx-menu-item-focus-ring-offset, 0px);
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    min-height: var(--hx-touch-target-min, 44px);
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    cursor: pointer;
    color: var(--hx-menu-item-color, var(--hx-color-text-primary, #0d1825));
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-family: var(--hx-menu-item-font-family, var(--hx-font-family-sans, sans-serif));
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
    background-color: var(--hx-menu-item-hover-bg, var(--hx-color-surface-sunken, #ebeee9));
  }

  .menu-item:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-menu-item-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    outline-offset: var(--hx-menu-item-focus-ring-offset, 0px);
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

  /* hx-icon glyph sizing for migrated checked / submenu indicators (1em parity). */
  .menu-item__glyph {
    --hx-icon-size: 1em;
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
    .menu-item {
      transition: none;
    }

    .menu-item__checked-icon {
      transition: none;
    }

    .menu-item__spinner {
      animation: none;
      opacity: var(--hx-opacity-muted, 0.6);
    }
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .menu-item {
      forced-color-adjust: none;
      color: CanvasText;
      background-color: Canvas;
    }

    .menu-item:hover,
    .menu-item:focus-visible {
      background-color: Highlight;
      color: HighlightText;
    }

    .menu-item:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: -2px;
    }

    /* Host-canonical focus parity in forced-colors mode. */
    :host(:focus-visible) .menu-item {
      background-color: Highlight;
      color: HighlightText;
      outline: 2px solid Highlight;
      outline-offset: -2px;
    }

    :host([disabled]) .menu-item {
      color: GrayText;
      opacity: 1;
    }
  }
`;
