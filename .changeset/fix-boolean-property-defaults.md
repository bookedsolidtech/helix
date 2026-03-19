---
"@helixui/library": minor
---

fix: correct boolean property defaults for hx-alert and hx-code-snippet

HTML boolean attributes follow presence=true, absence=false semantics. Properties that defaulted to `true` were impossible to set to `false` via HTML attributes — `open="false"` still evaluates to truthy because the attribute is present.

**Breaking changes:**

- `hx-alert`: `open` now defaults to `false`. Use `<hx-alert open>` to show the alert.
- `hx-alert`: `showIcon` now defaults to `false`. Use `<hx-alert show-icon>` to display the icon.
- `hx-code-snippet`: `copyable` now defaults to `false`. Use `<hx-code-snippet copyable>` to enable the copy button.
