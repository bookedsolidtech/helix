/**
 * Composed-tree walkers for the `hx-tree-view` family.
 *
 * Mirrors the `menu-tree.ts` utilities (codex push-gate round-9 extraction
 * for the menu family), but specialized for `hx-tree-view` / `hx-tree-item`
 * where nesting is structural rather than slot-based — child items live in a
 * named `slot="children"` projected into the parent item's shadow root,
 * and any number of nesting levels are legal.
 *
 * Group 5c (codex push-gate round-1 lift): `hx-tree-view`'s host-bound
 * keydown / select handlers receive bubbled events from EVERY descendant
 * tree-item, including ones that legitimately belong to an inner
 * `hx-tree-view`. The same guard pattern that `hx-menu` uses (act only when
 * THIS host is the closest enclosing surface of the dispatching item) is
 * required for trees too. `hx-tree-item._handleClick` /
 * `_handleKeyDown` need to ignore bubbled events from a CHILD `hx-tree-item`
 * — otherwise selecting Child also activates Parent and Enter on Child
 * re-fires Parent's handler.
 *
 * @module
 */

/**
 * Walks the composed tree from `start` outward and returns the closest
 * enclosing `<hx-tree-view>` element, or `null` if none exists. Crosses
 * shadow boundaries (`getRootNode().host`) and slot boundaries
 * (`assignedSlot`) so that an item nested inside a child tree-item — which
 * lives in the parent item's `slot="children"`, projected into the parent's
 * shadow root — resolves to the correct enclosing tree.
 *
 * Returned as `Element` to avoid a circular import between `hx-tree-view`
 * and this util; callers narrow with `instanceof HelixTreeView` if needed.
 *
 * @internal
 */
export function findClosestTreeView(start: Element): Element | null {
  let node: Node | null = start;
  while (node) {
    if (node instanceof Element && node.tagName.toLowerCase() === 'hx-tree-view') {
      return node;
    }
    if (node instanceof Element && node.assignedSlot) {
      node = node.assignedSlot;
      continue;
    }
    const parentNode: Node | null = node.parentNode;
    if (parentNode) {
      node = parentNode;
      continue;
    }
    if (node instanceof ShadowRoot) {
      node = node.host;
      continue;
    }
    break;
  }
  return null;
}

/**
 * Walks the composed tree from `start` outward and returns the closest
 * enclosing `<hx-tree-item>` element, or `null` if none exists. Includes
 * `start` itself when it is an `hx-tree-item`.
 *
 * Used by `hx-tree-item`'s `_isOwnEvent` origin guard: a click or keydown
 * is "ours" iff the closest `hx-tree-item` ancestor of the original event
 * target is THIS item (not a child item slotted into our `children` slot).
 * The walk crosses shadow + slot boundaries so a deeply nested child item
 * resolves correctly.
 *
 * Returned as `Element` to avoid a circular import; callers narrow with
 * `instanceof HelixTreeItem` if needed.
 *
 * @internal
 */
export function findClosestTreeItem(start: Element): Element | null {
  let node: Node | null = start;
  while (node) {
    if (node instanceof Element && node.tagName.toLowerCase() === 'hx-tree-item') {
      return node;
    }
    if (node instanceof Element && node.assignedSlot) {
      node = node.assignedSlot;
      continue;
    }
    const parentNode: Node | null = node.parentNode;
    if (parentNode) {
      node = parentNode;
      continue;
    }
    if (node instanceof ShadowRoot) {
      node = node.host;
      continue;
    }
    break;
  }
  return null;
}
