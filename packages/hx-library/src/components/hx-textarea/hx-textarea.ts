import { LitElement, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTextareaStyles } from './hx-textarea.styles.js';

/**
 * A multi-line text area component with label, validation, and form association.
 *
 * @summary Form-associated textarea with built-in label, error, help text, character counter, and auto-resize.
 *
 * @tag hx-textarea
 *
 * @slot label - Custom label content (overrides the label property). Use for Drupal Form API rendered labels.
 * @slot help-text - Custom help text content (overrides the helpText property).
 * @slot error - Custom error content (overrides the error property). Use for Drupal Form API rendered errors.
 *
 * @fires {CustomEvent<{value: string}>} hx-input - Dispatched on every keystroke as the user types.
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when the textarea loses focus after its value changed.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart textarea-wrapper - The wrapper around the textarea.
 * @csspart textarea - The native textarea element.
 * @csspart counter - The character count display.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 *
 * @cssprop [--hx-input-bg=var(--hx-color-neutral-0)] - Input background color.
 * @cssprop [--hx-input-color=var(--hx-color-neutral-800)] - Input text color.
 * @cssprop [--hx-input-border-color=var(--hx-color-neutral-300)] - Input border color.
 * @cssprop [--hx-input-border-radius=var(--hx-border-radius-md)] - Input border radius.
 * @cssprop [--hx-input-font-family=var(--hx-font-family-sans)] - Input font family.
 * @cssprop [--hx-input-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-input-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-input-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-textarea-min-height=var(--hx-size-20, 5rem)] - Minimum textarea height.
 */
@customElement('hx-textarea')
export class HelixTextarea extends LitElement {
  static override styles = [tokenStyles, helixTextareaStyles];

  // ─── Form Association ───

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * The visible label text for the textarea.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Placeholder text shown when the textarea is empty.
   * @attr placeholder
   */
  @property({ type: String })
  placeholder = '';

  /**
   * The current value of the textarea.
   * @attr value
   */
  @property({ type: String })
  value = '';

  /**
   * Whether the textarea is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the textarea is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Error message to display. When set, the textarea enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the textarea for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * The name of the textarea, used for form submission.
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * The number of visible text rows.
   * @attr rows
   */
  @property({ type: Number })
  rows = 4;

  /**
   * Maximum number of characters allowed.
   * @attr maxlength
   */
  @property({ type: Number, attribute: 'maxlength' })
  maxlength: number | undefined;

  /**
   * Controls how the textarea can be resized. Use 'auto' for auto-grow behavior.
   * @attr resize
   */
  @property({ type: String, reflect: true })
  resize: 'none' | 'vertical' | 'both' | 'auto' = 'vertical';

  /**
   * Whether to show a character count below the textarea.
   * @attr show-count
   */
  @property({ type: Boolean, attribute: 'show-count' })
  showCount = false;

  /**
   * Accessible name for screen readers, if different from the visible label.
   * @attr aria-label
   */
  @property({ type: String, attribute: 'aria-label' })
  override ariaLabel: string | null = null;

  // ─── Internal References ───

  @query('.field__textarea')
  private _textarea!: HTMLTextAreaElement;

  // ─── Slot Tracking ───

  private _hasLabelSlot = false;
  private _hasErrorSlot = false;

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedElements().length > 0;
    if (this._hasLabelSlot) {
      const slottedLabel = slot.assignedElements()[0];
      if (slottedLabel && !slottedLabel.id) {
        slottedLabel.id = `${this._textareaId}-slotted-label`;
      }
    }
    this.requestUpdate();
  }

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedElements().length > 0;
    this.requestUpdate();
  }

  // ─── Lifecycle ───

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();
    }
  }

  // ─── Form Integration ───

  /** Returns the associated form element, if any. */
  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  /** Returns the validation message. */
  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  /** Returns the ValidityState object. */
  get validity(): ValidityState {
    return this._internals.validity;
  }

  /** Checks whether the textarea satisfies its constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Reports validity and shows the browser's constraint validation UI. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'This field is required.',
        this._textarea,
      );
    } else if (this.maxlength !== undefined && this.value.length > this.maxlength) {
      this._internals.setValidity(
        { tooLong: true },
        this.error || `Value must be ${this.maxlength} characters or fewer.`,
        this._textarea,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  // Called by the form when it resets
  formResetCallback(): void {
    this.value = '';
    this._internals.setFormValue('');
  }

  // Called when the form restores state (e.g., back/forward navigation)
  formStateRestoreCallback(state: string): void {
    this.value = state;
  }

  // ─── Event Handling ───

  private _handleInput(e: Event): void {
    const target = e.target as HTMLTextAreaElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);

    // Auto-grow: reset height then set to scrollHeight
    if (this.resize === 'auto') {
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }

    /**
     * Dispatched on every keystroke as the user types.
     * @event hx-input
     */
    this.dispatchEvent(
      new CustomEvent('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private _handleChange(e: Event): void {
    const target = e.target as HTMLTextAreaElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);
    this._updateValidity();

    /**
     * Dispatched when the textarea loses focus after its value changed.
     * @event hx-change
     */
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  // ─── Public Methods ───

  /** Moves focus to the textarea element. */
  override focus(options?: FocusOptions): void {
    this._textarea?.focus(options);
  }

  /** Selects all text in the textarea. */
  select(): void {
    this._textarea?.select();
  }

  // ─── Render ───

  private _textareaId = `hx-textarea-${Math.random().toString(36).slice(2, 9)}`;
  private _helpTextId = `${this._textareaId}-help`;
  private _errorId = `${this._textareaId}-error`;

  private _renderCounter() {
    if (!this.showCount) return nothing;

    const count = this.value.length;
    const display = this.maxlength !== undefined ? `${count} / ${this.maxlength}` : `${count}`;

    return html` <div part="counter" class="field__counter">${display}</div> `;
  }

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
    };

    const describedBy =
      [hasError ? this._errorId : null, this.helpText ? this._helpTextId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <div class="field__label-wrapper">
          <slot name="label" @slotchange=${this._handleLabelSlotChange}>
            ${this.label
              ? html`
                  <label part="label" class="field__label" for=${this._textareaId}>
                    ${this.label}
                    ${this.required
                      ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
                      : nothing}
                  </label>
                `
              : nothing}
          </slot>
        </div>

        <div part="textarea-wrapper" class="field__textarea-wrapper">
          <textarea
            part="textarea"
            class="field__textarea"
            id=${this._textareaId}
            .value=${live(this.value)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            ?required=${this.required}
            ?disabled=${this.disabled}
            rows=${this.rows}
            maxlength=${ifDefined(this.maxlength)}
            name=${ifDefined(this.name || undefined)}
            aria-label=${ifDefined(this.ariaLabel ?? undefined)}
            aria-labelledby=${ifDefined(
              this._hasLabelSlot ? `${this._textareaId}-slotted-label` : undefined,
            )}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            aria-required=${this.required ? 'true' : nothing}
            @input=${this._handleInput}
            @change=${this._handleChange}
          ></textarea>
        </div>

        ${this._renderCounter()}

        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${this.error
            ? html`
                <div
                  part="error"
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

        ${this.helpText && !hasError
          ? html`
              <div part="help-text" class="field__help-text" id=${this._helpTextId}>
                <slot name="help-text">${this.helpText}</slot>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-textarea': HelixTextarea;
  }
}
