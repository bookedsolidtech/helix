/**
 * Auto-registration for the bundled `fa-free` icon library.
 *
 * Importing this module registers the `fa-free` library with the registry.
 * No exports — this is a pure side-effect module. The companion sprite
 * sheet ships in `dist/fa-free-solid.svg` and is built from the locally
 * installed `@fortawesome/fontawesome-free` Solid set (CC BY 4.0).
 *
 * The library is registered with `paintMode: 'fill'` because FA Free Solid
 * is uniformly painted with `fill="currentColor"`. The Light, Regular,
 * Thin, and Sharp tiers are NOT bundled — those are FA Pro and require
 * a custom `registerIconLibrary` call (see NOTICE.md and the docs).
 */

import { getBasePath, registerIconLibrary } from '../registry.js';

registerIconLibrary('fa-free', {
  resolver: (name) => `${getBasePath()}/fa-free-solid.svg#${name}`,
  spriteSheet: true,
  paintMode: 'fill',
});
