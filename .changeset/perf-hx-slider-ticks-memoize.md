---
"@helixui/library": patch
---

perf(hx-slider): memoize tick array computation in willUpdate to avoid redundant allocation on every drag render
