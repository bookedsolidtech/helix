import { css } from 'lit';

export const helixTagStyles = css`
  :host {
    display: inline-block;
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled, 0.5);
    pointer-events: none;
    /* cursor: not-allowed is intentionally omitted — pointer-events: none prevents cursor display */
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: var(--hx-space-1, 0.25rem);
    border-radius: var(--hx-tag-border-radius, var(--hx-border-radius-sm, 0.25rem));
    background-color: var(--hx-tag-bg, var(--hx-color-neutral-100, #ebeee9));
    color: var(--hx-tag-color, var(--hx-color-neutral-700, #313e4b));
    font-family: var(--hx-tag-font-family, var(--hx-font-family-sans, sans-serif));
    font-weight: var(--hx-tag-font-weight, var(--hx-font-weight-medium, 500));
    line-height: var(--hx-line-height-tight, 1.25);
    white-space: nowrap;
    vertical-align: middle;
    border: var(--hx-border-width-thin, 1px) solid
      var(--hx-tag-border-color, var(--hx-color-neutral-200, #d6dbd5));
  }

  /* ─── Size Variants ─── */

  .tag--sm {
    font-size: var(--hx-tag-font-size, var(--hx-font-size-xs, 0.75rem));
    padding: var(--hx-tag-padding-y, var(--hx-space-0-5, 0.125rem))
      var(--hx-tag-padding-x, var(--hx-space-1-5, 0.375rem));
  }

  .tag--md {
    font-size: var(--hx-tag-font-size, var(--hx-font-size-sm, 0.875rem));
    padding: var(--hx-tag-padding-y, var(--hx-space-1, 0.25rem))
      var(--hx-tag-padding-x, var(--hx-space-2, 0.5rem));
  }

  .tag--lg {
    font-size: var(--hx-tag-font-size, var(--hx-font-size-md, 1rem));
    padding: var(--hx-tag-padding-y, var(--hx-space-1-5, 0.375rem))
      var(--hx-tag-padding-x, var(--hx-space-3, 0.75rem));
  }

  /* ─── Color Variants ─── */

  .tag--default {
    --hx-tag-bg: var(--hx-tag-default-bg, var(--hx-color-neutral-100, #ebeee9));
    --hx-tag-color: var(--hx-tag-default-color, var(--hx-color-neutral-700, #313e4b));
    --hx-tag-border-color: var(--hx-tag-default-border-color, var(--hx-color-neutral-200, #d6dbd5));
  }

  .tag--primary {
    --hx-tag-bg: var(--hx-tag-primary-bg, var(--hx-color-primary-50, #ebf8f8));
    --hx-tag-color: var(--hx-tag-primary-color, var(--hx-color-primary-700, #0f6363));
    --hx-tag-border-color: var(--hx-tag-primary-border-color, var(--hx-color-primary-200, #bce1e1));
  }

  .tag--success {
    --hx-tag-bg: var(--hx-tag-success-bg, var(--hx-color-success-50, #eafaec));
    --hx-tag-color: var(--hx-tag-success-color, var(--hx-color-success-700, #146831));
    --hx-tag-border-color: var(--hx-tag-success-border-color, var(--hx-color-success-200, #bae6c2));
  }

  .tag--warning {
    --hx-tag-bg: var(--hx-tag-warning-bg, var(--hx-color-warning-50, #fff3ea));
    --hx-tag-color: var(--hx-tag-warning-color, var(--hx-color-warning-700, #804605));
    --hx-tag-border-color: var(--hx-tag-warning-border-color, var(--hx-color-warning-200, #facfae));
  }

  .tag--danger {
    --hx-tag-bg: var(--hx-tag-danger-bg, var(--hx-color-error-50, #fff2f0));
    --hx-tag-color: var(--hx-tag-danger-color, var(--hx-color-error-700, #a21312));
    --hx-tag-border-color: var(--hx-tag-danger-border-color, var(--hx-color-error-200, #fccbc4));
  }

  /* ─── Semantic Variant Label (WCAG 1.4.1) ─── */
  /* Visually hidden text prefix for semantic variants (success/warning/danger). */
  /* Ensures the variant state is not conveyed by color alone.                   */

  .tag__variant-label {
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

  /* Uses --hx-tag-border-radius-pill (separate from --hx-tag-border-radius) so consumer
     overrides to --hx-tag-border-radius don't break pill shape. */
  .tag--pill {
    border-radius: var(--hx-tag-border-radius-pill, var(--hx-border-radius-full, 9999px));
  }

  /* ─── Prefix / Suffix slots ─── */

  .tag__prefix,
  .tag__suffix {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* Hide wrappers when slots have no assigned content */
  .tag__prefix--hidden,
  .tag__suffix--hidden {
    display: none;
  }

  /* ─── Remove Button ─── */

  .tag__remove-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    /* WCAG 2.5.5 (healthcare mandate): minimum 44x44px touch target */
    min-width: var(--hx-touch-target-min, 2.75rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
    padding: 0;
    margin-inline-start: var(--hx-space-1, 0.25rem);
    cursor: pointer;
    color: inherit;
    opacity: var(--hx-opacity-75, 0.75);
    border-radius: var(--hx-border-radius-sm, 0.25rem);
    line-height: 0;
  }

  .tag__remove-button:hover {
    opacity: var(--hx-opacity-100, 1);
  }

  .tag__remove-button:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, currentColor);
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /* ─── Forced Colors (Windows High Contrast) ─── */

  @media (forced-colors: active) {
    .tag {
      border-color: CanvasText;
    }

    .tag__remove-button {
      color: ButtonText;
    }
  }
`;
