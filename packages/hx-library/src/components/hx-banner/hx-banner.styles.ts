import { css } from 'lit';

/**
 * hx-banner styles.
 *
 * Component-tier tokens with two-level var() fallback:
 *   var(--hx-banner-{prop}, var(--hx-color-{semantic}, #hex))
 * Inner hex fallbacks track the "precision cool" palette (3.2.0):
 *   info-50 = #EFF6FE, info-200 = #BEDCFC, info-500 = #0C8BEB, info-800 = #064172,
 *   success-50 = #EAFAEC, success-200 = #BAE6C2, success-500 = #3B9E58, success-800 = #0B4D23,
 *   warning-50 = #FFF3EA, warning-200 = #FACFAE, warning-500 = #C2711C, warning-800 = #603301,
 *   error-50 = #FFF2F0, error-200 = #FCCBC4, error-500 = #E5493E, error-800 = #7A090A,
 *   primary-400 = #6AB1B1.
 */
export const helixBannerStyles = css`
  :host {
    display: block;
    width: 100%;
    position: var(--hx-banner-position, sticky);
    top: 0;
    left: 0;
    right: 0;
    z-index: var(--hx-banner-z-index, 100);
  }

  :host(:not([open])) {
    display: none;
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Severity Label (WCAG 1.4.1) ─── */
  /* Visually hidden — ensures variant is never conveyed by color alone.   */
  /* Always rendered so screen readers can identify the banner severity.   */

  .banner__severity-label {
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

  /* ─── Banner Container ─── */

  .banner {
    display: flex;
    align-items: center;
    gap: var(--hx-banner-gap, var(--hx-space-3, 0.75rem));
    padding: var(--hx-banner-padding, var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem));
    background-color: var(--hx-banner-bg, var(--hx-color-info-50, #eff6fe));
    color: var(--hx-banner-color, var(--hx-color-info-800, #064172));
    border-bottom: var(--hx-banner-border-width, var(--hx-border-width-thin, 1px)) solid
      var(--hx-banner-border-color, var(--hx-color-info-200, #bedcfc));
    font-family: var(--hx-banner-font-family, var(--hx-font-family-sans, sans-serif));
    font-size: var(--hx-font-size-sm, 0.875rem);
    line-height: var(--hx-line-height-normal, 1.5);
    width: 100%;
  }

  /* ─── Icon ─── */

  .banner__icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--hx-banner-icon-color, var(--hx-color-info-500, #0c8beb));
  }

  .banner__icon svg {
    width: var(--hx-space-5, 1.25rem);
    height: var(--hx-space-5, 1.25rem);
    fill: currentColor;
  }

  /* ─── Message ─── */

  .banner__message {
    flex: 1;
    min-width: 0;
  }

  /* ─── Action Link ─── */

  .banner__action {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--hx-banner-action-color, var(--hx-banner-color, var(--hx-color-info-800, #064172)));
    font-weight: var(--hx-font-weight-semibold, 600);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    background: transparent;
    border: none;
    padding: 0;
    font-size: inherit;
    font-family: inherit;
  }

  .banner__action:hover {
    opacity: var(--hx-opacity-90, 0.9);
  }

  .banner__action:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(
        --hx-banner-action-focus-ring-color,
        var(--hx-focus-ring-color, var(--hx-color-primary-400, #6ab1b1))
      );
    outline-offset: var(--hx-focus-ring-offset, 2px);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
  }

  /* ─── Close Button ─── */
  /* Minimum 44px touch target per WCAG 2.5.8 (Target Size Minimum, AA) and */
  /* Apple HIG / Google Material guidelines. Uses absolute px units to ensure */
  /* the target size is independent of the consumer's base font size.         */

  .banner__close-button {
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
    color: var(--hx-banner-color, var(--hx-color-info-800, #064172));
    cursor: pointer;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: 1;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      opacity var(--hx-transition-fast, 150ms ease);
    opacity: var(--hx-opacity-75, 0.75);
  }

  .banner__close-button:hover {
    opacity: var(--hx-opacity-100, 1);
    /* color-mix() is supported in Chrome 111+, Firefox 113+, Safari 16.2+.   */
    /* Falls back to transparent (no hover background) in older environments.  */
    background-color: color-mix(in srgb, currentColor 10%, transparent);
  }

  .banner__close-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(
        --hx-banner-close-btn-focus-ring-color,
        var(--hx-focus-ring-color, var(--hx-color-primary-400, #6ab1b1))
      );
    outline-offset: var(--hx-focus-ring-offset, 2px);
    opacity: 1;
  }

  .banner__close-button svg {
    width: var(--hx-space-4, 1rem);
    height: var(--hx-space-4, 1rem);
    fill: currentColor;
  }

  /* ─── Variant: info ─── */

  :host([variant='info']) .banner,
  :host(:not([variant])) .banner {
    --hx-banner-bg: var(--hx-color-info-50, #eff6fe);
    --hx-banner-border-color: var(--hx-color-info-200, #bedcfc);
    --hx-banner-color: var(--hx-color-info-800, #064172);
    --hx-banner-icon-color: var(--hx-color-info-500, #0c8beb);
  }

  /* ─── Variant: success ─── */

  :host([variant='success']) .banner {
    --hx-banner-bg: var(--hx-color-success-50, #eafaec);
    --hx-banner-border-color: var(--hx-color-success-200, #bae6c2);
    --hx-banner-color: var(--hx-color-success-800, #0b4d23);
    --hx-banner-icon-color: var(--hx-color-success-500, #3b9e58);
  }

  /* ─── Variant: warning ─── */

  :host([variant='warning']) .banner {
    --hx-banner-bg: var(--hx-color-warning-50, #fff3ea);
    --hx-banner-border-color: var(--hx-color-warning-200, #facfae);
    --hx-banner-color: var(--hx-color-warning-800, #603301);
    --hx-banner-icon-color: var(--hx-color-warning-500, #c2711c);
  }

  /* ─── Variant: error ─── */

  :host([variant='error']) .banner {
    --hx-banner-bg: var(--hx-color-error-50, #fff2f0);
    --hx-banner-border-color: var(--hx-color-error-200, #fccbc4);
    --hx-banner-color: var(--hx-color-error-800, #7a090a);
    --hx-banner-icon-color: var(--hx-color-error-500, #e5493e);
  }

  /* ─── Position: fixed ─── */
  /* When position="fixed", override the host-level CSS custom property.    */
  /* The :host rule above sets position via var(--hx-banner-position).      */
  /* We use an attribute selector to override it cleanly without duplication. */

  :host([position='fixed']) {
    position: fixed;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .banner__close-button {
      transition: none;
    }
  }

  /* ─── Forced Colors (Windows High Contrast) ─── */
  /* Belt-and-suspenders: rich per-class HC overrides PLUS the forcedColorsSurface mixin. */

  @media (forced-colors: active) {
    .banner {
      border-bottom-color: CanvasText;
    }

    .banner__icon svg {
      fill: CanvasText;
    }

    .banner__close-button {
      color: ButtonText;
      border: 1px solid ButtonText;
    }
  }
`;
