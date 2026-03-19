---
"@helixui/library": patch
---

fix: ensure all interactive touch targets meet 44x44px wcag 2.5.5 healthcare minimum

Fixes insufficient touch target violations across hx-drawer, hx-dialog, hx-carousel,
hx-date-picker, hx-icon-button, hx-tag, hx-checkbox, hx-radio, and hx-data-table.
All interactive elements now enforce min-width/min-height of 2.75rem (44px) via the
--hx-touch-target-min design token (WCAG 2.5.5, healthcare mandate).

Closes #1027
