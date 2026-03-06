import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixMeterStyles } from './hx-meter.styles.js';

type MeterState = 'optimum' | 'warning' | 'danger' | 'default';

/**
 * A scalar measurement within a known range — e.g., disk usage, health score,
 * or any numeric value with defined min/max bounds. Supports low/high/optimum
 * threshold markers for semantic color feedback.
 *
 * @summary Scalar measurement gauge within a defined range.
 *
 * @tag hx-meter
 *
 * @slot label - Visible label rendered above the meter track.
 *
 * @csspart base - The outer wrapper element.
 * @csspart indicator - The filled bar indicating the current value.
 * @csspart label - The label wrapper element.
 *
 * @cssprop [--hx-meter-track-height] - Height of the track bar.
 * @cssprop [--hx-meter-track-color] - Background color of the unfilled track.
 * @cssprop [--hx-meter-track-radius] - Border radius of the track.
 * @cssprop [--hx-meter-indicator-color] - Default filled bar color (no thresholds).
 * @cssprop [--hx-meter-color-optimum] - Color when value is in the optimum zone.
 * @cssprop [--hx-meter-color-warning] - Color when value is in a warning zone.
 * @cssprop [--hx-meter-color-danger] - Color when value is in the danger zone.
 * @cssprop [--hx-meter-label-color] - Label text color.
 */
@customElement('hx-meter')
export class HelixMeter extends LitElement {
  static override styles = [tokenStyles, helixMeterStyles];

  /**
   * Current value of the meter.
   * @attr value
   */
  @property({ type: Number, reflect: true })
  value = 0;

  /**
   * Minimum value of the range.
   * @attr min
   */
  @property({ type: Number, reflect: true })
  min = 0;

  /**
   * Maximum value of the range.
   * @attr max
   */
  @property({ type: Number, reflect: true })
  max = 100;

  /**
   * Threshold below which the value is considered suboptimal (lower range warning).
   * @attr low
   */
  @property({ type: Number, reflect: true })
  low?: number;

  /**
   * Threshold above which the value is considered suboptimal (upper range warning).
   * @attr high
   */
  @property({ type: Number, reflect: true })
  high?: number;

  /**
   * The optimal value within the range. Used to determine which zone is "good".
   * @attr optimum
   */
  @property({ type: Number, reflect: true })
  optimum?: number;

  /**
   * Accessible label for the meter. Used as aria-label when no label slot is provided.
   * @attr label
   */
  @property({ type: String })
  label?: string;

  private _clampedValue(): number {
    return Math.min(Math.max(this.value, this.min), this.max);
  }

  private _percentage(): number {
    const range = this.max - this.min;
    if (range === 0) return 0;
    return ((this._clampedValue() - this.min) / range) * 100;
  }

  private _resolveState(): MeterState {
    const v = this._clampedValue();
    const hasLow = this.low !== undefined;
    const hasHigh = this.high !== undefined;
    const hasOptimum = this.optimum !== undefined;

    if (!hasLow && !hasHigh && !hasOptimum) return 'default';

    const inLowZone = hasLow && v < this.low!;
    const inHighZone = hasHigh && v > this.high!;
    const inMiddleZone = !inLowZone && !inHighZone;

    if (!hasOptimum) {
      if (inLowZone || inHighZone) return 'warning';
      return 'optimum';
    }

    const opt = this.optimum!;
    const optimumInLow = hasLow && opt < this.low!;
    const optimumInHigh = hasHigh && opt > this.high!;
    const optimumInMiddle = !optimumInLow && !optimumInHigh;

    if (optimumInMiddle) {
      if (inMiddleZone) return 'optimum';
      if (inLowZone || inHighZone) return 'warning';
    } else if (optimumInLow) {
      if (inLowZone) return 'optimum';
      if (inMiddleZone) return 'warning';
      if (inHighZone) return 'danger';
    } else if (optimumInHigh) {
      if (inHighZone) return 'optimum';
      if (inMiddleZone) return 'warning';
      if (inLowZone) return 'danger';
    }

    return 'default';
  }

  override updated() {
    // Set data-state on host so :host([data-state]) CSS selectors work
    this.dataset['state'] = this._resolveState();
  }

  override render() {
    const pct = this._percentage();
    const state = this._resolveState();
    const ariaLabel = this.label ?? `${this._clampedValue()} of ${this.max}`;
    const hasLabel = this.label !== undefined;

    return html`
      <div
        part="base"
        class="meter"
        role="meter"
        aria-valuenow=${this._clampedValue()}
        aria-valuemin=${this.min}
        aria-valuemax=${this.max}
        aria-label=${ariaLabel}
        data-state=${state}
      >
        ${hasLabel
          ? html`<span part="label" class="meter__label">
              <slot name="label">${this.label}</slot>
            </span>`
          : html`<slot name="label"></slot>`}
        <div class="meter__track">
          <div
            part="indicator"
            class="meter__indicator"
            style=${styleMap({ width: `${pct}%` })}
          ></div>
        </div>
        <meter
          class="meter__native"
          value=${this._clampedValue()}
          min=${this.min}
          max=${this.max}
          low=${ifDefined(this.low)}
          high=${ifDefined(this.high)}
          optimum=${ifDefined(this.optimum)}
          aria-hidden="true"
          tabindex="-1"
        ></meter>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-meter': HelixMeter;
  }
}
