/**
 * Icon library registry — public API.
 *
 * Wire-compatible with Shoelace's `registerIconLibrary()` so downstream
 * consumers can register custom libraries without coupling to HELiX
 * internals.
 *
 * This module is intentionally pure: no auto-registration, no I/O, no
 * console output. It owns module-level state (the library map and base
 * path) and exposes a small CRUD-style surface. Auto-registration of
 * the curated `helix` and `fa-free` libraries lives in
 * `src/libraries/*.ts` and is wired through `src/index.ts`.
 */

import type { IconLibrary, IconLibraryOptions } from './types.js';

export type {
  IconLibrary,
  IconLibraryOptions,
  IconMutator,
  IconPaintMode,
  IconResolver,
} from './types.js';

/**
 * Default base path. Points at the package's own published `dist/`
 * directory on jsDelivr — the location the bundled sprite sheets land
 * at in Phase 3.
 */
const DEFAULT_BASE_PATH = 'https://cdn.jsdelivr.net/npm/@helixui/icons@1.0.0/dist';

/** Module-level singleton map of registered libraries. */
const libraries = new Map<string, IconLibrary>();

/** Module-level singleton base path used for relative resolver URLs. */
let basePath: string = DEFAULT_BASE_PATH;

/**
 * Register an icon library by name. Once registered, `<hx-icon library="<name>">`
 * resolves names through the supplied {@link IconLibraryOptions.resolver}.
 *
 * Registering an already-known name silently overwrites the previous
 * entry — this matches Shoelace's behavior and lets consumers swap
 * implementations (e.g. FA Free for FA Pro) without an extra
 * `unregisterIconLibrary` call.
 *
 * @throws {TypeError} if `name` is empty or whitespace-only.
 * @throws {TypeError} if `options.resolver` is not a function.
 */
export function registerIconLibrary(name: string, options: IconLibraryOptions): void {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new TypeError(
      '@helixui/icons: registerIconLibrary requires a non-empty string `name`.',
    );
  }
  if (!options || typeof options.resolver !== 'function') {
    throw new TypeError(
      '@helixui/icons: registerIconLibrary requires `options.resolver` to be a function.',
    );
  }

  const entry: IconLibrary = {
    name,
    resolver: options.resolver,
    spriteSheet: options.spriteSheet ?? false,
    paintMode: options.paintMode ?? 'fill',
  };
  if (options.mutator !== undefined) {
    entry.mutator = options.mutator;
  }
  libraries.set(name, entry);
}

/**
 * Remove a previously registered icon library. No-op if the name is
 * unknown — never throws.
 */
export function unregisterIconLibrary(name: string): void {
  libraries.delete(name);
}

/**
 * Look up a registered library by name. Returns `undefined` for unknown
 * names; callers (notably `<hx-icon>`) decide how to handle absence.
 */
export function getIconLibrary(name: string): IconLibrary | undefined {
  return libraries.get(name);
}

/**
 * Set the global base path used by libraries that resolve to relative
 * URLs (e.g. CDN-hosted sprite sheets). Defaults to the package's
 * published `dist/` directory on jsDelivr.
 *
 * Trailing slashes are stripped so that `${basePath}/foo.svg` always
 * works regardless of whether the consumer passed `'/icons'` or
 * `'/icons/'`. An empty string is permitted (consumers self-hosting
 * from page root).
 */
export function setBasePath(path: string): void {
  basePath = path.replace(/\/+$/, '');
}

/**
 * Read the current global base path. See {@link setBasePath}.
 */
export function getBasePath(): string {
  return basePath;
}
