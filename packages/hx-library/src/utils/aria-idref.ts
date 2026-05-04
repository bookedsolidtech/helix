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
 * Resolves a whitespace-separated IDREF token list to live element references
 * by querying the host's root node (Document or ShadowRoot).
 *
 * Tokens that fail to resolve are silently dropped — this matches native
 * platform behaviour for `aria-labelledby` and `aria-describedby`.
 */
export function resolveIdrefTokens(host: Element, tokens: string | null): Element[] {
  if (!tokens) return [];
  const root = host.getRootNode();
  if (!(root instanceof Document) && !(root instanceof ShadowRoot)) {
    return [];
  }
  const ids = tokens.split(/\s+/).filter(Boolean);
  const out: Element[] = [];
  for (const id of ids) {
    const el = root.getElementById(id);
    if (el) out.push(el);
  }
  return out;
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
 * observer is `subtree: true` but only listens for `id` and `childList`
 * mutations which fire infrequently in practice.
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

  // Observe the host's resolved root so late-inserted targets and id renames
  // re-resolve through the IDREF path. Re-attached on every resync since the
  // host's root can change across DOM moves.
  let rootObserver: MutationObserver | null = null;
  let observedRoot: Document | ShadowRoot | null = null;

  const attachRootObserver = (): void => {
    if (!observeRoot) return;
    const root = host.getRootNode();
    if (!(root instanceof Document) && !(root instanceof ShadowRoot)) {
      return;
    }
    if (root === observedRoot) return;
    rootObserver?.disconnect();
    rootObserver = new MutationObserver(() => sync());
    rootObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id'],
    });
    observedRoot = root;
  };

  attachRootObserver();
  // Initial sync — caller's `sync` reads the current attribute snapshot.
  sync();

  return {
    resync(): void {
      attachRootObserver();
      sync();
    },
    disconnect(): void {
      hostObserver.disconnect();
      rootObserver?.disconnect();
      rootObserver = null;
      observedRoot = null;
    },
  };
}
