---
'@helixui/library': patch
---

Post-3.4.0 ARIA cleanup batch:

**hx-card host-canonical migration** (Option B from Group 10 scope)
- Host carries `internals.role` (region when labelled, link when `hx-href`, none when unlabelled/headed)
- AccName 1.2 §4.3.1 precedence: aria-labelledby > aria-label > hx-label > heading text
- Cross-shadow IDREF via `installAriaIdrefMirror` + `internals.ariaLabelledByElements`
- `delegatesFocus` preserved across migration; interactive cards keep `tabindex="0"` on host
- `__testSupportsIdrefRefsOverride` static seam for fallback path testing
- Forced-colors `Highlight` outline on `:focus-visible`

**SHOULD-FIX CR batch** (8 new regression tests):
- `aria-idref.ts` — slot-reparent into different shadow tree triggers `resync()`
- `hx-button-group` — consumer `role` attribute snapshot preserved (no overwrite by mirror)
- `hx-meter` — `slot[name="label"]` text fallback for host AccName
- `hx-spinner` — whitespace-only label trimmed before assignment (no stale aria-label leak)
- `hx-td` + `hx-th` — `_resolvedAccessibleName` precedence ladder routes through resolved name (not raw `label`)
