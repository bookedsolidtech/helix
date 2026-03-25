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

/** True when the Constructable Stylesheets API is available. */
const supportsConstructableSheets =
  typeof document !== 'undefined' &&
  typeof CSSStyleSheet !== 'undefined' &&
  typeof CSSStyleSheet.prototype.replaceSync === 'function';

/**
 * Cache mapping CSS text to its CSSStyleSheet instance. Prevents duplicate
 * sheet creation when the same CSS is registered multiple times.
 */
const sheetCache = new Map<string, CSSStyleSheet>();

/**
 * Registers a stylesheet for the given component, using the most capable
 * available mechanism:
 *
 * 1. **Constructable Stylesheets** (`document.adoptedStyleSheets`) — preferred;
 *    zero-duplication via `CSSStyleSheet` identity.
 * 2. **`<style>` injection** — fallback for older browsers or SSR-hydrated pages
 *    that do not support Constructable Stylesheets. Delegates to `injectLightStyles`
 *    which scopes selectors via `[data-hx-styled="componentName"]`.
 *
 * Calling `register` multiple times with the same `componentName` is safe —
 * the implementation deduplicates at the sheet level.
 *
 * @param componentName - The component tag name (e.g. `'hx-card'`).
 * @param css - The CSS string to register. For fallback mode, selectors will be
 *   scoped under `[data-hx-styled="componentName"]`.
 */
function register(componentName: string, css: string): void {
  if (supportsConstructableSheets) {
    let sheet = sheetCache.get(css);
    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      sheetCache.set(css, sheet);
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
