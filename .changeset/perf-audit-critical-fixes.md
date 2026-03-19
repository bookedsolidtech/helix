---
'@helixui/library': patch
---

fix three critical performance findings from audit: narrow sideEffects in package.json to css-only to restore tree-shaking, replace per-render querySelector in hx-table with slotchange-driven state, and make hx-color-picker global listeners conditional on open/drag state
