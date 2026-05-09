/**
 * Icon library registry — public API.
 *
 * Phase 1 scaffold: signatures + documentation only. Every function throws
 * with a `Phase 2` marker so callers fail loudly and the implementation
 * roadmap stays honest.
 *
 * Wire-compatible with Shoelace's `registerIconLibrary()` so downstream
 * consumers can register custom libraries without coupling to HELiX
 * internals.
 */

import type { IconLibrary, IconLibraryOptions } from './types.js';

export type { IconLibrary, IconLibraryOptions, IconMutator, IconResolver } from './types.js';

const PHASE_2 = '@helixui/icons: registry not yet implemented (lands in Phase 2)';

/**
 * Register an icon library by name. Once registered, `<hx-icon library="<name>">`
 * resolves names through the supplied {@link IconLibraryOptions.resolver}.
 */
export function registerIconLibrary(_name: string, _options: IconLibraryOptions): void {
  throw new Error(PHASE_2);
}

/**
 * Remove a previously registered icon library. Outstanding `<hx-icon>` instances
 * pointing at the library will fall back to the default resolver.
 */
export function unregisterIconLibrary(_name: string): void {
  throw new Error(PHASE_2);
}

/**
 * Look up a registered library by name. Returns `undefined` for unknown names.
 */
export function getIconLibrary(_name: string): IconLibrary | undefined {
  throw new Error(PHASE_2);
}

/**
 * Set the global base path used by libraries that resolve to relative URLs
 * (e.g. CDN-hosted sprite sheets). Defaults to the package's published
 * `dist/` directory.
 */
export function setBasePath(_path: string): void {
  throw new Error(PHASE_2);
}

/**
 * Read the current global base path. See {@link setBasePath}.
 */
export function getBasePath(): string {
  throw new Error(PHASE_2);
}
