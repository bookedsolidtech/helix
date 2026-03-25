/**
 * @module sheetManager
 *
 * Sheet Manager pattern for batched injection and coordinated cleanup of
 * light DOM stylesheets. Wraps the `injectLightStyles` and `lightStyleRegistry`
 * utilities to provide a class-based API suitable for framework integrations
 * and test teardown.
 *
 * @example
 * ```ts
 * import { SheetManager } from '../../utilities/sheetManager.js';
 *
 * const manager = new SheetManager();
 * manager.inject('hx-card', 'p { font-size: var(--hx-font-size-md); }');
 * manager.inject('hx-card', 'p { color: red; }'); // no-op — already injected
 *
 * // In test teardown:
 * manager.cleanupAll();
 * ```
 */

import { injectLightStyles } from './injectLightStyles.js';
import { lightStyleRegistry } from './lightStyleRegistry.js';

/**
 * Manages a set of injected light DOM stylesheets, providing inject and
 * cleanup operations. Useful for testing, server-side hydration, and
 * framework-level integration where deterministic cleanup is required.
 *
 * Each `SheetManager` instance tracks only the component names it has
 * injected during its lifetime. Multiple instances can coexist.
 */
export class SheetManager {
  /** Component names injected via this manager instance. */
  private _injected: Set<string> = new Set();

  /**
   * Injects scoped light DOM styles for the given component, if not already
   * registered in the global `lightStyleRegistry`. Records the injection in
   * this manager's instance tracking set.
   *
   * @param componentName - The component tag name (e.g. `'hx-card'`).
   * @param css - The raw CSS to scope and inject.
   */
  inject(componentName: string, css: string): void {
    injectLightStyles(componentName, css);
    this._injected.add(componentName);
  }

  /**
   * Removes the injected `<style>` element for the given component from the
   * document and clears it from both this instance and the global registry.
   * No-op if the component was never injected or `document` is unavailable.
   *
   * @param componentName - The component tag name to clean up.
   */
  cleanup(componentName: string): void {
    if (typeof document === 'undefined') return;

    const styleEl = lightStyleRegistry.get(componentName);
    if (styleEl) {
      styleEl.remove();
      lightStyleRegistry.delete(componentName);
    }
    this._injected.delete(componentName);
  }

  /**
   * Removes all stylesheets injected via this manager instance from the
   * document and clears them from the global registry.
   */
  cleanupAll(): void {
    for (const componentName of this._injected) {
      this.cleanup(componentName);
    }
  }

  /**
   * Returns the number of component stylesheets currently tracked by this
   * manager instance (injected and not yet cleaned up).
   *
   * @returns The count of tracked injected stylesheets.
   */
  getInjectedCount(): number {
    return this._injected.size;
  }
}
