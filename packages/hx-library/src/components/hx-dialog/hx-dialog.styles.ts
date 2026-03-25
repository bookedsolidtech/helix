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
    /* D5 — ensure native dialog element renders above the non-modal backdrop sibling */
    position: relative;
    z-index: calc(var(--hx-z-index-modal, 1400) + 1);
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
    width: var(--hx-dialog-width, var(--hx-container-narrow, 32rem));
    max-width: calc(100vw - var(--hx-space-8, 2rem));
    max-height: calc(100vh - var(--hx-space-8, 2rem));
    overflow: hidden;
    outline: none;

    /* Open/close animation */
    opacity: 0;
    transform: translateY(var(--hx-space-4, 1rem)) scale(0.97);
    transition:
      opacity var(--hx-duration-normal, 200ms) var(--hx-easing-out, ease-out),
      transform var(--hx-duration-normal, 200ms) var(--hx-easing-out, ease-out);
  }

  dialog[open] .dialog {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  @media (prefers-reduced-motion: reduce) {
    .dialog {
      transition: none;
    }

    .dialog__close-btn {
      transition: none;
    }
  }

  /* ─── Native backdrop (modal mode) ─── */

  dialog::backdrop {
    background-color: var(--hx-dialog-backdrop-color, var(--hx-color-neutral-900));
    opacity: 0;
    transition: opacity var(--hx-duration-normal, 200ms) var(--hx-easing-out, ease-out);
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
    /* D5 — backdrop z-index must be lower than the dialog element's z-index */
    z-index: var(--hx-z-index-modal, 1400);
  }

  /* ─── Header ─── */

  .dialog__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--hx-dialog-header-padding, var(--hx-space-5) var(--hx-space-6));
    border-bottom: var(--hx-border-width-thin) solid
      var(--hx-dialog-header-border-color, var(--hx-color-neutral-200));
    gap: var(--hx-space-4);
    flex-shrink: 0;
  }

  .dialog__heading {
    margin: 0;
    font-family: var(--hx-font-family-sans);
    font-size: var(--hx-font-size-lg);
    font-weight: var(--hx-font-weight-semibold);
    line-height: var(--hx-line-height-tight);
    color: var(--hx-dialog-heading-color, var(--hx-color-neutral-900));
    flex: 1 1 auto;
  }

  /* ─── Built-in close button (D17) ─── */

  .dialog__close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    /* WCAG 2.5.5 (healthcare mandate): minimum 44x44px touch target */
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
    width: var(--hx-touch-target-min, 2.75rem);
    height: var(--hx-touch-target-min, 2.75rem);
    padding: 0;
    margin-inline-start: auto;
    background: transparent;
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    cursor: pointer;
    color: var(--hx-color-neutral-500, #6b7280);
    font-size: var(--hx-font-size-xl, 1.25rem);
    line-height: 1; /* intentional literal: icon button needs line-height 1; no token maps to exactly 1 */
    transition:
      color var(--hx-duration-fast, 100ms) ease,
      background-color var(--hx-duration-fast, 100ms) ease;
  }

  .dialog__close-btn::before {
    content: '×';
  }

  .dialog__close-btn:hover {
    color: var(--hx-color-neutral-900);
    background-color: var(--hx-color-neutral-100);
  }

  .dialog__close-btn:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(
        --hx-dialog-close-btn-focus-ring-color,
        var(--hx-focus-ring-color, var(--hx-color-primary-500))
      );
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Body ─── */

  .dialog__body {
    flex: 1 1 auto;
    padding: var(--hx-dialog-body-padding, var(--hx-space-6));
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  /* ─── Footer ─── */

  .dialog__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--hx-space-3);
    padding: var(--hx-dialog-footer-padding, var(--hx-space-4) var(--hx-space-6));
    border-top: var(--hx-border-width-thin) solid
      var(--hx-dialog-footer-border-color, var(--hx-color-neutral-200));
    flex-shrink: 0;
  }

  /* ─── Visually-hidden description (D8) ─── */

  .dialog__description {
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
`;
