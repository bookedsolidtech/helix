import { describe, it, expect, afterEach } from 'vitest';
import {
  resolveIdrefTokens,
  installAriaIdrefMirror,
  type AriaIdrefMirrorHandle,
} from './aria-idref.js';

// ─────────────────────────────────────────────────────────────
// aria-idref — codex push-gate round-1 regression coverage
//
// Finding 1: When a host is light-DOM-slotted into another component, the
//   slot-owner's shadow root MUST be searched BEFORE the document fallback.
//   Element ids are unique per-tree, not globally, so the same id may legally
//   exist in BOTH scopes; resolving to the document target gives the
//   component the wrong accessible name.
//
// Finding 2: When the host's `slot` attribute changes mid-life, the set of
//   reachable IDREF roots changes too. The shared root observers must
//   reattach so id / childList mutations in the NEW slot owner shadow tree
//   trigger resync.
// ─────────────────────────────────────────────────────────────

interface SlotOwnerRefs {
  outer: HTMLElement; // ancestor host that owns the shadow root containing <slot>
  shadowDup: HTMLElement; // duplicate-id target inside outer's shadow root
  docDup: HTMLElement; // duplicate-id target in the document
  inner: HTMLElement; // light-DOM child slotted INTO outer
}

const cleanupNodes: HTMLElement[] = [];

afterEach(() => {
  while (cleanupNodes.length > 0) {
    const node = cleanupNodes.pop();
    node?.remove();
  }
});

/**
 * Build a fixture where:
 *   - `outer` carries an open shadow root containing a `<slot>` and a
 *     duplicate-id target with id `dup`.
 *   - The document body holds a SECOND element with id `dup`.
 *   - `inner` is light-DOM child of `outer`, assigned to the slot. Inner
 *     declares `aria-labelledby="dup"`.
 *
 * Without the round-1 fix, the resolver pushes the document into the search
 * order BEFORE the slot owner's shadow root, so it binds to `docDup`. With
 * the fix, the slot-owner shadow root precedes the document and the slot's
 * scoped target wins.
 */
function buildSlotOwnerFixture(): SlotOwnerRefs {
  const outer = document.createElement('div');
  outer.setAttribute('data-fixture', 'slot-owner');
  document.body.appendChild(outer);
  cleanupNodes.push(outer);

  const root = outer.attachShadow({ mode: 'open' });
  const shadowDup = document.createElement('span');
  shadowDup.id = 'dup';
  shadowDup.textContent = 'shadow-scoped label';
  root.appendChild(shadowDup);

  const slot = document.createElement('slot');
  root.appendChild(slot);

  const docDup = document.createElement('span');
  docDup.id = 'dup';
  docDup.textContent = 'document-scoped label';
  document.body.appendChild(docDup);
  cleanupNodes.push(docDup);

  const inner = document.createElement('div');
  inner.setAttribute('aria-labelledby', 'dup');
  outer.appendChild(inner);

  return { outer, shadowDup, docDup, inner };
}

describe('resolveIdrefTokens — slot-owner search precedence (codex push-gate finding 1)', () => {
  it('binds to the slot-owner shadow root target when both document and shadow root contain the id', () => {
    const { shadowDup, docDup, inner } = buildSlotOwnerFixture();
    const tokens = inner.getAttribute('aria-labelledby');

    const resolved = resolveIdrefTokens(inner, tokens);

    expect(resolved.length).toBe(1);
    expect(resolved[0]).toBe(shadowDup);
    expect(resolved[0]).not.toBe(docDup);
  });

  it('falls through to the document when the slot-owner shadow root does not contain the id', () => {
    const outer = document.createElement('div');
    document.body.appendChild(outer);
    cleanupNodes.push(outer);
    outer.attachShadow({ mode: 'open' }).appendChild(document.createElement('slot'));

    const docTarget = document.createElement('span');
    docTarget.id = 'doc-only';
    docTarget.textContent = 'doc only';
    document.body.appendChild(docTarget);
    cleanupNodes.push(docTarget);

    const inner = document.createElement('div');
    inner.setAttribute('aria-labelledby', 'doc-only');
    outer.appendChild(inner);

    const resolved = resolveIdrefTokens(inner, 'doc-only');
    expect(resolved.length).toBe(1);
    expect(resolved[0]).toBe(docTarget);
  });

  it('preserves existing same-root resolution when no slot is involved', () => {
    const target = document.createElement('span');
    target.id = 'plain';
    target.textContent = 'plain';
    document.body.appendChild(target);
    cleanupNodes.push(target);

    const inner = document.createElement('div');
    inner.setAttribute('aria-labelledby', 'plain');
    document.body.appendChild(inner);
    cleanupNodes.push(inner);

    const resolved = resolveIdrefTokens(inner, 'plain');
    expect(resolved.length).toBe(1);
    expect(resolved[0]).toBe(target);
  });
});

describe('installAriaIdrefMirror — reattach on slot change (codex push-gate finding 2)', () => {
  function buildTwoOwnerFixture(): {
    ownerA: HTMLElement;
    ownerB: HTMLElement;
    rootA: ShadowRoot;
    rootB: ShadowRoot;
    inner: HTMLElement;
  } {
    const ownerA = document.createElement('div');
    const ownerB = document.createElement('div');
    document.body.appendChild(ownerA);
    document.body.appendChild(ownerB);
    cleanupNodes.push(ownerA, ownerB);

    const rootA = ownerA.attachShadow({ mode: 'open' });
    rootA.innerHTML = '<slot name="a"></slot>';

    const rootB = ownerB.attachShadow({ mode: 'open' });
    rootB.innerHTML = '<slot name="b"></slot>';

    const inner = document.createElement('div');
    inner.setAttribute('slot', 'a');
    inner.setAttribute('aria-labelledby', 'live');
    ownerA.appendChild(inner);

    return { ownerA, ownerB, rootA, rootB, inner };
  }

  it('rebinds aria-labelledby when the host is reassigned to a slot in a different shadow tree, then a target appears in the new tree', async () => {
    const { ownerA, ownerB, rootA, rootB, inner } = buildTwoOwnerFixture();

    // Seed rootA with a target so the initial resolution succeeds.
    const targetA = document.createElement('span');
    targetA.id = 'live';
    targetA.textContent = 'A';
    rootA.appendChild(targetA);

    let resolved: Element[] = [];
    let handle: AriaIdrefMirrorHandle | null = null;
    try {
      handle = installAriaIdrefMirror(inner, () => {
        resolved = resolveIdrefTokens(inner, inner.getAttribute('aria-labelledby'));
      });

      // Initial sync should bind to the rootA target.
      expect(resolved.length).toBe(1);
      expect(resolved[0]).toBe(targetA);

      // Move the inner host to ownerB by swapping ownership and slot name.
      // The slot attribute mutation is what triggers resync via the new
      // slotAttrObserver; without the fix, observers stay attached to rootA.
      inner.setAttribute('slot', 'b');
      ownerB.appendChild(inner);

      // Wait for the slot-attr MutationObserver to fire (microtask) plus a
      // task tick so resync's reattach completes before we mutate rootB.
      await new Promise((r) => setTimeout(r, 0));

      // Now insert the IDREF target into rootB. If observers properly
      // reattached to rootB, the shared root observer fires sync() and
      // `resolved` rebinds to targetB. Without the fix, sync stays bound
      // to targetA (the disconnected rootA tree).
      const targetB = document.createElement('span');
      targetB.id = 'live';
      targetB.textContent = 'B';
      rootB.appendChild(targetB);

      // Wait one more tick for the shared root observer to fan out.
      await new Promise((r) => setTimeout(r, 0));

      expect(resolved.length).toBe(1);
      expect(resolved[0]).toBe(targetB);
      // Sanity: targetA stayed in rootA but should NOT be the bound target.
      expect(resolved[0]).not.toBe(targetA);
    } finally {
      handle?.disconnect();
      // Suppress unused-var lint for the closure variable.
      void ownerA;
    }
  });
});
