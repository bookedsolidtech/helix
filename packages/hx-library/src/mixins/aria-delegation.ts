import type { LitElement } from 'lit';

/**
 * All standard ARIA attributes intercepted by this mixin.
 * Extend as needed, but keep the list minimal.
 */
const ARIA_ATTRIBUTES = [
  'aria-activedescendant',
  'aria-atomic',
  'aria-autocomplete',
  'aria-braillelabel',
  'aria-brailleroledescription',
  'aria-busy',
  'aria-checked',
  'aria-colcount',
  'aria-colindex',
  'aria-colindextext',
  'aria-colspan',
  'aria-controls',
  'aria-current',
  'aria-describedby',
  'aria-description',
  'aria-details',
  'aria-disabled',
  'aria-errormessage',
  'aria-expanded',
  'aria-flowto',
  'aria-haspopup',
  'aria-hidden',
  'aria-invalid',
  'aria-keyshortcuts',
  'aria-label',
  'aria-labelledby',
  'aria-level',
  'aria-live',
  'aria-modal',
  'aria-multiline',
  'aria-multiselectable',
  'aria-orientation',
  'aria-owns',
  'aria-placeholder',
  'aria-posinset',
  'aria-pressed',
  'aria-readonly',
  'aria-relevant',
  'aria-required',
  'aria-roledescription',
  'aria-rowcount',
  'aria-rowindex',
  'aria-rowindextext',
  'aria-rowspan',
  'aria-selected',
  'aria-setsize',
  'aria-sort',
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
  'aria-valuetext',
  'role',
] as const;

/** Union type of all intercepted ARIA attribute names. */
export type AriaAttribute = (typeof ARIA_ATTRIBUTES)[number];

// TypeScript mixin constraint: constructors must accept `any[]`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LitElementConstructor = new (...args: any[]) => LitElement;

/**
 * The public interface added to any class by `mixinDelegatesAria`.
 * JS property accessors for all intercepted ARIA attributes, reading from
 * `data-aria-*` storage rather than `aria-*` attributes on the host.
 */
export interface AriadDelegationMixinInterface {
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
 * @example
 * ```ts
 * class HxButton extends mixinDelegatesAria(LitElement) {
 *   render() {
 *     return html`<button aria-label=${this.ariaLabel ?? nothing}></button>`;
 *   }
 * }
 * ```
 *
 * @param Base - A LitElement subclass constructor
 * @returns A new constructor extending Base with ARIA delegation behaviour
 */
export function mixinDelegatesAria<T extends LitElementConstructor>(Base: T): T {
  class AriadDelegationMixin extends Base {
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
      const parent: object = Object.getPrototypeOf(AriadDelegationMixin);
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

  // Add JS property accessors for each ARIA attribute, reading from data-aria-*
  for (const attr of ARIA_ATTRIBUTES) {
    // Convert 'aria-label' → 'ariaLabel', 'role' → 'role'
    const propName: string = attr === 'role' ? 'role' : ariaAttrToProp(attr);
    const dataAttr = `data-${attr}`;

    Object.defineProperty(AriadDelegationMixin.prototype, propName, {
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

  // Cast to T to satisfy the declared return type. The AriadDelegationMixinInterface
  // instance members are added at runtime via Object.defineProperty above; callers
  // that need the typed accessors should cast the instance or use the interface directly.
  return AriadDelegationMixin as unknown as T;
}

/**
 * Converts 'aria-label' → 'ariaLabel', 'aria-busy' → 'ariaBusy', etc.
 * Removes the 'aria-' prefix, capitalizes the first letter of the remainder,
 * then camelCases any additional hyphen-separated segments.
 */
function ariaAttrToProp(attr: string): string {
  const rest = attr.replace(/^aria-/, '');
  return (
    'aria' +
    rest.charAt(0).toUpperCase() +
    rest.slice(1).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
  );
}
