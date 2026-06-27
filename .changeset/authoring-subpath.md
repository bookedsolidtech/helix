---
"@helixui/library": minor
---

Add an SSR-safe `@helixui/library/authoring` subpath exposing `mixinDelegatesAria` (plus `HelixElement`, `FocusMixin`, `FormMixin`) for Track-2 consumer components that extend `HelixElement`, with canonical ARIAMixin IDL accessor names.

The same `@helixui/library/authoring` subpath also exposes the light-DOM style utilities `injectLightStyles` and `AdoptedStylesheetsController`, so consumers can style slotted/light-DOM content without reaching into hash-named `dist/shared/*` internals. Both are SSR-safe to import and construct: `injectLightStyles` is a runtime no-op without a DOM, and `AdoptedStylesheetsController` no longer defaults its root to `document` in the constructor — the `document` fallback is resolved lazily inside its methods, so constructing it during SSR (e.g. in a Track-2 component field initializer) does not throw. The DOM is only touched client-side when the controller's `hostConnected`/`hostDisconnected` run.
