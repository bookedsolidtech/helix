import { css } from 'lit';

export const helixSearchStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled, 0.5);
    pointer-events: none;
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Field Container ─── */

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    font-family: var(--hx-search-font-family, var(--hx-font-family-sans, sans-serif));
  }

  /* ─── Label ─── */

  .field__label-wrapper {
    display: contents;
  }

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-input-label-color, var(--hx-color-neutral-700));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Input Wrapper ─── */

  .field__input-wrapper {
    display: flex;
    align-items: center;
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-search-border-color, var(--hx-color-neutral-300));
    border-radius: var(--hx-search-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-search-bg, var(--hx-color-neutral-0));
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    overflow: hidden;
  }

  .field__input-wrapper:focus-within {
    border-color: var(--hx-search-focus-ring-color, var(--hx-focus-ring-color));
    /* Fallback for browsers without color-mix() support */
    box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
      var(--hx-search-focus-ring-color, var(--hx-focus-ring-color));
  }

  @supports (color: color-mix(in srgb, red, transparent)) {
    .field__input-wrapper:focus-within {
      box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
        color-mix(
          in srgb,
          var(--hx-search-focus-ring-color, var(--hx-focus-ring-color))
            calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
          transparent
        );
    }
  }

  /* ─── Search Icon ─── */

  .field__search-icon {
    display: flex;
    align-items: center;
    padding: 0 var(--hx-space-3, 0.75rem);
    color: var(--hx-search-icon-color, var(--hx-color-neutral-500));
    flex-shrink: 0;
  }

  /* ─── Loading Spinner ─── */

  @keyframes hx-search-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .field__spinner {
    animation: hx-search-spin 0.8s linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .field__spinner {
      animation: none;
    }
  }

  /* ─── Native Input ─── */

  .field__input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
    font-family: inherit;
    font-size: var(--hx-font-size-md, 1rem);
    color: var(--hx-input-color, var(--hx-color-neutral-800));
    line-height: var(--hx-line-height-normal, 1.5);
    min-height: var(--hx-size-10, 2.5rem);
    width: 100%;
    /* Remove native search cancel button — component provides its own */
    -webkit-appearance: none;
    appearance: none;
  }

  .field__input::-webkit-search-cancel-button,
  .field__input::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
  }

  .field__input::placeholder {
    color: var(--hx-color-neutral-400);
  }

  .field__input:disabled {
    cursor: not-allowed;
  }

  /* ─── Clear Button ─── */

  .field__clear-btn {
    display: flex;
    align-items: center;
    padding: 0 var(--hx-space-3, 0.75rem);
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--hx-search-clear-color, var(--hx-color-neutral-400));
    flex-shrink: 0;
    line-height: 1;
    transition: color var(--hx-transition-fast, 150ms ease);
  }

  .field__clear-btn:hover {
    color: var(--hx-color-neutral-600);
  }

  .field__clear-btn:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-search-focus-ring-color, var(--hx-focus-ring-color));
    outline-offset: -2px;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
  }

  /* ─── Suggestions ─── */

  .field__suggestions {
    display: contents;
  }

  /* ─── Loading Status (visually hidden, announced by screen readers) ─── */

  .field__status {
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

  /* ─── Size Variants ─── */

  .field--sm .field__input {
    min-height: var(--hx-size-8, 2rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
  }

  .field--sm .field__search-icon,
  .field--sm .field__clear-btn {
    padding: 0 var(--hx-space-2, 0.5rem);
  }

  .field--lg .field__input {
    min-height: var(--hx-size-12, 3rem);
    font-size: var(--hx-font-size-lg, 1.125rem);
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem);
  }

  .field--lg .field__search-icon,
  .field--lg .field__clear-btn {
    padding: 0 var(--hx-space-4, 1rem);
  }

  /* ─── Loading State ─── */

  .field--loading .field__search-icon {
    color: var(--hx-search-icon-color, var(--hx-color-neutral-500));
  }

  /* ─── Disabled State ─── */

  .field--disabled .field__input-wrapper {
    background-color: var(--hx-color-neutral-100);
  }
`;
