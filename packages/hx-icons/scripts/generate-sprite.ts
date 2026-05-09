/**
 * Sprite-sheet generator for the bundled `helix` and `fa-free` libraries.
 *
 * Reads source SVGs from disk, normalizes them (strip ids/classes/styles,
 * force `currentColor` inheritance), wraps each in a `<symbol>` element
 * keyed by file basename, and concatenates all symbols into a single
 * hidden `<svg>` sprite sheet.
 *
 * Output:
 *   dist/helix.svg            — sprite for the bundled helix glyph set
 *   dist/fa-free-solid.svg    — sprite for FA Free Solid v7.x
 *   dist/helix-names.json     — sorted array of helix icon names
 *   dist/fa-free-names.json   — sorted array of fa-free icon names
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

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');
const distDir = resolve(packageRoot, 'dist');
const helixSrcDir = resolve(packageRoot, 'src/libraries/helix-glyphs');
const faSrcDir = resolve(
  packageRoot,
  'node_modules/@fortawesome/fontawesome-free/svgs/solid',
);

interface Symbol {
  /** Final id used in the sprite (matches consumer-facing name). */
  id: string;
  /** Resolved viewBox attribute, e.g. "0 0 24 24". */
  viewBox: string;
  /** Inner content (children of the source `<svg>`), already sanitized. */
  inner: string;
}

/**
 * Strip attributes from an element that would either leak into the
 * surrounding document (id, class, style) or fight the host element's
 * `currentColor` cascade (fill, stroke).
 *
 * `aria-*` attributes on the source svg are removed too — `<hx-icon>`
 * applies its own ARIA at the host level. The sprite's `<symbol>`
 * gets fresh accessible attributes from the consumer.
 */
function sanitizeAttrs(el: Element): void {
  const removeIfPresent = ['id', 'class', 'style', 'fill', 'stroke'];
  for (const attr of removeIfPresent) {
    el.removeAttribute(attr);
  }
  // Remove all aria-* attributes by name.
  const attrNames = el.getAttributeNames();
  for (const name of attrNames) {
    if (name.startsWith('aria-')) {
      el.removeAttribute(name);
    }
  }
}

/**
 * Walk an element tree and sanitize every element. We don't bother
 * preserving comments or processing instructions — sprites should be
 * minimal.
 */
function sanitizeTree(root: Element): void {
  sanitizeAttrs(root);
  const children = Array.from(root.children);
  for (const child of children) {
    sanitizeTree(child as Element);
  }
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

  return { id, viewBox, inner };
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
    .map((s) => `<symbol id="${s.id}" viewBox="${s.viewBox}">${s.inner}</symbol>`)
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
    throw new Error(`[sprite] cannot read source dir ${srcDir}: ${(err as Error).message}`);
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

console.log(`[sprite] done. helix=${helix.count}, fa-free=${faFree.count}`);
