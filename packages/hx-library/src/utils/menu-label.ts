/**
 * Read the typeahead label for a menu item — the item's OWN text content
 * EXCLUDING any nested submenu subtree projected through `slot="submenu"`.
 *
 * Codex push-gate round-6 finding 3 (hx-menu) + round-7 finding 3 (composites):
 * a naive `item.textContent` walks the entire light-DOM tree, which on a
 * parent menuitem includes the slotted nested `<hx-menu>` and its descendants.
 * Typing the first letter of a child item then matches the parent (because
 * the parent's subtree contains that text), causing first-character nav to
 * focus the parent instead of the next sibling. Filter `slot="submenu"` out.
 *
 * Single source of truth for `hx-menu`, `hx-dropdown`, `hx-overflow-menu`,
 * and `hx-split-button` typeahead matchers.
 *
 * @internal
 */
export function getMenuItemTypeaheadLabel(item: Element): string {
  let text = '';
  for (const node of item.childNodes) {
    if (node instanceof Element && node.getAttribute('slot') === 'submenu') {
      continue;
    }
    text += node.textContent ?? '';
  }
  return text.trim();
}
