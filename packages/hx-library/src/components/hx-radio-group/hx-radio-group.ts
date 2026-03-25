import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { devWarn } from '../../utils/dev-warn.js';
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
 * @fires {CustomEvent<{value: string}>} hx-radio-select - Internal event dispatched by `hx-radio` when selected; consumed by the group.
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
 * @cssprop [--hx-radio-group-help-text-color=var(--hx-color-neutral-500, #6c757d)] - Help text color.
 */
@customElement('hx-radio-group')
export class HelixRadioGroup extends LitElement {
  static override styles = [tokenStyles, helixRadioGroupStyles];

  // ─── Form Association ───

  /**
   * Enables ElementInternals form association for this component.
   * @internal
   */
  static formAssociated = true;

  /**
   * Reference to the ElementInternals instance for form participation.
   * @internal
   */
  private _internals: ElementInternals;

  constructor() {
    super();
    /** @internal */
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

  /**
   * Queries the rendered group container element within the shadow root.
   * @internal
   */
  private get _groupEl(): HTMLElement | null {
    return this.renderRoot?.querySelector('.fieldset__group') ?? null;
  }

  /**
   * Tracks whether the error slot has assigned content.
   * @internal
   */
  @state() private _hasErrorSlot = false;

  // ─── Internal IDs ───

  /**
   * Unique identifier for this radio group instance used in ARIA attributes.
   * @internal
   */
  private _groupId = `hx-radio-group-${++_groupCounter}`;
  /**
   * Unique identifier for the help text element, used in aria-describedby.
   * @internal
   */
  private _helpTextId = `${this._groupId}-help`;
  /**
   * Unique identifier for the error element, used in aria-describedby.
   * @internal
   */
  private _errorId = `${this._groupId}-error`;

  // ─── Slot Handlers ───

  /**
   * Handles slotchange events on the error slot to detect assigned content.
   * @internal
   */
  private _handleErrorSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    this._hasErrorSlot = e.target.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('hx-radio-select', this._handleRadioSelect);
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-radio-select', this._handleRadioSelect);
    this.removeEventListener('keydown', this._handleKeydown);
  }

  override updated(changedProperties: PropertyValues<this>): void {
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

  override firstUpdated(changedProperties: PropertyValues<this>): void {
    super.firstUpdated(changedProperties);
    this._syncRadios();
    this._updateValidity();
    // WCAG 4.1.2: warn when no accessible name is available for the radio group.
    // The fieldset needs either a label prop (rendered as <legend>) or an aria-label
    // attribute on the host element so screen readers can identify the group.
    if (!this.label && !this.getAttribute('aria-label')) {
      devWarn(
        'hx-radio-group',
        'No accessible label provided. Set the `label` attribute or add `aria-label` to the host element. An unlabeled radio group violates WCAG 2.1 AA (4.1.2 Name, Role, Value).',
      );
    }
  }

  // ─── Radio Management ───

  /**
   * Cached list of child hx-radio elements; invalidated on slot change.
   * @internal
   */
  private _cachedRadios: HelixRadio[] | null = null;
  /**
   * Stores each radio's individual disabled state before group-level disabling overrides it.
   * @internal
   */
  private _individualDisabledStates = new WeakMap<HelixRadio, boolean>();

  /**
   * Returns all child hx-radio elements, using the cache when available.
   * @internal
   */
  private _getRadios(): HelixRadio[] {
    if (!this._cachedRadios) {
      this._cachedRadios = Array.from(this.querySelectorAll('hx-radio')) as HelixRadio[];
    }
    return this._cachedRadios;
  }

  /**
   * Returns only the child hx-radio elements that are not disabled.
   * @internal
   */
  private _getEnabledRadios(): HelixRadio[] {
    return this._getRadios().filter((radio) => !radio.disabled && !this.disabled);
  }

  /**
   * Synchronizes checked state, disabled state, and roving tabindex across all child radios.
   * @internal
   */
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

  /**
   * Handles the internal hx-radio-select event to update the group's selected value.
   * @internal
   */
  private _handleRadioSelect = (e: Event): void => {
    if (!(e instanceof CustomEvent)) return;
    e.stopPropagation();

    const newValue = (e.detail as { value: string }).value;
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
      new CustomEvent<{ value: string; checked: boolean }>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value, checked: true },
      }),
    );
  };

  /**
   * Handles keyboard navigation (arrow keys, Home, End, Space) within the radio group.
   * @internal
   */
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
          new CustomEvent<{ value: string }>('hx-radio-select', {
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
        new CustomEvent<{ value: string }>('hx-radio-select', {
          bubbles: true,
          composed: true,
          detail: { value: nextRadio.value },
        }),
      );
    }
  };

  /**
   * Handles slotchange events on the default slot to refresh the radio cache.
   * @internal
   */
  private _handleSlotChange(): void {
    this._cachedRadios = null;
    this._syncRadios();
  }

  // ─── Form Integration ───

  /**
   * Returns the associated form element, if any.
   * @returns The associated `HTMLFormElement`, or `null` if not in a form.
   */
  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  /**
   * Returns the validation message.
   * @returns The current validation message string.
   */
  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  /**
   * Returns the ValidityState object.
   * @returns The `ValidityState` representing the current validity of the element.
   */
  get validity(): ValidityState {
    return this._internals.validity;
  }

  /**
   * Checks whether the group satisfies its constraints.
   * @returns `true` if the group is valid, `false` otherwise.
   */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /**
   * Reports validity and shows the browser's constraint validation UI.
   * @returns `true` if the group is valid, `false` otherwise.
   */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  /**
   * Updates the ElementInternals validity state based on the required constraint and current value.
   * @internal
   */
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

  /**
   * Called when the form restores state (e.g., back/forward navigation).
   * @param state - The saved form state value.
   * @param _mode - The restore mode: `'restore'` or `'autocomplete'`.
   */
  formStateRestoreCallback(
    state: string | File | FormData,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  /** Called when a parent fieldset is disabled/enabled. */
  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
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

    // WCAG 1.3.1: _errorId is now on the persistent wrapper div around the error slot,
    // so it remains valid whether error content comes from the slot or the property.
    const hasHelp = !!this.helpText;
    const describedByIds = [hasError ? this._errorId : null, hasHelp ? this._helpTextId : null]
      .filter(Boolean)
      .join(' ');
    const describedBy = describedByIds || nothing;

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

        <!-- WCAG 1.3.1: wrap slot in a persistent container so _errorId stays stable
             regardless of whether error content comes from the slot or the property. -->
        <div id=${this._errorId}>
          <slot name="error" @slotchange=${this._handleErrorSlotChange}>
            ${hasError
              ? html`<div part="error" class="fieldset__error" role="alert">${this.error}</div>`
              : nothing}
          </slot>
        </div>

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

/** Canonical type alias for the hx-radio-group component. */
export type HxRadioGroup = HelixRadioGroup;

/** @deprecated Use {@link HxRadioGroup} instead. The `Wc` prefix was a legacy naming convention. */
export type WcRadioGroup = HelixRadioGroup;
