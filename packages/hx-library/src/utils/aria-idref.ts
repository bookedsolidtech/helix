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
export function mergeTokenLists(
  ...lists: Array<string | null | undefined>
): string | null {
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
