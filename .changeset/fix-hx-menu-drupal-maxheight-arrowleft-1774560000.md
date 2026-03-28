---
'@helixui/library': patch
'@helixui/drupal-behaviors': patch
---

fix(hx-menu): repair drupal behavior hx-close integration, add max-height overflow scroll, add arrowleft submenu close event

- Rewrite `hx-menu.behavior.js` to listen for the `hx-close` event dispatched by
  hx-menu instead of the no-op `menu.open = false` setter. Removes the redundant
  Escape keydown listener (hx-menu already fires hx-close on Escape). Adds optional
  trigger button `aria-expanded` toggle and focus-return on close.
- Add `max-height: var(--hx-menu-max-height, 20rem)` and `overflow-y: auto` to the
  `.menu` rule in `hx-menu.styles.ts` so tall menus scroll instead of overflowing
  the viewport.
- Add `@cssprop [--hx-menu-max-height=20rem]` doc annotation to `hx-menu.ts`.
- Add `ArrowLeft` handler in `hx-menu-item._handleKeyDown` that dispatches
  `hx-item-submenu-close` (bubbles, composed) per the APG menu pattern.
- Add `@fires hx-item-submenu-close` doc annotation to `hx-menu-item.ts`.
- Add tests for max-height CSS, ArrowLeft event dispatch, and event properties.
