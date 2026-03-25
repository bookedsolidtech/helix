import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixTreeViewStyles } from './hx-tree-view.styles.js';
import type { HelixTreeItem, HxTreeItemSelectDetail } from './hx-tree-item.js';
import { devWarn } from '../../utils/dev-warn.js';

/** Selection mode for the tree. */
export type TreeSelection = 'none' | 'single' | 'multiple';

/** Detail type for the `hx-select` event. */
export interface HxSelectDetail {
  /** The tree item that was selected or deselected. */
  item: HelixTreeItem;
  /** Whether the item is now selected. */
  selected: boolean;
}

/**
 * A hierarchical tree component for navigating nested data structures.
 * Used in healthcare applications for org charts, ICD-10 code hierarchies, and department navigation.
 *
 * Implements WAI-ARIA tree view pattern with `role="tree"` on the container
 * and `role="treeitem"` on each item. Supports `aria-label` via the `label` property
 * for screen reader identification. Full keyboard navigation: Arrow keys for movement,
 * Enter/Space for selection, Home/End for first/last item.
 *
 * ## Scale Limits
 *
 * This component renders all tree items simultaneously in the DOM. It is suitable for
 * trees with up to ~500 visible items. For large taxonomies (e.g., ICD-10 with 70,000+
 * codes), use async/lazy loading: only render top-level nodes initially and populate
 * child nodes on `hx-select` or expand events. The component exposes the `expanded`
 * property on `hx-tree-item` for programmatic control of subtrees, enabling consumer-level
 * virtualization strategies without requiring changes to this component.
 *
 * @summary Hierarchical tree view with expand/collapse and keyboard navigation.
 *
 * @tag hx-tree-view
 *
 * @slot - Default slot for hx-tree-item elements.
 *
 * @fires {CustomEvent<HxSelectDetail>} hx-select - Dispatched when a tree item is selected or deselected.
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
  selection: 'none' | 'single' | 'multiple' = 'none';

  // ─── Internal State ───

  /** @internal */
  @state() private _currentIndex = 0;

  /** Tracks whether the tree has any visible items, to decide the container tabindex. */
  /** @internal */
  @state() private _hasVisibleItems = false;

  // ─── Internal Helpers ───

  /**
   * Returns a flat ordered list of all visible (not inside a collapsed item) hx-tree-items
   * in depth-first order.
   */
  /** @internal */
  private _getVisibleItems(): HelixTreeItem[] {
    return this._collectVisibleItems(this);
  }

  /** @internal */
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

  /** @internal */
  private _getSelectedItems(): HelixTreeItem[] {
    return Array.from(this.querySelectorAll<HelixTreeItem>('hx-tree-item[selected]'));
  }

  /**
   * Updates the roving tabindex across all visible items so that only the
   * item at `activeIndex` has `tabindex="0"`. All others receive `tabindex="-1"`.
   * This is called whenever the active item changes (navigation, initial render).
   */
  /** @internal */
  private _updateRovingTabindex(items: HelixTreeItem[], activeIndex: number): void {
    items.forEach((item, i) => {
      item.setRovingActive(i === activeIndex);
    });
  }

  /** @internal */
  private _focusItem(index: number): void {
    const items = this._getVisibleItems();
    if (items.length === 0) return;
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    this._currentIndex = clamped;
    this._updateRovingTabindex(items, clamped);
    items[clamped]?.focus();
  }

  // ─── Event Handling ───

  /** @internal */
  private _handleTreeItemSelect(e: Event): void {
    if (!(e instanceof CustomEvent)) return;
    const event = e as CustomEvent<HxTreeItemSelectDetail>;
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
      new CustomEvent<HxSelectDetail>('hx-select', {
        bubbles: true,
        composed: true,
        detail: { item, selected: item.selected },
      }),
    );
  }

  /** @internal */
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

  /** @internal */
  private _handleFocusIn(e: FocusEvent): void {
    // With roving tabindex, the tree container (tabindex="-1") should only receive
    // focus when the tree is empty. If focus does land on the container (e.g. the
    // tree is empty or programmatic focus), redirect to the active item if present.
    if (e.target === e.currentTarget) {
      const items = this._getVisibleItems();
      if (items.length > 0) {
        this._focusItem(this._currentIndex);
      }
    }
  }

  /**
   * Initializes the roving tabindex after items are first slotted in.
   * Ensures the active item (index 0 by default) has tabindex="0" from the start,
   * so a Tab into the tree lands directly on the first item without a redirect.
   * Also updates `_hasVisibleItems` so the container tabindex re-renders correctly.
   */
  /** @internal */
  private _handleSlotChange(): void {
    const items = this._getVisibleItems();
    this._hasVisibleItems = items.length > 0;
    if (items.length === 0) return;
    // Clamp _currentIndex in case items were removed.
    const clamped = Math.min(this._currentIndex, items.length - 1);
    this._currentIndex = clamped;
    this._updateRovingTabindex(items, clamped);
  }

  // ─── Lifecycle ───

  override firstUpdated(): void {
    if (!this.label) {
      devWarn(
        'hx-tree-view',
        'No accessible label provided. Set the `label` attribute on hx-tree-view so screen readers can identify this tree (WCAG 4.1.2).',
      );
    }
  }

  // ─── Render ───

  override render() {
    // Roving tabindex pattern (WCAG 2.4.3 Fix):
    // The tree container is NOT a Tab stop (tabindex="-1"). Tab focus goes
    // directly to the active item, which carries tabindex="0". The container
    // is only a landing target (tabindex="0") when the tree is empty.
    const containerTabindex = this._hasVisibleItems ? '-1' : '0';

    return html`
      <div
        part="tree"
        class="tree"
        role="tree"
        tabindex=${containerTabindex}
        aria-label=${this.label || 'Tree'}
        aria-multiselectable=${this.selection === 'multiple' ? 'true' : 'false'}
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

/** Canonical type alias for HelixTreeView. Use this when typing hx-tree-view element references. */
export type HxTreeView = HelixTreeView;

/** @deprecated Use {@link HxTreeView} instead. The `Wc` prefix was a legacy naming convention. */
export type WcTreeView = HelixTreeView;
