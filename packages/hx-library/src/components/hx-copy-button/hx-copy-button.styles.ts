import { css } from 'lit';

export const helixCopyButtonStyles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    pointer-events: none;
  }

  .button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-2);
    border: var(--hx-border-width-thin) solid var(--hx-copy-button-border-color, transparent);
    border-radius: var(--hx-copy-button-border-radius, var(--hx-border-radius-md));
    background-color: var(--hx-copy-button-bg, transparent);
    color: var(--hx-copy-button-color, var(--hx-color-primary-500));
    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast),
      color var(--hx-transition-fast),
      border-color var(--hx-transition-fast),
      box-shadow var(--hx-transition-fast);
    text-decoration: none;
    user-select: none;
    -webkit-user-select: none;
    flex-shrink: 0;
    font-family: var(--hx-font-family-sans);
    font-weight: var(--hx-font-weight-medium);
    white-space: nowrap;
  }

  .button:focus-visible {
    outline: var(--hx-focus-ring-width) solid
      var(--hx-copy-button-focus-ring-color, var(--hx-focus-ring-color));
    outline-offset: var(--hx-focus-ring-offset);
  }

  .button:hover {
    filter: brightness(var(--hx-filter-brightness-hover, 0.9));
  }

  .button:active {
    filter: brightness(var(--hx-filter-brightness-active, 0.8));
  }

  /* ─── Size Variants ─── */

  .button--sm {
    padding: var(--hx-space-1);
    min-width: var(--hx-size-8);
    height: var(--hx-size-8);
    font-size: var(--hx-font-size-sm);
  }

  .button--md {
    padding: var(--hx-space-2);
    min-width: var(--hx-size-10);
    height: var(--hx-size-10);
    font-size: var(--hx-font-size-md);
  }

  .button--lg {
    padding: var(--hx-space-3);
    min-width: var(--hx-size-12);
    height: var(--hx-size-12);
    font-size: var(--hx-font-size-lg);
  }

  /* ─── Copied / Success State ─── */

  .button--copied {
    color: var(--hx-color-success-500, var(--hx-color-primary-500));
    /* Secondary non-color indicator required per WCAG 1.4.1 (use of color).
       A border provides visual differentiation for users with color blindness. */
    border-color: var(--hx-color-success-500, var(--hx-color-primary-500));
  }

  /* ─── Icon Container ─── */

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1em;
    height: 1em;
    line-height: 1;
    pointer-events: none;
    flex-shrink: 0;
  }

  /* ─── Disabled ─── */

  .button[disabled] {
    cursor: not-allowed;
    opacity: var(--hx-opacity-disabled);
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
    border-width: 0;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .button {
      transition: none;
    }
  }
`;
