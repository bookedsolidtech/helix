---
'@helixui/library': patch
---

refactor: remediate TypeScript strict findings across 13 components

Fixes all findings from WF-04 audit:
- Replace `PropertyValues` with `PropertyValues<this>` in updated() lifecycle hooks
- Add typed CustomEvent generics to all event dispatches (hx-alert, hx-banner, hx-button-group, hx-card, hx-form, hx-popup, hx-skeleton, hx-tabs, hx-toast)
- Replace unsafe type assertions with proper null checks in hx-copy-button, hx-popover, hx-tooltip
- Zero `any` types, zero non-null assertions introduced
