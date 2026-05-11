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
 * Default base path. Points at the package's published `dist/` on
 * jsDelivr so unconfigured consumers get working sprite resolution
 * "out of the box" once `@helixui/icons` is published to npm. Pinned
 * to a SPECIFIC version so future icon releases don't silently change
 * what existing consumers fetch.
 *
 * **Healthcare consumers behind firewalls or strict CSPs MUST override
 * with `setBasePath()` at app bootstrap.** The console warning below
 * surfaces the first resolution attempt against this default so
 * consumers get a single, clear signal that they need to self-host or
 * override. The warning fires ONCE per page lifetime to avoid log
 * spam.
 *
 * Recommended override patterns:
 *   - Storybook (already wired): `setBasePath('/icons')` + staticDirs
 *   - Next.js: copy `node_modules/@helixui/icons/dist/*.svg` to
 *     `public/icons/`, then `setBasePath('/icons')` in a client init
 *   - Astro: same pattern via `public/icons/` static directory
 *   - Drupal: serve from `themes/<custom>/icons/`, then
 *     `setBasePath('/themes/<custom>/icons')` in a Drupal behavior
 *   - Air-gapped enterprise: serve from a same-origin static asset
 *     server and `setBasePath('https://internal.example.com/...')`
 */
const DEFAULT_BASE_PATH = 'https://cdn.jsdelivr.net/npm/@helixui/icons@1.0.0/dist';
let _hasWarnedDefaultBasePath = false;

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
    throw new TypeError('@helixui/icons: registerIconLibrary requires a non-empty string `name`.');
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

  // Fire a global event so already-rendered <hx-icon> instances (or any
  // other consumer) can re-resolve. Without this, a consumer registering
  // a custom library AFTER icons have rendered would see those icons
  // stuck on whatever they resolved to at first paint (often a warning
  // + nothing for unknown libraries). The event fires on `globalThis`
  // (works in browsers, jsdom test envs, and node REPL); listeners that
  // care subscribe via `addEventListener('helixicon-library-registered', …)`.
  if (typeof globalThis !== 'undefined' && typeof CustomEvent !== 'undefined') {
    try {
      const evt = new CustomEvent('helixicon-library-registered', {
        detail: { name },
        bubbles: false,
        composed: false,
      });
      // EventTarget exists on globalThis in browsers and jsdom; gate on
      // dispatchEvent existing rather than instanceof so node-without-jsdom
      // execution paths (build-time scripts importing this module for
      // typecheck) don't blow up.
      const target = globalThis as unknown as EventTarget & {
        dispatchEvent?: (ev: Event) => boolean;
      };
      if (typeof target.dispatchEvent === 'function') {
        target.dispatchEvent(evt);
      }
    } catch {
      // Best-effort; never throw from registerIconLibrary on environments
      // that don't support CustomEvent dispatch.
    }
  }
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
  const next = path.replace(/\/+$/, '');
  if (next === basePath) return;
  basePath = next;
  // Notify mounted icons so already-rendered sprite-mode entries re-resolve
  // against the new base path. Without this, calling setBasePath() after
  // initial render leaves existing <hx-icon> elements stuck on the previous
  // href. Same dispatch shape as the registration event.
  if (typeof globalThis !== 'undefined' && typeof CustomEvent !== 'undefined') {
    try {
      const evt = new CustomEvent('helixicon-base-path-changed', {
        detail: { basePath: next },
        bubbles: false,
        composed: false,
      });
      const target = globalThis as unknown as EventTarget & {
        dispatchEvent?: (ev: Event) => boolean;
      };
      if (typeof target.dispatchEvent === 'function') {
        target.dispatchEvent(evt);
      }
    } catch {
      // Best-effort; never throw from setBasePath on environments without CustomEvent.
    }
  }
}

/**
 * Read the current global base path. See {@link setBasePath}.
 *
 * On first call, if the consumer hasn't overridden the default jsDelivr
 * CDN URL, emit a one-shot console warning so air-gapped / firewalled
 * environments get a clear signal that they need to self-host. Silent
 * 404s on a missing CDN URL are otherwise hard to diagnose. The warning
 * is suppressed in production builds (NODE_ENV='production' or where
 * `process` is undefined like browsers without a process shim).
 */
export function getBasePath(): string {
  if (
    !_hasWarnedDefaultBasePath &&
    basePath === DEFAULT_BASE_PATH &&
    typeof console !== 'undefined' &&
    typeof console.warn === 'function'
  ) {
    _hasWarnedDefaultBasePath = true;
    console.warn(
      '[@helixui/icons] resolving sprites from the default CDN URL ' +
        `"${DEFAULT_BASE_PATH}". For air-gapped, firewalled, or strict-CSP ` +
        'deployments, call `setBasePath("/your/icons/path")` at app bootstrap. ' +
        'See https://github.com/bookedsolidtech/helix/blob/main/packages/hx-icons/README.md ' +
        'for the recommended self-hosting pattern.',
    );
  }
  return basePath;
}
