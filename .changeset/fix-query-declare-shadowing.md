---
'@helixui/library': patch
---

fix(hx-number-input, hx-slider): use `declare` on @query fields to prevent instance initializer from shadowing Lit's prototype getter
