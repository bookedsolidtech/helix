import { css } from 'lit';

export const helixSplitPanelStyles = css`
  :host {
    display: flex;
    --_divider-size: var(--hx-split-panel-divider-size, 4px);
    --_divider-color: var(--hx-split-panel-divider-color, var(--hx-color-neutral-200, #e2e8f0));
    --_divider-hover-color: var(
      --hx-split-panel-divider-hover-color,
      var(--hx-color-primary-500, #3b82f6)
    );
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

  /* ─── Divider ─── */

  .divider {
    flex-shrink: 0;
    background-color: var(--_divider-color);
    cursor: col-resize;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    outline: none;
  }

  :host([orientation='horizontal']) .divider {
    width: var(--_divider-size);
    height: 100%;
    cursor: col-resize;
  }

  :host([orientation='vertical']) .divider {
    width: 100%;
    height: var(--_divider-size);
    cursor: row-resize;
  }

  .divider:hover {
    background-color: var(--_divider-hover-color);
  }

  .divider:focus-visible {
    background-color: var(--_divider-hover-color);
    outline: 2px solid var(--hx-color-focus-ring, var(--hx-color-primary-500, #3b82f6));
    outline-offset: -1px;
  }

  :host([disabled]) .divider {
    cursor: default;
    pointer-events: none;
  }

  :host([disabled]) .divider:hover,
  :host([disabled]) .divider:focus-visible {
    background-color: var(--_divider-color);
  }
`;
