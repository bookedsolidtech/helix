/**
 * Module-level monotonic ID counter factory.
 *
 * Provides collision-free, deterministic, SSR-safe IDs for components that
 * need stable element IDs (for ARIA relationships, label associations, etc.)
 * without relying on Math.random() which causes hydration mismatches.
 *
 * @public
 */

const counters = new Map<string, number>();

/**
 * Creates a monotonic ID generator for the given namespace.
 *
 * @param namespace - Component namespace (e.g. 'hx-text-input')
 * @returns A function that returns the next unique ID string
 * @public
 *
 * @example
 * ```ts
 * const nextId = createIdCounter('hx-text-input');
 * private _id = nextId(); // 'hx-text-input-0', 'hx-text-input-1', ...
 * ```
 */
export function createIdCounter(namespace: string): () => string {
  return () => {
    const current = counters.get(namespace) ?? 0;
    counters.set(namespace, current + 1);
    return `${namespace}-${current}`;
  };
}

/**
 * Resets the counter for the given namespace (or all namespaces if omitted).
 * Use in test `beforeEach()` for counter isolation between tests.
 *
 * @param namespace - Optional namespace to reset. If omitted, resets all counters.
 * @public
 */
export function resetIdCounter(namespace?: string): void {
  if (namespace !== undefined) {
    counters.delete(namespace);
  } else {
    counters.clear();
  }
}
