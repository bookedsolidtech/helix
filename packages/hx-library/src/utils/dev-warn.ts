/**
 * Development-only warning utility for HELiX components.
 *
 * Uses Vite's `import.meta.env.DEV` flag which is statically replaced at
 * build time. In production builds Vite sets this to `false`, so the branch
 * is dead code that tree-shaking eliminates entirely. In development and test
 * environments the flag is `true`, so warnings surface in the browser console.
 *
 * Usage:
 * ```ts
 * import { devWarn } from '../../utils/dev-warn.js';
 * devWarn('hx-button', 'The `foo` attribute is deprecated. Use `bar` instead.');
 * ```
 *
 * @param component - The component tag name used as the log prefix (e.g. `'hx-button'`).
 * @param message   - Human-readable warning message for the developer.
 */
export function devWarn(component: string, message: string): void {
  if (import.meta.env.DEV === true) {
    console.warn(`[${component}] ${message}`);
  }
}

/**
 * Development-only error utility for HELiX components.
 *
 * Identical tree-shaking semantics to {@link devWarn}, but emits at
 * `console.error` severity for defects a developer must not ship — without
 * throwing. Throwing from a custom-element lifecycle callback (e.g.
 * `connectedCallback`) is reported by the browser as an *uncaught* exception
 * rather than propagating to the insertion site, and aborts the rest of the
 * callback; `devError` surfaces the failure loudly while leaving the element
 * in a stable state.
 *
 * @param component - The component tag name used as the log prefix (e.g. `'hx-phi-field'`).
 * @param message   - Human-readable error message for the developer.
 */
export function devError(component: string, message: string): void {
  if (import.meta.env.DEV === true) {
    console.error(`[${component}] ${message}`);
  }
}
