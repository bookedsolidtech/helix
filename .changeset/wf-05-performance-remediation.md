---
'@helixui/library': patch
---

perf: remediate wf-05 bundle and runtime performance findings across 9 components — dynamic import for @floating-ui/dom in hx-popover, scoped outside-click listeners in hx-combobox and hx-select, extracted color-utils.ts for tree-shaking in hx-color-picker, cached DOM queries and getBoundingClientRect in hx-color-picker drag handlers, cached cell list in hx-data-table keydown, memoized Intl.DateTimeFormat in hx-date-picker, cached visible-items list in hx-tree-view, O(n) parent-driven ARIA metadata in hx-tree-item, optimized body-children scan in hx-drawer, hoisted FOCUSABLE_SELECTORS constant in hx-dialog
