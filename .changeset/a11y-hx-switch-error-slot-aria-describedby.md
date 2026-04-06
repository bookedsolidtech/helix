---
'@helixui/library': patch
---

fix(hx-switch): wrap error slot in persistent container so aria-describedby is stable for both prop and slotted error content; also propagate aria-invalid and switch--error class when error slot is used without the error property
