import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { devWarn } from '../../utils/dev-warn.js';
import { helixStatStyles } from './hx-stat.styles.js';

export type StatSize = 'sm' | 'md' | 'lg';
export type StatTrend = 'up' | 'down' | 'neutral';

/**
 * A static stat display component for presenting key metrics in a healthcare dashboard.
 *
 * @summary Displays a labeled metric value with optional trend indicator and icon slot.
 *
 * @tag hx-stat
 *
 * @slot icon - Optional icon displayed alongside the stat value.
 *
 * @csspart container - The outer stat container element.
 * @csspart header - The row containing the value and optional icon.
 * @csspart value - The stat value element.
 * @csspart label - The stat label element.
 * @csspart trend - The trend indicator element (only rendered when trend is not 'neutral').
 * @csspart icon - The icon slot container.
 *
 * @cssprop [--hx-stat-gap=var(--hx-space-1)] - Gap between value and label.
 * @cssprop [--hx-stat-header-gap=var(--hx-space-2)] - Gap between icon and value in the header row.
 * @cssprop [--hx-stat-color=var(--hx-color-neutral-800)] - Default text color.
 * @cssprop [--hx-stat-value-color=var(--hx-color-neutral-900)] - Value text color.
 * @cssprop [--hx-stat-label-color=var(--hx-color-neutral-500)] - Label text color.
 * @cssprop [--hx-stat-icon-color=var(--hx-color-primary-500)] - Icon color.
 * @cssprop [--hx-stat-value-font-weight=var(--hx-font-weight-bold)] - Value font weight.
 * @cssprop [--hx-stat-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-stat-value-font-size-sm=var(--hx-font-size-xl)] - Value font size at sm.
 * @cssprop [--hx-stat-value-font-size-md=var(--hx-font-size-3xl)] - Value font size at md.
 * @cssprop [--hx-stat-value-font-size-lg=var(--hx-font-size-5xl)] - Value font size at lg.
 * @cssprop [--hx-stat-label-font-size-sm=var(--hx-font-size-xs)] - Label font size at sm.
 * @cssprop [--hx-stat-label-font-size-md=var(--hx-font-size-sm)] - Label font size at md.
 * @cssprop [--hx-stat-label-font-size-lg=var(--hx-font-size-md)] - Label font size at lg.
 * @cssprop [--hx-stat-trend-up-color=var(--hx-color-success-700)] - Trend up text color.
 * @cssprop [--hx-stat-trend-up-bg=var(--hx-color-success-50)] - Trend up background color.
 * @cssprop [--hx-stat-trend-down-color=var(--hx-color-error-700)] - Trend down text color.
 * @cssprop [--hx-stat-trend-down-bg=var(--hx-color-error-50)] - Trend down background color.
 */
@customElement('hx-stat')
export class HelixStat extends LitElement {
  static override styles = [tokenStyles, helixStatStyles];

  /**
   * The metric label displayed below the value.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = '';

  /**
   * The metric value displayed prominently.
   * @attr value
   */
  @property({ type: String, reflect: true })
  value = '';

  /**
   * Trend direction indicator. 'neutral' hides the indicator.
   * @attr trend
   */
  @property({ type: String, reflect: true })
  trend: StatTrend = 'neutral';

  /**
   * Size variant controlling font size.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: StatSize = 'md';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Backward compat: accept legacy `size` attribute. When present and `hx-size`
    // is not set, map the value and emit a deprecation warning.
    const legacySize = this.getAttribute('size');
    if (legacySize !== null && !this.hasAttribute('hx-size')) {
      devWarn('hx-stat', 'The "size" attribute is deprecated. Use "hx-size" instead.');
      this.size = legacySize as StatSize;
    }
  }

  // ─── Slot Detection ───

  @state() private _hasIcon = false;

  private _onIconSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasIcon = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Render Helpers ───

  private _renderTrendArrow(trend: 'up' | 'down'): ReturnType<typeof html> {
    if (trend === 'up') {
      return html`
        <svg
          class="stat__trend-arrow"
          aria-hidden="true"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 10V2M6 2L2 6M6 2L10 6"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      `;
    }
    return html`
      <svg
        class="stat__trend-arrow"
        aria-hidden="true"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 2V10M6 10L2 6M6 10L10 6"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }

  // ─── Render ───

  override render() {
    const containerClasses = {
      stat: true,
      [`stat--${this.size}`]: true,
    };

    const hasTrend = this.trend !== 'neutral';

    return html`
      <div part="container" class=${classMap(containerClasses)}>
        <div part="header" class="stat__header">
          <span part="icon" class="stat__icon" ?hidden=${!this._hasIcon}>
            <slot name="icon" @slotchange=${this._onIconSlotChange}></slot>
          </span>
          <span part="value" class="stat__value">${this.value}</span>
          ${hasTrend
            ? html`
                <span
                  part="trend"
                  class="stat__trend stat__trend--${this.trend}"
                  role="img"
                  aria-label="Trend: ${this.trend}"
                >
                  ${this._renderTrendArrow(this.trend as 'up' | 'down')}
                </span>
              `
            : nothing}
        </div>
        <span part="label" class="stat__label">${this.label}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-stat': HelixStat;
  }
}
