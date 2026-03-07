import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixProgressBarStyles } from './hx-progress-bar.styles.js';

/**
 * A linear progress indicator for determinate and indeterminate states.
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
 */
@customElement('hx-progress-bar')
export class HelixProgressBar extends LitElement {
  static override styles = [tokenStyles, helixProgressBarStyles];

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

  @state() private _liveMessage = '';

  private get _isIndeterminate(): boolean {
    return this.indeterminate || this.value === null;
  }

  private get _percentage(): number {
    if (this._isIndeterminate) return 0;
    const range = this.max - this.min;
    if (range <= 0) return 0;
    const clamped = Math.max(this.min, Math.min(this.value ?? this.min, this.max));
    return ((clamped - this.min) / range) * 100;
  }

  private get _isComplete(): boolean {
    return !this._isIndeterminate && this.value !== null && this.value >= this.max;
  }

  override updated(changedProps: Map<string, unknown>): void {
    if ((changedProps.has('value') || changedProps.has('max')) && this._isComplete) {
      this._liveMessage = 'Complete';
      this.dispatchEvent(new CustomEvent('hx-complete', { bubbles: true, composed: true }));
    } else if (changedProps.has('value') && !this._isComplete) {
      this._liveMessage = '';
    }

    if (!this.label) {
      console.warn(
        '[hx-progress-bar] No accessible label provided. Set the `label` attribute or use the label slot. An unlabeled progressbar violates WCAG 2.1 AA (4.1.2 Name, Role, Value).',
      );
    }
  }

  override render() {
    const labelId = `${this.id || 'hx-pb'}-label`;
    const descId = this.description ? `${this.id || 'hx-pb'}-desc` : undefined;

    const classes = {
      'progress-bar': true,
      [`progress-bar--${this.size}`]: true,
      [`progress-bar--${this.variant}`]: true,
      'progress-bar--indeterminate': this._isIndeterminate,
    };

    const indicatorStyle = this._isIndeterminate ? '' : `width: ${this._percentage}%`;
    const ariaValueNow = this._isIndeterminate ? undefined : (this.value ?? this.min);

    return html`
      <div class=${classMap(classes)}>
        <span id=${labelId} part="label" class="progress-bar__label">
          <slot name="label"></slot>
        </span>
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
          aria-label=${this.label || nothing}
          aria-labelledby=${labelId}
          aria-describedby=${ifDefined(descId)}
        >
          <div part="fill" class="progress-bar__fill" style=${indicatorStyle || nothing}></div>
        </div>
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
