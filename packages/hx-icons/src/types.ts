/**
 * Type definitions for the @helixui/icons registry.
 *
 * Wire-compatible with Shoelace's `registerIconLibrary()` API so that
 * downstream consumers can swap implementations without code changes.
 */

/**
 * Resolves an icon name to a URL (or `data:` URI) that can be fetched
 * to obtain the icon's SVG markup.
 *
 * @param name - The icon name passed to `<hx-icon name="...">`.
 * @returns A URL string.
 */
export type IconResolver = (name: string) => string;

/**
 * Mutates a resolved SVG element before it is rendered into the DOM.
 *
 * Common uses:
 * - Stripping inline `fill` / `stroke` attributes so `currentColor` cascades.
 * - Adding `role="img"` / `aria-hidden` for accessibility hardening.
 * - Normalizing `viewBox` across icon sources.
 *
 * The mutator runs synchronously after fetch + parse and before insertion
 * into the component shadow root.
 */
export type IconMutator = (svg: SVGElement) => void;

/**
 * The paint strategy a library's glyphs use.
 *
 * - `'fill'` — solid silhouettes painted with `fill="currentColor"` and no
 *   strokes. Color and contrast are governed by the host element's
 *   `color` cascade alone.
 * - `'stroke'` — outline glyphs whose visible ink is a stroke (e.g. Lucide,
 *   Phosphor Thin). Stroke width is consumer-driven via the
 *   `--hx-icon-stroke-width` token (wired in Phase 4) and contributes to
 *   AAA non-text contrast measurement.
 * - `'mixed'` — libraries that combine fill and stroke per-glyph (e.g.
 *   Phosphor Duotone). Phase 4's AAA harness dispatches a hybrid measure
 *   that accounts for both surfaces.
 *
 * Libraries declare their paint strategy at registration time. The
 * `<hx-icon>` AAA contrast harness in Phase 4 dispatches per `paintMode`,
 * which is why this is a first-class registry field rather than a heuristic.
 */
export type IconPaintMode = 'fill' | 'stroke' | 'mixed';

/**
 * Options accepted by `registerIconLibrary()`.
 *
 * Mirrors Shoelace's contract: a `resolver` is mandatory; `mutator`
 * and `spriteSheet` are optional augmentations.
 */
export interface IconLibraryOptions {
  /**
   * Maps an icon name to a fetchable URL. Required.
   */
  resolver: IconResolver;

  /**
   * Optional post-fetch SVG mutator. Runs once per icon instance after
   * the SVG markup is parsed.
   */
  mutator?: IconMutator;

  /**
   * When true, the resolver returns URLs of the form
   * `<sprite-url>#<icon-id>` and the consumer should render
   * `<svg><use href="..."/></svg>` rather than inlining markup.
   */
  spriteSheet?: boolean;

  /**
   * The paint strategy the library's glyphs use. Defaults to `'fill'`
   * when omitted at registration time.
   *
   * See {@link IconPaintMode}.
   */
  paintMode?: IconPaintMode;
}

/**
 * The registered representation of an icon library. Internal state shape
 * returned by `getIconLibrary()`.
 *
 * `spriteSheet` is normalized to a boolean at registration time.
 */
export interface IconLibrary {
  /** The library identifier passed to `registerIconLibrary()`. */
  name: string;
  /** The resolver function provided at registration. */
  resolver: IconResolver;
  /** The optional mutator function provided at registration. */
  mutator?: IconMutator;
  /** Whether the library uses a sprite sheet at the resolved URL. */
  spriteSheet: boolean;
  /**
   * The paint strategy this library declares. Always populated after
   * registration (defaults to `'fill'` when the option is omitted).
   */
  paintMode: IconPaintMode;
}
