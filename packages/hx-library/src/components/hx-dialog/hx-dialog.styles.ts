import { css } from 'lit';

/**
 * hx-dialog styles.
 *
 * Component-tier tokens with two-level var() fallback:
 *   var(--hx-dialog-{prop}, var(--hx-color-{semantic}, #hex))
 * Inner hex fallbacks track the "precision cool" palette (3.2.0):
 *   neutral-0 = #FFFFFF, neutral-100 = #EBEEE9, neutral-200 = #D6DBD5,
 *   neutral-500 = #66787B, neutral-800 = #202B39, neutral-900 = #0D1825,
 *   primary-500 = #429797.
 */
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
    background-color: var(--hx-dialog-bg, var(--hx-color-surface-default, #ffffff));
    color: var(--hx-dialog-color, var(--hx-color-text-primary, #0d1825));
    border-radius: var(--hx-dialog-border-radius, var(--hx-border-radius-lg, 0.5rem));
    box-shadow: var(--hx-dialog-shadow, var(--hx-shadow-xl, 0 20px 25px -5px rgb(0 0 0 / 0.1)));
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
    background-color: var(
      --hx-dialog-backdrop-color,
      var(--hx-color-surface-overlay, rgba(0, 0, 0, 0.75))
    );
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
    background-color: var(
      --hx-dialog-backdrop-color,
      var(--hx-color-surface-overlay, rgba(0, 0, 0, 0.75))
    );
    opacity: var(--hx-dialog-backdrop-opacity, 0.5);
    /* D5 — backdrop z-index must be lower than the dialog element's z-index */
    z-index: var(--hx-z-index-modal, 1400);
  }

  /* ─── Header ─── */

  .dialog__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--hx-dialog-header-padding, var(--hx-space-5, 1.25rem) var(--hx-space-6, 1.5rem));
    border-bottom: var(--hx-border-width-thin, 1px) solid
      var(--hx-dialog-header-border-color, var(--hx-color-border-default, #d6dbd5));
    gap: var(--hx-space-4, 1rem);
    flex-shrink: 0;
  }

  .dialog__heading {
    margin: 0;
    font-family: var(--hx-dialog-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-font-size-lg, 1.125rem);
    font-weight: var(--hx-font-weight-semibold, 600);
    line-height: var(--hx-line-height-tight, 1.25);
    color: var(--hx-dialog-heading-color, var(--hx-color-text-primary, #0d1825));
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
    color: var(--hx-dialog-close-btn-color, var(--hx-color-text-muted, #66787b));
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
    color: var(--hx-dialog-close-btn-hover-color, var(--hx-color-text-primary, #0d1825));
    background-color: var(--hx-dialog-close-btn-hover-bg, var(--hx-color-surface-sunken, #ebeee9));
  }

  .dialog__close-btn:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(
        --hx-dialog-close-btn-focus-ring-color,
        var(--hx-focus-ring-color, var(--hx-color-primary-500, #429797))
      );
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Body ─── */

  .dialog__body {
    flex: 1 1 auto;
    padding: var(--hx-dialog-body-padding, var(--hx-space-6, 1.5rem));
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  /* ─── Footer ─── */

  .dialog__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--hx-space-3, 0.75rem);
    padding: var(--hx-dialog-footer-padding, var(--hx-space-4, 1rem) var(--hx-space-6, 1.5rem));
    border-top: var(--hx-border-width-thin, 1px) solid
      var(--hx-dialog-footer-border-color, var(--hx-color-border-default, #d6dbd5));
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

  /* ─── Forced Colors (Windows High Contrast) ─── */
  /* Belt-and-suspenders: rich per-class HC overrides PLUS the forcedColorsSurface mixin. */

  @media (forced-colors: active) {
    .dialog {
      border: 1px solid CanvasText;
    }

    .dialog__header {
      border-bottom-color: CanvasText;
    }

    .dialog__footer {
      border-top-color: CanvasText;
    }

    .dialog__close-btn {
      color: ButtonText;
      border: 1px solid ButtonText;
    }
  }
`;
