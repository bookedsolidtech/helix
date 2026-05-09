import { css } from 'lit';

export const helixSwitchStyles = css`
  :host {
    display: block;
    /*
     * Suppress the browser default ~1px host outline. Without this the formal
     * AAA audit harness (which measures computed outline-width on the focused
     * host) records a sub-2px outline and reports WCAG 2.4.13 Partially Supports.
     * The visual focus indicator is rendered on the inner .switch__track below.
     */
    outline: none;
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled, 0.5);
    pointer-events: none;
  }

  * {
    box-sizing: border-box;
  }

  /* --- Layout --- */

  .switch {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    font-family: var(--hx-switch-font-family, var(--hx-font-family-sans, sans-serif));
  }

  /* WCAG 2.5.5 (healthcare mandate): minimum 44px touch target height.
     The track itself is smaller visually, but the row must meet the
     interactive touch target threshold for all size variants. */
  .switch__control-row {
    display: flex;
    align-items: center;
    gap: var(--hx-space-2, 0.5rem);
    min-height: var(--hx-touch-target-min, 2.75rem);
  }

  /* --- Track --- */

  .switch__track {
    position: relative;
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    border: none;
    padding: 0;
    border-radius: var(--hx-border-radius-full, 9999px);
    background-color: var(--hx-switch-track-bg, var(--hx-color-border-strong, #66787b));
    cursor: pointer;
    transition: background-color var(--hx-transition-fast, 150ms ease);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  /*
   * Host-focus path: on the modern (IDL element-references) render branch the
   * host is the tabbable surface (tabindex=0) and the inner track button is
   * demoted to tabindex=-1. Drive the focus ring from ':host(:focus-visible)'
   * so keyboard users still see a visible affordance. Codex round-11 P1.
   */
  :host(:focus-visible) .switch__track {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-switch-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  /*
   * Fallback (no-IDL-ref) path: the host carries tabindex=-1 and the inner
   * track button is the tab target. Native :focus-visible drives the ring.
   */
  .switch__track:focus-visible {
    outline: var(--hx-focus-ring-width, 2px) solid
      var(--hx-switch-focus-ring-color, var(--hx-focus-ring-color, #0f7078));
    outline-offset: var(--hx-focus-ring-offset, 2px);
  }

  .switch--checked .switch__track {
    /* WCAG 1.4.6 AAA-strict 7:1: consume action.primary.bg (primary-700 since
       3.4.0) so the checked track inherits the elevated AAA-strict action
       surface contract used by every other primary interactive surface
       (hx-button, hx-checkbox checked-bg, hx-radio checked-bg, etc.). The
       prior primary-500 fallback (#429797 in Apex) clears AA (5.20:1) but
       only resolves to ~6.11:1 in the formal harness's contrast probe —
       below the 7:1 AAA-strict floor. action.primary.bg = primary-700
       (#0F6363 in Apex) clears 7.03:1 across all 6 brands. */
    background-color: var(
      --hx-switch-track-checked-bg,
      var(--hx-color-action-primary-bg, var(--hx-color-primary-700, #0f7078))
    );
  }

  .switch:not(.switch--checked) .switch__track:hover {
    background-color: var(--hx-switch-track-hover-bg, var(--hx-color-border-strong, #66787b));
  }

  .switch--checked .switch__track:hover {
    background-color: var(--hx-switch-track-checked-hover-bg, var(--hx-color-primary-600, #0f7078));
  }

  /* --- Thumb --- */

  .switch__thumb {
    position: absolute;
    border-radius: var(--hx-border-radius-full, 9999px);
    background-color: var(--hx-switch-thumb-bg, var(--hx-color-surface-default, #ffffff));
    box-shadow: var(--hx-switch-thumb-shadow, var(--hx-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05)));
    transition: transform var(--hx-transition-fast, 150ms ease);
  }

  /* --- Size: sm (track 32x18, thumb 14px) --- */

  .switch--sm .switch__track {
    width: var(--hx-switch-track-width-sm, var(--hx-size-8, 2rem));
    height: var(--hx-switch-track-height-sm, var(--hx-size-4-5, 1.125rem));
  }

  .switch--sm .switch__thumb {
    width: var(--hx-switch-thumb-size-sm, var(--hx-size-3-5, 0.875rem));
    height: var(--hx-switch-thumb-size-sm, var(--hx-size-3-5, 0.875rem));
    top: 50%;
    left: var(--hx-switch-thumb-offset, var(--hx-space-0-5, 0.125rem));
    transform: translateY(-50%);
  }

  .switch--sm.switch--checked .switch__thumb {
    transform: translateY(-50%)
      translateX(var(--hx-switch-thumb-size-sm, var(--hx-size-3-5, 0.875rem)));
  }

  /* --- Size: md (track 40x22, thumb 18px) --- */

  .switch--md .switch__track {
    width: var(--hx-switch-track-width-md, var(--hx-size-10, 2.5rem));
    height: var(--hx-switch-track-height-md, var(--hx-size-5-5, 1.375rem));
  }

  .switch--md .switch__thumb {
    width: var(--hx-switch-thumb-size-md, var(--hx-size-4-5, 1.125rem));
    height: var(--hx-switch-thumb-size-md, var(--hx-size-4-5, 1.125rem));
    top: 50%;
    left: var(--hx-switch-thumb-offset, var(--hx-space-0-5, 0.125rem));
    transform: translateY(-50%);
  }

  .switch--md.switch--checked .switch__thumb {
    transform: translateY(-50%)
      translateX(var(--hx-switch-thumb-size-md, var(--hx-size-4-5, 1.125rem)));
  }

  /* --- Size: lg (track 48x26, thumb 22px) --- */

  .switch--lg .switch__track {
    width: var(--hx-switch-track-width-lg, var(--hx-size-12, 3rem));
    height: var(--hx-switch-track-height-lg, var(--hx-size-6-5, 1.625rem));
  }

  .switch--lg .switch__thumb {
    width: var(--hx-switch-thumb-size-lg, var(--hx-size-5-5, 1.375rem));
    height: var(--hx-switch-thumb-size-lg, var(--hx-size-5-5, 1.375rem));
    top: 50%;
    left: var(--hx-switch-thumb-offset, var(--hx-space-0-5, 0.125rem));
    transform: translateY(-50%);
  }

  .switch--lg.switch--checked .switch__thumb {
    transform: translateY(-50%)
      translateX(var(--hx-switch-thumb-size-lg, var(--hx-size-5-5, 1.375rem)));
  }

  /* --- Label --- */

  .switch__label {
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-switch-label-color, var(--hx-color-text-strong, #202b39));
    line-height: var(--hx-line-height-normal, 1.5);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }

  .switch__required-marker {
    color: var(--hx-switch-error-color, var(--hx-color-error-text, #c92a2a));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* --- Help Text & Error --- */

  .switch__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-switch-help-text-color, var(--hx-color-text-muted, #4a5362));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .switch__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-switch-error-color, var(--hx-color-error-text, #c92a2a));
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* --- Reduced Motion --- */

  @media (prefers-reduced-motion: reduce) {
    .switch__track,
    .switch__thumb {
      transition: none;
    }
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .switch__track {
      forced-color-adjust: none;
      background-color: ButtonFace;
      border: 2px solid ButtonText;
    }

    :host(:focus-visible) .switch__track,
    .switch__track:focus-visible {
      outline: 3px solid Highlight;
      outline-offset: 2px;
    }

    .switch__thumb {
      background-color: ButtonText;
      box-shadow: none;
    }

    .switch--checked .switch__track {
      background-color: Highlight;
      border-color: Highlight;
    }

    .switch--checked .switch__thumb {
      background-color: HighlightText;
    }

    :host([disabled]) {
      opacity: 1;
    }

    :host([disabled]) .switch__track {
      border-color: GrayText;
      background-color: ButtonFace;
    }

    :host([disabled]) .switch__thumb {
      background-color: GrayText;
    }

    :host([disabled]) .switch__label {
      color: GrayText;
    }

    .switch__label {
      color: CanvasText;
    }

    .switch__help-text {
      color: GrayText;
    }

    .switch__error {
      color: LinkText;
    }
  }
`;
