import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixHelpTextStyles } from './hx-help-text.styles.js';

/**
 * Standardized help/hint text displayed below form fields.
 * Used by hx-field as a consistent sub-component for guidance and validation messages.
 *
 * @summary Help text displayed below form controls for guidance or validation feedback.
 *
 * @tag hx-help-text
 *
 * @slot - The help text content.
 *
 * @csspart base - The root element of the help text.
 *
 * @cssprop [--hx-help-text-color=var(--hx-color-neutral-500)] - Text color.
 * @cssprop [--hx-help-text-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-help-text-font-size=var(--hx-font-size-sm)] - Font size.
 * @cssprop [--hx-help-text-font-weight=var(--hx-font-weight-normal)] - Font weight.
 * @cssprop [--hx-help-text-line-height=var(--hx-line-height-normal)] - Line height.
 */
@customElement('hx-help-text')
export class HelixHelpText extends LitElement {
  static override styles = [tokenStyles, helixHelpTextStyles];

  /**
   * Visual variant that determines the text color.
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

    return html`<span part="base" class=${classMap(classes)}><slot></slot></span>`;
  }
}

export type WcHelpText = HelixHelpText;

declare global {
  interface HTMLElementTagNameMap {
    'hx-help-text': HelixHelpText;
  }
}
