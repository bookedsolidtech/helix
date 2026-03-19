---
'@helixui/library': patch
---

fix: add non-color indicators for state/severity variants (wcag 1.4.1)

hx-alert, hx-badge, hx-tag, hx-toast, hx-progress-bar, hx-meter no longer rely on color alone to convey severity or status. visually-hidden text labels are now always rendered alongside color for screen reader and color-blind users.
