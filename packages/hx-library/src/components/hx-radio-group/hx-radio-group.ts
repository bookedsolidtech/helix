import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { devWarn } from '../../utils/dev-warn.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { helixRadioGroupStyles } from './hx-radio-group.styles.js';
import { forcedColorsField } from '../../styles/forced-colors.js';
import type { HelixRadio } from './hx-radio.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

const _nextRadioGroupId = createIdCounter('hx-radio-group');

/** Detail for the hx-change event dispatched by hx-radio-group. */
export interface HxRadioGroupChangeDetail {
  value: string;
  checked: boolean;
}

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
 * @cssprop [--hx-radio-group-label-color=var(--hx-color-neutral-700, #313E4B)] - Label text color.
 * @cssprop [--hx-radio-group-error-color=var(--hx-color-error-500, #E5493E)] - Error message color.
 * @cssprop [--hx-radio-group-help-text-color=var(--hx-color-neutral-500, #66787B)] - Help text color.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-radio-group-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-error-text] - Color.
 * @cssprop [--hx-font-weight-bold] - Font weight.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-color-neutral-500] - Color.
 */
@customElement('hx-radio-group')
export class HelixRadioGroup extends FormMixin(HelixElement) {
  static override styles = [helixRadioGroupStyles, forcedColorsField];

  // ─── Form Association ───

  /**
   * Enables ElementInternals form association for this component.
   * @internal
   */
  static override formAssociated = true;

  // ─── Properties ───

  /**
   * The selected radio's value.
   * @attr value
   */
  @property({ type: String, reflect: true })
  value = '';

  /**
   * The name used for form submission.
   * @attr name
   */
  @property({ type: String, reflect: true })
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

  /**
   * Tracks whether the help-text slot has assigned content.
   * @internal
   */
  @state() private _hasHelpSlot = false;

  // ─── Internal IDs ───

  /**
   * Unique identifier for this radio group instance used in ARIA attributes.
   * @internal
   */
  private _groupId = _nextRadioGroupId();
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

  /**
   * Handles slotchange events on the help-text slot to detect assigned content.
   * Codex aria-group-2 finding: slot-only help text was not contributing to
   * `aria-describedby` because the wrapper was conditionally rendered on the
   * `helpText` property alone.
   * @internal
   */
  private _handleHelpSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    this._hasHelpSlot = e.target.assignedNodes({ flatten: true }).length > 0;
  }

  /**
   * Handle for the shared IDREF observer. See `installAriaIdrefMirror()`.
   * @internal
   */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Deferred copy of `error` driven through reactive state so the persistent
   * live region can re-announce on transitions without direct DOM mutation.
   * Codex round-1 finding #10.
   * @internal
   */
  @state() private _announcedError = '';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('hx-radio-select', this._handleRadioSelect);
    this.addEventListener('keydown', this._handleKeydown);
    // Seed root-independent semantics from connect so the host announces the
    // radiogroup role before first paint.
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-radio-select', this._handleRadioSelect);
    this.removeEventListener('keydown', this._handleKeydown);
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value || null);
      this._syncRadios();
    }
    if (changedProperties.has('disabled')) {
      this._syncRadios();
    }
    // Host-elevated ARIA semantics — see _syncHostAriaSemantics.
    this._syncHostAriaSemantics();
    // Codex round-1 finding #10: drive re-announcement from reactive state
    // so the persistent live region stays in the shadow tree across error
    // transitions. Direct `textContent` mutation would delete the slot
    // subtree the renderer just produced.
    if (changedProperties.has('error')) {
      const previousError = changedProperties.get('error') as string;
      if (previousError && this.error) {
        // Error→error: clear then re-set after rAF so AT re-announces.
        this._announcedError = '';
        requestAnimationFrame(() => {
          this._announcedError = this.error;
        });
      } else {
        this._announcedError = this.error;
      }
    }
  }

  /**
   * Mirrors radiogroup semantics onto the host via ElementInternals so that
   * consumer-supplied `aria-label`, `aria-labelledby`, and `aria-describedby`
   * on `<hx-radio-group>` reach the announced control. The codex aria-group-2
   * finding identified that the inner `<fieldset>` was the announced node and
   * the host's external IDREF tokens could not cross the shadow boundary.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    internals.role = 'radiogroup';
    internals.ariaRequired = this.required ? 'true' : 'false';
    internals.ariaInvalid = !internals.validity.valid ? 'true' : 'false';
    internals.ariaDisabled = this.disabled ? 'true' : 'false';
    internals.ariaOrientation = this.orientation === 'horizontal' ? 'horizontal' : 'vertical';

    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';
    if (hostAriaLabel) {
      internals.ariaLabel = hostAriaLabel;
    } else if (!this.getAttribute('aria-labelledby')) {
      internals.ariaLabel = this.label || null;
    } else {
      internals.ariaLabel = null;
    }

    if (supportsIdrefElementReferences(internals)) {
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
        ariaDescribedByElements: Element[] | null;
      };
      const refsInternals = internals as InternalsWithRefs;

      const externalLabelTokens = this.getAttribute('aria-labelledby');
      const externalDescTokens = this.getAttribute('aria-describedby');

      const labelEls = resolveIdrefTokens(this, externalLabelTokens);
      const internalLegend = this.shadowRoot?.getElementById(`${this._groupId}-legend`);
      if (labelEls.length === 0 && !hostAriaLabel && this.label && internalLegend) {
        labelEls.push(internalLegend);
      }
      refsInternals.ariaLabelledByElements = labelEls.length > 0 ? labelEls : null;

      const descEls = resolveIdrefTokens(this, externalDescTokens);
      const helpEl = this.shadowRoot?.getElementById(this._helpTextId);
      const errorEl = this.shadowRoot?.getElementById(this._errorId);
      if (helpEl && (this.helpText || this._hasHelpSlot)) {
        descEls.push(helpEl);
      }
      if (errorEl && (this.error || this._hasErrorSlot)) {
        descEls.push(errorEl);
      }
      refsInternals.ariaDescribedByElements = descEls.length > 0 ? descEls : null;
    }
  }

  override firstUpdated(changedProperties: PropertyValues<this>): void {
    super.firstUpdated(changedProperties);
    this._syncRadios();
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
    this._handleInteractionInput();
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
   * Updates the ElementInternals validity state based on the required constraint and current value.
   * @internal
   */
  override _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'Please select an option.',
        this._groupEl ?? undefined,
      );
    } else {
      this._internals.setValidity({});
    }
    // Codex round-1 finding #6: re-sync host ARIA after every setValidity().
    this._syncHostAriaSemantics();
  }

  /** @internal */
  protected override _onFormReset(): void {
    this.value = '';
    this._internals.setFormValue(null);
    this._syncRadios();
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

  // ─── Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;
    const hasHelp = !!this.helpText || this._hasHelpSlot;
    const legendId = `${this._groupId}-legend`;

    const fieldsetClasses = {
      fieldset: true,
      'fieldset--error': hasError,
      'fieldset--disabled': this.disabled,
      'fieldset--required': this.required,
    };

    return html`
      <fieldset
        part="fieldset"
        class=${classMap(fieldsetClasses)}
        role="presentation"
        aria-orientation=${this.orientation === 'horizontal' ? 'horizontal' : nothing}
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

        <!--
          Persistent error live region. role="alert" is set from first paint
          so the WAI-ARIA contract for live updates is honoured: content
          changes in place rather than the container being toggled.
        -->
        <div
          part="error"
          class="fieldset__error"
          id=${this._errorId}
          role="alert"
          ?hidden=${!hasError}
        >
          <slot name="error" @slotchange=${this._handleErrorSlotChange}
            >${this._announcedError}</slot
          >
        </div>

        <!--
          Persistent help-text container. Rendered whenever the property OR
          the slot has content; hidden when an error is present so guidance
          does not compete with validation feedback. Always in the shadow
          tree so the host's aria-describedby chain is stable.
        -->
        <div
          part="help-text"
          class="fieldset__help-text"
          id=${this._helpTextId}
          ?hidden=${!hasHelp || hasError}
        >
          <slot name="help-text" @slotchange=${this._handleHelpSlotChange}>${this.helpText}</slot>
        </div>
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
