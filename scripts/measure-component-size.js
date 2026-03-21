#!/usr/bin/env node

/**
 * measure-component-size.js — Per-Component Bundle Size Measurement Utility
 *
 * Measures raw, minified, and gzipped sizes for a single HELiX component
 * using esbuild. Lit and @helixui/tokens are externalized to measure only
 * the component's own code (tree-shaking-aware).
 *
 * Usage:
 *   node scripts/measure-component-size.js hx-button
 *   node scripts/measure-component-size.js hx-button --include-lit
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';
import { Buffer } from 'node:buffer';

const esbuild = await import('esbuild');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const COMPONENTS_DIR = resolve(ROOT, 'packages/hx-library/src/components');

/**
 * Externals used when measuring component-only size (excludes Lit overhead).
 */
const EXTERNAL_COMPONENT_ONLY = [
  'lit',
  'lit/*',
  '@lit/*',
  '@helixui/tokens',
  '@helixui/tokens/*',
  '@floating-ui/*',
];

/**
 * Externals used when measuring with Lit bundled in (full runtime cost).
 */
const EXTERNAL_BUNDLED = ['@floating-ui/*'];

/**
 * Measure a single component entry point.
 *
 * @param {string} componentName - e.g. "hx-button"
 * @param {object} opts
 * @param {boolean} [opts.includeLit=false] - Bundle Lit core into the measurement
 * @param {string[]} [opts.extraExternals=[]] - Additional modules to externalize
 * @returns {Promise<ComponentMeasurement>}
 */
export async function measureComponent(componentName, opts = {}) {
  const { includeLit = false, extraExternals = [] } = opts;

  const entryPoint = resolve(COMPONENTS_DIR, componentName, 'index.ts');
  if (!existsSync(entryPoint)) {
    return {
      name: componentName,
      entryPoint: `src/components/${componentName}/index.ts`,
      error: `Entry point not found: ${entryPoint}`,
      bundleSize: 0,
      minifiedSize: 0,
      gzipSize: 0,
      cssSize: 0,
      cssPercent: 0,
    };
  }

  const externals = includeLit
    ? [...EXTERNAL_BUNDLED, ...extraExternals]
    : [...EXTERNAL_COMPONENT_ONLY, ...extraExternals];

  try {
    // Build unminified first to get raw size
    const rawResult = await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      format: 'esm',
      minify: false,
      write: false,
      external: externals,
      logLevel: 'silent',
      treeShaking: true,
    });

    const rawCode = rawResult.outputFiles[0].text;

    // Build minified for size budget comparison
    const minResult = await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      format: 'esm',
      minify: true,
      write: false,
      external: externals,
      logLevel: 'silent',
      treeShaking: true,
    });

    const minCode = minResult.outputFiles[0].text;
    const gzipped = gzipSync(Buffer.from(minCode), { level: 9 });

    // Measure CSS template size from .styles.ts file
    const stylesPath = resolve(COMPONENTS_DIR, componentName, `${componentName}.styles.ts`);
    let cssSize = 0;
    if (existsSync(stylesPath)) {
      const stylesSource = readFileSync(stylesPath, 'utf-8');
      // Measure just the CSS content inside the css`` tagged templates
      const cssMatches = stylesSource.match(/css`([^`]*)`/gs) || [];
      const cssContent = cssMatches.join('');
      cssSize = Buffer.from(cssContent).length;
    }

    const minifiedSize = minCode.length;
    const cssPercent = minifiedSize > 0 ? Math.round((cssSize / minifiedSize) * 100) : 0;

    return {
      name: componentName,
      entryPoint: `src/components/${componentName}/index.ts`,
      bundleSize: rawCode.length,
      minifiedSize,
      gzipSize: gzipped.length,
      cssSize,
      cssPercent,
    };
  } catch (err) {
    return {
      name: componentName,
      entryPoint: `src/components/${componentName}/index.ts`,
      error: err.message || String(err),
      bundleSize: 0,
      minifiedSize: 0,
      gzipSize: 0,
      cssSize: 0,
      cssPercent: 0,
    };
  }
}

/**
 * Measure multiple entry points bundled together.
 *
 * @param {string[]} componentNames
 * @param {object} opts
 * @returns {Promise<BulkMeasurement>}
 */
export async function measureBulk(componentNames, opts = {}) {
  const { includeLit = false } = opts;

  const entryPoints = componentNames
    .map((name) => resolve(COMPONENTS_DIR, name, 'index.ts'))
    .filter((ep) => existsSync(ep));

  const externals = includeLit ? EXTERNAL_BUNDLED : EXTERNAL_COMPONENT_ONLY;

  try {
    const rawResult = await esbuild.build({
      entryPoints,
      bundle: true,
      format: 'esm',
      minify: false,
      write: false,
      external: externals,
      logLevel: 'silent',
      treeShaking: true,
      splitting: true,
      outdir: '/tmp/hx-bulk-measure',
    });

    const minResult = await esbuild.build({
      entryPoints,
      bundle: true,
      format: 'esm',
      minify: true,
      write: false,
      external: externals,
      logLevel: 'silent',
      treeShaking: true,
      splitting: true,
      outdir: '/tmp/hx-bulk-measure',
    });

    const totalRaw = rawResult.outputFiles.reduce((sum, f) => sum + f.text.length, 0);
    const allMinified = minResult.outputFiles.map((f) => f.text).join('');
    const totalMinified = minResult.outputFiles.reduce((sum, f) => sum + f.text.length, 0);
    const gzipped = gzipSync(Buffer.from(allMinified), { level: 9 });

    return {
      componentCount: entryPoints.length,
      totalSize: totalRaw,
      minifiedSize: totalMinified,
      gzipSize: gzipped.length,
    };
  } catch (err) {
    return {
      componentCount: entryPoints.length,
      totalSize: 0,
      minifiedSize: 0,
      gzipSize: 0,
      error: err.message || String(err),
    };
  }
}

/**
 * Measure Lit core overhead by building a minimal Lit component.
 *
 * @returns {Promise<{litCoreSize: number, litCoreGzip: number}>}
 */
export async function measureLitCore() {
  const litEntryContent = `
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
@customElement('lit-baseline')
class LitBaseline extends LitElement {
  static styles = css\`:host { display: block; }\`;
  render() { return html\`<slot></slot>\`; }
}
`;

  try {
    // Write to a temp file for esbuild
    const { writeFileSync, unlinkSync } = await import('fs');
    const tmpFile = '/tmp/hx-lit-baseline.ts';
    writeFileSync(tmpFile, litEntryContent);

    const result = await esbuild.build({
      entryPoints: [tmpFile],
      bundle: true,
      format: 'esm',
      minify: true,
      write: false,
      external: [],
      logLevel: 'silent',
      treeShaking: true,
    });

    unlinkSync(tmpFile);

    const code = result.outputFiles[0].text;
    const gzipped = gzipSync(Buffer.from(code), { level: 9 });

    return {
      litCoreSize: code.length,
      litCoreGzip: gzipped.length,
    };
  } catch (err) {
    return {
      litCoreSize: 0,
      litCoreGzip: 0,
      error: err.message || String(err),
    };
  }
}

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const componentName = process.argv[2];
  const includeLit = process.argv.includes('--include-lit');

  if (!componentName) {
    console.error('Usage: node scripts/measure-component-size.js <component-name> [--include-lit]');
    process.exit(1);
  }

  const result = await measureComponent(componentName, { includeLit });
  console.log(JSON.stringify(result, null, 2));
}
