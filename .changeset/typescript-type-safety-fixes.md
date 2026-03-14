---
"@helixui/library": patch
---

fix(typescript): resolve type safety findings across hx-number-input, hx-radio-group, hx-slider, hx-text, hx-toggle-button

- hx-slider: widen `formStateRestoreCallback` state param to `string | File | FormData | null` per ElementInternals spec; add type guard
- hx-text: remove deprecated `WcText` stale type alias (use `HelixText` directly)
- hx-toggle-button: parameterize `updated()` with `PropertyValues<this>`; add missing `_mode` param to `formStateRestoreCallback` per spec
- hx-number-input: formStateRestoreCallback uses `Number()` for consistency with converter; `_applyStep` dispatches only `hx-change`
- hx-radio-group: `formStateRestoreCallback` correct spec signature; `_groupEl` uses safe getter pattern

Closes #802, #809, #813, #824, #830
