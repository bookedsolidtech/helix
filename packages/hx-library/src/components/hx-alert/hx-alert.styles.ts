import { css } from 'lit';

/**
 * hx-alert styles.
 *
 * Component-tier tokens with two-level var() fallback:
 *   var(--hx-alert-{prop}, var(--hx-color-{semantic}, #hex))
 * Inner hex fallbacks track the "precision cool" palette (3.2.0):
 *   info-50 = #EFF6FE, info-200 = #BEDCFC, info-500 = #0C8BEB, info-800 = #064172,
 *   success-50 = #EAFAEC, success-200 = #BAE6C2, success-500 = #3B9E58, success-800 = #0B4D23,
 *   warning-50 = #FFF3EA, warning-200 = #FACFAE, warning-500 = #C2711C, warning-800 = #603301,
 *   error-50 = #FFF2F0, error-200 = #FCCBC4, error-500 = #E5493E, error-800 = #7A090A,
 *   primary-400 = #6AB1B1.
 */
export const helixAlertStyles = css`
  :host {
    display: block;
  }

  :host(:not([open])) {
    display: none;
  }

  /* ─── Screen-reader-only announcement region ─── */
  /* Always present in DOM so AT registers it before content is injected.     */
  /* Visually hidden via clip-path technique (superior to display:none which  */
  /* removes the element from the AT tree entirely).                          */

  .sr-only {
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

  * {
    box-sizing: border-box;
  }

  /* ─── Alert Container ─── */

  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--hx-alert-gap, var(--hx-space-3, 0.75rem));
    padding: var(--hx-alert-padding, var(--hx-space-4, 1rem));
    border: var(--hx-alert-border-width, var(--hx-border-width-thin, 1px)) solid
      var(--hx-alert-border-color, var(--hx-color-info-200, #bedcfc));
    border-radius: var(--hx-alert-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-alert-bg, var(--hx-color-info-50, #eff6fe));
    color: var(--hx-alert-color, var(--hx-color-info-800, #064172));
    font-family: var(--hx-alert-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-font-size-sm, 0.875rem);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Accent Variant (left border stripe) ─── */
  /* Removes full border and replaces with a left-side accent stripe.         */
  /* Common healthcare/enterprise dashboard pattern for dense information UIs. */

  .alert--accent {
    border-width: 0;
    border-inline-start: var(--hx-alert-accent-width, 4px) solid
      var(--hx-alert-border-color, var(--hx-color-info-200, #bedcfc));
    border-radius: 0;
  }

  /* ─── Severity Label (WCAG 1.4.1) ─── */
  /* Visually hidden — provides a non-color cue for screen readers and users    */
  /* who cannot distinguish variants by color alone (e.g. color-blind users).  */
  /* Always present regardless of showIcon so severity is never color-only.    */

  .alert__severity-label {
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

  .alert__icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--hx-alert-icon-color, var(--hx-color-info-500, #0c8beb));
  }

  .alert__icon svg {
    width: var(--hx-space-5, 1.25rem);
    height: var(--hx-space-5, 1.25rem);
    fill: currentColor;
  }

  /* ─── Title ─── */

  .alert__title {
    display: none;
    font-weight: var(--hx-font-weight-semibold, 600);
    margin-bottom: var(--hx-space-1, 0.25rem);
  }

  .alert__title--visible {
    display: block;
  }

  /* ─── Message ─── */

  .alert__message {
    flex: 1;
    min-width: 0;
  }

  /* ─── Actions ─── */
  /* Hidden by default; shown via JS slotchange detection to avoid invisible  */
  /* margin-top spacing when no actions are slotted.                          */

  .alert__actions {
    display: none;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    margin-top: var(--hx-space-2, 0.5rem);
  }

  .alert__actions--visible {
    display: flex;
  }

  /* ─── Close Button ─── */
  /* Minimum 44px touch target per WCAG 2.5.8 (Target Size Minimum, AA) and */
  /* Apple HIG / Google Material guidelines. Uses absolute px units to ensure */
  /* the target size is independent of the consumer's base font size.         */

  .alert__close-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-width: var(--hx-touch-target-size, 44px);
    min-height: var(--hx-touch-target-size, 44px);
    margin-inline-start: auto;
    padding: 0;
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    color: var(--hx-alert-color, var(--hx-color-info-800, #064172));
    cursor: pointer;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: 1;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      opacity var(--hx-transition-fast, 150ms ease);
    opacity: var(--hx-opacity-75, 0.75);
  }

  .alert__close-button:hover {
    opacity: var(--hx-opacity-100, 1);
    /* color-mix() is supported in Chrome 111+, Firefox 113+, Safari 16.2+.   */
    /* Falls back to transparent (no hover background) in older environments.  */
    background-color: color-mix(in srgb, currentColor 10%, transparent);
  }

  .alert__close-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(
        --hx-alert-close-btn-focus-ring-color,
        var(--hx-focus-ring-color, var(--hx-color-primary-400, #6ab1b1))
      );
    outline-offset: var(--hx-focus-ring-offset, 2px);
    opacity: 1;
  }

  .alert__close-button svg {
    width: var(--hx-space-4, 1rem);
    height: var(--hx-space-4, 1rem);
    fill: currentColor;
  }

  @media (prefers-reduced-motion: reduce) {
    .alert__close-button {
      transition: none;
    }
  }

  /* ─── Variant: info ─── */

  :host([variant='info']) .alert,
  :host(:not([variant])) .alert {
    --hx-alert-bg: var(--hx-color-info-50, #eff6fe);
    --hx-alert-border-color: var(--hx-color-info-200, #bedcfc);
    --hx-alert-color: var(--hx-color-info-800, #064172);
    --hx-alert-icon-color: var(--hx-color-info-500, #0c8beb);
  }

  /* ─── Variant: success ─── */

  :host([variant='success']) .alert {
    --hx-alert-bg: var(--hx-color-success-50, #eafaec);
    --hx-alert-border-color: var(--hx-color-success-200, #bae6c2);
    --hx-alert-color: var(--hx-color-success-800, #0b4d23);
    --hx-alert-icon-color: var(--hx-color-success-500, #3b9e58);
  }

  /* ─── Variant: warning ─── */

  :host([variant='warning']) .alert {
    --hx-alert-bg: var(--hx-color-warning-50, #fff3ea);
    --hx-alert-border-color: var(--hx-color-warning-200, #facfae);
    --hx-alert-color: var(--hx-color-warning-800, #603301);
    --hx-alert-icon-color: var(--hx-color-warning-500, #c2711c);
  }

  /* ─── Variant: error ─── */

  :host([variant='error']) .alert {
    --hx-alert-bg: var(--hx-color-error-50, #fff2f0);
    --hx-alert-border-color: var(--hx-color-error-200, #fccbc4);
    --hx-alert-color: var(--hx-color-error-800, #7a090a);
    --hx-alert-icon-color: var(--hx-color-error-500, #e5493e);
  }

  /* ─── Forced Colors (Windows High Contrast) ─── */
  /* Belt-and-suspenders: rich per-class HC overrides PLUS the forcedColorsSurface mixin. */

  @media (forced-colors: active) {
    .alert {
      border-color: CanvasText;
    }

    .alert--accent {
      border-inline-start-color: CanvasText;
    }

    .alert__icon svg {
      fill: CanvasText;
    }

    .alert__close-button {
      color: ButtonText;
      border: 1px solid ButtonText;
    }
  }
`;
