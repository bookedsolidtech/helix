---
'@helixui/library': patch
---

CEM accuracy: doc-sweep for 3 of 4 cem-accuracy campaign blocking findings

Documentation-only fixes for the cem-accuracy codex campaign blocking findings:

- **hx-phi-field**: Removed stale `@cssprop --hx-phi-field-auto-hide-warning-color` JSDoc (token documented as "future use" but never consumed in styles).
- **hx-select**: Added `@fires {Event} invalid` JSDoc — the form-associated component participates in constraint validation via `ElementInternals.setValidity()` and the platform `invalid` event was undocumented in the CEM events[] array.
- **hx-theme**: Replaced wildcard `@cssprop [--hx-*]` with explicit token entries (the wildcard is not a valid CEM cssProperties[] entry; it was being indexed as a literal `--hx-*` name).

The 4th blocking finding (hx-slider missing `formAssociated: true` in CEM) is a systemic CEM analyzer gap — ALL form-associated components have it. Tracked separately as a follow-up to add a custom-elements-manifest analyzer plugin that detects `static formAssociated = true`.
