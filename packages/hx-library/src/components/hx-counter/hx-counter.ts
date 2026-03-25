import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixCounterStyles } from './hx-counter.styles.js';
import { devWarn } from '../../utils/dev-warn.js';

export type CounterSize = 'sm' | 'md' | 'lg';
export type CounterEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
export type CounterFormat = 'integer' | 'decimal';

/**
 * Animated number counter that counts from 0 (or the previous value) to the
 * target value using requestAnimationFrame. Respects prefers-reduced-motion.
 *
 * @summary Displays an animated numeric counter that transitions to a target value.
 *
 * @tag hx-counter
 *
 * @csspart counter - The outer counter element.
 *
 * @cssprop [--hx-counter-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-counter-font-weight=var(--hx-font-weight-bold)] - Font weight.
 * @cssprop [--hx-counter-color=var(--hx-color-neutral-900)] - Counter text color.
 * @cssprop [--hx-counter-font-size-sm=var(--hx-font-size-xl)] - Font size at sm.
 * @cssprop [--hx-counter-font-size-md=var(--hx-font-size-3xl)] - Font size at md.
 * @cssprop [--hx-counter-font-size-lg=var(--hx-font-size-5xl)] - Font size at lg.
 */
@customElement('hx-counter')
export class HelixCounter extends LitElement {
  static override styles = [tokenStyles, helixCounterStyles];

  /**
   * The target numeric value to count to.
   * @attr value
   */
  @property({ type: Number })
  value = 0;

  /**
   * Animation duration in milliseconds.
   * @attr duration
   */
  @property({ type: Number })
  duration = 1000;

  /**
   * Easing function applied to the animation progress.
   * @attr easing
   */
  @property({ type: String })
  easing: CounterEasing = 'ease-out';

  /**
   * Number format. 'integer' rounds to the nearest whole number;
   * 'decimal' shows two decimal places.
   * @attr format
   */
  @property({ type: String })
  format: CounterFormat = 'integer';

  /**
   * String prepended to the formatted value (e.g., '$').
   * @attr prefix
   */
  @property({ type: String })
  prefix = '';

  /**
   * String appended to the formatted value (e.g., '%').
   * @attr suffix
   */
  @property({ type: String })
  suffix = '';

  /**
   * Size variant controlling font size.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: CounterSize = 'md';

  // ─── Internal State ───

  /** @internal */
  @state() private _displayValue = 0;

  /** @internal */
  private _animationId: number | null = null;
  /** @internal */
  private _startTime: number | null = null;
  /** @internal */
  private _startValue = 0;
  /** @internal */
  private _prefersReducedMotion = false;
  /** @internal */
  private _motionMql: MediaQueryList | null = null;
  /** @internal */
  private readonly _handleMotionChange = (e: MediaQueryListEvent): void => {
    this._prefersReducedMotion = e.matches;
    if (this._prefersReducedMotion) {
      this._cancelAnimation();
      this._displayValue = this.value;
    }
  };

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Backward compat: accept legacy `size` attribute. When present and `hx-size`
    // is not set, map the value and emit a deprecation warning.
    const legacySize = this.getAttribute('size');
    if (legacySize !== null && !this.hasAttribute('hx-size')) {
      devWarn('hx-counter', 'The "size" attribute is deprecated. Use "hx-size" instead.');
      this.size = legacySize as CounterSize;
    }

    // Guard for SSR — window.matchMedia and requestAnimationFrame are unavailable server-side
    if (typeof window === 'undefined') {
      this._displayValue = this.value;
      return;
    }

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._motionMql = mq;
    this._prefersReducedMotion = mq.matches;
    mq.addEventListener('change', this._handleMotionChange);

    if (this._prefersReducedMotion) {
      this._displayValue = this.value;
    } else {
      this._startAnimation();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._cancelAnimation();
    this._motionMql?.removeEventListener('change', this._handleMotionChange);
    this._motionMql = null;
  }

  override updated(changedProps: PropertyValues<this>): void {
    super.updated(changedProps);
    if (changedProps.has('value') && changedProps.get('value') !== undefined) {
      if (this._prefersReducedMotion) {
        this._displayValue = this.value;
      } else {
        this._startValue = this._displayValue;
        this._startTime = null;
        this._startAnimation();
      }
    }
  }

  // ─── Animation ───

  /** @internal */
  private _cancelAnimation(): void {
    if (this._animationId !== null) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }

  /** @internal */
  private _applyEasing(t: number): number {
    switch (this.easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return t * (2 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
  }

  /** @internal */
  private _startAnimation(): void {
    this._cancelAnimation();

    const step = (timestamp: number): void => {
      if (this._startTime === null) {
        this._startTime = timestamp;
      }

      const elapsed = timestamp - this._startTime;
      const rawProgress = Math.min(elapsed / this.duration, 1);
      const easedProgress = this._applyEasing(rawProgress);

      this._displayValue = this._startValue + (this.value - this._startValue) * easedProgress;

      if (rawProgress < 1) {
        this._animationId = requestAnimationFrame(step);
      } else {
        this._displayValue = this.value;
        this._animationId = null;
      }
    };

    this._animationId = requestAnimationFrame(step);
  }

  // ─── Formatting ───

  /** @internal */
  private _formatValue(): string {
    const num =
      this.format === 'integer'
        ? Math.round(this._displayValue)
        : parseFloat(this._displayValue.toFixed(2));

    return `${this.prefix}${num.toLocaleString()}${this.suffix}`;
  }

  // ─── Render ───

  override render() {
    const classes = {
      counter: true,
      [`counter--${this.size}`]: true,
    };

    return html`
      <span part="counter" class=${classMap(classes)} aria-live="polite" aria-atomic="true">
        ${this._formatValue()}
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-counter': HelixCounter;
  }
}
