import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTreeViewStyles } from './hx-tree-view.styles.js';
import type { HelixTreeItem } from './hx-tree-item.js';

/** Selection mode for the tree. */
export type TreeSelection = 'none' | 'single' | 'multiple';

/**
 * A hierarchical tree component for navigating nested data structures.
 * Used in healthcare applications for org charts, ICD-10 code hierarchies, and department navigation.
 *
 * Implements WAI-ARIA tree view pattern with `role="tree"` on the container
 * and `role="treeitem"` on each item. Supports `aria-label` via the `label` property
 * for screen reader identification. Full keyboard navigation: Arrow keys for movement,
 * Enter/Space for selection, Home/End for first/last item.
 *
 * @summary Hierarchical tree view with expand/collapse and keyboard navigation.
 *
 * @tag hx-tree-view
 *
 * @slot - Default slot for hx-tree-item elements.
 *
 * @fires {CustomEvent<{item: HelixTreeItem, selected: boolean}>} hx-select - Dispatched when a tree item is selected or deselected.
 *
 * @csspart tree - The tree container element with role="tree".
 *
 * @cssprop [--hx-tree-font-family=var(--hx-font-family-sans)] - Tree font family.
 */
@customElement('hx-tree-view')
export class HelixTreeView extends LitElement {
  static override styles = [tokenStyles, helixTreeViewStyles];

  // ─── Properties ───

  /**
   * Accessible label for the tree. Applied as `aria-label` on the tree container.
   * Provides context to screen readers about the tree's purpose.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = '';

  /**
   * Selection mode for the tree.
   * - `none` — items cannot be selected
   * - `single` — only one item can be selected at a time
   * - `multiple` — multiple items can be selected
   * @attr selection
   */
  @property({ type: String, reflect: true })
  selection: TreeSelection = 'none';

  // ─── Internal State ───

  @state() private _currentIndex = 0;

  // ─── Internal Helpers ───

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
        if (item.expanded) {
          items.push(...this._collectVisibleItems(item));
        }
      } else {
        items.push(...this._collectVisibleItems(child));
      }
    }
    return items;
  }

  private _getSelectedItems(): HelixTreeItem[] {
    return Array.from(this.querySelectorAll<HelixTreeItem>('hx-tree-item[selected]'));
  }

  private _focusItem(index: number): void {
    const items = this._getVisibleItems();
    if (items.length === 0) return;
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    this._currentIndex = clamped;
    items[clamped]?.focus();
  }

  // ─── Event Handling ───

  private _handleTreeItemSelect(e: Event): void {
    const event = e as CustomEvent<{ item: HelixTreeItem }>;
    const item = event.detail.item;

    if (this.selection === 'none') return;

    if (this.selection === 'single') {
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

    let currentIndex = this._currentIndex;
    const focused = document.activeElement;

    for (let i = 0; i < items.length; i++) {
      if (items[i] === focused || items[i]?.shadowRoot?.activeElement) {
        currentIndex = i;
        break;
      }
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        this._focusItem(next);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        this._focusItem(prev);
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const currentItem = items[currentIndex];
        if (!currentItem) break;
        if (currentItem.expanded && currentItem.hasChildItems) {
          currentItem.expanded = false;
        } else {
          const parentItem = currentItem.parentElement?.closest('hx-tree-item') as
            | HelixTreeItem
            | undefined;
          if (parentItem) {
            const parentIndex = items.indexOf(parentItem);
            if (parentIndex >= 0) {
              this._focusItem(parentIndex);
            }
          }
        }
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        const currentItem = items[currentIndex];
        if (!currentItem) break;
        if (currentItem.hasChildItems) {
          if (!currentItem.expanded) {
            currentItem.expanded = true;
          } else {
            this._focusItem(currentIndex + 1);
          }
        }
        break;
      }
      case 'Home': {
        e.preventDefault();
        this._focusItem(0);
        break;
      }
      case 'End': {
        e.preventDefault();
        this._focusItem(items.length - 1);
        break;
      }
    }
  }

  private _handleFocusIn(e: FocusEvent): void {
    if (e.target === e.currentTarget) {
      this._focusItem(this._currentIndex);
    }
  }

  // ─── Render ───

  override render() {
    return html`
      <div
        part="tree"
        class="tree"
        role="tree"
        tabindex="0"
        aria-label=${this.label || nothing}
        aria-multiselectable=${this.selection === 'multiple' ? 'true' : 'false'}
        @hx-tree-item-select=${this._handleTreeItemSelect}
        @keydown=${this._handleKeyDown}
        @focusin=${this._handleFocusIn}
      >
        <slot></slot>
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
