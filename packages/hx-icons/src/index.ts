/**
 * @helixui/icons — public entry point.
 *
 * Importing this module triggers auto-registration of the bundled `helix`
 * and `fa-free` libraries. After import, both are queryable via
 * `getIconLibrary()` and resolvable through `<hx-icon>` (Phase 4).
 *
 * Order is intentional: `helix` first (default-suggested library),
 * `fa-free` second. Side-effect imports register; the registry module
 * remains pure.
 */

import './libraries/helix.js';
import './libraries/fa-free.js';

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
  IconPaintMode,
  IconResolver,
} from './types.js';
