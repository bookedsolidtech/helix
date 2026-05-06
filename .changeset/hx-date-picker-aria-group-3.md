---
'@helixui/library': minor
---

hx-date-picker: APG date picker dialog ARIA hardening (group-3 round-3)

Applies the canonical hardening pattern stack from hx-combobox / hx-time-picker (PR #1631 / #1632) to `hx-date-picker`. Component is the **W3C APG date picker dialog pattern** (NOT a combobox): readonly inner `<input>` + trigger button + calendar `role="grid"` dialog. Pattern stack adapted accordingly — keeps `aria-haspopup="dialog"` on input + button (not "listbox"), no `role="combobox"`, retains documented cross-shadow `aria-controls` from trigger button → calendar id (matches hx-popover/dropdown precedent).

12 hardening patterns applied:

1. Cross-shadow naming (belt-and-suspenders) — `_supportsIdrefRefs` probe + IDL `internals.ariaLabelledByElements`/`ariaDescribedByElements` + text-flatten fallback
2. Hidden content per AccName 1.2 §4.3.10 — `flattenAccName` TreeWalker rejects aria-hidden + [hidden] subtrees including roots
3. Slot label aggregation — multi-node `_slottedLabelEls` + AccName whitespace collapse
4. Description channel unified — synthesized hidden `<span>` mirrors consumer-resolved description text; never write `aria-description` on inner input
5. Validity surface unioned — `internals.validity.valid` ∪ consumer `error` prop ∪ slotted error
6. First-paint slot state seeding — `_seedSlotStateSync()` in firstUpdated
7. Mutation observers — external IDREFs + label slot + help slot + error slot + host attrs (5 observers)
8. Help/error effective text via flattenAccName
9. Error population via willUpdate — first paint + every error change + rAF clear-and-reset for re-announcement
10. Forced-colors mixin — `forcedColorsField` preserved
11. Name-resolution precedence per W3C AccName 1.2 §4.3.1 — accessibleLabel → consumer aria-labelledby → host aria-label → slotted label → label property
12. Inner input ARIA — `aria-haspopup="dialog"`, `aria-required`, `aria-invalid`, `aria-disabled`. NO `role="combobox"`. Trigger button retains `aria-controls=${calendarId}` (documented cross-shadow limitation per hx-popover/dropdown).

Shared utility additions (will dedupe on merge with PR #1632):
- `packages/hx-library/src/utils/aria-flatten.ts` (new) — `flattenAccName` TreeWalker
- `packages/hx-library/src/utils/aria-idref.ts` — `collectIdrefSearchRoots` walks `Element.assignedSlot` hops into slot-owner shadow roots (closes round-6 P1 cross-shadow IDREF resolution for slotted hosts)

123/123 hx-date-picker tests passing. 501 other aria-idref consumer tests (hx-checkbox, hx-checkbox-group, hx-radio-group, hx-switch, hx-toggle-button) green — no regression. `pnpm run verify` clean.
