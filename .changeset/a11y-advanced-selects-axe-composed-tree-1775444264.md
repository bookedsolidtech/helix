---
'@helixui/library': patch
---

add `{ useElement: true }` axe-core tests for hx-select, hx-combobox, hx-color-picker, hx-rating

Upgrades all existing `checkA11y` calls in the four advanced select-type components to use `{ useElement: true }`, enabling axe to traverse the full composed ARIA tree (including shadow DOM and slotted content) rather than only the shadow root in isolation.

Adds new axe-core test states not previously covered:
- **hx-select**: focused trigger (closed), option highlighted via keyboard (ArrowDown + aria-activedescendant)
- **hx-combobox**: filtered/searching state (typing in input), multiple-select enabled (aria-multiselectable)
- **hx-color-picker**: inline with a selected value, inline with swatches configured
- **hx-rating**: half-star precision=0.5 (role="slider"), focused keyboard navigation state

All 22 new/updated axe tests pass with zero violations. Verifies APG combobox pattern (role=combobox, aria-expanded, aria-haspopup=listbox, aria-activedescendant, role=listbox, role=option) and WCAG 2.1 AA compliance across all component states.
