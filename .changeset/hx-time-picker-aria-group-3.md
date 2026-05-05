---
'@helixui/library': minor
---

hx-time-picker: APG editable-combobox ARIA hardening (group-3 round-2)

Brings `hx-time-picker` up to the canonical W3C APG editable-combobox naming/description contract used by `hx-combobox`. Consumer-visible behavior:

- `aria-required` is always reflected on the inner `<input>` (`true|false`); previously only emitted when truthy.
- The error region is now a persistent `role="alert"` container toggled with `[hidden]` so screen readers announce error messages reliably.
- A slotted `<label>` resolves to a flattened accessible name on the inner `<input>` (replaces the previous attempt to write a light-DOM `aria-labelledby` IDREF that did not resolve across the shadow boundary).
- The `label` property maps to the internal `<label>` element via `aria-labelledby` so the announced name and the visible label always match.
- A decorative-only `<slot name="label">` (e.g. an `<svg aria-hidden="true">` icon alone) no longer suppresses the visible internal `<label>` when the `label` property is set.
- Hidden / `aria-hidden="true"` content inside any naming/description slot is excluded from the accessible name per AccName 1.2 §4.3.10.

Naming-precedence order on the host (per AccName 1.2 §4.3.1): `accessibleLabel` → consumer `aria-labelledby` → host `aria-label` → slotted `<label>` → `label` property.

No public API changes.
