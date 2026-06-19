/**
 * Auto-registration for the bundled `feather` icon library.
 *
 * Importing this module registers the `feather` library with the registry.
 * No exports — this is a pure side-effect module. The companion sprite sheet
 * ships in `dist/feather.svg`, built from the locally installed `feather-icons`
 * package (MIT, 287 glyphs) by `scripts/generate-sprite.ts`.
 *
 * Registered with `paintMode: 'stroke'` because Feather glyphs are outline
 * icons whose visible ink is a stroke painted with `stroke="currentColor"`.
 * `<hx-icon>` supplies `fill: none; stroke: currentColor` plus the
 * `--hx-icon-stroke-width` token at render time per the library's paint mode.
 */

import { getBasePath, registerIconLibrary } from '../registry.js';

registerIconLibrary('feather', {
  resolver: (name) => `${getBasePath()}/feather.svg#${name}`,
  spriteSheet: true,
  paintMode: 'stroke',
});
