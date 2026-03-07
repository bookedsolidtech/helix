import { css } from 'lit';

export const helixTileStyles = css`
  :host {
    display: inline-block;
  }

  .tile {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--hx-tile-gap, var(--hx-space-3, 0.75rem));
    padding: var(--hx-tile-padding, var(--hx-space-5, 1.25rem));
    background-color: var(--hx-tile-bg, var(--hx-color-neutral-0, #ffffff));
    color: var(--hx-tile-color, var(--hx-color-neutral-800, #212529));
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-tile-border-color, var(--hx-color-neutral-200, #dee2e6));
    border-radius: var(--hx-tile-border-radius, var(--hx-border-radius-lg, 0.5rem));
    font-family: var(--hx-font-family-sans, sans-serif);
    cursor: default;
    transition:
      box-shadow var(--hx-transition-normal, 250ms ease),
      transform var(--hx-transition-normal, 250ms ease),
      background-color var(--hx-transition-normal, 250ms ease),
      border-color var(--hx-transition-normal, 250ms ease);
    text-decoration: none;
    box-sizing: border-box;
    width: 100%;
  }

  /* ─── Variants ─── */

  .tile--outlined {
    background-color: transparent;
    border-width: var(--hx-border-width-medium, 2px);
  }

  .tile--filled {
    background-color: var(--hx-color-primary-50, #eff6ff);
    border-color: var(--hx-color-primary-200, #bfdbfe);
  }

  /* ─── Interactive (link or button mode) ─── */

  .tile--interactive {
    cursor: pointer;
  }

  .tile--interactive:hover {
    box-shadow: var(--hx-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
    transform: translateY(var(--hx-transform-lift-sm, -1px));
  }

  .tile--interactive:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .tile--interactive:active {
    transform: translateY(0);
  }

  /* ─── Selected ─── */

  .tile--selected {
    border-color: var(--hx-color-primary-500, #2563eb);
    border-width: var(--hx-border-width-medium, 2px);
    background-color: var(--hx-color-primary-50, #eff6ff);
  }

  /* ─── Disabled ─── */

  .tile--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* ─── Sections ─── */

  .tile__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--hx-tile-icon-size, 2.5rem);
    line-height: 1;
  }

  .tile__icon:empty {
    display: none;
  }

  .tile__label {
    font-size: var(--hx-font-size-md, 1rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    line-height: var(--hx-line-height-tight, 1.25);
    color: var(--hx-tile-label-color, var(--hx-color-neutral-800, #212529));
  }

  .tile__description {
    font-size: var(--hx-font-size-sm, 0.875rem);
    line-height: var(--hx-line-height-normal, 1.5);
    color: var(--hx-tile-description-color, var(--hx-color-neutral-600, #495057));
  }

  .tile__badge {
    position: absolute;
    top: var(--hx-space-2, 0.5rem);
    right: var(--hx-space-2, 0.5rem);
  }

  .tile__badge:empty {
    display: none;
  }

  [hidden] {
    display: none !important;
  }
`;
