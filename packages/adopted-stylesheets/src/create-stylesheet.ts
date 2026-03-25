/**
 * @module create-stylesheet
 *
 * Factory for creating CSSStyleSheet instances with content-hash deduplication.
 * Identical CSS strings always return the same CSSStyleSheet object, preventing
 * duplicate sheet allocations across components.
 *
 * SSR environments cannot use CSSStyleSheet. Use `createStyleSheetSSR` instead
 * for server-rendered contexts that need CSS string output.
 */

// ---------------------------------------------------------------------------
// djb2 hash — simple, fast, sufficient for dedup keys
// ---------------------------------------------------------------------------

/**
 * Produces a short base-36 hash of the given string using the djb2 algorithm.
 * Collision probability is negligible for typical CSS payloads.
 *
 * @param str - The string to hash.
 * @returns A base-36 encoded unsigned 32-bit integer string.
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // Bitwise left shift by 5 is equivalent to multiply by 32; combined with
    // addition gives multiply by 33. XOR the current char code into the hash.
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  // Convert to unsigned 32-bit integer, then to base-36 for compact keys.
  return (hash >>> 0).toString(36);
}

// ---------------------------------------------------------------------------
// Deduplication cache
// ---------------------------------------------------------------------------

/** Cache mapping content hashes to their corresponding CSSStyleSheet. */
const sheetCache = new Map<string, CSSStyleSheet>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates (or returns a cached) CSSStyleSheet for the given CSS string.
 *
 * Identical CSS content always returns the same object — safe to call from
 * multiple components without allocating duplicate sheets.
 *
 * **Not available in SSR.** Call this only in browser environments. For SSR,
 * use `createStyleSheetSSR` to obtain a raw CSS string instead.
 *
 * @param css - Raw CSS string to compile into a CSSStyleSheet.
 * @returns A CSSStyleSheet containing the provided CSS rules.
 * @throws {Error} When called in an SSR environment where `window` is undefined.
 *
 * @example
 * ```ts
 * const sheet = createStyleSheet(':root { --color-primary: #2563EB; }');
 * adoptStyles(document, sheet);
 * ```
 */
export function createStyleSheet(css: string): CSSStyleSheet {
  if (typeof window === 'undefined') {
    throw new Error(
      'createStyleSheet is not available in SSR environments. ' +
        'Use createStyleSheetSSR instead to obtain a raw CSS string.',
    );
  }

  const hash = hashString(css);
  const cached = sheetCache.get(hash);
  if (cached !== undefined) {
    return cached;
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  sheetCache.set(hash, sheet);
  return sheet;
}

/**
 * SSR-safe alternative to `createStyleSheet`.
 *
 * Returns the CSS string as-is so callers can emit a `<style>` tag during
 * server-side rendering. In browser environments this simply returns the
 * original string — callers are expected to pass it to `createStyleSheet`
 * before adopting.
 *
 * @param css - Raw CSS string.
 * @returns The same CSS string (no-op transformation).
 *
 * @example
 * ```ts
 * // SSR context:
 * const cssText = createStyleSheetSSR(':root { --color-primary: #2563EB; }');
 * return `<style>${cssText}</style>`;
 * ```
 */
export function createStyleSheetSSR(css: string): string {
  return css;
}

/**
 * Clears the internal stylesheet deduplication cache.
 *
 * Intended for use in test teardown to prevent cross-test contamination.
 * Do **not** call this in production code — it breaks the deduplication
 * invariant and can cause duplicate CSSStyleSheet allocations.
 *
 * @internal
 */
export function clearStyleSheetCache(): void {
  sheetCache.clear();
}
