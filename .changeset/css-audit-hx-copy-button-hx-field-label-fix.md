---
"@helixui/library": patch
---

fix(css): mark CSS audit findings as resolved for hx-popover, hx-skeleton, hx-split-button

- hx-popover: P2-01 box-shadow uses --hx-shadow-md token cascade, P2-02 arrow border clipping fixed via JS innerBorderMap, P2-05 :host uses display:contents with trigger-wrapper inline-block
- hx-skeleton: P1-03 prefers-reduced-motion hides shimmer overlay (display:none), P2-01 --hx-skeleton-circle-radius token added, P2-03 --hx-skeleton-shimmer-width token added
- hx-split-button: P1-02 hx-menu-item outline-offset fixed to 0px (no clipping), P2-02 menu max-height + overflow-y:auto added, P2-03 menu open animation added
