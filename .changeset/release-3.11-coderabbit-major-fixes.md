---
"@helixui/library": patch
"@helixui/icons": patch
---

fix release-review findings surfaced on the 3.11 release.

hx-carousel now normalizes `slides-per-page` through an internal integer-`>= 1`
getter for all layout, bounds, and navigation math. A `slides-per-page="0"`,
negative, or fractional value no longer divides by zero in the per-slide width
expression nor pushes the maximum selectable index past the last real slide
(which could report an empty state while slides exist); such values degrade to a
1-up carousel (fractional floors to whole slides per page). The public
`slidesPerPage` property is unchanged — only internal math reads the normalized
value.

hx-form now discovers validatable custom elements via the same
`static formAssociated = true` path `getFormData()` serializes over, instead of a
hardcoded tag allowlist. This keeps validation and serialization in lockstep: a
form-associated control that is serialized is also covered by
`checkValidity()`/`reportValidity()`/submit validation and `hx-invalid`, and a
control excluded from one is excluded from the other — closing a gap where a
value could be submitted while its validity was silently skipped.

`@helixui/icons` sprite/tree-shake generators now escape preserved root-`<svg>`
attribute values (`viewBox`, `stroke-linecap`, `stroke-linejoin`, and the symbol
`id`) before interpolating them into the serialized `<symbol>` / inlined `<svg>`.
A third-party source SVG carrying a malformed attribute value (e.g. an embedded
`"`, `<`, or `>`) can no longer break out of its attribute and inject arbitrary
markup into the published sprite or tree-shake artifacts.

`@helixui/icons` SVG sanitization now compares paint keywords
case-insensitively. Valid cascade-cooperative values such as `fill="currentcolor"`
or `stroke="CONTEXT-STROKE"` are preserved (previously only exact-case
`currentColor` / `context-stroke` survived), while genuinely-unsafe paints
(hardcoded colors, `url(...)`) are still stripped. `transparent` was also added
to the preserved set.

hx-icon's `paintMode` property is now annotated with its literal
`'fill' | 'stroke' | 'mixed'` union so the CEM and the generated `@helixui/react`
wrapper expose the exact union type instead of a bare `string` — restoring
autocomplete and compile-time validation for React consumers.

CI hardening (no package runtime impact): the shelf-guard breaking-change gate
in `ci.yml` and `audit-batch-ci.yml` now passes `github.base_ref` through a
`BASE_REF` env var instead of interpolating it directly into the shell, closing a
workflow template-injection vector. Both aggregate quality-gate summaries now
require the API breaking-change gate to resolve to `success` (a `cancelled` or
`skipped` result no longer counts as a pass), so a breaking API change cannot
merge when the gate did not run to completion. `scripts/ci/shelf-guard.mjs`
`objectFieldNames()` now always returns a Set (even when empty), so an event
detail that drops all fields (`{ foo }` → `{}`) is still compared and its removed
fields are detected.
