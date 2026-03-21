---
'@helixui/library': patch
---

fix(hx-card): make --hx-card-color propagate to slotted content

Setting --hx-card-color on hx-card now correctly applies to slotted (light DOM) content. The :host color fallback is changed to `inherit` so cards on dark backgrounds inherit ambient color when --hx-card-color is not set. The .card__body section also now respects --hx-card-color.
