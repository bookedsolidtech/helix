#!/usr/bin/env node

/**
 * analyze-bundle-tree.js — Dependency Tree Analysis Utility
 *
 * Analyzes the import dependency graph for HELiX components using esbuild
 * metafile output. Identifies:
 * - Shared dependencies (deduplication candidates)
 * - Unexpected transitive imports
 * - sideEffects field accuracy in package.json files
 * - Token layer overhead
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, dirname, relative } from 'path';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

const esbuild = await import('esbuild');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const COMPONENTS_DIR = resolve(ROOT, 'packages/hx-library/src/components');
const TOKENS_SRC = resolve(ROOT, 'packages/hx-tokens/src');

/**
 * Analyze the import dependencies of a component using esbuild metafile.
 *
 * @param {string} componentName
 * @returns {Promise<{name: string, dependencies: string[], externalImports: string[]}>}
 */
export async function analyzeComponentDependencies(componentName) {
  const entryPoint = resolve(COMPONENTS_DIR, componentName, 'index.ts');
  if (!existsSync(entryPoint)) {
    return { name: componentName, dependencies: [], externalImports: [] };
  }

  try {
    const result = await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      format: 'esm',
      minify: false,
      write: false,
      external: [],
      logLevel: 'silent',
      treeShaking: true,
      metafile: true,
    });

    const inputs = result.metafile?.inputs || {};
    const dependencies = [];
    const externalImports = [];

    for (const inputData of Object.values(inputs)) {
      // Collect imports from this input
      for (const imp of inputData.imports || []) {
        if (imp.external) {
          if (!externalImports.includes(imp.path)) {
            externalImports.push(imp.path);
          }
        } else {
          const relPath = relative(ROOT, resolve(imp.path));
          if (!dependencies.includes(relPath) && !relPath.startsWith('..')) {
            dependencies.push(relPath);
          }
        }
      }
    }

    return {
      name: componentName,
      dependencies: dependencies.filter(
        (d) => !d.includes(`/hx-${componentName.replace('hx-', '')}/`),
      ),
      externalImports,
    };
  } catch {
    return { name: componentName, dependencies: [], externalImports: [] };
  }
}

/**
 * Validate sideEffects field in package.json files for the library.
 *
 * @returns {{validComponents: string[], violations: string[], recommendation: string}}
 */
export function validateSideEffects() {
  const validComponents = [];
  const violations = [];

  // Check root library package.json
  const libraryPkg = JSON.parse(
    readFileSync(resolve(ROOT, 'packages/hx-library/package.json'), 'utf-8'),
  );
  const tokensPkg = JSON.parse(
    readFileSync(resolve(ROOT, 'packages/hx-tokens/package.json'), 'utf-8'),
  );

  // Library has sideEffects: ["**/*.css"] — correct for CSS files only
  const libSideEffects = libraryPkg.sideEffects;
  if (Array.isArray(libSideEffects) && libSideEffects.includes('**/*.css')) {
    validComponents.push('@helixui/library (sideEffects: ["**/*.css"])');
  } else if (libSideEffects === false) {
    validComponents.push('@helixui/library (sideEffects: false)');
  } else {
    violations.push(
      `@helixui/library: sideEffects=${JSON.stringify(libSideEffects)} — should be false or ["**/*.css"]`,
    );
  }

  // Tokens package
  const tokensSideEffects = tokensPkg.sideEffects;
  if (tokensSideEffects === false) {
    validComponents.push('@helixui/tokens (sideEffects: false)');
  } else if (tokensSideEffects === undefined) {
    violations.push(
      '@helixui/tokens: sideEffects field missing — bundlers will assume all files have side effects, preventing tree-shaking',
    );
  } else {
    validComponents.push(`@helixui/tokens (sideEffects: ${JSON.stringify(tokensSideEffects)})`);
  }

  // Check individual component directories — they don't have their own package.json
  // but we can validate that index.ts files only export and don't have side effects
  const componentDirs = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('hx-'))
    .map((d) => d.name);

  const unexpectedDependencies = [];
  for (const compName of componentDirs) {
    const indexPath = resolve(COMPONENTS_DIR, compName, 'index.ts');
    if (!existsSync(indexPath)) continue;

    const indexContent = readFileSync(indexPath, 'utf-8');
    // Flag if index.ts imports anything other than re-exports from own component file
    const lines = indexContent
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('//') && !l.startsWith('*'));
    const hasNonExportStatements = lines.some(
      (l) => !l.startsWith('export') && !l.startsWith('import') && l.trim().length > 0,
    );

    if (hasNonExportStatements) {
      unexpectedDependencies.push(`${compName}/index.ts: contains non-import/export statements`);
    }
  }

  return {
    validComponents,
    violations,
    unexpectedDependencies,
    recommendation:
      violations.length > 0
        ? 'Add sideEffects: false (or ["**/*.css"]) to all package.json files to enable full tree-shaking by bundlers'
        : 'sideEffects configuration is correct. Bundlers can tree-shake unused components.',
  };
}

/**
 * Measure the standalone design token layer size.
 *
 * @returns {Promise<TokenLayerMeasurement>}
 */
export async function measureTokenLayer() {
  const tokenEntries = [
    resolve(TOKENS_SRC, 'index.ts'),
    resolve(TOKENS_SRC, 'lit.ts'),
    resolve(TOKENS_SRC, 'css.ts'),
  ].filter((f) => existsSync(f));

  if (tokenEntries.length === 0) {
    return {
      standaloneSize: 0,
      gzipSize: 0,
      componentIntegrationCost: 0,
      integrationIsMandatory: true,
      notes: 'Token source files not found',
    };
  }

  try {
    // Measure token layer with Lit externalized
    const result = await esbuild.build({
      entryPoints: [resolve(TOKENS_SRC, 'lit.ts')],
      bundle: true,
      format: 'esm',
      minify: true,
      write: false,
      external: ['lit', 'lit/*', '@lit/*'],
      logLevel: 'silent',
      treeShaking: true,
    });

    const litExternalCode = result.outputFiles[0].text;
    const litExternalGz = gzipSync(Buffer.from(litExternalCode), {
      level: 9,
    });

    // Measure token layer with Lit bundled to get true integration cost
    const resultWithLit = await esbuild.build({
      entryPoints: [resolve(TOKENS_SRC, 'lit.ts')],
      bundle: true,
      format: 'esm',
      minify: true,
      write: false,
      external: [],
      logLevel: 'silent',
      treeShaking: true,
    });

    const withLitCode = resultWithLit.outputFiles[0].text;
    const withLitGz = gzipSync(Buffer.from(withLitCode), { level: 9 });

    // The integration cost is how much the tokens add beyond Lit itself
    // (approximate — Lit deduplicates in real bundling)
    const componentIntegrationCost = litExternalGz.length;

    return {
      standaloneSize: litExternalCode.length,
      gzipSize: litExternalGz.length,
      withLitBundledSize: withLitCode.length,
      withLitBundledGzip: withLitGz.length,
      componentIntegrationCost,
      integrationIsMandatory: true,
      notes:
        'tokenStyles (lit.ts) is imported by every component via @helixui/tokens/lit. ' +
        'This overhead is shared and deduplicated at bundle level. ' +
        'standaloneSize excludes Lit core; withLitBundledSize includes it.',
    };
  } catch (err) {
    return {
      standaloneSize: 0,
      gzipSize: 0,
      componentIntegrationCost: 0,
      integrationIsMandatory: true,
      notes: `Measurement error: ${err.message || String(err)}`,
    };
  }
}

/**
 * Analyze shared dependencies across multiple components.
 *
 * @param {string[]} componentNames
 * @returns {Promise<DeduplicationAnalysis>}
 */
export async function analyzeDeduplication(componentNames) {
  const entryPoints = componentNames
    .map((name) => resolve(COMPONENTS_DIR, name, 'index.ts'))
    .filter((ep) => existsSync(ep));

  try {
    // Build with splitting to see what chunks are shared
    const result = await esbuild.build({
      entryPoints,
      bundle: true,
      format: 'esm',
      minify: true,
      write: false,
      external: ['lit', 'lit/*', '@lit/*', '@floating-ui/*'],
      logLevel: 'silent',
      treeShaking: true,
      splitting: true,
      outdir: '/tmp/hx-dedup-analysis',
      metafile: true,
    });

    const sharedUtilitiesSize = result.outputFiles
      .filter((f) => !entryPoints.some((ep) => f.path && ep.includes(f.path)))
      .reduce((sum, f) => sum + f.text.length, 0);

    const totalOutputSize = result.outputFiles.reduce((sum, f) => sum + f.text.length, 0);

    const allMinified = result.outputFiles.map((f) => f.text).join('');
    const totalGz = gzipSync(Buffer.from(allMinified), { level: 9 });

    return {
      sharedChunkCount: result.outputFiles.length - entryPoints.length,
      sharedUtilitiesSize,
      totalOutputSize,
      totalGzipSize: totalGz.length,
    };
  } catch (err) {
    return {
      sharedChunkCount: 0,
      sharedUtilitiesSize: 0,
      totalOutputSize: 0,
      totalGzipSize: 0,
      error: err.message || String(err),
    };
  }
}

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] || 'sideEffects';

  if (command === 'sideEffects') {
    const result = validateSideEffects();
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'tokens') {
    const result = await measureTokenLayer();
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'dedup') {
    const components = process.argv.slice(3);
    if (components.length === 0) {
      console.error('Usage: analyze-bundle-tree.js dedup <comp1> <comp2> ...');
      process.exit(1);
    }
    const result = await analyzeDeduplication(components);
    console.log(JSON.stringify(result, null, 2));
  } else {
    const result = await analyzeComponentDependencies(command);
    console.log(JSON.stringify(result, null, 2));
  }
}
