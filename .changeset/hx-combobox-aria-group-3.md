---
'@helixui/library': minor
---

hx-combobox: W3C APG editable-combobox ARIA hardening (group-3 round-1)

`hx-combobox` is an editable combobox (users type to filter options), so per W3C APG it follows the inner-input-canonical pattern (option I): `role="combobox"` lives on the inner `<input>` element where it replaces the implicit textbox role. This is structurally distinct from `hx-select` (a non-editable select-replacement) which is host-canonical option II.

Cross-shadow consumer IDREFs use belt-and-suspenders naming:

- **Modern engines** (with `ElementInternals.ariaLabelledByElements` / `ariaDescribedByElements`): the host carries `internals.ariaLabelledByElements` / `internals.ariaDescribedByElements` set to the resolved consumer elements; consumer host `aria-labelledby` / `aria-describedby` attributes are PRESERVED so AT walking up from focused descendants finds them.
- **Legacy fallback** (no IDL element-references support): host attributes are stripped during sync; consumer-resolved label/description elements are text-flattened (concatenated `textContent`) into the inner input's `aria-label` / `aria-description`. Drops live DOM-text-update tracking but works on every AT.

Inner `<input>` carries the full combobox ARIA surface: `role="combobox"`, `aria-haspopup="listbox"`, `aria-autocomplete="list"`, `aria-controls`, `aria-expanded`, `aria-activedescendant`, `aria-required`, `aria-invalid`, `aria-busy`, `aria-disabled`. All cross-shadow IDREFs (controls, activedescendant) resolve same-root because the listbox and options are rendered in the same shadow root as the input.

Hardening rounds applied (mirroring Group 2/3 patterns at the consumer-attribute mirror layer, retargeted to inner input):

- Slotted label resolution — `_readLabelSlotState` harvests `textContent` from slotted element children (`<span slot="label">Fruit</span>`), not just bare text nodes
- `_labelSource` discriminated union (`'slotted' | 'aria-label' | 'aria-labelledby' | 'none'`)
- `_hostDescribedByObserver` MutationObserver with `attributeOldValue: true` for consumer aria-describedby retraction tracking
- Round-10 disconnect-during-strip pattern on the legacy fallback: observer disconnect → removeAttribute → re-observe (eliminates counter-race defect class)
- `__testSupportsIdrefRefsOverride` static seam with `afterEach` teardown for fallback-path testing

133/133 tests passing (4 new regression tests for cross-shadow IDREF naming on modern + legacy paths × labelledby + describedby). `pnpm run verify` clean.
