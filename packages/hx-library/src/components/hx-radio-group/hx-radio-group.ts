import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixRadioGroupStyles } from './hx-radio-group.styles.js';
import type { HelixRadio } from './hx-radio.js';

let _groupCounter = 0;

/**
 * A form-associated radio group that manages a set of `<hx-radio>` children.
 *
 * @summary Form-associated radio group with label, validation, help text, and keyboard navigation.
 *
 * @tag hx-radio-group
 *
 * @slot - `<hx-radio>` elements.
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{value: string, checked: boolean}>} hx-change - Dispatched when the selected radio changes.
 *
 * @csspart fieldset - The fieldset wrapper.
 * @csspart legend - The legend/label.
 * @csspart group - The container for radio items.
 * @csspart error - The error message.
 * @csspart help-text - The help text.
 *
 * @cssprop [--hx-radio-group-gap=var(--hx-space-3, 0.75rem)] - Gap between radio items.
 * @cssprop [--hx-radio-group-label-color=var(--hx-color-neutral-700, #343a40)] - Label text color.
 * @cssprop [--hx-radio-group-error-color=var(--hx-color-error-500, #dc3545)] - Error message color.
 */
@customElement('hx-radio-group')
export class HelixRadioGroup extends LitElement {
  static override styles = [tokenStyles, helixRadioGroupStyles];

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

  private _groupId = `hx-radio-group-${++_groupCounter}`;
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
    this.addEventListener('hx-radio-select', this._handleRadioSelect as EventListener);
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-radio-select', this._handleRadioSelect as EventListener);
    this.removeEventListener('keydown', this._handleKeydown);
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value || null);
      this._syncRadios();
      this._updateValidity();
    }
    if (changedProperties.has('disabled')) {
      this._syncRadios();
    }
  }

  override firstUpdated(changedProperties: Map<string, unknown>): void {
    super.firstUpdated(changedProperties);
    this._syncRadios();
    this._updateValidity();
  }

  // ─── Radio Management ───

  private _cachedRadios: HelixRadio[] | null = null;
  private _individualDisabledStates = new WeakMap<HelixRadio, boolean>();

  private _getRadios(): HelixRadio[] {
    if (!this._cachedRadios) {
      this._cachedRadios = Array.from(this.querySelectorAll('hx-radio')) as HelixRadio[];
    }
    return this._cachedRadios;
  }

  private _getEnabledRadios(): HelixRadio[] {
    return this._getRadios().filter((radio) => !radio.disabled && !this.disabled);
  }

  private _syncRadios(): void {
    const radios = this._getRadios();
    const enabledRadios = this._getEnabledRadios();

    radios.forEach((radio) => {
      const isChecked = radio.value === this.value && this.value !== '';
      radio.checked = isChecked;

      if (this.disabled) {
        // Store individual disabled state before overriding with group disabled
        if (!this._individualDisabledStates.has(radio)) {
          this._individualDisabledStates.set(radio, radio.disabled);
        }
        radio.disabled = true;
      } else {
        // Restore individual disabled state when group is re-enabled
        const originalDisabled = this._individualDisabledStates.get(radio);
        if (originalDisabled !== undefined) {
          radio.disabled = originalDisabled;
          this._individualDisabledStates.delete(radio);
        }
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
      const firstRadio = enabledRadios[0];
      if (firstRadio) {
        firstRadio.tabIndex = 0;
      }
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
    // Reactive update in updated() will call setFormValue, _syncRadios, _updateValidity

    /**
     * Dispatched when the selected radio changes.
     * @event hx-change
     */
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value, checked: true },
      }),
    );
  };

  private _handleKeydown = (e: KeyboardEvent): void => {
    const enabledRadios = this._getEnabledRadios();
    if (enabledRadios.length === 0) {
      return;
    }

    const isHandledKey = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      ' ',
      'Home',
      'End',
    ].includes(e.key);
    if (!isHandledKey) {
      return;
    }

    e.preventDefault();

    // Space: select the currently focused radio without moving focus
    if (e.key === ' ') {
      const targetRadio = (e.target as Element)?.closest?.('hx-radio') as HelixRadio | null;
      if (targetRadio && !targetRadio.disabled) {
        targetRadio.dispatchEvent(
          new CustomEvent('hx-radio-select', {
            bubbles: true,
            composed: true,
            detail: { value: targetRadio.value },
          }),
        );
      }
      return;
    }

    const targetRadio = (e.target as Element)?.closest?.('hx-radio') as HelixRadio | null;
    const currentIndex = targetRadio
      ? enabledRadios.indexOf(targetRadio)
      : enabledRadios.findIndex((radio) => radio.checked);

    let nextIndex: number;
    if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = enabledRadios.length - 1;
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % enabledRadios.length;
    } else {
      nextIndex = currentIndex <= 0 ? enabledRadios.length - 1 : currentIndex - 1;
    }

    const nextRadio = enabledRadios[nextIndex];
    if (nextRadio) {
      nextRadio.focus();
      nextRadio.dispatchEvent(
        new CustomEvent('hx-radio-select', {
          bubbles: true,
          composed: true,
          detail: { value: nextRadio.value },
        }),
      );
    }
  };

  private _handleSlotChange(): void {
    this._cachedRadios = null;
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
        this._groupEl ?? undefined,
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
  formStateRestoreCallback(
    state: string | File | FormData,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error;
    const legendId = `${this._groupId}-legend`;

    const fieldsetClasses = {
      fieldset: true,
      'fieldset--error': hasError,
      'fieldset--disabled': this.disabled,
      'fieldset--required': this.required,
    };

    // Use _errorId only when there is no slotted error content replacing the internal error div
    const errorDescribedBy = !this._hasErrorSlot && hasError ? this._errorId : nothing;
    const describedBy =
      errorDescribedBy !== nothing ? errorDescribedBy : this.helpText ? this._helpTextId : nothing;

    return html`
      <fieldset
        part="fieldset"
        class=${classMap(fieldsetClasses)}
        role="radiogroup"
        aria-labelledby=${this.label ? legendId : nothing}
        aria-describedby=${describedBy}
        aria-required=${this.required ? 'true' : nothing}
      >
        ${this.label
          ? html`
              <legend part="legend" class="fieldset__legend" id=${legendId}>
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
            ? html`<div part="error" class="fieldset__error" id=${this._errorId} role="alert">
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
    'hx-radio-group': HelixRadioGroup;
  }
}

/** @public Type alias for use in test files and consumers. */
export type WcRadioGroup = HelixRadioGroup;
