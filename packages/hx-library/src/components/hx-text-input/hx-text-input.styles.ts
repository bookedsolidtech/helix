import { css } from 'lit';

/**
 * hx-text-input styles.
 *
 * Component-tier tokens introduced in 3.2.0 — every visual property exposes
 * `--hx-text-input-*` overrides while preserving backward-compatible
 * `--hx-input-*` aliases that earlier consumers may already use.
 *
 * Two-level var() fallback pattern is canonical:
 *   var(--hx-text-input-{prop}, var(--hx-color-{semantic}, #hex))
 * Inner hex fallbacks track the "precision cool" palette (primary-600=#0F7078,
 * neutral-200=#D6DBD5, etc.) introduced in the same release.
 */
export const helixTextInputStyles = css`
  :host {
    display: block;

    /* ─── Component tokens (3.2.0) ──────────────────────────────────── */

    /* Surface */
    --_text-input-bg: var(
      --hx-text-input-bg,
      var(--hx-input-bg, var(--hx-color-surface-default, #ffffff))
    );
    --_text-input-color: var(
      --hx-text-input-color,
      var(--hx-input-color, var(--hx-color-text-strong, #202b39))
    );
    --_text-input-placeholder-color: var(
      --hx-text-input-placeholder-color,
      var(--hx-color-text-placeholder, #66787b)
    );

    /* Border */
    --_text-input-border-color: var(
      --hx-text-input-border-color,
      var(--hx-input-border-color, var(--hx-color-border-strong, #8e9c98))
    );
    --_text-input-border-color-hover: var(
      --hx-text-input-border-color-hover,
      var(--hx-color-border-strong, #8e9c98)
    );
    --_text-input-border-color-focus: var(
      --hx-text-input-border-color-focus,
      var(
        --hx-input-focus-ring-color,
        var(--hx-focus-ring-color, var(--hx-color-primary-400, #6ab1b1))
      )
    );
    --_text-input-border-color-invalid: var(
      --hx-text-input-border-color-invalid,
      var(--hx-input-error-color, var(--hx-color-error-600, #c92a2a))
    );
    --_text-input-border-width: var(--hx-text-input-border-width, var(--hx-border-width-thin, 1px));
    --_text-input-border-radius: var(
      --hx-text-input-border-radius,
      var(--hx-input-border-radius, var(--hx-border-radius-md, 0.375rem))
    );

    /* Spacing */
    --_text-input-padding-x: var(--hx-text-input-padding-x, var(--hx-space-3, 0.75rem));
    --_text-input-padding-y: var(--hx-text-input-padding-y, var(--hx-space-2, 0.5rem));

    /* Typography */
    --_text-input-font-family: var(
      --hx-text-input-font-family,
      var(--hx-input-font-family, var(--hx-font-family-sans, sans-serif))
    );
    --_text-input-font-size: var(--hx-text-input-font-size, var(--hx-font-size-md, 1rem));

    /* Focus ring */
    --_text-input-focus-ring-color: var(
      --hx-text-input-focus-ring-color,
      var(
        --hx-input-focus-ring-color,
        var(--hx-focus-ring-color, var(--hx-color-primary-400, #6ab1b1))
      )
    );
    --_text-input-focus-ring-width: var(
      --hx-text-input-focus-ring-width,
      var(--hx-focus-ring-width, 2px)
    );
    --_text-input-focus-ring-offset: var(
      --hx-text-input-focus-ring-offset,
      var(--hx-focus-ring-offset, 0px)
    );

    /* Disabled */
    --_text-input-disabled-bg: var(
      --hx-text-input-disabled-bg,
      var(--hx-color-surface-sunken, #ebeee9)
    );
    --_text-input-disabled-color: var(
      --hx-text-input-disabled-color,
      var(--hx-color-text-disabled, #8e9c98)
    );

    /* Label / help / error */
    --_text-input-label-color: var(
      --hx-text-input-label-color,
      var(--hx-input-label-color, var(--hx-color-text-strong, #202b39))
    );
    --_text-input-help-text-color: var(
      --hx-text-input-help-text-color,
      var(--hx-color-text-muted, #4a5362)
    );
    --_text-input-error-color: var(
      --hx-text-input-error-color,
      var(--hx-input-error-color, var(--hx-color-error-text, #c92a2a))
    );
  }

  :host([disabled]) {
    opacity: var(--hx-opacity-disabled, 0.5);
    pointer-events: none;
  }

  /*
   * Attribute-based focus hooks set by FocusMixin.
   * :host([focused]) — fires whenever the component or any descendant has focus.
   * :host([focused-visible]) — fires only for keyboard-initiated focus.
   * These complement the :focus-within rules on .field__input-wrapper and are
   * exposed as theming hooks for consumers who target the host element.
   */
  :host([focused]) .field__input-wrapper,
  :host([focused-visible]) .field__input-wrapper {
    border-color: var(--_text-input-border-color-focus);
    box-shadow: 0 0 0 var(--_text-input-focus-ring-width)
      color-mix(
        in srgb,
        var(--_text-input-border-color-focus) calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  * {
    box-sizing: border-box;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--hx-space-1, 0.25rem);
    font-family: var(--_text-input-font-family);
  }

  /* ─── Label ─── */

  .field__label-wrapper {
    display: contents;
  }

  .field__label {
    display: flex;
    align-items: baseline;
    gap: var(--hx-space-1, 0.25rem);
    font-size: var(--hx-font-size-sm, 0.875rem);
    font-weight: var(--hx-font-weight-medium, 500);
    color: var(--_text-input-label-color);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__required-marker {
    color: var(--_text-input-error-color);
    font-weight: var(--hx-font-weight-bold, 700);
  }

  /* ─── Input Wrapper ─── */

  .field__input-wrapper {
    display: flex;
    align-items: center;
    border: var(--_text-input-border-width) solid var(--_text-input-border-color);
    border-radius: var(--_text-input-border-radius);
    background-color: var(--_text-input-bg);
    transition:
      border-color var(--hx-transition-fast, 150ms ease),
      box-shadow var(--hx-transition-fast, 150ms ease);
    overflow: hidden;
  }

  .field__input-wrapper:hover {
    border-color: var(--_text-input-border-color-hover);
  }

  .field__input-wrapper:focus-within {
    border-color: var(--_text-input-border-color-focus);
    box-shadow: 0 0 0 var(--_text-input-focus-ring-width)
      color-mix(
        in srgb,
        var(--_text-input-border-color-focus) calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* ─── Error State ─── */

  .field--error .field__input-wrapper {
    border-color: var(--_text-input-border-color-invalid);
  }

  .field--error .field__input-wrapper:focus-within {
    border-color: var(--_text-input-border-color-invalid);
    box-shadow: 0 0 0 var(--_text-input-focus-ring-width)
      color-mix(
        in srgb,
        var(--_text-input-border-color-invalid) calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
        transparent
      );
  }

  /* ─── Slots (Prefix / Suffix) ─── */

  .field__prefix,
  .field__suffix {
    display: flex;
    align-items: center;
    color: var(--hx-color-text-muted, #4a5362);
    flex-shrink: 0;
  }

  /* Only add padding when slot has content — avoids phantom space on empty slots */
  .field__prefix--filled {
    padding: 0 var(--_text-input-padding-x);
  }

  .field__suffix--filled {
    padding: 0 var(--_text-input-padding-x);
  }

  /* ─── Native Input ─── */

  .field__input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: var(--_text-input-padding-y) var(--_text-input-padding-x);
    font-family: inherit;
    font-size: var(--_text-input-font-size);
    color: var(--_text-input-color);
    line-height: var(--hx-line-height-normal, 1.5);
    min-height: var(--hx-size-10, 2.5rem);
    width: 100%;
  }

  .field__input::placeholder {
    color: var(--_text-input-placeholder-color);
  }

  .field__input:focus-visible {
    outline: none; /* wrapper ring handles keyboard focus indication */
  }

  .field__input:disabled {
    cursor: not-allowed;
    background-color: var(--_text-input-disabled-bg);
    color: var(--_text-input-disabled-color);
  }

  :host([disabled]) .field__input-wrapper {
    background-color: var(--_text-input-disabled-bg);
  }

  /* ─── Size Variants ─── */

  .field--size-sm .field__input {
    padding: var(--hx-space-1, 0.25rem) var(--hx-space-2, 0.5rem);
    min-height: var(--hx-size-8, 2rem);
    font-size: var(--hx-text-input-sm-font-size, var(--hx-input-sm-font-size, 0.875rem));
  }

  .field--size-md .field__input {
    /* md is the default — no overrides needed */
  }

  .field--size-lg .field__input {
    padding: var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem);
    min-height: var(--hx-size-12, 3rem);
    font-size: var(--hx-text-input-lg-font-size, var(--hx-input-lg-font-size, 1.125rem));
  }

  /* ─── Help Text & Error Messages ─── */

  .field__help-text {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--_text-input-help-text-color);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  .field__error {
    font-size: var(--hx-font-size-xs, 0.75rem);
    color: var(--_text-input-error-color);
    line-height: var(--hx-line-height-normal, 1.5);
  }

  /* ─── Motion ─── */

  @media (prefers-reduced-motion: reduce) {
    .field__input-wrapper {
      transition: none;
    }
  }

  /* ─── High Contrast Mode (forced-colors) ───
   *
   * Component-specific overrides that complement the shared forcedColorsField
   * mixin (composed in static styles). The mixin handles the input/wrapper
   * core; the rules below extend it to the label / error / help-text /
   * disabled-host surfaces unique to hx-text-input.
   */

  @media (forced-colors: active) {
    .field__input-wrapper {
      forced-color-adjust: none;
      background-color: Field;
      color: FieldText;
      border: 2px solid ButtonText;
    }

    .field__input {
      color: FieldText;
    }

    .field__input::placeholder {
      color: GrayText;
    }

    .field__input-wrapper:focus-within {
      border-color: Highlight;
      box-shadow: none;
    }

    .field__input:focus-visible {
      outline: 3px solid Highlight;
      outline-offset: -3px;
    }

    :host([disabled]) {
      opacity: 1;
    }

    :host([disabled]) .field__input-wrapper {
      border-color: GrayText;
      color: GrayText;
    }

    :host([disabled]) .field__input {
      color: GrayText;
    }

    .field--error .field__input-wrapper {
      border-color: LinkText;
    }

    .field__label {
      color: CanvasText;
    }

    .field__help-text {
      color: GrayText;
    }

    .field__error {
      color: LinkText;
    }
  }
`;
