---
'@helixui/library': patch
---

Re-baseline CDN bundle ceilings for ARIA Group 3 (selects/combos/pickers)

Config-only change to `.cdn-budget.json` per the documented per-Group bump pattern. No public API change. Bundle ceilings raised to accommodate Group 3 ARIA hardening pattern stack (~6.4 KB JS so far across hx-select + hx-combobox; pickers project to add ~6-10 KB more).

- `fullBundleJs` ceiling: 215.0 KB → 230.0 KB
- `strategyATotal` ceiling: 270.0 KB → 290.0 KB

Unblocks PR #1631 (hx-combobox) and PR #1632 (hx-time-picker) bundle size CI checks.
