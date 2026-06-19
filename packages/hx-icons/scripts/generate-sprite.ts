/**
 * Sprite-sheet generator for the bundled `helix`, `fa-free`, `feather`, and
 * `lucide` libraries.
 *
 * Reads source SVGs from disk, normalizes them (strip ids/classes/styles and
 * own fill/stroke so the host's `currentColor`/paint-mode cascade governs),
 * wraps each in a `<symbol>` element keyed by file basename, and concatenates
 * all symbols into a single hidden `<svg>` sprite sheet. `helix`/`fa-free` are
 * fill glyphs; `feather`/`lucide` are stroke glyphs — the sprite is paint-mode
 * agnostic (bare geometry), so no per-library handling is needed here.
 *
 * Output:
 *   dist/helix.svg            — sprite for the bundled helix glyph set
 *   dist/fa-free-solid.svg    — sprite for FA Free Solid v7.x
 *   dist/feather.svg          — sprite for Feather (stroke)
 *   dist/lucide.svg           — sprite for Lucide (stroke)
 *   dist/<lib>-names.json     — sorted array of icon names per library
 *
 * Sprites use `<svg style="display:none">` so they can be inlined into
 * the document without affecting layout. Each `<symbol>` carries its
 * own `viewBox` from the source SVG, so consumers don't need to know
 * the source coordinate space.
 *
 * Malformed source SVGs are logged and skipped — the build continues.
 * FA Free occasionally ships glyphs that fail strict XML parse; we
 * don't want a single bad glyph to take the entire sprite offline.
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseHTML } from 'linkedom';

import { sanitizeTree } from './svg-sanitize.js';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');
const distDir = resolve(packageRoot, 'dist');
const helixSrcDir = resolve(packageRoot, 'src/libraries/helix-glyphs');
const faSrcDir = resolve(packageRoot, 'node_modules/@fortawesome/fontawesome-free/svgs/solid');
// Stroke-paint sets. The sprite keeps each glyph's geometry plus the root
// <svg>'s line-cap/join (a LIBRARY-specific design choice — Feather/Lucide use
// round). `fill`/`stroke`/`stroke-width` are inherited and host-driven, so
// <hx-icon>'s paint-mode CSS + the --hx-icon-stroke-width token supply those at
// render time; cap/join must stay on the symbol so the component doesn't impose
// round on every stroke library.
const featherSrcDir = resolve(packageRoot, 'node_modules/feather-icons/dist/icons');
const lucideSrcDir = resolve(packageRoot, 'node_modules/lucide-static/icons');

interface Symbol {
  /** Final id used in the sprite (matches consumer-facing name). */
  id: string;
  /** Resolved viewBox attribute, e.g. "0 0 24 24". */
  viewBox: string;
  /** Inner content (children of the source `<svg>`), already sanitized. */
  inner: string;
  /**
   * Library-specific paint presentation from the source root `<svg>` that is NOT
   * supplied by the host's cascade — `stroke-linecap` / `stroke-linejoin`,
   * serialized as ready-to-emit attributes. Empty for fill libraries.
   */
  presentation: string;
}

/**
 * Convert a source SVG file's text into a normalized {@link Symbol}.
 * Returns `null` if the file fails to parse or has no `<svg>` root.
 */
function parseSvgFile(filePath: string, id: string): Symbol | null {
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (err) {
    console.warn(`[sprite] read failed for ${filePath}: ${(err as Error).message}`);
    return null;
  }

  let document: Document;
  try {
    ({ document } = parseHTML(`<!doctype html><body>${raw}</body>`));
  } catch (err) {
    console.warn(`[sprite] parse failed for ${filePath}: ${(err as Error).message}`);
    return null;
  }

  const svg = document.querySelector('svg');
  if (!svg) {
    console.warn(`[sprite] no <svg> root in ${filePath}, skipping`);
    return null;
  }

  const viewBox = svg.getAttribute('viewBox') ?? '0 0 24 24';

  // Preserve the root <svg>'s line-cap/join — library-specific design choices
  // (Feather/Lucide use round) that are otherwise lost when the root is dropped
  // and must NOT be hard-coded generically in <hx-icon>'s stroke CSS.
  const presentation = ['stroke-linecap', 'stroke-linejoin']
    .map((attr) => {
      const value = svg.getAttribute(attr);
      return value ? ` ${attr}="${value}"` : '';
    })
    .join('');

  // Sanitize children of the root <svg>. We don't sanitize the <svg>
  // itself because we're throwing it away — only `inner` survives.
  const children = Array.from(svg.children);
  for (const child of children) {
    sanitizeTree(child as Element);
  }

  const inner = svg.innerHTML.trim();
  if (inner.length === 0) {
    console.warn(`[sprite] empty inner content in ${filePath}, skipping`);
    return null;
  }

  return { id, viewBox, inner, presentation };
}

/**
 * Emit the final sprite document for a list of symbols.
 *
 * `style="display:none"` means the sprite can be inlined anywhere in
 * the document without consuming layout space. `aria-hidden` keeps
 * AT off the sprite container; the consumer's `<use>` wrapper carries
 * the accessible name.
 */
function buildSprite(symbols: Symbol[]): string {
  const body = symbols
    .map((s) => `<symbol id="${s.id}" viewBox="${s.viewBox}"${s.presentation}>${s.inner}</symbol>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:none">${body}</svg>`;
}

interface BuildResult {
  /** Number of symbols emitted. */
  count: number;
  /** Sorted list of symbol ids (consumer-facing icon names). */
  names: string[];
  /** Bytes in the final sprite (informational). */
  bytes: number;
}

/**
 * Generate one sprite + names manifest for a single library.
 */
function buildLibrary(
  label: string,
  srcDir: string,
  spriteOut: string,
  namesOut: string,
): BuildResult {
  let entries: string[];
  try {
    entries = readdirSync(srcDir).filter((f) => f.endsWith('.svg'));
  } catch (err) {
    throw new Error(`[sprite] cannot read source dir ${srcDir}: ${(err as Error).message}`, {
      cause: err,
    });
  }

  const symbols: Symbol[] = [];
  for (const entry of entries) {
    const id = entry.replace(/\.svg$/, '');
    const symbol = parseSvgFile(join(srcDir, entry), id);
    if (symbol) symbols.push(symbol);
  }

  symbols.sort((a, b) => a.id.localeCompare(b.id));
  const sprite = buildSprite(symbols);
  const names = symbols.map((s) => s.id);

  writeFileSync(spriteOut, sprite, 'utf8');
  writeFileSync(namesOut, JSON.stringify(names), 'utf8');

  console.log(
    `[sprite] ${label}: ${symbols.length} symbols, ${sprite.length} bytes -> ${spriteOut}`,
  );
  return { count: symbols.length, names, bytes: sprite.length };
}

mkdirSync(distDir, { recursive: true });

const helix = buildLibrary(
  'helix',
  helixSrcDir,
  resolve(distDir, 'helix.svg'),
  resolve(distDir, 'helix-names.json'),
);
const faFree = buildLibrary(
  'fa-free-solid',
  faSrcDir,
  resolve(distDir, 'fa-free-solid.svg'),
  resolve(distDir, 'fa-free-names.json'),
);
const feather = buildLibrary(
  'feather',
  featherSrcDir,
  resolve(distDir, 'feather.svg'),
  resolve(distDir, 'feather-names.json'),
);
const lucide = buildLibrary(
  'lucide',
  lucideSrcDir,
  resolve(distDir, 'lucide.svg'),
  resolve(distDir, 'lucide-names.json'),
);

console.log(
  `[sprite] done. helix=${helix.count}, fa-free=${faFree.count}, ` +
    `feather=${feather.count}, lucide=${lucide.count}`,
);
