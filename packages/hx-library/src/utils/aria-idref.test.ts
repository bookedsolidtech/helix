import { describe, it, expect, afterEach } from 'vitest';
import { resolveIdrefTokens } from './aria-idref.js';
import { cleanup } from '../test-utils.js';

afterEach(cleanup);

/**
 * Codex round-17 P1 regression coverage.
 *
 * `resolveIdrefTokens()` previously walked only the host's own root and the
 * enclosing shadow-host chain. When the host was light-DOM-slotted into
 * another component's shadow tree, IDREF targets declared inside that
 * slot-owner shadow root were unreachable: the host's `getRootNode()` is
 * the document, and the slot owner is not in any ancestor chain accessible
 * from the document side.
 *
 * The fix walks `host.assignedSlot` into the slot owner's shadow root (and
 * recursively up from there) so cross-shadow IDREF resolution succeeds for
 * the composed-tree slotting pattern.
 */
describe('resolveIdrefTokens — composed-tree slotting (round-17 P1)', () => {
  it('resolves an IDREF declared inside a slot-owner shadow root for a slotted host', async () => {
    // Define a wrapper component whose shadow root contains both an
    // ID-bearing label and a default slot. Light-DOM children placed into
    // the wrapper get slotted into that shadow root.
    if (!customElements.get('test-shadow-wrapper-r17')) {
      class TestShadowWrapper extends HTMLElement {
        constructor() {
          super();
          const root = this.attachShadow({ mode: 'open' });
          root.innerHTML = `
            <span id="ext-label">External Label</span>
            <slot></slot>
          `;
        }
      }
      customElements.define('test-shadow-wrapper-r17', TestShadowWrapper);
    }

    document.body.innerHTML = `
      <test-shadow-wrapper-r17>
        <input id="slotted-input" aria-labelledby="ext-label" />
      </test-shadow-wrapper-r17>
    `;
    const wrapper = document.body.querySelector('test-shadow-wrapper-r17') as HTMLElement;
    const slottedInput = wrapper.querySelector('#slotted-input') as HTMLInputElement;

    // Sanity: the input is assigned to a slot inside the wrapper's shadow
    // root, but its own getRootNode() is the document.
    expect(slottedInput.assignedSlot).toBeTruthy();
    expect(slottedInput.getRootNode()).toBe(document);

    // The OLD resolver — limited to the host's own root chain — would not
    // see `ext-label`. The NEW resolver crosses via assignedSlot into the
    // wrapper's shadow root and finds it.
    const resolved = resolveIdrefTokens(slottedInput, 'ext-label');
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.id).toBe('ext-label');
  });

  it('still resolves document-level IDREFs for slotted hosts', async () => {
    if (!customElements.get('test-shadow-wrapper-r17b')) {
      class TestShadowWrapperB extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' }).innerHTML = '<slot></slot>';
        }
      }
      customElements.define('test-shadow-wrapper-r17b', TestShadowWrapperB);
    }

    document.body.innerHTML = `
      <span id="doc-level-label">Document Label</span>
      <test-shadow-wrapper-r17b>
        <input id="slotted-input-b" aria-labelledby="doc-level-label" />
      </test-shadow-wrapper-r17b>
    `;
    const slottedInput = document.body.querySelector('#slotted-input-b') as HTMLInputElement;
    const resolved = resolveIdrefTokens(slottedInput, 'doc-level-label');
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.id).toBe('doc-level-label');
  });

  it('falls back to first-match precedence when same id exists in both scopes', async () => {
    if (!customElements.get('test-shadow-wrapper-r17c')) {
      class TestShadowWrapperC extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' }).innerHTML = `
            <span id="dup-label">Inner Wins</span>
            <slot></slot>
          `;
        }
      }
      customElements.define('test-shadow-wrapper-r17c', TestShadowWrapperC);
    }

    document.body.innerHTML = `
      <span id="dup-label">Outer Doc</span>
      <test-shadow-wrapper-r17c>
        <input id="slotted-input-c" aria-labelledby="dup-label" />
      </test-shadow-wrapper-r17c>
    `;
    const slottedInput = document.body.querySelector('#slotted-input-c') as HTMLInputElement;
    const resolved = resolveIdrefTokens(slottedInput, 'dup-label');
    // Document is searched before slot-owner shadow root because the
    // light-DOM input's own root (document) is the closest scope from its
    // own perspective; the cross-slot hop adds the wrapper shadow root as
    // an additional but lower-priority root. (Either resolution is
    // semantically defensible — assert the actual ordering for stability.)
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.textContent).toBe('Outer Doc');
  });

  it('returns empty array for unresolvable tokens (matches platform semantics)', async () => {
    document.body.innerHTML = `<input id="lone-input" />`;
    const input = document.body.querySelector('#lone-input') as HTMLInputElement;
    expect(resolveIdrefTokens(input, 'does-not-exist')).toEqual([]);
  });
});
