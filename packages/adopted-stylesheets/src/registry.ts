/**
 * @module registry
 *
 * Internal registry tracking which CSSStyleSheet instances are adopted on each
 * DocumentOrShadowRoot, with reference counting so sheets are removed only when
 * the last consumer disconnects.
 *
 * SSR environments (where `window` is undefined) receive a no-op registry
 * — all operations silently return safe defaults.
 */

/** True when running in an SSR environment (no browser globals). */
const SSR = typeof window === 'undefined';

/**
 * Primary registry: root → (sheet → reference count).
 *
 * Uses a plain Map (not WeakMap) because DocumentOrShadowRoot is not always
 * garbage-collectible in all browser implementations, and we need to iterate
 * sheets per root. Call sites are responsible for cleanup via decrementRef.
 */
const registry: Map<DocumentOrShadowRoot, Map<CSSStyleSheet, number>> = new Map();

// ---------------------------------------------------------------------------
// Public read helpers
// ---------------------------------------------------------------------------

/**
 * Returns the current reference count for a stylesheet on a given root.
 * Returns `0` if the sheet has never been registered on that root.
 *
 * @param root - The document or shadow root to query.
 * @param sheet - The CSSStyleSheet to look up.
 */
export function getRefCount(root: DocumentOrShadowRoot, sheet: CSSStyleSheet): number {
  if (SSR) return 0;
  return registry.get(root)?.get(sheet) ?? 0;
}

/**
 * Returns a snapshot of all CSSStyleSheet instances currently tracked on a root.
 * Returns an empty array in SSR environments.
 *
 * @param root - The document or shadow root to query.
 */
export function getRootSheets(root: DocumentOrShadowRoot): CSSStyleSheet[] {
  if (SSR) return [];
  return Array.from(registry.get(root)?.keys() ?? []);
}

// ---------------------------------------------------------------------------
// Internal mutation helpers (not exported from index.ts)
// ---------------------------------------------------------------------------

/**
 * Increments the reference count for a sheet on the given root.
 * Initialises the entry if it does not exist.
 *
 * @param root - The document or shadow root.
 * @param sheet - The CSSStyleSheet to increment.
 */
export function incrementRef(root: DocumentOrShadowRoot, sheet: CSSStyleSheet): void {
  if (SSR) return;

  let sheetMap = registry.get(root);
  if (!sheetMap) {
    sheetMap = new Map<CSSStyleSheet, number>();
    registry.set(root, sheetMap);
  }

  const current = sheetMap.get(sheet) ?? 0;
  sheetMap.set(sheet, current + 1);
}

/**
 * Decrements the reference count for a sheet on the given root.
 * Cleans up the entry when the count reaches zero.
 * Returns the count **after** decrement (minimum 0).
 *
 * @param root - The document or shadow root.
 * @param sheet - The CSSStyleSheet to decrement.
 * @returns The reference count after decrement.
 */
export function decrementRef(root: DocumentOrShadowRoot, sheet: CSSStyleSheet): number {
  if (SSR) return 0;

  const sheetMap = registry.get(root);
  if (!sheetMap) return 0;

  const current = sheetMap.get(sheet) ?? 0;
  const next = Math.max(0, current - 1);

  if (next === 0) {
    sheetMap.delete(sheet);
    if (sheetMap.size === 0) {
      registry.delete(root);
    }
  } else {
    sheetMap.set(sheet, next);
  }

  return next;
}

/**
 * Clears the entire registry. Intended for use in test teardown only.
 * This does NOT remove sheets from any adoptedStyleSheets arrays.
 *
 * @internal
 */
export function clearRegistry(): void {
  registry.clear();
}
