---
'@helixui/tokens': minor
'@helixui/library': minor
---

Library-wide semantic token rebinding. 36 components, ~190 token swaps, 9 commits.

- Adds three new semantic tokens to `@helixui/tokens`: `--hx-color-text-strong`, `--hx-color-text-placeholder`, `--hx-color-surface-inverse`. All three ship with Light, Dark, and High-Contrast mode values.
- Rebinds surfaces, text, and borders across 36 components from primitive `--hx-color-neutral-*` references to semantic `--hx-color-surface-*` / `--hx-color-text-*` / `--hx-color-border-*` tokens. Components now flip correctly in Dark and High-Contrast modes — previously only focus rings responded to mode changes.
- Eliminates the `hx-tooltip` and `hx-side-nav` "intentional primitive" carve-outs; both now bind to `--hx-color-surface-inverse` + `--hx-color-text-inverse`.
- Form-input borders strengthen by one shade in Light mode (`neutral-300` → `border-strong` which resolves to `neutral-400`). This is the only visual diff in Light mode and it is WCAG-positive — form affordance contrast increases.
- Adds the Component Token Binding Rule to `design-tokens/tiers` docs and a regression test that fails if a rebinding regresses back to a primitive.
- Brand ramps, spacing/sizing/typography tokens, and `box-shadow` rgba literals are intentionally untouched. A shadow-semantics follow-up will cover the dark-mode shadow tinting gap.
