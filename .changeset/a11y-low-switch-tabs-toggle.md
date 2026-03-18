---
'@helixui/library': patch
---

fix(a11y): hx-switch label element, hx-tabs tabindex comment, hx-toggle-button missing label warning

- hx-switch: change label from span to native label element with for attribute for proper HTML association
- hx-tabs: document dual tabindex pattern with explicit WCAG 2.4.3 reference
- hx-toggle-button: add dev console.warn when no accessible label or slot text is present
