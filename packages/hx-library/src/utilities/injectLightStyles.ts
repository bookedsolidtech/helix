/**
 * @module injectLightStyles
 *
 * Core utility for injecting scoped `<style>` elements into `document.head`
 * to style light DOM slotted content in HELiX components. Uses the
 * `lightStyleRegistry` to deduplicate — each component type is injected at
 * most once per page lifetime.
 *
 * This is the primary mechanism for ensuring Drupal-slotted content inherits
 * proper typography and spacing when rendered into HELiX components.
 *
 * @example
 * ```ts
 * import { injectLightStyles } from '../../utilities/injectLightStyles.js';
 *
 * // In connectedCallback:
 * injectLightStyles('hx-card', 'p { font-size: var(--hx-font-size-md); }');
 * ```
 */

import { isStyleRegistered, registerStyle } from './lightStyleRegistry.js';
import { generateScopedSelectors } from './generateScopedSelectors.js';

/**
 * Injects a scoped `<style>` element into `document.head` for light DOM content
 * belonging to `componentName`. The CSS is automatically scoped via
 * `generateScopedSelectors` so styles only apply inside
 * `[data-hx-styled="componentName"]` wrappers.
 *
 * Safe to call multiple times — subsequent calls for the same `componentName`
 * are no-ops (deduplication via `lightStyleRegistry`).
 *
 * No-op in SSR environments where `document` is not defined.
 *
 * @param componentName - The component tag name used as the scope identifier
 *   (e.g. `'hx-card'`). Must be unique per component type.
 * @param css - The raw CSS to scope and inject. Selectors will be prefixed with
 *   `[data-hx-styled="componentName"]`.
 */
export function injectLightStyles(componentName: string, css: string): void {
  if (typeof document === 'undefined') return;

  if (isStyleRegistered(componentName)) return;

  const scopedCss = generateScopedSelectors(componentName, css);

  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-hx-light-styles', componentName);
  styleEl.textContent = scopedCss;

  document.head.appendChild(styleEl);
  registerStyle(componentName, styleEl);
}
