/**
 * SSR / Node import-safety proof for the `@helixui/library/authoring` subpath.
 *
 * This suite runs under the pure-Node vitest config (`vitest.scripts.config.ts`,
 * `environment: 'node'`) — there is NO DOM (`document` is `undefined`).
 *
 * It proves the remediation for the Track-2 authoring path:
 *  - importing `src/authoring.ts` does NOT throw in a no-DOM (server) context
 *  - it does NOT register any `hx-*` component as an import side effect
 *  - importing it requires no DOM document
 *  - the authoring symbols are present and `mixinDelegatesAria(HelixElement)`
 *    is a usable class factory without a DOM
 *  - the light-DOM style utilities (`injectLightStyles`,
 *    `AdoptedStylesheetsController`) are import- AND construct-safe without a
 *    DOM: `injectLightStyles` is a runtime no-op, and the controller constructs
 *    without a `document` default (DOM is resolved lazily, client-side only)
 *
 * Note on `customElements`: Lit's `@lit/reactive-element` installs a benign
 * custom-element *registry shim* on `globalThis` when evaluated in Node, so the
 * presence of a `customElements` object is NOT a HELiX side effect and is not
 * what this suite guards. The meaningful regression guard is that NO `hx-*`
 * element is defined — if the authoring barrel ever pulled in a component
 * module, that module's top-level `customElements.define('hx-...')` would
 * register a tag here and fail the assertions below.
 */
import { describe, expect, it } from 'vitest';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

// A representative sample of first-party tags. If any component module leaks
// into the authoring graph, at least one of these would become registered.
const SAMPLE_HX_TAGS = ['hx-button', 'hx-card', 'hx-text-input', 'hx-checkbox', 'hx-dialog'];

function registeredHxTags(): string[] {
  const ce = (globalThis as { customElements?: CustomElementRegistry }).customElements;
  if (!ce || typeof ce.get !== 'function') return [];
  return SAMPLE_HX_TAGS.filter((tag) => ce.get(tag) !== undefined);
}

describe('@helixui/library/authoring — SSR/Node import safety', () => {
  it('runs in a no-DOM (server) context', () => {
    // Sanity-check the environment: if a `document` is present, the no-DOM
    // safety claim below would be untested.
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
  });

  it('does not register any hx-* component before the authoring import', () => {
    // Baseline: nothing in this Node-only graph has registered a HELiX tag.
    expect(registeredHxTags()).toEqual([]);
  });

  it('imports without throwing and without requiring a DOM document', async () => {
    // A dynamic import keeps module-graph evaluation inside the assertion, so a
    // side-effectful component registration at import time surfaces here.
    await expect(import('../../src/authoring.js')).resolves.toBeDefined();
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
  });

  it('exports the authoring surface (HelixElement + mixins)', async () => {
    const mod = await import('../../src/authoring.js');
    expect(typeof mod.HelixElement).toBe('function');
    expect(typeof mod.mixinDelegatesAria).toBe('function');
    expect(typeof mod.FocusMixin).toBe('function');
    expect(typeof mod.FormMixin).toBe('function');
  });

  it('exports the light-DOM style utilities', async () => {
    const mod = await import('../../src/authoring.js');
    // injectLightStyles — light-DOM style injection helper.
    expect(typeof mod.injectLightStyles).toBe('function');
    // AdoptedStylesheetsController — adopted-stylesheets ReactiveController class.
    expect(typeof mod.AdoptedStylesheetsController).toBe('function');
  });

  it('injectLightStyles is a no-op (does not throw) without a DOM', async () => {
    const { injectLightStyles } = await import('../../src/authoring.js');
    // In a no-DOM context the helper must short-circuit on the
    // `typeof document === 'undefined'` guard and return without touching the
    // DOM. Calling it proves the runtime SSR no-op, not just import safety.
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
    expect(() => injectLightStyles('hx-ssr-probe', 'p { color: red; }')).not.toThrow();
    expect(injectLightStyles('hx-ssr-probe', 'p { color: red; }')).toBeUndefined();
  });

  it('AdoptedStylesheetsController constructs without a DOM (no document default)', async () => {
    const { AdoptedStylesheetsController } = await import('../../src/authoring.js');

    // Minimal stand-in for the `ReactiveControllerHost & HTMLElement` the
    // constructor expects: it only calls `host.addController(this)`. The cast is
    // a test boundary — the controller never reads anything else off the host
    // during construction. No `any` is used.
    const fakeHost = {
      addController(_controller: ReactiveController): void {
        // no-op: construction only needs this method to exist
      },
    } as unknown as ReactiveControllerHost & HTMLElement;

    // The regression guard for the construct-safety contract: a Track-2 consumer
    // doing `new AdoptedStylesheetsController(this, css)` in a field initializer
    // must instantiate during SSR — with NO `document` and NO explicit root —
    // without throwing `ReferenceError: document is not defined`. The `document`
    // fallback is now resolved lazily in `_root`, only when a method runs.
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
    let controller: InstanceType<typeof AdoptedStylesheetsController> | undefined;
    expect(() => {
      controller = new AdoptedStylesheetsController(fakeHost, 'p { color: red; }');
    }).not.toThrow();
    expect(controller).toBeInstanceOf(AdoptedStylesheetsController);
    // Construction must not have materialized a DOM.
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
  });

  it('does NOT register any hx-* component as an import side effect', async () => {
    await import('../../src/authoring.js');
    // The regression guard: the authoring barrel must not pull in any component
    // module, so no first-party tag may be defined as a result of importing it.
    expect(registeredHxTags()).toEqual([]);
  });

  it('mixinDelegatesAria(HelixElement) produces a class without a DOM', async () => {
    const { HelixElement, mixinDelegatesAria } = await import('../../src/authoring.js');
    // Applying the mixin is a pure class transformation — no element is
    // constructed, so it must succeed with no DOM present.
    const Mixed = mixinDelegatesAria(HelixElement);
    expect(typeof Mixed).toBe('function');
    expect(Object.getPrototypeOf(Mixed)).toBe(HelixElement);
  });
});
