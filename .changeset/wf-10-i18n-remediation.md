---
'@helixui/library': minor
---

WF-10 i18n remediation: RTL CSS logical properties and hardcoded string overrides

- Replaced all physical CSS directional properties with logical equivalents across 20 component style files: `margin-left/right` → `margin-inline-start/end`, `padding-left/right` → `padding-inline-start/end`, `border-left/right` → `border-inline-start/end`, `text-align: left/right` → `text-align: start/end`
- Added new overridable label properties to 8 components: `labelClose` (hx-alert), `labelError` (hx-copy-button), `labelRequired` + `labelNoOptions` (hx-select), `labelDragDetected` (hx-file-upload), `labelPageMessage` + `labelPageButton` (hx-pagination), `labelTrend` (hx-stat), `labelEllipsis` (hx-breadcrumb), `label` (hx-dropdown)
- Fixed character counter in hx-textarea to use grapheme cluster counting (`Array.from()`) for accurate emoji handling
