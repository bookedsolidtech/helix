---
'@helixui/library': minor
---

hx-color-picker: composite color-picker ARIA hardening (group-3 round-4 — closes Group 3)

Applies the canonical hardening pattern stack from hx-combobox / hx-time-picker / hx-date-picker to `hx-color-picker`. Component is the **composite color-picking widget** (NOT a combobox or dialog): HSL/RGB sliders + swatch grid + hex input + inline panel with `role="group"`. Pattern stack adapted accordingly.

12 patterns applied (subset that fits a composite color-picking widget):

1. Cross-shadow naming for the host — `internals.ariaLabelledByElements`/`ariaDescribedByElements` projecting consumer aria-labelledby/describedby; `internals.ariaLabel = null` (not `''`) when no override
2. `_supportsIdrefRefs` probe + `__testSupportsIdrefRefsOverride` static seam — modern (host canonical) vs legacy (trigger-button mirror)
3. Hidden content per AccName 1.2 §4.3.10 — `flattenAccName` skips aria-hidden + [hidden] subtrees including roots
4. Slot label aggregation — new `<slot name="label">` with multi-node `_slottedLabelEls` + AccName whitespace collapse
5. Description channel unified — synthesized hidden `<span>` joins consumer description + helpText + error; trigger button aria-describedby chains to single ID; never writes aria-description
6. Validity surface unioned — `_updateValidity()` unions `internals.validity` ∪ `error` prop ∪ slotted error via `customError`
7. First-paint slot state seeding — `_seedSlotStateSync()` in firstUpdated
8. 5 mutation observers — external IDREFs + label/help/error slots + host attrs (via `installAriaIdrefMirror`); characterData + childList + subtree + aria-hidden/[hidden] attribute filter
9. Help/error effective text via flattenAccName
10. Error population via willUpdate — first paint + every error change; rAF clear-and-reset for transition re-announcement
11. Forced-colors mixin — `forcedColorsField` preserved in static styles
12. Name-resolution precedence — consumer aria-labelledby → consumer aria-label → accessible-label → label → slotted label → labelTrigger(value) default

Patterns NOT applied (per architecture directive):
- No `role="combobox"` on hex input (it's not a combobox)
- No `aria-haspopup` (panel inline, no popup contract)
- Panel `role="group"` preserved (DO NOT change to dialog/aria-modal — see line ~865 comment: "A11y fix WCAG 4.1.2: Tab can exit, Escape closes")
- Sliders' `role="slider"` + `aria-valuemin/max/now/text` preserved (untouched)
- Swatches `role="group"` + `aria-label` preserved (untouched)

New public API surface:
- `label`, `accessible-label`, `help-text`, `error` properties
- `<slot name="label">`, `<slot name="help-text">`, `<slot name="error">`
- CSS parts: `label`, `help-text`, `error`

100/100 hx-color-picker tests passing. 218 neighbor tests (hx-toggle-button + hx-checkbox) green — no regression from shared aria-idref util usage. `pnpm run verify` clean. CEM regenerated; 102 components passed CEM validation.

Closes ARIA Group 3 (selects/combos/pickers).
