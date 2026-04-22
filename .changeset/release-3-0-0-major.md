---
'@helixui/library': major
'@helixui/tokens': major
'@helixui/react': major
---

HELiX 3.0.0 — first major release to the enterprise healthcare channel.

This release bumps `@helixui/library`, `@helixui/tokens`, and `@helixui/react` to `3.0.0` in lockstep (enforced via the `linked` package group in `.changeset/config.json`). See `packages/hx-library/CHANGELOG.md` and `docs/UPGRADING-TO-3.md` for the complete breaking-change surface and migration guide.

Headline changes:

- Subclassing contract — `HelixElement` and `FormMixin` override hooks promoted from `@internal` to `@protected` with stability guarantees gated to major releases.
- `aria-label` / `hxAriaLabel` → `accessible-label` / `accessibleLabel` on all ARIA-labelable components.
- `::part(error-message)` → `::part(error)` on the 13 form controls that expose the part (`hx-checkbox`, `hx-checkbox-group`, `hx-combobox`, `hx-date-picker`, `hx-field`, `hx-file-upload`, `hx-number-input`, `hx-radio-group`, `hx-select`, `hx-switch`, `hx-text-input`, `hx-textarea`, `hx-time-picker`). See `docs/UPGRADING-TO-3.md` §5 for the full list.
- `hx-dialog.modal` defaults to `false` (silent behavior change — consumers relying on default modal behavior must add `modal` explicitly).
- `hx-phi-field` strips the `value` attribute from the DOM after `connectedCallback` for HIPAA-aligned DOM-serialization safety.
- `hx-date-picker` and `hx-time-picker` migrate from native modal `<dialog>` to non-modal popup.
- `FormMixin` consolidation across all 15 form-associated components.
- `Wc*` type aliases and 2.0 property-rename shims removed.
- `@floating-ui/dom` becomes a dynamic import on first use.
- Public-API allowlist enforced on the library barrel.
- `@helixui/tokens` — `tokenStyles` remains exported but is deprecated since 2.1.0 (planned removal targeted for 4.0). Version bumped to 3.0.0 in lockstep with `@helixui/library` via the linked-package policy; no tokens source removals in this release.
- `@helixui/react` — `ariaLabel` → `accessibleLabel`; named event detail types replace anonymous `CustomEvent<unknown>`. Version jumps from 1.x to 3.0.0 (bookkeeping bump realigned 1.1.4 → 2.1.2 before the major so all three public packages share a 3.0.0 line; see `.changeset/align-react-version.md`).
