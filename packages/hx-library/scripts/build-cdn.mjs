/**
 * build-cdn.mjs
 *
 * CDN-ready build pipeline for @helixui/library
 *
 * Produces self-contained bundles suitable for direct CDN or static hosting — no npm, no node_modules.
 * All dependencies (including Lit) are bundled inline. Each output file is a fully standalone ES module.
 *
 * Outputs:
 *   dist/cdn/helix-{version}.min.js        — full library bundle (all components + Lit)
 *   dist/cdn/helix-{version}.min.js.map    — source map for full bundle
 *   dist/cdn/helix-{version}.min.css       — all component CSS
 *   dist/cdn/components/hx-{name}-{version}.js      — per-component self-contained JS
 *   dist/cdn/components/hx-{name}-{version}.js.map  — per-component source maps
 *   dist/cdn/components/hx-{name}-{version}.css     — per-component CSS (from dist/css/)
 *   dist/cdn/manifest.json                 — version-stamped asset manifest
 *
 * Run: node scripts/build-cdn.mjs
 * Or via: pnpm run build:cdn (from packages/hx-library)
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  copyFileSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from '/Volumes/Development/booked/helix/node_modules/esbuild/lib/main.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const COMPONENTS_DIR = join(ROOT, 'src', 'components');
const CSS_DIR = join(ROOT, 'dist', 'css');
const CDN_DIR = join(ROOT, 'dist', 'cdn');
const CDN_COMPONENTS_DIR = join(CDN_DIR, 'components');

// ---------------------------------------------------------------------------
// Read package version
// ---------------------------------------------------------------------------

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
const VERSION = pkg.version;

console.log(`[build-cdn] @helixui/library v${VERSION}`);
console.log(`[build-cdn] Output: ${CDN_DIR}`);
console.log('');

// ---------------------------------------------------------------------------
// Directory setup
// ---------------------------------------------------------------------------

mkdirSync(CDN_DIR, { recursive: true });
mkdirSync(CDN_COMPONENTS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Component discovery
// ---------------------------------------------------------------------------

/**
 * Returns sorted list of component directory names (e.g. ['hx-accordion', 'hx-button', ...])
 * Only includes directories that have an index.ts entry point.
 */
function discoverComponents() {
  if (!existsSync(COMPONENTS_DIR)) {
    console.warn(
      '[build-cdn] Warning: components directory not found, skipping per-component builds',
    );
    return [];
  }
  return readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        d.name.startsWith('hx-') &&
        existsSync(join(COMPONENTS_DIR, d.name, 'index.ts')),
    )
    .map((d) => d.name)
    .sort();
}

const components = discoverComponents();
console.log(`[build-cdn] Discovered ${components.length} components`);

// ---------------------------------------------------------------------------
// esbuild shared options
// ---------------------------------------------------------------------------

/**
 * Common esbuild options shared between full and per-component builds.
 * CRITICAL: Nothing is externalized. CDN bundles must be self-contained.
 */
const sharedOptions = {
  bundle: true,
  format: 'esm',
  sourcemap: true,
  platform: 'browser',
  target: ['es2020', 'chrome80', 'firefox78', 'safari14'],
  // Do NOT set external: [...] — all deps including Lit must be inlined for CDN use
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  // Allow TypeScript source files directly — esbuild handles .ts natively
  loader: {
    '.ts': 'ts',
    '.json': 'json',
  },
  // esbuild resolves modules relative to the source files being compiled.
  // pnpm workspace symlinks make @helixui/tokens available via node_modules.
  // No alias needed — let normal Node resolution handle workspace packages.
  absWorkingDir: ROOT,
};

// ---------------------------------------------------------------------------
// 1. Full bundle — dist/cdn/helix-{version}.min.js
// ---------------------------------------------------------------------------

const fullBundleOutfile = join(CDN_DIR, `helix-${VERSION}.min.js`);

console.log(`[build-cdn] Building full bundle...`);

try {
  const fullResult = await esbuild.build({
    ...sharedOptions,
    entryPoints: [join(ROOT, 'src', 'index.ts')],
    minify: true,
    outfile: fullBundleOutfile,
    metafile: true,
  });

  if (fullResult.warnings.length > 0) {
    for (const w of fullResult.warnings) {
      console.warn(`[build-cdn] Warning: ${w.text}`);
    }
  }

  const stat = (await import('node:fs')).statSync(fullBundleOutfile);
  console.log(
    `[build-cdn] Full bundle: helix-${VERSION}.min.js (${(stat.size / 1024).toFixed(1)} KB raw)`,
  );
} catch (err) {
  console.error('[build-cdn] Full bundle build failed:', err.message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Full bundle CSS — dist/cdn/helix-{version}.min.css
// ---------------------------------------------------------------------------

const fullCssOutfile = join(CDN_DIR, `helix-${VERSION}.min.css`);
const sourceCssAll = join(CSS_DIR, 'helix-all.css');

if (existsSync(sourceCssAll)) {
  copyFileSync(sourceCssAll, fullCssOutfile);
  const stat = (await import('node:fs')).statSync(fullCssOutfile);
  console.log(
    `[build-cdn] Full CSS: helix-${VERSION}.min.css (${(stat.size / 1024).toFixed(1)} KB)`,
  );
} else {
  // CSS bundles haven't been generated yet — write a placeholder with a clear comment
  writeFileSync(
    fullCssOutfile,
    `/* helix-${VERSION}.min.css\n * Run pnpm run css:build first to generate component CSS.\n * Components use Shadow DOM CSS-in-JS via Lit and do not require external CSS for rendering.\n */\n`,
  );
  console.warn(
    `[build-cdn] Warning: dist/css/helix-all.css not found — wrote placeholder CSS. Run pnpm run css:build to populate.`,
  );
}

// ---------------------------------------------------------------------------
// 3. Per-component bundles — dist/cdn/components/hx-{name}-{version}.js
// ---------------------------------------------------------------------------

console.log(`\n[build-cdn] Building ${components.length} per-component bundles...`);

const componentResults = [];
const CONCURRENCY = 8;

/**
 * Build a single component bundle.
 * Each bundle is self-contained with Lit bundled inline.
 */
async function buildComponent(name) {
  const entryPoint = join(COMPONENTS_DIR, name, 'index.ts');
  const outfile = join(CDN_COMPONENTS_DIR, `${name}-${VERSION}.js`);

  try {
    await esbuild.build({
      ...sharedOptions,
      entryPoints: [entryPoint],
      minify: false, // Keep readable for per-component; consumers can minify
      outfile,
    });

    const stat = (await import('node:fs')).statSync(outfile);
    return { name, success: true, size: stat.size };
  } catch (err) {
    return { name, success: false, error: err.message };
  }
}

// Process in batches to avoid overwhelming the system
for (let i = 0; i < components.length; i += CONCURRENCY) {
  const batch = components.slice(i, i + CONCURRENCY);
  const results = await Promise.all(batch.map(buildComponent));

  for (const result of results) {
    if (result.success) {
      componentResults.push(result);
      console.log(
        `[build-cdn]   ✓ ${result.name}-${VERSION}.js (${(result.size / 1024).toFixed(1)} KB)`,
      );
    } else {
      console.error(`[build-cdn]   ✗ ${result.name}: ${result.error}`);
      // Non-fatal — continue building remaining components
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Per-component CSS — dist/cdn/components/hx-{name}-{version}.css
// ---------------------------------------------------------------------------

console.log(`\n[build-cdn] Copying per-component CSS...`);

for (const name of components) {
  const sourceCss = join(CSS_DIR, `${name}.css`);
  const outCss = join(CDN_COMPONENTS_DIR, `${name}-${VERSION}.css`);

  if (existsSync(sourceCss)) {
    copyFileSync(sourceCss, outCss);
    console.log(`[build-cdn]   ✓ ${name}-${VERSION}.css`);
  } else {
    // Components with CSS-in-JS only (styles in Shadow DOM) — write empty placeholder
    writeFileSync(
      outCss,
      `/* ${name}-${VERSION}.css\n * This component uses Shadow DOM CSS-in-JS (Lit css\`\` templates).\n * All styles are bundled inside the JS module above.\n */\n`,
    );
    console.log(`[build-cdn]   - ${name}-${VERSION}.css (placeholder — styles in JS bundle)`);
  }
}

// ---------------------------------------------------------------------------
// 5. Manifest — dist/cdn/manifest.json
// ---------------------------------------------------------------------------

const successfulComponents = componentResults.filter((r) => r.success);

const manifest = {
  version: VERSION,
  generated: new Date().toISOString(),
  library: `@helixui/library`,
  description: 'HELiX Enterprise Healthcare Web Component Library — CDN build',
  bundles: {
    full: {
      js: `helix-${VERSION}.min.js`,
      css: `helix-${VERSION}.min.css`,
      description: 'Full library bundle with all components and Lit bundled inline',
    },
  },
  components: successfulComponents.map(({ name }) => ({
    name,
    js: `components/${name}-${VERSION}.js`,
    css: `components/${name}-${VERSION}.css`,
  })),
};

writeFileSync(join(CDN_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\n[build-cdn] ✓ manifest.json`);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const totalComponents = components.length;
const builtComponents = successfulComponents.length;
const failedComponents = totalComponents - builtComponents;

console.log('\n[build-cdn] ─────────────────────────────────────────');
console.log(`[build-cdn] CDN build complete`);
console.log(`[build-cdn]   Version    : ${VERSION}`);
console.log(`[build-cdn]   Full bundle: helix-${VERSION}.min.js`);
console.log(`[build-cdn]   Full CSS   : helix-${VERSION}.min.css`);
console.log(`[build-cdn]   Components : ${builtComponents}/${totalComponents} built`);
if (failedComponents > 0) {
  console.error(`[build-cdn]   Failed     : ${failedComponents} components`);
  process.exit(1);
}
console.log(`[build-cdn]   Output     : ${CDN_DIR}`);
console.log('[build-cdn] ─────────────────────────────────────────');
