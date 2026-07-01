/**
 * Tree-shake export generator for the bundled `helix`, `fa-free`, `feather`,
 * and `lucide` libraries.
 *
 * Emits one ES module per icon (with companion `.d.ts`) containing a
 * single named export holding the inlined, sanitized SVG markup.
 * Bundlers can then import a single icon
 * (`import { check } from '@helixui/icons/tree-shake/helix/check'`)
 * and dead-code-eliminate the rest of the library.
 *
 * Output layout:
 *   dist/tree-shake/helix/<name>.js + .d.ts
 *   dist/tree-shake/helix/index.js + .d.ts
 *   dist/tree-shake/fa-free/solid/<name>.js + .d.ts
 *   dist/tree-shake/fa-free/solid/index.js + .d.ts
 *   dist/tree-shake/feather/<name>.js + .d.ts (+ index)
 *   dist/tree-shake/lucide/<name>.js + .d.ts (+ index)
 *
 * We emit `.js`+`.d.ts` directly rather than `.ts` so the generator
 * isn't dependent on `tsc` running afterwards over `dist/` — `tsc`
 * has `dist/` in its excludes and would skip these anyway. Emitting
 * the final shape directly also keeps the generator self-contained.
 *
 * The export name is the kebab-case file name converted to camelCase
 * (`chevron-up.svg` -> `chevronUp`). The on-disk file name keeps the
 * kebab-case so paths stay lookup-stable for consumers who type icon
 * names directly.
 *
 * Sanitization mirrors `generate-sprite.ts`: strip ids, classes,
 * styles, fill/stroke, and aria-* attributes. The inlined SVG keeps
 * its own `viewBox` and an explicit `xmlns` so it round-trips through
 * `innerHTML` cleanly.
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseHTML } from 'linkedom';

import { assignIdentifiers } from './tree-shake-identifiers.js';
import { escapeAttr, sanitizeTree } from './svg-sanitize.js';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');
const distDir = resolve(packageRoot, 'dist');
const helixSrcDir = resolve(packageRoot, 'src/libraries/helix-glyphs');
const faSrcDir = resolve(packageRoot, 'node_modules/@fortawesome/fontawesome-free/svgs/solid');
const featherSrcDir = resolve(packageRoot, 'node_modules/feather-icons/dist/icons');
const lucideSrcDir = resolve(packageRoot, 'node_modules/lucide-static/icons');

const SVG_NS = 'http://www.w3.org/2000/svg';

interface Glyph {
  /** kebab-case id used for both the file name and consumer string lookup. */
  id: string;
  /** Inlined SVG markup ready to be assigned to a string export. */
  svg: string;
}

/**
 * Read + sanitize one source SVG file into the inlined string we will
 * embed in the generated TS module. Returns `null` on parse failure.
 */
function loadGlyph(filePath: string, id: string, paintMode: 'fill' | 'stroke'): Glyph | null {
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (err) {
    console.warn(`[tree-shake] read failed for ${filePath}: ${(err as Error).message}`);
    return null;
  }

  let document: Document;
  try {
    ({ document } = parseHTML(`<!doctype html><body>${raw}</body>`));
  } catch (err) {
    console.warn(`[tree-shake] parse failed for ${filePath}: ${(err as Error).message}`);
    return null;
  }

  const svg = document.querySelector('svg');
  if (!svg) {
    console.warn(`[tree-shake] no <svg> in ${filePath}, skipping`);
    return null;
  }

  const viewBox = svg.getAttribute('viewBox') ?? '0 0 24 24';

  for (const child of Array.from(svg.children)) {
    sanitizeTree(child as Element);
  }
  const inner = svg.innerHTML.trim();
  if (inner.length === 0) {
    console.warn(`[tree-shake] empty inner in ${filePath}, skipping`);
    return null;
  }

  // Re-emit a clean, minimal <svg>. xmlns is explicit so this string can be
  // assigned to innerHTML in any host without namespace fixup. Stroke libraries
  // keep their rendering semantics on the ROOT <svg> (fill:none, stroke:
  // currentColor, the library's own caps/joins) — which we dropped above — so
  // re-apply them on the emitted wrapper; otherwise the standalone string renders
  // blank. Caps/joins are read from the source rather than hard-coded, so each
  // library keeps its own line style.
  // `cap`/`join`/`viewBox` originate from third-party source SVGs; escape them
  // before interpolation so a malformed value containing `"`/`<`/`>`/`&` cannot
  // break out of its attribute and inject markup into the published module.
  let strokeAttrs = '';
  if (paintMode === 'stroke') {
    const cap = svg.getAttribute('stroke-linecap');
    const join = svg.getAttribute('stroke-linejoin');
    strokeAttrs =
      ' fill="none" stroke="currentColor" stroke-width="2"' +
      (cap ? ` stroke-linecap="${escapeAttr(cap)}"` : '') +
      (join ? ` stroke-linejoin="${escapeAttr(join)}"` : '');
  }
  const svgText = `<svg xmlns="${SVG_NS}" viewBox="${escapeAttr(viewBox)}"${strokeAttrs}>${inner}</svg>`;
  return { id, svg: svgText };
}

/**
 * Escape a JS template-literal payload. The sanitized SVG should not
 * contain backticks or `${` sequences in practice, but cheap defense
 * is cheap.
 */
function escapeTemplate(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/**
 * Emit:
 *   <outDir>/<glyph.id>.ts          — single named export per glyph
 *   <outDir>/index.ts               — re-exports for the whole group
 */
function emitGroup(
  label: string,
  srcDir: string,
  outDir: string,
  paintMode: 'fill' | 'stroke' = 'fill',
): number {
  let entries: string[];
  try {
    entries = readdirSync(srcDir).filter((f) => f.endsWith('.svg'));
  } catch (err) {
    throw new Error(`[tree-shake] cannot read ${srcDir}: ${(err as Error).message}`, {
      cause: err,
    });
  }

  mkdirSync(outDir, { recursive: true });

  const glyphs: Glyph[] = [];
  for (const entry of entries) {
    const id = entry.replace(/\.svg$/, '');
    const glyph = loadGlyph(join(srcDir, entry), id, paintMode);
    if (glyph) glyphs.push(glyph);
  }
  glyphs.sort((a, b) => a.id.localeCompare(b.id));

  // Assign a unique export identifier per glyph (camelCase for non-colliding
  // ids; injective underscore fallback for collisions). See assignIdentifiers.
  const idents = assignIdentifiers(glyphs.map((g) => g.id));
  const identFor = (id: string): string => idents.get(id) as string;

  for (const glyph of glyphs) {
    const ident = identFor(glyph.id);
    const js = `/** Inlined SVG for the \`${glyph.id}\` icon. Generated; do not edit. */\nexport const ${ident} = \`${escapeTemplate(glyph.svg)}\`;\n`;
    const dts = `/** Inlined SVG for the \`${glyph.id}\` icon. Generated; do not edit. */\nexport declare const ${ident}: string;\n`;
    writeFileSync(join(outDir, `${glyph.id}.js`), js, 'utf8');
    writeFileSync(join(outDir, `${glyph.id}.d.ts`), dts, 'utf8');
  }

  const indexJs =
    `/** Re-exports every icon in the ${label} library. Generated; do not edit. */\n` +
    glyphs.map((g) => `export { ${identFor(g.id)} } from './${g.id}.js';`).join('\n') +
    '\n';
  const indexDts =
    `/** Re-exports every icon in the ${label} library. Generated; do not edit. */\n` +
    glyphs.map((g) => `export { ${identFor(g.id)} } from './${g.id}.js';`).join('\n') +
    '\n';
  writeFileSync(join(outDir, 'index.js'), indexJs, 'utf8');
  writeFileSync(join(outDir, 'index.d.ts'), indexDts, 'utf8');

  console.log(`[tree-shake] ${label}: ${glyphs.length} files -> ${outDir}`);
  return glyphs.length;
}

mkdirSync(distDir, { recursive: true });

const helixCount = emitGroup('helix', helixSrcDir, resolve(distDir, 'tree-shake/helix'));
const faCount = emitGroup('fa-free/solid', faSrcDir, resolve(distDir, 'tree-shake/fa-free/solid'));
const featherCount = emitGroup(
  'feather',
  featherSrcDir,
  resolve(distDir, 'tree-shake/feather'),
  'stroke',
);
const lucideCount = emitGroup(
  'lucide',
  lucideSrcDir,
  resolve(distDir, 'tree-shake/lucide'),
  'stroke',
);

console.log(
  `[tree-shake] done. helix=${helixCount}, fa-free/solid=${faCount}, ` +
    `feather=${featherCount}, lucide=${lucideCount}`,
);
