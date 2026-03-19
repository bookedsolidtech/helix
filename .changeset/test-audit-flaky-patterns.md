---
'@helixui/library': patch
---

fix(tests): replace setTimeout with updateComplete and add slot projection tests

- Replace all non-intentional `setTimeout`-based waits across 22 test files with `await el.updateComplete` for deterministic DOM/state settling
- Replace hx-drawer 400ms animation-complete waits with `await oneEvent(el, 'hx-after-show')` and `await oneEvent(el, 'hx-after-hide')`
- Preserve intentional real timers: hx-number-input long-press stepper helper and hx-tooltip `vi.useFakeTimers()` describe blocks
- Add "Slot projection" describe blocks to 7 components: hx-combobox, hx-date-picker, hx-select, hx-radio-group, hx-rating, hx-number-input, hx-carousel
