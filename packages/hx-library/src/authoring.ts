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
