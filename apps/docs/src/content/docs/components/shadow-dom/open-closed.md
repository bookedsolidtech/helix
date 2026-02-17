---
title: Open vs Closed Shadow Roots
description: Understanding the difference between open and closed shadow DOM modes and when to use each.
---

Shadow DOM roots are created in one of two modes: `open` or `closed`. The choice determines whether JavaScript outside the component can reach inside the shadow tree. For a component library like the HELiX system, this decision has concrete consequences for testing, accessibility tooling, and developer experience. This guide explains exactly what each mode does, why Lit always uses `open`, and when — if ever — `closed` makes sense.

## What `mode` Controls

When a shadow root is attached to an element, the `mode` option controls one thing: whether `element.shadowRoot` returns the `ShadowRoot` instance or `null`.

```javascript
// Open shadow root
const openHost = document.createElement('div');
const openShadow = openHost.attachShadow({ mode: 'open' });
console.log(openHost.shadowRoot); // ShadowRoot {}

// Closed shadow root
const closedHost = document.createElement('div');
const closedShadow = closedHost.attachShadow({ mode: 'closed' });
console.log(closedHost.shadowRoot); // null
```

That is the entire behavioral difference at the DOM API level. Both modes produce real shadow trees. Both encapsulate styles. Both handle slot projection identically. Both dispatch retargeted events. The only distinction is whether the `shadowRoot` property on the host element is a public reference or `null`.

### Open Mode

```javascript
const shadow = host.attachShadow({ mode: 'open' });

// From anywhere in the page:
host.shadowRoot; // ShadowRoot reference
host.shadowRoot.querySelector('button'); // Internal button
host.shadowRoot.adoptedStyleSheets; // Style sheets in use
```

External code — including test runners, accessibility tools, browser extensions, and DevTools — can navigate into the shadow tree freely. This is the standard mode for component libraries and design systems.

### Closed Mode

```javascript
const shadow = host.attachShadow({ mode: 'closed' });

// From anywhere in the page:
host.shadowRoot;  // null — no external access via this property

// The shadow root reference must be kept privately:
class MyElement extends HTMLElement {
  #shadow: ShadowRoot;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'closed' });
  }
}
```

The host element's `shadowRoot` property returns `null`. Code that does not hold a private reference to the shadow root cannot reach inside. But this restriction is weaker than it appears — more on that below.

## How Lit Uses Shadow DOM Mode

Lit always creates open shadow roots. This is hardcoded into `LitElement`'s `createRenderRoot()` method and is not configurable through a property or decorator.

```typescript
// LitElement default implementation (simplified)
protected createRenderRoot(): HTMLElement | ShadowRoot {
  return this.attachShadow(
    (this.constructor as typeof LitElement).shadowRootOptions
  );
}

// The static default:
static shadowRootOptions: ShadowRootInit = { mode: 'open' };
```

You can override this in a subclass, but doing so in HELiX components is not permitted. Open mode is the correct choice for this library.

```typescript
// hx-button.ts — standard HELiX pattern
@customElement('hx-button')
export class HelixButton extends LitElement {
  // No createRenderRoot override needed.
  // Lit attaches an open shadow root automatically.

  override render() {
    return html`
      <button part="button" class=${classMap(classes)} ?disabled=${this.disabled}>
        <slot></slot>
      </button>
    `;
  }
}
```

If you need access to the shadow root from inside the component (for imperative DOM operations), use `this.shadowRoot` — it is always non-null in open mode:

```typescript
@customElement('hx-text-input')
export class HelixTextInput extends LitElement {
  override firstUpdated() {
    // Safe to access shadowRoot in open mode
    const input = this.shadowRoot?.querySelector<HTMLInputElement>('.field__input');
    input?.focus();
  }
}
```

## Why Open Mode Is the Right Default for Component Libraries

### 1. Testability

Vitest browser mode tests need to query shadow DOM internals to verify rendering. The `shadowQuery` helper in `packages/hx-library/src/test-utils.ts` depends on `element.shadowRoot` being non-null:

```typescript
// test-utils.ts pattern
export function shadowQuery<T extends Element>(host: Element, selector: string): T {
  const root = host.shadowRoot;
  if (!root) {
    throw new Error(
      `shadowQuery: ${host.tagName} has no accessible shadow root. ` + `Is it using closed mode?`,
    );
  }
  const el = root.querySelector<T>(selector);
  if (!el) {
    throw new Error(`shadowQuery: "${selector}" not found in shadow DOM`);
  }
  return el;
}
```

With closed mode, every test that inspects internal DOM would require a workaround — either exposing a private reference or monkey-patching `attachShadow`. Neither is acceptable for a production library.

```typescript
// hx-button.test.ts — works because mode is open
it('renders with variant class applied', async () => {
  const el = await fixture<HelixButton>(html` <hx-button variant="secondary">Save</hx-button> `);

  // Direct shadow DOM inspection — requires open mode
  const button = el.shadowRoot!.querySelector<HTMLButtonElement>('.button');
  expect(button?.classList.contains('button--secondary')).toBe(true);
});
```

### 2. Accessibility Tool Compatibility

Screen readers (NVDA, JAWS, VoiceOver), the axe accessibility engine, and browser accessibility tree APIs all read into open shadow roots. They follow ARIA relationships across shadow boundaries using the exposed `shadowRoot` reference. Closed mode can break these integrations.

For a healthcare component library where WCAG 2.1 AA compliance is a non-negotiable mandate, losing accessibility tool access is not an acceptable trade-off.

### 3. DevTools and Debugging

Chrome DevTools, Firefox Inspector, and Safari Web Inspector all read `element.shadowRoot` to render shadow trees in the Elements panel. With open mode, clicking "Inspect" on `hx-text-input` expands its shadow tree immediately. With closed mode, the shadow tree is invisible in DevTools — not hidden, truly invisible — making debugging in production significantly harder.

### 4. ElementInternals Works With Both Modes

`ElementInternals`, used by HELiX components for form association, does not depend on shadow root mode. Both `hx-button` and `hx-text-input` call `this.attachInternals()` in their constructors regardless of mode:

```typescript
export class HelixButton extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  constructor() {
    super();
    // attachInternals() is independent of shadow root mode.
    // It works identically whether mode is 'open' or 'closed'.
    this._internals = this.attachInternals();
  }

  get form(): HTMLFormElement | null {
    return this._internals.form;
  }
}
```

`ElementInternals` stores form state, validity, and ARIA semantics separately from the shadow root. Its accessibility properties (`ariaLabel`, `role`, etc.) feed into the accessibility tree through a dedicated internal slot, not through `shadowRoot`. Switching to closed mode would have no effect on `ElementInternals` behavior.

## Why Closed Mode Does Not Provide Security

The most common reason developers reach for closed mode is to protect internal implementation details from external access. This is understandable but misguided. Closed mode is not a security boundary.

### DevTools Always Win

Browser DevTools bypass closed shadow roots to show developers the full DOM. This is a deliberate browser design decision: developer tooling must be able to inspect any element, regardless of mode.

### `attachShadow` Can Be Intercepted

Before a page's JavaScript runs, a script can monkey-patch `Element.prototype.attachShadow` to capture every shadow root reference, including those created in closed mode:

```javascript
// An attacker (or a curious developer) can do this before your components load:
const originalAttachShadow = Element.prototype.attachShadow;
const shadowRoots = new WeakMap();

Element.prototype.attachShadow = function (init) {
  const root = originalAttachShadow.call(this, init);
  shadowRoots.set(this, root);
  return root;
};

// Later:
const closedRoot = shadowRoots.get(someElement); // Got it.
```

This technique is well-documented and widely used. Any browser extension, analytics script, or injected code loaded before your components can capture every shadow root you create, regardless of mode. Closed mode provides no protection against this.

### The Actual Browser Built-In Use Case

Closed mode exists for a specific purpose: browser vendors use it to implement native form controls and media elements in a way that **signals** implementation privacy to the browser's own tooling and spec compliance testing. The `<input>`, `<video>`, `<select>`, and `<details>` elements all use closed shadow roots internally. These are not attempting security — they are indicating that the internal DOM is an implementation detail of the browser itself, not the page.

This use case does not apply to custom components distributed as a library. Your consumers are developers building applications, not browser spec implementations.

## Testing Implications

The closed/open distinction has direct consequences for your test strategy.

### Open Mode: Full Inspection Available

```typescript
// All of these work with open mode shadow roots:

// 1. Direct shadowRoot access
const button = el.shadowRoot!.querySelector('button');

// 2. The shadowQuery test utility
const input = shadowQuery<HTMLInputElement>(el, '.field__input');

// 3. Querying from the Lit element's renderRoot
const label = (el.renderRoot as ShadowRoot).querySelector('label');

// 4. Accessing adoptedStyleSheets for style verification
const sheets = el.shadowRoot!.adoptedStyleSheets;
```

### Closed Mode: Blocked Inspection

```typescript
// With closed mode, these all fail:
el.shadowRoot; // null — cannot query
el.shadowRoot?.querySelector; // TypeError or returns undefined

// renderRoot still works from inside the component,
// but you cannot access it from a test file:
(el as unknown as { renderRoot: ShadowRoot }).renderRoot; // Hack required
```

The only workaround is to expose the shadow root through a separate public or protected property, which defeats the purpose of closed mode entirely:

```typescript
// You would have to do something like this — defeating the point:
class ClosedElement extends LitElement {
  protected override createRenderRoot() {
    this._shadow = this.attachShadow({ mode: 'closed' });
    return this._shadow;
  }
  // Now you're exposing it anyway for tests
  _shadow!: ShadowRoot;
}
```

## Legitimate Reasons to Consider Closed Mode

Outside of browser built-ins, there are a small number of legitimate use cases for closed shadow roots in application code (not library code):

**Third-party payment widgets**: A payment iframe replacement that renders card number inputs might use closed mode to reduce the surface area visible to merchant page JavaScript. Combined with CSP and iframe isolation, this is a defense-in-depth measure — not a security guarantee.

**Proprietary rendering engines**: An embeddable chart or map widget distributed as a compiled bundle where the vendor explicitly does not want consumers modifying internal DOM. Even here, it only raises the friction — it does not prevent access.

**Spec-compliant browser built-in emulation**: If you are building a polyfill or emulation of a native element that normally uses a closed shadow root, matching that behavior for spec accuracy.

None of these use cases apply to HELiX components. Every HELiX component uses open mode.

## Practical Summary

| Concern                      | Open Mode             | Closed Mode               |
| ---------------------------- | --------------------- | ------------------------- |
| External `shadowRoot` access | Allowed               | Blocked via `null` return |
| DevTools visibility          | Full                  | Full (DevTools bypass)    |
| Accessibility tooling        | Full compatibility    | May break integrations    |
| Vitest / Playwright tests    | Works directly        | Requires workarounds      |
| Screen reader compatibility  | Fully compatible      | Potentially degraded      |
| ElementInternals behavior    | Unaffected            | Unaffected                |
| Security value               | None                  | None (circumventable)     |
| Lit compatibility            | Default and supported | Possible via override     |

For HELiX library components, the recommendation is not a preference — it is a requirement:

**Always use `mode: 'open'`.**

Lit enforces this by default. Do not override `createRenderRoot()` to change it. If you encounter a situation that seems to require closed mode, bring it to the principal-engineer for architectural review before making any change. The correct answer is almost certainly a different approach — encapsulation through private class fields, explicit API surface design, or slot architecture — not shadow root mode.

## Next Steps

- [CSS Parts API](/components/shadow-dom/parts) — Expose specific elements for controlled external styling
- [CSS Part Forwarding](/components/shadow-dom/part-forwarding) — Forward parts through nested component layers
- [Shadow DOM Architecture](/components/shadow-dom/architecture) — Core concepts of shadow trees and encapsulation
- [Slots and Composition](/components/shadow-dom/slots) — Content projection and slot patterns

## Sources

- [ShadowRoot.mode - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/mode)
- [attachShadow() - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow)
- [Using shadow DOM - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- [ElementInternals - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [LitElement createRenderRoot | Lit Docs](https://lit.dev/docs/components/shadow-dom/)
