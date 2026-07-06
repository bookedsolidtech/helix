---
"@helixui/library": minor
---

Expose `adoptedStylesheetRegistry` on the `@helixui/library/authoring` subpath, alongside the already-exported `injectLightStyles` and `AdoptedStylesheetsController`.

`adoptedStylesheetRegistry` is the capability-detecting light-DOM style-delivery singleton: `register(componentName, css)` sanitizes the CSS and scopes every selector under `[data-hx-styled="componentName"]`, then delivers it via Constructable Stylesheets (`document.adoptedStyleSheets`) when available and scoped `<style>` injection (`injectLightStyles`) otherwise. It was previously reachable only by importing hash-named `dist/shared/*` build internals; consumers styling slotted/light-DOM content can now import it from the stable `authoring` subpath.

As part of exposing it, the Constructable Stylesheets path is now scoped consistently with the `<style>`-injection fallback. Previously the modern-browser path adopted the raw CSS into `document.adoptedStyleSheets` unscoped — so a rule such as `p { … }` intended for slotted content could restyle every matching element on the page — while only the fallback path scoped selectors. Both paths now emit identical `[data-hx-styled]`-scoped CSS and reject unsafe input via `sanitizeCss`.

Like the other `authoring` exports it is SSR-safe to import and call: its only module-scope state is a guarded feature-detect plus a `Map` cache, and `register()` degrades to the `injectLightStyles` no-op when no DOM is present. Additive only — no existing export changes, so nothing that already imports from `@helixui/library/authoring` is affected.
