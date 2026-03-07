import { css } from 'lit';

export const helixTabsStyles = css`
  :host {
    display: block;
    font-family: var(--hx-font-family-sans, sans-serif);
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Container ─── */

  .tabs {
    display: flex;
    flex-direction: column;
    gap: var(--hx-tabs-gap, 0);
  }

  :host([orientation='vertical']) .tabs {
    flex-direction: row;
  }

  /* ─── Tablist ─── */

  .tablist {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 0;
    border-bottom: var(--hx-tabs-border-width, 1px) solid
      var(--hx-tabs-border-color, var(--hx-color-neutral-200, #e9ecef));
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .tablist::-webkit-scrollbar {
    display: none;
  }

  /* ─── Vertical Orientation ─── */

  :host([orientation='vertical']) {
    --_tab-indicator-bottom: 0px;
    --_tab-indicator-end: var(--hx-tabs-indicator-size, 2px);
    --_tab-indicator-bottom-color: transparent;
    --_tab-indicator-end-color: var(
      --hx-tabs-indicator-color,
      var(--hx-color-primary-500, #2563eb)
    );
  }

  :host([orientation='vertical']) .tablist {
    flex-direction: column;
    border-bottom: none;
    border-inline-end: var(--hx-tabs-border-width, 1px) solid
      var(--hx-tabs-border-color, var(--hx-color-neutral-200, #e9ecef));
    overflow-x: visible;
    overflow-y: auto;
    min-width: var(--hx-tabs-vertical-width, 12rem);
    flex-shrink: 0;
  }

  /* ─── Panels Container ─── */

  .panels {
    flex: 1 1 auto;
    min-width: 0;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .tablist {
      scroll-behavior: auto;
    }
  }
`;
