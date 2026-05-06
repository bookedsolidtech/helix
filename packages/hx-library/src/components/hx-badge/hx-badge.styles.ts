import { css } from 'lit';

export const helixBadgeStyles = css`
  :host {
    display: inline-block;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--hx-space-1, 0.25rem);
    border-radius: var(--hx-badge-border-radius, var(--hx-border-radius-md, 0.375rem));
    background-color: var(--hx-badge-bg, var(--hx-color-primary-500, #429797));
    color: var(--hx-badge-color, var(--hx-color-text-on-primary, #0d1825));
    font-family: var(--hx-badge-font-family, var(--hx-font-family-sans, sans-serif));
    font-weight: var(--hx-badge-font-weight, var(--hx-font-weight-semibold, 600));
    line-height: var(--hx-line-height-tight, 1.25);
    white-space: nowrap;
    vertical-align: middle;
    position: relative;
  }

  /* ─── Size Variants ─── */

  .badge--sm {
    font-size: var(--hx-badge-font-size, var(--hx-font-size-2xs, 0.625rem));
    padding: var(--hx-badge-padding-y, var(--hx-space-0-5, 0.125rem))
      var(--hx-badge-padding-x, var(--hx-space-1-5, 0.375rem));
  }

  .badge--md {
    font-size: var(--hx-badge-font-size, var(--hx-font-size-xs, 0.75rem));
    padding: var(--hx-badge-padding-y, var(--hx-space-1, 0.25rem))
      var(--hx-badge-padding-x, var(--hx-space-2, 0.5rem));
  }

  .badge--lg {
    font-size: var(--hx-badge-font-size, var(--hx-font-size-sm, 0.875rem));
    padding: var(--hx-badge-padding-y, var(--hx-space-1, 0.25rem))
      var(--hx-badge-padding-x, var(--hx-space-3, 0.75rem));
  }

  /* ─── Style Variants ─── */

  .badge--primary {
    --hx-badge-bg: var(--hx-badge-primary-bg, var(--hx-color-primary-500, #429797));
    --hx-badge-color: var(--hx-badge-primary-color, var(--hx-color-text-on-primary, #0d1825));
    --hx-badge-pulse-color-internal: var(
      --hx-badge-pulse-color,
      var(--hx-badge-primary-bg, var(--hx-color-primary-500, #429797))
    );
  }

  .badge--secondary {
    --hx-badge-bg: var(--hx-badge-secondary-bg, var(--hx-color-neutral-100, #ebeee9));
    --hx-badge-color: var(--hx-badge-secondary-color, var(--hx-color-neutral-700, #313e4b));
    --hx-badge-pulse-color-internal: var(
      --hx-badge-pulse-color,
      var(--hx-badge-secondary-bg, var(--hx-color-neutral-100, #ebeee9))
    );
  }

  .badge--success {
    --hx-badge-bg: var(--hx-badge-success-bg, var(--hx-color-success-700, #146831));
    --hx-badge-color: var(--hx-badge-success-color, var(--hx-color-neutral-0, #ffffff));
    --hx-badge-pulse-color-internal: var(
      --hx-badge-pulse-color,
      var(--hx-badge-success-bg, var(--hx-color-success-700, #146831))
    );
  }

  .badge--warning {
    --hx-badge-bg: var(--hx-badge-warning-bg, var(--hx-color-warning-500, #c2711c));
    --hx-badge-color: var(--hx-badge-warning-color, var(--hx-color-neutral-900, #0d1825));
    --hx-badge-pulse-color-internal: var(
      --hx-badge-pulse-color,
      var(--hx-badge-warning-bg, var(--hx-color-warning-500, #c2711c))
    );
  }

  .badge--error {
    --hx-badge-bg: var(--hx-badge-error-bg, var(--hx-color-error-500, #e5493e));
    --hx-badge-color: var(--hx-badge-error-color, var(--hx-color-text-on-error, #0d1825));
    --hx-badge-pulse-color-internal: var(
      --hx-badge-pulse-color,
      var(--hx-badge-error-bg, var(--hx-color-error-500, #e5493e))
    );
  }

  .badge--neutral {
    --hx-badge-bg: var(--hx-badge-neutral-bg, var(--hx-color-neutral-200, #d6dbd5));
    --hx-badge-color: var(--hx-badge-neutral-color, var(--hx-color-neutral-700, #313e4b));
    --hx-badge-pulse-color-internal: var(
      --hx-badge-pulse-color,
      var(--hx-badge-neutral-bg, var(--hx-color-neutral-200, #d6dbd5))
    );
  }

  .badge--info {
    --hx-badge-bg: var(--hx-badge-info-bg, var(--hx-color-info-700, #0e5997));
    --hx-badge-color: var(--hx-badge-info-color, var(--hx-color-neutral-0, #ffffff));
    --hx-badge-pulse-color-internal: var(
      --hx-badge-pulse-color,
      var(--hx-badge-info-bg, var(--hx-color-info-700, #0e5997))
    );
  }

  /* ─── Semantic Variant Label (WCAG 1.4.1) ─── */
  /* Visually hidden text prefix for semantic variants (success/warning/error/info). */
  /* Ensures the variant is not conveyed by color alone.                             */

  .badge__variant-label {
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

  /* ─── Pill Mode ─── */

  .badge--pill {
    border-radius: var(--hx-badge-border-radius, var(--hx-border-radius-full, 9999px));
  }

  /* ─── Dot Indicator (empty + pulse) ─── */

  .badge--dot {
    width: var(--hx-badge-dot-size, var(--hx-space-2, 0.5rem));
    height: var(--hx-badge-dot-size, var(--hx-space-2, 0.5rem));
    padding: 0;
    border-radius: var(--hx-border-radius-full, 9999px);
  }

  /* Guard: hide all inner content in dot mode — the dot is purely visual */
  .badge--dot ::slotted(*),
  .badge--dot slot,
  .badge--dot slot[name='prefix'] {
    display: none !important;
  }

  /* ─── Pulse Animation ─── */

  @keyframes hx-badge-pulse {
    0%,
    100% {
      opacity: 1;
      box-shadow: 0 0 0 2px var(--hx-badge-pulse-color-internal, currentColor);
    }
    50% {
      opacity: var(--hx-opacity-75, 0.75);
      box-shadow: 0 0 0 6px transparent;
    }
  }

  .badge--pulse {
    animation: hx-badge-pulse var(--hx-badge-pulse-duration, var(--hx-duration-slow, 2s))
      var(--hx-badge-pulse-easing, var(--hx-easing-in-out, ease-in-out)) infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .badge--pulse {
      animation: none;
    }
  }

  /* ─── Remove Button ─── */

  .badge__remove-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 0;
    margin-inline-start: var(--hx-space-1, 0.25rem);
    cursor: pointer;
    color: inherit;
    opacity: var(--hx-opacity-75, 0.75);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    line-height: 0;
    /* WCAG 2.5.5: minimum 44×44px touch target */
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
  }

  .badge__remove-button:hover {
    opacity: var(--hx-opacity-100, 1);
  }

  .badge__remove-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, currentColor);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Forced Colors (Windows High Contrast) ─── */

  @media (forced-colors: active) {
    .badge {
      border: 1px solid CanvasText;
      forced-color-adjust: none;
      background-color: Canvas;
      color: CanvasText;
    }

    .badge--pulse {
      animation: none;
    }

    .badge__remove-button {
      color: ButtonText;
    }

    /* Per-semantic-variant forced-colors fallbacks. The visually-hidden
       semantic variant label (.badge__variant-label) keeps AT users
       informed; these blocks restore visual semantic distinction for
       sighted users in HCM where bg/color collapse to system defaults.
       Pattern: distinct border-style per variant. */
    .badge--success {
      border-style: solid;
      border-width: 2px;
    }

    .badge--warning {
      border-style: dashed;
      border-width: 2px;
    }

    .badge--error {
      border-style: double;
      border-width: 3px;
    }

    .badge--info {
      border-style: dotted;
      border-width: 2px;
    }
  }
`;
