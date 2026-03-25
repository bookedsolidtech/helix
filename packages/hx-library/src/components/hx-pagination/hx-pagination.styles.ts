import { css } from 'lit';

export const helixPaginationStyles = css`
  :host {
    display: block;
    font-family: var(--hx-font-family-sans, sans-serif);
  }

  .pagination-root {
    display: flex;
    align-items: center;
    gap: var(--hx-space-4, 1rem);
    flex-wrap: wrap;
  }

  nav {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .list {
    display: flex;
    align-items: center;
    gap: var(--hx-pagination-gap, var(--hx-space-1, 0.25rem));
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .item {
    display: flex;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--hx-pagination-button-size, 2.25rem);
    height: var(--hx-pagination-button-size, 2.25rem);
    padding: 0 var(--hx-space-2, 0.5rem);
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-pagination-border-color, var(--hx-color-neutral-300, #d1d5db));
    border-radius: var(--hx-pagination-border-radius, var(--hx-border-radius-md, 0.375rem));
    background: var(--hx-pagination-bg, var(--hx-color-neutral-0, #ffffff));
    color: var(--hx-pagination-color, var(--hx-color-neutral-900, #111827));
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-family: inherit;
    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast, 150ms) ease,
      border-color var(--hx-transition-fast, 150ms) ease,
      color var(--hx-transition-fast, 150ms) ease;
    text-decoration: none;
    white-space: nowrap;
  }

  .button:hover:not(:disabled) {
    background: var(--hx-pagination-hover-bg, var(--hx-color-neutral-100, #f3f4f6));
    border-color: var(--hx-pagination-hover-border-color, var(--hx-color-primary-500, #2563eb));
  }

  .button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-pagination-focus-ring-color, var(--hx-focus-ring-color, var(--hx-color-primary-500)));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .button[aria-current='page'] {
    background: var(--hx-pagination-active-bg, var(--hx-color-primary-500, #2563eb));
    border-color: var(
      --hx-pagination-active-border-color,
      var(--hx-pagination-active-bg, var(--hx-color-primary-500, #2563eb))
    );
    color: var(--hx-pagination-active-color, var(--hx-color-neutral-0, #ffffff));
    font-weight: var(--hx-font-weight-semibold, 600);
    cursor: default;
    pointer-events: none;
  }

  .button:disabled {
    opacity: var(--hx-opacity-disabled, 0.5);
    pointer-events: none;
  }

  .ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--hx-pagination-button-size, 2.25rem);
    height: var(--hx-pagination-button-size, 2.25rem);
    color: var(--hx-pagination-ellipsis-color, var(--hx-color-neutral-500, #6b7280));
    font-size: var(--hx-font-size-sm, 0.875rem);
    user-select: none;
  }

  .button[aria-disabled='true'] {
    cursor: default;
    pointer-events: none;
  }

  /* Page size selector */
  .page-size-wrapper {
    display: flex;
    align-items: center;
  }

  .page-size-label {
    display: flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    color: var(--hx-color-neutral-500, #6b7280);
    white-space: nowrap;
  }

  .page-size-select {
    height: var(--hx-pagination-button-size, 2.25rem);
    padding: 0 var(--hx-space-2, 0.5rem);
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-pagination-border-color, var(--hx-color-neutral-300, #d1d5db));
    border-radius: var(--hx-pagination-border-radius, var(--hx-border-radius-md, 0.375rem));
    background: var(--hx-pagination-bg, var(--hx-color-neutral-0, #ffffff));
    color: var(--hx-pagination-color, var(--hx-color-neutral-900, #111827));
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-family: inherit;
    cursor: pointer;
  }

  .page-size-select:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-pagination-focus-ring-color, var(--hx-focus-ring-color, var(--hx-color-primary-500)));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* Visually hidden — used for aria-live status messages */
  .visually-hidden {
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

  @media (prefers-reduced-motion: reduce) {
    .button {
      transition: none;
    }
  }

  /* Windows High Contrast / forced-colors support */
  @media (forced-colors: active) {
    .button {
      border: 1px solid ButtonText;
      color: ButtonText;
      background: ButtonFace;
      forced-color-adjust: none;
    }

    .button:hover:not(:disabled) {
      border-color: Highlight;
      color: Highlight;
    }

    .button:focus-visible {
      outline-color: Highlight;
    }

    .button[aria-current='page'] {
      background: Highlight;
      border-color: Highlight;
      color: HighlightText;
    }

    .button:disabled {
      color: GrayText;
      border-color: GrayText;
      opacity: 1;
    }

    .button[aria-disabled='true'] {
      color: GrayText;
    }

    .page-size-select {
      border-color: ButtonText;
      color: ButtonText;
      background: ButtonFace;
      forced-color-adjust: none;
    }
  }
`;
