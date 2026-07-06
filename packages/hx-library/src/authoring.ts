/**
 * @helixui/library/authoring — SSR/Node-safe component-authoring surface.
 *
 * This is the canonical entry point for **Track-2** authoring: building a brand
 * new custom HELiX component on top of the shared base class and mixins, e.g.
 *
 * ```ts
 * import { HelixElement, mixinDelegatesAria } from '@helixui/library/authoring';
 * import { customElement } from 'lit/decorators.js';
 *
 * \@customElement('tw-thing')
 * class TwThing extends mixinDelegatesAria(HelixElement) {}
 * ```
 *
 * Unlike the package root (`@helixui/library`), this module imports **no
 * component module** and therefore triggers **no `customElements.define`** side
 * effect. It can be evaluated in a Node / SSR / build / no-DOM context (Astro,
 * Next.js server, Vitest server transforms) without touching `customElements`
 * or any DOM global. Keep it that way: only add re-exports here that are
 * themselves free of component-registration and top-level DOM access.
 *
 * The `@helixui/library` root re-exports `HelixElement`, `mixinDelegatesAria`,
 * `FocusMixin`, and `FormMixin` too (for parity with the rest of the public
 * surface), but the root is NOT side-effect-free — prefer this subpath for the
 * authoring path.
 *
 * @packageDocumentation
 */

// Base class — imports only `lit`. No component registration.
export { HelixElement } from './base/helix-element.js';

// Authoring mixins — import only `lit` / `lit/decorators.js` / the base class.
// None of these register a custom element.
export { mixinDelegatesAria } from './mixins/aria-delegation.js';
export type { AriaDelegationMixinInterface, AriaAttribute } from './mixins/aria-delegation.js';
export { FocusMixin } from './mixins/FocusMixin.js';
export type { FocusMixinInterface } from './mixins/FocusMixin.js';
export { FormMixin } from './mixins/FormMixin.js';
export type { FormMixinInterface } from './mixins/FormMixin.js';

// Light-DOM style utilities — the primitives a Track-2 author reaches for when
// a custom HELiX component needs to style slotted (light-DOM) content. All are
// SSR-safe to **import and invoke**, and register no custom element, so they
// belong on this side-effect-free subpath:
//
//  - `injectLightStyles` guards every DOM access behind a
//    `typeof document === 'undefined'` check (a runtime no-op under SSR).
//  - `adoptedStylesheetRegistry` is the capability-detecting light-DOM
//    style-delivery singleton: `register(componentName, css)` sanitizes the CSS
//    and scopes every selector under `[data-hx-styled="componentName"]`, then
//    delivers it via Constructable Stylesheets (`document.adoptedStyleSheets`)
//    when available and scoped `<style>` injection (`injectLightStyles`)
//    otherwise — the emitted CSS is identical either way and never leaks to
//    unscoped page content. Its only module-scope state is a guarded
//    feature-detect (`typeof document !== 'undefined'`) plus a `Map` cache, and
//    `register()` degrades to the `injectLightStyles` no-op under SSR, so both
//    importing it and calling `.register()` are safe on the server.
//  - `AdoptedStylesheetsController` does no module-scope DOM work (its only
//    static state is `Map`/`WeakMap` caches), and its `document` fallback is
//    resolved lazily inside its methods — never in the constructor. So
//    `new AdoptedStylesheetsController(this, css)` in a Track-2 component field
//    initializer instantiates during SSR without a `ReferenceError`; the DOM is
//    only touched when `hostConnected`/`hostDisconnected` run (client-side).
//
// All are DOM-runtime utilities: they require a real document/shadow root when
// their methods actually *run* in the browser. Import on the server, drive them
// at runtime on the client.
export { injectLightStyles } from './utilities/injectLightStyles.js';
export { adoptedStylesheetRegistry } from './utilities/adoptedStylesheetRegistry.js';
export { AdoptedStylesheetsController } from './controllers/adopted-stylesheets.js';
