---
'@helixui/library': minor
---

hx-combobox: W3C APG editable-combobox ARIA hardening (group-3, 12 push-gate rounds)

`hx-combobox` is an editable combobox (users type to filter options), so per W3C APG it follows the inner-input-canonical pattern (option I): `role="combobox"` lives on the inner `<input>` element where it replaces the implicit textbox role. This is structurally distinct from `hx-select` (a non-editable select-replacement) which is host-canonical option II.

Cross-shadow consumer IDREFs use belt-and-suspenders naming:

- **Modern engines** (with `ElementInternals.ariaLabelledByElements` / `ariaDescribedByElements`): the host carries `internals.ariaLabelledByElements` / `internals.ariaDescribedByElements` set to the resolved consumer + visible slotted label elements; consumer host `aria-labelledby` / `aria-describedby` attributes are PRESERVED on both paths so AT walking up from focused descendants finds them. `internals.ariaLabel` is cleared with `null` (not `''`) so element references win.
- **Legacy fallback** (no IDL element-references support): host attributes also stay intact (the component never strips host ARIA). Consumer-resolved label elements are text-flattened (per AccName 1.2 §4.3.1 precedence) into the inner input's `aria-label`. The inner input NEVER receives `aria-description` — consumer description text is mirrored into a synthesized in-shadow span and joined into `aria-describedby` instead, since `aria-description` is silently dropped by AT when `aria-describedby` is also present.

Inner `<input>` carries the full combobox ARIA surface: `role="combobox"`, `aria-haspopup="listbox"`, `aria-autocomplete="list"`, `aria-controls`, `aria-expanded`, `aria-activedescendant`, `aria-required`, `aria-invalid`, `aria-busy`, `aria-disabled`. All cross-shadow IDREFs (controls, activedescendant) resolve same-root because the listbox and options are rendered in the same shadow root as the input.

Hardening rounds applied (12 codex push-gate rounds, 29 findings closed):

- Slotted label resolution — `_readLabelSlotState` aggregates `textContent` across ALL assigned nodes (elements + text) with whitespace collapse per AccName
- `_labelSource` discriminated union (`'slot' | 'aria-label' | 'aria-labelledby' | 'label-prop' | 'none'`)
- AccName 1.2 §4.3.10 hidden-content filtering — `flattenAccName` TreeWalker rejects `aria-hidden="true"` AND `[hidden]` subtrees, including roots, across every flatten path (external IDREF, slotted label aggregation, slot text MOs)
- Six MutationObservers wired up: `_externalRefsObserver` (characterData/childList/attributes on resolved external label/desc elements), `_labelSlotTextObserver`, `_helpSlotTextObserver`, `_errorSlotTextObserver`, `_hostDescribedByObserver` (defense-in-depth on host attribute changes — the round-10 disconnect-during-strip pattern was retired in round-12 F4 once the don't-strip approach landed)
- First-paint correctness via `firstUpdated` → `_seedSlotStateSync` reading each named slot's `assignedNodes()` before the first `_syncHostAriaSemantics()` call
- Validity surface unioned across `ElementInternals.setValidity()`, consumer `error` property/attribute, and slotted error content; `_announcedError` seeded in `willUpdate` for first paint
- Name-resolution precedence per AccName 1.2 §4.3.1 with helix-specific `accessibleLabel` override at the top, then consumer `aria-labelledby` (above `aria-label` — round-12 fix)
- `__testSupportsIdrefRefsOverride` static seam with `afterEach` teardown for fallback-path testing

180/180 hx-combobox tests passing (50 new regression tests across modern + legacy paths × labelledby + describedby; first-paint, runtime error population, multi-node slot aggregation, hidden-aware visibility tree walking, retraction sequences). `pnpm run verify` clean.
