---
'@helixui/library': patch
---

fix(a11y): expose aria-required on all form control components

Added aria-required attribute to shadow DOM inputs in hx-text-input, hx-textarea, hx-checkbox, hx-checkbox-group, and hx-number-input so screen readers correctly announce required state for form fields.
