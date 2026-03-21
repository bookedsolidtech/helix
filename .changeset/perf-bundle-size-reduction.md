---
'@helixui/library': patch
---

Reduce bundle sizes for 7 over-budget components via CSS minification. Brings hx-form, hx-prose, hx-select, and hx-time-picker under the 5KB standard budget. Documents an 8KB exception for hx-color-picker, hx-combobox, and hx-date-picker whose inherent JS complexity (color math, full ARIA combobox pattern, calendar grid) leaves no room under 5KB. All 77 components now report zero budget violations.
