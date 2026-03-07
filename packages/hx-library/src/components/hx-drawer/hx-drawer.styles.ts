import { css } from 'lit';

export const helixDrawerStyles = css`
  :host {
    display: contents;
  }

  :host([contained]) {
    display: block;
    position: relative;
    overflow: hidden;
  }

  /* ─── Overlay ─── */

  .drawer-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--hx-z-index-modal, 400);
    display: flex;
    pointer-events: none;
    visibility: hidden;
  }

  :host([contained]) .drawer-overlay {
    position: absolute;
  }

  .drawer-overlay.is-open {
    pointer-events: auto;
    visibility: visible;
  }

  /* ─── Backdrop ─── */

  .drawer-backdrop {
    position: absolute;
    inset: 0;
    background-color: var(--hx-drawer-backdrop-color, var(--hx-color-neutral-900));
    opacity: 0;
    transition: opacity var(--hx-duration-300, 300ms) var(--hx-ease-out, ease-out);
  }

  .drawer-overlay.is-open .drawer-backdrop {
    opacity: var(--hx-drawer-backdrop-opacity, 0.5);
  }

  @media (prefers-reduced-motion: reduce) {
    .drawer-backdrop {
      transition: none;
    }
  }

  /* ─── Panel ─── */

  .drawer-panel {
    position: absolute;
    display: flex;
    flex-direction: column;
    background-color: var(--hx-drawer-bg, var(--hx-color-neutral-0));
    color: var(--hx-drawer-color, var(--hx-color-neutral-900));
    box-shadow: var(--hx-drawer-shadow, var(--hx-shadow-xl));
    overflow: hidden;
    outline: none;
    z-index: 1;
    transition:
      transform var(--hx-duration-300, 300ms) var(--hx-ease-out, ease-out),
      opacity var(--hx-duration-300, 300ms) var(--hx-ease-out, ease-out);
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .drawer-panel {
      transition: none;
    }
  }

  /* ─── Placement: end (default — right) ─── */

  :host([placement='end']) .drawer-panel,
  :host(:not([placement])) .drawer-panel {
    top: 0;
    right: 0;
    bottom: 0;
    width: var(--_drawer-size, var(--hx-drawer-size-md, 30rem));
    max-width: 100%;
    transform: translateX(100%);
  }

  :host([placement='end']) .drawer-overlay.is-open .drawer-panel,
  :host(:not([placement])) .drawer-overlay.is-open .drawer-panel {
    transform: translateX(0);
    opacity: 1;
  }

  /* ─── Placement: start (left) ─── */

  :host([placement='start']) .drawer-panel {
    top: 0;
    left: 0;
    bottom: 0;
    width: var(--_drawer-size, var(--hx-drawer-size-md, 30rem));
    max-width: 100%;
    transform: translateX(-100%);
  }

  :host([placement='start']) .drawer-overlay.is-open .drawer-panel {
    transform: translateX(0);
    opacity: 1;
  }

  /* ─── Placement: top ─── */

  :host([placement='top']) .drawer-panel {
    top: 0;
    left: 0;
    right: 0;
    height: var(--_drawer-size, var(--hx-drawer-size-md, 30rem));
    max-height: 100%;
    width: 100%;
    transform: translateY(-100%);
  }

  :host([placement='top']) .drawer-overlay.is-open .drawer-panel {
    transform: translateY(0);
    opacity: 1;
  }

  /* ─── Placement: bottom ─── */

  :host([placement='bottom']) .drawer-panel {
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--_drawer-size, var(--hx-drawer-size-md, 30rem));
    max-height: 100%;
    width: 100%;
    transform: translateY(100%);
  }

  :host([placement='bottom']) .drawer-overlay.is-open .drawer-panel {
    transform: translateY(0);
    opacity: 1;
  }

  /* ─── Header ─── */

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--hx-spacing-4, 1rem);
    padding: var(
      --hx-drawer-header-padding,
      var(--hx-spacing-5, 1.25rem) var(--hx-spacing-6, 1.5rem)
    );
    border-bottom: var(--hx-border-width-1, 1px) solid
      var(--hx-drawer-header-border-color, var(--hx-color-neutral-200));
    flex-shrink: 0;
  }

  .drawer-title {
    margin: 0;
    flex: 1 1 auto;
    font-family: var(--hx-font-family-sans);
    font-size: var(--hx-font-size-lg);
    font-weight: var(--hx-font-weight-semibold);
    line-height: var(--hx-line-height-snug);
    color: var(--hx-drawer-title-color, var(--hx-color-neutral-900));
  }

  .drawer-header-actions {
    display: flex;
    align-items: center;
    gap: var(--hx-spacing-2, 0.5rem);
    flex-shrink: 0;
  }

  .drawer-close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: none;
    border-radius: var(--hx-border-radius-md, 0.375rem);
    background: transparent;
    color: var(--hx-color-neutral-500);
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color var(--hx-duration-100, 100ms) ease;
  }

  .drawer-close-button:hover {
    background-color: var(--hx-color-neutral-100);
    color: var(--hx-color-neutral-900);
  }

  .drawer-close-button:focus-visible {
    outline: 2px solid var(--hx-color-primary-600);
    outline-offset: 2px;
  }

  /* ─── Body ─── */

  .drawer-body {
    flex: 1 1 auto;
    padding: var(--hx-drawer-body-padding, var(--hx-spacing-6, 1.5rem));
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  /* ─── Footer ─── */

  .drawer-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--hx-spacing-3, 0.75rem);
    padding: var(--hx-drawer-footer-padding, var(--hx-spacing-4, 1rem) var(--hx-spacing-6, 1.5rem));
    border-top: var(--hx-border-width-1, 1px) solid
      var(--hx-drawer-footer-border-color, var(--hx-color-neutral-200));
    flex-shrink: 0;
  }
`;
