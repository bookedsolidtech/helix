import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTreeViewStyles } from './hx-tree-view.styles.js';
import type { HelixTreeItem } from './hx-tree-item.js';

/** Selection mode for the tree. */
export type TreeSelection = 'none' | 'single' | 'multiple';

/**
 * A hierarchical tree component for navigating nested data structures.
 * Used in healthcare applications for org charts, ICD-10 code hierarchies, and department navigation.
 *
 * @summary Hierarchical tree view with expand/collapse and keyboard navigation.
 *
 * @tag hx-tree-view
 *
 * @slot - Default slot for hx-tree-item elements.
 *
 * @fires {CustomEvent<{item: HelixTreeItem, selected: boolean}>} hx-select - Dispatched when a tree item is selected or deselected.
 *
 * @cssprop [--hx-tree-font-family=var(--hx-font-family-sans)] - Tree font family.
 */
@customElement('hx-tree-view')
export class HelixTreeView extends LitElement {
  static override styles = [tokenStyles, helixTreeViewStyles];

  // ─── Properties ───

  /**
   * Selection mode for the tree.
   * - `none` — items cannot be selected
   * - `single` — only one item can be selected at a time
   * - `multiple` — multiple items can be selected
   * @attr selection
   */
  @property({ type: String, reflect: true })
  selection: TreeSelection = 'none';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.updateComplete.then(() => this._computeItemDepths(this, 0));
  }

  // ─── Internal Helpers ───

  private _computeItemDepths(container: Element, depth: number): void {
    for (const child of Array.from(container.children)) {
      if (child.tagName.toLowerCase() === 'hx-tree-item') {
        const item = child as HelixTreeItem;
        item.indent = depth;
        this._computeItemDepths(item, depth + 1);
      } else {
        this._computeItemDepths(child, depth);
      }
    }
  }

  private _handleSlotChange(): void {
    this._computeItemDepths(this, 0);
  }

  /**
   * Returns a flat ordered list of all visible (not inside a collapsed item) hx-tree-items
   * in depth-first order.
   */
  private _getVisibleItems(): HelixTreeItem[] {
    return this._collectVisibleItems(this);
  }

  private _collectVisibleItems(container: Element): HelixTreeItem[] {
    const items: HelixTreeItem[] = [];
    for (const child of Array.from(container.children)) {
      if (child.tagName.toLowerCase() === 'hx-tree-item') {
        const item = child as HelixTreeItem;
        items.push(item);
        // Only recurse into expanded items
        if (item.expanded) {
          // Children with slot="children" are direct children of the item element
          items.push(...this._collectVisibleItems(item));
        }
      } else {
        // Non-tree-item elements — skip but check their children
        items.push(...this._collectVisibleItems(child));
      }
    }
    return items;
  }

  private _getSelectedItems(): HelixTreeItem[] {
    return Array.from(this.querySelectorAll<HelixTreeItem>('hx-tree-item[selected]'));
  }

  // ─── Event Handling ───

  private _handleTreeItemSelect(e: Event): void {
    const event = e as CustomEvent<{ item: HelixTreeItem }>;
    const item = event.detail.item;

    if (this.selection === 'none') return;

    if (this.selection === 'single') {
      // Deselect all others, toggle this one
      const wasSelected = item.selected;
      this._getSelectedItems().forEach((i) => {
        i.selected = false;
      });
      item.selected = !wasSelected;
    } else if (this.selection === 'multiple') {
      item.selected = !item.selected;
    }

    this.dispatchEvent(
      new CustomEvent('hx-select', {
        bubbles: true,
        composed: true,
        detail: { item, selected: item.selected },
      }),
    );
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    const items = this._getVisibleItems();
    if (items.length === 0) return;

    // Find the currently focused item
    const focused = this.shadowRoot?.activeElement ?? document.activeElement;
    let currentIndex = -1;

    // The focused element could be the item-row div inside the shadow DOM of hx-tree-item.
    // We need to find which hx-tree-item contains the focused element.
    for (let i = 0; i < items.length; i++) {
      if (items[i]?.shadowRoot?.contains(focused) || items[i] === focused) {
        currentIndex = i;
        break;
      }
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[next]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prev]?.focus();
        break;
      }
      case 'Home': {
        e.preventDefault();
        items[0]?.focus();
        break;
      }
      case 'End': {
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      }
    }
  }

  private _handleFocusIn(e: FocusEvent): void {
    // When focus enters the tree for the first time, focus the first item
    // if focus landed on the tree root itself
    if (e.target === e.currentTarget) {
      const items = this._getVisibleItems();
      if (items.length > 0) {
        items[0]?.focus();
      }
    }
  }

  // ─── Render ───

  override render() {
    return html`
      <div
        class="tree"
        role="tree"
        aria-multiselectable=${this.selection === 'none'
          ? nothing
          : this.selection === 'multiple'
            ? 'true'
            : 'false'}
        @hx-tree-item-select=${this._handleTreeItemSelect}
        @keydown=${this._handleKeyDown}
        @focusin=${this._handleFocusIn}
      >
        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tree-view': HelixTreeView;
  }
}

export type { HelixTreeView as WcTreeView };
