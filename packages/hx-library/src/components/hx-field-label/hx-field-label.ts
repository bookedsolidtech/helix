import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixFieldLabelStyles } from './hx-field-label.styles.js';

/**
 * Standardized label for form fields. Used as a consistent sub-component
 * for hx-field and other form field components.
 *
 * When the `for` attribute is set, renders a native `<label for="...">` element
 * for direct label association with a same-document form control.
 *
 * When `for` is unset, renders a `<span>` that can be referenced via
 * `aria-labelledby` for labeling controls in a shadow DOM boundary.
 *
 * @summary Standardized label for form fields.
 *
 * @tag hx-field-label
 *
 * @slot - Label text content.
 * @slot required-indicator - Custom required marker (defaults to "*").
 *
 * @csspart base - The label or span element.
 * @csspart required-indicator - The required indicator wrapper.
 * @csspart optional-indicator - The optional text indicator.
 *
 * @cssprop [--hx-field-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-font-label-size=var(--hx-font-size-sm)] - Label font size.
 * @cssprop [--hx-font-label-weight=var(--hx-font-weight-medium)] - Label font weight.
 * @cssprop [--hx-font-label-line-height=var(--hx-line-height-normal)] - Label line height.
 * @cssprop [--hx-font-label-family=var(--hx-font-family-sans)] - Label font family.
 */
@customElement('hx-field-label')
export class HelixFieldLabel extends LitElement {
  static override styles = [tokenStyles, helixFieldLabelStyles];

  /**
   * The ID of the associated form control. When set, renders a native
   * `<label for="...">` element for direct label association.
   * @attr for
   */
  @property({ type: String })
  for = '';

  /**
   * Whether the associated field is required. Shows a required indicator (*).
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the associated field is optional. Shows "(optional)" text.
   * @attr optional
   */
  @property({ type: Boolean, reflect: true })
  optional = false;

  override render() {
    const requiredIndicator = this.required
      ? html`<span part="required-indicator" class="required-indicator" aria-hidden="true"
          ><slot name="required-indicator">*</slot></span
        >`
      : nothing;

    const optionalIndicator = this.optional
      ? html`<span part="optional-indicator" class="optional-indicator">(optional)</span>`
      : nothing;

    const content = html`<slot></slot>${requiredIndicator}${optionalIndicator}`;

    if (this.for) {
      return html`<label part="base" class="label" for=${this.for}>${content}</label>`;
    }

    return html`<span part="base" class="label">${content}</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-field-label': HelixFieldLabel;
  }
}
