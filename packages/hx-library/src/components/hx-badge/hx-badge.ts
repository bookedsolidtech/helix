import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixBadgeStyles } from './hx-badge.styles.js';

/**
 * A small status indicator for notifications, counts, and labels.
 *
 * @summary Presentational badge for status indicators, notification counts, and labels.
 *
 * @tag hx-badge
 *
 * @slot - Default slot for badge content (text, number). When empty with pulse enabled, renders as a dot indicator.
 *
 * @csspart badge - The badge element.
 *
 * @cssprop [--hx-badge-bg=var(--hx-color-primary-500)] - Badge background color.
 * @cssprop [--hx-badge-color=var(--hx-color-neutral-0)] - Badge text color.
 * @cssprop [--hx-badge-font-size] - Badge font size (set per size variant).
 * @cssprop [--hx-badge-font-weight=var(--hx-font-weight-semibold)] - Badge font weight.
 * @cssprop [--hx-badge-font-family=var(--hx-font-family-sans)] - Badge font family.
 * @cssprop [--hx-badge-border-radius=var(--hx-border-radius-md)] - Badge border radius.
 * @cssprop [--hx-badge-padding-x] - Badge horizontal padding (set per size variant).
 * @cssprop [--hx-badge-padding-y] - Badge vertical padding (set per size variant).
 * @cssprop [--hx-badge-pulse-color] - Pulse color matching variant background with reduced opacity.
 * @cssprop [--hx-badge-dot-size=var(--hx-size-2)] - Dot indicator size when rendered without content.
 */
@customElement('hx-badge')
export class HelixBadge extends LitElement {
  static override styles = [tokenStyles, helixBadgeStyles];

  /**
   * Visual style variant of the badge.
   * @attr variant
   * @default 'primary'
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'success' | 'warning' | 'error' | 'neutral' = 'primary';

  /**
   * Size of the badge.
   * @attr hx-size
   * @default 'md'
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the badge uses fully rounded (pill) styling.
   * @attr pill
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  pill = false;

  /**
   * Whether the badge displays an animated pulse for attention.
   * @attr pulse
   * @default false
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

  // ─── Extension API ───

  /**
   * Override to customize the CSS classes applied to the badge element.
   * Called during render. Merge with super's result to preserve base styling.
   * @protected
   * @since 1.0.0
   */
  protected getBadgeClasses(): Record<string, boolean> {
    const isDot = !this._hasSlotContent && this.pulse;
    return {
      badge: true,
      [`badge--${this.variant}`]: true,
      [`badge--${this.size}`]: true,
      'badge--pill': this.pill,
      'badge--pulse': this.pulse,
      'badge--dot': isDot,
    };
  }

  /**
   * Override to customize the content rendered inside the badge span.
   * @protected
   * @since 1.0.0
   */
  protected renderContent(): unknown {
    return html`<slot @slotchange=${this._handleSlotChange}></slot>`;
  }

  // ─── Render ───

  override render() {
    return html`
      <span part="badge" class=${classMap(this.getBadgeClasses())}>
        ${this.renderContent()}
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-badge': HelixBadge;
  }
}
