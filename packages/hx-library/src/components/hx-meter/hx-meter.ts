import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
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
 * @slot label - Visible label rendered above the meter track. When using this
 *   slot without the `label` attribute, the accessible name is derived from the
 *   slot content via `aria-labelledby`. The `label` attribute is NOT required
 *   when slot content is provided — the component detects slot content and
 *   switches to `aria-labelledby` automatically.
 *
 * @csspart base - The outer wrapper element.
 * @csspart track - The unfilled track bar element.
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

  private static _counter = 0;
  private _uid = `hx-meter-${++HelixMeter._counter}`;

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
   * Accessible label for the meter. Used as the visible label text and as
   * the source for `aria-labelledby`. When only slot content is provided
   * (no `label` attribute), the slot content is used for the accessible name.
   * @attr label
   */
  @property({ type: String })
  label?: string;

  @state()
  private _hasSlotContent = false;

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

    // When hasLow/hasHigh/hasOptimum are true, the corresponding property is defined.
    // Use nullish coalescing to satisfy the type checker while preserving the runtime logic.
    const lowVal = this.low ?? 0;
    const highVal = this.high ?? this.max;
    const inLowZone = hasLow && v < lowVal;
    const inHighZone = hasHigh && v > highVal;
    const inMiddleZone = !inLowZone && !inHighZone;

    if (!hasOptimum) {
      if (inLowZone || inHighZone) return 'warning';
      return 'optimum';
    }

    const opt = this.optimum ?? this.min;
    const optimumInLow = hasLow && opt < lowVal;
    const optimumInHigh = hasHigh && opt > highVal;
    const optimumInMiddle = !optimumInLow && !optimumInHigh;

    if (optimumInMiddle) {
      if (inMiddleZone) return 'optimum';
      return 'warning';
    } else if (optimumInLow) {
      if (inLowZone) return 'optimum';
      if (inMiddleZone) return 'warning';
      return 'danger';
    } else {
      // optimumInHigh
      if (inHighZone) return 'optimum';
      if (inMiddleZone) return 'warning';
      return 'danger';
    }
  }

  private _onLabelSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this._hasSlotContent = slot.assignedNodes({ flatten: true }).length > 0;
  }

  override updated() {
    // Set data-state on host so :host([data-state]) CSS selectors work
    this.dataset['state'] = this._resolveState();
  }

  // ─── WCAG 1.4.1: State label map ───
  // The indicator bar color alone is insufficient for color-blind users.
  // A visible state label is rendered below the track when a semantic state
  // (optimum/warning/danger) is active, providing a non-color visual cue.
  // aria-valuetext already embeds the state for AT users.

  private static readonly _STATE_LABELS: Partial<Record<MeterState, string>> = {
    optimum: 'Optimum',
    warning: 'Warning',
    danger: 'Danger',
  };

  override render() {
    const pct = this._percentage();
    const state = this._resolveState();
    const clampedValue = this._clampedValue();
    const stateLabel = state !== 'default' ? ` — ${state}` : '';
    const ariaValuetext = `${clampedValue} of ${this.max}${stateLabel}`;
    const hasVisibleLabel = this.label !== undefined || this._hasSlotContent;
    const visibleStateLabel = HelixMeter._STATE_LABELS[state];

    return html`
      <div
        part="base"
        class="meter"
        role="meter"
        tabindex="0"
        aria-valuenow=${clampedValue}
        aria-valuemin=${this.min}
        aria-valuemax=${this.max}
        aria-valuetext=${ariaValuetext}
        aria-label=${ifDefined(!hasVisibleLabel ? `${clampedValue} of ${this.max}` : undefined)}
        aria-labelledby=${ifDefined(hasVisibleLabel ? `${this._uid}-label` : undefined)}
      >
        <span
          id=${`${this._uid}-label`}
          part="label"
          class="meter__label"
          ?hidden=${!hasVisibleLabel}
        >
          <slot name="label" @slotchange=${this._onLabelSlotChange}>${this.label ?? ''}</slot>
        </span>
        <div class="meter__track" part="track">
          <div
            part="indicator"
            class="meter__indicator"
            style=${styleMap({ width: `${pct}%` })}
          ></div>
        </div>
        ${visibleStateLabel
          ? html`<span class="meter__state-label" data-state=${state} aria-hidden="true"
              >${visibleStateLabel}</span
            >`
          : nothing}
        <meter
          class="meter__native"
          value=${clampedValue}
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
