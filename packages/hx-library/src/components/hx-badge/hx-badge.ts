import { LitElement, html, nothing } from 'lit';
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
 * @slot - Default slot for badge content (text, number). When empty with pulse enabled, renders as a dot indicator. Ignored when `count` is set.
 * @slot prefix - Icon or content rendered before the badge text.
 *
 * @fires {CustomEvent<void>} hx-remove - Dispatched when the user clicks the remove button.
 *
 * @csspart badge - The badge element.
 * @csspart remove-button - The remove/dismiss button.
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
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'info' =
    'primary';

  /**
   * Size of the badge.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
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
   * Whether the badge renders a dismiss button.
   * @attr removable
   */
  @property({ type: Boolean, reflect: true })
  removable = false;

  /**
   * Numeric count to display. When set, overrides slotted content.
   * Used with `max` for truncation (e.g., `99+`).
   * @attr count
   */
  @property({ type: Number, reflect: true })
  count: number | undefined;

  /**
   * Maximum value before truncation. When `count` exceeds `max`,
   * the badge displays `{max}+` (e.g., `99+`).
   * @attr max
   */
  @property({ type: Number, reflect: true })
  max: number | undefined;

  /**
   * Accessible label for the badge. Required for dot indicators
   * to provide screen reader context (e.g., "New notifications").
   * @attr aria-label
   */
  @property({ type: String, attribute: 'aria-label', reflect: true })
  override ariaLabel: string | null = null;

  /**
   * Tracks whether the default slot has assigned content.
   */
  @state()
  private _hasSlotContent = false;

  /**
   * Tracks the text content of the badge for contextual remove label.
   */
  @state()
  private _slotText = '';

  // ─── Slot Change Handling ───

  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const nodes = slot.assignedNodes({ flatten: true });
    let text = '';
    this._hasSlotContent = nodes.some((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        text += (node as Element).textContent ?? '';
        return true;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        const content = (node.textContent ?? '').trim();
        text += content;
        return content.length > 0;
      }
      return false;
    });
    this._slotText = text.trim();
  }

  // ─── Event Handling ───

  private _handleRemove(): void {
    this.dispatchEvent(
      new CustomEvent('hx-remove', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ─── Computed Display ───

  private get _displayCount(): string | undefined {
    if (this.count === undefined) return undefined;
    if (this.max !== undefined && this.count > this.max) {
      return `${this.max}+`;
    }
    return String(this.count);
  }

  private get _hasContent(): boolean {
    return this._displayCount !== undefined || this._hasSlotContent;
  }

  private get _removeLabel(): string {
    const text = this._displayCount ?? this._slotText;
    return text ? `Remove ${text}` : 'Remove';
  }

  // ─── Render ───

  override render() {
    const isDot = !this._hasContent && this.pulse;

    const classes = {
      badge: true,
      [`badge--${this.variant}`]: true,
      [`badge--${this.size}`]: true,
      'badge--pill': this.pill,
      'badge--pulse': this.pulse,
      'badge--dot': isDot,
    };

    return html`
      <span
        part="badge"
        class=${classMap(classes)}
        role="status"
        aria-label=${this.ariaLabel ?? nothing}
      >
        <slot name="prefix"></slot>
        ${this._displayCount !== undefined
          ? html`<span class="badge__count">${this._displayCount}</span>`
          : html`<slot @slotchange=${this._handleSlotChange}></slot>`}
        ${this.removable
          ? html`<button
              part="remove-button"
              class="badge__remove-button"
              aria-label=${this._removeLabel}
              @click=${this._handleRemove}
            >
              <svg viewBox="0 0 12 12" aria-hidden="true" width="10" height="10">
                <path
                  d="M2.22 2.22a.75.75 0 011.06 0L6 4.94l2.72-2.72a.75.75 0 011.06 1.06L7.06 6l2.72 2.72a.75.75 0 01-1.06 1.06L6 7.06 3.28 9.78a.75.75 0 01-1.06-1.06L4.94 6 2.22 3.28a.75.75 0 010-1.06z"
                  fill="currentColor"
                />
              </svg>
            </button>`
          : nothing}
      </span>
    `;
  }
}

export type WcBadge = HelixBadge;

declare global {
  interface HTMLElementTagNameMap {
    'hx-badge': HelixBadge;
  }
}
