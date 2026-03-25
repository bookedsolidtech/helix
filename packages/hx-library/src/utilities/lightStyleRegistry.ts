/**
 * @module lightStyleRegistry
 *
 * A Map-based registry that tracks which component stylesheets have been
 * injected into the document's light DOM. Used by injectLightStyles to
 * deduplicate style injection — each component type is injected at most once
 * per page load.
 *
 * @example
 * ```ts
 * import { isStyleRegistered, registerStyle } from './lightStyleRegistry.js';
 *
 * if (!isStyleRegistered('hx-card')) {
 *   const el = document.createElement('style');
 *   el.textContent = css;
 *   document.head.appendChild(el);
 *   registerStyle('hx-card', el);
 * }
 * ```
 */

/**
 * Primary registry mapping component names to their injected HTMLStyleElement.
 * Keyed by component tag name (e.g. `'hx-card'`).
 */
export const lightStyleRegistry: Map<string, HTMLStyleElement> = new Map();

/**
 * Returns true if a stylesheet for the given component has already been
 * injected into the document.
 *
 * @param componentName - The component tag name (e.g. `'hx-card'`).
 */
export function isStyleRegistered(componentName: string): boolean {
  return lightStyleRegistry.has(componentName);
}

/**
 * Records a stylesheet element in the registry for the given component.
 * Called after the element has been appended to the document.
 *
 * @param componentName - The component tag name (e.g. `'hx-card'`).
 * @param el - The HTMLStyleElement that was injected.
 */
export function registerStyle(componentName: string, el: HTMLStyleElement): void {
  lightStyleRegistry.set(componentName, el);
}
