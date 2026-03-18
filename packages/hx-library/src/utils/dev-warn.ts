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
  if (import.meta.env?.DEV !== false) {
    console.warn(`[${component}] ${message}`);
  }
}
