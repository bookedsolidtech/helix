import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixHelpTextStyles } from './hx-help-text.styles.js';

/** Icon SVG for error variant (circle with exclamation mark). */
const errorIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true" width="1em" height="1em">
  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none" />
  <line
    x1="8"
    y1="4.5"
    x2="8"
    y2="8.5"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <circle cx="8" cy="11" r="0.75" fill="currentColor" />
</svg>`;

/** Icon SVG for warning variant (triangle with exclamation mark). */
const warningIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true" width="1em" height="1em">
  <path
    d="M7.134 2.5a1 1 0 011.732 0l5.196 9a1 1 0 01-.866 1.5H2.804a1 1 0 01-.866-1.5l5.196-9z"
    stroke="currentColor"
    stroke-width="1.25"
    fill="none"
  />
  <line
    x1="8"
    y1="6"
    x2="8"
    y2="9"
    stroke="currentColor"
    stroke-width="1.25"
    stroke-linecap="round"
  />
  <circle cx="8" cy="11" r="0.625" fill="currentColor" />
</svg>`;

/** Icon SVG for success variant (circle with checkmark). */
const successIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true" width="1em" height="1em">
  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none" />
  <path
    d="M5.25 8.25l1.75 1.75 3.75-3.75"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
</svg>`;

/** Map of variant to icon template. Default has no icon. */
const variantIcons = {
  default: nothing,
  error: errorIcon,
  warning: warningIcon,
  success: successIcon,
} as const;

/**
 * Standardized help/hint text displayed below form fields.
 * Used by hx-field as a consistent sub-component for guidance and validation messages.
 *
 * Non-default variants render an inline icon alongside the text to satisfy
 * WCAG 1.4.1 (color is not the sole visual indicator). The `error` variant
 * uses `role="alert"` for immediate screen-reader announcement; `warning`
 * and `success` use `aria-live="polite"` for non-intrusive announcements.
 *
 * @summary Help text displayed below form controls for guidance or validation feedback.
 *
 * @tag hx-help-text
 *
 * @slot - The help text content.
 *
 * @csspart base - The root element of the help text.
 * @csspart icon - The icon wrapper (only rendered for non-default variants).
 * @csspart text - The text wrapper around the default slot.
 *
 * @cssprop [--hx-help-text-color=var(--hx-color-neutral-500)] - Text color.
 * @cssprop [--hx-help-text-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-help-text-font-size=var(--hx-font-size-sm)] - Font size.
 * @cssprop [--hx-help-text-font-weight=var(--hx-font-weight-normal)] - Font weight.
 * @cssprop [--hx-help-text-line-height=var(--hx-line-height-normal)] - Line height.
 * @cssprop [--hx-help-text-icon-gap=0.375rem] - Gap between icon and text.
 */
@customElement('hx-help-text')
export class HelixHelpText extends LitElement {
  static override styles = [tokenStyles, helixHelpTextStyles];

  /**
   * Visual variant that determines the text color and icon.
   * Use `error` for validation errors, `warning` for cautions, `success` for confirmation.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'error' | 'warning' | 'success' = 'default';

  override render() {
    const classes = {
      'help-text': true,
      [`help-text--${this.variant}`]: true,
    };

    const icon = variantIcons[this.variant];
    const role = this.variant === 'error' ? 'alert' : undefined;
    const ariaLive =
      this.variant === 'warning' || this.variant === 'success' ? 'polite' : undefined;

    return html`<span
      part="base"
      class=${classMap(classes)}
      role=${ifDefined(role)}
      aria-live=${ifDefined(ariaLive)}
      >${icon !== nothing
        ? html`<span part="icon" class="help-text__icon">${icon}</span>`
        : nothing}<span part="text" class="help-text__text"><slot></slot></span>
    </span>`;
  }
}

export type WcHelpText = HelixHelpText;

declare global {
  interface HTMLElementTagNameMap {
    'hx-help-text': HelixHelpText;
  }
}
