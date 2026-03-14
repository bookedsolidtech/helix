---
'@helixui/library': patch
---

fix(storybook): fix Storybook story findings for hx-checkbox, hx-checkbox-group, hx-field, hx-popover, and hx-radio-group (fixes #789, #790, #795, #805, #809)

- hx-checkbox (P2-11): NoLabel story play function asserts aria-label forwarded to native input at runtime
- hx-checkbox (P2-15): SelectAllPattern story uses ID-based DOM query instead of fragile CSS class query
- hx-checkbox-group (P3-01): Relative imports accepted by design — consistent with all other HELiX stories in source-mode Storybook
- hx-field (P2-09): WrappingTextarea story added demonstrating textarea as slotted control
- hx-field (P2-13): SlottedLabel story demonstrates for/id linkage between slotted label and slotted input
- hx-popover (P2-04): Placements story now renders all 12 placement variants (was 4 cardinal only)
- hx-radio-group (P2-07): SingleDisabledOption story demonstrates mixed-disabled state (one radio disabled in an enabled group)
