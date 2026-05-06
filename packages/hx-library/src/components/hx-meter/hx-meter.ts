import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixMeterStyles } from './hx-meter.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';

type MeterState = 'optimum' | 'warning' | 'danger' | 'default';

const _nextMeterId = createIdCounter('hx-meter');

/**
 * A scalar measurement within a known range — e.g., disk usage, health score,
 * or any numeric value with defined min/max bounds. Supports low/high/optimum
 * threshold markers for semantic color feedback.
 *
 * Group 7 host-canonical: `role="meter"` is mirrored onto the **host** via
 * `_internals.role` AND kept on the inner `[role="meter"]` element. The dual
 * surface is the hx-progress-ring pattern (Group 7 gold-standard exemplar):
 * the host carries the cross-shadow IDREF wiring (`ariaLabelledByElements`
 * resolves through the shared mirror) while the inner element keeps its
 * existing role/state surface so legacy AT and consumer queries continue to
 * work. AccName 1.2 §4.3.1 precedence is implemented uniformly: consumer
 * host `aria-labelledby` (flattened) > consumer host `aria-label` >
 * `label` property / slotted label > derived value-text fallback.
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
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-border-radius-full] - CSS custom property.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-color-success-500] - Color.
 * @cssprop [--hx-color-warning-500] - Color.
 * @cssprop [--hx-color-error-500] - Color.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-line-height-tight] - Line height.
 * @cssprop [--hx-meter-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-color-success-700] - Color.
 * @cssprop [--hx-color-warning-700] - Color.
 * @cssprop [--hx-color-error-700] - Color.
 */
@customElement('hx-meter')
export class HelixMeter extends HelixElement {
  static override styles = [helixMeterStyles, forcedColorsSurface];

  /**
   * Test seam (Group 7 host-canonical migration): when set to `true` or
   * `false`, overrides the platform `supportsIdrefElementReferences` probe
   * before `connectedCallback` seeds `_supportsIdrefRefs`. Tests that need
   * to verify the legacy fallback path may opt in by setting this static
   * to `false` before fixture creation.
   *
   * Production code MUST NOT touch this field.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

  /** @internal */
  private _uid = _nextMeterId();

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

  /** @internal */
  @state()
  private _hasSlotContent = false;

  // ─── Host-canonical ARIA bookkeeping ───

  /** @internal */
  private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /** @internal */
  private _resolvedAccessibleName = '';

  /** @internal */
  private _clampedValue(): number {
    return Math.min(Math.max(this.value, this.min), this.max);
  }

  /** @internal */
  private _percentage(): number {
    const range = this.max - this.min;
    if (range === 0) return 0;
    return ((this._clampedValue() - this.min) / range) * 100;
  }

  /** @internal */
  private _resolveState(): MeterState {
    const v = this._clampedValue();
    const hasLow = this.low !== undefined;
    const hasHigh = this.high !== undefined;
    const hasOptimum = this.optimum !== undefined;

    if (!hasLow && !hasHigh && !hasOptimum) return 'default';

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

  /** @internal */
  private _onLabelSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this._hasSlotContent = slot.assignedNodes({ flatten: true }).length > 0;
    this._syncHostAriaSemantics();
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    const ctor = this.constructor as typeof HelixMeter;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    this.dataset['state'] = this._resolveState();
    const ratio = this._percentage() / 100;
    this.style.setProperty('--_value-ratio', String(Math.max(0, Math.min(1, ratio))));
    if (
      changedProperties.has('value') ||
      changedProperties.has('min') ||
      changedProperties.has('max') ||
      changedProperties.has('low') ||
      changedProperties.has('high') ||
      changedProperties.has('optimum') ||
      changedProperties.has('label')
    ) {
      this._syncHostAriaSemantics();
    }
  }

  /**
   * Mirror meter semantics onto the host via ElementInternals. The inner
   * `[role="meter"]` keeps its existing surface — this method ADDS a host-
   * level surface via internals.* so consumer-supplied `aria-labelledby` /
   * `aria-describedby` on the host project through `ariaLabelledByElements`
   * (cross-shadow IDREF) on engines that support it. Mirrors hx-progress-ring's
   * dual-surface pattern (Group 7 gold-standard exemplar).
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    const clampedValue = this._clampedValue();
    const state = this._resolveState();
    const stateLabel = state !== 'default' ? ` — ${state}` : '';
    const ariaValuetext = `${clampedValue} of ${this.max}${stateLabel}`;

    if (this._supportsIdrefRefs) {
      internals.role = 'meter';
      internals.ariaValueNow = String(clampedValue);
      internals.ariaValueMin = String(this.min);
      internals.ariaValueMax = String(this.max);
      internals.ariaValueText = ariaValuetext;
    } else {
      // Legacy engines: clear host-internals so the inner [role="meter"] is
      // the only announced surface (avoids the duplicate-surface problem).
      internals.role = null;
      internals.ariaLabel = null;
      internals.ariaValueNow = null;
      internals.ariaValueMin = null;
      internals.ariaValueMax = null;
      internals.ariaValueText = null;
    }

    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';
    const consumerLabelledBy = this.getAttribute('aria-labelledby');
    const labelEls = resolveIdrefTokens(this, consumerLabelledBy);
    const hasEffectiveLabelledBy = labelEls.length > 0;

    type InternalsWithRefs = ElementInternals & {
      ariaLabelledByElements: Element[] | null;
    };

    if (this._supportsIdrefRefs) {
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = hasEffectiveLabelledBy ? labelEls : null;
    }

    let resolved = '';
    if (hasEffectiveLabelledBy) {
      const flattened =
        labelEls
          .map((el) => flattenAccName(el))
          .filter(Boolean)
          .join(' ') ||
        hostAriaLabel ||
        this.label ||
        '';
      resolved = flattened || ariaValuetext;
      if (this._supportsIdrefRefs) {
        // Modern path: element refs win; clear ariaLabel so they aren't
        // shadowed by a stale string on the host.
        internals.ariaLabel = null;
      }
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = hostAriaLabel;
      }
    } else if (this._hasSlotContent || this.label !== undefined) {
      resolved = this.label ?? '';
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = resolved || null;
      }
    } else {
      resolved = ariaValuetext;
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = resolved;
      }
    }

    this._resolvedAccessibleName = resolved;
  }

  // ─── WCAG 1.4.1: State label map ───

  /** @internal */
  private static readonly _STATE_LABELS: Partial<Record<MeterState, string>> = {
    optimum: 'Optimum',
    warning: 'Warning',
    danger: 'Danger',
  };

  override render() {
    const state = this._resolveState();
    const clampedValue = this._clampedValue();
    const stateLabel = state !== 'default' ? ` — ${state}` : '';
    const ariaValuetext = `${clampedValue} of ${this.max}${stateLabel}`;
    const hasVisibleLabel = this.label !== undefined || this._hasSlotContent;
    const visibleStateLabel = HelixMeter._STATE_LABELS[state];

    // Inner element keeps role + value-state surface for legacy AT and
    // existing consumer queries. The host carries the cross-shadow IDREF
    // wiring via internals.* (see _syncHostAriaSemantics).
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
          <div part="indicator" class="meter__indicator"></div>
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
