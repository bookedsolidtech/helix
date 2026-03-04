import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixFieldStyles } from './hx-field.styles.js';

/**
 * Layout wrapper providing consistent label + input + help text + validation
 * message structure for any form control. Use this when wrapping non-HELiX
 * form controls or native HTML elements in the HELiX form field pattern.
 *
 * This component is NOT form-associated — it is a pure visual layout wrapper.
 *
 * @summary Layout wrapper for label, control, help text, and error message.
 *
 * @tag hx-field
 *
 * @slot - The form control element (native or custom).
 * @slot label - Custom label content (overrides the label property).
 * @slot help - Custom help text content (overrides the helpText property).
 * @slot error - Custom error content (overrides the error property).
 * @slot description - Additional descriptive content above the control.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart control - The wrapper around slotted content.
 * @csspart help-text - The help text container.
 * @csspart error-message - The error message container.
 * @csspart required-indicator - The required asterisk span.
 *
 * @cssprop [--hx-field-label-color=var(--hx-color-neutral-700)] - Label color.
 * @cssprop [--hx-field-error-color=var(--hx-color-error-500)] - Error color.
 * @cssprop [--hx-field-font-family=var(--hx-font-family-sans)] - Font family.
 */
@customElement('hx-field')
export class HelixField extends LitElement {
  static override styles = [tokenStyles, helixFieldStyles];

  // ─── Properties ───

  /**
   * The visible label text for the field.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Whether the field is required. Shows a required indicator on the label.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Error message to display. When set, the field enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the control for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Visual disabled state applied via opacity. Does not affect slotted control
   * interactivity — set disabled on the slotted control directly.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Size variant controlling label and help text font sizes.
   * @attr hx-size
   */
  @property({ type: String, attribute: 'hx-size' })
  hxSize: 'sm' | 'md' | 'lg' = 'md';

  // ─── Slot Tracking ───

  private _hasLabelSlot = false;
  private _hasErrorSlot = false;
  private _hasHelpSlot = false;

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedElements().length > 0;
    this.requestUpdate();
  }

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedElements().length > 0;
    this.requestUpdate();
  }

  private _handleHelpSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHelpSlot = slot.assignedElements().length > 0;
    this.requestUpdate();
  }

  // ─── Unique IDs for Accessibility ───

  private _fieldId = `hx-field-${Math.random().toString(36).slice(2, 9)}`;
  private _helpTextId = `${this._fieldId}-help`;
  private _errorId = `${this._fieldId}-error`;

  // ─── Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;
    const hasHelp = !!this.helpText || this._hasHelpSlot;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
      'field--size-sm': this.hxSize === 'sm',
      'field--size-md': this.hxSize === 'md',
      'field--size-lg': this.hxSize === 'lg',
    };

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <!-- Label -->
        <div class="field__label-wrapper">
          <slot name="label" @slotchange=${this._handleLabelSlotChange}>
            ${this.label && !this._hasLabelSlot
              ? html`
                  <label part="label" class="field__label">
                    ${this.label}
                    ${this.required
                      ? html`<span
                          part="required-indicator"
                          class="field__required-marker"
                          aria-hidden="true"
                          >*</span
                        >`
                      : nothing}
                  </label>
                `
              : nothing}
          </slot>
        </div>

        <!-- Description -->
        <slot name="description"></slot>

        <!-- Control (default slot) -->
        <div part="control" class="field__control">
          <slot></slot>
        </div>

        <!-- Error -->
        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${this.error
            ? html`
                <div
                  part="error-message"
                  class="field__error"
                  id=${this._errorId}
                  role="alert"
                  aria-live="polite"
                >
                  ${this.error}
                </div>
              `
            : nothing}
        </slot>

        <!-- Help text (always in DOM so slot detection works; hidden when no help or error is shown) -->
        <div
          part="help-text"
          class="field__help-text"
          id=${this._helpTextId}
          ?hidden=${!hasHelp || hasError}
        >
          <slot name="help" @slotchange=${this._handleHelpSlotChange}>${this.helpText}</slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-field': HelixField;
  }
}
