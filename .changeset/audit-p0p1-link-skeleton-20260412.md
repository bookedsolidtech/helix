---
'@helixui/library': patch
---

fix(hx-link): add missing tabindex="0" to disabled span — screen readers can
now reach disabled links via keyboard navigation and announce the disabled state
(P0-1 audit finding)
