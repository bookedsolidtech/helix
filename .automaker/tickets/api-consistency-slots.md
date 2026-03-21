# API Consistency: Slot Naming Fixes

**Audit:** api-consistency-audit.json (2026-03-20)
**Priority:** Low-Medium
**Breaking Change:** No (additive changes only)
**Components Affected:** 4 components

---

## Finding 1: Slot Naming is Largely Consistent

The audit found that slot naming across the library is well-standardized:

- **`help-text`** slot: Used consistently across all 14 form components. No `help` or `footer-help` variations found.
- **`error`** slot: Used consistently across form components.
- **`label`** slot: Used consistently for label overrides.
- **`prefix`/`suffix`** slots: Used consistently for input adornment.
- **`header`/`footer`** slots: Used consistently for container components.
- **`icon`** slot: Used consistently for icon customization.
- **`default`** slot: Used consistently for main content.

This is a positive finding. No breaking changes needed for slot naming.

---

## Finding 2: Missing Prefix/Suffix Slots (ADDITIVE)

Some form-adjacent components lack prefix/suffix slots that their siblings have:

| Component | Has prefix | Has suffix | Recommendation |
|---|---|---|---|
| hx-text-input | yes | yes | baseline |
| hx-number-input | yes | yes | baseline |
| hx-combobox | yes | yes | baseline |
| hx-select | yes | no | Add suffix slot |
| hx-date-picker | yes | yes | baseline |
| hx-time-picker | yes | yes | baseline |
| hx-textarea | no | no | Consider adding prefix (line numbers, icons) |
| hx-checkbox | no | no | Not applicable (checkbox layout) |
| hx-switch | no | no | Not applicable (switch layout) |
| hx-slider | no | no | Not applicable (slider layout) |

**Recommendation:** Add suffix slot to hx-select. Consider prefix slot for hx-textarea. Checkbox, switch, and slider correctly omit these due to their layout patterns.

---

## Finding 3: Error CSS Part Naming Inconsistency

While slot naming is consistent (`error` everywhere), the CSS part naming for error containers varies:

| Pattern | Components |
|---|---|
| `error` (part) | hx-combobox, hx-date-picker, hx-number-input, hx-select, hx-slider, hx-text-input, hx-textarea, hx-time-picker |
| `error-message` (part) | hx-checkbox-group, hx-radio-group |

**Recommendation:** Add `error` as a CSS part alias on hx-checkbox-group and hx-radio-group for consistency. Keep `error-message` as a deprecated alias.

---

## Implementation Checklist

- [ ] Add `suffix` slot to hx-select (non-breaking, additive)
- [ ] Add `error` CSS part alias to hx-checkbox-group
- [ ] Add `error` CSS part alias to hx-radio-group
- [ ] Update CEM for new slots and parts
- [ ] Add stories demonstrating new slot usage
