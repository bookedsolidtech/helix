/**
 * @helixui/adopted-stylesheets
 *
 * Framework-agnostic adopted stylesheets registry with reference-counted
 * lifecycle management, content-hash deduplication, SSR fallback, and an
 * optional Lit ReactiveController wrapper.
 *
 * @packageDocumentation
 */

export { adoptStyles, removeStyles } from './adopt-styles.js';
export {
  createStyleSheet,
  createStyleSheetSSR,
  clearStyleSheetCache,
} from './create-stylesheet.js';
export { AdoptedStylesheetsController } from './lit-controller.js';
export { getRefCount, getRootSheets, clearRegistry } from './registry.js';
