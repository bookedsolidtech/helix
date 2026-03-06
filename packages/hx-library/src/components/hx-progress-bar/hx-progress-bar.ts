import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixProgressBarStyles } from './hx-progress-bar.styles.js';

let idCounter = 0;

/**
 * A linear progress indicator for determinate and indeterminate states.
 *
 * @summary Displays task completion progress or an indeterminate loading state.
 *
 * @tag hx-progress-bar
 *
 * @slot label - Visible label text rendered above the progress bar track.
 *
 * @csspart base - The outer track container element.
 * @csspart indicator - The filled portion indicating progress.
 * @csspart label - The label slot wrapper element.
 *
 * @fires {CustomEvent} hx-complete - Dispatched when value reaches max (completion).
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
 */
@customElement('hx-progress-bar')
export class HelixProgressBar extends LitElement {
  static override styles = [tokenStyles, helixProgressBarStyles];

  /**
   * Current progress value (0–max). Set to null for indeterminate state.
   * @attr value
   */
  @property({ type: Number, reflect: true })
  value: number | null = null;

  /**
   * Maximum value for the progress bar.
   * @attr max
   */
  @property({ type: Number, reflect: true })
  max = 100;

  /**
   * Accessible label for the progress bar (maps to aria-label).
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = '';

  /**
   * Explicitly set indeterminate state. When true, the progress bar shows
   * an indeterminate animation regardless of value.
   * @attr indeterminate
   */
  @property({ type: Boolean, reflect: true })
  indeterminate = false;

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

  @state()
  private _complete = false;

  private readonly _labelId = `hx-progress-label-${++idCounter}`;

  private get _isIndeterminate(): boolean {
    return this.indeterminate || this.value === null;
  }

  private get _percentage(): number {
    if (this._isIndeterminate) return 0;
    const clamped = Math.max(0, Math.min(this.value ?? 0, this.max));
    return (clamped / this.max) * 100;
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('value')) {
      const prev = changed.get('value') as number | null;
      const wasComplete = prev !== null && prev !== undefined && prev >= this.max;
      const isComplete = this.value !== null && this.value >= this.max && !this.indeterminate;

      if (isComplete && !wasComplete) {
        this._complete = true;
        this.dispatchEvent(new CustomEvent('hx-complete', { bubbles: true, composed: true }));
      } else if (!isComplete) {
        this._complete = false;
      }
    }
  }

  override render() {
    const classes = {
      'progress-bar': true,
      [`progress-bar--${this.size}`]: true,
      [`progress-bar--${this.variant}`]: true,
      'progress-bar--indeterminate': this._isIndeterminate,
    };

    const indicatorStyle = this._isIndeterminate ? '' : `width: ${this._percentage}%`;
    const ariaValueNow = this._isIndeterminate ? undefined : (this.value ?? 0);
    const useAriaLabelledBy = !this.label;

    return html`
      <div class=${classMap(classes)}>
        <span part="label" class="progress-bar__label" id=${this._labelId}>
          <slot name="label"></slot>
        </span>
        <div
          part="base"
          class="progress-bar__base"
          role="progressbar"
          aria-valuenow=${ifDefined(ariaValueNow)}
          aria-valuemin="0"
          aria-valuemax=${this.max}
          aria-label=${this.label || nothing}
          aria-labelledby=${useAriaLabelledBy ? this._labelId : nothing}
        >
          <div
            part="indicator"
            class="progress-bar__indicator"
            style=${indicatorStyle || nothing}
          ></div>
        </div>
        <span class="progress-bar__live" role="status" aria-live="polite">
          ${this._complete ? 'Complete' : nothing}
        </span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-progress-bar': HelixProgressBar;
  }
}
