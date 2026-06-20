import type { LitElement } from 'lit';

/**
 * Canonical map from each intercepted WAI-ARIA content attribute to its
 * **ARIAMixin IDL property name** (the exact name browsers expose natively as
 * `element.ariaColCount`, `element.ariaDescribedBy`, etc.).
 *
 * These IDL names CANNOT be derived algorithmically from the kebab-case
 * attribute: the internal capitalization (`ariaColCount`, `ariaDescribedBy`,
 * `ariaBrailleRoleDescription`, `ariaRowIndex`, …) does not correspond to
 * hyphen boundaries in the attribute (`aria-colcount`, `aria-describedby`, …).
 * A static table is therefore the source of truth. The values match the
 * ARIAMixin interface in TS `lib.dom` for every attribute it covers; the eight
 * relationship attributes that `lib.dom` only types as element-reference
 * properties (`aria-activedescendant`, `aria-controls`, `aria-describedby`,
 * `aria-details`, `aria-errormessage`, `aria-flowto`, `aria-labelledby`,
 * `aria-owns`) use their standard ARIA IDL string-reflection names.
 *
 * Source: WAI-ARIA / ARIA IDL reflection (https://www.w3.org/TR/wai-aria/) and
 * the ARIAMixin interface as reflected in TypeScript `lib.dom.d.ts`.
 *
 * To intercept a new ARIA attribute, add a `'aria-*': 'ariaXxx'` entry here —
 * `ARIA_ATTRIBUTES`, the union type, and the generated accessors all derive
 * from this map, so they cannot drift.
 */
const ARIA_ATTR_TO_IDL_PROP = {
  'aria-activedescendant': 'ariaActiveDescendant',
  'aria-atomic': 'ariaAtomic',
  'aria-autocomplete': 'ariaAutoComplete',
  'aria-braillelabel': 'ariaBrailleLabel',
  'aria-brailleroledescription': 'ariaBrailleRoleDescription',
  'aria-busy': 'ariaBusy',
  'aria-checked': 'ariaChecked',
  'aria-colcount': 'ariaColCount',
  'aria-colindex': 'ariaColIndex',
  'aria-colindextext': 'ariaColIndexText',
  'aria-colspan': 'ariaColSpan',
  'aria-controls': 'ariaControls',
  'aria-current': 'ariaCurrent',
  'aria-describedby': 'ariaDescribedBy',
  'aria-description': 'ariaDescription',
  'aria-details': 'ariaDetails',
  'aria-disabled': 'ariaDisabled',
  'aria-errormessage': 'ariaErrorMessage',
  'aria-expanded': 'ariaExpanded',
  'aria-flowto': 'ariaFlowTo',
  'aria-haspopup': 'ariaHasPopup',
  'aria-hidden': 'ariaHidden',
  'aria-invalid': 'ariaInvalid',
  'aria-keyshortcuts': 'ariaKeyShortcuts',
  'aria-label': 'ariaLabel',
  'aria-labelledby': 'ariaLabelledBy',
  'aria-level': 'ariaLevel',
  'aria-live': 'ariaLive',
  'aria-modal': 'ariaModal',
  'aria-multiline': 'ariaMultiLine',
  'aria-multiselectable': 'ariaMultiSelectable',
  'aria-orientation': 'ariaOrientation',
  'aria-owns': 'ariaOwns',
  'aria-placeholder': 'ariaPlaceholder',
  'aria-posinset': 'ariaPosInSet',
  'aria-pressed': 'ariaPressed',
  'aria-readonly': 'ariaReadOnly',
  'aria-relevant': 'ariaRelevant',
  'aria-required': 'ariaRequired',
  'aria-roledescription': 'ariaRoleDescription',
  'aria-rowcount': 'ariaRowCount',
  'aria-rowindex': 'ariaRowIndex',
  'aria-rowindextext': 'ariaRowIndexText',
  'aria-rowspan': 'ariaRowSpan',
  'aria-selected': 'ariaSelected',
  'aria-setsize': 'ariaSetSize',
  'aria-sort': 'ariaSort',
  'aria-valuemax': 'ariaValueMax',
  'aria-valuemin': 'ariaValueMin',
  'aria-valuenow': 'ariaValueNow',
  'aria-valuetext': 'ariaValueText',
  role: 'role',
} as const satisfies Record<string, string>;

/**
 * All standard ARIA attributes (plus `role`) intercepted by this mixin.
 * Derived from the canonical map so the two cannot diverge.
 */
const ARIA_ATTRIBUTES = Object.keys(ARIA_ATTR_TO_IDL_PROP) as readonly AriaAttribute[];

/**
 * Union type of all intercepted ARIA attribute names (the content-attribute,
 * kebab-case form — e.g. `'aria-label'`, `'role'`).
 *
 * @public
 */
export type AriaAttribute = keyof typeof ARIA_ATTR_TO_IDL_PROP;

// TypeScript mixin constraint: constructors must accept `any[]`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LitElementConstructor = new (...args: any[]) => LitElement;

/**
 * The public interface added to any class by `mixinDelegatesAria`.
 * JS property accessors for all intercepted ARIA attributes, reading from
 * `data-aria-*` storage rather than `aria-*` attributes on the host.
 *
 * Every accessor name is the canonical **ARIAMixin IDL property name** (the
 * same name browsers expose natively, e.g. `ariaColCount`, `ariaDescribedBy`),
 * sourced from {@link ARIA_ATTR_TO_IDL_PROP}. The generated runtime accessors
 * therefore match this interface exactly, so consumers building a custom HELiX
 * component on `HelixElement` can obtain typed access, e.g.
 * `(this as unknown as AriaDelegationMixinInterface).ariaExpanded`.
 *
 * @public
 */

export interface AriaDelegationMixinInterface {
  ariaActiveDescendant: string | null;
  ariaAtomic: string | null;
  ariaAutoComplete: string | null;
  ariaBrailleLabel: string | null;
  ariaBrailleRoleDescription: string | null;
  ariaBusy: string | null;
  ariaChecked: string | null;
  ariaColCount: string | null;
  ariaColIndex: string | null;
  ariaColIndexText: string | null;
  ariaColSpan: string | null;
  ariaControls: string | null;
  ariaCurrent: string | null;
  ariaDescribedBy: string | null;
  ariaDescription: string | null;
  ariaDetails: string | null;
  ariaDisabled: string | null;
  ariaErrorMessage: string | null;
  ariaExpanded: string | null;
  ariaFlowTo: string | null;
  ariaHasPopup: string | null;
  ariaHidden: string | null;
  ariaInvalid: string | null;
  ariaKeyShortcuts: string | null;
  ariaLabel: string | null;
  ariaLabelledBy: string | null;
  ariaLevel: string | null;
  ariaLive: string | null;
  ariaModal: string | null;
  ariaMultiLine: string | null;
  ariaMultiSelectable: string | null;
  ariaOrientation: string | null;
  ariaOwns: string | null;
  ariaPlaceholder: string | null;
  ariaPosInSet: string | null;
  ariaPressed: string | null;
  ariaReadOnly: string | null;
  ariaRelevant: string | null;
  ariaRequired: string | null;
  ariaRoleDescription: string | null;
  ariaRowCount: string | null;
  ariaRowIndex: string | null;
  ariaRowIndexText: string | null;
  ariaRowSpan: string | null;
  ariaSelected: string | null;
  ariaSetSize: string | null;
  ariaSort: string | null;
  ariaValueMax: string | null;
  ariaValueMin: string | null;
  ariaValueNow: string | null;
  ariaValueText: string | null;
  role: string | null;
}

// ─── Compile-time drift guard ────────────────────────────────────────────────
// Lock ARIA_ATTR_TO_IDL_PROP and AriaDelegationMixinInterface together so the
// generated accessor names (map values) can never silently diverge from the
// public interface keys. If you add/rename an entry in one, the other must
// match or the build fails here.
type IdlPropName = (typeof ARIA_ATTR_TO_IDL_PROP)[keyof typeof ARIA_ATTR_TO_IDL_PROP];
type InterfaceKey = keyof AriaDelegationMixinInterface;

// Every IDL property name produced by the map must be a key of the interface…
type _AssertMapValuesAreInterfaceKeys = IdlPropName extends InterfaceKey ? true : never;
// …and every interface key must be produced by the map (no orphan members).
type _AssertInterfaceKeysAreMapValues = InterfaceKey extends IdlPropName ? true : never;

const _ariaMapMatchesInterface: [
  _AssertMapValuesAreInterfaceKeys,
  _AssertInterfaceKeysAreMapValues,
] = [true, true];
void _ariaMapMatchesInterface;

/**
 * Mixin that delegates ARIA attributes from the host element to data-aria-* storage,
 * preventing Shadow DOM double-announcement by screen readers.
 *
 * When a custom element uses `delegatesFocus: true`, the focus delegate (inner element)
 * and the host are both in the a11y tree. Setting `aria-label` on the host causes the
 * label to be announced twice — once for the host, once for the focused inner element.
 *
 * This mixin intercepts `attributeChangedCallback` for all ARIA attributes:
 * - Shifts the value from `aria-*` to `data-aria-*` on the host
 * - Provides JS property accessors that read from `data-aria-*`
 * - The host element no longer has `aria-*` attributes visible in the a11y tree
 * - Components read ARIA values via property accessors and apply them to inner elements
 *
 * @public
 *
 * @remarks
 * This is the canonical "Track-2" extension primitive for consumers authoring a
 * custom HELiX component from `HelixElement`. Apply it the same way the
 * first-party components do — `mixinDelegatesAria(HelixElement)` — to get
 * host-level ARIA delegation while keeping `HelixElement`'s form-participation
 * and `ElementInternals` infrastructure. The mixin operates on any `LitElement`
 * subclass and adds no dependency beyond `lit`, so the returned class is safe to
 * `@customElement`-register and extend further.
 *
 * Import it from the side-effect-free `@helixui/library/authoring` subpath so
 * the Track-2 authoring path stays SSR/Node-safe (the root export eagerly
 * registers every component via `customElements.define`).
 *
 * The generated accessors use the canonical ARIAMixin IDL property names, so
 * `this.ariaLabel` (and the rest) are correctly typed via Lit/native typings.
 * For ARIA accessors not present in older `lib.dom` typings, cast through the
 * public {@link AriaDelegationMixinInterface} for typed access, e.g.
 * `(this as unknown as AriaDelegationMixinInterface).ariaColCount`.
 *
 * @example Track-2 — a custom HELiX component built on `HelixElement`:
 * ```ts
 * import { HelixElement, mixinDelegatesAria } from '@helixui/library/authoring';
 * import { html, nothing } from 'lit';
 * import { customElement } from 'lit/decorators.js';
 *
 * \@customElement('tw-thing')
 * class TwThing extends mixinDelegatesAria(HelixElement) {
 *   render() {
 *     // `this.ariaLabel` is provided by Lit/native typings and is correctly
 *     // typed — read delegated ARIA via the native accessor or apply it to an
 *     // inner element.
 *     return html`<button aria-label=${this.ariaLabel ?? nothing}></button>`;
 *   }
 * }
 * ```
 *
 * @param Base - A LitElement subclass constructor (e.g. `HelixElement`)
 * @returns A new constructor extending Base with ARIA delegation behaviour
 */
export function mixinDelegatesAria<T extends LitElementConstructor>(Base: T): T {
  class AriaDelegationMixin extends Base {
    // Per-instance guard: tracks which aria attributes are mid-processing so
    // that the recursive attributeChangedCallback triggered by our own
    // removeAttribute(name) call does not erroneously clear data-aria-*.
    #processingAria = new Set<string>();

    static get observedAttributes(): string[] {
      // Reflect.get with `this` as the receiver passes the concrete subclass
      // (e.g. HelixButton) through to Lit's ReactiveElement getter, so it
      // returns @property attribute names for that specific class.
      // TypeScript cannot infer static members on `T`, so we use Reflect.get
      // rather than `super.observedAttributes` to avoid TS2339.
      const parent: object = Object.getPrototypeOf(AriaDelegationMixin);
      const superAttrs: string[] =
        (Reflect.get(parent, 'observedAttributes', this) as string[] | undefined) ?? [];
      // Append any ARIA attributes not already in the list.
      const ariaAttrs = ARIA_ATTRIBUTES.filter((a) => !superAttrs.includes(a));
      return [...superAttrs, ...ariaAttrs];
    }

    attributeChangedCallback(name: string, old: string | null, next: string | null): void {
      if ((ARIA_ATTRIBUTES as readonly string[]).includes(name)) {
        // Guard: if we're already processing this attribute, we're in the
        // recursive callback triggered by our own removeAttribute(name) below.
        // Do not process it again — that would clear data-aria-* incorrectly.
        if (this.#processingAria.has(name)) return;

        // Intercept: store as data-aria-*, do not propagate aria-* to the host.
        if (next !== null) {
          // data-aria-* is not in observedAttributes — no recursive loop here.
          this.setAttribute(`data-${name}`, next);
        } else {
          this.removeAttribute(`data-${name}`);
        }

        // Remove the aria-* attribute from the host so it is absent from the
        // a11y tree and cannot cause double announcements. Guard while doing so.
        this.#processingAria.add(name);
        if (this.hasAttribute(name)) {
          this.removeAttribute(name); // synchronously re-enters attributeChangedCallback; guard catches it
        }
        this.#processingAria.delete(name);

        // Trigger Lit update so render() re-reads the delegated value.
        this.requestUpdate();
        return;
      }
      super.attributeChangedCallback(name, old, next);
    }
  }

  // Add JS property accessors for each ARIA attribute, reading from data-aria-*.
  // The accessor name is the canonical ARIAMixin IDL property name (e.g.
  // 'aria-colcount' → 'ariaColCount'), so the generated accessors match BOTH
  // AriaDelegationMixinInterface AND the native ARIAMixin properties.
  for (const attr of ARIA_ATTRIBUTES) {
    const propName: string = ARIA_ATTR_TO_IDL_PROP[attr];
    const dataAttr = `data-${attr}`;

    Object.defineProperty(AriaDelegationMixin.prototype, propName, {
      get(this: Element): string | null {
        return this.getAttribute(dataAttr);
      },
      set(this: LitElement, value: string | null) {
        if (value === null || value === undefined) {
          this.removeAttribute(dataAttr);
          this.removeAttribute(attr);
        } else {
          this.setAttribute(dataAttr, value);
          // Ensure aria-* is NOT present on the host.
          if (this.hasAttribute(attr)) {
            this.removeAttribute(attr);
          }
        }
        // Trigger Lit reactive update.
        this.requestUpdate();
      },
      configurable: true,
      enumerable: false,
    });
  }

  // Cast to T to satisfy the declared return type. The AriaDelegationMixinInterface
  // instance members are added at runtime via Object.defineProperty above; callers
  // that need the typed accessors should cast the instance or use the interface directly.
  return AriaDelegationMixin as unknown as T;
}
