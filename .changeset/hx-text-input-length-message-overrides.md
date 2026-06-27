---
'@helixui/library': minor
---

add `minlength-message` and `maxlength-message` override attributes to `hx-text-input`

The length-validation messages on `hx-text-input` were hardcoded English, so localized
`tooShort` / `tooLong` errors were impossible without setting `error` (which overrides every
state). Two new reflected-as-attribute properties let consumers supply their own copy:

- `minlengthMessage` (attribute `minlength-message`) — shown when the value is shorter than
  `minlength`. Supports a `{min}` placeholder, substituted with the resolved `minlength`.
- `maxlengthMessage` (attribute `maxlength-message`) — shown when the value is longer than
  `maxlength`. Supports a `{max}` placeholder, substituted with the resolved `maxlength`.

Both mirror the existing `required-message` property: precedence is `error` first, then the
override, then the built-in English default. The `{min}` / `{max}` tokens follow the library's
`{label}` placeholder convention (`hx-tag`) and are substituted with `split`/`join` so a literal
`$` in a localized string is inserted verbatim. When unset, output is byte-identical to today.

```html
<hx-text-input
  minlength="5"
  minlength-message="Veuillez saisir au moins {min} caractères."
></hx-text-input>
```
