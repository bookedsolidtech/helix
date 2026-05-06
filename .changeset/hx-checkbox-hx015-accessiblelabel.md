---
'@helixui/library': patch
---

fix(hx-checkbox): close Figgy HX-015 — read attribute storage instead of `this.ariaLabel` IDL property

`hx-checkbox._effectiveLabel` and the visible-label-conflict devWarn block both read `this.ariaLabel` (the native `HTMLElement` IDL property, populated by `mixinDelegatesAria`'s `Object.defineProperty` shadow). Under fallback browsers and the v3 `accessibleLabel` migration guide, consumers who stop setting `ariaLabel` get a silent label disappearance.

Migration parity with `hx-action-bar.ts:102-125`, `hx-button.ts:204` (Group 8), and the rest of the v3 component surface — read `accessibleLabel` first, then `data-aria-label` (mixin storage), then `aria-label` attribute, then empty string. Closes Figgy HX-015 for `hx-checkbox`.
