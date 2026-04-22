---
'@helixui/library': patch
---

fix(docs): rewrite `hx-phi-field` §6 migration to use `data` property (attribute: false) — prior text described `value` attribute/property, which does not exist on the component

fix(docs): correct subclassing example to import `FormMixin` from `@helixui/library` root barrel — the `/mixins` subpath export is intentionally absent from `package.json` exports map

fix(docs): correct public-API allowlist prose to reflect that `FocusMixin`, `FormMixin`, and `HelixAuditController` are re-exported from the root barrel (no `/mixins` subpath)

fix(docs): correct `::part(error)` component list — 13 components actually expose the part (hx-checkbox, hx-checkbox-group, hx-combobox, hx-date-picker, hx-field, hx-file-upload, hx-number-input, hx-radio-group, hx-select, hx-switch, hx-text-input, hx-textarea, hx-time-picker); removed invalid entries (hx-radio, hx-slider, hx-color-picker, hx-phi-field)

fix(docs): disambiguate `hx-card` accessible-name migration — HTML attribute is `hx-label`, JS property is `label`

fix(docs): replace `@helixui/library/mixins` import prescription in components-guide ARIA docs with `ElementInternals.ariaLabel` + explicit template binding — the internal `mixinDelegatesAria` helper is not a public export

fix(ci): reorder `publish.yml` so release-manifest generation runs after `changesets/action` and is gated on `outputs.published == 'true'`; commit the manifest back to main via dedicated step

fix(shipping): replace stale `@wc-2026/library` specifier with `@helixui/library` in shipped CSS import, Drupal JS dynamic import, and Twig library registration comments (prose.css, hx-toast.drupal.js, hx-spinner.twig, hx-code-snippet.twig)
