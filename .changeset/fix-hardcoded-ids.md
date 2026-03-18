---
'@helixui/library': patch
---

fix(a11y): replace hardcoded ids in hx-accordion-item, hx-meter, and hx-progress-bar with instance-scoped monotonic counter ids to prevent wcag 1.3.1 id collision failures when multiple instances appear on the same page; also fix conflicting aria-label + aria-labelledby on hx-progress-bar
