---
"@helixui/library": patch
---

fix ssr breakage: replace crypto.randomuuid() with monotonic counters in hx-tooltip, hx-popover, and hx-field to prevent hydration id mismatches
