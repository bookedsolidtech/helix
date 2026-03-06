import { css } from 'lit';

export const helixToastStyles = css`
  /* ─── hx-toast host ─── */

  :host {
    display: block;
    pointer-events: none;
  }

  :host([open]) {
    pointer-events: auto;
  }

  /* ─── Toast base ─── */

  .toast {
    display: flex;
    align-items: flex-start;
    gap: var(--hx-space-3, 0.75rem);
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem);
    border-radius: var(--hx-toast-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-toast-bg, var(--hx-color-neutral-900, #0f172a));
    color: var(--hx-toast-color, var(--hx-color-neutral-0, #ffffff));
    font-family: var(--hx-font-family-sans, sans-serif);
    font-size: var(--hx-font-size-sm, 0.875rem);
    line-height: var(--hx-line-height-normal, 1.5);
    box-shadow: var(
      --hx-toast-shadow,
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1)
    );
    opacity: 0;
    transform: translateY(var(--hx-space-2, 0.5rem));
    transition:
      opacity var(--hx-transition-normal, 250ms ease),
      transform var(--hx-transition-normal, 250ms ease);
    width: var(--hx-toast-width, 20rem);
    max-width: 100%;
    pointer-events: auto;
  }

  :host([open]) .toast {
    opacity: 1;
    transform: translateY(0);
  }

  /* ─── Variant overrides ─── */

  .toast--success {
    --hx-toast-bg: var(--hx-color-success-600, #16a34a);
    --hx-toast-color: var(--hx-color-neutral-0, #ffffff);
  }

  .toast--warning {
    --hx-toast-bg: var(--hx-color-warning-500, #f59e0b);
    --hx-toast-color: var(--hx-color-neutral-900, #0f172a);
  }

  .toast--danger {
    --hx-toast-bg: var(--hx-color-error-600, #dc2626);
    --hx-toast-color: var(--hx-color-neutral-0, #ffffff);
  }

  .toast--info {
    --hx-toast-bg: var(--hx-color-primary-600, #2563eb);
    --hx-toast-color: var(--hx-color-neutral-0, #ffffff);
  }

  /* ─── Icon ─── */

  .toast__icon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    line-height: 1;
  }

  .toast__icon:empty {
    display: none;
  }

  /* ─── Message ─── */

  .toast__message {
    flex: 1 1 auto;
    min-width: 0;
  }

  /* ─── Action slot ─── */

  .toast__action {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
  }

  .toast__action:empty {
    display: none;
  }

  /* ─── Close button ─── */

  .toast__close {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--hx-space-1, 0.25rem);
    background: transparent;
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    color: inherit;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity var(--hx-transition-fast, 150ms ease);
  }

  .toast__close:hover {
    opacity: 1;
  }

  .toast__close:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid currentColor;
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Reduced motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .toast {
      transition: none;
    }
  }
`;

export const helixToastStackStyles = css`
  :host {
    display: block;
    position: fixed;
    z-index: var(--hx-z-index-toast, 9000);
    pointer-events: none;
  }

  .toast-stack {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-3, 0.75rem);
    padding: var(--hx-space-4, 1rem);
    pointer-events: none;
  }

  /* ─── Placements ─── */

  :host([placement='top-start']) {
    top: 0;
    left: 0;
    right: auto;
    bottom: auto;
  }

  :host([placement='top-center']) {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    right: auto;
    bottom: auto;
  }

  :host([placement='top-end']) {
    top: 0;
    right: 0;
    left: auto;
    bottom: auto;
  }

  :host([placement='bottom-start']),
  :host(:not([placement])) {
    bottom: 0;
    left: 0;
    right: auto;
    top: auto;
  }

  :host([placement='bottom-center']) {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    right: auto;
    top: auto;
  }

  :host([placement='bottom-end']) {
    bottom: 0;
    right: 0;
    left: auto;
    top: auto;
  }

  /* ─── Bottom placements: reverse order so newest is on top ─── */

  :host([placement^='bottom']) .toast-stack,
  :host(:not([placement])) .toast-stack {
    flex-direction: column-reverse;
  }
`;
