import { css } from 'lit';

export const helixDialogStyles = css`
  :host {
    display: contents;
    /*
     * Set color on :host so that light-DOM slotted content (e.g. <p>, <span
     * slot="header">) inherits the correct dark text color. CSS custom
     * properties defined inside shadow DOM do NOT propagate to light-DOM slots;
     * the inherited value must come from the light-DOM side of the host.
     */
    color: var(--hx-dialog-color, var(--hx-color-neutral-900, #0f172a));
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Native Dialog Reset & Base ─── */

  dialog {
    padding: 0;
    border: none;
    border-radius: var(--hx-border-radius-lg, 0.5rem);
    box-shadow: var(--hx-shadow-xl, 0 20px 60px rgba(0, 0, 0, 0.3));
    background: var(--hx-dialog-bg, var(--hx-color-surface, #ffffff));
    width: var(--hx-dialog-width, min(90vw, 560px));
    max-height: var(--hx-dialog-max-height, 90vh);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    margin: auto;
    /*
     * After showModal() promotes the dialog to Chromium's top layer, the UA
     * injects a rule that sets color to canvastext, which resolves to a
     * system-dependent gray when CSS custom properties from adoptedStyleSheets
     * fail to re-resolve in the top-layer context. Setting author-level color,
     * color-scheme, and forced-color-adjust here overrides those UA rules and
     * pins the element to light-mode author colors regardless of OS theme or
     * forced-colors mode.
     */
    color-scheme: light;
    forced-color-adjust: none;
    color: var(--hx-dialog-color, var(--hx-color-neutral-900, #0f172a));
  }

  dialog:not([open]) {
    display: none;
  }

  dialog::backdrop {
    background: var(--hx-dialog-overlay-bg, rgba(0, 0, 0, 0.5));
  }

  /* ─── Panel ─── */

  .dialog__panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    /* Set color here (on a plain div) so the UA dialog::modal styles don't override it */
    color: var(--hx-dialog-color, var(--hx-color-neutral-900, #0f172a));
    background: var(--hx-dialog-bg, var(--hx-color-surface, #ffffff));
    font-family: var(--hx-font-family-sans, sans-serif);
  }

  /* ─── Header ─── */

  .dialog__header {
    display: flex;
    align-items: center;
    gap: var(--hx-space-3, 0.75rem);
    padding: var(
      --hx-dialog-header-padding,
      var(--hx-space-4, 1rem) var(--hx-space-6, 1.5rem)
    );
    border-bottom: 1px solid var(--hx-color-border, #e5e7eb);
    flex-shrink: 0;
  }

  /* ─── Label ─── */

  .dialog__label {
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-font-size-lg, 1.125rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    flex: 1;
    margin: 0;
    line-height: var(--hx-line-height-tight, 1.25);
  }

  /* ─── Body ─── */

  .dialog__body {
    flex: 1;
    overflow-y: auto;
    padding: var(--hx-dialog-body-padding, var(--hx-space-6, 1.5rem));
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-font-size-md, 1rem);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Footer ─── */

  .dialog__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--hx-space-3, 0.75rem);
    padding: var(
      --hx-dialog-footer-padding,
      var(--hx-space-4, 1rem) var(--hx-space-6, 1.5rem)
    );
    border-top: 1px solid var(--hx-color-border, #e5e7eb);
    flex-shrink: 0;
  }

  /* ─── Close Button ─── */

  .dialog__close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--hx-space-8, 2rem);
    height: var(--hx-space-8, 2rem);
    margin-left: auto;
    padding: 0;
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    cursor: pointer;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: 1;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      opacity var(--hx-transition-fast, 150ms ease);
    opacity: 0.6;
  }

  .dialog__close-button:hover {
    opacity: 1;
    background-color: color-mix(in srgb, currentColor 10%, transparent);
  }

  .dialog__close-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-focus-ring-color, #2563eb);
    outline-offset: var(--hx-focus-ring-offset, 2px);
    opacity: 1;
  }

  .dialog__close-button svg {
    width: var(--hx-space-4, 1rem);
    height: var(--hx-space-4, 1rem);
    fill: currentColor;
  }

  /* ─── Overlay (custom backdrop click target) ─── */

  .dialog__overlay {
    position: fixed;
    inset: 0;
    z-index: -1;
  }

  /* ─── Open Animation ─── */

  @keyframes dialog-in {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  dialog[open] .dialog__panel {
    animation: dialog-in var(--hx-transition-normal, 200ms ease);
  }

  @media (prefers-reduced-motion: reduce) {
    dialog[open] .dialog__panel {
      animation: none;
    }
  }
`;
