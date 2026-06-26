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
// a custom HELiX component needs to style slotted (light-DOM) content. Both are
// **import-time** SSR-safe and register no custom element, so they belong on
// this side-effect-free subpath:
//
//  - `injectLightStyles` guards every DOM access behind a
//    `typeof document === 'undefined'` check (a runtime no-op under SSR).
//  - `AdoptedStylesheetsController`'s only module-scope work is allocating
//    static caches (`Map`/`WeakMap`); its `document` reference lives in a
//    constructor default parameter, which is evaluated at construction, not at
//    module evaluation.
//
// Both are DOM-runtime utilities: they require a real document/shadow root when
// actually *invoked* in the browser. Import them here, call them at runtime.
export { injectLightStyles } from './utilities/injectLightStyles.js';
export { AdoptedStylesheetsController } from './controllers/adopted-stylesheets.js';
