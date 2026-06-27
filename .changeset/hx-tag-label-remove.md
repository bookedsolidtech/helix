---
"@helixui/library": minor
---

add `label-remove` attribute to `hx-tag` for localizing the remove button's accessible name

The dismiss button's accessible name was previously hardcoded to English (`Remove <tag text>`), leaving localized apps unable to translate it. The new `label-remove` attribute overrides that name: pass a value containing the `{label}` placeholder to interpolate the tag text dynamically (`label-remove="Quitar {label}"` → "Quitar Cardiology"), or a value without a placeholder to use it verbatim. When unset, the accessible name is unchanged (`Remove <tag text>`, falling back to `Remove tag` when the tag has no text), so existing usage is unaffected.
