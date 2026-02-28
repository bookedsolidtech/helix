import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTextInputStyles } from './hx-text-input.styles.js';

/**
 * A text input component with label, validation, and form association.
 *
 * @summary Form-associated text input with built-in label, error, and help text.
 *
 * @tag hx-text-input
 *
 * @slot label - Custom label content (overrides the label property). Use for Drupal Form API rendered labels.
 * @slot prefix - Content rendered before the input (e.g., icon).
 * @slot suffix - Content rendered after the input (e.g., icon or button).
 * @slot help-text - Custom help text content (overrides the helpText property).
 * @slot error - Custom error content (overrides the error property). Use for Drupal Form API rendered errors.
 *
 * @fires {CustomEvent<{value: string}>} hx-input - Dispatched on every keystroke as the user types.
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when the input loses focus after its value changed.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart input-wrapper - The wrapper around prefix, input, and suffix.
 * @csspart input - The native input element.
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
 */
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static override styles = [tokenStyles, helixTextInputStyles];

  // ─── Form Association ───

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * The visible label text for the input.
   * @attr label
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * Placeholder text shown when the input is empty.
   * @attr placeholder
   * @default ''
   */
  @property({ type: String })
  placeholder = '';

  /**
   * The current value of the input.
   * @attr value
   * @default ''
   */
  @property({ type: String })
  value = '';

  /**
   * The type of the native input element.
   * @attr type
   * @default 'text'
   */
  @property({ type: String })
  type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' = 'text';

  /**
   * Whether the input is required for form submission.
   * @attr required
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  required: boolean = false;

  /**
   * Whether the input is disabled.
   * @attr disabled
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled: boolean = false;

  /**
   * Error message to display. When set, the input enters an error state.
   * @attr error
   * @default ''
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the input for guidance.
   * @attr help-text
   * @default ''
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * The name of the input, used for form submission.
   * @attr name
   * @default ''
   */
  @property({ type: String })
  name = '';

  /**
   * Accessible name for screen readers, if different from the visible label.
   * @attr aria-label
   * @default null
   */
  @property({ type: String, attribute: 'aria-label' })
  override ariaLabel: string | null = null;

  // ─── Internal References ───

  @query('.field__input')
  private _input!: HTMLInputElement;

  // ─── Slot Tracking ───

  private _hasLabelSlot = false;
  private _hasErrorSlot = false;

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedElements().length > 0;
    if (this._hasLabelSlot) {
      const slottedLabel = slot.assignedElements()[0];
      if (slottedLabel && !slottedLabel.id) {
        slottedLabel.id = `${this._inputId}-slotted-label`;
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
      this.updateValidity();
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

  /** Checks whether the input satisfies its constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Reports validity and shows the browser's constraint validation UI. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
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
    if (!this.shouldHandleInput(e)) return;

    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);

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
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);
    this.updateValidity();

    /**
     * Dispatched when the input loses focus after its value changed.
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

  /** Moves focus to the input element. */
  override focus(options?: FocusOptions): void {
    this._input?.focus(options);
  }

  /** Selects all text in the input. */
  select(): void {
    this._input?.select();
  }

  // ─── Extension API ───

  /**
   * Override to customize the CSS classes applied to the outer field container.
   * Called during render. Merge with super's result to preserve base styling.
   * @protected
   * @since 1.0.0
   */
  protected getFieldClasses(): Record<string, boolean> {
    const hasError = !!this.error || this._hasErrorSlot;
    return {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
    };
  }

  /**
   * Override to provide custom validation logic.
   * Called whenever value changes. Use this._internals to set validity state.
   * @protected
   * @since 1.0.0
   */
  protected updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'This field is required.',
        this._input,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  /**
   * Called before each input event is processed. Return false to cancel the input.
   * @protected
   * @since 1.0.0
   */
  protected shouldHandleInput(_e: Event): boolean {
    return true;
  }

  // ─── Render ───

  private _inputId = `hx-text-input-${Math.random().toString(36).slice(2, 9)}`;
  private _helpTextId = `${this._inputId}-help`;
  private _errorId = `${this._inputId}-error`;

  override render(): TemplateResult {
    const hasError = !!this.error || this._hasErrorSlot;

    const describedBy =
      [hasError ? this._errorId : null, this.helpText ? this._helpTextId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    return html`
      <div part="field" class=${classMap(this.getFieldClasses())}>
        <div class="field__label-wrapper">
          <slot name="label" @slotchange=${this._handleLabelSlotChange}>
            ${this.label
              ? html`
                  <label part="label" class="field__label" for=${this._inputId}>
                    ${this.label}
                    ${this.required
                      ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
                      : nothing}
                  </label>
                `
              : nothing}
          </slot>
        </div>

        <div part="input-wrapper" class="field__input-wrapper">
          <span class="field__prefix">
            <slot name="prefix"></slot>
          </span>

          <input
            part="input"
            class="field__input"
            id=${this._inputId}
            type=${this.type}
            .value=${live(this.value)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            ?required=${this.required}
            ?disabled=${this.disabled}
            name=${ifDefined(this.name || undefined)}
            aria-label=${ifDefined(this.ariaLabel ?? undefined)}
            aria-labelledby=${ifDefined(
              this._hasLabelSlot ? `${this._inputId}-slotted-label` : undefined,
            )}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            aria-required=${this.required ? 'true' : nothing}
            @input=${this._handleInput}
            @change=${this._handleChange}
          />

          <span class="field__suffix">
            <slot name="suffix"></slot>
          </span>
        </div>

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
    'hx-text-input': HelixTextInput;
  }
}
