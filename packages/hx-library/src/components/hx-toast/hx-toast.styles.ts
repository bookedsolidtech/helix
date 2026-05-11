import { css } from 'lit';

/**
 * hx-toast styles.
 *
 * Component-tier tokens with two-level var() fallback:
 *   var(--hx-toast-{prop}, var(--hx-color-{semantic}, #hex))
 * Inner hex fallbacks track the "precision cool" palette (3.2.0):
 *   neutral-0 = #FFFFFF, neutral-900 = #0D1825 (surface-inverse anchor),
 *   primary-600 = #0F7078, success-600 = #0E8A4A, warning-500 = #C2711C,
 *   error-600 = #C92A2A.
 */
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
    background-color: var(--hx-toast-bg, var(--hx-color-surface-inverse, #0d1825));
    color: var(--hx-toast-color, var(--hx-color-text-inverse, #ffffff));
    font-family: var(--hx-toast-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-font-size-sm, 0.875rem);
    line-height: var(--hx-line-height-normal, 1.5);
    box-shadow: var(
      --hx-toast-shadow,
      var(--hx-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1))
    );
    opacity: 0;
    transform: translateY(var(--hx-toast-enter-translate, var(--hx-space-2, 0.5rem)));
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

  /*
   * Toast variants paint on darker brand fills (primary-600/success-700/
   * error-600) because the lighter -500 fills can't pass AA against white
   * text in the precision-cool palette. The neutral-900 on-{role} tokens
   * are tuned for the lighter -500 surfaces and would fail here (e.g.
   * neutral-900 on primary-600 = 3.07:1), so the on-{role}-strong tokens
   * (neutral-0, no dark-mode flip) keep fg legible on the darker fills.
   * - text.on-primary-strong on info.bg-strong (primary-600, #0F7078) = 5.82:1
   * - text.on-success-strong on success.bg-strong (success-700, #146831) = 6.88:1
   *   (success-600 #0E8A4A on white = 4.42:1 — drifts under AA at 14px)
   * - text.on-error-strong   on danger.bg-strong  (error-600, #C92A2A) = 5.46:1
   * - text.on-warning        on warning.bg-strong (warning-500, #C2711C) = 4.83:1
   *   (warning stays on the lighter -500 surface so on-warning works)
   *
   * 3.2.1 token-cascade: bg variants now route through surface.{role}-strong
   * semantics; fg variants route through text.on-{role}-strong (or on-warning
   * for the warning variant). Component-tier tokens are NOT bypassed — the
   * --hx-toast-bg / --hx-toast-color slots remain the single override point.
   */
  .toast--success {
    --hx-toast-bg: var(--hx-color-surface-success-strong, #146831);
    --hx-toast-color: var(--hx-color-text-on-success-strong, #ffffff);
  }

  .toast--warning {
    --hx-toast-bg: var(--hx-color-surface-warning-strong, #c2711c);
    --hx-toast-color: var(--hx-color-text-on-warning, #0d1825);
  }

  .toast--danger {
    --hx-toast-bg: var(--hx-color-surface-danger-strong, #c92a2a);
    --hx-toast-color: var(--hx-color-text-on-error-strong, #ffffff);
  }

  .toast--info {
    --hx-toast-bg: var(--hx-color-surface-info-strong, #0f7078);
    --hx-toast-color: var(--hx-color-text-on-primary-strong, #ffffff);
  }

  /* ─── Severity Label (WCAG 1.4.1) ─── */
  /* Visually hidden — non-color cue for severity variants (success/warning/danger/info). */
  /* Ensures variant is not conveyed by color alone for color-blind users.                */

  .toast__severity-label {
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

  /* Match the previous inline 16x16 SVG sizing for both the variant icon and
     the close-button glyph migrated to hx-icon (library="helix"). */
  .toast__glyph {
    --hx-icon-size: 16px;
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
    /* WCAG 2.5.5: minimum 44×44px touch target */
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
    padding: var(--hx-space-1, 0.25rem);
    background: transparent;
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    color: inherit;
    cursor: pointer;
    opacity: var(--hx-opacity-75, 0.75);
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

    .toast__close {
      transition: none;
    }
  }

  /* ─── Forced Colors (Windows High Contrast) ─── */
  /* Sole owner: bespoke per-class HC overrides on .toast and .toast__close.
     The shared forcedColorsSurface mixin was dropped in 3.2.1 (XOR rule);
     this block now carries the surface contract the mixin used to provide
     (background:Canvas + color:CanvasText + border:1px solid CanvasText)
     plus the per-class affordances the mixin never touched. */

  @media (forced-colors: active) {
    .toast {
      background: Canvas;
      color: CanvasText;
      border: 1px solid CanvasText;
    }

    .toast__close {
      color: ButtonText;
      border: 1px solid ButtonText;
    }
  }
`;

export const helixToastStackStyles = css`
  :host {
    display: block;
    position: fixed;
    z-index: var(--hx-z-index-toast, 1700);
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
    inset-inline-start: 0;
    inset-inline-end: auto;
    bottom: auto;
  }

  :host([placement='top-center']) {
    top: 0;
    inset-inline-start: 50%;
    transform: translateX(-50%);
    inset-inline-end: auto;
    bottom: auto;
  }

  :host([placement='top-end']) {
    top: 0;
    inset-inline-end: 0;
    inset-inline-start: auto;
    bottom: auto;
  }

  :host([placement='bottom-start']) {
    bottom: 0;
    inset-inline-start: 0;
    inset-inline-end: auto;
    top: auto;
  }

  :host([placement='bottom-center']) {
    bottom: 0;
    inset-inline-start: 50%;
    transform: translateX(-50%);
    inset-inline-end: auto;
    top: auto;
  }

  :host([placement='bottom-end']) {
    bottom: 0;
    inset-inline-end: 0;
    inset-inline-start: auto;
    top: auto;
  }

  /* ─── Bottom placements: reverse order so newest is on top ─── */

  :host([placement^='bottom']) .toast-stack {
    flex-direction: column-reverse;
  }

  /* ─── Slide direction by placement ─── */

  :host([placement^='top']) ::slotted(hx-toast) {
    --hx-toast-enter-translate: calc(var(--hx-space-2, 0.5rem) * -1);
  }
`;
