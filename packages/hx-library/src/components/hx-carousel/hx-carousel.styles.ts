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
    width: var(--hx-carousel-nav-btn-size, var(--hx-size-10, 2.5rem));
    height: var(--hx-carousel-nav-btn-size, var(--hx-size-10, 2.5rem));
    /* WCAG 2.5.5 (healthcare mandate): minimum 44x44px touch target */
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-carousel-nav-btn-border-color, var(--hx-color-neutral-200, #d6dbd5));
    border-radius: var(--hx-border-radius-full, 9999px);
    background: var(--hx-carousel-nav-btn-bg, var(--hx-color-neutral-0, #ffffff));
    color: var(--hx-carousel-nav-btn-color, var(--hx-color-neutral-700, #313e4b));
    cursor: pointer;
    padding: 0;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease);
    flex-shrink: 0;
  }

  .nav-btn:hover:not([disabled]) {
    background: var(--hx-carousel-nav-btn-hover-bg, var(--hx-color-neutral-50, #f5f8f3));
    border-color: var(
      --hx-carousel-nav-btn-hover-border-color,
      var(--hx-color-neutral-400, #8e9c98)
    );
  }

  .nav-btn:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-carousel-focus-ring-color, var(--hx-focus-ring-color, var(--hx-color-primary-500)));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .nav-btn[disabled] {
    opacity: var(--hx-opacity-disabled, 0.5);
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
    /* WCAG 2.5.5 (healthcare mandate): minimum 44x44px touch target */
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
    width: var(--hx-touch-target-min, 2.75rem);
    height: var(--hx-touch-target-min, 2.75rem);
    border: var(--hx-border-width-thin, 1px) solid transparent;
    border-radius: var(--hx-border-radius-md, 0.375rem);
    background: transparent;
    color: var(--hx-carousel-play-pause-color, var(--hx-color-neutral-500, #66787b));
    cursor: pointer;
    padding: 0;
    font-size: var(--hx-font-size-sm, 0.875rem);
    transition: background-color var(--hx-transition-fast, 150ms ease);
    flex-shrink: 0;
  }

  .play-pause-btn:hover {
    background: var(--hx-carousel-play-pause-hover-bg, var(--hx-color-neutral-100, #ebeee9));
  }

  .play-pause-btn:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-carousel-focus-ring-color, var(--hx-focus-ring-color, var(--hx-color-primary-500)));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Scroll Container ─── */

  .scroll-container-wrapper {
    flex: 1;
    overflow: hidden;
  }

  .slide-viewport {
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
    align-items: center;
    justify-content: center;
    /* WCAG 2.5.5 (healthcare mandate): minimum 44x44px touch target */
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
    padding: 0;
    border: none;
    cursor: pointer;
    background: transparent;
    border-radius: var(--hx-border-radius-full, 9999px);
  }

  .pagination-dot {
    display: block;
    width: var(--hx-carousel-pagination-dot-size, 0.5rem);
    height: var(--hx-carousel-pagination-dot-size, 0.5rem);
    border-radius: var(--hx-border-radius-full, 9999px);
    background: var(--hx-carousel-pagination-dot-bg, var(--hx-color-neutral-300, #b6bfb9));
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      transform var(--hx-transition-fast, 150ms ease);
  }

  .pagination-item[aria-current='true'] .pagination-dot,
  .pagination-item.is-active .pagination-dot {
    background: var(--hx-carousel-pagination-dot-active-bg, var(--hx-color-primary-600, #0f7078));
    transform: scale(1.25);
  }

  .pagination-item:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-carousel-focus-ring-color, var(--hx-focus-ring-color, var(--hx-color-primary-500)));
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

  /* ─── Live Region ─── */

  .live-region {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
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

  /* ─── Forced Colors (Windows High Contrast) ─── */

  @media (forced-colors: active) {
    .nav-btn {
      border-color: ButtonText;
      color: ButtonText;
    }

    .play-pause-btn {
      border-color: ButtonText;
      color: ButtonText;
    }

    .pagination-dot {
      border: 1px solid CanvasText;
    }

    .pagination-item[aria-current='true'] .pagination-dot,
    .pagination-item.is-active .pagination-dot {
      background: Highlight;
      border-color: Highlight;
    }
  }
`;
