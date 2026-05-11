import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import '../hx-icon/hx-icon.js';
import { HelixElement } from '../../base/index.js';
import { helixTreeItemStyles } from './hx-tree-item.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';
import { findClosestTreeItem } from '../../utils/tree-walk.js';

/** Detail type for the `hx-tree-item-select` event. */
export interface HxTreeItemSelectDetail {
  /** The tree item that was selected or activated. */
  item: HelixTreeItem;
}

/**
 * A tree item used within an hx-tree-view component.
 * Supports expand/collapse, selection, keyboard navigation, and icon/children slots.
 *
 * Group 5c host-canonical: `role="treeitem"` lives on the **host** via
 * `_internals.role`. The roving tabindex is written to the host on the
 * modern path so the host is the focusable surface and lands directly
 * under the parent `<hx-tree-view>` (which carries `role="tree"`) in the
 * AT-walked tree. The inner `.item-row` is presentational on the modern
 * path — no role, no aria-* attributes — and carries only click/keyboard
 * event handlers. Keyboard activation (Enter/Space) and expand/collapse
 * (ArrowLeft/Right at the leaf level) are owned by the host's `keydown`
 * handler; ArrowUp/Down/Home/End and typeahead bubble to the parent
 * `<hx-tree-view>` for navigation.
 *
 * The nested `[role="group"]` element that wraps the `slot="children"`
 * stays in the inner shadow DOM regardless of path — that group is a
 * separate sub-surface for the children, not a duplicate of the
 * treeitem role.
 *
 * On the legacy fallback path the inner `.item-row` carries
 * `role="treeitem"` + aria-* state, the host role is suppressed, and the
 * roving tabindex is written to the inner element so there is only ONE
 * focusable surface per item (mirrors hx-menu-item round-8).
 *
 * @summary Individual item within an hx-tree-view hierarchical tree.
 *
 * @tag hx-tree-item
 *
 * @slot - Default slot for the item label content. This text is also used to label the children group.
 * @slot icon - Custom icon shown before the label.
 * @slot children - Nested hx-tree-item elements for sub-tree.
 *
 * @csspart item - The outer item container.
 * @csspart row - The interactive item row (presentational on the modern path; carries role="treeitem" + aria-* on the legacy fallback).
 * @csspart expand-icon - The expand/collapse toggle button.
 * @csspart label - The label text content area.
 * @csspart children - The children container (always carries role="group").
 *
 * @cssprop [--hx-tree-item-color=var(--hx-color-neutral-900)] - Item text color.
 * @cssprop [--hx-tree-item-hover-bg=var(--hx-color-neutral-100)] - Hover background color.
 * @cssprop [--hx-tree-item-selected-bg=var(--hx-color-primary-100)] - Selected background color.
 * @cssprop [--hx-tree-item-selected-color=var(--hx-color-primary-800)] - Selected text color.
 * @cssprop [--hx-tree-item-padding-x=var(--hx-space-2)] - Horizontal padding.
 * @cssprop [--hx-tree-item-padding-y=var(--hx-space-1)] - Vertical padding.
 * @cssprop [--hx-tree-indent-size=1.5rem] - Indentation size per level.
 *
 * @fires {CustomEvent<HxTreeItemSelectDetail>} hx-tree-item-select - Dispatched when this item is clicked or activated via keyboard.
 */
@customElement('hx-tree-item')
export class HelixTreeItem extends HelixElement {
  static override styles = [helixTreeItemStyles, forcedColorsSurface];

  /**
   * Test seam (codex push-gate round-1 lift from group 5b): when set to
   * `true` or `false`, overrides the platform `supportsIdrefElementReferences`
   * probe before `connectedCallback` seeds `_supportsIdrefRefs`. Mirrors the
   * hx-menu-item / hx-select seam — required so tests can deterministically
   * exercise the legacy fallback render branch.
   *
   * Production code MUST NOT touch this field. It is `static` so the test
   * stub cleanup is global and obvious.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

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

  /**
   * Tracks whether any elements are assigned to the children slot, controlling expand icon visibility.
   * @internal
   */
  @state() private _hasChildren = false;

  /**
   * Whether this item is the roving-tabindex active item in the tree.
   * @internal
   */
  @state() private _rovingActive = false;

  /**
   * Text content from the default slot, used to label the children group for screen readers.
   * @internal
   */
  @state() private _labelText = '';

  /**
   * Cached ARIA position metadata. Computed once on connect and on slotchange
   * of the parent container, avoiding repeated DOM traversal on every render.
   * @internal
   */
  @state() private _level = 1;
  /**
   * One-based position of this item within its sibling set, set as aria-posinset.
   * @internal
   */
  @state() private _posInSet = 1;
  /**
   * Total count of sibling hx-tree-item elements at the same level, set as aria-setsize.
   * @internal
   */
  @state() private _setSize = 1;
  /**
   * Whether the owning hx-tree-view supports item selection (single or multiple mode).
   * @internal
   */
  @state() private _selectable = false;

  /** @internal */
  @query('.item-row') private _itemRowEl!: HTMLElement | null;

  // ─── Host-canonical ARIA bookkeeping ───

  /** @internal */
  private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Resolved accessible name override for the tree item — read by both
   * `_syncHostAriaSemantics()` (modern path: host `internals.ariaLabel`)
   * and the fallback `render()` branch (legacy path: inner
   * `div[role="treeitem"]` `aria-label`). Empty string means "no override"
   * — slotted text content provides the implicit name through the
   * announced surface (host on modern; inner row on fallback). AccName 1.2
   * §4.3.1 precedence: consumer host `aria-labelledby` (flattened) >
   * consumer host `aria-label` > implicit slotted text.
   * @internal
   */
  private _resolvedAccessibleName = '';

  // ─── Computed ARIA ───

  /**
   * Whether this item has slotted children.
   * @returns True if one or more elements are assigned to the children slot.
   */
  get hasChildItems(): boolean {
    return this._hasChildren;
  }

  /**
   * The text content of the item's label slot, used for typeahead keyboard navigation.
   * Returns an empty string until the label slot has been assigned.
   */
  get labelText(): string {
    return this._labelText;
  }

  /**
   * Recompute all cached ARIA metadata in a single DOM pass.
   * Called on connect, slotchange, and whenever structural context may change.
   * @internal
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

  /**
   * Set ARIA position metadata from the parent hx-tree-view in a single O(n) pass.
   * Calling this avoids the O(n^2) ancestor-walk + sibling-iteration in _updateAriaMetadata
   * when the parent already knows the layout.
   * @internal
   */
  setAriaMetadata(level: number, posInSet: number, setSize: number, selectable: boolean): void {
    this._level = level;
    this._posInSet = posInSet;
    this._setSize = setSize;
    this._selectable = selectable;
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Honour the static test override so synthetic environments choose the
    // path BEFORE connect runs — the fallback render branch needs to be
    // selected at first paint so role + roving tabindex placement matches a
    // legacy engine for the entire lifecycle.
    const ctor = this.constructor as typeof HelixTreeItem;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);
    this._updateAriaMetadata();
    // Click + keydown live on the HOST so the active surface (the host on
    // the modern path; either the host or the inner div in delegating
    // engines) receives events. Origin guards (`_isOwnEvent`) reject events
    // bubbled from a CHILD `hx-tree-item` slotted into our `children`
    // slot — without that, selecting Child also activates Parent.
    this.addEventListener('click', this._handleClick);
    this.addEventListener('keydown', this._handleKeyDown);
    this._syncHostAriaSemantics();
    this._applyHostTabIndex();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this._handleClick);
    this.removeEventListener('keydown', this._handleKeyDown);
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (
      changedProperties.has('disabled') ||
      changedProperties.has('selected') ||
      changedProperties.has('expanded') ||
      (changedProperties as Map<PropertyKey, unknown>).has('_hasChildren') ||
      (changedProperties as Map<PropertyKey, unknown>).has('_selectable') ||
      (changedProperties as Map<PropertyKey, unknown>).has('_level') ||
      (changedProperties as Map<PropertyKey, unknown>).has('_posInSet') ||
      (changedProperties as Map<PropertyKey, unknown>).has('_setSize')
    ) {
      this._syncHostAriaSemantics();
    }
    if (
      (changedProperties as Map<PropertyKey, unknown>).has('_rovingActive') ||
      changedProperties.has('disabled')
    ) {
      this._applyHostTabIndex();
    }
  }

  /**
   * Apply the roving tabindex through the right surface for the active
   * path. On the modern host-canonical path the host carries the role +
   * tabindex; on the legacy fallback path the inner `.item-row` carries
   * both via the template, so the host MUST stay out of the tab order to
   * avoid a double-focusable per item (mirrors hx-menu-item round-1
   * finding 3).
   * @internal
   */
  private _applyHostTabIndex(): void {
    if (!this._supportsIdrefRefs) {
      // Fallback path: inner `.item-row` is the focusable surface. Keep
      // the host out of the sequential focus order entirely.
      this.tabIndex = -1;
      return;
    }
    if (this.disabled) {
      this.tabIndex = -1;
    } else {
      this.tabIndex = this._rovingActive ? 0 : -1;
    }
  }

  /**
   * Mirror treeitem semantics onto the host via ElementInternals so
   * consumer-supplied `aria-label`, `aria-labelledby`, expand/select state,
   * and tree position all reach the announced control.
   *
   * Codex push-gate round-1 lift (mirrors hx-menu-item round-6 finding 2):
   * on the legacy fallback path the inner `.item-row` already exposes
   * role="treeitem" + aria-* via the template. If we ALSO write those onto
   * the host's ElementInternals, AT sees TWO treeitems for one logical
   * option — the duplicate-surface problem host-canonical migration is
   * meant to eliminate. Suppress all of these state writes on the host
   * when the fallback path is in effect; the inner element is the
   * canonical announced surface.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;

    if (!this._supportsIdrefRefs) {
      internals.role = null;
      internals.ariaLabel = null;
      internals.ariaDisabled = null;
      internals.ariaSelected = null;
      internals.ariaExpanded = null;
      internals.ariaLevel = null;
      internals.ariaPosInSet = null;
      internals.ariaSetSize = null;
    } else {
      internals.role = 'treeitem';
      internals.ariaDisabled = this.disabled ? 'true' : null;
      internals.ariaSelected = this._selectable ? (this.selected ? 'true' : 'false') : null;
      internals.ariaExpanded = this._hasChildren ? (this.expanded ? 'true' : 'false') : null;
      internals.ariaLevel = String(this._level);
      internals.ariaPosInSet = String(this._posInSet);
      internals.ariaSetSize = String(this._setSize);
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
    // consumer aria-label > implicit slotted text (left to AccName
    // computation through the host's role). When neither override is
    // supplied, ariaLabel is cleared so AT walks slotted children for the
    // accessible name.
    let resolved = '';
    if (hasEffectiveLabelledBy) {
      const flattened =
        labelEls
          .map((el) => flattenAccName(el))
          .filter(Boolean)
          .join(' ') ||
        hostAriaLabel ||
        '';
      resolved = flattened;
      if (this._supportsIdrefRefs) {
        // Modern path: element refs win; clear ariaLabel so they aren't
        // shadowed by a stale string.
        internals.ariaLabel = null;
      } else {
        internals.ariaLabel = flattened || null;
      }
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
      internals.ariaLabel = hostAriaLabel;
    } else {
      internals.ariaLabel = null;
    }

    if (this._resolvedAccessibleName !== resolved) {
      this._resolvedAccessibleName = resolved;
      if (!this._supportsIdrefRefs) {
        this.requestUpdate();
      }
    }
  }

  // ─── Children Detection ───

  /**
   * Updates _hasChildren and recomputes ARIA metadata when the children slot assignment changes.
   * @internal
   */
  private _handleChildrenSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasChildren = slot.assignedElements().length > 0;
    this._updateAriaMetadata();
    this._syncHostAriaSemantics();
  }

  /**
   * Captures the text content from the default (label) slot for use on the children group label.
   * @internal
   */
  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const nodes = slot.assignedNodes({ flatten: true });
    this._labelText = nodes
      .map((n) => n.textContent ?? '')
      .join('')
      .trim();
  }

  // ─── Event Handlers ───

  /**
   * Origin guard for host-bound click/keydown handlers. Returns `true` only
   * when the event originated on THIS host's surface (its shadow tree or
   * itself) and not on a nested `hx-tree-item` projected into the
   * `children` slot.
   *
   * Codex push-gate round-1 lift (mirrors hx-menu-item round-5 P1):
   * children are slotted descendants in the parent's light DOM. Click/
   * keydown events from a Child item bubble through the parent host's
   * listeners — without this guard, selecting Child also activates
   * Parent (double `hx-tree-item-select`) and Enter/Space on Child
   * re-trigger Parent's handlers.
   *
   * Uses the shared `findClosestTreeItem` walker (composed-tree, crosses
   * shadow + slot boundaries) so the test bed is reused across the
   * tree family. The event is "ours" iff the closest `hx-tree-item`
   * ancestor of the original target is `this`.
   * @internal
   */
  private _isOwnEvent(e: Event): boolean {
    const path = e.composedPath();
    for (const node of path) {
      if (!(node instanceof Element)) continue;
      const closest = findClosestTreeItem(node);
      if (closest) {
        return closest === this;
      }
    }
    return false;
  }

  /**
   * Toggles the expanded state when the expand/collapse button is clicked, stopping event propagation.
   * @internal
   */
  private _handleExpandClick(e: Event): void {
    e.stopPropagation();
    if (this.disabled) return;
    this.expanded = !this.expanded;
  }

  /**
   * Dispatches the hx-tree-item-select event when the item is activated via
   * click or keyboard. The host listens for click; this method is also
   * invoked from the Enter/Space keydown branch.
   * @internal
   */
  private _activate(): void {
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent<HxTreeItemSelectDetail>('hx-tree-item-select', {
        bubbles: true,
        composed: true,
        detail: { item: this },
      }),
    );
  }

  /** @internal */
  private _handleClick = (e: MouseEvent): void => {
    // Codex push-gate round-1 lift (mirrors hx-menu-item round-5 P1):
    // clicks on a nested CHILD tree-item bubble through this host. Without
    // an origin guard, both Child and Parent activate.
    if (!this._isOwnEvent(e)) return;
    // CodeRabbit MUST-FIX: a click landing inside our own children
    // container (the `[role="group"]` wrapper around `<slot name="children">`)
    // — i.e. on padding, between child items, on the group itself — also
    // walks back up to THIS host through `_isOwnEvent`. Treat any click
    // sourced from the children group as NOT a row activation.
    const path = e.composedPath();
    for (const node of path) {
      if (!(node instanceof Element)) continue;
      if (node === this) break;
      if (node.getAttribute && node.getAttribute('part') === 'children') return;
    }
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this._activate();
  };

  /** @internal */
  private _handleKeyDown = (e: KeyboardEvent): void => {
    // Codex push-gate round-1 lift (mirrors hx-menu-item round-5 P1):
    // Enter / Space / ArrowLeft / ArrowRight at a focused CHILD bubble
    // through this host. Without an origin guard, Parent treats them as
    // its own — double activation, wrong-level expand/collapse.
    if (!this._isOwnEvent(e)) return;
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
        this._activate();
        break;
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Home':
      case 'End':
        // Bubble up to hx-tree-view for navigation
        break;
    }
  };

  // ─── Public API ───

  /**
   * Sets the roving tabindex state for this item.
   * When `active` is true, the host (modern) or inner row (fallback) gets
   * `tabindex="0"` making it the Tab-reachable surface in the tree. All
   * other items should be set to false. Called by the parent hx-tree-view
   * to manage the roving tabindex pattern.
   */
  setRovingActive(active: boolean): void {
    this._rovingActive = active;
    this._applyHostTabIndex();
  }

  /**
   * Focus this item. On the modern host-canonical path, focus lands on the
   * host (which carries the roving tabindex and announced role). On the
   * legacy fallback path, focus delegates to the inner `.item-row` which
   * still carries the role.
   */
  override focus(options?: FocusOptions): void {
    if (this._supportsIdrefRefs) {
      HTMLElement.prototype.focus.call(this, options);
    } else {
      this._itemRowEl?.focus(options);
    }
  }

  // ─── Render ───

  /**
   * Renders the expand/collapse chevron button, or a placeholder span when the item has no children.
   * @internal
   */
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
        <hx-icon
          class="expand-glyph"
          library="helix"
          name="chevron-right"
          aria-hidden="true"
        ></hx-icon>
      </button>
    `;
  }

  override render() {
    // The nested children container always carries role="group" — that is
    // a separate sub-surface for the children, not a duplicate of the
    // treeitem role, and is correct on both the modern and fallback paths.
    const childrenGroup = html`
      <div
        part="children"
        class=${classMap({ children: true, 'children--expanded': this.expanded })}
        role="group"
        aria-label=${this._labelText ? `${this._labelText} children` : 'children'}
        aria-hidden=${!this.expanded || nothing}
      >
        <div class="children-inner">
          <slot name="children" @slotchange=${this._handleChildrenSlotChange}></slot>
        </div>
      </div>
    `;

    // Modern host-canonical path: role/aria-* and tabindex live on the
    // host via `_internals` and the `_applyHostTabIndex()` helper. The
    // inner `.item-row` is presentational (no role, no aria-*) and carries
    // only the visual treatment + slot composition. Click + keydown
    // handlers stay on the host (see connectedCallback) so keyboard
    // activation works regardless of which surface is focused.
    if (this._supportsIdrefRefs) {
      return html`
        <div part="item" class="item">
          <div part="row" class="item-row">
            ${this._renderExpandIcon()}
            <span class="item-icon">
              <slot name="icon"></slot>
            </span>
            <span part="label" class="item-label">
              <slot @slotchange=${this._handleLabelSlotChange}></slot>
            </span>
          </div>
          ${childrenGroup}
        </div>
      `;
    }

    // Legacy fallback: keep role/aria-* on the inner `.item-row` for AT
    // without IDL element-references on ElementInternals. Click + keydown
    // still listen on the host (see connectedCallback) so behaviour is
    // uniform across paths. The inner element MUST mirror the same
    // accessible name resolved by `_syncHostAriaSemantics()`.
    const fallbackAriaLabel = this._resolvedAccessibleName || nothing;
    const ariaExpanded = this._hasChildren ? String(this.expanded) : nothing;
    const ariaSelected = this._selectable ? String(this.selected) : nothing;

    return html`
      <div part="item" class="item">
        <div
          part="row"
          class="item-row"
          role="treeitem"
          tabindex=${this._rovingActive ? '0' : '-1'}
          aria-label=${fallbackAriaLabel}
          aria-expanded=${ariaExpanded}
          aria-selected=${ariaSelected}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-level=${this._level}
          aria-posinset=${this._posInSet}
          aria-setsize=${this._setSize}
        >
          ${this._renderExpandIcon()}
          <span class="item-icon">
            <slot name="icon"></slot>
          </span>
          <span part="label" class="item-label">
            <slot @slotchange=${this._handleLabelSlotChange}></slot>
          </span>
        </div>
        ${childrenGroup}
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
