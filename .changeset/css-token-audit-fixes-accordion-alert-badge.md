---
'@helixui/library': patch
---

fix(css): CSS token and motion audit fixes for hx-accordion, hx-alert, hx-badge, hx-breadcrumb, hx-button

- **hx-badge**: Implement `--hx-badge-pulse-color` in box-shadow animation (was dead CSS, variable now consumed); add CSS guard `.badge--dot ::slotted(*) { display: none }` to prevent slotted content overflow in dot mode
- **hx-button**: Remove hardcoded hex fallback values from all variant-level CSS custom property setters; variant rules now reference primitive tokens only (`var(--hx-color-primary-500)` with no hex literal fallback); added regression-guard comment on `.button[disabled]` to prevent re-introduction of double-opacity bug; fix focus ring fallback chain to use `var(--hx-color-primary-500)` instead of hardcoded hex
- **hx-breadcrumb**: Replace hardcoded hex colors in `WithCustomStyling` Storybook story with `--hx-color-*` and `--hx-font-size-*` design token references; add documentation comment on `display: contents` in `hx-breadcrumb-item.styles.ts` explaining box-model styling limitation for `::part(item)` consumers
- **hx-alert**: Fix `CSSParts` story body text to correctly enumerate all 6 CSS parts (was incorrectly listing 5, omitting `::part(title)`)
