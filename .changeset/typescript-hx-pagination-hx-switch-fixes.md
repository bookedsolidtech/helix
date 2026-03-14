---
'@helixui/library': patch
---

fix(typescript): resolve type safety findings for hx-pagination, hx-switch, hx-tag, hx-theme, hx-tree-view

- hx-switch: Use PropertyValues<this> instead of Map<string, unknown> in updated() lifecycle
- hx-switch: Export HxSwitch canonical type alias; deprecate WcSwitch legacy alias
- hx-pagination: Export HxPagination canonical type alias
- hx-tag: Export HxTag canonical type alias; annotate WcTag as deprecated in index.ts
- hx-theme: Add HxTheme/WcTheme type aliases with @deprecated on WcTheme; export token override types (TokenDefinition, TokenEntry)
- hx-tree-view: Add HxTreeView/HxTreeItem canonical type aliases; annotate WcTreeView/WcTreeItem as deprecated; export all from index.ts
