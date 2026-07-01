---
"@helixui/library": patch
---

fix two release-review findings surfaced on the 3.11 release.

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
