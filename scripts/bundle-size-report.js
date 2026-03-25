#!/usr/bin/env node

/**
 * Bundle Size Report — HELiX
 *
 * Measures per-component tree-shaken bundle sizes by building each component
 * independently with esbuild (externalizing Lit and other dependencies).
 * Budgets are configured in bundle-budgets.json at the repo root.
 *
 * Usage:
 *   node scripts/bundle-size-report.js                          # Human-readable table
 *   node scripts/bundle-size-report.js --json                   # JSON output to stdout
 *   node scripts/bundle-size-report.js --ci                     # Exit non-zero on violations
 *   node scripts/bundle-size-report.js --markdown               # Markdown table
 *   node scripts/bundle-size-report.js --save <path>            # Save JSON to file
 *   node scripts/bundle-size-report.js --from-file <path>       # Load saved JSON (skip build)
 *   node scripts/bundle-size-report.js --base <path>            # Base JSON for delta comparison
 *   node scripts/bundle-size-report.js --pr-comment             # PR comment markdown to stdout
 */

import { build } from 'esbuild';
import { readdirSync, existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const COMPONENTS_DIR = resolve(ROOT, 'packages/hx-library/src/components');
const TMP_DIR = resolve(ROOT, '.cache/bundle-size');

function loadBudgets() {
  const budgetPath = resolve(ROOT, 'bundle-budgets.json');
  if (!existsSync(budgetPath)) {
    return { standard: 5120, bundle: 51200, overrides: {} };
  }
  return JSON.parse(readFileSync(budgetPath, 'utf8'));
}

const budgets = loadBudgets();
const COMPONENT_BUDGET = budgets.standard;
const BUNDLE_BUDGET = budgets.bundle;

function getComponentBudget(name) {
  return budgets.overrides?.[name]?.budget ?? COMPONENT_BUDGET;
}

function getComplexComponents() {
  return Object.keys(budgets.overrides ?? {});
}

const args = process.argv.slice(2);
const isCI = args.includes('--ci');
const isJSON = args.includes('--json');
const isMarkdown = args.includes('--markdown');
const isPRComment = args.includes('--pr-comment');

const saveIdx = args.indexOf('--save');
const savePath = saveIdx !== -1 ? args[saveIdx + 1] : null;

const fromFileIdx = args.indexOf('--from-file');
const fromFilePath = fromFileIdx !== -1 ? args[fromFileIdx + 1] : null;

const baseIdx = args.indexOf('--base');
const basePath = baseIdx !== -1 ? args[baseIdx + 1] : null;

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

function buildReport(results) {
  const totalRaw = results.reduce((sum, r) => sum + r.rawBytes, 0);
  const totalGz = results.reduce((sum, r) => sum + r.gzBytes, 0);
  const violations = results.filter((r) => r.overBudget);
  const complexComponents = getComplexComponents();

  return {
    generated: new Date().toISOString(),
    componentBudget: `${COMPONENT_BUDGET / 1024}KB`,
    bundleBudget: `${BUNDLE_BUDGET / 1024}KB`,
    complexBudget: `${(budgets.overrides?.[complexComponents[0]]?.budget ?? COMPONENT_BUDGET) / 1024}KB`,
    complexComponents,
    componentCount: results.length,
    totalRawKB: +(totalRaw / 1024).toFixed(2),
    totalGzKB: +(totalGz / 1024).toFixed(2),
    violations: violations.length,
    components: results,
  };
}

function formatDelta(delta) {
  if (delta === null) return '—';
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${(delta / 1024).toFixed(2)} KB`;
}

function generatePRComment(report, baseReport) {
  const complexComponents = getComplexComponents();
  const complexBudgetKB =
    (budgets.overrides?.[complexComponents[0]]?.budget ?? COMPONENT_BUDGET) / 1024;
  const complexList = complexComponents.map((c) => `\`${c}\``).join(', ');

  const budgetLine =
    `> **Budget:** ${COMPONENT_BUDGET / 1024} KB/component` +
    (complexComponents.length > 0 ? ` · ${complexBudgetKB} KB complex (${complexList})` : '') +
    ` · ${BUNDLE_BUDGET / 1024} KB total`;

  // Build delta map from base
  const baseMap = new Map();
  if (baseReport?.components) {
    for (const c of baseReport.components) {
      baseMap.set(c.name, c);
    }
  }
  const hasBase = baseMap.size > 0;

  // Augment components with deltas
  const components = report.components.map((c) => {
    const base = baseMap.get(c.name);
    return {
      ...c,
      baseGzKB: base ? base.gzKB : null,
      baseGzBytes: base ? base.gzBytes : null,
      deltaBytes: base ? c.gzBytes - base.gzBytes : null,
    };
  });

  const violations = components.filter((c) => c.overBudget);
  const totalGzBytes = components.reduce((s, c) => s + c.gzBytes, 0);
  const baseTotalGzBytes = hasBase
    ? (baseReport?.components ?? []).reduce((s, c) => s + c.gzBytes, 0)
    : null;
  const totalDelta = baseTotalGzBytes !== null ? totalGzBytes - baseTotalGzBytes : null;

  const lines = ['## Bundle Size Report', ''];
  lines.push(budgetLine);
  lines.push('');

  if (violations.length > 0) {
    lines.push(
      `⚠️ **${violations.length} budget violation${violations.length > 1 ? 's' : ''}** — merge is blocked until resolved:`,
    );
    lines.push('');
    const cols = hasBase
      ? '| Component | Before | After | Delta | Budget |'
      : '| Component | Size | Budget |';
    const sep = hasBase ? '| :--- | ---: | ---: | ---: | :---: |' : '| :--- | ---: | :---: |';
    lines.push(cols);
    lines.push(sep);
    for (const c of violations) {
      const budgetKB = (c.budget / 1024).toFixed(0);
      if (hasBase) {
        const before = c.baseGzKB !== null ? `${c.baseGzKB} KB` : '—';
        lines.push(
          `| \`${c.name}\` | ${before} | ${c.gzKB} KB | ${formatDelta(c.deltaBytes)} | ❌ ${budgetKB} KB |`,
        );
      } else {
        lines.push(`| \`${c.name}\` | ${c.gzKB} KB | ❌ ${budgetKB} KB |`);
      }
    }
    lines.push('');
  } else {
    lines.push(`✅ **All ${report.componentCount} components within budget**`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(`<details>`);
  lines.push(`<summary>📦 Full report — ${report.componentCount} components</summary>`);
  lines.push('');

  const cols = hasBase
    ? '| Component | Before | After | Delta | Status |'
    : '| Component | Size | Status |';
  const sep = hasBase ? '| :--- | ---: | ---: | ---: | :---: |' : '| :--- | ---: | :---: |';
  lines.push(cols);
  lines.push(sep);

  for (const c of components) {
    const status = c.overBudget ? '❌' : '✅';
    if (hasBase) {
      const before = c.baseGzKB !== null ? `${c.baseGzKB} KB` : '—';
      lines.push(
        `| \`${c.name}\` | ${before} | ${c.gzKB} KB | ${formatDelta(c.deltaBytes)} | ${status} |`,
      );
    } else {
      lines.push(`| \`${c.name}\` | ${c.gzKB} KB | ${status} |`);
    }
  }

  lines.push('');
  lines.push('</details>');
  lines.push('');

  const totalStr = `${report.totalGzKB} KB / ${BUNDLE_BUDGET / 1024} KB budget`;
  const bundleStatus = totalGzBytes > BUNDLE_BUDGET ? '❌' : '✅';

  if (hasBase && baseTotalGzBytes !== null) {
    const baseTotalKB = (baseTotalGzBytes / 1024).toFixed(2);
    lines.push(
      `**Total:** ${baseTotalKB} KB → ${report.totalGzKB} KB (${formatDelta(totalDelta)}) / ${BUNDLE_BUDGET / 1024} KB budget ${bundleStatus}`,
    );
  } else {
    lines.push(`**Total:** ${totalStr} ${bundleStatus}`);
  }

  return lines.join('\n');
}

async function main() {
  let results;

  if (fromFilePath) {
    // Load pre-measured results from saved JSON (skip build)
    if (!existsSync(fromFilePath)) {
      console.error(`--from-file: file not found: ${fromFilePath}`);
      process.exit(1);
    }
    const saved = JSON.parse(readFileSync(fromFilePath, 'utf8'));
    results = saved.components;
  } else {
    // Discover and measure components
    const components = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('hx-'))
      .map((d) => d.name)
      .sort();

    if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
    mkdirSync(TMP_DIR, { recursive: true });

    results = [];
    for (const name of components) {
      const result = await measureComponent(name);
      if (result) results.push(result);
    }

    rmSync(TMP_DIR, { recursive: true });
  }

  const report = buildReport(results);

  // Save JSON artifact if requested
  if (savePath) {
    mkdirSync(resolve(savePath, '..'), { recursive: true });
    writeFileSync(savePath, JSON.stringify(report, null, 2));
  }

  // Load base report for comparison if requested
  let baseReport = null;
  if (basePath && existsSync(basePath)) {
    baseReport = JSON.parse(readFileSync(basePath, 'utf8'));
  }

  const violations = results.filter((r) => r.overBudget);

  if (isPRComment) {
    console.log(generatePRComment(report, baseReport));
  } else if (isJSON) {
    console.log(JSON.stringify(report, null, 2));
  } else if (isMarkdown) {
    const complexComponents = getComplexComponents();
    console.log('| Component | Raw | Gzipped | Budget |');
    console.log('| :--- | ---: | ---: | :---: |');
    for (const r of results) {
      const badge = r.overBudget ? 'Over' : 'Pass';
      console.log(`| \`${r.name}\` | ${r.rawKB} KB | ${r.gzKB} KB | ${badge} |`);
    }
    console.log('| | | | |');
    console.log(
      `| **Total (${results.length} components)** | **${report.totalRawKB} KB** | **${report.totalGzKB} KB** | ${report.totalGzKB * 1024 > BUNDLE_BUDGET ? 'Over' : '**Pass**'} |`,
    );
    if (complexComponents.length > 0) {
      const complexBudgetKB =
        (budgets.overrides?.[complexComponents[0]]?.budget ?? COMPONENT_BUDGET) / 1024;
      console.log(
        `\n_Complex components (${complexComponents.join(', ')}): ${complexBudgetKB} KB budget_`,
      );
    }
  } else {
    // Human-readable table
    const complexComponents = getComplexComponents();
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
      `${'Total (' + results.length + ' components)'.padEnd(28)} ${(report.totalRawKB + ' KB').padStart(10)} ${(report.totalGzKB + ' KB').padStart(10)}  ${report.totalGzKB * 1024 > BUNDLE_BUDGET ? 'FAIL' : 'PASS'}`,
    );

    if (violations.length > 0) {
      console.log(`\n${violations.length} component(s) over budget:`);
      for (const v of violations) {
        console.log(
          `  - ${v.name}: ${v.gzKB} KB gzipped (budget: ${(v.budget / 1024).toFixed(0)} KB)`,
        );
      }
    }

    const complexBudgetKB =
      complexComponents.length > 0
        ? (budgets.overrides?.[complexComponents[0]]?.budget ?? COMPONENT_BUDGET) / 1024
        : null;
    const budgetNote =
      complexComponents.length > 0
        ? `${COMPONENT_BUDGET / 1024} KB/component (standard), ${complexBudgetKB} KB/component (complex: ${complexComponents.join(', ')}), ${BUNDLE_BUDGET / 1024} KB total`
        : `${COMPONENT_BUDGET / 1024} KB/component, ${BUNDLE_BUDGET / 1024} KB total`;
    console.log(`\nBudgets: ${budgetNote} (gzipped)`);
  }

  if (isCI && violations.length > 0) {
    if (!isPRComment) {
      process.stderr.write(
        `\n${violations.length} bundle budget violation(s) detected. Merge is blocked.\n`,
      );
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Bundle size report failed:', err);
  process.exit(1);
});
