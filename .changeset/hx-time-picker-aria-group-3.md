---
'@helixui/library': minor
---

hx-time-picker: APG editable-combobox ARIA hardening (group-3 round-2)

Applies the full hardening pattern stack from `hx-combobox` (PR #1631) to `hx-time-picker`. Component was already on the correct architectural pattern (W3C APG editable-combobox option I — `role="combobox"` on inner `<input>`); this PR brings the cross-shadow naming, slot machinery, mutation observers, and validity union up to the post-12-codex-rounds canonical state.

12 hardening patterns applied:

1. **Cross-shadow naming (belt-and-suspenders)** — `_supportsIdrefRefs` probe, `__testSupportsIdrefRefsOverride` static seam, `internals.ariaLabelledByElements` / `ariaDescribedByElements` on modern path, text-flatten to inner input `aria-label` on legacy fallback
2. **Hidden content per AccName 1.2 §4.3.10** — `flattenAccName` TreeWalker rejects aria-hidden + [hidden] subtrees including roots
3. **Slot label aggregation** — multi-node `_slottedLabelEls`, AccName whitespace collapse
4. **Description channel unified** — synthesized hidden span with consumer-resolved description text; never write `aria-description` on inner input
5. **Validity surface unioned** — `setValidity` ∪ consumer error prop ∪ slotted error
6. **First-paint slot state seeding** — `_seedSlotStateSync()` in firstUpdated
7. **Six mutation observers** — external IDREFs, slotted label, help slot, error slot, host attributes, IDREF aria mirror; all watch characterData + childList + aria-hidden/hidden attrs
8. **Help/error effective text via flattenAccName** — `_readHelpSlotStateSync`, `_readErrorSlotStateSync`
9. **Error population via willUpdate** — first paint + every error change; rAF clear-and-re-set retained for re-announcement
10. **Forced-colors mixin** — `forcedColorsField` preserved in static styles
11. **Name-resolution precedence per W3C AccName 1.2 §4.3.1** — accessibleLabel → consumer aria-labelledby → host aria-label → slot → label property
12. **Inner input ARIA surface** — full combobox state attributes on inner `<input>`; `aria-required` always reflected (`true|false`), `aria-invalid` reflects validity union

Existing test contracts updated (canonical behavior changes):
- `aria-required` always reflected (was conditionally absent)
- Error div is persistent `role="alert"` container with `[hidden]` toggle (was conditionally rendered)
- Slotted `<label>` text-flattens to inner input `aria-label` (was unsafely writing light-DOM id as `aria-labelledby`)
- `label` property points inner input `aria-labelledby` at internal `<label id>` (same shadow root)

168/168 tests passing (134 baseline + 34 new regression tests across 9 hardening categories). `pnpm run verify` clean.
