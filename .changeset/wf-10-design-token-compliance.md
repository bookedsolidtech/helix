---
'@helixui/library': patch
---

replace hardcoded css values with design token variables across all components

Audits and remediates design token compliance across all 88 component `.styles.ts` files:

- Replaces `--hx-font-weight-regular` (nonexistent) with `--hx-font-weight-normal` in hx-text (6 occurrences)
- Replaces `--hx-radius-full` (nonexistent) with `--hx-border-radius-full` in hx-meter
- Replaces `--hx-color-white` (nonexistent) with `--hx-color-neutral-0` in hx-nav
- Replaces `--hx-border-width-1` (nonexistent) with `--hx-border-width-thin` in hx-dialog and hx-drawer
- Replaces `--hx-color-surface-overlay` (semantically incorrect for arrow bg) with `--hx-color-neutral-0` in hx-popup
- Fixes wrong z-index modal fallback (100 → 1400) in hx-dialog
- Replaces `--hx-size-128` (nonexistent) with `--hx-container-narrow` in hx-dialog
- Replaces `--hx-font-size-base` (nonexistent) with `--hx-font-size-md` in hx-avatar, hx-checkbox, hx-table, hx-tag
- Replaces `--hx-size-2` (nonexistent) with `--hx-space-2` in hx-badge, hx-meter, hx-slider
- Fixes tooltip z-index from hardcoded 9999 to `--hx-z-index-tooltip` (1600) and transition from 0.15s to `--hx-transition-fast`
- Fixes focus ring color fallback from hardcoded `#2563eb` to proper token chain `var(--hx-focus-ring-color, var(--hx-color-primary-400, #60a5fa))` across 21 components
- Replaces hardcoded `opacity: 0.5/0.4/0.7/0.8` with appropriate `--hx-opacity-*` tokens across 14 components
- Wraps bare `1px` border declarations in `var(--hx-border-width-thin, 1px)` in hx-pagination, hx-tag
- Documents legitimate exception cases (local stacking context z-index 1/2, breakpoints in media queries, line-height 1 for icon buttons)
