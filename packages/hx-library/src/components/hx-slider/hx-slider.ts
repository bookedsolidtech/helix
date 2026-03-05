import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixSliderStyles } from './hx-slider.styles.js';

/**
 * A range slider component for selecting a numeric value within a min/max boundary.
 * Supports tick marks, value display, range labels, and native form participation
 * via ElementInternals.
 *
 * @summary Form-associated range slider with label, ticks, and value display.
 *
 * @tag hx-slider
 *
 * @slot label - Custom label content (overrides the label property).
 * @slot help - Custom help text content (overrides the helpText property).
 * @slot min-label - Label rendered at the minimum end of the slider.
 * @slot max-label - Label rendered at the maximum end of the slider.
 *
 * @fires {CustomEvent<{value: number}>} hx-input - Dispatched continuously while the user drags.
 * @fires {CustomEvent<{value: number}>} hx-change - Dispatched when the user releases the thumb.
 *
 * @csspart slider - The outer container element.
 * @csspart track - The track background element.
 * @csspart fill - The filled portion of the track showing progress.
 * @csspart thumb - The draggable thumb overlay element.
 * @csspart label - The label element.
 * @csspart value-display - The element displaying the current numeric value.
 * @csspart tick - Each individual tick mark element.
 *
 * @cssprop [--hx-slider-track-bg=var(--hx-color-neutral-200)] - Track background color.
 * @cssprop [--hx-slider-fill-bg=var(--hx-color-primary-500)] - Fill/progress color.
 * @cssprop [--hx-slider-thumb-bg=var(--hx-color-neutral-0)] - Thumb background color.
 * @cssprop [--hx-slider-thumb-border-color=var(--hx-color-primary-500)] - Thumb border color.
 * @cssprop [--hx-slider-thumb-shadow=var(--hx-shadow-sm)] - Thumb box shadow.
 * @cssprop [--hx-slider-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-slider-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-slider-value-color=var(--hx-color-neutral-600)] - Value display text color.
 * @cssprop [--hx-slider-tick-color=var(--hx-color-neutral-400)] - Tick mark color.
 */
@customElement('hx-slider')
export class HelixSlider extends LitElement {
  static override styles = [tokenStyles, helixSliderStyles];

  // ─── Form Association ───

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * The name submitted with the form.
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * The current numeric value of the slider.
   * @attr value
   */
  @property({ type: Number })
  value = 0;

  /**
   * The minimum allowed value.
   * @attr min
   */
  @property({ type: Number })
  min = 0;

  /**
   * The maximum allowed value.
   * @attr max
   */
  @property({ type: Number })
  max = 100;

  /**
   * The stepping interval between values.
   * @attr step
   */
  @property({ type: Number })
  step = 1;

  /**
   * Whether the slider is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * The visible label text for the slider.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Help text displayed below the slider for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * When true, the current value is shown next to the label.
   * @attr show-value
   */
  @property({ type: Boolean, attribute: 'show-value' })
  showValue = false;

  /**
   * When true, tick marks are rendered at each step interval.
   * @attr show-ticks
   */
  @property({ type: Boolean, attribute: 'show-ticks' })
  showTicks = false;

  /**
   * The size variant of the slider.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  // ─── Internal State ───

  @state() private _hasLabelSlot = false;
  @state() private _hasMinLabelSlot = false;
  @state() private _hasMaxLabelSlot = false;
  @state() private _hasHelpSlot = false;

  // ─── Internal References ───

  @query('.slider__input')
  private _input!: HTMLInputElement | null;

  // ─── Unique IDs ───

  private readonly _sliderId = `hx-slider-${Math.random().toString(36).slice(2, 9)}`;
  private readonly _labelId = `${this._sliderId}-label`;
  private readonly _helpId = `${this._sliderId}-help`;

  // ─── Computed Values ───

  private _fillPercent(): number {
    const range = this.max - this.min;
    if (range === 0) return 0;
    return ((this.value - this.min) / range) * 100;
  }

  private _thumbPercent(): number {
    return this._fillPercent();
  }

  private _cachedTicks: number[] = [];

  private _computeTicks(): number[] {
    if (!this.showTicks) return [];
    const ticks: number[] = [];
    const range = this.max - this.min;
    if (range <= 0 || this.step <= 0) return ticks;
    const count = Math.round(range / this.step);
    for (let i = 0; i <= count; i++) {
      ticks.push((i / count) * 100);
    }
    return ticks;
  }

  // ─── Lifecycle ───

  override willUpdate(changedProperties: Map<string, unknown>): void {
    if (
      changedProperties.has('min') ||
      changedProperties.has('max') ||
      changedProperties.has('step') ||
      changedProperties.has('showTicks')
    ) {
      this._cachedTicks = this._computeTicks();
    }
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value') || changedProperties.has('name')) {
      this._internals.setFormValue(String(this.value));
    }
  }

  override firstUpdated(): void {
    if (import.meta.env['DEV']) {
      Promise.resolve().then(() => {
        if (!this.label && !this._hasLabelSlot) {
          console.warn(
            '[hx-slider] No accessible name provided. Set the "label" attribute or use the slot="label".',
          );
        }
      });
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

  /** Checks whether the slider satisfies its constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Reports validity and shows the browser's constraint validation UI. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  /** Called by the form when it resets. */
  formResetCallback(): void {
    this.value = this.min;
    this._internals.setFormValue(String(this.min));
  }

  /** Called when the form restores state (e.g., back/forward navigation). */
  formStateRestoreCallback(state: string): void {
    const parsed = parseFloat(state);
    if (!isNaN(parsed)) {
      this.value = parsed;
    }
  }

  // ─── Public Methods ───

  /** Moves focus to the native range input. */
  override focus(options?: FocusOptions): void {
    this._input?.focus(options);
  }

  // ─── Slot Handlers ───

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _handleHelpSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHelpSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _handleMinLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasMinLabelSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _handleMaxLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasMaxLabelSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Event Handling ───

  private _handleInput(e: Event): void {
    if (this.disabled) return;
    const target = e.target as HTMLInputElement;
    this.value = parseFloat(target.value);
    this._internals.setFormValue(String(this.value));

    /**
     * Dispatched continuously while the user drags the thumb.
     * @event hx-input
     */
    this.dispatchEvent(
      new CustomEvent('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private _handleChange(e: Event): void {
    if (this.disabled) return;
    const target = e.target as HTMLInputElement;
    this.value = parseFloat(target.value);
    this._internals.setFormValue(String(this.value));

    /**
     * Dispatched when the user releases the thumb after dragging.
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

  // ─── Render ───

  override render() {
    const fillPct = this._fillPercent();
    const thumbPct = this._thumbPercent();
    const ticks = this._cachedTicks;
    const hasLabel = !!this.label || this._hasLabelSlot;
    const showRangeLabels = this._hasMinLabelSlot || this._hasMaxLabelSlot;

    const containerClasses = {
      slider: true,
      [`slider--${this.size}`]: true,
      'slider--disabled': this.disabled,
      'slider--has-ticks': this.showTicks,
    };

    const describedBy =
      [this.helpText || this._hasHelpSlot ? this._helpId : null].filter(Boolean).join(' ') ||
      undefined;

    return html`
      <div part="slider" class=${classMap(containerClasses)}>
        <!-- Label row -->
        <div class="slider__label-row">
          <slot name="label" @slotchange=${this._handleLabelSlotChange}>
            ${this.label
              ? html`<label
                  part="label"
                  class="slider__label"
                  id=${this._labelId}
                  for=${this._sliderId}
                >
                  ${this.label}
                </label>`
              : nothing}
          </slot>

          ${this.showValue
            ? html`<span part="value-display" class="slider__value-display"> ${this.value} </span>`
            : nothing}
        </div>

        <!-- Track -->
        <div class="slider__track-container">
          <div part="track" class="slider__track">
            <div part="fill" class="slider__fill" style=${styleMap({ width: `${fillPct}%` })}></div>

            <input
              class="slider__input"
              id=${this._sliderId}
              type="range"
              .value=${live(String(this.value))}
              min=${this.min}
              max=${this.max}
              step=${this.step}
              ?disabled=${this.disabled}
              name=${ifDefined(this.name || undefined)}
              aria-valuemin=${this.min}
              aria-valuemax=${this.max}
              aria-valuenow=${this.value}
              aria-label=${ifDefined(!hasLabel ? this.label || undefined : undefined)}
              aria-labelledby=${ifDefined(hasLabel ? this._labelId : undefined)}
              aria-describedby=${ifDefined(describedBy)}
              @input=${this._handleInput}
              @change=${this._handleChange}
            />

            <!-- Visual thumb positioned by fill percentage -->
            <span
              part="thumb"
              class="slider__thumb-visual"
              style=${styleMap({ left: `${thumbPct}%` })}
              aria-hidden="true"
            ></span>
          </div>
        </div>

        <!-- Tick marks -->
        ${this.showTicks && ticks.length > 0
          ? html`<div class="slider__ticks">
              ${repeat(
                ticks,
                (pct) => pct,
                (pct) =>
                  html`<span
                    part="tick"
                    class="slider__tick"
                    style=${styleMap({ left: `${pct}%` })}
                  ></span>`,
              )}
            </div>`
          : nothing}

        <!-- Range labels -->
        ${showRangeLabels
          ? html`<div class="slider__range-labels">
              <slot name="min-label" @slotchange=${this._handleMinLabelSlotChange}></slot>
              <slot name="max-label" @slotchange=${this._handleMaxLabelSlotChange}></slot>
            </div>`
          : html`
              <!-- Always observe slot changes even when not rendered -->
              <slot name="min-label" hidden @slotchange=${this._handleMinLabelSlotChange}></slot>
              <slot name="max-label" hidden @slotchange=${this._handleMaxLabelSlotChange}></slot>
            `}

        <!-- Help text -->
        <slot name="help" @slotchange=${this._handleHelpSlotChange}>
          ${this.helpText
            ? html`<div part="help-text" class="slider__help-text" id=${this._helpId}>
                ${this.helpText}
              </div>`
            : nothing}
        </slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-slider': HelixSlider;
  }
}
