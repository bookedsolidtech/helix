/**
 * @helixui/icons — public entry point.
 *
 * Phase 1 scaffold: re-exports the registry stub and shared types so the
 * module graph is established. Library content (`./helix`, `./fa-free`)
 * lands in Phase 3.
 */

export {
  registerIconLibrary,
  unregisterIconLibrary,
  getIconLibrary,
  setBasePath,
  getBasePath,
} from './registry.js';

export type {
  IconLibrary,
  IconLibraryOptions,
  IconMutator,
  IconResolver,
} from './types.js';
