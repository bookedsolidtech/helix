import { LitElement, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTextInputStyles } from './hx-text-input.styles.js';

// Module-level counter for stable, SSR-compatible IDs (avoids Math.random() hydration mismatch)
let _hxTextInputIdCounter = 0;

/**
 * A text input component with label, validation, and form association.
 * Supports accessible labeling via `label` property, `aria-label` attribute, or the `label` slot.
 * Uses `aria-invalid`, `aria-describedby`, and `aria-required` on the native input for screen reader support.
 * Error messages are announced via `role="alert"`. Keyboard navigation follows native input behavior.
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
 * @cssprop [--hx-input-sm-font-size=0.875rem] - Font size for the sm size variant.
 * @cssprop [--hx-input-lg-font-size=1.125rem] - Font size for the lg size variant.
 */
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  static override styles = [tokenStyles, helixTextInputStyles];

  // ─── Form Association ───

  /** @internal */
  static formAssociated = true;

  /** @internal */
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * The visible label text for the input.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Placeholder text shown when the input is empty.
   * @attr placeholder
   */
  @property({ type: String })
  placeholder = '';

  /**
   * The current value of the input.
   * @attr value
   */
  @property({ type: String })
  value = '';

  /**
   * The type of the native input element.
   * @attr type
   */
  @property({ type: String })
  type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' | 'date' = 'text';

  /**
   * Whether the input is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the input is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Error message to display. When set, the input enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the input for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * The name of the input, used for form submission.
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * Accessible name for screen readers, if different from the visible label.
   * @attr aria-label
   */
  @property({ type: String, attribute: 'aria-label' })
  override ariaLabel: string | null = null;

  /**
   * Whether the input is read-only.
   * @attr readonly
   */
  @property({ type: Boolean, reflect: true })
  readonly = false;

  /**
   * Minimum number of characters allowed.
   * @attr minlength
   */
  @property({ type: Number })
  minlength: number | undefined = undefined;

  /**
   * Maximum number of characters allowed.
   * @attr maxlength
   */
  @property({ type: Number })
  maxlength: number | undefined = undefined;

  /**
   * A regular expression pattern the value must match for form validation.
   * @attr pattern
   */
  @property({ type: String })
  pattern = '';

  /**
   * Hint for the browser's autocomplete feature. Accepts standard HTML autocomplete values.
   * @attr autocomplete
   */
  @property({ type: String })
  autocomplete = '';

  /**
   * Visual size of the input field.
   * @attr hx-size
   */
  @property({ type: String, attribute: 'hx-size', reflect: true })
  hxSize: 'sm' | 'md' | 'lg' = 'md';

  // ─── Internal References ───

  /** @internal */
  @query('.field__input')
  private _input!: HTMLInputElement;

  // ─── Slot Tracking ───

  /** @internal */
  private _hasLabelSlot = false;
  /** @internal */
  private _hasErrorSlot = false;
  /** @internal */
  private _hasPrefixSlot = false;
  /** @internal */
  private _hasSuffixSlot = false;
  /** @internal */
  private _hasHelpTextSlot = false;

  /** @internal */
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

  /** @internal */
  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedElements().length > 0;
    this.requestUpdate();
  }

  /** @internal */
  private _handlePrefixSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasPrefixSlot = slot.assignedElements().length > 0;
    this.requestUpdate();
  }

  /** @internal */
  private _handleSuffixSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasSuffixSlot = slot.assignedElements().length > 0;
    this.requestUpdate();
  }

  /** @internal */
  private _handleHelpTextSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHelpTextSlot = slot.assignedElements().length > 0;
    this.requestUpdate();
  }

  // ─── Lifecycle ───

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
    }
    if (
      changedProperties.has('value') ||
      changedProperties.has('required') ||
      changedProperties.has('minlength') ||
      changedProperties.has('maxlength')
    ) {
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

  /** Checks whether the input satisfies its constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Reports validity and shows the browser's constraint validation UI. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  /** @internal */
  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'This field is required.',
        this._input,
      );
    } else if (
      this.minlength !== undefined &&
      this.value.length > 0 &&
      this.value.length < this.minlength
    ) {
      this._internals.setValidity(
        { tooShort: true },
        this.error || `Please lengthen this text to ${this.minlength} characters or more.`,
        this._input,
      );
    } else if (this.maxlength !== undefined && this.value.length > this.maxlength) {
      this._internals.setValidity(
        { tooLong: true },
        this.error || `Please shorten this text to ${this.maxlength} characters or fewer.`,
        this._input,
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

  /** @internal */
  private _handleInput(e: Event): void {
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

  /** @internal */
  private _handleChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);
    this._updateValidity();

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

  // ─── Render ───

  /** @internal */
  private _inputId = `hx-text-input-${++_hxTextInputIdCounter}`;
  /** @internal */
  private _helpTextId = `${this._inputId}-help`;
  /** @internal */
  private _errorId = `${this._inputId}-error`;

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
      [`field--size-${this.hxSize}`]: true,
    };

    const describedBy =
      [
        hasError ? this._errorId : null,
        this.helpText || this._hasHelpTextSlot ? this._helpTextId : null,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
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
          <span
            class=${classMap({
              field__prefix: true,
              'field__prefix--filled': this._hasPrefixSlot,
            })}
          >
            <slot name="prefix" @slotchange=${this._handlePrefixSlotChange}></slot>
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
            ?readonly=${this.readonly}
            name=${ifDefined(this.name || undefined)}
            minlength=${ifDefined(this.minlength)}
            maxlength=${ifDefined(this.maxlength)}
            pattern=${ifDefined(this.pattern || undefined)}
            autocomplete=${ifDefined(this.autocomplete || undefined)}
            aria-label=${ifDefined(this.ariaLabel || undefined)}
            aria-labelledby=${ifDefined(
              this._hasLabelSlot ? `${this._inputId}-slotted-label` : undefined,
            )}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            @input=${this._handleInput}
            @change=${this._handleChange}
          />

          <span
            class=${classMap({
              field__suffix: true,
              'field__suffix--filled': this._hasSuffixSlot,
            })}
          >
            <slot name="suffix" @slotchange=${this._handleSuffixSlotChange}></slot>
          </span>
        </div>

        ${hasError
          ? html`
              <div part="error" class="field__error" id=${this._errorId} role="alert">
                <slot name="error" @slotchange=${this._handleErrorSlotChange}> ${this.error} </slot>
              </div>
            `
          : html`<slot name="error" @slotchange=${this._handleErrorSlotChange}></slot>`}
        ${(this.helpText || this._hasHelpTextSlot) && !hasError
          ? html`
              <div part="help-text" class="field__help-text" id=${this._helpTextId}>
                <slot name="help-text" @slotchange=${this._handleHelpTextSlotChange}>
                  ${this.helpText}
                </slot>
              </div>
            `
          : html`<slot name="help-text" @slotchange=${this._handleHelpTextSlotChange}></slot>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-text-input': HelixTextInput;
  }
}

/** Primary type alias for hx-text-input */
export type HxTextInput = HelixTextInput;

/** @deprecated Use HxTextInput instead */
export type WcTextInput = HelixTextInput;
