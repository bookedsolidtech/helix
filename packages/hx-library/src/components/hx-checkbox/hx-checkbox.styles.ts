import { css } from 'lit';

export const helixCheckboxStyles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled, 0.5);
    pointer-events: none;
  }

  * {
    box-sizing: border-box;
  }

  .checkbox {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    font-family: var(--hx-checkbox-font-family, var(--hx-font-family-sans, sans-serif));
  }

  /* ─── Control (checkbox + label row) ─── */

  .checkbox__control {
    display: inline-flex;
    align-items: flex-start;
    gap: var(--hx-space-2, 0.5rem);
    /* WCAG 2.5.5 (healthcare mandate): minimum 44px touch target height */
    min-height: var(--hx-touch-target-min, 2.75rem);
    cursor: pointer;
  }

  :host([disabled]) .checkbox__control {
    cursor: not-allowed;
  }

  /* ─── Hidden Native Input ─── */

  .checkbox__input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  /* ─── Visual Checkbox ─── */

  .checkbox__box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--hx-checkbox-size, var(--hx-size-5, 1.25rem));
    height: var(--hx-checkbox-size, var(--hx-size-5, 1.25rem));
    border: var(--hx-border-width-medium, 2px) solid
      var(--hx-checkbox-border-color, var(--hx-color-border-strong, #8e9c98));
    border-radius: var(--hx-checkbox-border-radius, var(--hx-border-radius-sm, 0.25rem));
    background-color: var(--hx-checkbox-bg, var(--hx-color-surface-default, #ffffff));
    transition:
      background-color var(--hx-transition-fast, 150ms ease),
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    margin-top: var(--hx-space-px, 1px);
  }

  /* ─── Focus Ring ─── */

  .checkbox__input:focus-visible ~ .checkbox__box {
    outline: var(--hx-checkbox-focus-ring-width, var(--hx-focus-ring-width, 2px)) solid
      var(
        --hx-checkbox-focus-ring-color,
        var(--hx-focus-ring-color, var(--hx-color-primary-400, #6ab1b1))
      );
    outline-offset: var(--hx-checkbox-focus-ring-offset, var(--hx-focus-ring-offset, 2px));
  }

  /* ─── Checked State ─── */

  .checkbox--checked .checkbox__box {
    background-color: var(--hx-checkbox-checked-bg, var(--hx-color-primary-500, #429797));
    border-color: var(--hx-checkbox-checked-border-color, var(--hx-color-primary-500, #429797));
  }

  /* ─── Indeterminate State ─── */

  .checkbox--indeterminate .checkbox__box {
    background-color: var(--hx-checkbox-checked-bg, var(--hx-color-primary-500, #429797));
    border-color: var(--hx-checkbox-checked-border-color, var(--hx-color-primary-500, #429797));
  }

  /* ─── Error State ─── */

  .checkbox--error .checkbox__box {
    border-color: var(--hx-checkbox-error-color, var(--hx-color-error-500, #e5493e));
  }

  .checkbox--error.checkbox--checked .checkbox__box,
  .checkbox--error.checkbox--indeterminate .checkbox__box {
    background-color: var(--hx-checkbox-error-color, var(--hx-color-error-500, #e5493e));
    border-color: var(--hx-checkbox-error-color, var(--hx-color-error-500, #e5493e));
  }

  /* ─── Hover ─── */

  /* P1-03: use component token so consumer overrides of --hx-checkbox-border-color work on hover */
  .checkbox__control:hover .checkbox__box {
    border-color: var(
      --hx-checkbox-hover-border-color,
      var(--hx-checkbox-border-color, var(--hx-color-primary-500, #429797))
    );
  }

  .checkbox--checked .checkbox__control:hover .checkbox__box {
    filter: brightness(var(--hx-filter-brightness-hover, 0.9));
  }

  .checkbox--error .checkbox__control:hover .checkbox__box {
    border-color: var(--hx-checkbox-error-color, var(--hx-color-error-500, #e5493e));
  }

  /* ─── Checkmark Icon ─── */

  .checkbox__icon {
    display: none;
    width: calc(var(--hx-checkbox-size, var(--hx-size-5, 1.25rem)) * 0.65);
    height: calc(var(--hx-checkbox-size, var(--hx-size-5, 1.25rem)) * 0.65);
    fill: none;
    stroke: var(--hx-checkbox-checkmark-color, var(--hx-color-text-on-primary, #ffffff));
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .checkbox--checked .checkbox__icon--check {
    display: block;
  }

  .checkbox--indeterminate .checkbox__icon--indeterminate {
    display: block;
  }

  /* ─── Label ─── */

  .checkbox__label {
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--hx-checkbox-label-color, var(--hx-color-text-strong, #202b39));
    line-height: var(--hx-line-height-normal, 1.5);
    user-select: none;
    -webkit-user-select: none;
  }

  .checkbox__required-marker {
    color: var(--hx-checkbox-error-color, var(--hx-color-error-text, #c92a2a));
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Help Text & Error Messages ─── */

  .checkbox__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-checkbox-help-text-color, var(--hx-color-text-muted, #4a5362));
    line-height: var(--hx-line-height-normal, 1.5);
    padding-inline-start: calc(
      var(--hx-checkbox-size, var(--hx-size-5, 1.25rem)) + var(--hx-space-2, 0.5rem)
    );
  }

  .checkbox__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--hx-checkbox-error-color, var(--hx-color-error-text, #c92a2a));
    line-height: var(--hx-line-height-normal, 1.5);
    padding-inline-start: calc(
      var(--hx-checkbox-size, var(--hx-size-5, 1.25rem)) + var(--hx-space-2, 0.5rem)
    );
  }

  /* ─── Size Variants ─── */

  :host([hx-size='sm']) {
    --hx-checkbox-size: var(--hx-size-4, 1rem);
  }

  :host([hx-size='sm']) .checkbox__label {
    font-size: var(--hx-font-size-xs, 0.75rem);
  }

  :host([hx-size='sm']) .checkbox__help-text,
  :host([hx-size='sm']) .checkbox__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    padding-inline-start: calc(var(--hx-size-4, 1rem) + var(--hx-space-2, 0.5rem));
  }

  :host([hx-size='lg']) {
    --hx-checkbox-size: var(--hx-size-6, 1.5rem);
  }

  :host([hx-size='lg']) .checkbox__label {
    font-size: var(--hx-font-size-md, 1rem);
  }

  :host([hx-size='lg']) .checkbox__help-text,
  :host([hx-size='lg']) .checkbox__error {
    font-size: var(--hx-font-size-sm, 0.875rem);
    padding-inline-start: calc(var(--hx-size-6, 1.5rem) + var(--hx-space-2, 0.5rem));
  }

  /* ─── Reduced Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .checkbox__box {
      transition: none;
    }
  }

  /* ─── High Contrast Mode (forced-colors) ─── */

  @media (forced-colors: active) {
    .checkbox__box {
      forced-color-adjust: none;
      background-color: ButtonFace;
      border: 2px solid ButtonText;
    }

    .checkbox__input:focus-visible ~ .checkbox__box {
      outline: 3px solid Highlight;
      outline-offset: 2px;
    }

    .checkbox--checked .checkbox__box,
    .checkbox--indeterminate .checkbox__box {
      background-color: Highlight;
      border-color: Highlight;
    }

    .checkbox__icon {
      stroke: HighlightText;
    }

    .checkbox--error .checkbox__box {
      border-color: LinkText;
    }

    .checkbox--error.checkbox--checked .checkbox__box,
    .checkbox--error.checkbox--indeterminate .checkbox__box {
      background-color: LinkText;
      border-color: LinkText;
    }

    :host([disabled]) {
      opacity: 1;
    }

    :host([disabled]) .checkbox__box {
      border-color: GrayText;
      background-color: ButtonFace;
    }

    :host([disabled]) .checkbox--checked .checkbox__box,
    :host([disabled]) .checkbox--indeterminate .checkbox__box {
      background-color: GrayText;
      border-color: GrayText;
    }

    :host([disabled]) .checkbox__label {
      color: GrayText;
    }

    .checkbox__label {
      color: CanvasText;
    }

    .checkbox__help-text {
      color: GrayText;
    }

    .checkbox__error {
      color: LinkText;
    }
  }
`;
