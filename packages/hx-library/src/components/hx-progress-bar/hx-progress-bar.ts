import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixProgressBarStyles } from './hx-progress-bar.styles.js';

/** Progress bar variant determines the fill color. */
type ProgressBarVariant = 'primary' | 'success' | 'warning' | 'danger';

/**
 * A linear progress indicator for displaying operation completion status.
 * Supports determinate and indeterminate modes for healthcare workflows.
 *
 * @summary Linear progress bar with determinate and indeterminate states.
 *
 * @tag hx-progress-bar
 *
 * @slot label - Custom label content. When provided, replaces the `label` property text.
 *
 * @csspart bar - The outer track container element.
 * @csspart track - The track background element.
 * @csspart fill - The progress fill element.
 * @csspart label - The label container element.
 * @csspart value - The displayed percentage value text.
 *
 * @cssprop [--hx-progress-bar-fill-bg=var(--hx-color-primary-500)] - Fill background color.
 * @cssprop [--hx-progress-bar-track-bg=var(--hx-color-neutral-200)] - Track background color.
 * @cssprop [--hx-progress-bar-height=var(--hx-space-2)] - Height of the progress bar track.
 * @cssprop [--hx-progress-bar-border-radius=var(--hx-border-radius-full)] - Border radius of track and fill.
 * @cssprop [--hx-progress-bar-label-color=var(--hx-color-neutral-700)] - Label and value text color.
 * @cssprop [--hx-progress-bar-font-size=var(--hx-font-size-sm)] - Label and value font size.
 * @cssprop [--hx-progress-bar-font-weight=var(--hx-font-weight-semibold)] - Label and value font weight.
 * @cssprop [--hx-progress-bar-font-family=var(--hx-font-family-sans)] - Label and value font family.
 * @cssprop [--hx-progress-bar-gap=var(--hx-space-1)] - Gap between label row and track.
 */
@customElement('hx-progress-bar')
export class HelixProgressBar extends LitElement {
  static override styles = [tokenStyles, helixProgressBarStyles];

  // ─── Properties ───

  /**
   * Current progress value (0 to max).
   * @attr value
   */
  @property({ type: Number, reflect: true })
  value = 0;

  /**
   * Maximum value for the progress bar.
   * @attr max
   */
  @property({ type: Number, reflect: true })
  max = 100;

  /**
   * When true, displays an animated indeterminate loading state.
   * No aria-valuenow is set in this mode.
   * @attr indeterminate
   */
  @property({ type: Boolean, reflect: true })
  indeterminate = false;

  /**
   * Visual variant that determines the fill color.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: ProgressBarVariant = 'primary';

  /**
   * Accessible label text. Used when the label slot is not populated.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = '';

  /**
   * When true, displays the calculated percentage next to the label.
   * @attr show-value
   */
  @property({ type: Boolean, reflect: true, attribute: 'show-value' })
  showValue = false;

  // ─── Internal State ───

  /**
   * Tracks whether the label slot has assigned content.
   */
  @state()
  private _hasLabelSlotContent = false;

  // ─── Private Helpers ───

  /** Returns the clamped value between 0 and max. */
  private get _clampedValue(): number {
    return Math.min(Math.max(this.value, 0), this.max);
  }

  /** Returns the percentage (0–100), rounded to the nearest integer. */
  private get _percentage(): number {
    if (this.max <= 0) return 0;
    return Math.round((this._clampedValue / this.max) * 100);
  }

  // ─── Slot Handling ───

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const nodes = slot.assignedNodes({ flatten: true });
    this._hasLabelSlotContent = nodes.some((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) return true;
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent ?? '').trim().length > 0;
      }
      return false;
    });
  }

  // ─── Render ───

  override render() {
    const percentage = this._percentage;

    const barClasses = {
      bar: true,
      [`bar--${this.variant}`]: true,
      'bar--indeterminate': this.indeterminate,
    };

    const fillClasses = {
      bar__fill: true,
      'bar__fill--indeterminate': this.indeterminate,
    };

    const fillStyles = this.indeterminate ? {} : { width: `${percentage}%` };

    const hasLabel = this._hasLabelSlotContent || this.label.length > 0;

    return html`
      <div
        part="bar"
        class=${classMap(barClasses)}
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax=${this.max}
        aria-valuenow=${ifDefined(this.indeterminate ? undefined : this._clampedValue)}
        aria-label=${ifDefined(
          !this._hasLabelSlotContent && this.label.length > 0 ? this.label : undefined,
        )}
        aria-labelledby=${ifDefined(this._hasLabelSlotContent ? 'label' : undefined)}
      >
        ${hasLabel
          ? html`
              <div part="label" class="bar__label" id="label">
                <slot name="label" @slotchange=${this._handleLabelSlotChange}> ${this.label} </slot>
                ${this.showValue && !this.indeterminate
                  ? html`<span part="value" class="bar__value">${percentage}%</span>`
                  : nothing}
              </div>
            `
          : html`<slot name="label" @slotchange=${this._handleLabelSlotChange} hidden></slot>`}

        <div part="track" class="bar__track">
          <div part="fill" class=${classMap(fillClasses)} style=${styleMap(fillStyles)}></div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-progress-bar': HelixProgressBar;
  }
}
