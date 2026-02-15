import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@wc-2026/tokens/lit';
import { wcSwitchStyles } from './wc-switch.styles.js';

/**
 * A toggle switch component for on/off states.
 *
 * @summary Form-associated toggle switch with label, error, and help text.
 *
 * @tag wc-switch
 *
 * @slot - Custom label content (overrides the label property).
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{checked: boolean}>} wc-change - Dispatched when the switch is toggled.
 *
 * @csspart switch - The switch container (track + thumb wrapper).
 * @csspart track - The track background element.
 * @csspart thumb - The sliding thumb element.
 * @csspart label - The label text element.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 *
 * @cssprop [--wc-switch-track-bg=var(--wc-color-neutral-300)] - Track background color.
 * @cssprop [--wc-switch-track-checked-bg=var(--wc-color-primary-500)] - Track background when checked.
 * @cssprop [--wc-switch-thumb-bg=var(--wc-color-neutral-0)] - Thumb background color.
 * @cssprop [--wc-switch-thumb-shadow=var(--wc-shadow-sm)] - Thumb box shadow.
 * @cssprop [--wc-switch-focus-ring-color=var(--wc-focus-ring-color)] - Focus ring color.
 * @cssprop [--wc-switch-label-color=var(--wc-color-neutral-700)] - Label text color.
 * @cssprop [--wc-switch-error-color=var(--wc-color-error-500)] - Error message color.
 */
@customElement('wc-switch')
export class WcSwitch extends LitElement {
  static override styles = [tokenStyles, wcSwitchStyles];

  // --- Form Association ---

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // --- Properties ---

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
  @property({ type: String })
  name = '';

  /**
   * The value submitted when the switch is checked.
   * @attr value
   */
  @property({ type: String })
  value = 'on';

  /**
   * The visible label text for the switch.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Size variant of the switch.
   * @attr wc-size
   */
  @property({ type: String, reflect: true, attribute: 'wc-size' })
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

  // --- Lifecycle ---

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('checked') || changedProperties.has('value')) {
      this._internals.setFormValue(this.checked ? this.value : null);
      this._updateValidity();
    }
    if (changedProperties.has('required')) {
      this._updateValidity();
    }
  }

  // --- Form Integration ---

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

  /** Checks whether the switch satisfies its constraints. */
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
        this._trackEl ?? undefined
      );
    } else {
      this._internals.setValidity({});
    }
  }


  /** Called by the form when it resets. */
  formResetCallback(): void {
    this.checked = false;
    this._internals.setFormValue(null);
  }

  /** Called when the form restores state (e.g., back/forward navigation). */
  formStateRestoreCallback(state: string): void {
    this.checked = state === this.value;
  }

  @query('.switch__track')
  private _trackEl!: HTMLButtonElement;

  @state() private _hasErrorSlot = false;

  // --- Slot Handlers ---

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // --- Event Handling ---

  private _toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this._internals.setFormValue(this.checked ? this.value : null);
    this._updateValidity();

    /**
     * Dispatched when the switch is toggled.
     * @event wc-change
     */
    this.dispatchEvent(
      new CustomEvent('wc-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked },
      })
    );
  }

  private _handleClick(): void {
    this._toggle();
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this._toggle();
    }
  }

  // --- Public Methods ---

  /** Moves focus to the switch track element. */
  override focus(options?: FocusOptions): void {
    this._trackEl?.focus(options);
  }

  // --- Render ---

  private _switchId = `wc-switch-${Math.random().toString(36).slice(2, 9)}`;
  private _labelId = `${this._switchId}-label`;
  private _helpTextId = `${this._switchId}-help`;
  private _errorId = `${this._switchId}-error`;

  override render() {
    const hasError = !!this.error;
    const hasLabel = !!this.label;

    const containerClasses = {
      switch: true,
      'switch--checked': this.checked,
      'switch--disabled': this.disabled,
      'switch--required': this.required,
      'switch--error': hasError,
      [`switch--${this.size}`]: true,
    };

    const describedBy = [
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

          ${hasLabel
            ? html`
                <span
                  part="label"
                  class="switch__label"
                  id=${this._labelId}
                  @click=${this._handleClick}
                >
                  <slot>${this.label}</slot>${this.required
                    ? html`<span class="switch__required-marker" aria-hidden="true">*</span>`
                    : nothing}
                </span>
              `
            : html`<span class="switch__label" id=${this._labelId}><slot></slot></span>`}
        </div>

        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${hasError
            ? html`<div part="error" class="switch__error" id=${this._errorId} role="alert" aria-live="polite">
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

declare global {
  interface HTMLElementTagNameMap {
    'wc-switch': WcSwitch;
  }
}
