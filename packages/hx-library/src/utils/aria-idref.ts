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
 * `getRootNode() === document` AND `assignedSlot !== null`, so the loop
 * picks up document first, then crosses into the slot owner's shadow root
 * via `assignedSlot`. From inside any shadow root we follow `root.host`
 * outward AND, on every hop, check whether that host is itself slotted into
 * yet another shadow tree. De-duplication is by reference identity.
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

  // Worklist of nodes whose composed-tree ancestry still needs to be walked.
  // Each entry represents an entry point into a tree we haven't fully
  // explored yet (the original host, plus any hosts we discover via the
  // assignedSlot branch from inside a shadow ancestor).
  const queue: Element[] = [start];
  const queued = new Set<Element>([start]);

  while (queue.length > 0) {
    const startNode = queue.shift() as Element;
    let currentNode: Element = startNode;
    let currentRoot: Node | null = currentNode.getRootNode();

    // First, if currentNode is in document scope but is slotted into a
    // shadow root somewhere, queue the slot for separate exploration
    // (its tree may contain IDREF targets we need to see).
    const slotFromStart = (currentNode as HTMLElement).assignedSlot ?? null;
    if (slotFromStart && !queued.has(slotFromStart)) {
      queued.add(slotFromStart);
      queue.push(slotFromStart);
    }

    while (currentRoot instanceof ShadowRoot) {
      pushRoot(currentRoot);
      const shadowHost: Element | null = currentRoot.host ?? null;
      if (!shadowHost) break;
      // The shadow host itself may be slotted into yet another component.
      // Queue that branch so its tree is searched too.
      const hostSlot = (shadowHost as HTMLElement).assignedSlot ?? null;
      if (hostSlot && !queued.has(hostSlot)) {
        queued.add(hostSlot);
        queue.push(hostSlot);
      }
      currentNode = shadowHost;
      currentRoot = shadowHost.getRootNode();
    }

    if (currentRoot instanceof Document) {
      pushRoot(currentRoot);
    }
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
    const observer = new MutationObserver(() => {
      // Snapshot subscribers before invocation: a sync() callback may itself
      // resubscribe (e.g. component reattach), and Set iteration over a live
      // collection during mutation is undefined.
      Array.from(subscribers).forEach((fn) => {
        fn();
      });
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id'],
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
      for (const unsub of rootSubscriptions.values()) {
        unsub();
      }
      rootSubscriptions.clear();
    },
  };
}
