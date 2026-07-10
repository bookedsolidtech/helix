/**
 * CSS Bundle Generator for @helixui/library
 *
 * Extracts CSS from each component's .styles.ts file and generates:
 * - dist/css/hx-*.css — individual component CSS files
 * - dist/css/helix-{category}.css — category bundle files
 * - dist/css/helix-all.css — combined bundle with all components
 * - dist/css/helix-tokens.css — design token custom properties only
 * - dist/css/manifest.json — component → token dependency map
 *
 * Run: node build/generate-css-bundles.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const COMPONENTS_DIR = resolve(ROOT, 'src/components');
const TOKENS_JSON = resolve(__dirname, '../../../packages/hx-tokens/src/tokens.json');
const CATEGORIES_CONFIG = resolve(__dirname, 'component-categories.json');
const OUT_DIR = resolve(ROOT, 'dist/css');

// ─── CSS Extraction ───────────────────────────────────────────────────────────

/**
 * Extracts raw CSS content from a Lit .styles.ts file.
 *
 * Handles files with one OR many `export const <name> = css`...`;` literals.
 * Every `css`` tagged literal is located and scanned character-by-character to
 * its own closing backtick, so escape sequences and `${ ... }` interpolations
 * never terminate a literal early and the JavaScript between literals (export
 * statements, etc.) is never swept into the emitted CSS. Bodies are returned in
 * source order, joined by a newline. Returns '' when no literal is found.
 */
function extractCssFromStylesFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const tag = 'css`';
  const bodies = [];

  let from = 0;
  for (;;) {
    const tagIdx = content.indexOf(tag, from);
    if (tagIdx === -1) break;

    // Require `css` to be a standalone identifier — Lit's bare `css` tag, not a
    // member access or a filename. Reject when the preceding char continues an
    // identifier (so `unsafeCSS`` / `fooCss`` never match) or is a `.` (so a
    // member `obj.css`` or a `…scoped.css`` path inside a JSDoc comment doesn't
    // either).
    const prev = tagIdx > 0 ? content[tagIdx - 1] : '';
    if (prev && /[A-Za-z0-9_$.]/.test(prev)) {
      from = tagIdx + tag.length;
      continue;
    }

    // Scan the literal body from the char after the opening backtick.
    const bodyStart = tagIdx + tag.length;
    const { body, end } = scanTemplateLiteral(content, bodyStart);
    if (body.includes('${')) {
      console.warn(
        `[css-bundles] Warning: ${filePath} has a \${...} interpolation inside a css\`\` literal — ` +
          'interpolations are not resolved; css:validate will fail if one reaches emitted CSS.',
      );
    }
    bodies.push(body);
    from = end + 1;
  }

  if (bodies.length === 0) return '';
  return bodies.join('\n').trim();
}

/**
 * Scans a template-literal body starting at `start` (the first char after the
 * opening backtick). Returns the raw body text and the index of the closing
 * backtick. Backslash escapes are skipped; `${ ... }` interpolation regions are
 * traversed via skipInterpolation so a backtick nested inside one does not
 * close the outer literal.
 */
function scanTemplateLiteral(content, start) {
  const len = content.length;
  let i = start;
  while (i < len) {
    const ch = content[i];
    if (ch === '\\') {
      i += 2; // escape sequence — skip the escaped char verbatim
      continue;
    }
    if (ch === '`') {
      return { body: content.slice(start, i), end: i };
    }
    if (ch === '$' && content[i + 1] === '{') {
      i = skipInterpolation(content, i + 2);
      continue;
    }
    i++;
  }
  return { body: content.slice(start), end: len }; // unterminated — return what we have
}

/**
 * Given `start` just past a `${`, returns the index immediately after the `}`
 * that closes the interpolation. Tracks nested braces, quoted strings, and
 * nested template literals (which may contain their own `${ ... }`) so a `}`
 * inside a string or nested template does not close the interpolation early and
 * the scan resumes at the correct place in the outer css literal. Regex
 * literals and comments are out of scope — no styles file uses them.
 */
function skipInterpolation(content, start) {
  const len = content.length;
  let i = start;
  let braceDepth = 1;
  while (i < len) {
    const ch = content[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"') {
      i = skipStringLiteral(content, i + 1, ch);
      continue;
    }
    if (ch === '{') {
      braceDepth++;
      i++;
      continue;
    }
    if (ch === '}') {
      braceDepth--;
      i++;
      if (braceDepth === 0) return i;
      continue;
    }
    if (ch === '`') {
      i = skipNestedTemplate(content, i + 1);
      continue;
    }
    i++;
  }
  return len;
}

/**
 * Scans a single- or double-quoted string starting at `start` (just past the
 * opening quote) and returns the index immediately after the matching closing
 * quote, honoring backslash escapes. `quoteChar` is the opening quote so `"` in
 * a `'…'` string (and vice versa) does not terminate it.
 */
function skipStringLiteral(content, start, quoteChar) {
  const len = content.length;
  let i = start;
  while (i < len) {
    const ch = content[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quoteChar) {
      return i + 1;
    }
    i++;
  }
  return len;
}

/**
 * Scans a nested template literal starting at `start` (just past its opening
 * backtick) and returns the index immediately after its closing backtick.
 * Nested interpolations recurse back through skipInterpolation.
 */
function skipNestedTemplate(content, start) {
  const len = content.length;
  let i = start;
  while (i < len) {
    const ch = content[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') {
      return i + 1;
    }
    if (ch === '$' && content[i + 1] === '{') {
      i = skipInterpolation(content, i + 2);
      continue;
    }
    i++;
  }
  return len;
}

// ─── Token Dependency Analysis ────────────────────────────────────────────────

/**
 * Scans CSS for all var(--hx-*) references and returns unique token names.
 */
function extractTokenDependencies(css) {
  const pattern = /var\((--hx-[a-zA-Z0-9-]+)/g;
  const tokens = new Set();
  let match;
  while ((match = pattern.exec(css)) !== null) {
    if (match[1]) tokens.add(match[1]);
  }
  return [...tokens].sort();
}

// ─── Token CSS Generation ─────────────────────────────────────────────────────

function isTokenDefinition(obj) {
  return typeof obj === 'object' && obj !== null && 'value' in obj;
}

function flattenTokens(obj, prefix = []) {
  const entries = [];
  for (const [key, val] of Object.entries(obj)) {
    const path = [...prefix, key];
    if (isTokenDefinition(val)) {
      entries.push({ name: `--hx-${path.join('-')}`, value: String(val.value) });
    } else if (typeof val === 'object' && val !== null) {
      entries.push(...flattenTokens(val, path));
    }
  }
  return entries;
}

function generateTokensCSS() {
  // Try the workspace path first, then fall back to relative path
  const candidatePaths = [TOKENS_JSON, resolve(ROOT, '../hx-tokens/src/tokens.json')];

  let tokensPath = null;
  for (const p of candidatePaths) {
    if (existsSync(p)) {
      tokensPath = p;
      break;
    }
  }

  if (!tokensPath) {
    console.warn(
      `[css-bundles] Warning: tokens.json not found — generating empty helix-tokens.css`,
    );
    return '/* helix-tokens.css: tokens.json not found during build */\n';
  }

  const tokensRaw = JSON.parse(readFileSync(tokensPath, 'utf-8'));
  const { dark: darkJson, 'high-contrast': hcJson, ...lightJson } = tokensRaw;
  const lightTokens = flattenTokens(lightJson);

  let css = ':root {\n';
  css += lightTokens.map((t) => `  ${t.name}: ${t.value};`).join('\n');
  css += '\n}\n';

  if (darkJson) {
    const darkTokens = flattenTokens(darkJson);
    css += '\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n';
    css += darkTokens.map((t) => `    ${t.name}: ${t.value};`).join('\n');
    css += '\n  }\n}\n';

    css += '\n:root[data-theme="dark"] {\n';
    css += darkTokens.map((t) => `  ${t.name}: ${t.value};`).join('\n');
    css += '\n}\n';
  }

  if (hcJson) {
    const hcTokens = flattenTokens(hcJson);
    css += '\n@media (forced-colors: active) {\n  :root {\n';
    css += hcTokens.map((t) => `    ${t.name}: ${t.value};`).join('\n');
    css += '\n  }\n}\n';
  }

  return css;
}

// ─── Component Discovery ──────────────────────────────────────────────────────

function discoverComponents() {
  if (!existsSync(COMPONENTS_DIR)) return [];
  return readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('hx-'))
    .map((d) => d.name)
    .sort();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function run() {
  console.log('[css-bundles] Starting CSS bundle generation...');

  mkdirSync(OUT_DIR, { recursive: true });

  // Load category configuration
  const categoriesConfig = JSON.parse(readFileSync(CATEGORIES_CONFIG, 'utf-8'));
  const categories = categoriesConfig.categories;

  // Process each component
  const componentEntries = [];
  const allComponentNames = discoverComponents();

  for (const name of allComponentNames) {
    const stylesFile = join(COMPONENTS_DIR, name, `${name}.styles.ts`);
    if (!existsSync(stylesFile)) {
      console.warn(`[css-bundles] No styles file for ${name} — generating empty CSS file`);
      componentEntries.push({ name, css: '', tokens: [] });
      writeFileSync(join(OUT_DIR, `${name}.css`), `/* ${name}: no styles defined */\n`);
      continue;
    }

    const rawCss = extractCssFromStylesFile(stylesFile);
    const tokens = extractTokenDependencies(rawCss);
    const header = `/* ${name} — extracted from Shadow DOM styles */\n`;
    const css = rawCss ? `${header}${rawCss}\n` : `${header}/* no styles */\n`;

    componentEntries.push({ name, css: rawCss, tokens });
    writeFileSync(join(OUT_DIR, `${name}.css`), css);
    console.log(`[css-bundles] ✓ ${name}.css (${tokens.length} token deps)`);
  }

  // Build reverse lookup: component name → CSS
  const cssMap = new Map(componentEntries.map((e) => [e.name, e.css]));

  // Generate category bundles
  const bundleEntries = {};

  for (const [category, members] of Object.entries(categories)) {
    const bundleFile = `helix-${category}.css`;
    const chunks = [`/* helix-${category}.css — ${members.length} components */\n`];
    const includedComponents = [];

    for (const componentName of members) {
      const css = cssMap.get(componentName);
      if (css === undefined) {
        console.warn(
          `[css-bundles] Component "${componentName}" in category "${category}" not found`,
        );
        continue;
      }
      includedComponents.push(componentName);
      if (css) {
        chunks.push(`/* ── ${componentName} ── */`);
        chunks.push(css);
      }
    }

    const bundleCSS = chunks.join('\n');
    writeFileSync(join(OUT_DIR, bundleFile), bundleCSS);
    bundleEntries[category] = { components: includedComponents, file: bundleFile };
    console.log(`[css-bundles] ✓ ${bundleFile} (${includedComponents.length} components)`);
  }

  // Generate helix-all.css
  const allChunks = [`/* helix-all.css — all ${componentEntries.length} components */\n`];
  for (const entry of componentEntries) {
    if (entry.css) {
      allChunks.push(`/* ── ${entry.name} ── */`);
      allChunks.push(entry.css);
    }
  }
  writeFileSync(join(OUT_DIR, 'helix-all.css'), allChunks.join('\n'));
  bundleEntries['all'] = {
    components: componentEntries.map((e) => e.name),
    file: 'helix-all.css',
  };
  console.log(`[css-bundles] ✓ helix-all.css`);

  // Generate helix-tokens.css
  const tokensCSS = generateTokensCSS();
  writeFileSync(join(OUT_DIR, 'helix-tokens.css'), tokensCSS);
  console.log(`[css-bundles] ✓ helix-tokens.css`);

  // Generate manifest.json
  const manifest = {
    generated: new Date().toISOString(),
    components: componentEntries.map((e) => ({
      name: e.name,
      file: `${e.name}.css`,
      tokens: e.tokens,
    })),
    bundles: bundleEntries,
  };
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`[css-bundles] ✓ manifest.json`);

  // Generate index.css with @import statements for all component CSS files
  const indexLines = [
    `/* index.css — generated ${new Date().toISOString()} */`,
    `/* Imports all per-component CSS files for Drupal asset pipeline */`,
    '',
  ];
  for (const entry of componentEntries) {
    indexLines.push(`@import './${entry.name}.css';`);
  }
  indexLines.push('');
  writeFileSync(join(OUT_DIR, 'index.css'), indexLines.join('\n'));
  console.log(`[css-bundles] ✓ index.css (${componentEntries.length} imports)`);

  const total = componentEntries.length;
  const withStyles = componentEntries.filter((e) => e.css.length > 0).length;
  console.log(`\n[css-bundles] Done. ${total} components processed (${withStyles} with styles).`);
  console.log(`[css-bundles] Output: ${OUT_DIR}`);
}

run();
