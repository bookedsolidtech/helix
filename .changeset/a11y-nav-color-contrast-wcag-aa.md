---
'@helixui/library': patch
---

fix color contrast in hx-nav-item and hx-side-nav to meet WCAG 2.1 AA requirements

- Add background-color and color to hx-side-nav :host so slotted light-DOM content inherits the dark surface context; without this axe-core evaluates slotted text against the page white background, producing false-positive color-contrast failures
- Correct all CSS fallback hex values in hx-nav-item.styles.ts and hx-side-nav.styles.ts to match actual @helixui/tokens values (previously used old Tailwind palette values)
- Fix active-state fallback background from primary-500 (#2563eb) to correct primary-600 (#1d4ed8); active-hover fallback from primary-600 to primary-700 (#1e40af)
- Replace section label inline colors in hx-side-nav stories (#6b7280 fails 4.5:1 on dark bg) with neutral-400 (#94a3b8, 6.96:1 on neutral-900)
- Update story footer inline color from #d1d5db to neutral-300 (#cbd5e1) to align with component token values
- Re-enable a11y-audit as a blocking quality gate in CI (removes informational override added in PR #1261)

Contrast ratios achieved (all WCAG AA minimum 4.5:1):
- Default nav item text: neutral-300 (#cbd5e1) on neutral-900 (#0f172a) = 12.02:1
- Active item text: neutral-50 (#f8fafc) on primary-600 (#1d4ed8) = 6.41:1
- Active hover text: neutral-50 (#f8fafc) on primary-700 (#1e40af) = 8.34:1
- Toggle button: neutral-400 (#94a3b8) on neutral-900 (#0f172a) = 6.96:1
- Story section labels: neutral-400 (#94a3b8) on neutral-900 (#0f172a) = 6.96:1
- Tooltip: neutral-100 (#f1f5f9) on neutral-800 (#1e293b) = 13.35:1
