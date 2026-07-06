/**
 * @module adoptedStylesheetRegistry
 *
 * A registry that integrates with the `@helixui/adopted-stylesheets` package
 * when available, falling back to the `lightStyleRegistry` pattern for
 * environments that do not support the Constructable Stylesheets API or where
 * the adopted-stylesheets package is not installed.
 *
 * This module provides a unified `register` API so call sites do not need to
 * branch on capability detection.
 *
 * @example
 * ```ts
 * import { adoptedStylesheetRegistry } from '../../utilities/adoptedStylesheetRegistry.js';
 *
 * // Registers via adopted stylesheets when available, falls back to <style> injection.
 * adoptedStylesheetRegistry.register('hx-card', 'p { font-size: var(--hx-font-size-md); }');
 * ```
 */

import { injectLightStyles } from './injectLightStyles.js';
import { sanitizeCss } from './sanitizeCss.js';
import { generateScopedSelectors } from './generateScopedSelectors.js';

/** True when the Constructable Stylesheets API is available. */
const supportsConstructableSheets =
  typeof document !== 'undefined' &&
  typeof CSSStyleSheet !== 'undefined' &&
  typeof CSSStyleSheet.prototype.replaceSync === 'function';

/**
 * Cache mapping the final scoped CSS text to its CSSStyleSheet instance.
 * Prevents duplicate sheet creation when the same CSS is registered multiple
 * times. Keyed by the scoped output (not the raw input) so dedup is by the
 * exact bytes emitted into `document.adoptedStyleSheets`.
 */
const sheetCache = new Map<string, CSSStyleSheet>();

/**
 * Registers a stylesheet for the given component, using the most capable
 * available mechanism:
 *
 * 1. **Constructable Stylesheets** (`document.adoptedStyleSheets`) — preferred;
 *    zero-duplication via `CSSStyleSheet` identity.
 * 2. **`<style>` injection** — fallback for older browsers or SSR-hydrated pages
 *    that do not support Constructable Stylesheets. Delegates to `injectLightStyles`.
 *
 * Both paths sanitize the CSS via `sanitizeCss` and scope every selector under
 * `[data-hx-styled="componentName"]` via `generateScopedSelectors`, so the
 * emitted CSS is identical regardless of delivery mechanism and never leaks to
 * unscoped page content. If `sanitizeCss` rejects the input, nothing is emitted.
 *
 * Calling `register` multiple times with the same `componentName` and CSS is
 * safe — the implementation deduplicates on the final scoped output.
 *
 * @param componentName - The component tag name (e.g. `'hx-card'`).
 * @param css - The CSS string to register. Selectors are scoped under
 *   `[data-hx-styled="componentName"]`.
 */
function register(componentName: string, css: string): void {
  if (supportsConstructableSheets) {
    const safeCss = sanitizeCss(css, componentName);
    if (safeCss === null) return;

    const scopedCss = generateScopedSelectors(componentName, safeCss);

    let sheet = sheetCache.get(scopedCss);
    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(scopedCss);
      sheetCache.set(scopedCss, sheet);
    }

    if (!document.adoptedStyleSheets.includes(sheet)) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }
    return;
  }

  // Fallback: inject a scoped <style> element
  injectLightStyles(componentName, css);
}

/**
 * The unified registry object for light DOM stylesheet management.
 * Consumers should use this rather than calling `injectLightStyles` directly
 * when they want automatic capability detection.
 */
export const adoptedStylesheetRegistry = { register };
