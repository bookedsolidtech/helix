---
"@helixui/library": minor
---

Add an SSR-safe `@helixui/library/authoring` subpath exposing `mixinDelegatesAria` (plus `HelixElement`, `FocusMixin`, `FormMixin`) for Track-2 consumer components that extend `HelixElement`, with canonical ARIAMixin IDL accessor names.

The same `@helixui/library/authoring` subpath also exposes the light-DOM style utilities `injectLightStyles` and `AdoptedStylesheetsController`, so consumers can style slotted/light-DOM content without reaching into hash-named `dist/shared/*` internals. Both are import-time SSR-safe (no module-scope `document`/`window` access) and remain DOM-runtime utilities when invoked.
