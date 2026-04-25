import { css } from 'lit';

export const helixPatientBannerStyles = css`
  :host {
    display: block;
    width: 100%;

    /* ─── Private token vars (3-tier cascade) ─── */
    --_bg: var(--hx-patient-banner-bg, var(--hx-color-neutral-50, #f5f8f3));
    --_border-color: var(--hx-patient-banner-border-color, var(--hx-color-neutral-200, #d6dbd5));
    --_padding: var(
      --hx-patient-banner-padding,
      var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem)
    );
    --_gap: var(--hx-patient-banner-gap, var(--hx-space-4, 1rem));
    --_font-family: var(--hx-patient-banner-font-family, var(--hx-font-family-sans, sans-serif));
    /* neutral-500 (#66787B) on neutral-50 (#F5F8F3) = 4.32:1 — fails AA body text.
       text-muted resolves to neutral-600 (#4A5362) = 7.36:1 — AA pass everywhere. */
    --_label-color: var(--hx-patient-banner-label-color, var(--hx-color-text-muted, #4a5362));
    --_label-font-size: var(--hx-patient-banner-label-font-size, var(--hx-font-size-xs, 0.75rem));
    --_value-color: var(--hx-patient-banner-value-color, var(--hx-color-neutral-900, #0d1825));
    --_value-font-size: var(--hx-patient-banner-value-font-size, var(--hx-font-size-sm, 0.875rem));
    --_photo-size: var(--hx-patient-banner-photo-size, var(--hx-space-10, 2.5rem));
    --_photo-bg: var(--hx-patient-banner-photo-bg, var(--hx-color-neutral-200, #d6dbd5));
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
    position: relative;
  }

  /* ─── Photo Area ─── */

  .banner__photo-area {
    flex-shrink: 0;
    width: var(--_photo-size);
    height: var(--_photo-size);
    /* Minimum touch target for interactive photo content (WCAG 2.5.8). */
    min-width: var(--hx-touch-target-size, 44px);
    min-height: var(--hx-touch-target-size, 44px);
    border-radius: var(--hx-border-radius-full, 9999px);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--_photo-bg);
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
    border-bottom-color: var(
      --hx-patient-banner-invalid-border-color,
      var(--hx-color-error-400, #fc7264)
    );
    background-color: var(--hx-patient-banner-invalid-bg, var(--hx-color-error-50, #fff2f0));
    /* Darken label color to maintain 4.5:1 contrast on error-50 background. */
    --_label-color: var(--hx-patient-banner-label-color, var(--hx-color-neutral-700, #313e4b));
  }

  :host([aria-invalid='true']) .banner::before {
    content: '';
    display: block;
    position: absolute;
    inset-inline-start: 0;
    top: 0;
    bottom: 0;
    width: var(--hx-border-width-thick, 4px);
    background-color: var(
      --hx-patient-banner-invalid-accent-color,
      var(--hx-color-error-500, #e5493e)
    );
    border-radius: 0;
  }

  /* ─── Visually-hidden violation live region ─── */
  /* Announces identifier rule violations to screen readers without visible text. */

  .violation-message {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* ─── Motion reduction ─── */

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      animation: none !important;
    }
  }

  /* ─── Forced Colors (Windows High Contrast) ─── */

  @media (forced-colors: active) {
    .banner {
      border-bottom-color: CanvasText;
    }

    :host([aria-invalid='true']) .banner {
      border-bottom-color: LinkText;
    }

    :host([aria-invalid='true']) .banner::before {
      background-color: LinkText;
    }

    .banner__photo-area {
      border: 1px solid CanvasText;
    }
  }
`;
