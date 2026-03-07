import { LitElement, html, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixProgressRingStyles } from './hx-progress-ring.styles.js';

/**
 * SVG-based circular progress indicator. Supports determinate and indeterminate modes,
 * multiple size variants, semantic color variants, and a center content slot.
 *
 * @summary Circular progress ring for indicating operation progress or loading state.
 *
 * @tag hx-progress-ring
 *
 * @slot - Default slot for center content (percentage text, icon, etc.).
 *
 * @csspart base - The SVG element.
 * @csspart track - The background circle track.
 * @csspart indicator - The progress arc indicator.
 * @csspart label - The center slot wrapper div.
 *
 * @cssprop [--hx-progress-ring-track-color=var(--hx-color-neutral-200)] - Track stroke color.
 * @cssprop [--hx-progress-ring-indicator-color=var(--hx-color-primary-500)] - Indicator stroke color.
 * @cssprop [--hx-progress-ring-label-color=var(--hx-color-neutral-900)] - Center label text color.
 */
@customElement('hx-progress-ring')
export class HelixProgressRing extends LitElement {
  static override styles = [tokenStyles, helixProgressRingStyles];

  // ─── Public Properties ───

  /**
   * Current progress value (0–100). When null, renders in indeterminate mode.
   * @attr value
   */
  @property({ type: Number, reflect: true })
  value: number | null = null;

  /**
   * Size of the ring. Controls SVG diameter.
   * @attr size
   */
  @property({ type: String, reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Stroke width of the ring circles in SVG user units.
   * @attr stroke-width
   */
  @property({ type: Number, attribute: 'stroke-width', reflect: true })
  strokeWidth = 4;

  /**
   * Semantic color variant.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'success' | 'warning' | 'danger' = 'default';

  /**
   * Accessible label for the progressbar. Exposed as aria-label.
   * @attr label
   */
  @property({ type: String })
  label = '';

  // ─── Private Helpers ───

  private get _isIndeterminate(): boolean {
    return this.value === null;
  }

  private get _clampedValue(): number {
    if (this.value === null) return 0;
    return Math.min(100, Math.max(0, this.value));
  }

  /**
   * SVG viewBox is 100x100. Radius leaves room for the stroke.
   */
  private get _radius(): number {
    return (100 - this.strokeWidth) / 2;
  }

  private get _circumference(): number {
    return 2 * Math.PI * this._radius;
  }

  private get _strokeDashoffset(): number {
    return this._circumference * (1 - this._clampedValue / 100);
  }

  // ─── Lifecycle ───

  override firstUpdated(): void {
    this.setAttribute('role', 'progressbar');
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', '100');
    this._syncState();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('value') || changed.has('label')) {
      this._syncState();
    }
  }

  private _syncState(): void {
    if (this._isIndeterminate) {
      this.setAttribute('indeterminate', '');
      this.removeAttribute('aria-valuenow');
    } else {
      this.removeAttribute('indeterminate');
      this.setAttribute('aria-valuenow', String(this._clampedValue));
    }

    if (this.label) {
      this.setAttribute('aria-label', this.label);
    } else {
      this.removeAttribute('aria-label');
    }
  }

  // ─── Render ───

  override render() {
    const cx = 50;
    const cy = 50;
    const r = this._radius;
    const circumference = this._circumference;

    return html`
      <div class="progress-ring">
        <svg
          class="progress-ring__svg"
          part="base"
          viewBox="0 0 100 100"
          aria-hidden="true"
          focusable="false"
        >
          ${svg`
            <circle
              class="progress-ring__track"
              part="track"
              cx=${cx}
              cy=${cy}
              r=${r}
              stroke-width=${this.strokeWidth}
            />
            <circle
              class="progress-ring__indicator"
              part="indicator"
              cx=${cx}
              cy=${cy}
              r=${r}
              stroke-width=${this.strokeWidth}
              stroke-dasharray=${
                this._isIndeterminate ? '1 200' : `${circumference} ${circumference}`
              }
              stroke-dashoffset=${this._isIndeterminate ? '0' : this._strokeDashoffset}
            />
          `}
        </svg>
        <div class="progress-ring__label" part="label">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-progress-ring': HelixProgressRing;
  }
}
