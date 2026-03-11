import { css } from 'lit';

export const helixSplitPanelStyles = css`
  :host {
    display: flex;
    --_divider-size: var(--hx-split-panel-divider-size, 4px);
    --_divider-color: var(--hx-split-panel-divider-color, var(--hx-color-neutral-200));
    --_divider-hover-color: var(--hx-split-panel-divider-hover-color, var(--hx-color-primary-500));
    overflow: hidden;
  }

  :host([orientation='horizontal']) {
    flex-direction: row;
    width: 100%;
    height: 100%;
  }

  :host([orientation='vertical']) {
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .panel {
    overflow: auto;
    min-width: 0;
    min-height: 0;
  }

  .panel--start {
    flex-shrink: 0;
  }

  .panel--end {
    flex: 1;
  }

  :host([orientation='horizontal']) .panel--start {
    height: 100%;
  }

  :host([orientation='vertical']) .panel--start {
    width: 100%;
  }

  /* ─── Divider Track (flex child wrapper) ─── */

  .divider-track {
    flex-shrink: 0;
    position: relative;
    overflow: visible;
    display: flex;
    align-items: stretch;
  }

  :host([orientation='horizontal']) .divider-track {
    width: var(--_divider-size);
    height: 100%;
  }

  :host([orientation='vertical']) .divider-track {
    width: 100%;
    height: var(--_divider-size);
  }

  /* ─── Divider (separator role — no interactive children) ─── */

  .divider {
    flex: 1;
    background-color: var(--_divider-color);
    cursor: col-resize;
    transition: background-color 0.15s ease;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    outline: none;
  }

  :host([orientation='horizontal']) .divider {
    cursor: col-resize;
  }

  :host([orientation='vertical']) .divider {
    cursor: row-resize;
  }

  .divider:hover,
  .divider:focus-visible {
    background-color: var(--_divider-hover-color);
  }

  .divider:focus-visible {
    outline: 2px solid var(--_divider-hover-color);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--_divider-hover-color) 30%, transparent);
  }

  :host([disabled]) .divider {
    cursor: default;
    pointer-events: none;
  }

  :host([disabled]) .divider:hover,
  :host([disabled]) .divider:focus-visible {
    background-color: var(--_divider-color);
    outline: none;
    box-shadow: none;
  }

  /* ─── Collapse Controls (siblings of separator, not children) ─── */

  .collapse-controls {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    z-index: 2;
    pointer-events: auto;
  }

  :host([orientation='vertical']) .collapse-controls {
    flex-direction: row;
  }

  .collapse-btn {
    background: var(--_divider-hover-color);
    border: 2px solid var(--hx-color-neutral-0);
    color: var(--hx-color-neutral-0);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
  }

  .collapse-btn:hover {
    filter: brightness(1.1);
  }

  .collapse-btn:focus-visible {
    outline: 2px solid var(--hx-color-neutral-0);
    outline-offset: 2px;
  }
`;
