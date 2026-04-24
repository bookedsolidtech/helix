import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { helixSwitchStyles } from './hx-switch.styles.js';

const _nextSwitchId = createIdCounter('hx-switch');

/** Detail for the hx-change event dispatched by hx-switch. */
export interface HxSwitchChangeDetail {
  checked: boolean;
  value: string;
}

/**
 * A toggle switch component for on/off states.
 *
 * Uses `role="switch"` with `aria-checked` to convey toggle state.
 * Supports keyboard activation via Space key (per ARIA APG switch pattern).
 * Label association is handled through `aria-labelledby`, and
 * error/help text are linked via `aria-describedby`.
 *
 * @summary Form-associated toggle switch with label, error, and help text.
 *
 * @tag hx-switch
 *
 * @slot - Custom label content (overrides the label property).
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{checked: boolean, value: string}>} hx-change - Dispatched when the switch is toggled. Boolean-selection controls (`hx-switch`, `hx-checkbox`) include both `checked` (boolean state) and `value` (form value) in the detail; text-value controls (`hx-text-input`, `hx-combobox`, `hx-select`) emit only `{value}`.
 *
 * @csspart switch - The switch container (track + thumb wrapper).
 * @csspart track - The track background element.
 * @csspart thumb - The sliding thumb element.
 * @csspart label - The label text element.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 *
 * @cssprop [--hx-switch-track-bg=var(--hx-color-neutral-300)] - Track background color.
 * @cssprop [--hx-switch-track-checked-bg=var(--hx-color-primary-500)] - Track background when checked.
 * @cssprop [--hx-switch-thumb-bg=var(--hx-color-neutral-0)] - Thumb background color.
 * @cssprop [--hx-switch-thumb-shadow=var(--hx-shadow-sm)] - Thumb box shadow.
 * @cssprop [--hx-switch-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-switch-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-switch-error-color=var(--hx-color-error-500)] - Error message color.
 * @cssprop [--hx-switch-help-text-color=var(--hx-color-neutral-500)] - Help text color.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-switch-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-border-radius-full] - CSS custom property.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-shadow-sm] - Box shadow.
 * @cssprop [--hx-switch-track-width-sm=var(--hx-size-8)] - Width.
 * @cssprop [--hx-size-8] - Size token.
 * @cssprop [--hx-switch-track-height-sm=var(--hx-size-4-5)] - Height.
 * @cssprop [--hx-size-4-5] - Size token.
 * @cssprop [--hx-switch-thumb-size-sm=var(--hx-size-3-5)] - CSS custom property.
 * @cssprop [--hx-size-3-5] - Size token.
 * @cssprop [--hx-switch-thumb-offset=var(--hx-space-0-5)] - CSS custom property.
 * @cssprop [--hx-space-0-5] - Spacing token.
 * @cssprop [--hx-switch-track-width-md=var(--hx-size-10)] - Width.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-switch-track-height-md=var(--hx-size-5-5)] - Height.
 * @cssprop [--hx-size-5-5] - Size token.
 * @cssprop [--hx-switch-thumb-size-md=var(--hx-size-4-5)] - CSS custom property.
 * @cssprop [--hx-switch-track-width-lg=var(--hx-size-12)] - Width.
 * @cssprop [--hx-size-12] - Size token.
 * @cssprop [--hx-switch-track-height-lg=var(--hx-size-6-5)] - Height.
 * @cssprop [--hx-size-6-5] - Size token.
 * @cssprop [--hx-switch-thumb-size-lg=var(--hx-size-5-5)] - CSS custom property.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-error-text] - Color.
 * @cssprop [--hx-font-weight-bold] - Font weight.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-color-neutral-500] - Color.
 */
@customElement('hx-switch')
export class HelixSwitch extends FormMixin(HelixElement) {
  static override styles = [helixSwitchStyles];

  // ─── Form Association ───

  /** @internal */
  static override formAssociated = true;

  // ─── Properties ───

  /**
   * Whether the switch is toggled on.
   * @attr checked
   */
  @property({ type: Boolean, reflect: true })
  checked = false;

  /**
   * Whether the switch is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the switch is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * The name of the switch, used for form submission.
   * @attr name
   */
  @property({ type: String, reflect: true })
  name = '';

  /**
   * The value submitted when the switch is checked.
   * @attr value
   */
  @property({ type: String, reflect: true })
  value = 'on';

  /**
   * The visible label text for the switch.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Size variant of the switch.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Error message to display. When set, the switch enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the switch for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Validation message shown when the field is required but empty.
   * @attr required-message
   */
  @property({ attribute: 'required-message' })
  requiredMessage = 'This field is required.';

  // ─── Lifecycle ───

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('checked') || changedProperties.has('value')) {
      this._internals.setFormValue(this.checked ? this.value : null);
    }
  }

  // ─── Form Integration ───

  /** Recalculates and sets the validity state based on required and checked. */
  /** @internal */
  override _updateValidity(): void {
    if (this.required && !this.checked) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || this.requiredMessage,
        this._trackEl ?? undefined,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  protected override _onFormReset(): void {
    this.checked = false;
    this._internals.setFormValue(null);
    this._resetInteractionState();
  }

  protected override _onFormStateRestore(
    state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      this.checked = state === this.value;
    }
  }

  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  /** Reference to the native button element acting as the switch track.  * @internal
   */
  @query('.switch__track')
  private _trackEl: HTMLButtonElement | null | undefined;

  /** Whether the error slot has assigned content. */
  /** @internal */
  @state() private _hasErrorSlot = false;

  /** Whether the default slot has assigned content (slotted label). */
  /** @internal */
  @state() private _hasDefaultSlot = false;

  // ─── Slot Handlers ───

  /** Updates _hasErrorSlot when error slot content changes. */
  /** @internal */
  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** Updates _hasDefaultSlot when default slot content changes. */
  /** @internal */
  private _handleDefaultSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasDefaultSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Event Handling ───

  /** Toggles checked state and dispatches hx-change event. */
  /** @internal */
  private _toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this._handleInteractionInput();

    this.dispatchEvent(
      new CustomEvent<{ checked: boolean; value: string }>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked, value: this.value },
      }),
    );
  }

  /** Handles click events on the track. */
  /** @internal */
  private _handleClick(): void {
    this._toggle();
  }

  /** Handles keydown events — Space toggles the switch per ARIA APG. */
  /** @internal */
  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ') {
      e.preventDefault();
      this._toggle();
    }
  }

  // ─── Public Methods ───

  /** Moves focus to the switch track element. */
  override focus(options?: FocusOptions): void {
    this._trackEl?.focus(options);
  }

  // ─── Render ───

  /** Unique ID for this switch instance, used for ARIA associations. */
  /** @internal */
  private _switchId = _nextSwitchId();
  /** ID for the label element, referenced by aria-labelledby. */
  /** @internal */
  private _labelId = `${this._switchId}-label`;
  /** ID for the help text element, referenced by aria-describedby. */
  /** @internal */
  private _helpTextId = `${this._switchId}-help`;
  /** ID for the error element, referenced by aria-describedby. */
  /** @internal */
  private _errorId = `${this._switchId}-error`;

  override render() {
    const hasError = !!this.error;
    const hasLabel = !!this.label || this._hasDefaultSlot;

    const containerClasses = {
      switch: true,
      'switch--checked': this.checked,
      'switch--disabled': this.disabled,
      'switch--required': this.required,
      'switch--error': hasError,
      [`switch--${this.size}`]: true,
    };

    const describedBy =
      [
        hasError || this._hasErrorSlot ? this._errorId : null,
        this.helpText && !hasError ? this._helpTextId : null,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    return html`
      <div part="switch" class=${classMap(containerClasses)}>
        <div class="switch__control-row">
          <button
            part="track"
            class="switch__track"
            id=${this._switchId}
            type="button"
            role="switch"
            aria-checked=${this.checked ? 'true' : 'false'}
            aria-labelledby=${ifDefined(hasLabel ? this._labelId : undefined)}
            aria-describedby=${ifDefined(describedBy)}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-required=${this.required ? 'true' : nothing}
            ?disabled=${this.disabled}
            @click=${this._handleClick}
            @keydown=${this._handleKeyDown}
          >
            <span part="thumb" class="switch__thumb"></span>
          </button>

          <label part="label" class="switch__label" id=${this._labelId} for=${this._switchId}>
            <slot @slotchange=${this._handleDefaultSlotChange}>${this.label}</slot>${this.required
              ? html`<span class="switch__required-marker" aria-hidden="true">*</span>`
              : nothing}
          </label>
        </div>

        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${hasError
            ? html`<div part="error" class="switch__error" id=${this._errorId} role="alert">
                ${this.error}
              </div>`
            : nothing}
        </slot>

        ${this.helpText && !hasError
          ? html`
              <div part="help-text" class="switch__help-text" id=${this._helpTextId}>
                <slot name="help-text">${this.helpText}</slot>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

/**
 * Per-component event map for type-safe addEventListener on hx-switch.
 * The `hx-change` detail always includes both `checked` and `value` for this component.
 */
export interface HxSwitchEventMap {
  'hx-change': CustomEvent<{ checked: boolean; value: string }>;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-switch': HelixSwitch;
  }
}

export type HxSwitch = HelixSwitch;
