import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@wc-2026/tokens/lit';
import { wcRadioGroupStyles } from './wc-radio-group.styles.js';
import type { WcRadio } from './wc-radio.js';

/**
 * A form-associated radio group that manages a set of `<wc-radio>` children.
 *
 * @summary Form-associated radio group with label, validation, help text, and keyboard navigation.
 *
 * @tag wc-radio-group
 *
 * @slot - `<wc-radio>` elements.
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{value: string}>} wc-change - Dispatched when the selected radio changes.
 *
 * @csspart fieldset - The fieldset wrapper.
 * @csspart legend - The legend/label.
 * @csspart group - The container for radio items.
 * @csspart error - The error message.
 * @csspart help-text - The help text.
 *
 * @cssprop [--wc-radio-group-gap=var(--wc-space-3, 0.75rem)] - Gap between radio items.
 * @cssprop [--wc-radio-group-label-color=var(--wc-color-neutral-700, #343a40)] - Label text color.
 * @cssprop [--wc-radio-group-error-color=var(--wc-color-error-500, #dc3545)] - Error message color.
 */
@customElement('wc-radio-group')
export class WcRadioGroup extends LitElement {
  static override styles = [tokenStyles, wcRadioGroupStyles];

  // ─── Form Association ───

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * The selected radio's value.
   * @attr value
   */
  @property({ type: String })
  value = '';

  /**
   * The name used for form submission.
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * The fieldset legend/label text.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Whether a selection is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the entire group is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Error message to display. When set, the group enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the group for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Layout orientation of the radio items.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  orientation: 'vertical' | 'horizontal' = 'vertical';

  @query('.fieldset__group')
  private _groupEl!: HTMLElement;

  @state() private _hasErrorSlot = false;

  // ─── Internal IDs ───

  private _groupId = `wc-radio-group-${Math.random().toString(36).slice(2, 9)}`;
  private _helpTextId = `${this._groupId}-help`;
  private _errorId = `${this._groupId}-error`;

  // ─── Slot Handlers ───

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('wc-radio-select', this._handleRadioSelect as EventListener);
    this.addEventListener('keydown', this._handleKeydown);
    this.setAttribute('role', 'radiogroup');
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('wc-radio-select', this._handleRadioSelect as EventListener);
    this.removeEventListener('keydown', this._handleKeydown);
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value || null);
      this._syncRadios();
      this._updateValidity();
    }
    if (changedProperties.has('disabled')) {
      this._syncRadios();
    }
    if (changedProperties.has('label')) {
      if (this.label) {
        this.setAttribute('aria-label', this.label);
      }
    }
  }

  override firstUpdated(): void {
    this._syncRadios();
  }

  // ─── Radio Management ───

  private _getRadios(): WcRadio[] {
    return Array.from(this.querySelectorAll('wc-radio')) as WcRadio[];
  }

  private _getEnabledRadios(): WcRadio[] {
    return this._getRadios().filter((radio) => !radio.disabled && !this.disabled);
  }

  private _syncRadios(): void {
    const radios = this._getRadios();
    const enabledRadios = this._getEnabledRadios();

    radios.forEach((radio) => {
      const isChecked = radio.value === this.value && this.value !== '';
      radio.checked = isChecked;

      if (this.disabled) {
        radio.disabled = true;
      }
    });

    // Roving tabindex management
    const checkedRadio = enabledRadios.find((r) => r.checked);
    radios.forEach((radio) => {
      radio.tabIndex = -1;
    });

    if (checkedRadio) {
      checkedRadio.tabIndex = 0;
    } else if (enabledRadios.length > 0) {
      enabledRadios[0].tabIndex = 0;
    }
  }

  // ─── Event Handling ───

  private _handleRadioSelect = (e: CustomEvent<{ value: string }>): void => {
    e.stopPropagation();

    const newValue = e.detail.value;
    if (newValue === this.value) {
      return;
    }

    this.value = newValue;
    this._internals.setFormValue(this.value);
    this._syncRadios();
    this._updateValidity();

    /**
     * Dispatched when the selected radio changes.
     * @event wc-change
     */
    this.dispatchEvent(
      new CustomEvent('wc-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      })
    );
  };

  private _handleKeydown = (e: KeyboardEvent): void => {
    const enabledRadios = this._getEnabledRadios();
    if (enabledRadios.length === 0) {
      return;
    }

    const isNavigationKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
    if (!isNavigationKey) {
      return;
    }

    e.preventDefault();

    const currentIndex = enabledRadios.findIndex(
      (radio) => radio === (e.target as Element)?.closest?.('wc-radio') || radio.checked
    );

    let nextIndex: number;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % enabledRadios.length;
    } else {
      nextIndex = currentIndex <= 0 ? enabledRadios.length - 1 : currentIndex - 1;
    }

    const nextRadio = enabledRadios[nextIndex];
    nextRadio.focus();
    nextRadio.dispatchEvent(
      new CustomEvent('wc-radio-select', {
        bubbles: true,
        composed: true,
        detail: { value: nextRadio.value },
      })
    );
  };

  private _handleSlotChange(): void {
    this._syncRadios();
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

  /** Checks whether the group satisfies its constraints. */
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
        this._groupEl ?? undefined
      );
    } else {
      this._internals.setValidity({});
    }
  }

  /** Called by the form when it resets. */
  formResetCallback(): void {
    this.value = '';
    this._internals.setFormValue(null);
    this._syncRadios();
  }

  /** Called when the form restores state (e.g., back/forward navigation). */
  formStateRestoreCallback(state: string): void {
    this.value = state;
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error;

    const fieldsetClasses = {
      fieldset: true,
      'fieldset--error': hasError,
      'fieldset--disabled': this.disabled,
      'fieldset--required': this.required,
    };

    return html`
      <fieldset part="fieldset" class=${classMap(fieldsetClasses)}>
        ${this.label
          ? html`
              <legend part="legend" class="fieldset__legend">
                ${this.label}
                ${this.required
                  ? html`<span class="fieldset__required-marker" aria-hidden="true">*</span>`
                  : nothing}
              </legend>
            `
          : nothing}

        <div part="group" class="fieldset__group" role="none">
          <slot @slotchange=${this._handleSlotChange}></slot>
        </div>

        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${hasError
            ? html`<div part="error" class="fieldset__error" id=${this._errorId} role="alert" aria-live="polite">
                ${this.error}
              </div>`
            : nothing}
        </slot>

        ${this.helpText && !hasError
          ? html`
              <div part="help-text" class="fieldset__help-text" id=${this._helpTextId}>
                <slot name="help-text">${this.helpText}</slot>
              </div>
            `
          : nothing}
      </fieldset>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wc-radio-group': WcRadioGroup;
  }
}
