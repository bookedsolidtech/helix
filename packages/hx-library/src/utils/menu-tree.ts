/**
 * Composed-tree walkers for the `hx-menu` family.
 *
 * Extracted from `hx-menu.ts` (codex push-gate round-9) because the same
 * walks are now needed by `hx-dropdown`, `hx-overflow-menu`, and
 * `hx-split-button` to route nested `hx-item-submenu-open` /
 * `hx-item-submenu-close` events to the correct parent. Keeping the helpers
 * in a shared util avoids importing `hx-menu.ts` from the composites
 * (cyclic) and keeps the tag-name string checks in one place.
 *
 * @module
 */

/**
 * Walks the composed tree from `start` outward and returns the closest
 * enclosing `<hx-menu>` element, or `null` if none exists. Crosses both
 * shadow boundaries (`getRootNode().host`) and slot boundaries
 * (`assignedSlot`) so an item nested inside a submenu resolves to the
 * inner menu, not the outer one. Codex push-gate round-4 P1.
 *
 * Returned as `Element` (rather than the concrete `HelixMenu` class) to
 * avoid a circular import between `hx-menu` and this util; callers can
 * narrow with `instanceof HelixMenu` if they need typed access.
 *
 * @internal
 */
export function findClosestMenuAncestor(start: Element): Element | null {
  // The dispatching `hx-menu-item` is itself an Element; an ancestor
  // `hx-menu` may live above it via `parentNode` (light DOM), via
  // `assignedSlot` (slotted into a menu's default slot — the common case),
  // or via `getRootNode().host` (the menu hosts a shadow root that contains
  // it — not used in this codebase but defended for completeness).
  let node: Node | null = start;
  while (node) {
    if (node instanceof Element && node.tagName.toLowerCase() === 'hx-menu') {
      return node;
    }
    // Prefer `assignedSlot` when the node is light-DOM-slotted into another
    // shadow tree — that is exactly how `hx-menu-item` lives inside
    // `hx-menu`. After hopping into the slot, continue from the slot itself
    // so we keep climbing through that owner's shadow root.
    if (node instanceof Element && node.assignedSlot) {
      node = node.assignedSlot;
      continue;
    }
    const parentNode: Node | null = node.parentNode;
    if (parentNode) {
      node = parentNode;
      continue;
    }
    // Reached the top of a tree (Document or ShadowRoot). For a ShadowRoot,
    // hop to its host and continue climbing in the outer tree.
    if (node instanceof ShadowRoot) {
      node = node.host;
      continue;
    }
    break;
  }
  return null;
}

/**
 * Returns the `hx-menu-item` that owns `menu` as a nested submenu, or
 * `null` if `menu` is a top-level menu (not slotted into a parent item's
 * `slot="submenu"`). Used by ArrowLeft handling to close the correct
 * submenu and return focus to the right parent. Codex push-gate round-4
 * P1.
 *
 * Returned as `HTMLElement` (rather than the concrete `HelixMenuItem`
 * class) to avoid a circular import with `hx-menu-item`; callers can
 * narrow with `instanceof HelixMenuItem` if they need typed access.
 *
 * @internal
 */
export function findOwningMenuItem(menu: Element): HTMLElement | null {
  const slot = (menu as HTMLElement).assignedSlot;
  if (!slot || slot.name !== 'submenu') return null;
  // The slot lives in the owning menu-item's shadow root. Hop to the host.
  const root = slot.getRootNode();
  if (!(root instanceof ShadowRoot)) return null;
  const host = root.host;
  if (host instanceof HTMLElement && host.tagName.toLowerCase() === 'hx-menu-item') {
    return host;
  }
  return null;
}
