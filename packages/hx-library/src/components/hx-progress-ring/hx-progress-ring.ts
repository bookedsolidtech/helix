import { LitElement, html, svg, TemplateResult, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixProgressRingStyles } from './hx-progress-ring.styles.js';
import { devWarn } from '../../utils/dev-warn.js';

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
   * Current progress value (0–max). When null, renders in indeterminate mode.
   * @attr value
   */
  @property({ type: Number, reflect: true })
  value: number | null = null;

  /**
   * Maximum value for the progress range. Defaults to 100. Used for aria-valuemax.
   * @attr max
   */
  @property({ type: Number, reflect: true })
  max = 100;

  /**
   * Size of the ring. Controls SVG diameter.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
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
   * Set this attribute to satisfy WCAG 4.1.2. When absent, aria-busy reflects
   * indeterminate state and a console warning is emitted.
   * @attr label
   */
  @property({ type: String })
  label = '';

  // ─── Private Helpers ───

  /** @internal */
  private get _isIndeterminate(): boolean {
    return this.value === null;
  }

  /** @internal */
  private get _clampedValue(): number {
    if (this.value === null) return 0;
    return Math.min(this.max, Math.max(0, this.value));
  }

  /**
   * SVG viewBox is 100x100. Radius leaves room for the stroke.
   */
  /** @internal */
  private get _radius(): number {
    return (100 - this.strokeWidth) / 2;
  }

  /** @internal */
  private get _circumference(): number {
    return 2 * Math.PI * this._radius;
  }

  /** @internal */
  private get _strokeDashoffset(): number {
    return this._circumference * (1 - this._clampedValue / this.max);
  }

  /** @internal */
  private _labelWarned = false;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Backward compat: accept legacy `size` attribute. When present and `hx-size`
    // is not set, map the value and emit a deprecation warning.
    const legacySize = this.getAttribute('size');
    if (legacySize !== null && !this.hasAttribute('hx-size')) {
      devWarn('hx-progress-ring', 'The "size" attribute is deprecated. Use "hx-size" instead.');
      this.size = legacySize as 'sm' | 'md' | 'lg';
    }
    this.setAttribute('role', 'progressbar');
    this.setAttribute('aria-valuemin', '0');
  }

  protected override willUpdate(_changed: PropertyValues<this>): void {
    // Sync all dynamic ARIA attributes before render
    this.setAttribute('aria-valuemax', String(this.max));

    if (this._isIndeterminate) {
      this.setAttribute('indeterminate', '');
      this.setAttribute('aria-busy', 'true');
      this.removeAttribute('aria-valuenow');
      this.removeAttribute('aria-valuetext');
    } else {
      this.removeAttribute('indeterminate');
      this.removeAttribute('aria-busy');
      this.setAttribute('aria-valuenow', String(this._clampedValue));
      this.setAttribute('aria-valuetext', `${this._clampedValue}% complete`);
    }

    if (this.label) {
      this.setAttribute('aria-label', this.label);
    } else {
      this.removeAttribute('aria-label');
      if (!this._labelWarned) {
        this._labelWarned = true;
        devWarn(
          'hx-progress-ring',
          'Missing accessible label. Set the `label` attribute for WCAG 4.1.2 compliance.',
        );
      }
    }
  }

  // ─── Render ───

  override render(): TemplateResult {
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
