#!/usr/bin/env node

/**
 * Bundle Size Report — HELiX
 *
 * Measures per-component tree-shaken bundle sizes by building each component
 * independently with esbuild (externalizing Lit and other dependencies).
 *
 * Usage:
 *   node scripts/bundle-size-report.js              # Human-readable table
 *   node scripts/bundle-size-report.js --json        # JSON output
 *   node scripts/bundle-size-report.js --ci          # CI mode (exits non-zero on budget violations)
 *   node scripts/bundle-size-report.js --markdown    # Markdown table for docs
 */

import { build } from 'esbuild';
import { readdirSync, existsSync, mkdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const COMPONENTS_DIR = resolve(ROOT, 'packages/hx-library/src/components');
const TMP_DIR = resolve(ROOT, '.cache/bundle-size');

// Budgets (bytes, gzipped)
const COMPONENT_BUDGET = 5 * 1024; // 5 KB per component (standard)
const BUNDLE_BUDGET = 50 * 1024; // 50 KB full library

/**
 * Complex interactive components have a higher budget of 8 KB due to inherent
 * JS complexity that cannot be reduced without removing documented features:
 *   - hx-color-picker: full color math library (HSV/RGB/HSL conversions), pointer-drag,
 *     4 output formats. JS-only baseline: ~4057gz.
 *   - hx-combobox: full ARIA combobox, multiple selection with chips, keyboard nav,
 *     filtering with debounce, ElementInternals form association. JS-only: ~4083gz.
 *   - hx-date-picker: calendar grid rendering, full keyboard nav, focus trap, date
 *     utilities, ElementInternals form association. JS-only: ~4324gz.
 */
const COMPLEX_BUDGET = 8 * 1024;
const COMPLEX_COMPONENTS = new Set(['hx-color-picker', 'hx-combobox', 'hx-date-picker']);

function getComponentBudget(name) {
  return COMPLEX_COMPONENTS.has(name) ? COMPLEX_BUDGET : COMPONENT_BUDGET;
}

const args = process.argv.slice(2);
const isCI = args.includes('--ci');
const isJSON = args.includes('--json');
const isMarkdown = args.includes('--markdown');

async function measureComponent(name) {
  const entryPoint = resolve(COMPONENTS_DIR, name, 'index.ts');
  if (!existsSync(entryPoint)) return null;

  const outfile = resolve(TMP_DIR, `${name}.js`);

  try {
    const result = await build({
      entryPoints: [entryPoint],
      bundle: true,
      format: 'esm',
      minify: true,
      treeShaking: true,
      outfile,
      write: true,
      external: [
        'lit',
        'lit/*',
        '@lit/*',
        '@helixui/tokens',
        '@helixui/tokens/*',
        '@floating-ui/*',
      ],
      logLevel: 'silent',
      metafile: true,
    });

    const outputs = result.metafile?.outputs || {};
    const outKey = Object.keys(outputs).find((k) => k.endsWith(`${name}.js`));
    const rawBytes = outKey ? outputs[outKey].bytes : 0;

    // Read the output and gzip it
    const { readFileSync } = await import('fs');
    const content = readFileSync(outfile);
    const gzBytes = gzipSync(content).length;

    return {
      name,
      rawBytes,
      gzBytes,
      rawKB: +(rawBytes / 1024).toFixed(2),
      gzKB: +(gzBytes / 1024).toFixed(2),
      overBudget: gzBytes > getComponentBudget(name),
      budget: getComponentBudget(name),
    };
  } catch {
    return {
      name,
      rawBytes: 0,
      gzBytes: 0,
      rawKB: 0,
      gzKB: 0,
      overBudget: false,
      budget: COMPONENT_BUDGET,
      error: true,
    };
  }
}

async function main() {
  // Discover components
  const components = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('hx-'))
    .map((d) => d.name)
    .sort();

  // Setup temp directory
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });

  // Measure each component
  const results = [];
  for (const name of components) {
    const result = await measureComponent(name);
    if (result) results.push(result);
  }

  // Cleanup
  rmSync(TMP_DIR, { recursive: true });

  // Calculate totals
  const totalRaw = results.reduce((sum, r) => sum + r.rawBytes, 0);
  const totalGz = results.reduce((sum, r) => sum + r.gzBytes, 0);
  const violations = results.filter((r) => r.overBudget);

  if (isJSON) {
    console.log(
      JSON.stringify(
        {
          generated: new Date().toISOString(),
          componentBudget: `${COMPONENT_BUDGET / 1024}KB`,
          bundleBudget: `${BUNDLE_BUDGET / 1024}KB`,
          componentCount: results.length,
          totalRawKB: +(totalRaw / 1024).toFixed(2),
          totalGzKB: +(totalGz / 1024).toFixed(2),
          violations: violations.length,
          components: results,
        },
        null,
        2,
      ),
    );
  } else if (isMarkdown) {
    console.log('| Component | Raw | Gzipped | Budget |');
    console.log('| :--- | ---: | ---: | :---: |');
    for (const r of results) {
      const badge = r.overBudget ? 'Over' : 'Pass';
      console.log(`| \`${r.name}\` | ${r.rawKB} KB | ${r.gzKB} KB | ${badge} |`);
    }
    console.log('| | | | |');
    console.log(
      `| **Total (${results.length} components)** | **${+(totalRaw / 1024).toFixed(2)} KB** | **${+(totalGz / 1024).toFixed(2)} KB** | ${totalGz > BUNDLE_BUDGET ? 'Over' : '**Pass**'} |`,
    );
  } else {
    // Human-readable table
    console.log('=== HELiX Bundle Size Report ===\n');
    console.log(`${'Component'.padEnd(28)} ${'Raw'.padStart(10)} ${'Gzip'.padStart(10)}  Budget`);
    console.log('-'.repeat(60));

    for (const r of results) {
      const flag = r.overBudget ? 'FAIL' : 'PASS';
      console.log(
        `${r.name.padEnd(28)} ${(r.rawKB + ' KB').padStart(10)} ${(r.gzKB + ' KB').padStart(10)}  ${flag}`,
      );
    }

    console.log('-'.repeat(60));
    console.log(
      `${'Total (' + results.length + ' components)'.padEnd(28)} ${(+(totalRaw / 1024).toFixed(2) + ' KB').padStart(10)} ${(+(totalGz / 1024).toFixed(2) + ' KB').padStart(10)}  ${totalGz > BUNDLE_BUDGET ? 'FAIL' : 'PASS'}`,
    );

    if (violations.length > 0) {
      console.log(`\n${violations.length} component(s) over budget:`);
      for (const v of violations) {
        console.log(
          `  - ${v.name}: ${v.gzKB} KB gzipped (budget: ${(v.budget / 1024).toFixed(0)} KB)`,
        );
      }
    }

    console.log(
      `\nBudgets: ${COMPONENT_BUDGET / 1024} KB/component (standard), ${COMPLEX_BUDGET / 1024} KB/component (complex: ${[...COMPLEX_COMPONENTS].join(', ')}), ${BUNDLE_BUDGET / 1024} KB total (gzipped)`,
    );
  }

  if (isCI && violations.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Bundle size report failed:', err);
  process.exit(1);
});
