/**
 * @helixui/icons — public entry point.
 *
 * Importing this module triggers auto-registration of the bundled `helix`,
 * `fa-free`, `feather`, and `lucide` libraries. After import, all are queryable
 * via `getIconLibrary()` and resolvable through `<hx-icon>`.
 *
 * Order is intentional: `helix` first (default-suggested library), then the
 * fill set (`fa-free`) and the stroke sets (`feather`, `lucide`). Side-effect
 * imports register; the registry module remains pure.
 */

import './libraries/helix.js';
import './libraries/fa-free.js';
import './libraries/feather.js';
import './libraries/lucide.js';

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

export { iconLibraryAaaVerdict } from './aaa.js';
export type { IconLibraryAaaState, IconLibraryAaaVerdict } from './aaa.js';
