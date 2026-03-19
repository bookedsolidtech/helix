---
'@helixui/library': patch
---

Fix lifecycle correctness: add missing super.updated() calls in hx-combobox, hx-counter, and hx-toast; prefix floating updateComplete promises with void in hx-top-nav, hx-split-button, and hx-nav
