---
'@helixui/library': major
---

Unify `help-text` slot naming and standardize `HxFoo` type alias exports.

**BREAKING:** The `help` slot in `hx-checkbox-group`, `hx-field`, `hx-time-picker`, and `hx-date-picker` has been renamed to `help-text` to match all other components. Update usages from `slot="help"` to `slot="help-text"`.

**New:** All components now export a canonical `HxFoo` type alias alongside the deprecated `WcFoo` alias. Migrate from `WcFoo` to `HxFoo` — the `Wc` prefix aliases remain available but are marked `@deprecated` and will be removed in the next major version.
