import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixProgressBarStyles } from './hx-progress-bar.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';

const _nextProgressBarId = createIdCounter('hx-progress-bar');

/**
 * A linear progress indicator for determinate and indeterminate states.
 *
 * Group 7 host-canonical: `role="progressbar"` is mirrored onto the **host**
 * via `_internals.role` (cross-shadow IDREF wiring) AND kept on the inner
 * `[role="progressbar"]` track for legacy AT and consumer queries. This is
 * the hx-progress-ring dual-surface pattern (Group 7 gold-standard).
 * Consumer-supplied `aria-labelledby` / `aria-describedby` on the host
 * resolves through the shared IDREF mirror so cross-shadow naming reaches
 * the announced surface even when the labels live in another shadow tree.
 *
 * The internal `aria-live="polite"` announcer for the "Complete" milestone
 * is preserved (`role="progressbar"` does NOT imply a live region — an
 * explicit live announcer is required for value-update announcements).
 *
 * @summary Displays task completion progress or an indeterminate loading state.
 *
 * @tag hx-progress-bar
 *
 * @slot label - Visible label text rendered above the progress bar track.
 *
 * @csspart track - The outer track container element.
 * @csspart fill - The filled portion indicating progress.
 * @csspart label - The label slot wrapper element.
 *
 * @cssprop [--hx-progress-bar-track-bg=var(--hx-color-neutral-100)] - Track background color.
 * @cssprop [--hx-progress-bar-indicator-bg=var(--hx-color-primary-500)] - Indicator fill color.
 * @cssprop [--hx-progress-bar-border-radius=var(--hx-border-radius-full)] - Track border radius.
 * @cssprop [--hx-progress-bar-height-sm=var(--hx-size-1)] - Track height for size="sm".
 * @cssprop [--hx-progress-bar-height-md=var(--hx-size-2)] - Track height for size="md".
 * @cssprop [--hx-progress-bar-height-lg=var(--hx-size-3)] - Track height for size="lg".
 * @cssprop [--hx-progress-bar-label-font-family=var(--hx-font-family-sans)] - Label font family.
 * @cssprop [--hx-progress-bar-label-font-size=var(--hx-font-size-sm)] - Label font size.
 * @cssprop [--hx-progress-bar-label-font-weight=var(--hx-font-weight-medium)] - Label font weight.
 * @cssprop [--hx-progress-bar-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-line-height-tight] - Line height.
 * @cssprop [--hx-border-radius-full] - Border radius.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-color-success-700] - Color.
 * @cssprop [--hx-color-warning-500] - Color.
 * @cssprop [--hx-color-error-500] - Color.
 * @cssprop [--hx-progress-bar-indeterminate-duration=1.5s] - Animation duration for indeterminate state.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 *
 * @fires {CustomEvent} hx-complete - Emitted when progress reaches 100%.
 */
@customElement('hx-progress-bar')
export class HelixProgressBar extends HelixElement {
  static override styles = [helixProgressBarStyles, forcedColorsSurface];

  /**
   * Test seam (Group 7 host-canonical migration): see other Group 7 components.
   * Production code MUST NOT touch this field.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

  /**
   * Current progress value (min–max). Set to null for indeterminate state.
   * @attr value
   */
  @property({ type: Number, reflect: true })
  value: number | null = null;

  /**
   * Minimum value for the progress bar.
   * @attr min
   */
  @property({ type: Number, reflect: true })
  min = 0;

  /**
   * Maximum value for the progress bar.
   * @attr max
   */
  @property({ type: Number, reflect: true })
  max = 100;

  /**
   * When true, displays an animated indeterminate loading state regardless of value.
   * @attr indeterminate
   */
  @property({ type: Boolean, reflect: true })
  indeterminate = false;

  /**
   * Accessible label for the progress bar (maps to aria-label when no label slot content is used).
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = '';

  /**
   * Additional description for the progress operation, linked via aria-describedby.
   * @attr description
   */
  @property({ type: String, reflect: true })
  description = '';

  /**
   * Size of the progress bar track.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Visual variant controlling the indicator color.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'success' | 'warning' | 'danger' = 'default';

  /** @internal */
  @state() private _liveMessage = '';
  /** @internal */
  @state() private _hasLabelSlotContent = false;
  /** @internal */
  private _warnedAboutLabel = false;

  /** @internal */
  private _uid = _nextProgressBarId();

  // ─── Host-canonical ARIA bookkeeping ───

  /** @internal */
  private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /** @internal */
  private _resolvedAccessibleName = '';

  /** @internal */
  private get _isIndeterminate(): boolean {
    return this.indeterminate || this.value === null;
  }

  /** @internal */
  private get _percentage(): number {
    if (this._isIndeterminate) return 0;
    if (this.value !== null && isNaN(this.value)) {
      devWarn('hx-progress-bar', 'Invalid value: NaN. Defaulting to 0.');
      return 0;
    }
    const range = this.max - this.min;
    if (range <= 0) return 0;
    const clamped = Math.max(this.min, Math.min(this.value ?? this.min, this.max));
    return ((clamped - this.min) / range) * 100;
  }

  /** @internal */
  private get _isComplete(): boolean {
    return !this._isIndeterminate && this.value !== null && this.value >= this.max;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const ctor = this.constructor as typeof HelixProgressBar;
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

  override updated(changedProps: PropertyValues<this>): void {
    super.updated(changedProps);
    if ((changedProps.has('value') || changedProps.has('max')) && this._isComplete) {
      this._liveMessage = 'Complete';
      this.dispatchEvent(new CustomEvent<void>('hx-complete', { bubbles: true, composed: true }));
    } else if (changedProps.has('value') && !this._isComplete) {
      this._liveMessage = '';
    }

    if (
      changedProps.has('value') ||
      changedProps.has('min') ||
      changedProps.has('max') ||
      changedProps.has('indeterminate')
    ) {
      const ratio = this._isIndeterminate ? 0 : this._percentage / 100;
      this.style.setProperty('--_value-ratio', String(Math.max(0, Math.min(1, ratio))));
    }

    if (
      changedProps.has('value') ||
      changedProps.has('min') ||
      changedProps.has('max') ||
      changedProps.has('indeterminate') ||
      changedProps.has('label') ||
      changedProps.has('description') ||
      changedProps.has('variant')
    ) {
      this._syncHostAriaSemantics();
    }

    if (!this.label && !this._warnedAboutLabel) {
      this._warnedAboutLabel = true;
      devWarn(
        'hx-progress-bar',
        'No accessible label provided. Set the `label` attribute or use the label slot. An unlabeled progressbar violates WCAG 2.1 AA (4.1.2 Name, Role, Value).',
      );
    }
  }

  /** @internal */
  private _onLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlotContent = slot.assignedNodes({ flatten: true }).length > 0;
    this._syncHostAriaSemantics();
  }

  /**
   * Mirror progressbar semantics onto the host. Dual-surface: inner track
   * keeps role + value-state, host adds the cross-shadow IDREF wiring via
   * internals.* (the hx-progress-ring exemplar pattern).
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    const isIndeterminate = this._isIndeterminate;
    const variantLabel = this._variantLabel;
    const percentageText = isIndeterminate ? 'In progress' : `${Math.round(this._percentage)}%`;
    const ariaValuetext = variantLabel ? `${percentageText} — ${variantLabel}` : percentageText;
    const ariaValueNow = isIndeterminate ? null : String(this.value ?? this.min);

    if (this._supportsIdrefRefs) {
      internals.role = 'progressbar';
      internals.ariaValueNow = ariaValueNow;
      internals.ariaValueMin = String(this.min);
      internals.ariaValueMax = String(this.max);
      internals.ariaValueText = ariaValuetext;
      internals.ariaBusy = isIndeterminate ? 'true' : null;
    } else {
      internals.role = null;
      internals.ariaLabel = null;
      internals.ariaValueNow = null;
      internals.ariaValueMin = null;
      internals.ariaValueMax = null;
      internals.ariaValueText = null;
      internals.ariaBusy = null;
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

    let resolved: string;
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
        internals.ariaLabel = null;
      }
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = hostAriaLabel;
      }
    } else if (this.label) {
      // CodeRabbit MUST-FIX: precedence ladder is host aria-labelledby >
      // host aria-label > `label` property > slotted text > default.
      // The `label` property explicitly wins over slotted text so the
      // host-canonical name does not get clobbered when both are present.
      resolved = this.label;
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = resolved;
      }
    } else if (this._hasLabelSlotContent) {
      // Slotted text fallback: leave `internals.ariaLabel` null so AT
      // walks the host subtree (slotted span) for the accessible name.
      // The inner `<div role="progressbar">` already wires
      // `aria-labelledby` to the slotted label span on the fallback path.
      resolved = '';
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = null;
      }
    } else {
      resolved = '';
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = null;
      }
    }

    this._resolvedAccessibleName = resolved;
  }

  /** @internal */
  private static readonly _VARIANT_LABELS: Partial<Record<HelixProgressBar['variant'], string>> = {
    success: 'Success',
    warning: 'Warning',
    danger: 'Danger',
  };

  /** @internal */
  private get _variantLabel(): string {
    return HelixProgressBar._VARIANT_LABELS[this.variant] ?? '';
  }

  override render() {
    const labelId = `${this._uid}-label`;
    const descId = this.description ? `${this._uid}-desc` : undefined;
    const hasVisibleLabel = this._hasLabelSlotContent;

    const classes = {
      'progress-bar': true,
      [`progress-bar--${this.size}`]: true,
      [`progress-bar--${this.variant}`]: true,
      'progress-bar--indeterminate': this._isIndeterminate,
    };

    const ariaValueNow = this._isIndeterminate ? undefined : (this.value ?? this.min);
    const variantLabel = this._variantLabel;

    const percentageText = this._isIndeterminate
      ? 'In progress'
      : `${Math.round(this._percentage)}%`;
    const ariaValuetext = variantLabel ? `${percentageText} — ${variantLabel}` : percentageText;

    return html`
      <div class=${classMap(classes)}>
        ${hasVisibleLabel || this.label
          ? html`<span id=${labelId} part="label" class="progress-bar__label">
              <slot name="label" @slotchange=${this._onLabelSlotChange}></slot>
            </span>`
          : html`<slot name="label" @slotchange=${this._onLabelSlotChange} hidden></slot>`}
        ${this.description
          ? html`<span id=${descId} class="sr-only">${this.description}</span>`
          : nothing}
        <div
          part="track"
          class="progress-bar__track"
          role="progressbar"
          aria-valuenow=${ifDefined(ariaValueNow)}
          aria-valuemin=${this.min}
          aria-valuemax=${this.max}
          aria-valuetext=${ariaValuetext}
          aria-label=${ifDefined(!hasVisibleLabel && this.label ? this.label : undefined)}
          aria-labelledby=${ifDefined(hasVisibleLabel ? labelId : undefined)}
          aria-describedby=${ifDefined(descId)}
        >
          <div part="fill" class="progress-bar__fill"></div>
        </div>
        ${variantLabel
          ? html`<span class="sr-only progress-bar__variant-label">${variantLabel}</span>`
          : nothing}
        <div aria-live="polite" aria-atomic="true" class="sr-only">${this._liveMessage}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-progress-bar': HelixProgressBar;
  }
}
