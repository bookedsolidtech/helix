---
'@helixui/library': minor
---

ARIA Group 2 (selection controls): host-canonical accessibility for hx-checkbox, hx-checkbox-group, hx-radio-group, hx-switch, hx-toggle-button.

- Hoist role/state/aria semantics from inner shadow elements to the host via `ElementInternals` (`ariaRole`, `ariaChecked`, `ariaDisabled`, `ariaLabelledByElements`, `ariaDescribedByElements`).
- Branch render based on `ElementInternals` IDREF-ref support: legacy fallback keeps the inner control's `aria-label`/`aria-describedby` reachable to assistive tech without IDREF refs.
- `hx-checkbox-group`: centralize form participation. Children no longer propagate `name`; group tracks suppression via a durable `_groupedSuppress` flag (survives post-attach `name` mutations and group disconnect).
- `hx-radio-group`: reconcile `value` / form value / validity on slot mutations so newly added/removed radios stay in sync.
- `hx-checkbox`: stable class-field click/change handler identity (prevents Lit listener detach/reattach across renders); fallback path lets native input fire `change` and mirrors host state through `_handleInternalChange`.
- Tests updated to assert host-canonical ARIA via `ariaDescribedByElements` (with attribute-mirror fallback for engines without IDREF-ref support).
