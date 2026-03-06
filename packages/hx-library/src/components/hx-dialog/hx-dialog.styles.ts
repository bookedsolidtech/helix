import { css } from 'lit';

export const helixDialogStyles = css`
  :host {
    display: contents;
  }

  /* ─── Native dialog reset ─── */

  dialog {
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    max-width: 100%;
    max-height: 100%;
    overflow: visible;
  }

  /* ─── Dialog container ─── */

  .dialog {
    display: flex;
    flex-direction: column;
    position: relative;
    background-color: var(--hx-dialog-bg, var(--hx-color-neutral-0));
    color: var(--hx-dialog-color, var(--hx-color-neutral-900));
    border-radius: var(--hx-dialog-border-radius, var(--hx-border-radius-lg));
    box-shadow: var(--hx-dialog-shadow, var(--hx-shadow-xl));
    width: var(--hx-dialog-width, var(--hx-size-128, 32rem));
    max-width: calc(100vw - var(--hx-spacing-8, 2rem));
    max-height: calc(100vh - var(--hx-spacing-8, 2rem));
    overflow: hidden;
    outline: none;

    /* Open/close animation */
    opacity: 0;
    transform: translateY(var(--hx-spacing-4, 1rem)) scale(0.97);
    transition:
      opacity var(--hx-duration-200, 200ms) var(--hx-ease-out, ease-out),
      transform var(--hx-duration-200, 200ms) var(--hx-ease-out, ease-out);
  }

  dialog[open] .dialog {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  @media (prefers-reduced-motion: reduce) {
    .dialog {
      transition: none;
    }
  }

  /* ─── Native backdrop (modal mode) ─── */

  dialog::backdrop {
    background-color: var(--hx-dialog-backdrop-color, var(--hx-color-neutral-900));
    opacity: 0;
    transition: opacity var(--hx-duration-200, 200ms) var(--hx-ease-out, ease-out);
  }

  dialog[open]::backdrop {
    opacity: var(--hx-dialog-backdrop-opacity, 0.5);
  }

  @media (prefers-reduced-motion: reduce) {
    dialog::backdrop {
      transition: none;
    }
  }

  /* ─── Non-modal backdrop overlay ─── */

  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background-color: var(--hx-dialog-backdrop-color, var(--hx-color-neutral-900));
    opacity: var(--hx-dialog-backdrop-opacity, 0.5);
    z-index: var(--hx-z-index-modal, 1000);
  }

  /* Ensure non-modal dialog content renders above the backdrop */
  :host(:not([modal])) dialog {
    position: relative;
    z-index: calc(var(--hx-z-index-modal, 1000) + 1);
  }

  /* ─── Header ─── */

  .dialog__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--hx-dialog-header-padding, var(--hx-spacing-5) var(--hx-spacing-6));
    border-bottom: var(--hx-border-width-1) solid
      var(--hx-dialog-header-border-color, var(--hx-color-neutral-200));
    gap: var(--hx-spacing-4);
    flex-shrink: 0;
  }

  .dialog__heading {
    margin: 0;
    font-family: var(--hx-font-family-sans);
    font-size: var(--hx-font-size-lg);
    font-weight: var(--hx-font-weight-semibold);
    line-height: var(--hx-line-height-snug);
    color: var(--hx-dialog-heading-color, var(--hx-color-neutral-900));
  }

  /* ─── Body ─── */

  .dialog__body {
    flex: 1 1 auto;
    padding: var(--hx-dialog-body-padding, var(--hx-spacing-6));
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  /* ─── Footer ─── */

  .dialog__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--hx-spacing-3);
    padding: var(--hx-dialog-footer-padding, var(--hx-spacing-4) var(--hx-spacing-6));
    border-top: var(--hx-border-width-1) solid
      var(--hx-dialog-footer-border-color, var(--hx-color-neutral-200));
    flex-shrink: 0;
  }
`;
