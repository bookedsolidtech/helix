---
'@helixui/library': patch
---

fix(hx-badge): resolve three open bugs — prefix slot in dot mode, pulse ring animation, and story label verification

- prefix slot no longer rendered in dot mode (template guard + css defense-in-depth), preventing flex-gap overflow artifacts
- pulse ring animation now starts at 2px spread so --hx-badge-pulse-color is visually active
- RemovableWithCount story play function verifies prefix labels appear alongside counts
