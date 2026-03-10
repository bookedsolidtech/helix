import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixNumberInputStyles } from './hx-number-input.styles.js';

// Module-level counter for stable, SSR-safe IDs (avoids Math.random() hydration mismatch)
let _hxNumberInputIdCounter = 0;

/**
 * A numeric input component with stepper controls, label, validation, and
 * full form association. Designed for healthcare data-entry contexts where
 * precise numeric values (dosage, age, measurements) must be captured safely.
 *
 * @summary Form-associated numeric input with stepper buttons, bounds checking,
 *   label, error, and help text.
 *
 * @tag hx-number-input
 *
 * @slot label - Custom label content (overrides the label property). Use for Drupal Form API rendered labels.
 * @slot help-text - Custom help text content (overrides the helpText property).
 * @slot error - Custom error content (overrides the error property). Use for Drupal Form API rendered errors.
 * @slot prefix - Content rendered before the input (e.g., a unit icon).
 * @slot suffix - Content rendered after the input and before the stepper buttons (e.g., a unit label).
 *
 * @fires {CustomEvent<{value: number | null}>} hx-input - Dispatched on every keystroke as the user types.
 * @fires {CustomEvent<{value: number | null}>} hx-change - Dispatched when the input loses focus after its value changed.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart input-wrapper - The wrapper around prefix, input, suffix, and stepper.
 * @csspart input - The native input element.
 * @csspart help-text - The help text container.
 * @csspart error-message - The error message container.
 * @csspart stepper - The stepper button group container.
 * @csspart increment - The increment (+) button.
 * @csspart decrement - The decrement (-) button.
 *
 * @cssprop [--hx-number-input-bg=var(--hx-color-neutral-0)] - Input background color.
 * @cssprop [--hx-number-input-color=var(--hx-color-neutral-800)] - Input text color.
 * @cssprop [--hx-number-input-border-color=var(--hx-color-neutral-300)] - Input border color.
 * @cssprop [--hx-number-input-border-radius=var(--hx-border-radius-md)] - Input border radius.
 * @cssprop [--hx-number-input-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-number-input-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-number-input-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-number-input-font-family=var(--hx-font-family-sans)] - Font family.
 */
@customElement('hx-number-input')
export class HelixNumberInput extends LitElement {
  static override styles = [tokenStyles, helixNumberInputStyles];

  // ─── Form Association ───

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * The name of the input, used for form submission.
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * The current numeric value of the input. Null when the field is empty.
   * @attr value
   */
  @property({
    type: Number,
    converter: {
      fromAttribute: (attr: string | null): number | null => {
        if (attr === null || attr === '') return null;
        const n = Number(attr);
        return isNaN(n) ? null : n;
      },
      toAttribute: (val: number | null): string | null => (val === null ? null : String(val)),
    },
  })
  value: number | null = null;

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
   * Whether the input is read-only.
   * @attr readonly
   */
  @property({ type: Boolean, reflect: true })
  readonly = false;

  /**
   * Minimum allowed value. When reached, the decrement button is disabled.
   * @attr min
   */
  @property({ type: Number })
  min: number | undefined = undefined;

  /**
   * Maximum allowed value. When reached, the increment button is disabled.
   * @attr max
   */
  @property({ type: Number })
  max: number | undefined = undefined;

  /**
   * The amount to increment or decrement on each step action.
   * @attr step
   */
  @property({ type: Number })
  step = 1;

  /**
   * The visible label text for the input.
   * @attr label
   */
  @property({ type: String })
  label = '';

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
   * Size variant controlling input padding and font size.
   * @attr hx-size
   */
  @property({ type: String, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * When set, hides the +/- stepper buttons.
   * @attr no-stepper
   */
  @property({ type: Boolean, attribute: 'no-stepper' })
  noStepper = false;

  // ─── Internal References ───

  @query('.field__input')
  private _input!: HTMLInputElement;

  // ─── Internal State ───

  @state() private _hasLabelSlot = false;
  @state() private _hasErrorSlot = false;
  @state() private _hasHelpSlot = false;

  /** The value captured at first render, used by formResetCallback. */
  private _defaultValue: number | null = null;

  /** Timer ID for the long-press initial delay. */
  private _longPressTimer: ReturnType<typeof setTimeout> | null = null;

  /** Interval ID for the long-press rapid-repeat phase. */
  private _repeatInterval: ReturnType<typeof setInterval> | null = null;

  // ─── Stable IDs ───

  private readonly _inputId = `hx-number-input-${++_hxNumberInputIdCounter}`;
  private readonly _helpTextId = `${this._inputId}-help`;
  private readonly _errorId = `${this._inputId}-error`;

  // ─── Slot Tracking ───

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedElements().length > 0;
    if (this._hasLabelSlot) {
      const slottedLabel = slot.assignedElements()[0];
      if (slottedLabel && !slottedLabel.id) {
        slottedLabel.id = `${this._inputId}-slotted-label`;
      }
    }
  }

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements();
    this._hasErrorSlot = assigned.length > 0;
    if (this._hasErrorSlot && assigned[0]) {
      if (!assigned[0].id) assigned[0].id = this._errorId;
    }
  }

  private _handleHelpSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHelpSlot = slot.assignedElements().length > 0;
  }

  // ─── Lifecycle ───

  override firstUpdated(): void {
    this._defaultValue = this.value;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearLongPress();
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (
      changedProperties.has('value') ||
      changedProperties.has('required') ||
      changedProperties.has('min') ||
      changedProperties.has('max') ||
      changedProperties.has('step')
    ) {
      this._syncFormValue();
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

  private _syncFormValue(): void {
    this._internals.setFormValue(this.value !== null ? String(this.value) : null);
  }

  private _updateValidity(): void {
    if (this.required && this.value === null) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'This field is required.',
        this._input ?? undefined,
      );
      return;
    }

    if (this.value !== null && this.min !== undefined && this.value < this.min) {
      this._internals.setValidity(
        { rangeUnderflow: true },
        `Value must be at least ${this.min}.`,
        this._input ?? undefined,
      );
      return;
    }

    if (this.value !== null && this.max !== undefined && this.value > this.max) {
      this._internals.setValidity(
        { rangeOverflow: true },
        `Value must be at most ${this.max}.`,
        this._input ?? undefined,
      );
      return;
    }

    if (this.value !== null && this.step && this.step !== 0) {
      const step = this._finite(this.step) ?? 1;
      const base = this._finite(this.min) ?? 0;
      const remainder = Math.abs((this.value - base) % step);
      const epsilon = 1e-9;
      if (remainder > epsilon && Math.abs(remainder - step) > epsilon) {
        this._internals.setValidity(
          { stepMismatch: true },
          `Value must be a multiple of ${step}.`,
          this._input ?? undefined,
        );
        return;
      }
    }

    this._internals.setValidity({});
  }

  /** Called by the form when it resets. */
  formResetCallback(): void {
    this.value = this._defaultValue;
    this._internals.setFormValue(this.value !== null ? String(this.value) : null);
  }

  /** Called when the form restores state (e.g., back/forward navigation). */
  formStateRestoreCallback(state: string): void {
    const parsed = Number(state);
    this.value = isNaN(parsed) ? null : parsed;
  }

  // ─── Value Parsing ───

  private _finite(value: number | undefined): number | undefined {
    return Number.isFinite(value) ? value : undefined;
  }

  private _parseInput(raw: string): number | null {
    if (raw === '' || raw === null) return null;
    const parsed = parseFloat(raw);
    return isNaN(parsed) ? null : parsed;
  }

  private _clamp(v: number): number {
    let result = v;
    const min = this._finite(this.min);
    const max = this._finite(this.max);
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    return result;
  }

  // ─── Stepper Helpers ───

  private get _atMin(): boolean {
    return this.value !== null && this.min !== undefined && this.value <= this.min;
  }

  private get _atMax(): boolean {
    return this.value !== null && this.max !== undefined && this.value >= this.max;
  }

  private _applyStep(delta: number): void {
    if (this.disabled || this.readonly) return;

    const current = this.value ?? 0;
    const step = this._finite(this.step) ?? 1;
    const next = this._clamp(parseFloat((current + delta * step).toFixed(10)));

    if (next === this.value) return;
    this.value = next;

    this.dispatchEvent(
      new CustomEvent<{ value: number | null }>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  // ─── Long-press ───

  private _clearLongPress(): void {
    if (this._longPressTimer !== null) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
    if (this._repeatInterval !== null) {
      clearInterval(this._repeatInterval);
      this._repeatInterval = null;
    }
  }

  private _startLongPress(delta: number): void {
    this._applyStep(delta);
    this._longPressTimer = setTimeout(() => {
      this._repeatInterval = setInterval(() => {
        this._applyStep(delta);
      }, 100);
    }, 400);
  }

  private _handleStepperPointerDown(e: PointerEvent, delta: number): void {
    if (this.disabled || this.readonly) return;
    e.preventDefault();
    this._startLongPress(delta);
  }

  private _handleStepperPointerUp(): void {
    this._clearLongPress();
  }

  // ─── Keyboard ───

  private _handleKeyDown(e: KeyboardEvent): void {
    if (this.disabled || this.readonly) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._applyStep(1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._applyStep(-1);
    }
  }

  // ─── Input Events ───

  private _handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.value = this._parseInput(target.value);
    this._syncFormValue();

    this.dispatchEvent(
      new CustomEvent<{ value: number | null }>('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private _handleChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    const parsed = this._parseInput(target.value);
    this.value = parsed !== null ? this._clamp(parsed) : null;
    this._syncFormValue();
    this._updateValidity();

    this.dispatchEvent(
      new CustomEvent<{ value: number | null }>('hx-change', {
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

  // ─── Render Helpers ───

  private _renderIncrementIcon() {
    return html`<svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>`;
  }

  private _renderDecrementIcon() {
    return html`<svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>`;
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
      'field--sm': this.size === 'sm',
      'field--md': this.size === 'md',
      'field--lg': this.size === 'lg',
    };

    const describedBy =
      [
        hasError ? this._errorId : null,
        !hasError && (this.helpText || this._hasHelpSlot) ? this._helpTextId : null,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    const displayValue = this.value !== null ? String(this.value) : '';

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
          <span class="field__prefix">
            <slot name="prefix"></slot>
          </span>

          <input
            part="input"
            class="field__input"
            id=${this._inputId}
            type="number"
            .value=${live(displayValue)}
            min=${ifDefined(this.min)}
            max=${ifDefined(this.max)}
            step=${this.step}
            ?required=${this.required}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            name=${ifDefined(this.name || undefined)}
            aria-labelledby=${ifDefined(
              this._hasLabelSlot ? `${this._inputId}-slotted-label` : undefined,
            )}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            aria-valuenow=${ifDefined(this.value !== null ? this.value : undefined)}
            aria-valuemin=${ifDefined(this.min)}
            aria-valuemax=${ifDefined(this.max)}
            @input=${this._handleInput}
            @change=${this._handleChange}
            @keydown=${this._handleKeyDown}
          />

          <span class="field__suffix">
            <slot name="suffix"></slot>
          </span>

          ${this.noStepper
            ? nothing
            : html`
                <div part="stepper" class="field__stepper">
                  <button
                    part="increment"
                    class="field__stepper-btn"
                    type="button"
                    aria-label="Increment"
                    ?disabled=${this.disabled || this.readonly || this._atMax}
                    tabindex="-1"
                    @pointerdown=${(e: PointerEvent) => this._handleStepperPointerDown(e, 1)}
                    @pointerup=${this._handleStepperPointerUp}
                    @pointerleave=${this._handleStepperPointerUp}
                    @pointercancel=${this._handleStepperPointerUp}
                  >
                    ${this._renderIncrementIcon()}
                  </button>
                  <button
                    part="decrement"
                    class="field__stepper-btn"
                    type="button"
                    aria-label="Decrement"
                    ?disabled=${this.disabled || this.readonly || this._atMin}
                    tabindex="-1"
                    @pointerdown=${(e: PointerEvent) => this._handleStepperPointerDown(e, -1)}
                    @pointerup=${this._handleStepperPointerUp}
                    @pointerleave=${this._handleStepperPointerUp}
                    @pointercancel=${this._handleStepperPointerUp}
                  >
                    ${this._renderDecrementIcon()}
                  </button>
                </div>
              `}
        </div>

        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${this.error
            ? html`
                <div part="error-message" class="field__error" id=${this._errorId} role="alert">
                  ${this.error}
                </div>
              `
            : nothing}
        </slot>

        <div
          part="help-text"
          class="field__help-text"
          id=${this._helpTextId}
          ?hidden=${hasError || (!this.helpText && !this._hasHelpSlot)}
        >
          <slot name="help-text" @slotchange=${this._handleHelpSlotChange}>${this.helpText}</slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-number-input': HelixNumberInput;
  }
}
