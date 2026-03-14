---
"@helixui/library": patch
---

fix: WCAG 2.1 AA accessibility fixes for hx-text, hx-toast, hx-visually-hidden, hx-accordion, hx-badge

Closes #824, #829, #833, #780, #784

- hx-text: title attribute exposes full content when truncated, inverse color axe test, code variant axe test
- hx-toast: aria-hidden management on open/close, aria-atomic on live region, closeLabel prop for i18n
- hx-visually-hidden: AUDIT findings resolved
- hx-accordion: AUDIT findings resolved
- hx-badge: AUDIT findings resolved
