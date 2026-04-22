#!/usr/bin/env node

/**
 * CDN Bundle Size Budget Check — HELiX
 *
 * Closes FS-019: the per-component bundle gate (scripts/check-bundle-size.mjs)
 * does not measure the CDN build artifact. The CDN payload is what Drupal sites
 * and other CDN consumers actually download, so it needs its own CI-enforced
 * ceiling that fails the build on regressions.
 *
 * Reads built artifacts from packages/hx-library/dist/cdn/ (produced by
 * scripts/build-cdn.mjs) and measures the gzipped size of each tracked file.
 *
 * Tracked artifacts (see .cdn-budget.json for current values):
 *   - helix-{version}.min.js        Strategy A full bundle JS
 *   - helix-{version}.min.css       Strategy A full bundle CSS
 *   - helix-core-{version}.min.js   Strategy B shared Lit runtime
 *   - strategyATotal                Aggregate of full JS + full CSS
 *
 * For each artifact we report:
 *   - current gzipped size
 *   - ceiling (hard limit — exit 1 if exceeded)
 *   - warn threshold (printed to stderr but does not fail)
 *   - headroom (bytes + % remaining until ceiling)
 *
 * Usage:
 *   node scripts/check-cdn-size.mjs              # Human-readable table + exit code
 *   node scripts/check-cdn-size.mjs --json       # JSON report to stdout
 *   node scripts/check-cdn-size.mjs --markdown   # Markdown table to stdout
 *
 * Exit codes:
 *   0 — all artifacts within ceiling (warnings are non-fatal)
 *   1 — one or more artifacts exceed ceiling, or dist/cdn missing
 *
 * Run via: pnpm run check:cdn-size (after pnpm --filter @helixui/library build:cdn)
 */

import { gzipSync } from 'node:zlib';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CDN_DIR = resolve(ROOT, 'packages/hx-library/dist/cdn');
const BUDGET_FILE = resolve(ROOT, '.cdn-budget.json');
const PKG_FILE = resolve(ROOT, 'packages/hx-library/package.json');

// ── Load config ──────────────────────────────────────────────────────────────

function loadBudget() {
  if (!existsSync(BUDGET_FILE)) {
    console.error(`Error: budget file not found at ${BUDGET_FILE}`);
    console.error('Create .cdn-budget.json at the repo root with per-artifact ceilings.');
    process.exit(1);
  }
  try {
    return JSON.parse(readFileSync(BUDGET_FILE, 'utf8'));
  } catch (err) {
    console.error(`Error: failed to parse ${BUDGET_FILE}: ${err.message}`);
    process.exit(1);
  }
}

function loadVersion() {
  const pkg = JSON.parse(readFileSync(PKG_FILE, 'utf8'));
  return pkg.version;
}

// ── Measurement ──────────────────────────────────────────────────────────────

function getGzipSize(filePath) {
  const content = readFileSync(filePath);
  return gzipSync(content, { level: 9 }).length;
}

function resolveArtifactPath(template, version) {
  // Budget file templates use {version} placeholder. Resolve to actual filename.
  return template.replace(/\{version\}/g, version);
}

function measureArtifacts(budget, version) {
  if (!existsSync(CDN_DIR)) {
    console.error(`Error: CDN build output not found at ${CDN_DIR}`);
    console.error('Run `pnpm --filter @helixui/library run build:cdn` first.');
    process.exit(1);
  }

  const results = [];

  // Per-file artifacts (fullBundleJs, fullBundleCss, coreBundleJs)
  const fileArtifacts = ['fullBundleJs', 'fullBundleCss', 'coreBundleJs'];

  for (const key of fileArtifacts) {
    const spec = budget.budgets[key];
    if (!spec) continue;
    const filename = resolveArtifactPath(spec.file, version);
    const filepath = join(CDN_DIR, filename);

    if (!existsSync(filepath)) {
      results.push({
        key,
        filename,
        exists: false,
        gzBytes: 0,
        ceiling: spec.ceilingBytes,
        warn: spec.warnBytes,
        description: spec.description,
        error: `Artifact missing at ${filepath}`,
      });
      continue;
    }

    const gzBytes = getGzipSize(filepath);
    results.push({
      key,
      filename,
      exists: true,
      gzBytes,
      ceiling: spec.ceilingBytes,
      warn: spec.warnBytes,
      description: spec.description,
      overBudget: gzBytes > spec.ceilingBytes,
      warning: gzBytes > spec.warnBytes && gzBytes <= spec.ceilingBytes,
    });
  }

  // Aggregate: strategyATotal = fullBundleJs + fullBundleCss
  const aggSpec = budget.budgets.strategyATotal;
  if (aggSpec) {
    const jsResult = results.find((r) => r.key === 'fullBundleJs');
    const cssResult = results.find((r) => r.key === 'fullBundleCss');
    if (jsResult?.exists && cssResult?.exists) {
      const aggBytes = jsResult.gzBytes + cssResult.gzBytes;
      results.push({
        key: 'strategyATotal',
        filename: '(aggregate: full JS + full CSS)',
        exists: true,
        gzBytes: aggBytes,
        ceiling: aggSpec.ceilingBytes,
        warn: aggSpec.warnBytes,
        description: aggSpec.description,
        overBudget: aggBytes > aggSpec.ceilingBytes,
        warning: aggBytes > aggSpec.warnBytes && aggBytes <= aggSpec.ceilingBytes,
      });
    }
  }

  return results;
}

// ── Formatting ───────────────────────────────────────────────────────────────

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatPct(num, denom) {
  return `${((num / denom) * 100).toFixed(1)}%`;
}

function formatResultLine(r) {
  if (!r.exists) {
    return `  ${r.key.padEnd(16)} [missing] — ${r.error}`;
  }
  const headroomBytes = r.ceiling - r.gzBytes;
  const status = r.overBudget ? 'FAIL' : r.warning ? 'WARN' : 'ok';
  return (
    `  ${r.key.padEnd(16)} ${formatKB(r.gzBytes).padStart(9)} gz  ` +
    `(budget ${formatKB(r.ceiling).padStart(9)}, ` +
    `headroom ${formatKB(headroomBytes).padStart(8)} / ${formatPct(headroomBytes, r.ceiling).padStart(6)})  ` +
    `[${status}]`
  );
}

function printTable(results, version) {
  console.log(`\n## CDN Bundle Size Report (v${version})\n`);
  for (const r of results) {
    console.log(formatResultLine(r));
  }
  console.log('');

  const violations = results.filter((r) => r.exists && r.overBudget);
  const warnings = results.filter((r) => r.exists && r.warning);
  const missing = results.filter((r) => !r.exists);

  if (violations.length > 0) {
    console.error('CDN size budget violations:');
    for (const v of violations) {
      const overBy = v.gzBytes - v.ceiling;
      console.error(
        `  - ${v.key} (${v.filename}): ${formatKB(v.gzBytes)} gz exceeds ceiling ${formatKB(v.ceiling)} by ${formatKB(overBy)}`,
      );
    }
    console.error('');
    console.error(
      'Either reduce the artifact size or update .cdn-budget.json with justification (requires code review).',
    );
  }

  if (warnings.length > 0) {
    console.error('CDN size warnings (under ceiling, over warn threshold):');
    for (const w of warnings) {
      console.error(
        `  - ${w.key} (${w.filename}): ${formatKB(w.gzBytes)} gz — warn at ${formatKB(w.warn)}, ceiling ${formatKB(w.ceiling)}`,
      );
    }
  }

  if (missing.length > 0) {
    console.error('Missing artifacts (CDN build incomplete):');
    for (const m of missing) {
      console.error(`  - ${m.key}: expected ${m.filename}`);
    }
  }
}

function printMarkdown(results, version) {
  const lines = [`## CDN Bundle Size Report (v${version})`, ''];
  lines.push('| Artifact | File | Size (gz) | Ceiling | Headroom | Status |');
  lines.push('| :--- | :--- | ---: | ---: | ---: | :---: |');
  for (const r of results) {
    if (!r.exists) {
      lines.push(`| \`${r.key}\` | \`${r.filename}\` | — | ${formatKB(r.ceiling)} | — | missing |`);
      continue;
    }
    const headroom = r.ceiling - r.gzBytes;
    const status = r.overBudget ? 'FAIL' : r.warning ? 'WARN' : 'ok';
    lines.push(
      `| \`${r.key}\` | \`${r.filename}\` | ${formatKB(r.gzBytes)} | ${formatKB(r.ceiling)} | ${formatKB(headroom)} (${formatPct(headroom, r.ceiling)}) | ${status} |`,
    );
  }
  console.log(lines.join('\n'));
}

// ── Main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const isJson = args.includes('--json');
const isMarkdown = args.includes('--markdown');

const budget = loadBudget();
const version = loadVersion();
const results = measureArtifacts(budget, version);

const report = {
  generated: new Date().toISOString(),
  version,
  cdnDir: CDN_DIR,
  results,
  violations: results.filter((r) => r.exists && r.overBudget).length,
  warnings: results.filter((r) => r.exists && r.warning).length,
  missing: results.filter((r) => !r.exists).length,
};

if (isJson) {
  console.log(JSON.stringify(report, null, 2));
} else if (isMarkdown) {
  printMarkdown(results, version);
} else {
  printTable(results, version);
}

const hasFailure = report.violations > 0 || report.missing > 0;
process.exit(hasFailure ? 1 : 0);
