/**
 * @module adopt-styles
 *
 * Core functions for adopting and removing CSSStyleSheet instances on a
 * DocumentOrShadowRoot, with reference-counted lifecycle management.
 *
 * A sheet is appended to `adoptedStyleSheets` on the first adoption and
 * removed only when its reference count drops to zero (i.e. every caller
 * that adopted the sheet has also removed it).
 *
 * SSR environments (where `window` is undefined) receive silent no-ops —
 * no errors are thrown, and no state is mutated.
 */

import { incrementRef, decrementRef } from './registry.js';

/** True when running in an SSR environment (no browser globals). */
const SSR = typeof window === 'undefined';

// ---------------------------------------------------------------------------
// Core adoption functions
// ---------------------------------------------------------------------------

/**
 * Adopts one or more CSSStyleSheet instances on the given root, incrementing
 * the reference count for each. A sheet is appended to `adoptedStyleSheets`
 * only if it is not already present.
 *
 * Safe to call multiple times with the same sheet — the reference count
 * tracks all callers independently. Use `removeStyles` to decrement.
 *
 * No-op in SSR environments.
 *
 * @param root - The `Document` or `ShadowRoot` to adopt stylesheets on.
 * @param sheets - One or more CSSStyleSheet instances to adopt.
 *
 * @example
 * ```ts
 * const sheet = createStyleSheet(':root { --color-primary: #2563EB; }');
 * adoptStyles(document, sheet);
 * adoptStyles(shadowRoot, sheet);
 * ```
 */
export function adoptStyles(root: DocumentOrShadowRoot, ...sheets: CSSStyleSheet[]): void {
  if (SSR) return;

  for (const sheet of sheets) {
    incrementRef(root, sheet);

    if (!root.adoptedStyleSheets.includes(sheet)) {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    }
  }
}

/**
 * Removes one or more CSSStyleSheet instances from the given root, decrementing
 * the reference count for each. A sheet is removed from `adoptedStyleSheets`
 * only when its reference count reaches zero.
 *
 * Calling `removeStyles` more times than `adoptStyles` is safe — the count
 * floors at zero and the sheet is removed if still present.
 *
 * No-op in SSR environments.
 *
 * @param root - The `Document` or `ShadowRoot` to remove stylesheets from.
 * @param sheets - One or more CSSStyleSheet instances to remove.
 *
 * @example
 * ```ts
 * // Adopts twice → count = 2
 * adoptStyles(document, sheet);
 * adoptStyles(document, sheet);
 *
 * // Remove once → count = 1, sheet stays
 * removeStyles(document, sheet);
 *
 * // Remove again → count = 0, sheet removed from adoptedStyleSheets
 * removeStyles(document, sheet);
 * ```
 */
export function removeStyles(root: DocumentOrShadowRoot, ...sheets: CSSStyleSheet[]): void {
  if (SSR) return;

  for (const sheet of sheets) {
    const remaining = decrementRef(root, sheet);

    if (remaining === 0) {
      root.adoptedStyleSheets = root.adoptedStyleSheets.filter((s) => s !== sheet);
    }
  }
}
