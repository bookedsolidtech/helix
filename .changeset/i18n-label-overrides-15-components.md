---
'@helixui/library': minor
---

feat(i18n): replace hardcoded English strings with customizable label properties across 15 components

All 15 components that contained hardcoded English ARIA labels and live-region text now expose
`@property`-backed overrides, allowing consumers to provide localized strings without patching
Shadow DOM internals.

**Components updated:** hx-alert, hx-banner, hx-carousel, hx-color-picker, hx-combobox,
hx-data-table, hx-date-picker, hx-dialog, hx-drawer, hx-file-upload, hx-nav, hx-number-input,
hx-pagination, hx-rating, hx-split-panel.

**Breaking change:** None — all new properties carry English defaults matching prior hardcoded values.
