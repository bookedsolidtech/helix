import { css } from 'lit';

export const helixContextualHelpStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  /* ─── Trigger button ─── */

  .trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: var(--hx-border-width-thin) solid transparent;
    border-radius: var(--hx-contextual-help-trigger-border-radius, var(--hx-border-radius-md));
    background-color: transparent;
    color: var(--hx-contextual-help-trigger-color, var(--hx-color-primary-500));
    cursor: pointer;
    padding: 0;
    transition:
      background-color var(--hx-transition-fast),
      color var(--hx-transition-fast),
      box-shadow var(--hx-transition-fast);
    flex-shrink: 0;
    font-family: inherit;
    line-height: 1;
  }

  .trigger:focus-visible {
    outline: var(--hx-focus-ring-width) solid
      var(--hx-contextual-help-focus-ring-color, var(--hx-focus-ring-color));
    outline-offset: var(--hx-focus-ring-offset);
  }

  .trigger:hover {
    background-color: var(--hx-contextual-help-trigger-hover-bg, var(--hx-color-neutral-100));
  }

  .trigger:active {
    background-color: var(--hx-contextual-help-trigger-active-bg, var(--hx-color-neutral-200));
  }

  /* ─── Trigger sizes ─── */

  .trigger--sm {
    width: var(--hx-size-8, 2rem);
    height: var(--hx-size-8, 2rem);
    font-size: var(--hx-font-size-sm);
  }

  .trigger--md {
    width: var(--hx-size-10, 2.5rem);
    height: var(--hx-size-10, 2.5rem);
    font-size: var(--hx-font-size-md);
  }

  .trigger-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1em;
    height: 1em;
    pointer-events: none;
  }

  /* ─── Popover panel ─── */

  .popover {
    position: fixed;
    z-index: var(--hx-contextual-help-z-index, 9999);
    background-color: var(--hx-contextual-help-bg, var(--hx-color-neutral-0));
    color: var(--hx-contextual-help-color, var(--hx-color-neutral-900));
    border: var(--hx-border-width-1) solid
      var(--hx-contextual-help-border-color, var(--hx-color-neutral-200));
    border-radius: var(--hx-contextual-help-border-radius, var(--hx-border-radius-md));
    box-shadow: var(--hx-contextual-help-shadow, var(--hx-shadow-lg));
    padding: var(--hx-contextual-help-padding, var(--hx-spacing-4));
    max-width: var(--hx-contextual-help-max-width, 280px);
    min-width: var(--hx-contextual-help-min-width, 160px);
    outline: none;
  }

  /* ─── Popover header ─── */

  .popover__header {
    display: flex;
    align-items: flex-start;
    gap: var(--hx-spacing-2);
    margin-bottom: var(--hx-spacing-2);
  }

  /* ─── Popover heading ─── */

  .popover__heading {
    margin: 0;
    font-family: var(--hx-font-family-sans);
    font-size: var(--hx-font-size-sm);
    font-weight: var(--hx-font-weight-semibold);
    line-height: var(--hx-line-height-snug);
    color: var(--hx-contextual-help-heading-color, var(--hx-color-neutral-900));
    flex: 1;
  }

  /* ─── Close button ─── */

  .popover__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--hx-contextual-help-color, var(--hx-color-neutral-500));
    padding: 0;
    font-size: 1.25em;
    line-height: 1;
    flex-shrink: 0;
    border-radius: var(--hx-border-radius-sm);
    margin-left: auto;
    font-family: inherit;
  }

  .popover__close:focus-visible {
    outline: var(--hx-focus-ring-width) solid
      var(--hx-contextual-help-focus-ring-color, var(--hx-focus-ring-color));
    outline-offset: var(--hx-focus-ring-offset);
  }

  .popover__close:hover {
    color: var(--hx-color-neutral-900);
  }

  /* ─── Popover content ─── */

  .popover__body {
    font-size: var(--hx-font-size-sm);
    line-height: var(--hx-line-height-normal);
    color: var(--hx-contextual-help-color, var(--hx-color-neutral-700));
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .trigger {
      transition: none;
    }
  }
`;
