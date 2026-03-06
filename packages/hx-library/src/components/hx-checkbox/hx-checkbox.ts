import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixCheckboxStyles } from './hx-checkbox.styles.js';

/**
 * A checkbox component with label, validation, and form association.
 *
 * @summary Form-associated checkbox with built-in label, error, and help text.
 *
 * @tag hx-checkbox
 *
 * @slot - Custom label content (overrides the label property). Rich HTML allowed — Drupal can include links in consent labels.
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{checked: boolean, value: string}>} hx-change - Dispatched when the checkbox is toggled.
 *
 * @csspart checkbox - The visual checkbox element.
 * @csspart label - The label element.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 * @csspart control - The wrapper around checkbox and label.
 *
 * @cssprop [--hx-checkbox-size=var(--hx-size-5, 1.25rem)] - Checkbox dimensions.
 * @cssprop [--hx-checkbox-border-color=var(--hx-color-neutral-300, #ced4da)] - Checkbox border color.
 * @cssprop [--hx-checkbox-border-radius=var(--hx-border-radius-sm, 0.25rem)] - Checkbox border radius.
 * @cssprop [--hx-checkbox-checked-bg=var(--hx-color-primary-500, #2563EB)] - Checked background color.
 * @cssprop [--hx-checkbox-checked-border-color=var(--hx-color-primary-500, #2563EB)] - Checked border color.
 * @cssprop [--hx-checkbox-checkmark-color=var(--hx-color-neutral-0, #ffffff)] - Checkmark color.
 * @cssprop [--hx-checkbox-focus-ring-color=var(--hx-focus-ring-color, #2563EB)] - Focus ring color.
 * @cssprop [--hx-checkbox-label-color=var(--hx-color-neutral-700, #343a40)] - Label text color.
 * @cssprop [--hx-checkbox-error-color=var(--hx-color-error-500, #dc3545)] - Error state color.
 */
@customElement('hx-checkbox')
export class HelixCheckbox extends LitElement {
  static override styles = [tokenStyles, helixCheckboxStyles];

  // ─── Form Association ───

  /** Enables form association via ElementInternals so the checkbox participates in `<form>` submission and validation. */
  static formAssociated = true;

  /** The ElementInternals instance used for form value, validity, and label association. @internal */
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * Whether the checkbox is checked.
   * @attr checked
   */
  @property({ type: Boolean, reflect: true })
  checked = false;

  /**
   * Whether the checkbox is in an indeterminate state (e.g., for "select all" patterns).
   * @attr indeterminate
   */
  @property({ type: Boolean })
  indeterminate = false;

  /**
   * Whether the checkbox is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the checkbox is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * The name of the checkbox, used for form submission.
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * The value submitted when the checkbox is checked.
   * @attr value
   */
  @property({ type: String })
  value = 'on';

  /**
   * The visible label text for the checkbox.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Error message to display. When set, the checkbox enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the checkbox for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * The size of the checkbox.
   * @attr hx-size
   */
  @property({ type: String, attribute: 'hx-size', reflect: true })
  hxSize: 'sm' | 'md' | 'lg' = 'md';

  /** Reference to the hidden native `<input type="checkbox">` used for form semantics and focus delegation. @internal */
  @query('.checkbox__input')
  private _inputEl!: HTMLInputElement;

  /** Tracks whether the `error` slot has projected content, enabling error styling even without the `error` property. @internal */
  @state() private _hasErrorSlot = false;

  // ─── Slot Handlers ───

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Lifecycle ───

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('checked') || changedProperties.has('value')) {
      this._internals.setFormValue(this.checked ? this.value : null);
      this._updateValidity();
    }
    if (changedProperties.has('required')) {
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

  /** Checks whether the checkbox satisfies its constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Reports validity and shows the browser's constraint validation UI. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  private _updateValidity(): void {
    if (this.required && !this.checked) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'This field is required.',
        this._inputEl ?? undefined,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  /** Called by the form when it resets. */
  formResetCallback(): void {
    this.checked = false;
    this.indeterminate = false;
    this._internals.setFormValue(null);
  }

  /** Called when the form restores state (e.g., back/forward navigation). */
  formStateRestoreCallback(state: string): void {
    this.checked = state === this.value;
  }

  // ─── Event Handling ───

  private _handleChange(): void {
    if (this.disabled) return;

    this.indeterminate = false;
    this.checked = !this.checked;

    this._internals.setFormValue(this.checked ? this.value : null);
    this._updateValidity();

    /**
     * Dispatched when the checkbox is toggled.
     * @event hx-change
     */
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked, value: this.value },
      }),
    );
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      this._handleChange();
    }
  }

  // ─── Public Methods ───

  /** Moves focus to the checkbox input element. */
  override focus(options?: FocusOptions): void {
    this._inputEl?.focus(options);
  }

  // ─── Render ───

  /** Unique auto-generated ID for ARIA associations between the input, label, and descriptive elements. @internal */
  private _id = `hx-checkbox-${Math.random().toString(36).slice(2, 9)}`;
  /** ID for the help-text element, referenced by `aria-describedby`. @internal */
  private _helpTextId = `${this._id}-help`;
  /** ID for the error element, referenced by `aria-describedby`. @internal */
  private _errorId = `${this._id}-error`;
  /** ID for the label element, referenced by `aria-labelledby`. @internal */
  private _labelId = `${this._id}-label`;

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;

    const containerClasses = {
      checkbox: true,
      'checkbox--checked': this.checked,
      'checkbox--indeterminate': this.indeterminate,
      'checkbox--error': hasError,
      'checkbox--disabled': this.disabled,
      'checkbox--required': this.required,
      'checkbox--sm': this.hxSize === 'sm',
      'checkbox--md': this.hxSize === 'md',
      'checkbox--lg': this.hxSize === 'lg',
    };

    const describedBy =
      [
        hasError || this._hasErrorSlot ? this._errorId : null,
        this.helpText && !hasError ? this._helpTextId : null,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    return html`
      <div class=${classMap(containerClasses)}>
        <label part="control" class="checkbox__control" @click=${this._handleChange}>
          <input
            class="checkbox__input"
            type="checkbox"
            id=${this._id}
            .checked=${live(this.checked)}
            .indeterminate=${live(this.indeterminate)}
            ?disabled=${this.disabled}
            ?required=${this.required}
            name=${ifDefined(this.name || undefined)}
            .value=${this.value}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            aria-labelledby=${this._labelId}
            tabindex="0"
            @keydown=${this._handleKeyDown}
            @click=${(e: Event) => e.preventDefault()}
            @change=${(e: Event) => e.stopPropagation()}
          />

          <span part="checkbox" class="checkbox__box">
            <svg
              class="checkbox__icon checkbox__icon--check"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <polyline points="3.5 8 6.5 11 12.5 5"></polyline>
            </svg>
            <svg
              class="checkbox__icon checkbox__icon--indeterminate"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <line x1="4" y1="8" x2="12" y2="8"></line>
            </svg>
          </span>

          <span part="label" class="checkbox__label" id=${this._labelId}>
            <slot>${this.label}</slot>
            ${this.required
              ? html`<span class="checkbox__required-marker" aria-hidden="true">*</span>`
              : nothing}
          </span>
        </label>

        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${hasError
            ? html`<div
                part="error"
                class="checkbox__error"
                id=${this._errorId}
                role="alert"
                aria-live="polite"
              >
                ${this.error}
              </div>`
            : nothing}
        </slot>

        ${this.helpText && !hasError
          ? html`
              <div part="help-text" class="checkbox__help-text" id=${this._helpTextId}>
                <slot name="help-text">${this.helpText}</slot>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

/** @deprecated Use HelixCheckbox instead. */
export type WcCheckbox = HelixCheckbox;

declare global {
  interface HTMLElementTagNameMap {
    'hx-checkbox': HelixCheckbox;
  }
}
