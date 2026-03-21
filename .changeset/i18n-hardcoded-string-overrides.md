---
'@helixui/library': patch
---

fix(i18n): add overridable string properties for localization across 11 components

Replace hardcoded English strings with `@property()` declarations that default to English
but can be overridden by consumers for i18n/l10n. Components: hx-alert, hx-checkbox,
hx-data-table, hx-date-picker, hx-drawer, hx-number-input, hx-pagination, hx-split-panel,
hx-switch, hx-text-input, hx-textarea.
