---
"@helixui/library": patch
---

fix(a11y): resolve medium-severity wcag violations in hx-textarea, hx-file-upload, hx-top-nav, and hx-action-bar

- hx-textarea: remove aria-live from counter element; add debounced hidden live region that announces only at 80%+ of maxlength (wcag 4.1.3)
- hx-file-upload: fix conflicting aria-label + aria-labelledby on dropzone — now mutually exclusive (wcag 4.1.2)
- hx-top-nav: fix mobile menu focus — now targets first interactive element using focusable selector instead of any htmlelement (wcag 2.4.3)
- hx-action-bar: add dev warning when consumer sets role other than "none" on host, preventing duplicate toolbar announcement (wcag 4.1.2)
