#!/usr/bin/env node

/**
 * Per-Component Bundle Size Budget Check — HELiX
 *
 * Reads built output from packages/hx-library/dist/components/ and measures
 * the gzipped size of each component's index.js entry point.
 *
 * Budget configuration: .bundle-budget.json at repo root
 *   - perComponent: max gzipped bytes per component (default 5120 = 5 KB)
 *   - total: max gzipped bytes across all components (default 51200 = 50 KB)
 *   - overrides: per-component budget exceptions (keyed by component name)
 *
 * Usage:
 *   node scripts/check-bundle-size.mjs              # Human-readable table + exit code
 *   node scripts/check-bundle-size.mjs --markdown   # Markdown table to stdout
 *   node scripts/check-bundle-size.mjs --json       # JSON report to stdout
 *   node scripts/check-bundle-size.mjs --save <path>  # Save JSON report to file
 *
 * Exits with code 1 if any component exceeds its budget or total exceeds limit.
 */

import { gzipSync } from 'zlib';
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST_COMPONENTS = resolve(ROOT, 'packages/hx-library/dist/components');
const BUDGET_FILE = resolve(ROOT, '.bundle-budget.json');

// ── Budget config ────────────────────────────────────────────────────────────

function loadBudget() {
  if (existsSync(BUDGET_FILE)) {
    try {
      return JSON.parse(readFileSync(BUDGET_FILE, 'utf8'));
    } catch {
      console.error(`Warning: failed to parse ${BUDGET_FILE} — using defaults`);
    }
  }
  return { perComponent: 5120, total: 51200, overrides: {} };
}

const budget = loadBudget();
const PER_COMPONENT = budget.perComponent ?? 5120;
const TOTAL_BUDGET = budget.total ?? 51200;
const OVERRIDES = budget.overrides ?? {};

function getComponentBudget(name) {
  return OVERRIDES[name] ?? PER_COMPONENT;
}

// ── Measurement ──────────────────────────────────────────────────────────────

function getGzipSize(filePath) {
  const content = readFileSync(filePath);
  return gzipSync(content, { level: 9 }).length;
}

function measureComponents() {
  if (!existsSync(DIST_COMPONENTS)) {
    console.error(`Error: dist/components not found at ${DIST_COMPONENTS}`);
    console.error('Run `pnpm run build:library` first.');
    process.exit(1);
  }

  const entries = readdirSync(DIST_COMPONENTS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('hx-'))
    .map((d) => d.name)
    .sort();

  const results = [];

  for (const name of entries) {
    const indexPath = join(DIST_COMPONENTS, name, 'index.js');
    if (!existsSync(indexPath)) continue;

    const stat = statSync(indexPath);
    const rawBytes = stat.size;
    const gzBytes = getGzipSize(indexPath);
    const componentBudget = getComponentBudget(name);
    const overBudget = gzBytes > componentBudget;

    results.push({
      name,
      rawBytes,
      gzBytes,
      rawKB: +(rawBytes / 1024).toFixed(2),
      gzKB: +(gzBytes / 1024).toFixed(2),
      budget: componentBudget,
      overBudget,
    });
  }

  return results;
}

// ── Report builders ───────────────────────────────────────────────────────────

function buildReport(results) {
  const totalGz = results.reduce((sum, r) => sum + r.gzBytes, 0);
  const totalRaw = results.reduce((sum, r) => sum + r.rawBytes, 0);
  const violations = results.filter((r) => r.overBudget);
  const bundleOverBudget = totalGz > TOTAL_BUDGET;

  return {
    generated: new Date().toISOString(),
    perComponentBudget: PER_COMPONENT,
    totalBudget: TOTAL_BUDGET,
    componentCount: results.length,
    totalRawKB: +(totalRaw / 1024).toFixed(2),
    totalGzKB: +(totalGz / 1024).toFixed(2),
    totalGzBytes: totalGz,
    bundleOverBudget,
    violations: violations.length,
    components: results,
  };
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function printTable(report) {
  const violations = report.components.filter((r) => r.overBudget);

  console.log('\n## Bundle Size Report\n');
  console.log(`| Component | Size (gz) | Budget | Status |`);
  console.log(`| :--- | ---: | ---: | :---: |`);

  for (const r of report.components) {
    const status = r.overBudget ? '❌' : '✅';
    const budgetKB = formatBytes(r.budget);
    console.log(`| \`${r.name}\` | ${formatBytes(r.gzBytes)} | ${budgetKB} | ${status} |`);
  }

  const totalStatus = report.bundleOverBudget ? '❌' : '✅';
  console.log(
    `| **Total** | **${formatBytes(report.totalGzBytes)}** | **${formatBytes(TOTAL_BUDGET)}** | ${totalStatus} |`,
  );
  console.log('');

  if (violations.length > 0) {
    console.error(`\n${violations.length} budget violation(s):`);
    for (const v of violations) {
      console.error(
        `  - ${v.name}: ${formatBytes(v.gzBytes)} gzipped (budget: ${formatBytes(v.budget)})`,
      );
    }
  }

  if (report.bundleOverBudget) {
    console.error(
      `\nTotal bundle exceeds budget: ${formatBytes(report.totalGzBytes)} > ${formatBytes(TOTAL_BUDGET)}`,
    );
  }
}

function printMarkdown(report) {
  const lines = ['## Bundle Size Report', ''];
  lines.push(
    `> **Budget:** ${formatBytes(PER_COMPONENT)}/component · ${formatBytes(TOTAL_BUDGET)} total`,
  );
  lines.push('');
  lines.push('| Component | Size (gz) | Budget | Status |');
  lines.push('| :--- | ---: | ---: | :---: |');

  for (const r of report.components) {
    const status = r.overBudget ? '❌' : '✅';
    lines.push(
      `| \`${r.name}\` | ${formatBytes(r.gzBytes)} | ${formatBytes(r.budget)} | ${status} |`,
    );
  }

  const totalStatus = report.bundleOverBudget ? '❌' : '✅';
  lines.push(
    `| **Total** | **${formatBytes(report.totalGzBytes)}** | **${formatBytes(TOTAL_BUDGET)}** | ${totalStatus} |`,
  );

  console.log(lines.join('\n'));
}

// ── Main ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const isMarkdown = args.includes('--markdown');
const isJSON = args.includes('--json');

const saveIdx = args.indexOf('--save');
const savePath = saveIdx !== -1 ? args[saveIdx + 1] : null;

const results = measureComponents();
const report = buildReport(results);

if (savePath) {
  mkdirSync(resolve(savePath, '..'), { recursive: true });
  writeFileSync(savePath, JSON.stringify(report, null, 2));
}

if (isJSON) {
  console.log(JSON.stringify(report, null, 2));
} else if (isMarkdown) {
  printMarkdown(report);
} else {
  printTable(report);
}

const hasViolations = report.violations > 0 || report.bundleOverBudget;

if (hasViolations) {
  process.exit(1);
}
