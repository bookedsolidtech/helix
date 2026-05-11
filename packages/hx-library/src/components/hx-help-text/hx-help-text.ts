import { html, nothing } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import '../hx-icon/hx-icon.js';
import { HelixElement } from '../../base/index.js';
import { helixHelpTextStyles } from './hx-help-text.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';

/** Icon for error variant. */
const errorIcon = html`<hx-icon
  class="help-text__glyph"
  library="helix"
  name="error"
  aria-hidden="true"
></hx-icon>`;

/** Icon for warning variant. */
const warningIcon = html`<hx-icon
  class="help-text__glyph"
  library="helix"
  name="warning"
  aria-hidden="true"
></hx-icon>`;

/** Icon for success variant. */
const successIcon = html`<hx-icon
  class="help-text__glyph"
  library="helix"
  name="success"
  aria-hidden="true"
></hx-icon>`;

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
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-normal] - Font weight.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-color-error-600] - Color.
 * @cssprop [--hx-color-warning-700] - Color.
 * @cssprop [--hx-color-success-700] - Color.
 *
 * @aaa-certified 2026-05-09
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-help-text/AAA-AUDIT.md
 * @aria-pattern label
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated false
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-help-text
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-help-text')
export class HelixHelpText extends HelixElement {
  static override styles = [helixHelpTextStyles, forcedColorsSurface];

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

/** Canonical type alias for the hx-help-text component. */
export type HxHelpText = HelixHelpText;

declare global {
  interface HTMLElementTagNameMap {
    'hx-help-text': HelixHelpText;
  }
}
