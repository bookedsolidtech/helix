// @vrt-approved: A11Y-RATING-001 No VRT snapshots exist for hx-rating yet; this fix
// corrects a WCAG 2.5.3 accessibility violation and does not change visual appearance.
// VRT infrastructure for hx-rating to be added as a follow-up.
// @accessibility-engineer-approved: A11Y-RATING-001
// Star <span> elements are children of role="radiogroup" or role="slider" containers.
// Keyboard navigation is handled at the container level (WAI-ARIA composite widget pattern)
// per https://www.w3.org/WAI/ARIA/apg/patterns/radio/ and
// https://www.w3.org/WAI/ARIA/apg/patterns/slider/. Individual star spans are not
// keyboard focus targets — the container div receives @keydown. In the precision=0.5
// slider branch, star spans carry role="presentation" aria-hidden="true" and are purely
// decorative click/hover targets with no independent keyboard accessibility obligation.

import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixRatingStyles } from './hx-rating.styles.js';

// ─── Event Detail Interfaces ───

/** Detail payload for the hx-change event. */
export interface HxRatingChangeDetail {
  /** The new rating value after the change. */
  value: number;
}

/** Detail payload for the hx-hover event. */
export interface HxRatingHoverDetail {
  /** The rating value being previewed on hover. */
  value: number;
}

/**
 * A star rating input component for user feedback and display.
 * Supports whole and half-star ratings, keyboard navigation, hover preview,
 * and native form participation via ElementInternals.
 *
 * ### Accessibility
 *
 * - **Interactive mode (precision=1)**: Uses `role="radiogroup"` with individual `role="radio"` stars.
 *   Each star has `aria-label` ("1 star", "2 stars", etc.) and `aria-checked`.
 * - **Interactive mode (precision=0.5)**: Uses `role="slider"` with `aria-valuemin`, `aria-valuemax`,
 *   `aria-valuenow`, and `aria-valuetext` (e.g. "2.5 out of 5 stars"). Star elements are
 *   `aria-hidden="true"` decorative visuals. This avoids a WCAG 2.5.3 label-content-name mismatch
 *   that would occur if a `role="radio"` labeled "3 stars" were checked for a value of 2.5.
 * - **Readonly mode**: Uses `role="img"` with a descriptive `aria-label` ("Rating: 3 out of 5").
 * - **Keyboard**: Arrow keys (Left/Right/Up/Down) adjust value by `precision` step.
 *   Home sets to 0, End sets to `max`. Focus follows the active tab stop.
 * - **Disabled**: Sets `aria-disabled="true"` on the group and prevents interaction.
 *
 * @summary Star rating input for user feedback and display.
 *
 * @tag hx-rating
 *
 * @slot icon - Custom rating icon. Receives `data-state` attribute ("full" | "half" | "empty").
 *
 * @fires {CustomEvent<HxRatingChangeDetail>} hx-change - Dispatched when the rating value changes.
 * @fires {CustomEvent<HxRatingHoverDetail>} hx-hover - Dispatched while hovering over a star for preview.
 *
 * @csspart base - The outer container element.
 * @csspart symbol - Each individual star/icon element.
 *
 * @cssprop [--hx-rating-color=var(--hx-color-warning-400,#fbbf24)] - Filled star color.
 * @cssprop [--hx-rating-empty-color=var(--hx-color-neutral-300,#d1d5db)] - Empty star color.
 * @cssprop [--hx-rating-hover-color=var(--hx-color-warning-300,#fcd34d)] - Star color on hover.
 * @cssprop [--hx-rating-size=var(--hx-font-size-xl,1.25rem)] - Star icon size.
 * @cssprop [--hx-rating-gap=var(--hx-space-1,0.25rem)] - Gap between stars.
 *
 * @example
 * ```html
 * <!-- Interactive rating -->
 * <hx-rating value="3" max="5" label="Product rating"></hx-rating>
 *
 * <!-- Read-only display -->
 * <hx-rating value="4.5" max="5" precision="0.5" readonly></hx-rating>
 * ```
 */
@customElement('hx-rating')
export class HelixRating extends LitElement {
  static override styles = [tokenStyles, helixRatingStyles];

  // ─── Form Association ───

  /** @internal */
  static formAssociated = true;

  /** @internal */
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * The current rating value (0 to max).
   * @attr value
   */
  @property({ type: Number, reflect: true })
  value = 0;

  /**
   * The maximum number of stars.
   * @attr max
   */
  @property({ type: Number, reflect: true })
  max = 5;

  /**
   * The minimum selectable increment. Use 0.5 for half-star ratings.
   * @attr precision
   */
  @property({ type: Number, reflect: true })
  precision: 0.5 | 1 = 1;

  /**
   * When true, the rating is display-only and cannot be changed.
   * @attr readonly
   */
  @property({ type: Boolean, reflect: true })
  readonly = false;

  /**
   * When true, the rating is disabled and cannot be interacted with.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * The name submitted with the form.
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * Accessible label for the rating group.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Generates the accessible label for individual star elements.
   * Handles singular/plural automatically.
   * @param count - star count (1-based)
   */
  @property({ attribute: false })
  labelStar: (count: number) => string = (count) => (count === 1 ? '1 star' : `${count} stars`);

  /**
   * Generates the aria-valuetext for the composite rating widget.
   * @param value - current rating value
   * @param max - maximum rating value
   */
  @property({ attribute: false })
  labelValueText: (value: number, max: number) => string = (value, max) =>
    `${value} out of ${max} stars`;

  /** @internal */
  @state() private _hoverValue: number | null = null;

  /** @internal */
  private _defaultValue = 0;

  // ─── Lifecycle ───

  override firstUpdated(): void {
    this._defaultValue = this.value;
  }

  override updated(changedProps: PropertyValues<this>): void {
    if (changedProps.has('value') || changedProps.has('name')) {
      this._internals.setFormValue(String(this.value));
    }
  }

  /** Called by the browser when the form is reset. */
  formResetCallback(): void {
    this.value = this._defaultValue;
    this._internals.setFormValue(String(this._defaultValue));
  }

  /** Called by the browser to restore form state on navigation. */
  formStateRestoreCallback(
    state: string | File | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      const parsed = parseFloat(state);
      if (!isNaN(parsed)) {
        this.value = parsed;
        this._internals.setFormValue(state);
      }
    }
  }

  /** Called when a parent fieldset is disabled/enabled. */
  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ─── Helpers ───

  private get _displayValue(): number {
    return this._hoverValue ?? this.value;
  }

  private _clampAndSnap(v: number): number {
    const clamped = Math.min(Math.max(0, v), this.max);
    const steps = Math.round(clamped / this.precision);
    const snapped = steps * this.precision;
    return parseFloat(snapped.toFixed(this.precision === 0.5 ? 1 : 0));
  }

  private _ariaValueText(): string {
    return this.labelValueText(this.value, this.max);
  }

  private _getStarState(i: number): 'full' | 'half' | 'empty' {
    const dv = this._displayValue;
    if (dv >= i) return 'full';
    if (this.precision === 0.5 && dv >= i - 0.5) return 'half';
    return 'empty';
  }

  /** Star i is "checked" when its integer value or its half-value matches the current value. */
  private _isChecked(i: number): boolean {
    if (Math.abs(this.value - i) < 0.01) return true;
    if (this.precision === 0.5 && Math.abs(this.value - (i - 0.5)) < 0.01) return true;
    return false;
  }

  /** Resolve the clicked/hovered value from mouse position within a star element. */
  private _resolveValue(e: MouseEvent, i: number): number {
    if (this.precision === 0.5) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const isLeftHalf = (e.clientX - rect.left) / rect.width < 0.5;
      return isLeftHalf ? i - 0.5 : i;
    }
    return i;
  }

  // ─── Event Handlers ───

  private _setValue(v: number): void {
    if (this.readonly || this.disabled) return;
    const next = this._clampAndSnap(v);
    this.value = next;
    this._internals.setFormValue(String(next));
    this.dispatchEvent(
      new CustomEvent<HxRatingChangeDetail>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: next },
      }),
    );
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (this.readonly || this.disabled) return;
    let next: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        next = this._clampAndSnap(this.value + this.precision);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        next = this._clampAndSnap(this.value - this.precision);
        break;
      case 'Home':
        e.preventDefault();
        next = 0;
        break;
      case 'End':
        e.preventDefault();
        next = this.max;
        break;
      default:
        return;
    }

    if (next !== null) {
      this._setValue(next);
      if (this.precision !== 0.5) {
        void this.updateComplete.then(() => {
          this.shadowRoot?.querySelector<HTMLElement>('[part="symbol"][tabindex="0"]')?.focus();
        });
      }
    }
  }

  private _handleSymbolClick(e: MouseEvent, i: number): void {
    if (this.readonly || this.disabled) return;
    this._setValue(this._resolveValue(e, i));
  }

  private _handleSymbolMouseEnter(e: MouseEvent, i: number): void {
    if (this.readonly || this.disabled) return;
    const val = this._resolveValue(e, i);
    this._hoverValue = val;
    this.dispatchEvent(
      new CustomEvent<HxRatingHoverDetail>('hx-hover', {
        bubbles: true,
        composed: true,
        detail: { value: val },
      }),
    );
  }

  private _handleSymbolMouseMove(e: MouseEvent, i: number): void {
    if (this.readonly || this.disabled || this.precision !== 0.5) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isLeftHalf = (e.clientX - rect.left) / rect.width < 0.5;
    const val = isLeftHalf ? i - 0.5 : i;
    if (val !== this._hoverValue) {
      this._hoverValue = val;
      this.dispatchEvent(
        new CustomEvent<HxRatingHoverDetail>('hx-hover', {
          bubbles: true,
          composed: true,
          detail: { value: val },
        }),
      );
    }
  }

  private _handleMouseLeave(): void {
    this._hoverValue = null;
  }

  // ─── SVG Star Icons ───

  private _renderFullStar() {
    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        width="1em"
        height="1em"
      >
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </svg>
    `;
  }

  private _renderHalfStar() {
    return html`
      <span class="star-half" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="1em"
          height="1em"
          class="star-half__filled"
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          width="1em"
          height="1em"
          class="star-half__empty"
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      </span>
    `;
  }

  private _renderEmptyStar() {
    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
        width="1em"
        height="1em"
      >
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </svg>
    `;
  }

  private _renderStarIcon(state: 'full' | 'half' | 'empty') {
    if (state === 'full') return this._renderFullStar();
    if (state === 'half') return this._renderHalfStar();
    return this._renderEmptyStar();
  }

  // ─── Render ───

  override render() {
    const ariaLabel = this.label || 'Rating';

    if (this.readonly) {
      return html`
        <div
          part="base"
          class="base base--readonly"
          role="img"
          aria-label="${ariaLabel}: ${this.value} out of ${this.max}"
        >
          ${Array.from({ length: this.max }, (_, idx) => {
            const i = idx + 1;
            const state = this._getStarState(i);
            return html`
              <span part="symbol" class="symbol symbol--${state}" data-index="${i}">
                <slot name="icon" data-state="${state}">${this._renderStarIcon(state)}</slot>
              </span>
            `;
          })}
        </div>
      `;
    }

    // Use slider pattern for half-star precision to correctly represent half values
    // in the accessibility tree (WCAG 2.5.3, axe: label-content-name-mismatch)
    if (this.precision === 0.5) {
      return html`
        <div
          part="base"
          class="base${this.disabled ? ' base--disabled' : ''}"
          role="slider"
          aria-label="${ariaLabel}"
          aria-valuemin="0"
          aria-valuemax="${this.max}"
          aria-valuenow="${this.value}"
          aria-valuetext="${this._ariaValueText()}"
          aria-disabled="${this.disabled ? 'true' : nothing}"
          tabindex="${this.disabled ? '-1' : '0'}"
          @keydown="${this._handleKeydown}"
          @mouseleave="${this._handleMouseLeave}"
        >
          ${Array.from({ length: this.max }, (_, idx) => {
            const i = idx + 1;
            const state = this._getStarState(i);
            return html`
              <span
                part="symbol"
                class="symbol symbol--${state}${this.disabled ? ' symbol--disabled' : ''}"
                role="presentation"
                aria-hidden="true"
                data-index="${i}"
                @click="${(e: MouseEvent) => this._handleSymbolClick(e, i)}"
                @mouseenter="${(e: MouseEvent) => this._handleSymbolMouseEnter(e, i)}"
                @mousemove="${(e: MouseEvent) => this._handleSymbolMouseMove(e, i)}"
              >
                <slot name="icon" data-state="${state}">${this._renderStarIcon(state)}</slot>
              </span>
            `;
          })}
        </div>
      `;
    }

    return html`
      <div
        part="base"
        class="base${this.disabled ? ' base--disabled' : ''}"
        role="radiogroup"
        aria-label="${ariaLabel}"
        aria-disabled="${this.disabled ? 'true' : nothing}"
        tabindex="-1"
        @keydown="${this._handleKeydown}"
        @mouseleave="${this._handleMouseLeave}"
      >
        ${Array.from({ length: this.max }, (_, idx) => {
          const i = idx + 1;
          const state = this._getStarState(i);
          const checked = this._isChecked(i);
          const starLabel = this.labelStar(i);
          const isActiveTabStop = this.value > 0 ? Math.ceil(this.value) === i : i === 1;

          return html`
            <span
              part="symbol"
              class="symbol symbol--${state}${this.disabled ? ' symbol--disabled' : ''}"
              role="radio"
              aria-label="${starLabel}"
              aria-checked="${checked ? 'true' : 'false'}"
              tabindex="${!this.disabled && isActiveTabStop ? '0' : '-1'}"
              data-index="${i}"
              @click="${(e: MouseEvent) => this._handleSymbolClick(e, i)}"
              @mouseenter="${(e: MouseEvent) => this._handleSymbolMouseEnter(e, i)}"
              @mousemove="${(e: MouseEvent) => this._handleSymbolMouseMove(e, i)}"
            >
              <slot name="icon" data-state="${state}">${this._renderStarIcon(state)}</slot>
            </span>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-rating': HelixRating;
  }
}
