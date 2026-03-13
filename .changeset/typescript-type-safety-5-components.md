---
'@helixui/library': patch
---

Fix TypeScript type safety findings for hx-button-group, hx-checkbox-group, hx-container, hx-image, and hx-link. Adds runtime guards for invalid orientation values, uses definite assignment on ElementInternals fields, narrows event handler types, re-exports deprecated WcContainer type alias, and makes Lit property decorator types explicit.
