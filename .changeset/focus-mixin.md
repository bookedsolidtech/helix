---
'@helixui/library': minor
---

feat(mixins): add FocusMixin for standardized delegated focus management

Introduces FocusMixin, a Lit 3.x mixin modeled after Lion's FocusMixin and Material Web's mixinDelegatesAria:

- `_focusableNode` protected getter for subclasses to declare the inner focusable element
- `focused` reflected boolean attribute as a CSS styling hook for `:host([focused])`
- `focusedVisible` reflected boolean attribute for keyboard-only focus ring styling
- Delegated `focus()` / `blur()` routing to the inner element
- Autofocus support after first render via `firstUpdated` lifecycle
- Pre-render focus queuing: `focus()` calls before shadow DOM is stamped are replayed on `firstUpdated`

Applied FocusMixin to `hx-text-input`, replacing the previous manual `this._input?.focus()` pattern.
