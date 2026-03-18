---
"@helixui/library": patch
---

fix(a11y): resolve high wcag findings in hx-time-picker, hx-structured-list, and hx-split-button

- hx-time-picker: only include _helpId in aria-describedby when help slot has content (WCAG 4.1.2)
- hx-structured-list: move role="list"/role="listitem" to host elements to fix cross-shadow-DOM relationship (WCAG 1.3.1)
- hx-split-button: forward aria-label from host to inner button for accessible name support (WCAG 4.1.2)
