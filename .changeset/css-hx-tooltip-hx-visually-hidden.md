---
"@helixui/library": patch
---

fix(css): resolve css audit findings for hx-tooltip and hx-visually-hidden

- hx-tooltip: replace deprecated `word-wrap: break-word` vendor alias with standard `overflow-wrap: break-word` (GH #831)
- hx-visually-hidden: add `clip-path: inset(50%) !important` alongside deprecated `clip: rect(0,0,0,0)` for modern browser support (GH #833)
