---
'@helixui/library': patch
---

fix(type-safety): eliminate `as EventListener` casts in hx-radio-group, hx-tabs, hx-tooltip, hx-steps, and hx-breadcrumb by typing handlers to accept `Event` and narrowing with proper type guards; replace `as HelixTab[]`/`as HelixTabPanel[]` casts with type guard filters; guard `e.target` slot handler casts with `instanceof HTMLSlotElement` checks
