---
'@helixui/library': minor
---

add HelixElement base class with shared form association, lifecycle callbacks, and ID counter utilities

Introduces `HelixElement` as the new base class for all HELiX components, extending `LitElement` with:

- Lazy `_internals` accessor via private class field — eliminates `attachInternals()` constructor boilerplate across all form-associated components
- Form lifecycle hook delegation: `formDisabledCallback`, `formResetCallback`, and `formStateRestoreCallback` delegate to protected `_onFormDisabled`, `_onFormReset`, and `_onFormStateRestore` hook methods for clean subclass overrides
- `form`, `validity`, and `validationMessage` convenience getters
- `createIdCounter(namespace)` and `resetIdCounter(namespace?)` utilities replacing module-level `let` counters with a shared, testable, SSR-safe ID factory
- `mergeTokenStyles(componentStyles, tokenStyles)` helper for combining Lit CSSResult arrays

Migrates `hx-text-input`, `hx-checkbox`, and `hx-select` to use `HelixElement` as a proof-of-concept migration. All existing public APIs are preserved.

All utilities are exported from `@helixui/library` and from `@helixui/library/base/index.js` for direct import.
