---
'@helixui/library': minor
---

ARIA Group 2 (selection controls): host-canonical accessibility for `hx-checkbox`, `hx-checkbox-group`, `hx-radio`, `hx-radio-group`, `hx-switch`, `hx-toggle-button`.

- Role, checked/disabled state, accessible name, and accessible description are now announced from the host element via `ElementInternals` (`internals.role`, `ariaChecked`, `ariaDisabled`, `ariaLabelledByElements`, `ariaDescribedByElements`) rather than from inner shadow elements. Assistive tech sees one element per control instead of host-plus-inner duplicates.
- Engines without IDREF-ref support fall through to a parity path that keeps the inner control's `aria-label` and `aria-describedby` reachable, so legacy targets still announce correctly.
- `hx-checkbox-group` form participation is stable: the group owns the form value end-to-end, so child `name` mutations after attach no longer hijack submission, and child checkboxes resume stand-alone form participation cleanly when the group is removed from the DOM.
- `hx-radio-group` reconciles `value`, form value, and validity when radios are added or removed via slot mutation. `hx-radio` gains an internal `_groupedSuppress` shim for symmetry with `hx-checkbox` so any future form-association change on the child element is automatically suppressed inside a group.
- `hx-checkbox` keeps `change` and `hx-change` firing exactly once per user activation, including on label clicks and on engines that take the legacy fallback path.
