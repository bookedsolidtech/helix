import { css } from 'lit';

export const helixPatientBannerStyles = css`
  :host {
    display: block;
    width: 100%;

    /* ─── Private token vars (3-tier cascade) ─── */
    --_bg: var(--hx-patient-banner-bg, var(--hx-color-neutral-50, #f9fafb));
    --_border-color: var(--hx-patient-banner-border-color, var(--hx-color-neutral-200, #e5e7eb));
    --_padding: var(
      --hx-patient-banner-padding,
      var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem)
    );
    --_gap: var(--hx-patient-banner-gap, var(--hx-space-4, 1rem));
    --_font-family: var(--hx-patient-banner-font-family, var(--hx-font-family-sans, sans-serif));
    --_label-color: var(--hx-patient-banner-label-color, var(--hx-color-neutral-500, #6b7280));
    --_label-font-size: var(--hx-patient-banner-label-font-size, var(--hx-font-size-xs, 0.75rem));
    --_value-color: var(--hx-patient-banner-value-color, var(--hx-color-neutral-900, #111827));
    --_value-font-size: var(--hx-patient-banner-value-font-size, var(--hx-font-size-sm, 0.875rem));
    --_photo-size: var(--hx-patient-banner-photo-size, var(--hx-space-10, 2.5rem));
  }

  * {
    box-sizing: border-box;
  }

  /* ─── Banner Container ─── */

  .banner {
    display: flex;
    align-items: center;
    gap: var(--_gap);
    padding: var(--_padding);
    background-color: var(--_bg);
    border-bottom: var(--hx-border-width-thin, 1px) solid var(--_border-color);
    font-family: var(--_font-family);
    width: 100%;
  }

  /* ─── Photo Area ─── */

  .banner__photo-area {
    flex-shrink: 0;
    width: var(--_photo-size);
    height: var(--_photo-size);
    border-radius: var(--hx-border-radius-full, 9999px);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--hx-color-neutral-200, #e5e7eb);
  }

  /* ─── Fields Grid ─── */

  .banner__fields {
    display: flex;
    flex-wrap: wrap;
    gap: var(--_gap);
    flex: 1;
    min-width: 0;
  }

  /* ─── Individual Field ─── */

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    min-width: 0;
  }

  .field__label {
    font-size: var(--_label-font-size);
    color: var(--_label-color);
    font-weight: var(--hx-font-weight-medium, 500);
    line-height: var(--hx-line-height-tight, 1.25);
    white-space: nowrap;
  }

  .field__value {
    font-size: var(--_value-font-size);
    color: var(--_value-color);
    font-weight: var(--hx-font-weight-normal, 400);
    line-height: var(--hx-line-height-normal, 1.5);
    display: flex;
    align-items: center;
    gap: var(--hx-space-1, 0.25rem);
  }

  /* ─── Identifier Rule Violation ─── */
  /* Visual indicator when Joint Commission two-identifier rule is not met. */

  :host([aria-invalid='true']) .banner {
    border-bottom-color: var(--hx-color-error-400, #f87171);
    background-color: var(--hx-color-error-50, #fef2f2);
  }

  :host([aria-invalid='true']) .banner::before {
    content: '';
    display: block;
    position: absolute;
    inset-inline-start: 0;
    top: 0;
    bottom: 0;
    width: var(--hx-border-width-thick, 4px);
    background-color: var(--hx-color-error-500, #ef4444);
    border-radius: 0;
  }

  :host([aria-invalid='true']) {
    position: relative;
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .banner {
      transition: none;
    }
  }
`;
