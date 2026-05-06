/**
 * Write the roving tabindex value through the right surface for each menu
 * item shape used inside `hx-menu`, `hx-dropdown`, `hx-overflow-menu`, and
 * `hx-split-button` panels.
 *
 * Codex push-gate round-2 (hx-overflow-menu) + round-8 finding 2
 * (hx-dropdown): host-canonical `hx-menu-item` cannot be addressed via the
 * raw `tabIndex` setter on the host because:
 *
 * - On the modern path the host carries the announced role + IDL ARIA, so
 *   the roving tabindex must land on the host (so Tab and arrow advance to
 *   the announced surface).
 * - On the fallback path the host is forced to `tabindex=-1` so the inner
 *   `.menu-item` element is the single focusable surface; the roving
 *   tabindex must land on the inner element.
 *
 * `hx-menu-item.setRovingTabIndex(value)` routes to the correct surface
 * internally. For plain slotted `[role="menuitem"]` elements (legacy
 * `<button>` / `<a>` children), fall back to the direct `tabIndex` write
 * so consumers without `hx-menu-item` keep working.
 *
 * Single source of truth across hx-dropdown, hx-overflow-menu, etc. so
 * future host-canonical menu shapes only have to teach this helper.
 *
 * @internal
 */
export function writeMenuItemRovingTabIndex(item: HTMLElement, value: number): void {
  if (item.localName === 'hx-menu-item') {
    const setter = (item as HTMLElement & { setRovingTabIndex?: (v: number) => void })
      .setRovingTabIndex;
    if (typeof setter === 'function') {
      setter.call(item, value);
      return;
    }
  }
  item.tabIndex = value;
}
