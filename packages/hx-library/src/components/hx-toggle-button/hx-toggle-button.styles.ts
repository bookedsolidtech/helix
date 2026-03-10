import { css } from 'lit';

export const helixToggleButtonStyles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: var(--hx-opacity-disabled, 0.5);
  }

  /* ─── Base Button ─── */

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-2, 0.5rem);
    border: var(--hx-border-width-thin, 1px) solid var(--hx-toggle-button-border-color, transparent);
    border-radius: var(--hx-toggle-button-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-toggle-button-bg, var(--hx-color-primary-500, #2563eb));
    color: var(--hx-toggle-button-color, var(--hx-color-neutral-0, #ffffff));
    font-family: var(--hx-toggle-button-font-family, var(--hx-font-family-sans, sans-serif));
    font-weight: var(--hx-toggle-button-font-weight, var(--hx-font-weight-semibold, 600));
    line-height: var(--hx-line-height-tight, 1.25);
    cursor: pointer;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    text-decoration: none;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
  }

  .button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-toggle-button-focus-ring-color, var(--hx-focus-ring-color, #2563eb));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .button:hover {
    filter: brightness(var(--hx-filter-brightness-hover, 0.9));
  }

  .button:active {
    filter: brightness(var(--hx-filter-brightness-active, 0.8));
  }

  /* ─── Size Variants ─── */

  .button--sm {
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-3, 0.75rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    min-height: var(--hx-size-8, 2rem);
  }

  .button--md {
    padding: var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem);
    font-size: var(--hx-font-size-md, 1rem);
    min-height: var(--hx-size-10, 2.5rem);
  }

  .button--lg {
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-6, 1.5rem);
    font-size: var(--hx-font-size-lg, 1.125rem);
    min-height: var(--hx-size-12, 3rem);
  }

  /* ─── Style Variants ─── */

  .button--primary {
    --hx-toggle-button-bg: var(--hx-color-primary-500, #2563eb);
    --hx-toggle-button-color: var(--hx-color-neutral-0, #ffffff);
    --hx-toggle-button-border-color: transparent;
  }

  .button--secondary {
    --hx-toggle-button-bg: transparent;
    --hx-toggle-button-color: var(--hx-color-primary-500, #2563eb);
    --hx-toggle-button-border-color: var(--hx-color-primary-500, #2563eb);
  }

  .button--secondary:hover {
    --hx-toggle-button-bg: var(--hx-color-primary-50, #eff6ff);
  }

  .button--tertiary {
    --hx-toggle-button-bg: var(--hx-color-neutral-100, #f1f5f9);
    --hx-toggle-button-color: var(--hx-color-neutral-900, #0f172a);
    --hx-toggle-button-border-color: transparent;
  }

  .button--tertiary:hover {
    --hx-toggle-button-bg: var(--hx-color-neutral-200, #e2e8f0);
  }

  .button--ghost {
    --hx-toggle-button-bg: transparent;
    --hx-toggle-button-color: var(--hx-color-primary-500, #2563eb);
    --hx-toggle-button-border-color: transparent;
  }

  .button--ghost:hover {
    --hx-toggle-button-bg: var(--hx-color-neutral-100, #f1f5f9);
  }

  .button--outline {
    --hx-toggle-button-bg: transparent;
    --hx-toggle-button-color: var(--hx-color-neutral-900, #0f172a);
    --hx-toggle-button-border-color: var(--hx-color-neutral-300, #cbd5e1);
  }

  .button--outline:hover {
    --hx-toggle-button-bg: var(--hx-color-neutral-50, #f8fafc);
  }

  /* ─── Pressed State ─── */

  /*
   * Primary: already uses solid primary bg; pressed deepens to primary-700
   * to give clear visual feedback without introducing a new color.
   */
  .button--primary.button--pressed {
    --hx-toggle-button-bg: var(--hx-toggle-button-pressed-bg, var(--hx-color-primary-700, #1d4ed8));
    --hx-toggle-button-color: var(
      --hx-toggle-button-pressed-color,
      var(--hx-color-neutral-0, #ffffff)
    );
    --hx-toggle-button-border-color: transparent;
  }

  /*
   * Secondary: unpressed is outlined/transparent; pressed fills with primary bg
   * so the state change is immediately legible.
   */
  .button--secondary.button--pressed {
    --hx-toggle-button-bg: var(--hx-toggle-button-pressed-bg, var(--hx-color-primary-500, #2563eb));
    --hx-toggle-button-color: var(
      --hx-toggle-button-pressed-color,
      var(--hx-color-neutral-0, #ffffff)
    );
    --hx-toggle-button-border-color: var(--hx-color-primary-500, #2563eb);
  }

  /* Tertiary pressed: use primary-100 bg + primary-700 text + border for WCAG 3:1 non-text contrast. */
  .button--tertiary.button--pressed {
    --hx-toggle-button-bg: var(--hx-toggle-button-pressed-bg, var(--hx-color-primary-100, #dbeafe));
    --hx-toggle-button-color: var(
      --hx-toggle-button-pressed-color,
      var(--hx-color-primary-700, #1d4ed8)
    );
    --hx-toggle-button-border-color: var(--hx-color-primary-400, #60a5fa);
    box-shadow: inset 0 0 0 1px var(--hx-color-primary-400, #60a5fa);
  }

  /* Ghost pressed: subtle neutral fill, matching hover behavior as a baseline. */
  .button--ghost.button--pressed {
    --hx-toggle-button-bg: var(--hx-toggle-button-pressed-bg, var(--hx-color-primary-100, #dbeafe));
    --hx-toggle-button-color: var(
      --hx-toggle-button-pressed-color,
      var(--hx-color-primary-700, #1d4ed8)
    );
    --hx-toggle-button-border-color: transparent;
  }

  /* Outline pressed: fills with a neutral tint, darkens the border, and adds an inset shadow for WCAG 3:1 non-text contrast. */
  .button--outline.button--pressed {
    --hx-toggle-button-bg: var(--hx-toggle-button-pressed-bg, var(--hx-color-neutral-100, #f1f5f9));
    --hx-toggle-button-color: var(
      --hx-toggle-button-pressed-color,
      var(--hx-color-neutral-900, #0f172a)
    );
    --hx-toggle-button-border-color: var(--hx-color-neutral-500, #64748b);
    box-shadow: inset 0 0 0 1px var(--hx-color-neutral-500, #64748b);
  }

  /* ─── Disabled ─── */

  .button[disabled] {
    cursor: not-allowed;
  }

  /* ─── Prefix / Suffix / Label ─── */

  .button__prefix,
  .button__suffix {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .button__label {
    flex: 1 1 auto;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .button {
      transition: none;
    }
  }
`;
