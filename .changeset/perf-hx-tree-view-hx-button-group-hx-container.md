---
'@helixui/library': patch
---

perf: fix performance findings for hx-tree-view, hx-button-group, and hx-container

- hx-tree-view: Add `contain: layout style` to `:host` in `hx-tree-view.styles.ts` and `hx-tree-item.styles.ts` for browser rendering isolation
- hx-tree-view: Eliminate per-render DOM traversal in `hx-tree-item.ts` by caching `_level`, `_posInSet`, `_setSize`, and `_selectable` as `@state` properties; `_updateAriaMetadata()` runs once on `connectedCallback` and `slotchange` instead of on every render
- hx-tree-view: Document scale limits and lazy-loading guidance in `hx-tree-view.ts` JSDoc (P2-9: no virtualization strategy)
- hx-button-group: Mark `requestUpdate()` removal and `contain: layout style` as fixed in AUDIT.md (already applied in prior cycle)
- hx-container: Add `contain: layout style` to `:host` in `hx-container.styles.ts`

Closes #832, #787, #792
