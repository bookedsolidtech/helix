import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@wc-2026/tokens/lit';
import { wcBadgeStyles } from './wc-badge.styles.js';

/**
 * A small status indicator for notifications, counts, and labels.
 *
 * @summary Presentational badge for status indicators, notification counts, and labels.
 *
 * @tag wc-badge
 *
 * @slot - Default slot for badge content (text, number). When empty with pulse enabled, renders as a dot indicator.
 *
 * @csspart badge - The badge element.
 *
 * @cssprop [--wc-badge-bg=var(--wc-color-primary-500)] - Badge background color.
 * @cssprop [--wc-badge-color=var(--wc-color-neutral-0)] - Badge text color.
 * @cssprop [--wc-badge-font-size] - Badge font size (set per size variant).
 * @cssprop [--wc-badge-font-weight=var(--wc-font-weight-semibold)] - Badge font weight.
 * @cssprop [--wc-badge-font-family=var(--wc-font-family-sans)] - Badge font family.
 * @cssprop [--wc-badge-border-radius=var(--wc-border-radius-md)] - Badge border radius.
 * @cssprop [--wc-badge-padding-x] - Badge horizontal padding (set per size variant).
 * @cssprop [--wc-badge-padding-y] - Badge vertical padding (set per size variant).
 * @cssprop [--wc-badge-pulse-color] - Pulse color matching variant background with reduced opacity.
 * @cssprop [--wc-badge-dot-size=var(--wc-size-2)] - Dot indicator size when rendered without content.
 */
@customElement('wc-badge')
export class WcBadge extends LitElement {
  static override styles = [tokenStyles, wcBadgeStyles];

  /**
   * Visual style variant of the badge.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'success' | 'warning' | 'error' | 'neutral' = 'primary';

  /**
   * Size of the badge.
   * @attr wc-size
   */
  @property({ type: String, reflect: true, attribute: 'wc-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the badge uses fully rounded (pill) styling.
   * @attr pill
   */
  @property({ type: Boolean, reflect: true })
  pill = false;

  /**
   * Whether the badge displays an animated pulse for attention.
   * @attr pulse
   */
  @property({ type: Boolean, reflect: true })
  pulse = false;

  /**
   * Tracks whether the default slot has assigned content.
   */
  @state()
  private _hasSlotContent = false;

  // ─── Slot Change Handling ───

  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const nodes = slot.assignedNodes({ flatten: true });
    // Check if any assigned node has non-whitespace content
    this._hasSlotContent = nodes.some((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) return true;
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent ?? '').trim().length > 0;
      }
      return false;
    });
  }

  // ─── Render ───

  override render() {
    const isDot = !this._hasSlotContent && this.pulse;

    const classes = {
      badge: true,
      [`badge--${this.variant}`]: true,
      [`badge--${this.size}`]: true,
      'badge--pill': this.pill,
      'badge--pulse': this.pulse,
      'badge--dot': isDot,
    };

    return html`
      <span part="badge" class=${classMap(classes)}>
        <slot @slotchange=${this._handleSlotChange}></slot>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wc-badge': WcBadge;
  }
}
