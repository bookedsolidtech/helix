---
'@helixui/library': major
'@helixui/tokens': major
'@helixui/react': major
---

HELiX 3.0.0 — first major release to the enterprise healthcare channel.

This release bumps `@helixui/library`, `@helixui/tokens`, and `@helixui/react` to `3.0.0` in lockstep. See `packages/hx-library/CHANGELOG.md` and `docs/UPGRADING-TO-3.md` for the complete breaking-change surface and migration guide.

Headline changes:

- Subclassing contract — `HelixElement` and `FormMixin` override hooks promoted from `@internal` to `@protected` with stability guarantees gated to major releases.
- `aria-label` / `hxAriaLabel` → `accessible-label` / `accessibleLabel` on all ARIA-labelable components.
- `::part(error-message)` → `::part(error)` on all form controls.
- `hx-dialog.modal` defaults to `false` (silent behavior change — consumers relying on default modal behavior must add `modal` explicitly).
- `hx-phi-field` strips the `value` attribute from the DOM after `connectedCallback` for HIPAA-aligned DOM-serialization safety.
- `hx-date-picker` and `hx-time-picker` migrate from native modal `<dialog>` to non-modal popup.
- `FormMixin` consolidation across all 15 form-associated components.
- `Wc*` type aliases and 2.0 property-rename shims removed.
- `@floating-ui/dom` becomes a dynamic import on first use.
- Public-API allowlist enforced on the library barrel.
- `@helixui/tokens` — `tokenStyles` removed; tokens adopt at the document level automatically.
- `@helixui/react` — `ariaLabel` → `accessibleLabel`; named event detail types replace anonymous `CustomEvent<unknown>`.
