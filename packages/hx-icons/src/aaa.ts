/**
 * Per-library AAA verdict surface.
 *
 * `<hx-icon>` cert is component-shippable: the component itself meets WCAG
 * 2.2 AAA across every applicable Success Criterion (see
 * `packages/hx-library/src/components/hx-icon/AAA-AUDIT.md`). However the
 * AAA *outcome* in production also depends on the icon library a consumer
 * picks — a stroke-paint library at 1px stroke width could fail
 * non-text-contrast even when the component is rendered identically. This
 * module ships the per-library verdict for the bundles HELiX owns
 * (`helix`, `fa-free`) and lets consumers query / extend the surface.
 *
 * The verdict shape is intentionally narrow — three dimensions, three
 * states — so it remains stable as the standards harness grows. Phase 5
 * docs explain how a consumer-registered library opts into this surface
 * by re-running `pnpm aaa:audit` after registering and then re-exporting
 * its own verdict via this same shape.
 */

/**
 * The AAA verdict for a single dimension. `'unknown'` is returned for
 * libraries that have not been measured by the formal audit harness — it
 * is an explicit absence of evidence rather than a failure.
 */
export type IconLibraryAaaState = 'pass' | 'fail' | 'unknown';

/**
 * The three dimensions an icon library is evaluated against. These are the
 * dimensions that *only* the library can change — everything else is
 * audited on `<hx-icon>` proper.
 */
export interface IconLibraryAaaVerdict {
  /**
   * WCAG 1.4.11 Non-text Contrast on the rendered glyph at the
   * library-specified minimum render size. `'pass'` means every glyph in
   * the library cleared 3:1 against the document background at the
   * configured minimum size during the formal audit. `'fail'` means at
   * least one glyph fell below 3:1 and the library should not be used
   * below the documented minimum render size.
   */
  contrast: IconLibraryAaaState;

  /**
   * Forced-colors mode behavior. `'pass'` means the library's glyphs flow
   * naturally with the user-agent enforced palette (Windows High Contrast
   * etc.) — typically because every glyph paints with `currentColor` or
   * `System Colors` keywords. `'fail'` means at least one glyph hardcodes
   * a color that survives forced-colors emulation.
   */
  forcedColors: IconLibraryAaaState;

  /**
   * Optical sizing acceptability at the library's minimum render size.
   * `'pass'` means glyph silhouettes remain legible at the documented
   * minimum size (no thin lines disappearing, no even-odd fills
   * collapsing). `'fail'` means the library should not be rendered below
   * the documented minimum without optical-size adjustment.
   */
  opticalSizing: IconLibraryAaaState;
}

/**
 * Hardcoded verdicts for the libraries shipped by `@helixui/icons`. The fill
 * built-ins (`helix`, `fa-free`) are `paintMode: 'fill'` solid silhouettes
 * painted with `fill="currentColor"` — the easiest paint strategy to clear all
 * three dimensions cleanly. The stroke built-ins (`feather`, `lucide`) are
 * `paintMode: 'stroke'`; their contrast/optical-sizing verdicts depend on the
 * render size and `--hx-icon-stroke-width` and are left `'unknown'` until a
 * formal audit measures them (see below).
 *
 * Source of truth for these verdicts:
 *   - Phase 4 formal audit (`pnpm aaa:audit --component hx-icon`)
 *   - Phase 4 per-library evidence in `packages/hx-icons/AAA-VERDICT.md`
 *
 * Consumer-registered libraries default to `undefined` from this lookup —
 * callers should treat that as `'unknown'` across all three dimensions.
 */
const BUILTIN_VERDICTS: Record<string, IconLibraryAaaVerdict> = {
  helix: {
    contrast: 'pass',
    forcedColors: 'pass',
    opticalSizing: 'pass',
  },
  'fa-free': {
    contrast: 'pass',
    forcedColors: 'pass',
    opticalSizing: 'pass',
  },
  // Stroke-paint libraries. `forcedColors` is structurally 'pass' — every glyph
  // paints with `currentColor` (→ CanvasText under forced-colors) and hardcodes
  // no color. `contrast` and `opticalSizing` are 'unknown' pending a formal
  // `pnpm aaa:audit` pass: at the default 2px stroke / 24px render size they are
  // expected to clear 3:1, but a thin `--hx-icon-stroke-width` override or a
  // sub-minimum render size can drop a stroke glyph below non-text contrast, so
  // we do not claim a measured 'pass' here.
  feather: {
    contrast: 'unknown',
    forcedColors: 'pass',
    opticalSizing: 'unknown',
  },
  lucide: {
    contrast: 'unknown',
    forcedColors: 'pass',
    opticalSizing: 'unknown',
  },
};

/**
 * Returns the AAA verdict for a registered icon library by name.
 *
 * Returns `undefined` for unknown libraries — consumers should treat that
 * as the `'unknown'` state (no evidence on file). Extend by re-running
 * `pnpm aaa:audit` against a consumer library and shipping a sibling
 * verdict module that mirrors this shape.
 *
 * @example
 * ```ts
 * import { iconLibraryAaaVerdict } from '@helixui/icons';
 *
 * const v = iconLibraryAaaVerdict('helix');
 * // → { contrast: 'pass', forcedColors: 'pass', opticalSizing: 'pass' }
 *
 * const u = iconLibraryAaaVerdict('my-custom-lib');
 * // → undefined
 * ```
 */
export function iconLibraryAaaVerdict(name: string): IconLibraryAaaVerdict | undefined {
  return BUILTIN_VERDICTS[name];
}
