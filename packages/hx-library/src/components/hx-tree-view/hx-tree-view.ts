import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { HelixElement } from '../../base/index.js';
import { helixTreeViewStyles } from './hx-tree-view.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';
import type { HelixTreeItem, HxTreeItemSelectDetail } from './hx-tree-item.js';
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';
import { findClosestTreeView } from '../../utils/tree-walk.js';

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
 * Group 5c host-canonical: `role="tree"` lives on the **host** via
 * `_internals.role` on the modern path. The host carries the announced
 * surface so AT walks `<hx-tree-view>` (role=tree) → slotted
 * `<hx-tree-item>` (role=treeitem on host) directly without two layers of
 * indirection. Consumer-supplied `aria-label` / `aria-labelledby` on the
 * host are resolved via the shared IDREF mirror; cross-shadow naming uses
 * `ariaLabelledByElements` (modern) with a flattened-string fallback
 * (legacy). On the legacy fallback path the inner `[role="tree"]` carries
 * the role + accessible name and the host role is suppressed so AT only
 * sees one tree per logical surface (mirrors `hx-menu` round-8).
 *
 * Full keyboard navigation: Arrow keys for movement, Enter/Space for
 * selection, Home/End for first/last item, ArrowRight/Left for
 * expand/collapse + parent/child traversal, typeahead.
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
 * @csspart tree - The tree container element with role="tree" (legacy fallback path) or the inner shadow surface (modern path; role lives on the host).
 *
 * @cssprop [--hx-tree-font-family=var(--hx-font-family-sans)] - Tree font family.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 */
@customElement('hx-tree-view')
export class HelixTreeView extends HelixElement {
  static override styles = [helixTreeViewStyles, forcedColorsSurface];

  // ─── Properties ───

  /**
   * Accessible label for the tree. Used as a fallback when no
   * consumer-supplied `aria-label` / `aria-labelledby` is present on the
   * host. On the modern host-canonical path this projects onto
   * `internals.ariaLabel`; on the legacy fallback path it appears as
   * `aria-label` on the inner `[role="tree"]` element.
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

  // ─── Host-canonical ARIA bookkeeping ───

  /**
   * Test seam (codex push-gate round-1 lift from group 5b): when set to
   * `true` or `false`, overrides the platform `supportsIdrefElementReferences`
   * probe before `connectedCallback` seeds `_supportsIdrefRefs`. Mirrors the
   * hx-menu / hx-menu-item / hx-select seam — required so tests can
   * deterministically exercise the legacy fallback render branch.
   *
   * Production code MUST NOT touch this field. It is `static` so the test
   * stub cleanup is global and obvious.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

  /** @internal */
  private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Resolved accessible name for the tree — the single source of truth read
   * by `_syncHostAriaSemantics()` (modern path: writes to
   * `internals.ariaLabel`) and the fallback `render()` branch (legacy path:
   * writes to inner `div[role="tree"]` `aria-label`). AccName 1.2 §4.3.1
   * precedence: consumer host `aria-labelledby` (resolved + flattened) >
   * consumer host `aria-label` > `label` property > literal "Tree".
   * @internal
   */
  private _resolvedAccessibleName = '';

  // ─── Visible items cache ───

  /**
   * Cached flat list of visible items (depth-first, respects collapsed nodes).
   * Set to null to invalidate; rebuilt on next access.
   * @internal
   */
  private _cachedVisibleItems: HelixTreeItem[] | null = null;

  /**
   * Invalidate the visible-items cache. Call after any expand/collapse or structural change.
   * @internal
   */
  private _invalidateVisibleItemsCache(): void {
    this._cachedVisibleItems = null;
  }

  // ─── Internal Helpers ───

  /**
   * Returns a flat ordered list of all visible (not inside a collapsed item) hx-tree-items
   * in depth-first order. Result is cached; invalidated on expand/collapse/slotchange.
   */
  /** @internal */
  private _getVisibleItems(): HelixTreeItem[] {
    if (!this._cachedVisibleItems) {
      this._cachedVisibleItems = this._collectVisibleItems(this);
    }
    return this._cachedVisibleItems;
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

  /**
   * Codex push-gate round-1 lift (mirrors hx-menu round-7 finding 2):
   * `hx-tree-item-select` bubbles composed through every enclosing
   * `hx-tree-view`. The outer tree would otherwise corrupt `_currentIndex`
   * to `-1` (the bubbled item is not in its top-level list) and re-emit a
   * duplicate `hx-select`. Only act when THIS tree is the closest
   * enclosing tree of the dispatching item.
   * @internal
   */
  private _handleItemSelectHost = (e: Event): void => {
    if (!(e instanceof CustomEvent)) return;
    const detail = (e as CustomEvent<HxTreeItemSelectDetail>).detail;
    const item = detail?.item;
    if (item && findClosestTreeView(item) !== this) {
      return;
    }
    this._handleTreeItemSelect(e);
  };

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
        // Intentional design: wrap-around from last to first item provides
        // a continuous navigation loop, consistent with the component's
        // circular keyboard navigation model.
        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        this._focusItem(next);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        // Intentional design: wrap-around from first to last item (see ArrowDown note).
        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        this._focusItem(prev);
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const currentItem = items[currentIndex];
        if (!currentItem) break;
        if (currentItem.disabled) break;
        if (currentItem.expanded && currentItem.hasChildItems) {
          currentItem.expanded = false;
          this._invalidateVisibleItemsCache();
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
        if (currentItem.disabled) break;
        if (currentItem.hasChildItems) {
          if (!currentItem.expanded) {
            currentItem.expanded = true;
            this._invalidateVisibleItemsCache();
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
      default: {
        // WAI-ARIA APG typeahead: a printable character moves focus to the next visible
        // item whose label starts with that character (case-insensitive).
        if (e.key.length === 1) {
          e.preventDefault();
          const matchIndex = this._findTypeaheadMatch(e.key.toLowerCase(), currentIndex);
          if (matchIndex !== -1) {
            this._focusItem(matchIndex);
          }
        }
        break;
      }
    }
  }

  /**
   * Codex push-gate round-1 lift (mirrors hx-menu round-7 finding 1):
   * keydown bound on the host receives events bubbled out of nested
   * tree-views. Without this guard the outer tree would run `_focusItem`
   * over its own top-level items and steal focus back out of the inner
   * tree. Only act when THIS tree is the closest enclosing tree of the
   * keydown target.
   * @internal
   */
  private _handleHostKeyDown = (e: KeyboardEvent): void => {
    const target = e.target;
    if (target instanceof Element && findClosestTreeView(target) !== this) {
      return;
    }
    this._handleKeyDown(e);
  };

  /**
   * Finds the next visible item (starting after `currentIndex`, wrapping around) whose
   * label text begins with the given lowercase character. Returns -1 if no match.
   * @internal
   */
  private _findTypeaheadMatch(char: string, currentIndex: number): number {
    const items = this._getVisibleItems();
    if (items.length === 0) return -1;
    for (let i = 1; i <= items.length; i++) {
      const index = (currentIndex + i) % items.length;
      const item = items[index];
      if (item && item.labelText.toLowerCase().startsWith(char)) {
        return index;
      }
    }
    return -1;
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
   * Compute and push ARIA position metadata (level, posInSet, setSize, selectable) to all
   * direct hx-tree-item children of a container in a single O(n) pass.
   * Each item also recurses for its own children, building the full tree in O(total-items) total.
   * @internal
   */
  private _updateAriaMetadataForContainer(container: Element, level: number): void {
    const selectable = this.selection === 'single' || this.selection === 'multiple';
    const children = Array.from(container.children).filter(
      (c) => c.tagName.toLowerCase() === 'hx-tree-item',
    ) as HelixTreeItem[];
    const setSize = children.length;
    children.forEach((item, index) => {
      item.setAriaMetadata(level, index + 1, setSize, selectable);
      // Recurse into child items so the full tree is updated in one traversal
      this._updateAriaMetadataForContainer(item, level + 1);
    });
  }

  /**
   * Initializes the roving tabindex after items are first slotted in.
   * Ensures the active item (index 0 by default) has tabindex="0" from the start,
   * so a Tab into the tree lands directly on the first item without a redirect.
   * Also updates `_hasVisibleItems` so the container tabindex re-renders correctly.
   * Pushes O(n) ARIA metadata to all items to replace the O(n^2) per-item ancestor walk.
   */
  /** @internal */
  private _handleSlotChange(): void {
    this._invalidateVisibleItemsCache();
    // Push ARIA metadata from parent in a single O(n) traversal
    this._updateAriaMetadataForContainer(this, 1);
    const items = this._getVisibleItems();
    this._hasVisibleItems = items.length > 0;
    if (items.length === 0) return;
    // Clamp _currentIndex in case items were removed.
    const clamped = Math.min(this._currentIndex, items.length - 1);
    this._currentIndex = clamped;
    this._updateRovingTabindex(items, clamped);
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Honour the static test override so synthetic environments choose the
    // path BEFORE connect runs — the fallback render branch needs to be
    // selected at first paint so the inner `[role="tree"]` carries the
    // resolved accessible name without a mid-life flag flip.
    const ctor = this.constructor as typeof HelixTreeView;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);
    // Keydown + select are bound on the HOST so events from focused
    // host-canonical tree-items (which keep keydown out of this tree's
    // shadow DOM on the modern path) still reach the navigation handler.
    // Both handlers carry composed-tree origin guards that ignore events
    // bubbled out of a NESTED `<hx-tree-view>`.
    this.addEventListener('keydown', this._handleHostKeyDown);
    this.addEventListener('hx-tree-item-select', this._handleItemSelectHost);
    // Seed host-canonical semantics so role/label appear before first paint.
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleHostKeyDown);
    this.removeEventListener('hx-tree-item-select', this._handleItemSelectHost);
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('label')) {
      this._syncHostAriaSemantics();
    }
  }

  override firstUpdated(): void {
    const hasEffectiveLabel =
      this.hasAttribute('aria-label') ||
      this.hasAttribute('aria-labelledby') ||
      Boolean(this.label);
    if (!hasEffectiveLabel) {
      devWarn(
        'hx-tree-view',
        'No accessible label provided. Set the `label` attribute, or supply `aria-label` / `aria-labelledby` on hx-tree-view so screen readers can identify this tree (WCAG 4.1.2).',
      );
    }
  }

  /**
   * Mirror tree semantics onto the host via ElementInternals so consumer-
   * supplied `aria-label`, `aria-labelledby`, and the `label` property all
   * reach the announced control. Falls back to a flattened-string label on
   * engines that do not implement `ariaLabelledByElements`.
   *
   * Codex push-gate round-1 lift (mirrors hx-menu round-8 finding 1): on
   * the legacy fallback path the inner `<div role="tree" aria-label="…">`
   * is the announced surface. If we ALSO write `internals.role = 'tree'`
   * onto the host, AT sees TWO trees for one logical surface — the
   * duplicate-surface problem host-canonical migration is meant to
   * eliminate. Suppress host role + label writes on the fallback path; the
   * inner element is the canonical announced surface there. Modern path
   * keeps the host as the canonical surface and clears the inner role.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;

    if (!this._supportsIdrefRefs) {
      internals.role = null;
      internals.ariaLabel = null;
      internals.ariaMultiSelectable = null;
    } else {
      internals.role = 'tree';
      internals.ariaMultiSelectable =
        this.selection === 'none' ? null : this.selection === 'multiple' ? 'true' : 'false';
    }

    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';
    const consumerLabelledBy = this.getAttribute('aria-labelledby');
    const labelEls = resolveIdrefTokens(this, consumerLabelledBy);
    const hasEffectiveLabelledBy = labelEls.length > 0;

    type InternalsWithRefs = ElementInternals & {
      ariaLabelledByElements: Element[] | null;
    };

    if (this._supportsIdrefRefs) {
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = hasEffectiveLabelledBy ? labelEls : null;
    }

    // AccName 1.2 §4.3.1 precedence: consumer aria-labelledby (resolved) >
    // consumer aria-label > `label` property > literal "Tree" (last-resort).
    let resolved = '';
    if (hasEffectiveLabelledBy) {
      const flattened =
        labelEls
          .map((el) => flattenAccName(el))
          .filter(Boolean)
          .join(' ') ||
        hostAriaLabel ||
        this.label ||
        'Tree';
      resolved = flattened;
      if (this._supportsIdrefRefs) {
        // Modern path: element refs win; clear ariaLabel so they aren't
        // shadowed by a stale string. Fallback branch reads
        // `_resolvedAccessibleName` for its inner-div mirror — host
        // ariaLabel is already cleared above on the fallback path.
        internals.ariaLabel = null;
      }
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = hostAriaLabel;
      }
    } else {
      resolved = this.label || 'Tree';
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = resolved;
      }
    }

    if (this._resolvedAccessibleName !== resolved) {
      this._resolvedAccessibleName = resolved;
      if (!this._supportsIdrefRefs) {
        this.requestUpdate();
      }
    }
  }

  // ─── Render ───

  override render() {
    // Roving tabindex pattern (WCAG 2.4.3 Fix):
    // The tree container is NOT a Tab stop (tabindex="-1"). Tab focus goes
    // directly to the active item, which carries tabindex="0". The container
    // is only a landing target (tabindex="0") when the tree is empty.
    const containerTabindex = this._hasVisibleItems ? '-1' : '0';

    // Modern host-canonical path: role + aria-label live on the host via
    // `_internals`. The inner div is roleless on the modern path so AT
    // does not see a duplicated container role nested inside the host.
    if (this._supportsIdrefRefs) {
      return html`
        <div part="tree" class="tree" tabindex=${containerTabindex} @focusin=${this._handleFocusIn}>
          <slot @slotchange=${this._handleSlotChange}></slot>
        </div>
      `;
    }

    // Legacy fallback: keep role + aria-label on inner div for AT without
    // IDL element-references on ElementInternals. Mirror the resolved
    // accessible name (consumer aria-label / aria-labelledby flatten /
    // `label` property cascade) so menus named via the new host API still
    // announce on legacy engines.
    const fallbackLabel = this._resolvedAccessibleName || this.label || 'Tree';
    return html`
      <div
        part="tree"
        class="tree"
        role="tree"
        tabindex=${containerTabindex}
        aria-label=${fallbackLabel}
        aria-multiselectable=${this.selection === 'none'
          ? nothing
          : this.selection === 'multiple'
            ? 'true'
            : 'false'}
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
