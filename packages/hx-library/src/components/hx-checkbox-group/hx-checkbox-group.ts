import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixCheckboxGroupStyles } from './hx-checkbox-group.styles.js';
import type { HelixCheckbox } from '../hx-checkbox/hx-checkbox.js';

/** Monotonic counter for stable, SSR-safe IDs. */
let _uid = 0;

/**
 * A form-associated checkbox group that manages a set of `<hx-checkbox>` children.
 *
 * @summary Form-associated checkbox group with label, validation, help text, and multi-value form submission.
 *
 * @tag hx-checkbox-group
 *
 * @slot - `<hx-checkbox>` elements.
 * @slot label - Rich HTML group label (overrides the label property when used).
 * @slot error - Custom error content (overrides the error property).
 * @slot help - Group-level help text.
 *
 * @fires {CustomEvent<{values: string[]}>} hx-change - Dispatched when any child checkbox changes.
 *
 * @csspart group - The fieldset wrapper.
 * @csspart label - The legend/label.
 * @csspart help-text - The help text container.
 * @csspart error-message - The error message container.
 *
 * @cssprop [--hx-checkbox-group-gap=var(--hx-space-3, 0.75rem)] - Gap between checkbox items.
 * @cssprop [--hx-checkbox-group-label-color=var(--hx-color-neutral-700, #343a40)] - Label text color.
 * @cssprop [--hx-checkbox-group-error-color=var(--hx-color-error-500, #dc3545)] - Error message color.
 *
 * @drupal
 * Form-associated; render via Twig:
 * ```twig
 * <hx-checkbox-group name="{{ field_name }}" label="{{ label }}"{{ required ? ' required' : '' }}>
 *   {% for option in options %}
 *     <hx-checkbox value="{{ option.value }}" label="{{ option.label }}"></hx-checkbox>
 *   {% endfor %}
 * </hx-checkbox-group>
 * ```
 * The `name` attribute propagates automatically to child checkboxes — no Drupal behavior required.
 */
@customElement('hx-checkbox-group')
export class HelixCheckboxGroup extends LitElement {
  static override styles = [tokenStyles, helixCheckboxGroupStyles];

  // ─── Form Association ───

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * The name used for form submission. Passed to child `hx-checkbox` elements.
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
   * Whether at least one checkbox must be checked for form submission.
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
   * Layout orientation of the checkbox items.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  orientation: 'vertical' | 'horizontal' = 'vertical';

  @state() private _hasErrorSlot = false;
  @state() private _hasHelpSlot = false;

  // ─── Internal IDs ───

  private _groupId = `hx-checkbox-group-${++_uid}`;
  private _helpTextId = `${this._groupId}-help`;
  private _errorId = `${this._groupId}-error`;

  // ─── Slot Handlers ───

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _handleHelpSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHelpSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('hx-change', this._handleCheckboxChange as EventListener);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-change', this._handleCheckboxChange as EventListener);
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('disabled')) {
      this._syncCheckboxes();
    }
    if (changedProperties.has('name')) {
      this._syncCheckboxNames();
    }
    if (changedProperties.has('required')) {
      this._updateValidity();
    }
  }

  override firstUpdated(changedProperties: Map<string, unknown>): void {
    super.firstUpdated(changedProperties);
    this._syncCheckboxes();
    this._syncCheckboxNames();
    const checkedValues = this._getCheckedValues();
    this._updateFormValue(checkedValues);
    this._updateValidity(checkedValues);
  }

  // ─── Checkbox Management ───

  private _getCheckboxes(): HelixCheckbox[] {
    return Array.from(this.children).filter((c): c is HelixCheckbox => c.tagName === 'HX-CHECKBOX');
  }

  private _getCheckedValues(): string[] {
    return this._getCheckboxes()
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
  }

  private _syncCheckboxes(): void {
    const checkboxes = this._getCheckboxes();
    checkboxes.forEach((cb) => {
      cb.disabled = this.disabled;
    });
  }

  private _syncCheckboxNames(): void {
    if (!this.name) return;
    const checkboxes = this._getCheckboxes();
    checkboxes.forEach((cb) => {
      cb.name = this.name;
    });
  }

  // ─── Event Handling ───

  private _handleCheckboxChange = (e: CustomEvent<{ checked: boolean; value: string }>): void => {
    // Only intercept events from direct hx-checkbox children — do not re-intercept
    // the hx-change we dispatch ourselves from this element.
    if (e.target === this) return;

    e.stopImmediatePropagation();

    const values = this._getCheckedValues();
    this._updateFormValue(values);
    this._updateValidity(values);

    /**
     * Dispatched when any child checkbox changes.
     * @event hx-change
     */
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { values },
      }),
    );
  };

  private _handleSlotChange(): void {
    this._syncCheckboxes();
    this._syncCheckboxNames();
    const checkedValues = this._getCheckedValues();
    this._updateFormValue(checkedValues);
    this._updateValidity(checkedValues);
  }

  // ─── Form Integration ───

  private _updateFormValue(values: string[]): void {
    if (values.length === 0) {
      this._internals.setFormValue(null);
      return;
    }
    const formData = new FormData();
    values.forEach((v) => formData.append(this.name, v));
    this._internals.setFormValue(formData);
  }

  private _updateValidity(values?: string[]): void {
    const checkedValues = values ?? this._getCheckedValues();
    if (this.required && checkedValues.length === 0) {
      const firstCheckbox = this._getCheckboxes()[0];
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'Please select at least one option.',
        firstCheckbox,
      );
    } else {
      this._internals.setValidity({});
    }
  }

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

  /** Called by the form when it resets. */
  formResetCallback(): void {
    const checkboxes = this._getCheckboxes();
    checkboxes.forEach((cb) => {
      cb.checked = false;
    });
    this._internals.setFormValue(null);
    this._updateValidity([]);
  }

  /** Called when the form restores state (e.g., back/forward navigation). */
  formStateRestoreCallback(state: string | File | FormData): void {
    if (!(state instanceof FormData)) return;
    const restoredValues = state.getAll(this.name).map((v) => String(v));
    const checkboxes = this._getCheckboxes();
    checkboxes.forEach((cb) => {
      cb.checked = restoredValues.includes(cb.value);
    });
    this._updateFormValue(restoredValues);
    this._updateValidity(restoredValues);
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;

    const fieldsetClasses = {
      fieldset: true,
      'fieldset--error': hasError,
      'fieldset--disabled': this.disabled,
      'fieldset--required': this.required,
    };

    const describedBy =
      [hasError ? this._errorId : null, this._hasHelpSlot ? this._helpTextId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    return html`
      <fieldset
        part="group"
        class=${classMap(fieldsetClasses)}
        aria-describedby=${describedBy ?? nothing}
      >
        <legend part="label" class="fieldset__legend">
          <slot name="label">${this.label}</slot>
          ${this.required
            ? html`<span class="fieldset__required-marker" aria-hidden="true">*</span>`
            : nothing}
        </legend>

        <div class="fieldset__items">
          <slot @slotchange=${this._handleSlotChange}></slot>
        </div>

        ${hasError
          ? html`<div part="error-message" class="fieldset__error" id=${this._errorId} role="alert">
              <slot name="error" @slotchange=${this._handleErrorSlotChange}> ${this.error} </slot>
            </div>`
          : html`<slot name="error" @slotchange=${this._handleErrorSlotChange}></slot>`}

        <div part="help-text" class="fieldset__help-text" id=${this._helpTextId}>
          <slot name="help" @slotchange=${this._handleHelpSlotChange}></slot>
        </div>
      </fieldset>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-checkbox-group': HelixCheckboxGroup;
  }
}
