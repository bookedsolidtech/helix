import { css } from 'lit';

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
    background-color: var(--hx-banner-bg, var(--hx-color-info-50, #e8f4fd));
    color: var(--hx-banner-color, var(--hx-color-info-800, #1a3a4a));
    border-bottom: var(--hx-banner-border-width, var(--hx-border-width-thin, 1px)) solid
      var(--hx-banner-border-color, var(--hx-color-info-200, #b3d9ef));
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
    color: var(--hx-banner-icon-color, var(--hx-color-info-500, #3b82f6));
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
    color: var(--hx-banner-action-color, var(--hx-banner-color, var(--hx-color-info-800, #1a3a4a)));
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
    opacity: 0.8;
  }

  .banner__action:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
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
    margin-left: auto;
    padding: 0;
    border: none;
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    background: transparent;
    color: var(--hx-banner-color, var(--hx-color-info-800, #1a3a4a));
    cursor: pointer;
    font-size: var(--hx-font-size-md, 1rem);
    line-height: 1;
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      opacity var(--hx-transition-fast, 150ms ease);
    opacity: 0.7;
  }

  .banner__close-button:hover {
    opacity: 1;
    /* color-mix() is supported in Chrome 111+, Firefox 113+, Safari 16.2+.   */
    /* Falls back to transparent (no hover background) in older environments.  */
    background-color: color-mix(in srgb, currentColor 10%, transparent);
  }

  .banner__close-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
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
    --hx-banner-bg: var(--hx-color-info-50, #e8f4fd);
    --hx-banner-border-color: var(--hx-color-info-200, #b3d9ef);
    --hx-banner-color: var(--hx-color-info-800, #1a3a4a);
    --hx-banner-icon-color: var(--hx-color-info-500, #3b82f6);
  }

  /* ─── Variant: success ─── */

  :host([variant='success']) .banner {
    --hx-banner-bg: var(--hx-color-success-50, #ecfdf5);
    --hx-banner-border-color: var(--hx-color-success-200, #a7f3d0);
    --hx-banner-color: var(--hx-color-success-800, #065f46);
    --hx-banner-icon-color: var(--hx-color-success-500, #10b981);
  }

  /* ─── Variant: warning ─── */

  :host([variant='warning']) .banner {
    --hx-banner-bg: var(--hx-color-warning-50, #fffbeb);
    --hx-banner-border-color: var(--hx-color-warning-200, #fde68a);
    --hx-banner-color: var(--hx-color-warning-800, #92400e);
    --hx-banner-icon-color: var(--hx-color-warning-500, #f59e0b);
  }

  /* ─── Variant: error ─── */

  :host([variant='error']) .banner {
    --hx-banner-bg: var(--hx-color-error-50, #fef2f2);
    --hx-banner-border-color: var(--hx-color-error-200, #fecaca);
    --hx-banner-color: var(--hx-color-error-800, #991b1b);
    --hx-banner-icon-color: var(--hx-color-error-500, #ef4444);
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
`;
