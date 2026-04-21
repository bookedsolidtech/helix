---
'@helixui/drupal-starter': major
---

BREAKING: All SDC templates aligned with `@helixui/library@3.0.0` public API. Consumers who have forked any drupal-starter templates must re-apply their customizations against the new 3.0.0 base.

Template / attribute changes:

- `hx-card` — `accessible-label` attribute replaced with `hx-label` (HTML attribute; JS property remains `label`)
- `hx-nav` — `hx-size="small"` corrected to `hx-size="sm"` (enum value alignment)
- All ARIA-labelable components (`hx-button`, `hx-text-input`, `hx-form`, etc.) — templates now emit `accessible-label` instead of `aria-label` to match library's new public attribute name
- `hx-dialog` — templates no longer rely on the default `modal="true"` behavior (library default flipped to `false`); explicit `modal` attribute added where modal semantics are required
- `hx-date-picker` / `hx-time-picker` — templates updated for the non-modal popup contract (library migrated from native `<dialog>` to non-modal)
- `::part(error-message)` selectors replaced with `::part(error)` in CSS snippets that style form validation
- `hx-phi-field` — template no longer renders the `value` attribute in server-rendered HTML (library strips the attribute post-`connectedCallback` for HIPAA DOM-serialization safety)

See `packages/drupal-starter/CHANGELOG.md` and the 3.0.0 migration guide `docs/UPGRADING-TO-3.md` for the full list of affected components and the recommended codemod for consumer fork reconciliation.
