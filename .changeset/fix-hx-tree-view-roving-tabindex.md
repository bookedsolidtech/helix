---
'@helixui/library': patch
---

fix(hx-tree-view): implement roving tabindex pattern to resolve WCAG 2.4.3 focus order violation; tree container is no longer a Tab stop when items are present, Tab focus lands directly on the active tree item
