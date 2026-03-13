---
'@helixui/library': patch
---

fix(css): CSS token and motion audit fixes for hx-radio-group, hx-switch, hx-toggle-button, hx-tree-view

Addresses css-category findings from GH issues #809, #817, #821, #830, #832.

- **hx-radio-group** (`hx-radio.styles.ts`): Add `@media (prefers-reduced-motion: reduce)` block disabling `.radio__control` and `.radio__dot` transitions for vestibular accessibility compliance
- **hx-radio-group** (`hx-radio-group.styles.ts`, `hx-radio-group.ts`): Expose `--hx-radio-group-help-text-color` CSS custom property for theming API consistency; document with `@cssprop` JSDoc
- **hx-switch** (`hx-switch.styles.ts`, `hx-switch.ts`): `prefers-reduced-motion` support and `--hx-switch-help-text-color` token were already implemented (A-04 and A-08 pre-fixed)
- **hx-toggle-button** (`hx-toggle-button.styles.ts`): Double opacity bug on `.button[disabled]` was already resolved; only `:host([disabled])` applies opacity (P0-1 pre-fixed)
- **hx-tree-view** (`hx-tree-item.styles.ts`): Expand `prefers-reduced-motion` block to cover `.item-row`, `.expand-btn`, and `.expand-btn svg` transitions (previously only `.children` was covered); `color-mix()` already replaced with `rgba()` fallback (P2-7 pre-fixed)
