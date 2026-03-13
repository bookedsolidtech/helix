import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixTreeItemStyles } from './hx-tree-item.styles.js';

/**
 * A tree item used within an hx-tree-view component.
 * Supports expand/collapse, selection, keyboard navigation, and icon/children slots.
 *
 * @summary Individual item within an hx-tree-view hierarchical tree.
 *
 * @tag hx-tree-item
 *
 * @slot - Default slot for the item label content.
 * @slot icon - Custom icon shown before the label.
 * @slot children - Nested hx-tree-item elements for sub-tree.
 *
 * @csspart item - The outer item container.
 * @csspart row - The interactive item row (contains expand icon, icon slot, and label).
 * @csspart expand-icon - The expand/collapse toggle button.
 * @csspart label - The label text content area.
 * @csspart children - The children container.
 *
 * @cssprop [--hx-tree-item-color=var(--hx-color-neutral-900)] - Item text color.
 * @cssprop [--hx-tree-item-hover-bg=var(--hx-color-neutral-100)] - Hover background color.
 * @cssprop [--hx-tree-item-selected-bg=var(--hx-color-primary-100)] - Selected background color.
 * @cssprop [--hx-tree-item-selected-color=var(--hx-color-primary-800)] - Selected text color.
 * @cssprop [--hx-tree-item-padding-x=var(--hx-space-2)] - Horizontal padding.
 * @cssprop [--hx-tree-item-padding-y=var(--hx-space-1)] - Vertical padding.
 * @cssprop [--hx-tree-indent-size=1.5rem] - Indentation size per level.
 *
 * @fires {CustomEvent<{item: HelixTreeItem}>} hx-tree-item-select - Dispatched when this item is clicked or activated via keyboard.
 */
@customElement('hx-tree-item')
export class HelixTreeItem extends LitElement {
  static override styles = [tokenStyles, helixTreeItemStyles];

  // ─── Properties ───

  /**
   * Whether the item is expanded (showing children).
   * @attr expanded
   */
  @property({ type: Boolean, reflect: true })
  expanded = false;

  /**
   * Whether the item is selected.
   * @attr selected
   */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /**
   * Whether the item is disabled (non-interactive).
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  // ─── Internal State ───

  @state() private _hasChildren = false;

  /**
   * Cached ARIA position metadata. Computed once on connect and on slotchange
   * of the parent container, avoiding repeated DOM traversal on every render.
   */
  @state() private _level = 1;
  @state() private _posInSet = 1;
  @state() private _setSize = 1;
  @state() private _selectable = false;

  // ─── Computed ARIA ───

  /**
   * Whether this item has slotted children.
   * @returns True if one or more elements are assigned to the children slot.
   */
  get hasChildItems(): boolean {
    return this._hasChildren;
  }

  /**
   * Recompute all cached ARIA metadata in a single DOM pass.
   * Called on connect, slotchange, and whenever structural context may change.
   */
  private _updateAriaMetadata(): void {
    // Compute nesting level by counting ancestor hx-tree-item elements.
    let level = 1;
    let el: Element | null = this.parentElement;
    while (el) {
      if (el.tagName.toLowerCase() === 'hx-tree-item') level++;
      el = el.parentElement;
    }
    this._level = level;

    // Compute position-in-set and set-size from sibling hx-tree-item elements.
    const parent = this.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName.toLowerCase() === 'hx-tree-item',
      );
      this._posInSet = siblings.indexOf(this) + 1;
      this._setSize = siblings.length;
    } else {
      this._posInSet = 1;
      this._setSize = 1;
    }

    // Determine if the owning tree supports selection.
    const tree = this.closest('hx-tree-view');
    if (tree) {
      const selection = tree.getAttribute('selection');
      this._selectable = selection === 'single' || selection === 'multiple';
    } else {
      this._selectable = false;
    }
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this._updateAriaMetadata();
  }

  // ─── Children Detection ───

  private _handleChildrenSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasChildren = slot.assignedElements().length > 0;
    this._updateAriaMetadata();
  }

  // ─── Event Handlers ───

  private _handleExpandClick(e: Event): void {
    e.stopPropagation();
    if (this.disabled) return;
    this.expanded = !this.expanded;
  }

  private _handleRowClick(): void {
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent('hx-tree-item-select', {
        bubbles: true,
        composed: true,
        detail: { item: this },
      }),
    );
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (this.disabled) return;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (this._hasChildren && !this.expanded) {
          this.expanded = true;
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (this._hasChildren && this.expanded) {
          this.expanded = false;
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this._handleRowClick();
        break;
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Home':
      case 'End':
        // Bubble up to hx-tree-view for navigation
        break;
    }
  }

  // ─── Public API ───

  /** Focus this item's interactive row element. */
  override focus(): void {
    const row = this.shadowRoot?.querySelector<HTMLElement>('.item-row');
    row?.focus();
  }

  // ─── Render ───

  private _renderExpandIcon() {
    if (!this._hasChildren) {
      return html`<span class="expand-placeholder" aria-hidden="true"></span>`;
    }
    return html`
      <button
        part="expand-icon"
        class="expand-btn"
        tabindex="-1"
        aria-label="${this.expanded ? 'Collapse' : 'Expand'}"
        @click=${this._handleExpandClick}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <polyline points="6 4 10 8 6 12" />
        </svg>
      </button>
    `;
  }

  override render() {
    const ariaExpanded = this._hasChildren ? String(this.expanded) : nothing;
    const ariaSelected = this._selectable ? String(this.selected) : nothing;

    return html`
      <div part="item" class="item">
        <div
          part="row"
          class="item-row"
          role="treeitem"
          tabindex="-1"
          aria-expanded=${ariaExpanded}
          aria-selected=${ariaSelected}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-level=${this._level}
          aria-posinset=${this._posInSet}
          aria-setsize=${this._setSize}
          @click=${this._handleRowClick}
          @keydown=${this._handleKeyDown}
        >
          ${this._renderExpandIcon()}
          <span class="item-icon">
            <slot name="icon"></slot>
          </span>
          <span part="label" class="item-label">
            <slot></slot>
          </span>
        </div>
        <div
          part="children"
          class="children ${this.expanded ? 'children--expanded' : ''}"
          role="group"
        >
          <div class="children-inner">
            <slot name="children" @slotchange=${this._handleChildrenSlotChange}></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tree-item': HelixTreeItem;
  }
}

/** Canonical type alias for HelixTreeItem. Use this when typing hx-tree-item element references. */
export type HxTreeItem = HelixTreeItem;

/** @deprecated Use {@link HxTreeItem} instead. The `Wc` prefix was a legacy naming convention. */
export type WcTreeItem = HelixTreeItem;
