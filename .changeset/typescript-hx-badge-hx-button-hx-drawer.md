---
'@helixui/library': patch
---

Fix TypeScript type safety findings for hx-badge, hx-button, and hx-drawer. Adds deprecated `WcBadge` JSDoc metadata with removal target and introduces the canonical `HxBadge` type alias; marks resolved hx-button P1-03 (`WcButton` removed) and P3-04 findings; documents resolved hx-drawer P2-01 (`DrawerSize` narrowed with `string & Record<never, never>`) and P2-04 (`instanceof HTMLElement` guard). Updates AUDIT.md files across all three components.
