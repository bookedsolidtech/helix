---
"@helixui/library": patch
---

fix(hx-rating): use role="slider" for half-star precision to fix wcag 2.5.3 label-content-name mismatch — when precision="0.5", half values (1.5, 2.5, etc.) are now correctly represented in the accessibility tree via aria-valuenow/aria-valuetext instead of a radiogroup with mismatched whole-integer labels
