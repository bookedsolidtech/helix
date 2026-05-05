---
'@helixui/library': patch
---

fix(aria-group-5b): codex push-gate round-9 — submenu open/close routing in dropdown + overflow-menu + split-button

Round-4 added `hx-item-submenu-open` / `hx-item-submenu-close` handling to
`hx-menu` (parent walk + `setSubmenuOpen` on owning ancestor). The 3
composite hosts that wrap their own `[role="menu"]` panel of slotted
`hx-menu-item`s — `hx-dropdown`, `hx-overflow-menu`, `hx-split-button` —
never got that handling. When a slotted `hx-menu-item` opens or closes a
nested submenu, the events bubbled past the composite with no listener.

**Fixes:**

- **P1 — `hx-dropdown.ts`**: panel now binds `@hx-item-submenu-open` and
  `@hx-item-submenu-close`. Defers to an inner `hx-menu` when one
  encloses the dispatching item (it owns the toggle); otherwise opens or
  closes the panel-level surface.
- **P1 — `hx-overflow-menu.ts`**: same delegation, applied to the
  conditionally rendered overflow panel.
- **P1 — `hx-split-button.ts`**: same delegation, applied to the
  split-button menu panel.

**Helper extraction:** `findClosestMenuAncestor` and `findOwningMenuItem`
moved from `hx-menu.ts` (4 callsites) to a new shared util
`packages/hx-library/src/utils/menu-tree.ts` (now 7+ callsites across the
4 menu-family components). `hx-menu.ts` keeps thin typed wrappers that
narrow the shared `Element` return to `HelixMenu` / `HelixMenuItem` to
preserve in-file callsite types.

**Regression tests** added in each composite: nested
`<hx-menu-item submenu-open><hx-menu slot="submenu"><hx-menu-item>...`
inside the composite. ArrowLeft on Child asserts the parent's
`aria-expanded === 'false'`, the composite panel stays open, and focus
returns to the parent host.
