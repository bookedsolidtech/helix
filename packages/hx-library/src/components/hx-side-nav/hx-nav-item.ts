import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

let nextTooltipId = 0;
import { tokenStyles } from '@helix/tokens/lit';
import { helixNavItemStyles } from './hx-nav-item.styles.js';

/**
 * A navigation item for use inside hx-side-nav.
 * Supports icons, badges, sub-navigation, and active/disabled states.
 * Uses `aria-current="page"` to indicate the active page, `aria-disabled` for disabled items,
 * and `aria-expanded` for items with nested children. In collapsed mode, a tooltip with
 * `role="tooltip"` is displayed and linked via `aria-describedby`.
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
 * @cssprop [--hx-nav-item-color=var(--hx-color-neutral-300)] - Item text color.
 * @cssprop [--hx-nav-item-hover-bg] - Item hover background.
 * @cssprop [--hx-nav-item-hover-color=var(--hx-color-neutral-100)] - Item hover text color.
 * @cssprop [--hx-nav-item-active-bg=var(--hx-color-primary-600)] - Active item background.
 * @cssprop [--hx-nav-item-active-color=var(--hx-color-neutral-50)] - Active item text color.
 * @cssprop [--hx-nav-item-padding] - Item padding.
 * @cssprop [--hx-nav-item-host-bg=var(--hx-color-neutral-900)] - Host background color.
 * @cssprop [--hx-nav-item-active-hover-bg=var(--hx-color-primary-700)] - Active item hover background.
 */
@customElement('hx-nav-item')
export class HelixNavItem extends LitElement {
  static override styles = [tokenStyles, helixNavItemStyles];

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
  @state() private _hasChildren = false;

  /** Whether this item is in collapsed mode. Synced from the `data-collapsed` attribute via MutationObserver. */
  @state() private _isCollapsed = false;

  /** Unique ID for the tooltip element, used by aria-describedby. */
  private readonly _tooltipId = `hx-nav-tooltip-${nextTooltipId++}`;

  /** Observes `data-collapsed` attribute changes and syncs to reactive `_isCollapsed` state. */
  private _attrObserver: MutationObserver | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this._isCollapsed = this.hasAttribute('data-collapsed');
    this._attrObserver = new MutationObserver(() => {
      this._isCollapsed = this.hasAttribute('data-collapsed');
    });
    this._attrObserver.observe(this, { attributes: true, attributeFilter: ['data-collapsed'] });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._attrObserver?.disconnect();
    this._attrObserver = null;
  }

  // ─── Slot Change Handler ───

  private _onChildrenSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasChildren = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Private Helpers ───

  private _handleToggle(e: Event): void {
    if (this.disabled) return;
    e.preventDefault();
    this.expanded = !this.expanded;
  }

  private _renderExpandArrow() {
    return html`<span class="nav-item__arrow" aria-hidden="true">
      <svg viewBox="0 0 20 20">
        <path
          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        />
      </svg>
    </span>`;
  }

  // ─── Private Helpers (label) ───

  /**
   * Extracts the label text from only the default slot's assigned nodes,
   * excluding named slots (icon, badge, children) to avoid garbled tooltip text.
   */
  private _getSlotLabel(): string {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (!slot) return this.textContent?.trim() ?? '';
    return slot
      .assignedNodes({ flatten: true })
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ');
  }

  // ─── Render ───

  override render() {
    const label = this._getSlotLabel() || this.textContent?.trim() || '';

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
        ? html`<span class="nav-item__tooltip" role="tooltip" id=${this._tooltipId}>${label}</span>`
        : nothing}
    `;

    const describedBy = this._isCollapsed ? this._tooltipId : undefined;

    // Render as anchor when href provided and no expandable children
    const linkEl =
      this.href && !this._hasChildren
        ? html`<a
            part="link"
            class="nav-item__link"
            href=${this.href}
            aria-current=${this.active ? 'page' : nothing}
            aria-disabled=${this.disabled ? 'true' : nothing}
            aria-describedby=${describedBy ?? nothing}
            tabindex=${this.disabled ? '-1' : '0'}
          >
            ${innerContent}
          </a>`
        : html`<button
            part="link"
            class="nav-item__link"
            aria-current=${this.active ? 'page' : nothing}
            aria-disabled=${this.disabled ? 'true' : nothing}
            aria-expanded=${this._hasChildren ? String(this.expanded) : nothing}
            aria-describedby=${describedBy ?? nothing}
            tabindex=${this.disabled ? '-1' : '0'}
            @click=${this._handleToggle}
          >
            ${innerContent}
          </button>`;

    return html`
      <div class="nav-item">
        ${linkEl}
        <div part="children" class="nav-item__children" role="group">
          <slot name="children" @slotchange=${this._onChildrenSlotChange}></slot>
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

export type { HelixNavItem as WcNavItem };
