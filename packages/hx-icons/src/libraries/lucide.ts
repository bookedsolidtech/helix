/**
 * Auto-registration for the bundled `lucide` icon library.
 *
 * Importing this module registers the `lucide` library with the registry.
 * No exports — this is a pure side-effect module. The companion sprite sheet
 * ships in `dist/lucide.svg`, built from the locally installed `lucide-static`
 * package (ISC, ~1,986 glyphs) by `scripts/generate-sprite.ts`.
 *
 * Registered with `paintMode: 'stroke'` because Lucide glyphs are outline
 * icons whose visible ink is a stroke painted with `stroke="currentColor"`.
 * `<hx-icon>` supplies `fill: none; stroke: currentColor` plus the
 * `--hx-icon-stroke-width` token at render time per the library's paint mode.
 */

import { getBasePath, registerIconLibrary } from '../registry.js';

registerIconLibrary('lucide', {
  resolver: (name) => `${getBasePath()}/lucide.svg#${name}`,
  spriteSheet: true,
  paintMode: 'stroke',
});
