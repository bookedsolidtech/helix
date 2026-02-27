import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixSelectStyles } from './hx-select.styles.js';

/**
 * A select component that wraps a native `<select>` element with the
 * library's form field pattern (label, error, help text).
 *
 * Options are provided via slotted `<option>` elements in the light DOM.
 * The component observes slotted options via `slotchange` and clones them
 * into the shadow DOM `<select>` for rendering.
 *
 * @summary Form-associated select with built-in label, error, and help text.
 *
 * @tag hx-select
 *
 * @slot - Default slot for `<option>` elements. These are cloned into the native select.
 * @slot label - Custom label content (overrides the label property).
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when the selected option changes.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart select-wrapper - The wrapper around the select (for custom chevron).
 * @csspart select - The native select element.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 *
 * @cssprop [--hx-select-bg=var(--hx-color-neutral-0)] - Select background color.
 * @cssprop [--hx-select-color=var(--hx-color-neutral-800)] - Select text color.
 * @cssprop [--hx-select-border-color=var(--hx-color-neutral-300)] - Select border color.
 * @cssprop [--hx-select-border-radius=var(--hx-border-radius-md)] - Select border radius.
 * @cssprop [--hx-select-font-family=var(--hx-font-family-sans)] - Select font family.
 * @cssprop [--hx-select-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-select-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-select-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-select-chevron-color=var(--hx-color-neutral-500)] - Chevron indicator color.
 */
@customElement('hx-select')
export class HelixSelect extends LitElement {
  static override styles = [tokenStyles, helixSelectStyles];

  // ─── Form Association ───

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * The visible label text for the select.
   * @attr label
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * Placeholder option text shown as the first disabled option.
   * @attr placeholder
   * @default ''
   */
  @property({ type: String })
  placeholder = '';

  /**
   * The current value of the select.
   * @attr value
   * @default ''
   */
  @property({ type: String, reflect: true })
  value = '';

  /**
   * Whether the select is required for form submission.
   * @attr required
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the select is disabled.
   * @attr disabled
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * The name of the select, used for form submission.
   * @attr name
   * @default ''
   */
  @property({ type: String })
  name = '';

  /**
   * Error message to display. When set, the select enters an error state.
   * @attr error
   * @default ''
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the select for guidance.
   * @attr help-text
   * @default ''
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Size variant of the select.
   * @attr hx-size
   * @default 'md'
   */
  @property({ type: String, attribute: 'hx-size', reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Accessible name for screen readers, if different from the visible label.
   * @attr aria-label
   * @default null
   */
  @property({ type: String, attribute: 'aria-label' })
  override ariaLabel: string | null = null;

  // ─── Internal References ───

  @query('.field__select')
  private _select!: HTMLSelectElement;

  @state() private _hasLabelSlot = false;
  @state() private _hasErrorSlot = false;

  // ─── Slot Handlers ───

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Lifecycle ───

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();
      // Sync the native select's value after cloned options are in place
      if (this._select && this._select.value !== this.value) {
        this._select.value = this.value;
      }
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

  /** Checks whether the select satisfies its constraints. */
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
        this.error || 'Please select an option.',
        this._select,
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

  // ─── Option Syncing ───

  private _handleSlotChange(): void {
    this._syncOptions();
  }

  private _syncOptions(): void {
    if (!this._select) return;

    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (!slot) return;

    const slottedOptions = slot
      .assignedElements({ flatten: true })
      .filter((el): el is HTMLOptionElement => el instanceof HTMLOptionElement);

    // Remove previously cloned options (keep placeholder if present)
    const existingCloned = this._select.querySelectorAll('option[data-cloned]');
    existingCloned.forEach((opt) => opt.remove());

    // Clone slotted options into the native select
    slottedOptions.forEach((option) => {
      const clone = option.cloneNode(true) as HTMLOptionElement;
      clone.setAttribute('data-cloned', '');
      this._select.appendChild(clone);
    });

    // Sync value after cloning options
    if (this.value) {
      this._select.value = this.value;
    } else if (!this.placeholder && slottedOptions.length > 0) {
      // If no placeholder and no value set, sync to whatever the select defaults to
      this.value = this._select.value;
      this._internals.setFormValue(this.value);
    }
  }

  // ─── Event Handling ───

  private _handleChange(e: Event): void {
    const target = e.target as HTMLSelectElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);
    this._updateValidity();

    /**
     * Dispatched when the selected option changes.
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

  /** Moves focus to the select element. */
  override focus(options?: FocusOptions): void {
    this._select?.focus(options);
  }

  // ─── Render ───

  private _selectId = `hx-select-${Math.random().toString(36).slice(2, 9)}`;
  private _helpTextId = `${this._selectId}-help`;
  private _errorId = `${this._selectId}-error`;

  override render() {
    const hasError = !!this.error;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
    };

    const selectClasses = {
      field__select: true,
      [`field__select--${this.size}`]: true,
    };

    const describedBy =
      [
        hasError || this._hasErrorSlot ? this._errorId : null,
        this.helpText ? this._helpTextId : null,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <slot name="label" @slotchange=${this._handleLabelSlotChange}>
          ${this.label
            ? html`<label part="label" class="field__label" for=${this._selectId}>
                ${this.label}
                ${this.required
                  ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
                  : nothing}
              </label>`
            : nothing}
        </slot>

        <div part="select-wrapper" class="field__select-wrapper">
          <select
            part="select"
            class=${classMap(selectClasses)}
            id=${this._selectId}
            ?required=${this.required}
            ?disabled=${this.disabled}
            name=${ifDefined(this.name || undefined)}
            aria-label=${ifDefined(this.ariaLabel ?? undefined)}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            aria-required=${this.required ? 'true' : nothing}
            @change=${this._handleChange}
          >
            ${this.placeholder
              ? html`<option value="" disabled selected>${this.placeholder}</option>`
              : nothing}
          </select>

          <span class="field__chevron" aria-hidden="true">
            <svg
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </div>

        <slot @slotchange=${this._handleSlotChange} style="display: none;"></slot>

        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${hasError
            ? html`<div
                part="error"
                class="field__error"
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
    'hx-select': HelixSelect;
  }
}
