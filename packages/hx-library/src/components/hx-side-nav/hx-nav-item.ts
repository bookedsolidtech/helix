import { html, nothing } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import '../hx-icon/hx-icon.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixNavItemStyles } from './hx-nav-item.styles.js';

const _nextNavItemId = createIdCounter('hx-nav-item');

/**
 * A navigation item for use inside hx-side-nav.
 * Supports icons, badges, sub-navigation, and active/disabled states.
 *
 * @summary Navigation item for hx-side-nav with support for icons, badges, and nested children.
 *
 * @tag hx-nav-item
 *
 * @slot - Default slot for item label text.
 * @slot icon - Icon to display before the label.
 * @slot badge - Badge content (e.g., notification count).
 * @slot children - Nested hx-nav-item children for sub-navigation.
 *
 * @csspart link - The anchor or button element.
 * @csspart icon - The icon container.
 * @csspart label - The label container.
 * @csspart badge - The badge container.
 * @csspart children - The children container.
 *
 * @cssprop [--hx-nav-item-color=var(--hx-color-text-inverse)] - Item text color.
 * @cssprop [--hx-nav-item-hover-bg] - Item hover background.
 * @cssprop [--hx-nav-item-hover-color=var(--hx-color-text-inverse)] - Item hover text color.
 * @cssprop [--hx-nav-item-active-bg=var(--hx-color-action-primary-bg-hover)] - Active item background.
 * @cssprop [--hx-nav-item-active-color=var(--hx-color-text-on-primary-strong)] - Active item text color.
 * @cssprop [--hx-nav-item-padding] - Item padding.
 * @cssprop [--hx-nav-item-host-bg=var(--hx-color-surface-inverse)] - Component host background color.
 * @cssprop [--hx-nav-item-tooltip-bg=var(--hx-color-surface-inverse)] - Tooltip background color (collapsed-rail tooltip).
 * @cssprop [--hx-nav-item-tooltip-color=var(--hx-color-text-inverse)] - Tooltip text color (collapsed-rail tooltip).
 */
@customElement('hx-nav-item')
export class HelixNavItem extends HelixElement {
  // 3.2.1: forced-colors deference is owned by the bespoke @media block in
  // hx-nav-item.styles.ts (active border, focus outline, tooltip border).
  // Do NOT also compose forcedColorsInteractive — XOR rule per the mixin
  // docstring.
  static override styles = [helixNavItemStyles];

  /** @internal — per-instance tooltip ID */
  private _tooltipId = `${_nextNavItemId()}-tooltip`;

  // ─── Properties ───

  /**
   * The URL this nav item links to.
   * @attr href
   */
  @property({ type: String })
  href = '';

  /**
   * Whether this item is the current/active page.
   * @attr active
   */
  @property({ type: Boolean, reflect: true })
  active = false;

  /**
   * Whether the sub-navigation is expanded.
   * @attr expanded
   */
  @property({ type: Boolean, reflect: true })
  expanded = false;

  /**
   * Whether this nav item is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  // ─── State ───

  /** Whether the children slot has assigned nodes. Updated via slotchange. */
  /** @internal */
  @state() private _hasChildren = false;

  /** Whether this item is in collapsed mode. Set externally by hx-side-nav via data-collapsed attribute. */
  /** @internal */
  @state() private _isCollapsed = false;

  // ─── Attribute Observer ───

  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, 'data-collapsed'];
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    if (name === 'data-collapsed') {
      this._isCollapsed = value !== null;
    }
  }

  // ─── Public API ───

  /**
   * Delegates focus to the internal link or button element (part="link").
   * Allows parent components to focus nav items without piercing the Shadow DOM.
   * WCAG 2.1.1: keyboard navigation must not cross shadow boundaries via
   * direct shadowRoot queries.
   */
  override focus(options?: FocusOptions): void {
    const inner = this.shadowRoot?.querySelector<HTMLElement>('[part="link"]');
    if (inner) {
      inner.focus(options);
    } else {
      super.focus(options);
    }
  }

  // ─── Slot Change Handler ───

  /** @internal */
  private _onChildrenSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasChildren = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Private Helpers ───

  /** @internal */
  private _getDirectText(): string {
    return Array.from(this.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ');
  }

  /** @internal */
  private _handleToggle(e: Event): void {
    if (this.disabled) return;
    e.preventDefault();
    this.expanded = !this.expanded;
  }

  /** @internal */
  private _renderExpandArrow() {
    return html`<span class="nav-item__arrow" aria-hidden="true">
      <hx-icon
        class="nav-item__arrow-glyph"
        library="helix"
        name="chevron-right"
        aria-hidden="true"
      ></hx-icon>
    </span>`;
  }

  // ─── Render ───

  override render() {
    const label = this._getDirectText();

    const innerContent = html`
      <span part="icon" class="nav-item__icon">
        <slot name="icon"></slot>
      </span>
      <span part="label" class="nav-item__label">
        <slot></slot>
      </span>
      <span part="badge" class="nav-item__badge">
        <slot name="badge"></slot>
      </span>
      ${this._hasChildren ? this._renderExpandArrow() : nothing}
      ${this._isCollapsed
        ? html`<span id=${this._tooltipId} class="nav-item__tooltip" role="tooltip">${label}</span>`
        : nothing}
    `;

    // Render as anchor when href provided and no expandable children
    const linkEl =
      this.href && !this._hasChildren
        ? html`<a
            part="link"
            class="nav-item__link"
            href=${this.href}
            aria-current=${this.active ? 'page' : nothing}
            aria-disabled=${this.disabled ? 'true' : nothing}
            aria-describedby=${this._isCollapsed ? this._tooltipId : nothing}
            tabindex=${this.disabled ? '-1' : '0'}
          >
            ${innerContent}
          </a>`
        : html`<button
            part="link"
            class="nav-item__link"
            aria-disabled=${this.disabled ? 'true' : nothing}
            aria-expanded=${this._hasChildren ? String(this.expanded) : nothing}
            aria-describedby=${this._isCollapsed ? this._tooltipId : nothing}
            tabindex=${this.disabled ? '-1' : '0'}
            @click=${this._handleToggle}
          >
            ${innerContent}
          </button>`;

    return html`
      <div class="nav-item">
        ${linkEl}
        <div part="children" class="nav-item__children" role="group">
          <div class="nav-item__children-inner">
            <slot name="children" @slotchange=${this._onChildrenSlotChange}></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-nav-item': HelixNavItem;
  }
}

export type { HelixNavItem as HxNavItem };
