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
      // Codex push-gate round-4 P2: shared root observer now coalesces
      // subscriber fan-out through rAF. Wait one frame so the resync lands.
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));

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
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));

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

  // CodeRabbit SHOULD-FIX (PR #1649 follow-up): when the host is reparented
  // into a NEW shadow tree whose slot has the SAME name, the host's `slot`
  // attribute does not change — so the slotAttrObserver never fires. We now
  // poll `assignedSlot` identity in the host MutationObserver / root sync
  // path so the reattach still happens.
  it('reattaches when the host moves to a different shadow tree with a same-named slot', async () => {
    const ownerA = document.createElement('div');
    const ownerB = document.createElement('div');
    document.body.appendChild(ownerA);
    document.body.appendChild(ownerB);
    cleanupNodes.push(ownerA, ownerB);

    // Both owners expose a slot with the same name "x" — so reparenting
    // the host does NOT mutate its `slot` attribute.
    const rootA = ownerA.attachShadow({ mode: 'open' });
    rootA.innerHTML = '<slot name="x"></slot>';
    const rootB = ownerB.attachShadow({ mode: 'open' });
    rootB.innerHTML = '<slot name="x"></slot>';

    const inner = document.createElement('div');
    inner.setAttribute('slot', 'x');
    inner.setAttribute('aria-labelledby', 'live');
    ownerA.appendChild(inner);

    // Seed rootA with a target so initial resolution succeeds.
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

      expect(resolved.length).toBe(1);
      expect(resolved[0]).toBe(targetA);

      // Reparent without touching the slot attribute. This triggers no
      // attribute mutation on the host — only `assignedSlot` flips.
      ownerB.appendChild(inner);

      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));

      // Insert a new target only in rootB. With the assignedSlot poll fix,
      // the next root-sync coalesces the reattach so resolved binds to targetB.
      const targetB = document.createElement('span');
      targetB.id = 'live';
      targetB.textContent = 'B';
      rootB.appendChild(targetB);

      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));

      // The new target in rootB must be reachable now. Without the fix,
      // resolved would still be bound to targetA.
      expect(resolved.length).toBeGreaterThanOrEqual(1);
      expect(resolved[0]).toBe(targetB);
    } finally {
      handle?.disconnect();
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Codex push-gate round-4 P2 — shared root observer must resync on
// label-target text mutations and visibility-affecting attribute changes.
//
// Components that flatten `aria-labelledby` to a fallback string (legacy
// engines without `ariaLabelledByElements`, plus string-mirroring callers
// like hx-menu / hx-menu-item / hx-overflow-menu / hx-split-button) must
// receive a resync when:
//   1. The referenced label's text content mutates in place
//      (`characterData`).
//   2. The referenced target is hidden/unhidden via `hidden`,
//      `aria-hidden`, `style`, or `class` — visibility affects accessible
//      name computation per accname §4.3.2.
// ─────────────────────────────────────────────────────────────

describe('installAriaIdrefMirror — observe characterData + visibility (codex push-gate round-4 P2)', () => {
  function buildLabelFixture(): { host: HTMLElement; label: HTMLElement } {
    const label = document.createElement('span');
    label.id = 'lbl';
    label.textContent = 'initial';
    document.body.appendChild(label);
    cleanupNodes.push(label);

    const host = document.createElement('div');
    host.setAttribute('aria-labelledby', 'lbl');
    document.body.appendChild(host);
    cleanupNodes.push(host);

    return { host, label };
  }

  async function flushSharedObserver(): Promise<void> {
    // Allow the MutationObserver microtask to drain, then wait for the
    // rAF-coalesced fan-out to fire.
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => requestAnimationFrame(() => r(undefined)));
  }

  it('resyncs when the referenced label text mutates in place (characterData)', async () => {
    const { host, label } = buildLabelFixture();

    let mirrored = '';
    const handle = installAriaIdrefMirror(host, () => {
      const tokens = host.getAttribute('aria-labelledby');
      const els = resolveIdrefTokens(host, tokens);
      mirrored = els.map((el) => el.textContent ?? '').join(' ');
    });

    try {
      expect(mirrored).toBe('initial');

      // Mutate the label text in place. characterData triggers must resync
      // the mirror so string-mirroring callers see the new value.
      label.textContent = 'updated';
      await flushSharedObserver();

      expect(mirrored).toBe('updated');
    } finally {
      handle.disconnect();
    }
  });

  it('resyncs when the referenced label is hidden via the `hidden` attribute', async () => {
    const { host, label } = buildLabelFixture();

    let resyncCount = 0;
    const handle = installAriaIdrefMirror(host, () => {
      resyncCount += 1;
    });

    try {
      // Initial install fires sync once synchronously.
      const baseline = resyncCount;

      label.setAttribute('hidden', '');
      await flushSharedObserver();

      expect(resyncCount).toBeGreaterThan(baseline);
    } finally {
      handle.disconnect();
    }
  });

  it('resyncs when the referenced label is hidden via aria-hidden', async () => {
    const { host, label } = buildLabelFixture();

    let resyncCount = 0;
    const handle = installAriaIdrefMirror(host, () => {
      resyncCount += 1;
    });

    try {
      const baseline = resyncCount;

      label.setAttribute('aria-hidden', 'true');
      await flushSharedObserver();

      expect(resyncCount).toBeGreaterThan(baseline);
    } finally {
      handle.disconnect();
    }
  });

  it('coalesces a burst of mutations into a single resync per frame', async () => {
    const { host, label } = buildLabelFixture();

    let resyncCount = 0;
    const handle = installAriaIdrefMirror(host, () => {
      resyncCount += 1;
    });

    try {
      // Drain initial synchronous sync.
      await flushSharedObserver();
      const baseline = resyncCount;

      // Burst of mutations within a single frame should trigger a single
      // coalesced fan-out, not one resync per mutation.
      label.textContent = 'a';
      label.setAttribute('hidden', '');
      label.removeAttribute('hidden');
      label.textContent = 'b';
      label.setAttribute('aria-hidden', 'true');
      label.removeAttribute('aria-hidden');

      await flushSharedObserver();

      // Exactly one fan-out beyond the baseline. Allow up to 2 to absorb any
      // platform-driven rAF jitter; >2 indicates coalescing is broken.
      expect(resyncCount - baseline).toBeGreaterThanOrEqual(1);
      expect(resyncCount - baseline).toBeLessThanOrEqual(2);
    } finally {
      handle.disconnect();
    }
  });
});
