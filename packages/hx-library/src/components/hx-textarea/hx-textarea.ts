import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { helixTextareaStyles } from './hx-textarea.styles.js';

const _nextTextareaId = createIdCounter('hx-textarea');

/** Detail for hx-input and hx-change events dispatched by hx-textarea. */
export interface HxTextareaDetail {
  value: string;
}

/**
 * A multi-line text area component with label, validation, and form association.
 *
 * Uses `aria-invalid` to convey error state and `aria-describedby` to link
 * error/help text to the textarea. Label association is handled through
 * `aria-labelledby` (for slotted labels) or the standard `<label for>` pattern.
 * Supports `aria-label` for cases where a visible label is not present.
 * Validation errors are announced via `role="alert"` (assertive live region).
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
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-error-text] - Color.
 * @cssprop [--hx-font-weight-bold] - Font weight.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-opacity] - CSS custom property.
 * @cssprop [--hx-color-error-500] - Color.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-color-neutral-800] - Color.
 * @cssprop [--hx-size-20] - Size token.
 * @cssprop [--hx-color-neutral-400] - Color.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-color-neutral-500] - Color.
 */
@customElement('hx-textarea')
export class HelixTextarea extends FormMixin(HelixElement) {
  static override styles = [helixTextareaStyles];

  // ─── Form Association ───

  /** @internal */
  static override formAssociated = true;

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
  @property({ type: String, reflect: true })
  name = '';

  /**
   * The number of visible text rows. Must be a positive integer (minimum 1).
   * Invalid values are clamped to the nearest valid value.
   * @attr rows
   */
  @property({ type: Number })
  rows = 4;

  /**
   * Minimum number of characters required.
   * @attr minlength
   */
  @property({ type: Number, attribute: 'minlength' })
  minlength: number | undefined;

  /**
   * Maximum number of characters allowed.
   * @attr maxlength
   */
  @property({ type: Number, attribute: 'maxlength' })
  maxlength: number | undefined;

  /**
   * Whether the textarea is read-only. Read-only fields are visible but
   * cannot be edited by the user. Common in healthcare for displaying
   * non-editable patient data inline with editable fields.
   * @attr readonly
   */
  @property({ type: Boolean, reflect: true })
  readonly = false;

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
   * Validation message shown when the field is required but empty.
   * @attr required-message
   */
  @property({ attribute: 'required-message' })
  requiredMessage = 'This field is required.';

  /**
   * Accessible name for screen readers, if different from the visible label.
   * Uses `accessible-label` attribute instead of `aria-label` to avoid
   * ARIAMixin shadowing on the host element.
   *
   * Note: `mixinDelegatesAria` is not applied to this component because form
   * inputs with associated labels delegate accessible naming via `<label>`
   * association and `aria-labelledby`, not host-level ARIA delegation. The
   * `accessible-label` attribute is a fallback for label-free usage. The value is forwarded to the
   * internal native textarea's `aria-label`.
   * @attr accessible-label
   */
  @property({ type: String, attribute: 'accessible-label' })
  accessibleLabel: string | null = null;

  // ─── Internal References ───

  /** @internal */
  @query('.field__textarea')
  private _textarea: HTMLTextAreaElement | undefined;

  // ─── Slot Tracking ───

  /** @internal */
  @state() private _hasLabelSlot = false;
  /** @internal */
  @state() private _hasErrorSlot = false;
  /** @internal */
  @state() private _hasHelpTextSlot = false;

  // ─── Live Announcement ───

  /**
   * Debounced announcement text for the hidden polite live region.
   * Only populated when the user is approaching the character limit.
   * @internal
   */
  @state() private _liveAnnouncement = '';

  /** Timer handle for the debounced character-count announcement. @internal */
  private _announceTimer: ReturnType<typeof setTimeout> | null = null;

  /** @internal */
  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedElements().length > 0;
    if (this._hasLabelSlot) {
      const slottedLabel = slot.assignedElements()[0];
      if (slottedLabel && !slottedLabel.id) {
        slottedLabel.id = `${this._textareaId}-slotted-label`;
      }
    }
  }

  /** @internal */
  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedElements().length > 0;
  }

  /** @internal */
  private _handleHelpTextSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHelpTextSlot = slot.assignedElements().length > 0;
  }

  // ─── Lifecycle ───

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._announceTimer !== null) {
      clearTimeout(this._announceTimer);
      this._announceTimer = null;
    }
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('rows')) {
      const clamped = Math.max(1, Math.round(this.rows));
      if (clamped !== this.rows) {
        this.rows = clamped;
      }
    }
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
    }
    // Auto-grow: respond to programmatic value changes
    if (changedProperties.has('value') && this.resize === 'auto' && this._textarea) {
      this._textarea.style.height = 'auto';
      this._textarea.style.height = `${this._textarea.scrollHeight}px`;
    }
  }

  // ─── Form Integration ───

  /** @internal */
  override _updateValidity(): void {
    const anchor = this._textarea ?? undefined;
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || this.requiredMessage,
        anchor,
      );
    } else if (
      this.minlength !== undefined &&
      this.value.length > 0 &&
      this.value.length < this.minlength
    ) {
      this._internals.setValidity(
        { tooShort: true },
        this.error || `Value must be at least ${this.minlength} characters.`,
        anchor,
      );
    } else if (this.maxlength !== undefined && this.value.length > this.maxlength) {
      this._internals.setValidity(
        { tooLong: true },
        this.error || `Value must be ${this.maxlength} characters or fewer.`,
        anchor,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  /** @internal */
  protected override _onFormReset(): void {
    this.value = '';
    this._internals.setFormValue('');
    this._resetInteractionState();
  }

  /** @internal */
  protected override _onFormStateRestore(
    state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  /** @internal */
  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ─── Event Handling ───

  /** @internal */
  private _handleInput(e: Event): void {
    const target = e.target as HTMLTextAreaElement;
    this.value = target.value;
    this._handleInteractionInput();
    // Note: setFormValue is called in updated() via the value change — no double-call here (P1-06 fix)

    // Auto-grow: reset height then set to scrollHeight
    if (this.resize === 'auto') {
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }

    // Debounced character-count announcement (WCAG 4.1.3):
    // Only announce when near/at the maxlength limit; suppress every-keystroke noise.
    if (this._announceTimer !== null) {
      clearTimeout(this._announceTimer);
    }
    this._announceTimer = setTimeout(() => {
      this._announceTimer = null;
      if (this.maxlength !== undefined && this.value.length >= this.maxlength * 0.8) {
        this._liveAnnouncement = `${this.value.length} of ${this.maxlength} characters`;
      } else {
        this._liveAnnouncement = '';
      }
    }, 1000);

    /**
     * Dispatched on every keystroke as the user types.
     * @event hx-input
     */
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  /** @internal */
  private _handleChange(e: Event): void {
    const target = e.target as HTMLTextAreaElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);
    this._handleInteractionBlur();

    /**
     * Dispatched when the textarea loses focus after its value changed.
     * @event hx-change
     */
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('hx-change', {
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

  /** @internal */
  private _textareaId = _nextTextareaId();
  /** @internal */
  private _helpTextId = `${this._textareaId}-help`;
  /** @internal */
  private _errorId = `${this._textareaId}-error`;
  /** @internal */
  private _counterId = `${this._textareaId}-counter`;

  /** @internal */
  private _renderCounter() {
    if (!this.showCount) return nothing;

    // Use Array.from() to count grapheme clusters (handles emoji correctly)
    const count = Array.from(this.value ?? '').length;
    const display = this.maxlength !== undefined ? `${count} / ${this.maxlength}` : `${count}`;

    // aria-live="polite" announces counter changes without interrupting the user.
    // The debounced _liveAnnouncement region provides additional context when nearing the limit.
    return html`
      <div part="counter" class="field__counter" id=${this._counterId} aria-hidden="true">
        ${display}
      </div>
    `;
  }

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
    };

    // P0-02 fix: help text container renders when slot is used OR property is set
    const hasHelpText = (!!this.helpText || this._hasHelpTextSlot) && !hasError;

    // Do NOT include the counter in aria-describedby: the counter element has
    // aria-hidden="true" (it is a visual-only display), and referencing an
    // aria-hidden element from aria-describedby is a WCAG conflict.
    // Screen reader users receive character-count announcements via the
    // debounced aria-live="polite" region (_liveAnnouncement) instead.
    const describedBy =
      [hasError ? this._errorId : null, hasHelpText ? this._helpTextId : null]
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
            ?readonly=${this.readonly}
            rows=${this.rows}
            minlength=${ifDefined(this.minlength)}
            maxlength=${ifDefined(this.maxlength)}
            name=${ifDefined(this.name || undefined)}
            aria-label=${ifDefined(this.accessibleLabel ?? undefined)}
            aria-labelledby=${ifDefined(
              this._hasLabelSlot ? `${this._textareaId}-slotted-label` : undefined,
            )}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            @input=${this._handleInput}
            @change=${this._handleChange}
          ></textarea>
        </div>

        ${this._renderCounter()}
        <div aria-live="polite" aria-atomic="true" class="sr-only">${this._liveAnnouncement}</div>
        ${hasError
          ? html`
              <div part="error" class="field__error" id=${this._errorId} role="alert">
                <slot name="error" @slotchange=${this._handleErrorSlotChange}>${this.error}</slot>
              </div>
            `
          : html`<slot name="error" @slotchange=${this._handleErrorSlotChange}></slot>`}
        ${hasHelpText
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

/**
 * Per-component event map for type-safe addEventListener on hx-textarea.
 * The `hx-change` detail is `{ value: string }` only — no `checked` property.
 */
export interface HxTextareaEventMap {
  'hx-input': CustomEvent<{ value: string }>;
  'hx-change': CustomEvent<{ value: string }>;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-textarea': HelixTextarea;
  }
  interface HTMLElementEventMap {
    'hx-input': CustomEvent<{ value: string }>;
  }
}

/** Canonical type alias for the hx-textarea component. */
export type HxTextarea = HelixTextarea;
