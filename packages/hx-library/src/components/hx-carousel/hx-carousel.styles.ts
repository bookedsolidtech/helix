import { css } from 'lit';

export const helixCarouselStyles = css`
  :host {
    display: block;
    position: relative;
  }

  /* ─── Base ─── */

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-3, 0.75rem);
  }

  :host([orientation='vertical']) .base {
    flex-direction: row;
  }

  /* ─── Navigation ─── */

  .navigation {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-2, 0.5rem);
  }

  :host([orientation='vertical']) .navigation {
    flex-direction: column;
  }

  .nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--hx-size-10, 2.5rem);
    height: var(--hx-size-10, 2.5rem);
    border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #e5e7eb);
    border-radius: var(--hx-border-radius-full, 9999px);
    background: var(--hx-color-neutral-0, #fff);
    color: var(--hx-color-neutral-700, #374151);
    cursor: pointer;
    padding: 0;
    transition:
      background-color var(--hx-transition-fast, 0.15s ease),
      color var(--hx-transition-fast, 0.15s ease),
      border-color var(--hx-transition-fast, 0.15s ease);
    flex-shrink: 0;
  }

  .nav-btn:hover:not([disabled]) {
    background: var(--hx-color-neutral-50, #f9fafb);
    border-color: var(--hx-color-neutral-400, #9ca3af);
  }

  .nav-btn:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .nav-btn[disabled] {
    opacity: var(--hx-opacity-disabled, 0.4);
    cursor: not-allowed;
  }

  .nav-btn svg {
    width: 1.25em;
    height: 1.25em;
  }

  /* ─── Play/Pause ─── */

  .play-pause-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--hx-size-8, 2rem);
    height: var(--hx-size-8, 2rem);
    border: var(--hx-border-width-thin, 1px) solid transparent;
    border-radius: var(--hx-border-radius-md, 0.375rem);
    background: transparent;
    color: var(--hx-color-neutral-500, #6b7280);
    cursor: pointer;
    padding: 0;
    font-size: var(--hx-font-size-sm, 0.875rem);
    transition: background-color var(--hx-transition-fast, 0.15s ease);
    flex-shrink: 0;
  }

  .play-pause-btn:hover {
    background: var(--hx-color-neutral-100, #f3f4f6);
  }

  .play-pause-btn:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Scroll Container ─── */

  .scroll-container-wrapper {
    flex: 1;
    overflow: hidden;
  }

  .scroll-container {
    overflow: hidden;
    border-radius: var(--hx-border-radius-md, 0.375rem);
  }

  .track {
    display: flex;
    transition: transform var(--hx-transition-base, 0.3s ease);
  }

  :host([orientation='vertical']) .track {
    flex-direction: column;
  }

  /* ─── Pagination ─── */

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-2, 0.5rem);
    flex-wrap: wrap;
  }

  :host([orientation='vertical']) .pagination {
    flex-direction: column;
  }

  .pagination-item {
    display: inline-flex;
    padding: 0;
    border: none;
    cursor: pointer;
    background: transparent;
    border-radius: var(--hx-border-radius-full, 9999px);
  }

  .pagination-dot {
    display: block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: var(--hx-border-radius-full, 9999px);
    background: var(--hx-color-neutral-300, #d1d5db);
    transition:
      background-color var(--hx-transition-fast, 0.15s ease),
      transform var(--hx-transition-fast, 0.15s ease);
  }

  .pagination-item[aria-current='true'] .pagination-dot,
  .pagination-item.is-active .pagination-dot {
    background: var(--hx-color-primary-600, #2563eb);
    transform: scale(1.25);
  }

  .pagination-item:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-radius: var(--hx-border-radius-full, 9999px);
  }

  /* ─── Controls row ─── */

  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-3, 0.75rem);
  }

  /* ─── Screen Reader Only ─── */

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .track,
    .nav-btn,
    .pagination-dot,
    .play-pause-btn {
      transition: none;
    }
  }
`;
