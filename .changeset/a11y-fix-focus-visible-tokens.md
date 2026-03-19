---
'@helixui/library': patch
---

fix: replace hardcoded focus-visible colors with design tokens across 14 components

All interactive element focus rings now use the `--hx-focus-ring-width`,
`--hx-focus-ring-color`, and `--hx-focus-ring-offset` token chain with
component-level override points. Fixes hx-drawer, hx-dialog, hx-breadcrumb,
hx-pagination, hx-card, hx-carousel, hx-combobox, hx-file-upload, hx-menu-item,
hx-nav, hx-overflow-menu, hx-select, hx-split-panel, and hx-tree-item.
