/**
 * Shared utilities for resolving `aria-labelledby` and `aria-describedby`
 * IDREF token lists across the Shadow DOM boundary.
 *
 * Selection-control components (`hx-checkbox`, `hx-radio-group`, `hx-switch`,
 * etc.) elevate their semantic surface to the host via `ElementInternals` so
 * that consumer-supplied `aria-labelledby` / `aria-describedby` on the host
 * resolves to light-DOM elements rather than being trapped on inner shadow
 * nodes.
 *
 * Modern Chromium 134+ and Safari 17.4+ expose the IDL element-references API
 * (`internals.ariaLabelledByElements`, `internals.ariaDescribedByElements`).
 * For those engines we resolve token IDs against the host's root node (a
 * Document or ShadowRoot) and assign the resulting elements directly.
 *
 * Older engines fall back to the host-attribute path: the ARIA delegation
 * mixin keeps the original token list in `data-aria-labelledby`/
 * `data-aria-describedby`, which assistive technology cannot follow into the
 * shadow root, but that is the same surface area as the pre-fix code and is
 * not a regression.
 *
 * Component authors do NOT need to wire this directly — see
 * `installAriaIdrefMirror()` for an installable observer that keeps an inner
 * node's `aria-*` attributes in sync with the token list across mutations.
 */

/**
 * Resolves a whitespace-separated IDREF token list to live element references.
 *
 * Searches the host's containing root first (Document or ShadowRoot), then
 * walks up through enclosing shadow hosts, and finally falls back to the
 * top-level Document. Codex round-15 P1: hx-* controls embedded inside an
 * outer component's shadow tree often legitimately reference labels/descriptions
 * declared in the outer document or in an ancestor shadow tree. Restricting
 * resolution to a single root left those controls anonymous on the
 * `ariaLabelledByElements` / `ariaDescribedByElements` path. The IDL
 * element-references API accepts any element regardless of root, so widening
 * the search closes that gap.
 *
 * Codex round-16 P1: when the host is **slotted into** another component
 * (light-DOM child of a shadow-root-bearing element), `host.getRootNode()`
 * is still the document, so IDREF targets declared in the slot owner's
 * shadow root are unreachable through the ancestor-shadow-host chain. We
 * additionally walk `host.assignedSlot.getRootNode()` — that resolves to
 * the slot owner's shadow root — and continue up that root's host chain so
 * cross-shadow IDREF resolution works for the composed-tree slotting
 * pattern. The walk is recursive: a slot owner that is itself slotted into
 * another shadow tree contributes its own ancestor chain too.
 *
 * Tokens that fail to resolve at every level are silently dropped — matching
 * native attribute-string platform behaviour where unresolved tokens are
 * ignored.
 */
export function resolveIdrefTokens(host: Element, tokens: string | null): Element[] {
  if (!tokens) return [];
  const ids = tokens.split(/\s+/).filter(Boolean);
  if (ids.length === 0) return [];

  // Build the ordered list of roots to search: host's own root first
  // (closest scope), then walking outward through enclosing shadow hosts,
  // then the top-level Document. Each id resolves at the first root that
  // owns it, mirroring how shadow-encapsulation-aware AT walks the tree.
  const roots: Array<Document | ShadowRoot> = [];
  collectIdrefSearchRoots(host, roots);
  // If host is detached or in an unusual root, also try the top-level
  // ownerDocument as a defensive last resort.
  const ownerDoc = host.ownerDocument;
  if (ownerDoc && !roots.includes(ownerDoc)) {
    roots.push(ownerDoc);
  }

  const out: Element[] = [];
  for (const id of ids) {
    for (const root of roots) {
      const el = root.getElementById(id);
      if (el) {
        out.push(el);
        break;
      }
    }
  }
  return out;
}

/**
 * Walks the composed-tree ancestry of `start` and pushes every Document or
 * ShadowRoot that could legitimately own an IDREF target into `roots` in the
 * order they should be searched (closest scope first). The walk crosses two
 * kinds of boundary:
 *
 *   1. A node sitting inside a ShadowRoot escapes via `root.host`.
 *   2. A node assigned to a `<slot>` in another shadow tree escapes via
 *      `node.assignedSlot` — the slot lives in the slot-owner's shadow root,
 *      so we hop into that root and keep climbing from there.
 *
 * Both pathways are followed because either may apply at any level. A
 * light-DOM custom element slotted into a shadow component has
 * `getRootNode() === document` AND `assignedSlot !== null`. Codex push-gate
 * round-1 finding 1: the slot-owner shadow root MUST be searched BEFORE the
 * document fallback. Element ids are unique per-tree, not globally, so the
 * same id may legally exist in BOTH the document and a slot-owner shadow
 * root. If the document is searched first, the resolver binds to the wrong
 * element and the slotted control gets the wrong accessible name. The
 * solution is to walk the slot chain (assignedSlot → slot-owner shadow root
 * → its host's chain) before falling through to the owner document.
 *
 * The slot-walk is transitive: a slot owner that is itself slotted into
 * another shadow tree contributes its own slot chain too, all of which is
 * searched ahead of the document. From inside any shadow root we follow
 * `root.host` outward AND, on every hop, check whether that host is itself
 * slotted into yet another shadow tree. De-duplication is by reference
 * identity.
 *
 * @internal
 */
function collectIdrefSearchRoots(start: Element, roots: Array<Document | ShadowRoot>): void {
  const visited = new Set<Document | ShadowRoot>();

  const pushRoot = (root: Document | ShadowRoot): void => {
    if (visited.has(root)) return;
    visited.add(root);
    roots.push(root);
  };

  // Walk a single ancestor chain starting from `entry`, pushing every
  // ShadowRoot encountered (closest first) and queuing any slot-owner
  // shadow roots we cross via assignedSlot for separate exploration. The
  // owner document encountered at the end of a chain is NOT pushed here —
  // the caller controls when to fall through to the document so the
  // slot-owner trees can be searched first (codex push-gate round-1 #1).
  const visitedEntries = new Set<Element>([start]);
  const slotEntries: Element[] = [];
  let documentSeen = false;

  const walkChain = (entry: Element): void => {
    let currentNode: Element = entry;
    let currentRoot: Node | null = currentNode.getRootNode();

    // If the entry is itself in document scope and is slotted into a
    // shadow tree, queue the slot for slot-owner-first exploration.
    const slotFromEntry = (currentNode as HTMLElement).assignedSlot ?? null;
    if (slotFromEntry && !visitedEntries.has(slotFromEntry)) {
      visitedEntries.add(slotFromEntry);
      slotEntries.push(slotFromEntry);
    }

    while (currentRoot instanceof ShadowRoot) {
      pushRoot(currentRoot);
      const shadowHost: Element | null = currentRoot.host ?? null;
      if (!shadowHost) break;
      // The shadow host itself may be slotted into yet another component.
      // Queue that branch for slot-owner-first exploration.
      const hostSlot = (shadowHost as HTMLElement).assignedSlot ?? null;
      if (hostSlot && !visitedEntries.has(hostSlot)) {
        visitedEntries.add(hostSlot);
        slotEntries.push(hostSlot);
      }
      currentNode = shadowHost;
      currentRoot = shadowHost.getRootNode();
    }

    if (currentRoot instanceof Document) {
      // Defer the document push: slot-owner shadow roots queued during
      // this walk must be searched BEFORE the document so duplicate ids
      // resolve in the correct (slot-owner) scope first.
      documentSeen = true;
    }
  };

  walkChain(start);
  // Drain the slot-entry queue. Each slot entry contributes its own
  // ancestor chain, whose shadow roots are pushed ahead of the owner
  // document. Slot entries are processed in discovery order (FIFO) so
  // closer slot owners are searched before more distant ones.
  while (slotEntries.length > 0) {
    walkChain(slotEntries.shift() as Element);
  }

  if (documentSeen) {
    const ownerDoc = start.ownerDocument;
    if (ownerDoc) pushRoot(ownerDoc);
  }
}

/**
 * True when the runtime exposes the IDL element-references API on
 * `ElementInternals`. Older Firefox / Safari builds return `undefined`
 * for these accessors.
 */
export function supportsIdrefElementReferences(internals: ElementInternals): boolean {
  return (
    'ariaLabelledByElements' in internals &&
    'ariaDescribedByElements' in internals &&
    typeof (internals as ElementInternals & { ariaLabelledByElements?: unknown })
      .ariaLabelledByElements !== 'undefined'
  );
}

/**
 * Mirror snapshot describing what should be applied to inner ARIA-bearing
 * shadow nodes. Components consume this to project the correct attributes
 * onto whichever inner element owns the announced semantic role.
 */
export interface AriaIdrefSnapshot {
  /** Computed `aria-labelledby` token list, or `null` to omit. */
  labelledBy: string | null;
  /** Computed `aria-describedby` token list, or `null` to omit. */
  describedBy: string | null;
}

/**
 * Merges two whitespace-separated token lists, preserving order and removing
 * duplicates. `null`/empty inputs are skipped. Returns `null` when the merged
 * list is empty.
 */
export function mergeTokenLists(...lists: Array<string | null | undefined>): string | null {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    if (!list) continue;
    for (const token of list.split(/\s+/)) {
      if (token && !seen.has(token)) {
        seen.add(token);
        out.push(token);
      }
    }
  }
  return out.length > 0 ? out.join(' ') : null;
}

/**
 * Options accepted by `installAriaIdrefMirror()`.
 */
export interface AriaIdrefMirrorOptions {
  /**
   * Attribute names on the host whose mutations should trigger a resync.
   * Defaults to `['aria-labelledby', 'aria-describedby', 'aria-label']` plus
   * the `data-aria-*` mirrors used by `mixinDelegatesAria`.
   */
  observedAttributes?: string[];
  /**
   * Whether to observe the resolved root for `id` attribute and `childList`
   * mutations so that late-inserted IDREF targets and id renames trigger a
   * resync. Defaults to `true`.
   */
  observeRoot?: boolean;
}

/**
 * Handle returned by `installAriaIdrefMirror()`. Call `disconnect()` from
 * `disconnectedCallback()` to tear the observers down. `resync()` forces an
 * immediate sync — useful from `connectedCallback()` after the host has been
 * re-attached to a new root.
 */
export interface AriaIdrefMirrorHandle {
  /** Force an immediate sync. */
  resync(): void;
  /** Tear down all observers and listeners. */
  disconnect(): void;
}

/**
 * Default attribute set observed on the host for ARIA / data-aria mirroring.
 */
const DEFAULT_HOST_OBSERVED_ATTRS: readonly string[] = [
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'data-aria-label',
  'data-aria-labelledby',
  'data-aria-describedby',
];

/**
 * Per-root shared observer registry. Codex round-7 finding #11 (perf).
 *
 * Round-1 created a `subtree: true` MutationObserver per host instance, so a
 * page with N IDREF-aware controls would receive N×M sync callbacks for any
 * unrelated childList/id mutation in the document. This registry collapses
 * the cost: a single observer per Document/ShadowRoot fans mutations out to
 * the registered subscribers (the per-host `sync` callbacks) only.
 *
 * The registry uses a `WeakMap` keyed by root so subscribers are garbage
 * collected with their roots. Subscribers are stored in a `Set` keyed by the
 * `sync` callback identity so re-installation is idempotent.
 *
 * @internal
 */
interface SharedRootObserverEntry {
  observer: MutationObserver;
  subscribers: Set<() => void>;
}

const sharedRootObservers: WeakMap<Document | ShadowRoot, SharedRootObserverEntry> = new WeakMap();

function subscribeToRoot(root: Document | ShadowRoot, sync: () => void): () => void {
  let entry = sharedRootObservers.get(root);
  if (!entry) {
    const subscribers = new Set<() => void>();
    // Codex push-gate round-4 P2: components that flatten `aria-labelledby`
    // to a fallback string (legacy engines without `ariaLabelledByElements`,
    // and string-mirroring callers like hx-menu / hx-menu-item /
    // hx-overflow-menu / hx-split-button) must resync when:
    //   - the referenced label's text content mutates in place
    //     (`characterData`)
    //   - the referenced target is hidden / unhidden via attributes
    //     (`hidden`, `aria-hidden`, `style`, `class` — visibility affects
    //     accessible-name computation per accname §4.3.2)
    // Without these triggers the mirrored `aria-label` stays stale.
    //
    // Widening the observer surface produces noisier callbacks, so the
    // shared subscriber fan-out is coalesced through a single
    // `requestAnimationFrame` (with a setTimeout fallback for environments
    // where rAF is unavailable, e.g. test-stubbed roots). Subscribers see
    // at most one resync per frame regardless of mutation density.
    let pendingFrame = 0;
    const flush = (): void => {
      pendingFrame = 0;
      // Snapshot subscribers before invocation: a sync() callback may itself
      // resubscribe (e.g. component reattach), and Set iteration over a live
      // collection during mutation is undefined.
      Array.from(subscribers).forEach((fn) => {
        fn();
      });
    };
    const scheduleFlush = (): void => {
      if (pendingFrame !== 0) return;
      const raf =
        typeof globalThis.requestAnimationFrame === 'function'
          ? globalThis.requestAnimationFrame
          : (cb: FrameRequestCallback) => globalThis.setTimeout(() => cb(performance.now()), 0);
      pendingFrame = raf(flush) as unknown as number;
    };
    const observer = new MutationObserver(() => {
      scheduleFlush();
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id', 'hidden', 'aria-hidden', 'style', 'class'],
      characterData: true,
    });
    entry = { observer, subscribers };
    sharedRootObservers.set(root, entry);
  }
  entry.subscribers.add(sync);

  return () => {
    const current = sharedRootObservers.get(root);
    if (!current) return;
    current.subscribers.delete(sync);
    if (current.subscribers.size === 0) {
      current.observer.disconnect();
      sharedRootObservers.delete(root);
    }
  };
}

/**
 * Installs a `MutationObserver` pair that keeps host ARIA semantics in sync
 * with mutations to consumer-supplied attributes AND late-target / id
 * mutations in the host's resolved root.
 *
 * The `sync` callback is invoked on:
 *   1. Initial install (synchronously)
 *   2. Any change to one of the observed host attributes
 *   3. Any `id` attribute mutation, child insertion, or child removal in the
 *      resolved root (Document or ShadowRoot containing the host)
 *
 * Components should call this from `connectedCallback()` and call
 * `handle.disconnect()` from `disconnectedCallback()`. The handle's
 * `resync()` method is safe to call from any lifecycle hook.
 *
 * Costs are bounded: the host observer touches one element; the root
 * observer is shared per `Document`/`ShadowRoot` (codex round-7 #11) so every
 * subscribing host pays a single attach cost regardless of how many other
 * IDREF-aware controls share the root.
 */
export function installAriaIdrefMirror(
  host: Element,
  sync: () => void,
  options: AriaIdrefMirrorOptions = {},
): AriaIdrefMirrorHandle {
  const observedAttributes = options.observedAttributes ?? DEFAULT_HOST_OBSERVED_ATTRS;
  const observeRoot = options.observeRoot ?? true;

  // Observe consumer mutations to the host's ARIA / data-aria attributes.
  // We do NOT use `observedAttributes`/`attributeChangedCallback` here because
  // that requires class-level wiring that conflicts with downstream mixins
  // (e.g. `mixinDelegatesAria` already commandeers `attributeChangedCallback`
  // for the same attributes). A scoped `MutationObserver` is reentry-safe.
  const hostObserver = new MutationObserver(() => sync());
  hostObserver.observe(host, {
    attributes: true,
    attributeFilter: [...observedAttributes],
  });

  // Codex push-gate round-1 finding 2: when the host's `slot` attribute
  // changes, the host may have just been re-assigned into a different slot
  // owner's shadow tree — and therefore the set of reachable IDREF roots
  // has changed. The shared root observer's callback runs `sync()` (not
  // `resync()`), so observers stay attached to the OLD roots; later id /
  // childList mutations in the NEW slot owner shadow tree never fire
  // resync. A separate observer scoped to the host's `slot` attribute
  // triggers a full reattach via `resync()`.
  const slotAttrObserver = new MutationObserver(() => {
    // Reattach observers to the new reachable-roots set, then sync.
    attachRootObservers();
    sync();
  });
  slotAttrObserver.observe(host, {
    attributes: true,
    attributeFilter: ['slot'],
  });

  // Subscribe to the shared per-root observer so late-inserted targets and id
  // renames re-resolve through the IDREF path. Round-7 #11 collapses N
  // per-instance subtree observers into one per root, so on pages with many
  // controls a single mutation produces a single subscriber fan-out instead
  // of `controls × mutations` observer callbacks.
  //
  // Codex round-16 P1: subscribe to every root the resolver can match — the
  // host's own root, every enclosing shadow root, and the owner document.
  // Without this, dynamic IDREF targets in ancestor scopes (legitimate per
  // the round-15 widened resolver) bind correctly on first render but never
  // resync when the outer document mutates. We track active subscriptions
  // by root and incrementally diff on `attachRootObservers()` so resync
  // calls don't churn observers when nothing has changed.
  const rootSubscriptions = new Map<Document | ShadowRoot, () => void>();

  const computeRootsToObserve = (): Array<Document | ShadowRoot> => {
    const roots: Array<Document | ShadowRoot> = [];
    // Use the same composed-tree walk as `resolveIdrefTokens` so the
    // observer subscribes to every root the resolver can match — including
    // slot-owner shadow roots when the host is light-DOM-slotted into
    // another component (codex round-17 P1). Without this, a late id
    // mutation inside the slot owner's shadow tree never fires resync.
    collectIdrefSearchRoots(host, roots);
    const ownerDoc = host.ownerDocument;
    if (ownerDoc && !roots.includes(ownerDoc)) {
      roots.push(ownerDoc);
    }
    return roots;
  };

  const attachRootObservers = (): void => {
    if (!observeRoot) return;
    const wanted = computeRootsToObserve();
    const wantedSet = new Set(wanted);
    // Remove subscriptions for roots no longer in scope (e.g. when the host
    // is moved between trees and the old ancestor chain no longer applies).
    for (const [root, unsub] of rootSubscriptions) {
      if (!wantedSet.has(root)) {
        unsub();
        rootSubscriptions.delete(root);
      }
    }
    // Add subscriptions for new roots (host's root + ancestor shadow roots
    // + owner document) that the resolver can now match against.
    for (const root of wanted) {
      if (!rootSubscriptions.has(root)) {
        rootSubscriptions.set(root, subscribeToRoot(root, sync));
      }
    }
  };

  attachRootObservers();
  // Initial sync — caller's `sync` reads the current attribute snapshot.
  sync();

  return {
    resync(): void {
      attachRootObservers();
      sync();
    },
    disconnect(): void {
      hostObserver.disconnect();
      slotAttrObserver.disconnect();
      for (const unsub of rootSubscriptions.values()) {
        unsub();
      }
      rootSubscriptions.clear();
    },
  };
}
