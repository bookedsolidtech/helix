import { css } from 'lit';

export const helixTreeItemStyles = css`
  :host {
    display: block;
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Item Container ─── */

  .item {
    display: block;
  }

  /* ─── Item Row ─── */

  .item-row {
    display: flex;
    align-items: center;
    gap: var(--hx-tree-item-gap, var(--hx-space-2, 0.5rem));
    padding: var(--hx-tree-item-padding-y, var(--hx-space-1, 0.25rem))
      var(--hx-tree-item-padding-x, var(--hx-space-2, 0.5rem));
    padding-left: calc(
      var(--hx-tree-item-padding-x, var(--hx-space-2, 0.5rem)) + var(--_indent-level, 0) *
        var(--hx-tree-indent-size, 1.5rem)
    );
    border-radius: var(--hx-tree-item-border-radius, var(--hx-border-radius-sm, 0.25rem));
    cursor: pointer;
    outline: none;
    color: var(--hx-tree-item-color, var(--hx-color-neutral-900, #111827));
    font-family: var(--hx-tree-item-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-tree-item-font-size, var(--hx-font-size-sm, 0.875rem));
    line-height: var(--hx-line-height-normal, 1.5);
    transition: background-color var(--hx-transition-fast, 150ms ease);
    user-select: none;
  }

  .item-row:hover {
    background-color: var(--hx-tree-item-hover-bg, var(--hx-color-neutral-100, #f3f4f6));
  }

  .item-row:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, -2px);
  }

  /* ─── Selected State ─── */

  :host([selected]) .item-row {
    background-color: var(--hx-tree-item-selected-bg, var(--hx-color-primary-100, #dbeafe));
    color: var(--hx-tree-item-selected-color, var(--hx-color-primary-800, #1e40af));
  }

  :host([selected]) .item-row:hover {
    background-color: var(--hx-tree-item-selected-hover-bg, var(--hx-color-primary-200, #bfdbfe));
  }

  /* ─── Disabled State ─── */

  :host([disabled]) .item-row {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* ─── Expand Icon ─── */

  .expand-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--hx-space-4, 1rem);
    height: var(--hx-space-4, 1rem);
  }

  .expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--hx-space-4, 1rem);
    height: var(--hx-space-4, 1rem);
    padding: 0;
    border: none;
    background: transparent;
    color: var(--hx-tree-item-expand-icon-color, var(--hx-color-neutral-500, #6b7280));
    cursor: pointer;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    transition: transform var(--hx-transition-fast, 150ms ease);
    pointer-events: auto;
  }

  .expand-btn:hover {
    background-color: var(--hx-tree-item-expand-hover-bg, rgba(0, 0, 0, 0.06));
  }

  .expand-btn svg {
    width: var(--hx-space-3, 0.75rem);
    height: var(--hx-space-3, 0.75rem);
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform var(--hx-transition-fast, 150ms ease);
  }

  :host([expanded]) .expand-btn svg {
    transform: rotate(90deg);
  }

  .expand-placeholder {
    display: block;
    width: var(--hx-space-4, 1rem);
    flex-shrink: 0;
  }

  /* ─── Icon Slot ─── */

  .item-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--hx-tree-item-icon-color, var(--hx-color-neutral-500, #6b7280));
  }

  .item-icon:empty {
    display: none;
  }

  /* ─── Label ─── */

  .item-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ─── Children (animated) ─── */

  .children {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--hx-transition-base, 200ms ease);
    --_indent-level: calc(var(--_indent-level, 0) + 1);
  }

  .children--expanded {
    grid-template-rows: 1fr;
  }

  @media (prefers-reduced-motion: reduce) {
    .children {
      transition: none;
    }
  }

  .children-inner {
    overflow: hidden;
  }
`;
